# 画面とサーバー関数（src/routes/）のルール

- UI は shadcn/ui（Base UI）+ Tailwind。部品の追加（`shadcn add`）はひでに依頼する。追加された部品は modern-web-guidance に合わせて書き換えない
- 日付はブラウザ標準の `<input type="date">` を使う（スマホのネイティブのピッカーを出すため）
- フォームは TanStack Form + Zod。Zod のスキーマはサーバー側の検証と共有する
- アイコンは lucide、フォントは system-ui（Web フォントは読み込まない）
- カメラ撮影は `<input type="file" accept="image/*" capture>` を使う
- データは必ずサーバー（D1・R2）に保存する。iOS Safari は端末側のデータを消すことがあるため、端末には一時キャッシュしか置かない
- サーバー関数から DB を直接触らない。`src/server/data/` の関数を呼ぶ
