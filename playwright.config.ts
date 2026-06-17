import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const runAuthenticated = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "public",
      testMatch: /public\.spec\.ts/,
    },
    ...(runAuthenticated
      ? [
          {
            name: "setup",
            testMatch: /auth\.setup\.ts/,
          },
          {
            name: "authenticated",
            testMatch: /authenticated\.spec\.ts/,
            dependencies: ["setup"],
            use: {
              ...devices["Desktop Chrome"],
              storageState: "playwright/.auth/user.json",
            },
          },
        ]
      : []),
  ],
  webServer: {
    command: "npm run start -- --port 3100 --hostname 127.0.0.1",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_APP_URL: baseURL,
    },
  },
});
