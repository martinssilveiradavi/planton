import {
  applicationsTable,
  db,
  paymentsTable,
  shiftsTable,
  usersTable,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  createAsaasPayment,
  getOrCreateAsaasCustomer,
} from "../lib/asaas";

export function formatPayment(payment: typeof paymentsTable.$inferSelect | null) {
  if (!payment) return null;
  return {
    id: payment.id,
    status: payment.status,
    asaasStatus: payment.asaasStatus,
    invoiceUrl: payment.invoiceUrl,
    grossAmount: payment.grossAmount,
    platformFeePercent: payment.platformFeePercent,
    platformFeeAmount: payment.platformFeeAmount,
    doctorAmount: payment.doctorAmount,
    paidAt: payment.paidAt?.toISOString() ?? null,
    releasedAt: payment.releasedAt?.toISOString() ?? null,
  };
}

function getPlatformFeePercent() {
  const raw = process.env.PLATFORM_FEE_PERCENT?.trim();
  const value = Number(raw);
  if (!raw || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error("PLATFORM_FEE_PERCENT deve ser um número entre 0 e 100");
  }
  return value;
}

export function calculatePaymentAmounts(grossAmount: number, platformFeePercent: number) {
  const normalizedGrossAmount = Math.round(grossAmount * 100) / 100;
  const platformFeeAmount =
    Math.round(normalizedGrossAmount * (platformFeePercent / 100) * 100) / 100;
  return {
    grossAmount: normalizedGrossAmount,
    platformFeeAmount,
    doctorAmount:
      Math.round((normalizedGrossAmount - platformFeeAmount) * 100) / 100,
  };
}

export async function createPaymentForApplication(applicationId: number) {
  return db.transaction(async (tx) => {
    // Serialize payment creation across API instances before checking either
    // the local table or the external provider.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${applicationId})`);

    const hospitalUsers = alias(usersTable, "payment_hospital");
    const doctorUsers = alias(usersTable, "payment_doctor");
    const [row] = await tx
      .select({
        application: applicationsTable,
        shift: shiftsTable,
        hospital: hospitalUsers,
        doctor: {
          id: doctorUsers.id,
          name: doctorUsers.name,
          email: doctorUsers.email,
          asaasWalletId: doctorUsers.asaasWalletId,
        },
      })
      .from(applicationsTable)
      .innerJoin(shiftsTable, eq(applicationsTable.shiftId, shiftsTable.id))
      .innerJoin(hospitalUsers, eq(shiftsTable.hospitalId, hospitalUsers.id))
      .innerJoin(
        doctorUsers,
        eq(applicationsTable.doctorId, doctorUsers.id),
      )
      .where(eq(applicationsTable.id, applicationId))
      .limit(1);

    if (!row) throw new Error("Candidatura não encontrada");

    const [existing] = await tx
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.applicationId, applicationId))
      .limit(1);
    if (existing) return existing;

    const platformFeePercent = getPlatformFeePercent();
    const { grossAmount, platformFeeAmount, doctorAmount } =
      calculatePaymentAmounts(row.shift.remuneration, platformFeePercent);
    const customerId = await getOrCreateAsaasCustomer(row.hospital);
    if (!row.hospital.asaasCustomerId) {
      await tx
        .update(usersTable)
        .set({ asaasCustomerId: customerId, updatedAt: new Date() })
        .where(eq(usersTable.id, row.hospital.id));
    }
    const asaasPayment = await createAsaasPayment({
      customerId,
      value: grossAmount,
      doctorAmount,
      doctorWalletId: row.doctor.asaasWalletId,
      description: `Pagamento do plantão ${row.shift.title}`,
      externalReference: `planton:application:${applicationId}`,
    });

    const [payment] = await tx
      .insert(paymentsTable)
      .values({
        applicationId,
        asaasChargeId: asaasPayment.id,
        asaasStatus: asaasPayment.status,
        invoiceUrl: asaasPayment.invoiceUrl ?? null,
        grossAmount,
        platformFeePercent,
        platformFeeAmount,
        doctorAmount,
      })
      .returning();
    return payment;
  });
}

const PAID_ASAAS_STATUSES = new Set(["RECEIVED", "CONFIRMED"]);
const FAILED_ASAAS_STATUSES = new Set([
  "OVERDUE",
  "REFUNDED",
  "RECEIVED_IN_CASH",
  "REFUND_REQUESTED",
  "CHARGEBACK_REQUESTED",
  "CHARGEBACK_DISPUTE",
  "AWAITING_CHARGEBACK_REVERSAL",
  "DUNNING_REQUESTED",
  "DELETED",
  "REPROVED",
]);

export async function updatePaymentFromAsaasEvent(input: {
  chargeId: string;
  asaasStatus: string;
  invoiceUrl?: string | null;
  paidAt?: string | null;
}) {
  const status = PAID_ASAAS_STATUSES.has(input.asaasStatus)
    ? "PAGO"
    : FAILED_ASAAS_STATUSES.has(input.asaasStatus)
      ? input.asaasStatus === "REFUNDED"
        ? "ESTORNADO"
        : "FALHOU"
      : "AGUARDANDO_PAGAMENTO";

  const [payment] = await db
    .update(paymentsTable)
    .set({
      asaasStatus: input.asaasStatus,
      status,
      ...(input.invoiceUrl !== undefined
        ? { invoiceUrl: input.invoiceUrl }
        : {}),
      ...(status === "PAGO"
        ? { paidAt: input.paidAt ? new Date(input.paidAt) : new Date() }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(paymentsTable.asaasChargeId, input.chargeId))
    .returning();

  return payment ?? null;
}
