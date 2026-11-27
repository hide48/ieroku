# ieroku（家録）

新築戸建ての住宅管理 Web アプリ（家電・住宅設備・家具の保証、契約書類、間取り、点検履歴）。

- 開発の方針とルール: [CLAUDE.md](./CLAUDE.md)
- 設計判断: [docs/adr/](./docs/adr/)
- 機能の仕様: [docs/specs/](./docs/specs/)

## セットアップ（WSL2 内）

```sh
mise trust && mise install   # Node.js 26 / pnpm 11
pnpm install                 # 7 日待機・ビルドスクリプト許可制（pnpm-workspace.yaml）
cp dev-vars.example .dev.vars # ダミー値のみを入れる
pnpm dev
```
