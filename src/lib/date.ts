import { Temporal } from "temporal-polyfill";

// 日付・日時はここだけで扱う（SPEC 001 §5）。Date とブラウザ組み込みの Temporal は使わない。

/** 今日（JST の暦日）を YYYY-MM-DD で返す */
export const todayJst = (): string => Temporal.Now.plainDateISO("Asia/Tokyo").toString();

/** 現在の日時を UTC の ISO 文字列で返す（created_at などに使う） */
export const nowUtcIso = (): string => Temporal.Now.instant().toString();
