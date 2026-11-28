import * as z from "zod";

// 環境変数の検証（.claude/rules/env-auth.md）。不正なら起動を止める。
// エラーメッセージにはキー名だけを出し、値（メールなど）は出さない。

const optionalString = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

const baseSchema = z.object({
  APP_ENV: z.enum(["development", "production"]),
  /** 例: myteam.cloudflareaccess.com */
  CF_ACCESS_TEAM_DOMAIN: optionalString.pipe(
    z
      .string()
      .regex(/^[a-z0-9-]+\.cloudflareaccess\.com$/)
      .optional(),
  ),
  CF_ACCESS_AUD: optionalString,
  DEV_AUTH_EMAIL: optionalString.pipe(z.email().optional()),
});

export type AppEnv =
  | {
      readonly appEnv: "production";
      readonly access: { readonly teamDomain: string; readonly aud: string };
      readonly devAuthEmail: undefined;
    }
  | {
      readonly appEnv: "development";
      readonly access: { readonly teamDomain: string; readonly aud: string } | undefined;
      readonly devAuthEmail: string | undefined;
    };

export class EnvError extends Error {
  override name = "EnvError";
}

/** Worker の env を検証して、アプリが使う形にする。不正なら EnvError を投げる */
export function parseEnv(raw: unknown): AppEnv {
  const parsed = baseSchema.safeParse(raw);
  if (!parsed.success) {
    const keys = [...new Set(parsed.error.issues.map((i) => i.path.join(".")))].join(", ");
    throw new EnvError(`環境変数が不正です: ${keys}`);
  }
  const e = parsed.data;
  const hasTeam = e.CF_ACCESS_TEAM_DOMAIN !== undefined;
  const hasAud = e.CF_ACCESS_AUD !== undefined;
  if (hasTeam !== hasAud) {
    throw new EnvError("CF_ACCESS_TEAM_DOMAIN と CF_ACCESS_AUD は両方設定してください");
  }
  const access = hasTeam
    ? { teamDomain: e.CF_ACCESS_TEAM_DOMAIN!, aud: e.CF_ACCESS_AUD! }
    : undefined;

  if (e.APP_ENV === "production") {
    // ローカル用の認証の抜け道を本番で有効にしない（ADR 0003）
    if (e.DEV_AUTH_EMAIL !== undefined) {
      throw new EnvError("APP_ENV=production では DEV_AUTH_EMAIL を設定できません");
    }
    if (!access) {
      throw new EnvError(
        "APP_ENV=production では CF_ACCESS_TEAM_DOMAIN と CF_ACCESS_AUD が必須です",
      );
    }
    return { appEnv: "production", access, devAuthEmail: undefined };
  }
  if (!access && e.DEV_AUTH_EMAIL === undefined) {
    throw new EnvError("CF_ACCESS_* か DEV_AUTH_EMAIL のどちらかを設定してください");
  }
  return {
    appEnv: "development",
    access,
    devAuthEmail: e.DEV_AUTH_EMAIL?.toLowerCase(),
  };
}
