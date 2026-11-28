import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTVerifyGetKey } from "jose";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";

import type { AppEnv } from "@/server/env";
import { createTestDb, insertHousehold, type TestDb } from "@/test/d1";

import { authenticate, authFailureResponse } from "./authenticate";

const HOUSEHOLD_A = "00000000-0000-4000-8000-00000000000a";
const HOUSEHOLD_B = "00000000-0000-4000-8000-00000000000b";
const USER_A = "00000000-0000-4000-8000-0000000000a1";
const USER_B = "00000000-0000-4000-8000-0000000000b1";

const access = { teamDomain: "myteam.cloudflareaccess.com", aud: "aud-tag" };
const prodEnv: AppEnv = { appEnv: "production", access, devAuthEmail: undefined };
const devEnv: AppEnv = { appEnv: "development", access, devAuthEmail: "a@example.com" };

let t: TestDb;
let privateKey: CryptoKey;
let getKey: JWTVerifyGetKey;

const sign = (email: string) =>
  new SignJWT({ email })
    .setProtectedHeader({ alg: "RS256", kid: "k1" })
    .setIssuer(`https://${access.teamDomain}`)
    .setAudience(access.aud)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);

const req = (headers: Record<string, string> = {}, url = "https://app.example.test/items") =>
  new Request(url, { headers });

beforeAll(async () => {
  t = await createTestDb();
  await insertHousehold(t.d1, {
    householdId: HOUSEHOLD_A,
    users: [{ id: USER_A, email: "a@example.com" }],
  });
  await insertHousehold(t.d1, {
    householdId: HOUSEHOLD_B,
    users: [{ id: USER_B, email: "b@example.com" }],
  });
  const pair = await generateKeyPair("RS256");
  privateKey = pair.privateKey;
  getKey = createLocalJWKSet({
    keys: [{ ...(await exportJWK(pair.publicKey)), kid: "k1", alg: "RS256" }],
  });
});

afterAll(() => t.dispose());

describe("authenticate", () => {
  test("正しい JWT のメールから、その利用者の世帯のスコープを作る", async () => {
    const r = await authenticate(
      req({ "Cf-Access-Jwt-Assertion": await sign("A@Example.com") }),
      prodEnv,
      t.db,
      getKey,
    );
    expect(r.ok && { householdId: r.scope.householdId, userId: r.scope.userId }).toEqual({
      householdId: HOUSEHOLD_A,
      userId: USER_A,
    });
  });

  test("世帯 B の利用者は世帯 B のスコープになる（入力で世帯を選べない）", async () => {
    const r = await authenticate(
      req(
        { "Cf-Access-Jwt-Assertion": await sign("b@example.com"), "X-Household-Id": HOUSEHOLD_A },
        `https://app.example.test/items?householdId=${HOUSEHOLD_A}`,
      ),
      prodEnv,
      t.db,
      getKey,
    );
    expect(r.ok && r.scope.householdId).toBe(HOUSEHOLD_B);
  });

  test("JWT がなければ拒否する", async () => {
    expect(await authenticate(req(), prodEnv, t.db, getKey)).toEqual({
      ok: false,
      reason: "no_token",
    });
  });

  test("不正な JWT は拒否する", async () => {
    const r = await authenticate(
      req({ "Cf-Access-Jwt-Assertion": "garbage" }),
      prodEnv,
      t.db,
      getKey,
    );
    expect(r).toEqual({ ok: false, reason: "invalid_token" });
  });

  test("未登録のメールは拒否する", async () => {
    const r = await authenticate(
      req({ "Cf-Access-Jwt-Assertion": await sign("stranger@example.com") }),
      prodEnv,
      t.db,
      getKey,
    );
    expect(r).toEqual({ ok: false, reason: "unknown_user" });
  });

  test("ローカル: JWT がなくても localhost なら DEV_AUTH_EMAIL の利用者になる", async () => {
    const r = await authenticate(req({}, "http://localhost:3000/"), devEnv, t.db, getKey);
    expect(r.ok && r.scope.householdId).toBe(HOUSEHOLD_A);
  });

  test("ローカル設定でも localhost 以外へのリクエストでは DEV_AUTH_EMAIL を使わない", async () => {
    const r = await authenticate(
      req({}, "https://ieroku.example.workers.dev/"),
      devEnv,
      t.db,
      getKey,
    );
    expect(r).toEqual({ ok: false, reason: "no_token" });
  });

  test("本番では localhost でも DEV_AUTH_EMAIL を使わない", async () => {
    const env = { ...prodEnv, devAuthEmail: "a@example.com" } as unknown as AppEnv;
    const r = await authenticate(req({}, "http://localhost:3000/"), env, t.db, getKey);
    expect(r).toEqual({ ok: false, reason: "no_token" });
  });

  test("403 の本文に理由やメールを出さない", async () => {
    for (const reason of ["no_token", "invalid_token", "unknown_user"] as const) {
      const res = authFailureResponse(reason);
      expect(res.status).toBe(403);
      expect(await res.text()).toBe("Forbidden");
    }
  });

  test("公開鍵を取得できないときは 503（障害として区別する）", async () => {
    const failingGetKey: JWTVerifyGetKey = () => Promise.reject(new TypeError("fetch failed"));
    const r = await authenticate(
      req({ "Cf-Access-Jwt-Assertion": await sign("a@example.com") }),
      prodEnv,
      t.db,
      failingGetKey,
    );
    expect(r).toEqual({ ok: false, reason: "jwks_unavailable" });
    expect(authFailureResponse("jwks_unavailable").status).toBe(503);
  });
});
