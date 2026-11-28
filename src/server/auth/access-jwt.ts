import { createRemoteJWKSet, errors, jwtVerify, type JWTVerifyGetKey } from "jose";

// Cloudflare Access の JWT（Cf-Access-Jwt-Assertion）を、チームドメインの公開鍵と AUD で検証する（ADR 0003）。

export const ACCESS_JWT_HEADER = "Cf-Access-Jwt-Assertion";

export type AccessConfig = { readonly teamDomain: string; readonly aud: string };

const jwksCache = new Map<string, JWTVerifyGetKey>();

/** チームドメインの公開鍵（JWKS）。jose が取得結果をキャッシュし、鍵の更新にも追従する */
export function accessJwks(teamDomain: string): JWTVerifyGetKey {
  let jwks = jwksCache.get(teamDomain);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`));
    jwksCache.set(teamDomain, jwks);
  }
  return jwks;
}

/** トークンの中身が原因のエラー。鍵の ID が一致しないもの（偽造の可能性）も含める */
const TOKEN_ERRORS = [
  errors.JWSInvalid,
  errors.JWTInvalid,
  errors.JWSSignatureVerificationFailed,
  errors.JWTClaimValidationFailed,
  errors.JWTExpired,
  errors.JOSEAlgNotAllowed,
  errors.JOSENotSupported,
  errors.JWKSNoMatchingKey,
  errors.JWKSMultipleMatchingKeys,
] as const;

export type VerifyResult =
  | { readonly ok: true; readonly email: string }
  | { readonly ok: false; readonly reason: "invalid" | "jwks_unavailable" };

/**
 * JWT を検証してメール（小文字）を返す。
 * 署名（RS256）・発行者（チームドメイン）・AUD・有効期限を確認する。失敗の理由はログ用の種別のみ。
 */
export async function verifyAccessJwt(
  token: string,
  config: AccessConfig,
  getKey: JWTVerifyGetKey = accessJwks(config.teamDomain),
): Promise<VerifyResult> {
  try {
    const { payload } = await jwtVerify(token, getKey, {
      issuer: `https://${config.teamDomain}`,
      audience: config.aud,
      algorithms: ["RS256"],
      requiredClaims: ["exp", "iat", "email"],
    });
    const email = payload["email"];
    if (typeof email !== "string" || email.trim() === "") return { ok: false, reason: "invalid" };
    return { ok: true, email: email.trim().toLowerCase() };
  } catch (e) {
    // トークン自体の問題なら invalid。それ以外（公開鍵の取得失敗・通信エラーなど）は障害として扱う
    if (TOKEN_ERRORS.some((E) => e instanceof E)) return { ok: false, reason: "invalid" };
    return { ok: false, reason: "jwks_unavailable" };
  }
}
