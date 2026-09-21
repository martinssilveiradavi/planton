import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    replitAuthId: text("replit_auth_id").unique(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash"),
    type: text("type", { enum: ["doctor", "hospital"] }),
    specialty: text("specialty"),
    crmNumber: text("crm_number"),
    crmState: text("crm_state"),
    hospitalName: text("hospital_name"),
    cnpj: text("cnpj"),
    phone: text("phone"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    check("users_type_auth_check", sql`${table.type} is null or ${table.type} in ('doctor', 'hospital')`),
    check(
      "users_profile_auth_check",
      sql`${table.type} is null
        or (${table.type} = 'doctor' and ${table.specialty} is not null and ${table.crmNumber} is not null)
        or (${table.type} = 'hospital' and ${table.hospitalName} is not null)`,
    ),
    check("users_state_check", sql`${table.state} is null or char_length(${table.state}) = 2`),
    uniqueIndex("users_email_lower_unique_idx").on(sql`lower(${table.email})`),
    uniqueIndex("users_id_type_unique_idx").on(table.id, table.type),
    uniqueIndex("users_crm_number_unique_idx")
      .on(sql`lower(${table.crmNumber})`)
      .where(sql`${table.crmNumber} is not null`),
    uniqueIndex("users_cnpj_unique_idx")
      .on(sql`lower(${table.cnpj})`)
      .where(sql`${table.cnpj} is not null`),
    index("users_type_idx").on(table.type),
    index("users_specialty_idx").on(table.specialty),
    index("users_city_state_idx").on(table.city, table.state),
  ],
);

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const sessionsTable = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);
