import { env as workerEnv } from "cloudflare:workers";

import { createDb, type Db } from "@/server/data/db";
import { parseEnv, type AppEnv } from "@/server/env";

// Worker の env を検証した結果。src/server.ts の読み込み時に検証するため、不正なら Worker が起動しない。
export const appEnv: AppEnv = parseEnv(workerEnv);

export const db: Db = createDb(workerEnv.DB);
