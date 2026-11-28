import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { createDb, type Db } from "@/server/data/db";

// テスト用の D1。wrangler のローカル実装（miniflare）をメモリ上で動かし、migrations/ を適用する。
// 本物の D1 と同じ SQLite なので、制約（一意・CHECK・FK）もそのまま確かめられる。

export type TestDb = {
  readonly d1: D1Database;
  readonly db: Db;
  readonly dispose: () => Promise<void>;
};

export async function createTestDb(): Promise<TestDb> {
  // wrangler のログと dev registry をリポジトリ内（.gitignore 済みの .wrangler/）に置き、ホームに書き込まない。
  // wrangler は読み込み時に環境変数を読むため、設定してから import する
  process.env["WRANGLER_LOG_PATH"] ??= ".wrangler/logs";
  process.env["WRANGLER_REGISTRY_PATH"] ??= ".wrangler/registry";
  process.env["CLOUDFLARE_DEV_REGISTRY_PATH"] ??= ".wrangler/registry";
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy<{ DB: D1Database }>({
    configPath: "src/test/wrangler.test.jsonc",
    persist: false,
    remoteBindings: false,
  });
  const d1 = proxy.env.DB;
  await applyMigrations(d1);
  return { d1, db: createDb(d1), dispose: () => proxy.dispose() };
}

async function applyMigrations(d1: D1Database): Promise<void> {
  const dir = "migrations";
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = await readFile(join(dir, file), "utf8");
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s !== "");
    await d1.batch(statements.map((s) => d1.prepare(s)));
  }
}

/** テスト用に世帯と利用者を作る（ダミーのメールのみ） */
export async function insertHousehold(
  d1: D1Database,
  opts: { householdId: string; users: { id: string; email: string }[] },
): Promise<void> {
  const now = "2026-11-28T00:00:00Z";
  await d1.batch([
    d1.prepare("INSERT INTO households (id, created_at) VALUES (?, ?)").bind(opts.householdId, now),
    ...opts.users.map((u) =>
      d1
        .prepare("INSERT INTO users (id, household_id, email, created_at) VALUES (?, ?, ?, ?)")
        .bind(u.id, opts.householdId, u.email, now),
    ),
  ]);
}
