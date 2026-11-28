import { defineConfig, lazyPlugins } from "vite-plus";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

const DATA_LAYER_MESSAGE =
  "DB へのアクセスは src/server/data/ の関数を使ってください（世帯 ID の条件を必ず付けるため）";

/** data 層の外で禁止する import。認証ミドルウェアだけはメールから世帯を特定する関数を使える */
function restrictedImports({ allowScopeBootstrap }: { allowScopeBootstrap: boolean }) {
  return {
    paths: [{ name: "drizzle-orm", message: DATA_LAYER_MESSAGE }],
    patterns: [
      { group: ["drizzle-orm/*"], message: DATA_LAYER_MESSAGE },
      {
        group: ["**/server/data/internal", "**/server/data/internal.ts"],
        message:
          "スコープの DB は src/server/data/ の中だけで使います（data 層を通らない DB アクセスを防ぐため）",
      },
      ...(allowScopeBootstrap
        ? []
        : [
            {
              group: ["**/server/data/scope", "**/server/data/scope.ts"],
              importNames: ["resolveScopeByEmail"],
              message:
                "世帯をまたいで利用者を探す関数は、認証ミドルウェア（src/server/auth/）だけが使います",
            },
          ]),
    ],
  };
}

const config = defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ignorePatterns: [
      // 人間だけが変更する設定（ADR 0004）と、書き換えない承認済みの ADR
      ".claude/**",
      "docs/adr/[0-9]*.md",
      // 自動生成ファイル
      "src/routeTree.gen.ts",
      "worker-configuration.d.ts",
      "migrations/meta/**",
      // ローカル専用の MCP 設定（Claude Code のサンドボックス内では読めないダミーになる）
      ".mcp.json",
    ],
  },
  lint: {
    ignorePatterns: ["src/routeTree.gen.ts", "worker-configuration.d.ts"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
      // DB へのアクセスは src/server/data/ の関数経由のみ（ADR 0002、.claude/rules/data-access.md）
      "no-restricted-imports": ["error", restrictedImports({ allowScopeBootstrap: false })],
    },
    overrides: [
      {
        files: ["src/server/data/**"],
        rules: { "no-restricted-imports": "off" },
      },
      {
        // 認証ミドルウェアだけは、メールから世帯を特定する関数を使える
        files: ["src/server/auth/**"],
        rules: {
          "no-restricted-imports": ["error", restrictedImports({ allowScopeBootstrap: true })],
        },
      },
    ],
    options: { typeAware: true, typeCheck: true },
  },
  resolve: { tsconfigPaths: true },
  // 単体テスト（`pnpm test`）。D1 は wrangler のローカル実装をメモリ上で使う（src/test/d1.ts）
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    environment: "node",
  },
  // 単体テストではアプリのプラグイン（Cloudflare の開発サーバーなど）を起動しない
  plugins: process.env["VITEST"]
    ? []
    : lazyPlugins(() => [
        devtools(),
        cloudflare({ viteEnvironment: { name: "ssr" } }),
        tailwindcss(),
        tanstackStart(),
        viteReact(),
      ]),
});

export default config;
