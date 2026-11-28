import type { Db } from "./db";

// スコープに結び付いた DB クライアント。data 層の中だけで使う（外からの import は lint で禁止）。
// スコープのオブジェクトに DB を持たせると、ルートやサーバー関数から data 層を通らずに
// DB を触れてしまうため、ここで別に持つ。

const dbs = new WeakMap<object, Db>();

export function bindDb(scope: object, db: Db): void {
  dbs.set(scope, db);
}

/** スコープの DB。resolveScopeByEmail で作ったスコープ以外では例外を投げる */
export function dbOf(scope: object): Db {
  const db = dbs.get(scope);
  if (!db) throw new Error("HouseholdScope が不正です");
  return db;
}
