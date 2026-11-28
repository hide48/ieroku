# ieroku（家録）

新築戸建て（夫婦 2 人で利用）の住宅管理 Web アプリ。TanStack Start + Cloudflare Workers（D1・R2）。
個人情報（契約書・住所・保証書）を扱うため、**安全性を機能より優先する**。

## 文書の役割

- **今のルールは CLAUDE.md と `.claude/rules/`（フォルダごとの詳細）が正本**。ADR（`docs/adr/`、目次は README.md）は「なぜそう決めたか」の記録で、ルールの参照先にはしない
- ルールと ADR が食い違っていたら、どちらかを優先せずに報告する
- ADR はアーキテクチャ・安全性に関わる判断のときだけ書く。運用の細部はこのファイルを直す

## コマンド

- `pnpm dev` … ローカル起動（workerd。D1・R2・Cron もローカル再現）
- `pnpm check` … format・lint（型を使うチェック込み）・型チェック（Vite+）。`pnpm exec vp check --fix` で自動修正
- `pnpm build` / `pnpm typecheck`
- 未整備: `pnpm test`、`pnpm e2e`（Chromium と WebKit）、`pnpm db:seed`（ダミーデータのみ）

## 必ず守るルール

- **DB へのクエリは `src/server/data/` の関数経由のみ**。すべての関数は世帯 ID を必須にする
- 権限まわりの変更には「他の世帯のデータにアクセスできない」ことのテストを付ける
- ログ・エラーメッセージに個人情報（氏名・住所・メール・金額・ファイル名）を出さない
- パッケージの追加・`shadcn add`・デプロイ・`terraform apply` は行わない。理由とコマンドを提示して人間に依頼する
- 対象は Android Chrome と iOS Safari。Web 機能は Baseline Widely available の範囲で使う
- 判断に迷ったら実装を止めて質問する。同じ失敗を 3 回修正しても直らなければ止めて報告する

## 開発フロー

- `/spec` で仕様を作る → **承認ポイント 1**（人間が設計書を承認）→ 新しいセッションで実装 → `/verify` → **承認ポイント 2**（人間が証拠を見て PR をマージ）
- 1 機能 = 1 仕様 + 小さな PR。設計からずれそうなら `/spec` に戻って相談する。タイポ修正などは計画なしでよい
- 振り返りで繰り返し出た指摘は、このファイル・`.claude/rules/`・REVIEW.md に反映する

## 人間への作業依頼の書き方

依存の追加・`.claude/` や `.github/workflows/` の変更・GitHub の設定など、人間に作業を頼むときは次の形で書く。

- 報告とは分けて「あなたの作業」として独立させる。1 手順 = 1 操作。多いときは次の 1〜2 個だけ出す
- 各作業に書くこと: なぜ必要か（1 行）／いつまでに必要か・かかる時間／**どこでやるか**（Claude Code の入力欄で `!` を付ける・普通の WSL ターミナル・GitHub の画面・VS Code）／画面の場所とボタン名（表示どおり）／入力する文字（コピーできるコードブロック）／**うまくいったときに見えるもの**／終わったら何を伝えればよいか
- 専門用語は最初に出たときに言い換える。作業がないときは「今はありません」と書く

## Git

- ブランチは `feat/NNN-機能名` など短命のもの。main への直接 push はしない
- コミットは Conventional Commits（種別は英語、本文は日本語）。例: `feat(warranty): 保証期限の一覧を追加 (#001)`
- マージはマージコミット。PR 内のコミットが main に残るため、途中経過のコミットは push 前に `git commit --fixup` と `git rebase --autosquash` でまとめる
- `.github/workflows/` は Claude のトークン（Workflows 権限なし）では push できない。変更が必要なら差分を用意し、push は人間が行う
- PR には仕様へのリンク・検証の証拠・リスク・戻し方を書き、要注意パス（`.claude/` `.github/` `docs/adr/` `CLAUDE.md` `REVIEW.md` `wrangler.jsonc` `terraform/`）の変更を明示する
