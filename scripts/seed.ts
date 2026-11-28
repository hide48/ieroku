import { execFileSync } from "node:child_process";

import { buildRegisterHouseholdSql } from "./household-sql.ts";
import { executeSqlFile } from "./wrangler-d1.ts";

// ローカル D1 にダミーデータを入れる（`pnpm db:seed`）。本物の個人情報は使わない。
// 何度実行してもよい（固定 ID・INSERT OR IGNORE）。
//   世帯 A: test@example.com（dev-vars.example の DEV_AUTH_EMAIL）と partner@example.com
//   世帯 B: other@example.com（他の世帯のデータが見えないことの確認用）

const SEED = {
  householdA: "00000000-0000-4000-8000-00000000000a",
  householdB: "00000000-0000-4000-8000-00000000000b",
} as const;

const createdAt = "2026-11-28T00:00:00Z";

execFileSync("pnpm", ["exec", "wrangler", "d1", "migrations", "apply", "DB", "--local"], {
  stdio: "inherit",
});

const sql =
  buildRegisterHouseholdSql(
    {
      householdId: SEED.householdA,
      users: [
        { id: "00000000-0000-4000-8000-0000000000a1", email: "test@example.com" },
        { id: "00000000-0000-4000-8000-0000000000a2", email: "partner@example.com" },
      ],
      createdAt,
    },
    { orIgnore: true },
  ) +
  buildRegisterHouseholdSql(
    {
      householdId: SEED.householdB,
      users: [{ id: "00000000-0000-4000-8000-0000000000b1", email: "other@example.com" }],
      createdAt,
    },
    { orIgnore: true },
  );

executeSqlFile("--local", sql);
console.log("ダミーデータを投入しました（世帯 2 件）");
