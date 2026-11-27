# 0010 Git・GitHub の運用

- 状態: 承認済み（2026-11-26）

## 背景

個人開発で、実装の大半を Claude が行う。人間の承認を確実に挟み、Claude の権限は最小にしたい。

## 決定

### リポジトリとブランチ

- 非公開リポジトリ。GitHub アカウントはパスキーまたは 2 段階認証で保護する
- main + 短命の作業ブランチ（1 仕様につき 1 ブランチ、例: `feat/001-appliance-registry`）
- マージは squash のみ。マージ後にブランチを削除する
- 並行作業は `git worktree` でチェックアウトを分ける

### main の保護

- 直接 push・force push・削除を禁止、PR 必須
- 必須チェック: lint・型チェック・単体テスト・E2E（Chromium と WebKit）・ビルド・gitleaks
- 未解決のレビューコメントがあるとマージ不可
- 承認人数は 0（個人開発では自分の PR を承認できないため）。**ひでがマージする = 承認ポイント 2**

### Claude の権限

- リポジトリ専用の fine-grained token（Contents と Pull requests の読み書きのみ、**Workflows 権限なし**）
- 拒否ルール: `gh pr merge`、force push、main への直接 push
- 要注意パス（`.claude/` `.github/` `docs/adr/` `CLAUDE.md` `REVIEW.md` `wrangler.jsonc` `terraform/`）の変更は PR 本文で明示する

### 規約

- コミットは Conventional Commits（種別は英語、本文は日本語）
- PR テンプレート: 仕様へのリンク / 検証の証拠 / リスク / 戻し方

### 依存の更新と CI

- Dependabot（cooldown 7 日、週 1 回、npm と GitHub Actions をそれぞれまとめて 1 PR）
- Action はコミットハッシュで固定、`permissions` は既定で読み取り専用、`pull_request_target` は使わない
- main へのマージでアプリを自動デプロイ。Terraform は PR で plan をコメントし、apply は手動実行のみ

## 影響

- Claude は CI の定義を変更できない（変更が必要な場合はひでが行う）

## 見直す条件

- 共同開発者が増えた
