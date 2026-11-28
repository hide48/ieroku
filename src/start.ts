import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

import { authMiddleware } from "@/server/auth/middleware";

// 全リクエストに認証をかける。context.scope の型は src/routeTree.gen.ts が Register に登録する。
// startInstance を定義すると TanStack Start の既定の CSRF 対策（サーバー関数の Origin 確認）が
// 外れるため、同じ設定を明示的に入れる（他のサイトから利用者のブラウザ経由でサーバー関数を呼ばせない）
export const startInstance = createStart(() => ({
  requestMiddleware: [
    createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" }),
    authMiddleware,
  ],
}));
