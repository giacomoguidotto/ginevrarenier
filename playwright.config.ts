import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: "bun run dev:fe",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_CLERK_UNSAFE_DISABLE_DEVELOPMENT_MODE_CONSOLE_WARNING: "true",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
