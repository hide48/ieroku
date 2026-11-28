import { describe, expect, test } from "vite-plus/test";

import {
  buildCountExistingUsersSql,
  buildRegisterHouseholdSql,
  emailsSchema,
} from "./household-sql";

const rows = {
  householdId: "00000000-0000-4000-8000-00000000000a",
  users: [{ id: "00000000-0000-4000-8000-0000000000a1", email: "a@example.com" }],
  createdAt: "2026-11-28T00:00:00Z",
};

describe("emailsSchema", () => {
  test("小文字にそろえる", () => {
    expect(emailsSchema.parse(["A@Example.com"])).toEqual(["a@example.com"]);
  });
  test("空・不正・重複は拒否する", () => {
    expect(emailsSchema.safeParse([]).success).toBe(false);
    expect(emailsSchema.safeParse(["not-email"]).success).toBe(false);
    expect(emailsSchema.safeParse(["a@example.com", "A@example.com"]).success).toBe(false);
  });
});

describe("buildRegisterHouseholdSql", () => {
  test("世帯と利用者を作る", () => {
    expect(buildRegisterHouseholdSql(rows)).toBe(
      "INSERT INTO households (id, created_at) VALUES ('00000000-0000-4000-8000-00000000000a', '2026-11-28T00:00:00Z');\n" +
        "INSERT INTO users (id, household_id, email, created_at) VALUES ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-00000000000a', 'a@example.com', '2026-11-28T00:00:00Z');\n",
    );
  });
  test("シード用は INSERT OR IGNORE にする", () => {
    expect(buildRegisterHouseholdSql(rows, { orIgnore: true })).toContain(
      "INSERT OR IGNORE INTO users",
    );
  });
  test("引用符はエスケープする", () => {
    expect(buildCountExistingUsersSql(["o'neil@example.com"])).toContain("'o''neil@example.com'");
  });
});
