import { createMiddleware } from "@tanstack/react-start";

import { authenticate, authFailureResponse } from "./authenticate";

/**
 * 全リクエストの認証（src/start.ts の requestMiddleware）。
 * 認証できなければ 403（公開鍵を取得できないときは 503）。できれば context.scope に世帯スコープを入れる。
 * ログには失敗の種別だけを出す（メールは出さない）。
 */
export const authMiddleware = createMiddleware().server(async ({ request, next }) => {
  const { appEnv, db } = await import("@/server/runtime");
  const result = await authenticate(request, appEnv, db);
  if (!result.ok) {
    console.warn(JSON.stringify({ event: "auth_failed", reason: result.reason }));
    return authFailureResponse(result.reason);
  }
  return next({ context: { scope: result.scope } });
});
