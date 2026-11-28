import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type Target = "--local" | "--remote";

/**
 * 書き込みの SQL を一時ファイル（本人のみ読める）に書いて wrangler d1 execute --file で実行する。
 * --remote の --file は D1 の import API で 1 つのまとまりとして実行される。ただし結果の行は返らない。
 * シェルは通さない。
 */
export function executeSqlFile(target: Target, sql: string): void {
  const dir = mkdtempSync(join(tmpdir(), "ieroku-"));
  const file = join(dir, "query.sql");
  try {
    writeFileSync(file, sql, { mode: 0o600 });
    execFileSync(
      "pnpm",
      ["exec", "wrangler", "d1", "execute", "DB", target, "--file", file, "--yes"],
      {
        stdio: ["ignore", "ignore", "inherit"],
      },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * 結果の行が必要な読み取りの SQL を --command で実行し、最初の行を返す（--file では --remote の行が返らないため）。
 * SQL の値は Zod で検証済みのものだけを入れる。シェルは通さない。
 */
export function queryFirstRow(target: Target, sql: string): Record<string, unknown> | undefined {
  const out = execFileSync(
    "pnpm",
    ["exec", "wrangler", "d1", "execute", "DB", target, "--command", sql, "--json", "--yes"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  );
  const parsed = JSON.parse(out) as { results?: Record<string, unknown>[] }[];
  return parsed[0]?.results?.[0];
}
