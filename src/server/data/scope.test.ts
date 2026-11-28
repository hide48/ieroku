import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";

import { createTestDb, insertHousehold, type TestDb } from "@/test/d1";

import { dbOf } from "./internal";
import { resolveScopeByEmail } from "./scope";

const HOUSEHOLD_A = "00000000-0000-4000-8000-00000000000a";
const HOUSEHOLD_B = "00000000-0000-4000-8000-00000000000b";

let t: TestDb;

beforeAll(async () => {
  t = await createTestDb();
  await insertHousehold(t.d1, {
    householdId: HOUSEHOLD_A,
    users: [
      { id: "00000000-0000-4000-8000-0000000000a1", email: "a1@example.com" },
      { id: "00000000-0000-4000-8000-0000000000a2", email: "a2@example.com" },
    ],
  });
  await insertHousehold(t.d1, {
    householdId: HOUSEHOLD_B,
    users: [{ id: "00000000-0000-4000-8000-0000000000b1", email: "b1@example.com" }],
  });
});

afterAll(() => t.dispose());

describe("resolveScopeByEmail", () => {
  test("メールの利用者とその世帯を返す（大文字・前後の空白は無視）", async () => {
    const s = await resolveScopeByEmail(t.db, "  A2@Example.COM ");
    expect(s && { householdId: s.householdId, userId: s.userId }).toEqual({
      householdId: HOUSEHOLD_A,
      userId: "00000000-0000-4000-8000-0000000000a2",
    });
  });

  test("世帯 B の利用者は世帯 B にしかならない", async () => {
    expect((await resolveScopeByEmail(t.db, "b1@example.com"))?.householdId).toBe(HOUSEHOLD_B);
  });

  test("未登録・空のメールは null", async () => {
    expect(await resolveScopeByEmail(t.db, "nobody@example.com")).toBeNull();
    expect(await resolveScopeByEmail(t.db, "")).toBeNull();
  });

  test("users のメールは小文字以外を保存できない", async () => {
    await expect(
      t.d1
        .prepare("INSERT INTO users (id, household_id, email, created_at) VALUES (?, ?, ?, ?)")
        .bind(
          "00000000-0000-4000-8000-0000000000b2",
          HOUSEHOLD_B,
          "Upper@Example.com",
          "2026-11-28T00:00:00Z",
        )
        .run(),
    ).rejects.toThrow();
  });

  test("同じメールを 2 つの世帯に登録できない", async () => {
    await expect(
      t.d1
        .prepare("INSERT INTO users (id, household_id, email, created_at) VALUES (?, ?, ?, ?)")
        .bind(
          "00000000-0000-4000-8000-0000000000b3",
          HOUSEHOLD_B,
          "a1@example.com",
          "2026-11-28T00:00:00Z",
        )
        .run(),
    ).rejects.toThrow();
  });
});

describe("HouseholdScope", () => {
  test("スコープに DB クライアントを持たせない（data 層の外から DB を触れない）", async () => {
    const s = await resolveScopeByEmail(t.db, "a1@example.com");
    expect(Object.keys(s ?? {}).sort()).toEqual(["householdId", "userId"]);
    expect(Object.isFrozen(s)).toBe(true);
  });

  test("data 層の中では dbOf でスコープの DB を取り出せる。偽のスコープでは例外", async () => {
    const s = await resolveScopeByEmail(t.db, "a1@example.com");
    expect(dbOf(s!)).toBe(t.db);
    expect(() => dbOf({ householdId: HOUSEHOLD_A, userId: "x" })).toThrow();
  });
});
