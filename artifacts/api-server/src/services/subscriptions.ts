import {
  db,
  doctorSubscriptionsTable,
  usersTable,
  type DoctorSubscription,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  createAsaasSubscription,
  deleteAsaasSubscription,
  getOrCreateAsaasCustomer,
} from "../lib/asaas";

export const DOCTOR_SUBSCRIPTION_VALUE = 129.9;

function formatDate(value: string | Date | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

export function formatSubscription(subscription: DoctorSubscription | null) {
  if (!subscription) return null;
  return {
    id: subscription.id,
    value: subscription.value,
    cycle: subscription.cycle,
    status: subscription.status,
    nextDueDate: formatDate(subscription.nextDueDate),
    invoiceUrl: subscription.invoiceUrl,
    lastPaymentStatus: subscription.lastPaymentStatus,
    lastPaymentAt: subscription.lastPaymentAt?.toISOString() ?? null,
  };
}

export async function getDoctorSubscription(doctorId: number) {
  const [subscription] = await db
    .select()
    .from(doctorSubscriptionsTable)
    .where(eq(doctorSubscriptionsTable.doctorId, doctorId))
    .limit(1);
  return subscription ?? null;
}

export async function createDoctorSubscription(doctorId: number) {
  const existing = await getDoctorSubscription(doctorId);
  if (existing) return { subscription: existing, created: false };

  const [doctor] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, doctorId))
    .limit(1);
  if (!doctor || doctor.type !== "doctor") {
    throw new Error("Apenas médicos podem assinar");
  }

  const customerId = await getOrCreateAsaasCustomer(doctor);
  if (!doctor.asaasCustomerId) {
    await db
      .update(usersTable)
      .set({ asaasCustomerId: customerId, updatedAt: new Date() })
      .where(eq(usersTable.id, doctorId));
  }

  const asaasSubscription = await createAsaasSubscription({
    customerId,
    value: DOCTOR_SUBSCRIPTION_VALUE,
    description: "Assinatura mensal do Planton",
    externalReference: `planton:doctor-subscription:${doctorId}`,
  });

  const [subscription] = await db
    .insert(doctorSubscriptionsTable)
    .values({
      doctorId,
      asaasSubscriptionId: asaasSubscription.id,
      asaasCustomerId: customerId,
      value: DOCTOR_SUBSCRIPTION_VALUE,
      cycle: "MONTHLY",
      status: "PENDENTE",
      nextDueDate: asaasSubscription.nextDueDate ?? null,
      invoiceUrl: asaasSubscription.invoiceUrl ?? null,
    })
    .returning();

  return { subscription, created: true };
}

export async function cancelDoctorSubscription(doctorId: number) {
  const existing = await getDoctorSubscription(doctorId);
  if (!existing) return null;
  await deleteAsaasSubscription(existing.asaasSubscriptionId);
  const [subscription] = await db
    .update(doctorSubscriptionsTable)
    .set({
      status: "CANCELADA",
      canceledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(doctorSubscriptionsTable.id, existing.id))
    .returning();
  return subscription;
}

const PAID_PAYMENT_STATUSES = new Set(["RECEIVED", "CONFIRMED"]);
const FAILED_PAYMENT_STATUSES = new Set([
  "OVERDUE",
  "REFUNDED",
  "DELETED",
  "DUNNING_REQUESTED",
]);

export async function updateSubscriptionFromPayment(input: {
  subscriptionId: string;
  paymentId: string;
  paymentStatus: string;
  paidAt?: string | null;
  invoiceUrl?: string | null;
}) {
  const status = PAID_PAYMENT_STATUSES.has(input.paymentStatus)
    ? "ATIVA"
    : FAILED_PAYMENT_STATUSES.has(input.paymentStatus)
      ? "INADIMPLENTE"
      : "PENDENTE";
  const [subscription] = await db
    .update(doctorSubscriptionsTable)
    .set({
      status,
      lastPaymentId: input.paymentId,
      lastPaymentStatus: input.paymentStatus,
      ...(input.invoiceUrl !== undefined
        ? { invoiceUrl: input.invoiceUrl }
        : {}),
      ...(status === "ATIVA"
        ? {
            lastPaymentAt: input.paidAt
              ? new Date(input.paidAt)
              : new Date(),
          }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(doctorSubscriptionsTable.asaasSubscriptionId, input.subscriptionId))
    .returning();
  return subscription ?? null;
}

export async function updateSubscriptionStatus(input: {
  subscriptionId: string;
  status: string;
  nextDueDate?: string | null;
}) {
  const status =
    input.status === "ACTIVE"
      ? "ATIVA"
      : input.status === "INACTIVE" || input.status === "DELETED"
        ? "CANCELADA"
        : "PENDENTE";
  const [subscription] = await db
    .update(doctorSubscriptionsTable)
    .set({
      status,
      ...(input.nextDueDate !== undefined
        ? { nextDueDate: input.nextDueDate }
        : {}),
      ...(status === "CANCELADA" ? { canceledAt: new Date() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(doctorSubscriptionsTable.asaasSubscriptionId, input.subscriptionId))
    .returning();
  return subscription ?? null;
}