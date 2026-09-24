import {
  date,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const doctorSubscriptionsTable = pgTable(
  "doctor_subscriptions",
  {
    id: serial("id").primaryKey(),
    doctorId: integer("doctor_id")
      .notNull()
      .unique()
      .references(() => usersTable.id),
    asaasSubscriptionId: text("asaas_subscription_id").notNull().unique(),
    asaasCustomerId: text("asaas_customer_id").notNull(),
    value: real("value").notNull(),
    cycle: text("cycle").notNull().default("MONTHLY"),
    status: text("status", {
      enum: ["PENDENTE", "ATIVA", "INADIMPLENTE", "CANCELADA"],
    })
      .notNull()
      .default("PENDENTE"),
    nextDueDate: date("next_due_date"),
    invoiceUrl: text("invoice_url"),
    lastPaymentId: text("last_payment_id"),
    lastPaymentStatus: text("last_payment_status"),
    lastPaymentAt: timestamp("last_payment_at", { withTimezone: true }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("doctor_subscriptions_asaas_id_unique_idx").on(
      table.asaasSubscriptionId,
    ),
    uniqueIndex("doctor_subscriptions_doctor_unique_idx").on(table.doctorId),
  ],
);

export const insertDoctorSubscriptionSchema = createInsertSchema(
  doctorSubscriptionsTable,
).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertDoctorSubscription = z.infer<
  typeof insertDoctorSubscriptionSchema
>;
export type DoctorSubscription = typeof doctorSubscriptionsTable.$inferSelect;