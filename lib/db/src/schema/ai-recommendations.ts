import {
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export type AiRecommendationRecord = {
  shiftId: number;
  score: number;
  reason: string;
};

export const aiRecommendationsTable = pgTable(
  "ai_recommendation_cache",
  {
    id: serial("id").primaryKey(),
    doctorId: integer("doctor_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    cacheKey: text("cache_key").notNull(),
    recommendations: jsonb("recommendations")
      .$type<AiRecommendationRecord[]>()
      .notNull(),
    model: text("model").notNull(),
    promptTokens: integer("prompt_tokens"),
    completionTokens: integer("completion_tokens"),
    estimatedCostUsd: real("estimated_cost_usd"),
    cacheHits: integer("cache_hits").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("ai_recommendation_cache_doctor_key_unique").on(
      table.doctorId,
      table.cacheKey,
    ),
    index("ai_recommendation_cache_doctor_idx").on(table.doctorId),
  ],
);