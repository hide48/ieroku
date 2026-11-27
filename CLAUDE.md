# ieroku（家録）

新築戸建て（夫婦 2 人で利用）の住宅管理 Web アプリ。家電・住宅設備・家具の保証、契約書類、間取り、点検履歴を管理する。
個人情報（契約書・住所・保証書）を扱うため、**安全性を機能より優先する**。

## スタック

- TanStack Start 1.x + React + TypeScript（strict）
- Cloudflare Workers / D1 + Drizzle / R2 / Cron Triggers / Workers AI（第 2 弾以降）
- 認証: Cloudflare Access（アプリ側で JWT 検証）
- UI: shadcn/ui（Base UI）+ Tailwind、フォームは TanStack Form + Zod
- lint / format / test: Vite+（Oxlint・Oxfmt・Vitest）、E2E は Playwright（Chromium + WebKit）
- IaC: Terraform（Cloudflare プロバイダー）
- 開発環境: Windows 11 上の専用 WSL2、Node.js 26 LTS、pnpm 11（mise で固定）

## コマンド（雛形作成後に実際の名前へ更新すること）

- `pnpm dev` … ローカル起動（wrangler / workerd。D1・R2・Cron もローカル再現）
- `pnpm db:seed` … ダミーデータを投入（本物の個人情報は使わない）
- `pnpm check` … lint・format・型チェック
- `pnpm test` … 単体テスト
- `pnpm e2e` … E2E（Chromium と WebKit）

## ディレクトリ

- `src/routes/` … 画面とサーバー関数
- `src/server/data/` … **DB アクセスはここだけ**（世帯 ID 必須の共通データアクセス層）
- `src/server/infra/` … Cloudflare 依存（R2・メール・Access の JWT 検証）
- `docs/specs/NNN-*/` … 仕様（SPEC.md・design.html）
- `docs/adr/` … 設計判断の記録

## 必ず守るルール

- DB へのクエリは `src/server/data/` の関数経由のみ。すべての関数は世帯 ID を必須引数に取り、条件に含める（`drizzle-orm` の import は lint で制限）
- 権限まわりの変更には「他の世帯のデータにアクセスできない」ことのテストを付ける
- ログ・エラーメッセージに個人情報（氏名・住所・メール・金額・ファイル名）を出さない
- ファイルは R2 の非公開バケットに `{世帯ID}/{UUID}` で保存し、元のファイル名をパスに使わない。閲覧は有効期限 60 秒の署名付き URL
- 画像はクライアント側で JPEG に再エンコードしてから送る（EXIF の位置情報を残さない）。サーバー側でも形式とサイズを検証する
- 環境変数は起動時に Zod で検証する。`DEV_AUTH_EMAIL` が本番で設定されていたら起動を止める
- パッケージの追加・`shadcn add`・デプロイ・`terraform apply` は行わない。必要なら理由とコマンドを提示して人間に依頼する
- Web 機能は Baseline Widely available の範囲で使う（Android Chrome と iOS Safari の両方で動くこと）
- 日付はブラウザ標準の `<input type="date">` を使う
- 判断に迷ったら実装を止めて質問する。同じ失敗を 3 回修正しても直らなければ止めて報告する

## 開発フロー

1. ひでが要件を伝える
2. `/spec`: Claude が選択式でインタビューし論点を詰める
3. `/spec`: 設計書を作る（`docs/specs/NNN-*/SPEC.md` と `design.html`）。決めた技術判断は ADR の下書きにする
4. **承認ポイント 1**: ひでが設計書をレビューして承認
5. 新しいセッションで実装（計画 → 実装 → `/verify`）
6. `/code-review` と `/security-review`
7. **承認ポイント 2**: ひでが証拠（スクリーンショット・テスト結果）を確認して PR をマージ
8. 振り返り: 繰り返し出た指摘を CLAUDE.md・REVIEW.md に反映する

- 1 機能 = 1 仕様 + 小さな PR。設計からずれそうなら 3 に戻って相談する
- 小さな変更（タイポ修正など）は計画なしで直接行ってよい

## Git

- ブランチは `feat/NNN-機能名` など短命のもの。main への直接 push はしない
- コミットは Conventional Commits（種別は英語、本文は日本語）。例: `feat(warranty): 保証期限の一覧を追加 (#001)`
- PR には仕様へのリンク・検証の証拠・リスク・戻し方を書く

## 設計判断（詳細は docs/adr/）

- 0001 実行環境は Cloudflare Workers + TanStack Start
- 0002 DB は D1 + Drizzle（RLS なし → 共通データアクセス層で世帯 ID を強制）
- 0003 認証は Cloudflare Access + アプリ側の JWT 検証
- 0004 サプライチェーン対策（pnpm 7 日待機・ビルドスクリプト許可制・依存追加は人間のみ）
- 0005 インフラは Terraform、apply は GitHub Actions の手動実行のみ
- 0006 開発環境は専用 WSL2 + Claude Code サンドボックス、本番の認証情報は手元に置かない
- 0007 lint / format は Vite+（Oxlint・Oxfmt）
- 0008 UI は shadcn/ui（Base UI）+ Tailwind、日付は標準入力、フォームは TanStack Form + Zod
- 0009 modern-web-guidance を参照ガイドとして採用（優先順位: ADR → CLAUDE.md → ガイド）
- 0010 Git・GitHub の運用（main 保護、Claude の権限は最小）
- 0011 ログインはパスキー + ワンタイムコード、独自ドメインで公開
- 0012 AI 解析は Workers AI を基本、必ず人が確認してから保存（第 2 弾）
