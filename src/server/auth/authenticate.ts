import type { JWTVerifyGetKey } from "jose";

import type { Db } from "@/server/data/db";
import { resolveScopeByEmail, type HouseholdScope } from "@/server/data/scope";
import type { AppEnv } from "@/server/env";

import { ACCESS_JWT_HEADER, verifyAccessJwt } from "./access-jwt";

export type AuthFailure = "no_token" | "invalid_token" | "jwks_unavailable" | "unknown_user";

export type AuthResult =
  | { readonly ok: true; readonly scope: HouseholdScope }
  | { readonly ok: false; readonly reason: AuthFailure };

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * リクエストから利用者を特定し、世帯スコープを作る。
 * JWT → メール → users → 世帯 ID。世帯 ID はリクエストの入力から受け取らない（SPEC 001 §6）。
 * DEV_AUTH_EMAIL は APP_ENV=development かつ localhost へのリクエストのときだけ使う。
 */
export async function authenticate(
  request: Request,
  env: AppEnv,
  db: Db,
  getKey?: JWTVerifyGetKey,
): Promise<AuthResult> {
  let email: string;
  const token = request.headers.get(ACCESS_JWT_HEADER);

  if (token) {
    if (!env.access) return { ok: false, reason: "invalid_token" };
    const verified = await verifyAccessJwt(token, env.access, getKey);
    if (!verified.ok) {
      return {
        ok: false,
        reason: verified.reason === "jwks_unavailable" ? "jwks_unavailable" : "invalid_token",
      };
    }
    email = verified.email;
  } else if (
    env.appEnv === "development" &&
    env.devAuthEmail !== undefined &&
    LOCAL_HOSTNAMES.has(new URL(request.url).hostname)
  ) {
    email = env.devAuthEmail;
  } else {
    return { ok: false, reason: "no_token" };
  }

  const scope = await resolveScopeByEmail(db, email);
  if (!scope) return { ok: false, reason: "unknown_user" };
  return { ok: true, scope };
}

/**
 * 認証できなかったときの応答。本文に理由やメールを出さない。
 * 公開鍵を取得できない（障害）ときだけ 503、それ以外は 403。
 */
export const authFailureResponse = (reason: AuthFailure): Response =>
  reason === "jwks_unavailable"
    ? new Response("Service Unavailable", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      })
    : new Response("Forbidden", {
        status: 403,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      });
