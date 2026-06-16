import {
  pgTable,
  uuid,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const dailyReceiptsTable = pgTable(
  "daily_receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id"),
    anonymousDeviceId: text("anonymous_device_id").notNull(),
    dailyKey: text("daily_key").notNull(),
    featureType: text("feature_type").notNull(),
    assignedCardId: text("assigned_card_id"),
    orientation: text("orientation"),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  },
  (t) => [
    unique("daily_receipts_device_day_feature_unique").on(
      t.anonymousDeviceId,
      t.dailyKey,
      t.featureType,
    ),
  ],
);

export type DailyReceipt = typeof dailyReceiptsTable.$inferSelect;
export type InsertDailyReceipt = typeof dailyReceiptsTable.$inferInsert;
