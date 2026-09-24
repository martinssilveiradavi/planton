import {
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { applicationsTable } from "./applications";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id")
    .notNull()
    .unique()
    .references(() => applicationsTable.id),
  asaasChargeId: text("asaas_charge_id"),
  asaasStatus: text("asaas_status"),
  invoiceUrl: text("invoice_url"),
  grossAmount: real("gross_amount").notNull(),
  platformFeePercent: real("platform_fee_percent").notNull(),
  platformFeeAmount: real("platform_fee_amount").notNull(),
  doctorAmount: real("doctor_amount").notNull(),
  status: text("status", {
    enum: [
      "AGUARDANDO_PAGAMENTO",
      "PAGO",
      "LIBERADO",
      "ESTORNADO",
      "FALHOU",
    ],
  })
    .notNull()
    .default("AGUARDANDO_PAGAMENTO"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  releasedAt: timestamp("released_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;