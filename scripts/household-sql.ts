import * as z from "zod";

// 世帯登録の SQL を作る純関数（scripts/register-household.ts と scripts/seed.ts で使う）。
// 世帯や利用者を画面から追加する機能は 001 の対象外（SPEC 001 §1）。

export const emailsSchema = z
  .array(z.email().transform((e) => e.trim().toLowerCase()))
  .min(1, "メールを 1 件以上指定してください")
  .max(10)
  .refine((list) => new Set(list).size === list.length, "同じメールが重複しています");

export type HouseholdRows = {
  readonly householdId: string;
  readonly users: readonly { readonly id: string; readonly email: string }[];
  readonly createdAt: string;
};

/** SQL の文字列リテラル（' を二重にする）。値は Zod で検証済みのメールと UUID のみ */
const lit = (v: string): string => `'${v.replaceAll("'", "''")}'`;

/**
 * 世帯 1 件と利用者を作る SQL。
 * orIgnore=true（ダミーのシード用）では、同じ ID がすでにあれば何もしない。
 */
export function buildRegisterHouseholdSql(
  rows: HouseholdRows,
  opts: { orIgnore?: boolean } = {},
): string {
  const insert = opts.orIgnore ? "INSERT OR IGNORE INTO" : "INSERT INTO";
  const lines = [
    `${insert} households (id, created_at) VALUES (${lit(rows.householdId)}, ${lit(rows.createdAt)});`,
    ...rows.users.map(
      (u) =>
        `${insert} users (id, household_id, email, created_at) VALUES (${lit(u.id)}, ${lit(rows.householdId)}, ${lit(u.email)}, ${lit(rows.createdAt)});`,
    ),
  ];
  return `${lines.join("\n")}\n`;
}

/** すでに登録済みのメールの件数を数える SQL（登録前の確認用） */
export function buildCountExistingUsersSql(emails: readonly string[]): string {
  return `SELECT count(*) AS n FROM users WHERE email IN (${emails.map(lit).join(", ")});`;
}
