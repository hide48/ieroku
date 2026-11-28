import { exportJWK, generateKeyPair, SignJWT, createLocalJWKSet, type JWTVerifyGetKey } from "jose";
import { beforeAll, describe, expect, test } from "vite-plus/test";

import { verifyAccessJwt } from "./access-jwt";

const config = { teamDomain: "myteam.cloudflareaccess.com", aud: "aud-tag" };
const issuer = `https://${config.teamDomain}`;

let privateKey: CryptoKey;
let otherPrivateKey: CryptoKey;
let getKey: JWTVerifyGetKey;

beforeAll(async () => {
  const pair = await generateKeyPair("RS256");
  const other = await generateKeyPair("RS256");
  privateKey = pair.privateKey;
  otherPrivateKey = other.privateKey;
  const jwk = { ...(await exportJWK(pair.publicKey)), kid: "k1", alg: "RS256" };
  getKey = createLocalJWKSet({ keys: [jwk] });
});

type SignOpts = {
  key?: CryptoKey;
  iss?: string;
  aud?: string;
  exp?: string | number;
  claims?: Record<string, unknown>;
};

const sign = ({
  key = privateKey,
  iss = issuer,
  aud = config.aud,
  exp = "5m",
  claims,
}: SignOpts = {}) =>
  new SignJWT({ email: "User@Example.com", ...claims })
    .setProtectedHeader({ alg: "RS256", kid: "k1" })
    .setIssuer(iss)
    .setAudience(aud)
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(key);

describe("verifyAccessJwt", () => {
  test("正しい JWT ならメールを小文字で返す", async () => {
    expect(await verifyAccessJwt(await sign(), config, getKey)).toEqual({
      ok: true,
      email: "user@example.com",
    });
  });

  test("別の鍵で署名された JWT は拒否する", async () => {
    const r = await verifyAccessJwt(await sign({ key: otherPrivateKey }), config, getKey);
    expect(r.ok).toBe(false);
  });

  test("AUD が違えば拒否する", async () => {
    const r = await verifyAccessJwt(await sign({ aud: "other-app" }), config, getKey);
    expect(r.ok).toBe(false);
  });

  test("発行者が違えば拒否する", async () => {
    const r = await verifyAccessJwt(
      await sign({ iss: "https://evil.cloudflareaccess.com" }),
      config,
      getKey,
    );
    expect(r.ok).toBe(false);
  });

  test("期限切れなら拒否する", async () => {
    const past = Math.floor(Date.now() / 1000) - 120;
    const r = await verifyAccessJwt(await sign({ exp: past }), config, getKey);
    expect(r.ok).toBe(false);
  });

  test("email がなければ拒否する", async () => {
    const r = await verifyAccessJwt(await sign({ claims: { email: undefined } }), config, getKey);
    expect(r.ok).toBe(false);
  });

  test("alg=none の JWT は拒否する", async () => {
    const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    const token = `${enc({ alg: "none" })}.${enc({ email: "user@example.com", iss: issuer, aud: config.aud, iat: now, exp: now + 300 })}.`;
    const r = await verifyAccessJwt(token, config, getKey);
    expect(r.ok).toBe(false);
  });

  test("HS256（公開鍵を共通鍵として使う攻撃）の JWT は拒否する", async () => {
    const token = await new SignJWT({ email: "user@example.com" })
      .setProtectedHeader({ alg: "HS256", kid: "k1" })
      .setIssuer(issuer)
      .setAudience(config.aud)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(new TextEncoder().encode("x".repeat(32)));
    const r = await verifyAccessJwt(token, config, getKey);
    expect(r.ok).toBe(false);
  });

  test("壊れた文字列は拒否する", async () => {
    expect((await verifyAccessJwt("not-a-jwt", config, getKey)).ok).toBe(false);
  });
});
