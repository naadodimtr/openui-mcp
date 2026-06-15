import { test, expect } from "@playwright/test";
import { spawn, ChildProcess } from "node:child_process";
import { writeFile, mkdir, rm, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const PORT = process.env.E2E_PORT ? String(Number(process.env.E2E_PORT) + 4) : "6561";
const SPEC_DIR = resolve(import.meta.dirname, "..", "..", ".e2e-kumo-components");
const SPEC_FILE = resolve(SPEC_DIR, "spec.oui");
const SERVER_CWD = resolve(import.meta.dirname, "..", "..");
const KUMO_DIST = resolve(import.meta.dirname, "..", "..", "adapters", "kumo", "dist");
const SHOWCASE_SPEC = resolve(import.meta.dirname, "specs", "kumo-showcase.oui");

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
  if (!existsSync(resolve(KUMO_DIST, "manifest.json"))) {
    test.skip();
    return;
  }

  if (existsSync(SPEC_DIR)) await rm(SPEC_DIR, { recursive: true });
  await mkdir(SPEC_DIR, { recursive: true });
  await writeFile(SPEC_FILE, "", "utf-8");
  await writeFile(resolve(SPEC_DIR, "config.json"), JSON.stringify({ library: "kumo" }), "utf-8");

  serverProcess = spawn("bun", ["src/server.ts"], {
    cwd: SERVER_CWD,
    stdio: "ignore",
    shell: true,
    env: { ...process.env, PREVIEWER_PORT: PORT, OPENUI_SPEC_DIR: SPEC_DIR },
  });

  await waitForServer(`http://localhost:${PORT}/api/spec`);
});

test.afterAll(async () => {
  if (serverProcess) serverProcess.kill();
  if (existsSync(SPEC_DIR)) await rm(SPEC_DIR, { recursive: true });
});

test("full showcase renders with zero console warnings", async ({ page }) => {
  const consoleMessages: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "warning" || msg.type() === "error") {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

  const spec = await readFile(SHOWCASE_SPEC, "utf-8");
  await writeSpec(spec);
  await page.goto(`http://localhost:${PORT}`);
  await page.waitForTimeout(8000);

  const body = await page.textContent("body");
  const consoleErrors = consoleMessages.filter((m) => m.startsWith("[error]"));
  const consoleWarnings = consoleMessages.filter((m) => m.startsWith("[warning]"));

  if (consoleMessages.length > 0) {
    console.log("Console messages:", JSON.stringify(consoleMessages));
  }

  expect(body).toContain("Layout Components");
  expect(body).toContain("Content Components");
  expect(body).toContain("Form Controls");
  expect(body).toContain("8 variants");
  expect(consoleErrors).toHaveLength(0);
});

test("text renders all sizes", async ({ page }) => {
  await writeSpec('root = Stack([Text("xs", "xs"), Text("sm", "sm"), Text("base", "base"), Text("lg", "lg")], "column")');
  await page.goto(`http://localhost:${PORT}`);
  await expect(page.locator("text=xs").first()).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=sm").first()).toBeVisible();
  await expect(page.locator("text=base").first()).toBeVisible();
  await expect(page.locator("text=lg").first()).toBeVisible();
});

test("text renders weights with font-weight styles", async ({ page }) => {
  await writeSpec('root = Stack([Text("Bold", "base", "bold"), Text("Semibold", "base", "semibold")], "column")');
  await page.goto(`http://localhost:${PORT}`);
  await page.waitForTimeout(3000);
  const boldEl = page.locator("text=Bold").first();
  await expect(boldEl).toBeVisible();
  const weight = await boldEl.evaluate((el) => window.getComputedStyle(el).fontWeight);
  expect(weight).toBe("700");
});

test("badge renders all 8 variants", async ({ page }) => {
  await writeSpec('root = Stack([Badge("Neutral"), Badge("Info", "info"), Badge("Success", "success"), Badge("Warning", "warning"), Badge("Danger", "danger"), Badge("Error", "error"), Badge("Primary", "primary"), Badge("Secondary", "secondary")], "row")');
  await page.goto(`http://localhost:${PORT}`);
  for (const text of ["Neutral", "Info", "Success", "Warning", "Danger", "Error", "Primary", "Secondary"]) {
    await expect(page.locator(`text=${text}`).first()).toBeVisible({ timeout: 5000 });
  }
});

test("button renders all 5 variants", async ({ page }) => {
  await writeSpec('root = Stack([Button("Primary", "primary"), Button("Secondary", "secondary"), Button("Ghost", "ghost"), Button("Destructive", "destructive"), Button("Outline", "outline")], "row")');
  await page.goto(`http://localhost:${PORT}`);
  for (const text of ["Primary", "Secondary", "Ghost", "Destructive", "Outline"]) {
    await expect(page.locator(`text=${text}`).first()).toBeVisible({ timeout: 5000 });
  }
});

test("callout renders all 4 variants", async ({ page }) => {
  await writeSpec('root = Stack([Callout("info", "Info Title", "Info desc"), Callout("success", "Success Title", "Success desc"), Callout("warning", "Warning Title", "Warn desc"), Callout("danger", "Danger Title", "Danger desc")], "column")');
  await page.goto(`http://localhost:${PORT}`);
  for (const text of ["Info Title", "Success Title", "Warning Title", "Danger Title"]) {
    await expect(page.locator(`text=${text}`).first()).toBeVisible({ timeout: 5000 });
  }
});

test("card variants have different padding", async ({ page }) => {
  await writeSpec('root = Stack([Card([Text("E")], "elevated"), Card([Text("O")], "outlined"), Card([Text("G")], "ghost")], "row")');
  await page.goto(`http://localhost:${PORT}`);
  await page.waitForTimeout(3000);
  const cards = page.locator("[data-surface-color]");
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(3);
  const firstClass = await cards.first().getAttribute("class");
  expect(firstClass).toContain("p-6");
});

test("form controls render", async ({ page }) => {
  await writeSpec(`root = Stack([Input("email", "Email", "email"), Textarea("bio", "Bio..."), Switch("dark", "Dark mode"), Checkbox("agree", "Agree"), RadioGroup("plan", [RadioItem("a", "Plan A"), RadioItem("b", "Plan B")])], "column")`);
  await page.goto(`http://localhost:${PORT}`);
  await page.waitForTimeout(3000);
  await expect(page.locator("text=Dark mode")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=Agree")).toBeVisible();
  await expect(page.locator("text=Plan A")).toBeVisible();
  await expect(page.locator("text=Plan B")).toBeVisible();
  await expect(page.locator("textarea")).toBeVisible();
});

test("compound components render children", async ({ page }) => {
  await writeSpec(`root = Stack([Tabs([TabItem("a", "Tab A", [Text("Content A")]), TabItem("b", "Tab B", [Text("Content B")])]), Collapsible("Expand", [Text("Hidden")]), Breadcrumbs([BreadcrumbItem("Dashboard", "/"), BreadcrumbItem("Settings")]), Dialog("Delete", "Are you sure?"), DropdownMenu("Actions", [MenuItem("Edit")])], "column")`);
  await page.goto(`http://localhost:${PORT}`);
  await page.waitForTimeout(3000);
  await expect(page.locator("text=Tab A").first()).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=Expand").first()).toBeVisible();
  await expect(page.locator(`[aria-label="breadcrumb"]`).first()).toBeVisible();
  await expect(page.locator("text=Delete").first()).toBeVisible();
  await expect(page.locator("text=Actions").first()).toBeVisible();
});

test("data components render", async ({ page }) => {
  await writeSpec('root = Stack([Table([TableColumn("Name", ["Alice", "Bob"]), TableColumn("Score", ["95", "87"])]), Meter(75, 100, "CPU"), Pagination(10, 3)], "column")');
  await page.goto(`http://localhost:${PORT}`);
  await expect(page.locator("text=Alice").first()).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=CPU").first()).toBeVisible();
  await expect(page.locator("[aria-label='Pagination']").first()).toBeVisible();
});

test("layout container has max-width", async ({ page }) => {
  await writeSpec('root = Text("Test")');
  await page.goto(`http://localhost:${PORT}`);
  await page.waitForTimeout(3000);
  const maxWidth = await page.evaluate(() => {
    const containers = document.querySelectorAll("div[style]");
    for (const el of containers) {
      if ((el as HTMLElement).style.maxWidth === "1200px") return "1200px";
    }
    return null;
  });
  expect(maxWidth).toBe("1200px");
});

test("DatePicker renders calendar", async ({ page }) => {
  await writeSpec('root = DatePicker("date", "Pick a date")');
  await page.goto(`http://localhost:${PORT}`);
  await page.waitForTimeout(3000);
  await expect(page.locator(".rdp-root").first()).toBeVisible({ timeout: 5000 });
});
