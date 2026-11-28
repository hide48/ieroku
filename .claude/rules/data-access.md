---
paths:
  - "src/server/**"
  - "src/routes/**"
---

# データアクセスのルール

- DB へのクエリは `src/server/data/` の関数経由のみ。`drizzle-orm` の import は `src/server/data/` の中だけ（lint で制限）
- すべてのデータアクセス関数は世帯 ID を必須引数に取り、すべてのクエリの条件に含める（D1 には RLS がない）
  - 例外は世帯を特定する前の 2 つだけ: 認証でメールから世帯を探す `resolveScopeByEmail`（import は `src/server/auth/` のみ。lint で制限）と、通知の Cron で世帯 ID の一覧だけを返す関数。どちらも世帯のデータ本体は返さない
- スコープに結び付いた DB クライアント（`src/server/data/internal.ts` の `dbOf`）は data 層の中だけで使う。スコープのオブジェクトに DB を持たせない（lint で制限）
- 世帯 ID はリクエストの入力から受け取らない。Access の JWT から特定した利用者の世帯を使う
- 新しいデータアクセス関数・サーバー関数には「他の世帯のデータを読み書きできない」ことのテストを付ける
- マイグレーションは元に戻せる形にする（列の削除・型変更は段階的に行う）
