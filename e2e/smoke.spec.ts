import { expect, test } from "@playwright/test";

// 土台（SPEC 001 §8 PR 1）: ローカルの認証（DEV_AUTH_EMAIL → users → 世帯）を通ってトップが表示される
test("トップページが表示される", async ({ page }, testInfo) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("家録");
  // PR の証拠用（/verify）。test-results/ は .gitignore 済み
  await page.screenshot({ path: `test-results/screenshots/${testInfo.project.name}-top.png` });
});

test("画面が横にはみ出さない", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
