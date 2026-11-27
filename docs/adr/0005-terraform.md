# 0005 インフラは Terraform で管理する

- 状態: 承認済み（2026-11-26）

## 背景

Cloudflare の設定（Workers・D1・R2・Access・DNS・ドメイン）を手作業で変えると、変更履歴が残らず再現もできない。

## 決定

- Cloudflare のリソースは Terraform（Cloudflare プロバイダー）で管理する
- tfstate は暗号化した R2 バケットに置き、リポジトリにはコミットしない
- PR では `terraform plan` の結果をコメントし、`apply` は GitHub Actions の手動実行（workflow_dispatch）のみ
- Claude に許可するのは `plan` まで。`apply` / `destroy` は拒否ルールで禁止

## 検討した代替案

- AWS を併用（バックアップ先として S3）: Cloudflare に一本化し、バックアップ先は R2 とした

## 影響

- Cloudflare の API トークンは GitHub Secrets にのみ置き、開発環境には置かない（0006）

## 見直す条件

- Terraform のプロバイダーで管理できない設定が増えた
