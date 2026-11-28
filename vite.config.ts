import { defineConfig, lazyPlugins } from "vite-plus";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

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
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "drizzle-orm",
              message:
                "DB へのアクセスは src/server/data/ の関数を使ってください（世帯 ID の条件を必ず付けるため）",
            },
          ],
          patterns: [
            {
              group: ["drizzle-orm/*"],
              message:
                "DB へのアクセスは src/server/data/ の関数を使ってください（世帯 ID の条件を必ず付けるため）",
            },
          ],
        },
      ],
    },
    overrides: [
      {
        files: ["src/server/data/**"],
        rules: { "no-restricted-imports": "off" },
      },
    ],
    options: { typeAware: true, typeCheck: true },
  },
  resolve: { tsconfigPaths: true },
  plugins: lazyPlugins(() => [
    devtools(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ]),
});

export default config;
