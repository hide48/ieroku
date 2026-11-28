import { parseArgs } from "node:util";

import { Temporal } from "temporal-polyfill";

import {
  buildCountExistingUsersSql,
  buildRegisterHouseholdSql,
  emailsSchema,
} from "./household-sql.ts";
import { executeSqlFile, queryFirstRow, type Target } from "./wrangler-d1.ts";

// 世帯を 1 つ作り、ログインできる利用者（Access で許可したメール）を登録する。
//   pnpm household:register --local  --email a@example.com --email b@example.com
//   pnpm household:register --remote --email ...   ← 本番。人間が実行する
// 出力には ID と件数だけを出す（メールは出さない）。

const { values } = parseArgs({
  options: {
    email: { type: "string", multiple: true, default: [] },
    local: { type: "boolean", default: false },
    remote: { type: "boolean", default: false },
  },
});

if (values.local === values.remote) {
  console.error("--local か --remote のどちらか一方を指定してください");
  process.exit(1);
}
const target: Target = values.remote ? "--remote" : "--local";

const parsed = emailsSchema.safeParse(values.email);
if (!parsed.success) {
  console.error(`メールの指定が不正です: ${parsed.error.issues.map((i) => i.message).join(" / ")}`);
  process.exit(1);
}
const emails = parsed.data;

const existing = queryFirstRow(target, buildCountExistingUsersSql(emails))?.["n"];
if (existing !== 0) {
  console.error(
    typeof existing === "number"
      ? `登録済みのメールが含まれています（${existing} 件）。何もしませんでした`
      : "登録済みかどうかを確認できませんでした。何もしませんでした",
  );
  process.exit(1);
}

const rows = {
  householdId: crypto.randomUUID(),
  users: emails.map((email) => ({ id: crypto.randomUUID(), email })),
  createdAt: Temporal.Now.instant().toString(),
};
executeSqlFile(target, buildRegisterHouseholdSql(rows));

console.log(`世帯を作成しました: household_id=${rows.householdId}`);
console.log(`利用者 ${rows.users.length} 人: ${rows.users.map((u) => u.id).join(", ")}`);
