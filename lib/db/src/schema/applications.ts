import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { shiftsTable } from "./shifts";

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  shiftId: integer("shift_id").notNull().references(() => shiftsTable.id),
  doctorId: integer("doctor_id").notNull().references(() => usersTable.id),
  status: text("status", { enum: ["PENDENTE", "SELECIONADO", "REJEITADO"] }).notNull().default("PENDENTE"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
