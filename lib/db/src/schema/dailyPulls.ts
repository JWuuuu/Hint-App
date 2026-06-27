import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const dailyPullsTable = pgTable(
  "daily_pulls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    anonId: text("anon_id").notNull(),
    pullDate: text("pull_date").notNull(),
    cardId: text("card_id").notNull(),
    cardName: text("card_name").notNull(),
    whisper: text("whisper").notNull(),
    isFlipped: boolean("is_flipped").notNull().default(false),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique("daily_pulls_anon_date_unique").on(t.anonId, t.pullDate)],
);

export type DailyPull = typeof dailyPullsTable.$inferSelect;
export type InsertDailyPull = typeof dailyPullsTable.$inferInsert;
