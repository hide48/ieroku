# 0002 DB は D1 + Drizzle

- 状態: 承認済み（2026-11-26）

## 背景

データ量は小さい（家族 1 世帯分）。費用を抑えたい。権限制御は必須（夫婦 2 人の世帯のデータだけにアクセスさせる）。

## 決定

- DB は Cloudflare D1（SQLite）、ORM は Drizzle
- D1 には RLS がないため、**世帯 ID を必須引数に取る共通データアクセス層（`src/server/data/`）からしか DB を触らない**
- `drizzle-orm` の import は `src/server/data/` 内のみに lint（no-restricted-imports）で制限する
- 権限まわりの変更には「他の世帯のデータにアクセスできない」テストを必須にする
- バックアップは D1 を定期的にエクスポートし、別の R2 バケットへ保存する

## 検討した代替案

- Neon（Postgres）+ Hyperdrive: RLS が使えるが、ローカル開発が D1 より重い。保留扱い
- Supabase: 月 25 ドルが必要（0001 参照）

## 影響

- 権限の保証がアプリのコードとテストに依存する。手前の Cloudflare Access（0003）と合わせた二重防御とする
- ローカルでは wrangler / workerd で D1 を再現でき、Docker が不要

## 見直す条件

- 権限に関するバグが発生した
- データ量や同時利用が D1 の制約を超えた
