import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema";

/** D1 の Drizzle クライアント。作れるのは data 層の中だけで、外には HouseholdScope 経由で渡す */
export const createDb = (d1: D1Database) => drizzle(d1, { schema });

export type Db = ReturnType<typeof createDb>;
