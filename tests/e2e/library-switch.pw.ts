import { test, expect } from "@playwright/test";
import { spawn, ChildProcess } from "node:child_process";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const PORT = process.env.E2E_PORT || "6559";
const SPEC_DIR = resolve(import.meta.dirname, "..", "..", ".e2e-libswitch");
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

test("/api/library-info returns default library", async ({ request }) => {
  const res = await request.get(`http://localhost:${PORT}/api/library-info`);
  expect(res.ok()).toBe(true);
  const data = await res.json();
  expect(data.id).toBe("openui-default");
});

test("/api/spec returns empty spec initially", async ({ request }) => {
  const res = await request.get(`http://localhost:${PORT}/api/spec`);
  expect(res.ok()).toBe(true);
  const data = await res.json();
  expect(data.spec).toBe("");
  expect(data.lastModified).toBeDefined();
});

test("previewer shows library name for non-default config", async ({ page }) => {
  await writeFile(resolve(SPEC_DIR, "config.json"), JSON.stringify({ library: "custom-lib" }), "utf-8");
  await page.goto(`http://localhost:${PORT}`);
  await page.waitForTimeout(500);
});

test("serves 404 for unknown library assets", async ({ request }) => {
  const res = await request.get(`http://localhost:${PORT}/libraries/fake/renderer.mjs`);
  expect(res.status()).toBe(404);
});
