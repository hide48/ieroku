import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// SPEC 001 §3。ID は crypto.randomUUID()、日時は UTC の ISO 文字列。
// 全テーブルに household_id（NOT NULL）を持たせる（households 自身を除く）。

/** 世帯。名前（苗字）は保存しない */
export const households = sqliteTable("households", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull(),
});

/** ログインできる人。Access の JWT のメールで特定する */
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    householdId: text("household_id")
      .notNull()
      .references(() => households.id),
    email: text("email").notNull().unique(),
    notifyEmail: integer("notify_email", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    index("users_household_id_idx").on(t.householdId),
    // メールは小文字で保存する（JWT 側も小文字化して照合する）
    check("users_email_lowercase", sql`${t.email} = lower(${t.email})`),
  ],
);
