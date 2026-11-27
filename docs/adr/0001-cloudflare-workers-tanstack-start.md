# 0001 実行環境は Cloudflare Workers + TanStack Start

- 状態: 承認済み（2026-11-26）

## 背景

夫婦 2 人で使う個人開発の住宅管理アプリ。費用を抑えたい一方、個人情報を扱うため安全性が必要。Claude Code による AI 駆動開発で、ローカルで検証ループを速く回せることも重視する。

## 決定

- フレームワークは TanStack Start 1.x（React + TypeScript）
- 実行環境は Cloudflare Workers
- ローカルでは Cloudflare の Vite プラグインで workerd（Workers のランタイム）上で動かし、本番と同じ環境で検証する

## 検討した代替案

- Vercel + Supabase（Next.js）: 開発は最も楽だが、Supabase の無料プランは 1 週間使わないと停止するため実運用は Pro（月 25 ドル）が必要で、費用が高い
- Cloudflare Workers + Next.js（vinext / OpenNext）: Cloudflare 推奨の vinext がベータ版
- AWS（Amplify + Aurora + Cognito）: 設計・運用の負担が大きい。App Runner は新規受付終了

## 影響

- 運用費は Workers 無料プランなら 0 円、有料プランでも月 5 ドル
- Next.js に比べて Claude の知識が少ないため、公式ドキュメントへのリンクと verify ループで補う
- Workers 無料プランは 1 回の呼び出しあたり CPU 10ms の制限があり、超えたら有料プランへ移る

## 見直す条件

- TanStack Start や Workers の制約で必要な機能が実現できない
- 無料・低価格の前提が崩れる
