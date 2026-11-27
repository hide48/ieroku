# 0007 lint / format は Vite+（Oxlint・Oxfmt）

- 状態: 承認済み（2026-11-26）

## 背景

Claude が修正するたびに lint・型チェック・テストを回すため、ツールの速さが検証ループの速さに直結する。依存パッケージは少ないほど安全。TanStack Start と Cloudflare のプラグインはどちらも Vite ベース。

## 決定

- Vite+ を採用する（Vite 8・Vitest・Oxlint・Oxfmt・Rolldown をまとめた 1 つのツールチェーン、設定は vite.config.ts に集約）
- Oxlint の型を使うチェック（tsgolint）を有効にし、`await` 漏れなどを検出する
- `no-restricted-imports` で `drizzle-orm` の import を `src/server/data/` 内のみに制限する（0002）

## 検討した代替案

- ESLint + Prettier: 最も成熟しているが遅く、プラグインを重ねるほど依存が増える
- Biome: 速く単体で完結するが、型を使うチェックは独自の推論でエッジケースを見逃すことがある
- Oxlint + Oxfmt 単体: Vite+ に問題があった場合の切り替え先

## 影響

- Vite+ 1.0 は開発元自身が「安定性の節目であって完成品ではない」としている
- Vite+ もパッケージマネージャーを管理するため、0004 の pnpm 設定がそのまま効くかを雛形作成時に確認する

## 見直す条件

- Vite+ が TanStack Start / Cloudflare プラグインと互換性の問題を起こした → Oxlint + Oxfmt 単体に切り替える
