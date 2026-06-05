import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    screenshot: "only-on-failure",
    // E2Eはモバイルレイアウト（下部ナビ＋MiniPlayer）を検証する。
    // デフォルト1280pxはPC(lg)判定になり別レイアウトになるため、モバイル幅を固定する。
    viewport: { width: 414, height: 896 },
  },
  webServer: {
    command: "npm run dev",
    port: 5173,
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
