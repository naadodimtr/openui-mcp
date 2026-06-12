import { test, expect } from "@playwright/test";
import { spawn, ChildProcess } from "node:child_process";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const PORT = process.env.E2E_PORT || "6557";
const SPEC_DIR = resolve(import.meta.dirname, "..", "..", ".e2e-openui");
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

test("empty state shows placeholder", async ({ page }) => {
  await writeFile(SPEC_FILE, "", "utf-8");
  await page.goto("/");
  await expect(page.locator("text=Waiting for spec")).toBeVisible({ timeout: 5000 });
});

test("basic text content renders", async ({ page }) => {
  await writeSpec('root = Stack([text])\ntext = TextContent("Hello E2E Test")');
  await page.goto("/");
  await expect(page.locator("text=Hello E2E Test")).toBeVisible({ timeout: 5000 });
});

test("card with header renders", async ({ page }) => {
  await writeSpec(
    'root = Stack([card])\ncard = Card([header, body])\nheader = CardHeader("Test Card", "Subtitle here")\nbody = TextContent("Card body content")'
  );
  await page.goto("/");
  await expect(page.locator("text=Test Card")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=Subtitle here")).toBeVisible();
  await expect(page.locator("text=Card body content")).toBeVisible();
});

test("table renders with data", async ({ page }) => {
  await writeSpec(
    'root = Stack([tbl])\ntbl = Table([Col("Name", ["Alice", "Bob"]), Col("Score", [95, 87], "number")])'
  );
  await page.goto("/");
  await expect(page.locator("text=Alice")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=Bob")).toBeVisible();
  await expect(page.locator("text=95")).toBeVisible();
});

test("bar chart renders with labels", async ({ page }) => {
  await writeSpec(
    'root = Stack([chart])\nchart = BarChart(["Mon", "Tue", "Wed"], [Series("Views", [100, 200, 150])])'
  );
  await page.goto("/");
  await expect(page.locator("text=Mon")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=Tue").first()).toBeVisible();
  await expect(page.locator("text=Views")).toBeVisible();
});

test("pie chart renders with slices", async ({ page }) => {
  await writeSpec(
    'root = Stack([chart])\nchart = PieChart(["Chrome", "Firefox", "Safari"], [65, 20, 15], "donut")'
  );
  await page.goto("/");
  await expect(page.locator("text=Chrome")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=Firefox")).toBeVisible();
});

test("form renders inputs", async ({ page }) => {
  await writeSpec(
    'root = Stack([form])\nform = Form("test", btns, [f1, f2])\nf1 = FormControl("Name", Input("name", "Enter name"))\nf2 = FormControl("Email", Input("email", "you@example.com", "email"))\nbtns = Buttons([Button("Submit", Action([@ToAssistant("submit")]), "primary")])'
  );
  await page.goto("/");
  await expect(page.locator("text=Name")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=Email")).toBeVisible();
  await expect(page.locator("text=Submit")).toBeVisible();
});

test("spec update replaces old content", async ({ page }) => {
  await writeSpec('root = Stack([text])\ntext = TextContent("First Version")');
  await page.goto("/");
  await expect(page.locator("text=First Version")).toBeVisible({ timeout: 5000 });

  await writeSpec('root = Stack([text])\ntext = TextContent("Second Version")');
  await expect(page.locator("text=Second Version")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=First Version")).not.toBeVisible();
});

test("complex dashboard renders all elements", async ({ page }) => {
  await writeSpec(`root = Stack([header, kpis, chart, tbl])
header = CardHeader("Dashboard", "E2E Test")
kpis = Stack([kpi1, kpi2], "row", "m")
kpi1 = Card([TextContent("Users", "small"), TextContent("1,234", "large-heavy")])
kpi2 = Card([TextContent("Revenue", "small"), TextContent("$56K", "large-heavy")])
chart = Card([BarChart(["Q1", "Q2", "Q3"], [Series("Sales", [10, 20, 30])])])
tbl = Card([Table([Col("Product", ["Widget", "Gadget"]), Col("Price", [9.99, 19.99], "number")])])`);
  await page.goto("/");
  await expect(page.locator("text=Dashboard")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=1,234")).toBeVisible();
  await expect(page.locator("text=$56K")).toBeVisible();
  await expect(page.locator("text=Widget")).toBeVisible();
  await expect(page.locator("text=Q1")).toBeVisible();
});

test("callout renders", async ({ page }) => {
  await writeSpec(
    'root = Stack([c])\nc = Callout("success", "Done", "Operation completed successfully")'
  );
  await page.goto("/");
  await expect(page.locator("text=Done")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=Operation completed successfully")).toBeVisible();
});

test("tabs render with content", async ({ page }) => {
  await writeSpec(
    'root = Stack([tabs])\ntabs = Tabs([tab1, tab2])\ntab1 = TabItem("t1", "Overview", [TextContent("Overview content")])\ntab2 = TabItem("t2", "Details", [TextContent("Details content")])'
  );
  await page.goto("/");
  await expect(page.locator("text=Overview")).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole("tab", { name: "Details" })).toBeVisible();
});
