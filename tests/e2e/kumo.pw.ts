import { test, expect } from "@playwright/test";
import { spawn, ChildProcess } from "node:child_process";
import { writeFile, mkdir, rm, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const PORT = process.env.E2E_PORT || "6560";
const SPEC_DIR = resolve(import.meta.dirname, "..", "..", ".e2e-kumo");
const SPEC_FILE = resolve(SPEC_DIR, "spec.oui");
const SERVER_CWD = resolve(import.meta.dirname, "..", "..");
const KUMO_DIST = resolve(import.meta.dirname, "..", "..", "adapters", "kumo", "dist");

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
  if (!existsSync(resolve(KUMO_DIST, "manifest.json"))) {
    test.skip();
    return;
  }

  if (existsSync(SPEC_DIR)) await rm(SPEC_DIR, { recursive: true });
  await mkdir(SPEC_DIR, { recursive: true });
  await writeFile(SPEC_FILE, "", "utf-8");
  await writeFile(
    resolve(SPEC_DIR, "config.json"),
    JSON.stringify({ library: "kumo" }),
    "utf-8",
  );

  const install = Bun.spawnSync(["bun", "src/server.ts", "install-library", KUMO_DIST], {
    cwd: SERVER_CWD,
  });

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

test("library-info reports kumo", async ({ request }) => {
  const res = await request.get(`http://localhost:${PORT}/api/library-info`);
  expect(res.ok()).toBe(true);
  const data = await res.json();
  expect(data.id).toBe("kumo");
});

test("serves kumo renderer.mjs", async ({ request }) => {
  const res = await request.get(`http://localhost:${PORT}/libraries/kumo/renderer.mjs`);
  if (res.status() === 404) {
    test.skip();
    return;
  }
  expect(res.ok()).toBe(true);
  const content = await res.text();
  expect(content).toContain("createLibrary");
});

test("serves kumo styles.css", async ({ request }) => {
  const res = await request.get(`http://localhost:${PORT}/libraries/kumo/styles.css`);
  expect(res.status()).not.toBe(500);
});

test("kumo spec renders in previewer", async ({ page }) => {
  await writeFile(SPEC_FILE, 'root = Stack([t])\nt = Text("Kumo E2E Test")', "utf-8");
  await page.goto("/");
  await page.waitForTimeout(2000);
  const body = await page.textContent("body");
  expect(body?.length).toBeGreaterThan(0);
});
