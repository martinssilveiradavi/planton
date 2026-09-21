import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { shiftsTable } from "./shifts";

export const applicationsTable = pgTable(
  "applications",
  {
    id: serial("id").primaryKey(),
    shiftId: integer("shift_id").notNull().references(() => shiftsTable.id, { onDelete: "cascade" }),
    doctorId: integer("doctor_id").notNull(),
    doctorType: text("doctor_type", { enum: ["doctor"] }).notNull().default("doctor"),
    status: text("status", { enum: ["PENDENTE", "SELECIONADO", "REJEITADO"] }).notNull().default("PENDENTE"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    check(
      "applications_status_check",
      sql`${table.status} in ('PENDENTE', 'SELECIONADO', 'REJEITADO')`,
    ),
    check("applications_doctor_type_check", sql`${table.doctorType} = 'doctor'`),
    uniqueIndex("applications_shift_doctor_unique_idx").on(table.shiftId, table.doctorId),
    index("applications_doctor_id_idx").on(table.doctorId),
    index("applications_status_idx").on(table.status),
    foreignKey({
      columns: [table.doctorId, table.doctorType],
      foreignColumns: [usersTable.id, usersTable.type],
      name: "applications_doctor_role_fk",
    }),
  ],
);

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
