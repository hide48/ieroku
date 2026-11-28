# ADR（設計判断の記録）

「その時点で何を、なぜ決めたか」の記録。**今のルールは CLAUDE.md と `.claude/rules/` を見る**。

- ADR の本文は書き換えない。判断を変えるときは新しい ADR を書き、この目次の「その後」に記す
- 新しい ADR は `NNNN-短い名前.md`。状態は「提案」で作り、PR のマージで承認とする
- 書くのはアーキテクチャ・安全性に関わる判断のときだけ。運用の細部は CLAUDE.md を直す

| ADR                                               | 判断                                                                                  | その後                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------- |
| [0001](0001-cloudflare-workers-tanstack-start.md) | 実行環境は Cloudflare Workers + TanStack Start                                        |                                                    |
| [0002](0002-d1-drizzle.md)                        | DB は D1 + Drizzle。RLS がないため共通データアクセス層で世帯 ID を強制                |                                                    |
| [0003](0003-cloudflare-access-auth.md)            | 認証は Cloudflare Access + アプリ側の JWT 検証                                        |                                                    |
| [0004](0004-supply-chain-policy.md)               | サプライチェーン対策（7 日待機・ビルドスクリプト許可制・依存追加は人間のみ）          |                                                    |
| [0005](0005-terraform.md)                         | インフラは Terraform、apply は GitHub Actions の手動実行のみ                          |                                                    |
| [0006](0006-dev-environment.md)                   | 開発環境は専用 WSL2 + サンドボックス、本番の認証情報は手元に置かない                  |                                                    |
| [0007](0007-vite-plus.md)                         | lint / format / test は Vite+                                                         |                                                    |
| [0008](0008-ui.md)                                | UI は shadcn/ui（Base UI）+ Tailwind、日付は標準入力、フォームは TanStack Form + Zod  |                                                    |
| [0009](0009-modern-web-guidance.md)               | modern-web-guidance を参照ガイドとして採用                                            | 優先順位「ADR → CLAUDE.md → ガイド」は 0014 で変更 |
| [0010](0010-git-github.md)                        | Git・GitHub の運用（main 保護、Claude の権限は最小）                                  | 「squash のみ」は 0013 で変更                      |
| [0011](0011-login-domain.md)                      | ログインはパスキー + ワンタイムコード、独自ドメインで公開                             |                                                    |
| [0012](0012-ai-analysis.md)                       | AI 解析は Workers AI を基本、必ず人が確認してから保存（第 2 弾）                      |                                                    |
| [0013](0013-merge-commit.md)                      | PR のマージはマージコミット                                                           |                                                    |
| [0014](0014-rules-vs-adr.md)                      | 今のルールは CLAUDE.md と `.claude/rules/`、ADR は判断の記録                          |                                                    |
| [0015](0015-notification-email.md)                | 通知メールは send_email で世帯の 2 アドレスのみ、本文は品名・期限・リンクだけ（提案） |                                                    |
| [0016](0016-file-delivery-url.md)                 | 添付は Worker が検証して返す 60 秒の HMAC 署名付き URL で配信（提案）                 |                                                    |
