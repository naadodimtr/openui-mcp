import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "*.pw.ts",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: `http://localhost:${process.env.E2E_PORT || 6557}`,
    headless: true,
  },
});
