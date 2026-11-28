import { eq } from "drizzle-orm";

import type { Db } from "./db";
import { bindDb } from "./internal";
import { users } from "./schema";

declare const brand: unique symbol;

/**
 * 世帯スコープ。データアクセス関数の第 1 引数に必ず取り、全クエリの WHERE に householdId を入れる。
 * 作れるのはこのファイルの resolveScopeByEmail だけ（認証ミドルウェアから呼ぶ）。
 * DB クライアントはスコープに持たせず、data 層の中で dbOf(scope) で取り出す（internal.ts）。
 * 入力（URL・フォーム）から世帯 ID を受け取らないためのブランド型（SPEC 001 §6）。
 */
export type HouseholdScope = {
  readonly householdId: string;
  readonly userId: string;
  readonly [brand]: true;
};

/**
 * Access の JWT で確かめたメールから利用者を探し、その世帯のスコープを作る。
 * 世帯 ID が決まる前の唯一の検索なので、世帯をまたいで users を引く（メールは全体で一意）。
 * 未登録なら null（呼び出し側で 403 にする）。
 */
export async function resolveScopeByEmail(db: Db, email: string): Promise<HouseholdScope | null> {
  const normalized = email.trim().toLowerCase();
  if (normalized === "") return null;
  const row = await db
    .select({ id: users.id, householdId: users.householdId })
    .from(users)
    .where(eq(users.email, normalized))
    .get();
  if (!row) return null;
  const scope = Object.freeze({ householdId: row.householdId, userId: row.id }) as HouseholdScope;
  bindDb(scope, db);
  return scope;
}
