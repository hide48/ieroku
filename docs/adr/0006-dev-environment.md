# 0006 開発環境は専用 WSL2 + Claude Code サンドボックス

- 状態: 承認済み（2026-11-26）

## 背景

開発は Windows 11。Claude Code のサンドボックスはネイティブ Windows では使えず、WSL2 なら使える。開発環境が侵害されても本番データに届かないようにしたい。

## 決定

- Windows 11 上にこのアプリ専用の WSL2（Ubuntu）を用意し、開発はすべてその中で行う。リポジトリは Linux 側（`~/ieroku`）に置く
- mise で Node.js 26 LTS と pnpm 11 を固定する
- Claude Code は WSL2 内で実行し、サンドボックスを有効化（自動許可モード）する
- 拒否ルール: `.env*` / `.dev.vars*` の読み取り、依存追加、デプロイ、`wrangler secret`、`terraform apply`、`gh pr merge`、force push、main への直接 push
- **本番の認証情報は開発環境に置かない**。デプロイと `terraform apply` は GitHub Actions だけが行う。GitHub トークンはリポジトリ専用の fine-grained token（Workflows 権限なし）
- ローカルは `wrangler dev`（workerd）で Workers・D1・R2・Cron を再現し、データはダミーのシードのみを使う
- エディタ: Windows Terminal + Claude Code CLI を中心に、VS Code（WSL 拡張）をレビューに使う。VS Code の拡張機能は公式の発行元のものを最小限に

## 検討した代替案

- ネイティブ Windows: サンドボックスが使えない
- Dev Container: 隔離は強いが Docker の管理負担が増える。必要になったら移行する

## 影響

- WSL2 の外（Windows 側）のフォルダにリポジトリを置かない

## 見直す条件

- サンドボックスで足りない隔離が必要になった
