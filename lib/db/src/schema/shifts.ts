import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const shiftsTable = pgTable(
  "shifts",
  {
    id: serial("id").primaryKey(),
    hospitalId: integer("hospital_id").notNull(),
    hospitalType: text("hospital_type", { enum: ["hospital"] }).notNull().default("hospital"),
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
  },
  (table) => [
    check(
      "shifts_status_check",
      sql`${table.status} in ('ABERTO', 'PREENCHIDO', 'CANCELADO', 'ENCERRADO')`,
    ),
    check("shifts_hospital_type_check", sql`${table.hospitalType} = 'hospital'`),
    check("shifts_remuneration_check", sql`${table.remuneration} >= 0`),
    check(
      "shifts_coordinates_check",
      sql`(${table.latitude} is null and ${table.longitude} is null)
        or (
          ${table.latitude} is not null
          and ${table.longitude} is not null
          and ${table.latitude} between -90 and 90
          and ${table.longitude} between -180 and 180
        )`,
    ),
    index("shifts_hospital_id_idx").on(table.hospitalId),
    index("shifts_status_date_idx").on(table.status, table.date),
    index("shifts_specialty_idx").on(table.specialty),
    index("shifts_city_state_idx").on(table.city, table.state),
    foreignKey({
      columns: [table.hospitalId, table.hospitalType],
      foreignColumns: [usersTable.id, usersTable.type],
      name: "shifts_hospital_role_fk",
    }),
  ],
);

export const insertShiftSchema = createInsertSchema(shiftsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Shift = typeof shiftsTable.$inferSelect;
