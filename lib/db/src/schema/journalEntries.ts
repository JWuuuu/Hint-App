import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const journalEntriesTable = pgTable("journal_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  anonId: text("anon_id").notNull(),
  title: text("title"),
  body: text("body").notNull(),
  mood: text("mood"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type JournalEntry = typeof journalEntriesTable.$inferSelect;
export type InsertJournalEntry = typeof journalEntriesTable.$inferInsert;
