import { describe, expect, test } from "vite-plus/test";

import { EnvError, parseEnv } from "./env";

const access = { CF_ACCESS_TEAM_DOMAIN: "myteam.cloudflareaccess.com", CF_ACCESS_AUD: "aud-tag" };

describe("parseEnv", () => {
  test("本番: Access の設定があれば通る", () => {
    expect(parseEnv({ APP_ENV: "production", ...access })).toEqual({
      appEnv: "production",
      access: { teamDomain: "myteam.cloudflareaccess.com", aud: "aud-tag" },
      devAuthEmail: undefined,
    });
  });

  test("本番で DEV_AUTH_EMAIL が設定されていたら起動を止める", () => {
    expect(() =>
      parseEnv({ APP_ENV: "production", ...access, DEV_AUTH_EMAIL: "test@example.com" }),
    ).toThrow(EnvError);
  });

  test("本番で DEV_AUTH_EMAIL が不正な値でも起動を止める", () => {
    expect(() => parseEnv({ APP_ENV: "production", ...access, DEV_AUTH_EMAIL: "x" })).toThrow(
      EnvError,
    );
  });

  test("本番で DEV_AUTH_EMAIL が空文字なら未設定とみなす", () => {
    expect(parseEnv({ APP_ENV: "production", ...access, DEV_AUTH_EMAIL: "" }).devAuthEmail).toBe(
      undefined,
    );
  });

  test("本番で Access の設定がなければ起動を止める", () => {
    expect(() => parseEnv({ APP_ENV: "production" })).toThrow(EnvError);
    expect(() =>
      parseEnv({ APP_ENV: "production", CF_ACCESS_TEAM_DOMAIN: "", CF_ACCESS_AUD: "" }),
    ).toThrow(EnvError);
    expect(() =>
      parseEnv({ APP_ENV: "production", CF_ACCESS_TEAM_DOMAIN: access.CF_ACCESS_TEAM_DOMAIN }),
    ).toThrow(EnvError);
  });

  test("APP_ENV がない・不明な値なら起動を止める", () => {
    expect(() => parseEnv({ ...access })).toThrow(EnvError);
    expect(() => parseEnv({ APP_ENV: "staging", ...access })).toThrow(EnvError);
  });

  test("チームドメインの形式が違えば起動を止める", () => {
    expect(() =>
      parseEnv({ APP_ENV: "production", ...access, CF_ACCESS_TEAM_DOMAIN: "evil.example.com" }),
    ).toThrow(EnvError);
  });

  test("ローカル: DEV_AUTH_EMAIL だけで起動でき、小文字にする", () => {
    expect(parseEnv({ APP_ENV: "development", DEV_AUTH_EMAIL: "Test@Example.com" })).toEqual({
      appEnv: "development",
      access: undefined,
      devAuthEmail: "test@example.com",
    });
  });

  test("ローカル: 認証の手段が何もなければ起動を止める", () => {
    expect(() => parseEnv({ APP_ENV: "development" })).toThrow(EnvError);
  });

  test("エラーメッセージに値を出さない", () => {
    try {
      parseEnv({ APP_ENV: "development", DEV_AUTH_EMAIL: "not-an-email-secret" });
      expect.unreachable();
    } catch (e) {
      expect(String(e)).toContain("DEV_AUTH_EMAIL");
      expect(String(e)).not.toContain("not-an-email-secret");
    }
  });
});
