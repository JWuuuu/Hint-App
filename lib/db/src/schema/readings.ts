import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const readingsTable = pgTable("readings", {
  id: uuid("id").primaryKey().defaultRandom(),
  anonId: text("anon_id").notNull(),
  cardName: text("card_name").notNull(),
  whisper: text("whisper").notNull(),
  spreadType: text("spread_type").notNull(),
  question: text("question"),
  territory: text("territory"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Reading = typeof readingsTable.$inferSelect;
export type InsertReading = typeof readingsTable.$inferInsert;
