import { pgTable, text, serial, timestamp, integer, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const shiftsTable = pgTable("shifts", {
  id: serial("id").primaryKey(),
  hospitalId: integer("hospital_id").notNull().references(() => usersTable.id),
  title: text("title").notNull(),
  specialty: text("specialty").notNull(),
  description: text("description"),
  requirements: text("requirements"),
  date: date("date", { mode: "string" }).notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  remuneration: real("remuneration").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  status: text("status", { enum: ["ABERTO", "PREENCHIDO", "CANCELADO", "ENCERRADO"] }).notNull().default("ABERTO"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertShiftSchema = createInsertSchema(shiftsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Shift = typeof shiftsTable.$inferSelect;
