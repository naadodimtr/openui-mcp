import { test, expect } from "@playwright/test";
import { spawn, ChildProcess } from "node:child_process";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const PORT = process.env.E2E_PORT || "6558";
const SPEC_DIR = resolve(import.meta.dirname, "..", "..", ".e2e-error");
const SPEC_FILE = resolve(SPEC_DIR, "spec.oui");
const SERVER_CWD = resolve(import.meta.dirname, "..", "..");

let serverProcess: ChildProcess;

async function waitForServer(url: string, timeout = 15000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Server at ${url} did not start within ${timeout}ms`);
}

async function writeSpec(spec: string) {
  await writeFile(SPEC_FILE, spec, "utf-8");
  await new Promise((r) => setTimeout(r, 700));
}

test.beforeAll(async () => {
  if (existsSync(SPEC_DIR)) await rm(SPEC_DIR, { recursive: true });
  await mkdir(SPEC_DIR, { recursive: true });
  await writeFile(SPEC_FILE, "", "utf-8");

  serverProcess = spawn("bun", ["src/server.ts"], {
    cwd: SERVER_CWD,
    stdio: "ignore",
    shell: true,
    env: {
      ...process.env,
      PREVIEWER_PORT: PORT,
      OPENUI_SPEC_DIR: SPEC_DIR,
    },
  });

  await waitForServer(`http://localhost:${PORT}/api/spec`);
});

test.afterAll(async () => {
  if (serverProcess) serverProcess.kill();
  if (existsSync(SPEC_DIR)) await rm(SPEC_DIR, { recursive: true });
});

test("unknown component degrades gracefully (no crash)", async ({ page }) => {
  await writeSpec('root = Stack([item])\nitem = FakeComponent("broken")');
  await page.goto(`http://localhost:${PORT}`);
  await page.waitForTimeout(2000);
  const crashed = await page.locator("text=Application error").isVisible().catch(() => false);
  expect(crashed).toBe(false);
});

test("valid spec renders after empty spec", async ({ page }) => {
  await writeSpec('root = Stack([t])\nt = TextContent("After Empty")');
  await page.goto(`http://localhost:${PORT}`);
  await expect(page.locator("text=After Empty")).toBeVisible({ timeout: 5000 });
});

test("spec replacement works correctly", async ({ page }) => {
  await writeSpec('root = Stack([t])\nt = TextContent("First Version")');
  await page.goto(`http://localhost:${PORT}`);
  await expect(page.locator("text=First Version")).toBeVisible({ timeout: 5000 });

  await writeSpec('root = Stack([t])\nt = TextContent("Second Version")');
  await expect(page.locator("text=Second Version")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=First Version")).not.toBeVisible();
});
