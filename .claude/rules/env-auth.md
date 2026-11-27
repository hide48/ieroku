---
paths:
  - "src/server/**"
  - "wrangler.jsonc"
  - "dev-vars.example"
---

# 環境変数と認証のルール

- 環境変数は起動時に Zod で検証し、不正なら起動を止める
- `APP_ENV=production` で `DEV_AUTH_EMAIL` が設定されていたら起動を止める（テストで担保する）
- Access の JWT（`Cf-Access-Jwt-Assertion`）は、チームドメインの公開鍵と AUD タグで検証する。検証処理には単体テストを付ける
- 秘密の値は `.dev.vars`（ローカル）と `wrangler secret`（本番、GitHub Actions のみ）に置く。`wrangler.jsonc` の `vars` には秘密でない値だけを書く
