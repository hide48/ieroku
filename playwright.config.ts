import { defineConfig, devices } from "@playwright/test";

// E2E（`pnpm e2e`）。スマホ幅の Chromium（Android 想定）と WebKit（iPhone 想定）、PC 幅の Chromium。
// ダミーデータの投入は `pnpm e2e` が先に行う（起動済みのサーバーを再利用するときも入るように）。
// 認証は .dev.vars の DEV_AUTH_EMAIL（dev-vars.example と同じ test@example.com）を使う。

const PORT = 3000;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: 0,
  reporter: process.env["CI"] ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "android-chromium", use: { ...devices["Pixel 7"] } },
    { name: "iphone-webkit", use: { ...devices["iPhone 15"] } },
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env["CI"],
    timeout: 120_000,
  },
});
