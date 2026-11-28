import { defineConfig } from "drizzle-kit";

// マイグレーションの SQL を生成するだけに使う（`pnpm db:generate`）。
// 適用は wrangler（`pnpm db:migrate:local`）。マイグレーションは追加のみ（SPEC 001 §3）。
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/server/data/schema.ts",
  out: "./migrations",
});
