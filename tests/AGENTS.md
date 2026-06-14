# Tests

## Structure

```
tests/
  server.test.ts             — MCP server tool handlers
  specs.test.ts              — Spec parsing and validation
  builder.test.ts            — Adapter builder from YAML
  plugins.test.ts            — Plugin install/load/verify
  cli.test.ts                — CLI command parsing
  e2e/
    e2e.pw.ts                — Default library: text, cards, tables, charts, forms, dashboards
    error-boundary.pw.ts     — Error recovery, spec replacement
    library-switch.pw.ts     — Library info API, config switching
    kumo.pw.ts               — Kumo: asset serving, basic rendering
    kumo-components.pw.ts    — Kumo: 41-component showcase, all variants, console checking
    specs/
      kumo-showcase.oui      — Full Kumo variant showcase (41 components)
      *.oui                  — Per-component test specs (27 files)
  browseros/
    INSTRUCTIONS.md          — BrowserOS testing configuration
```

Also: `adapters/kumo/tests/renderer.test.ts` — 112 Kumo renderer unit tests.

## Unit Tests

Framework: `bun:test`. Config: `bunfig.toml` roots test discovery at `./tests/`.

Pattern:
```typescript
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
describe("Feature", () => {
  it("does thing", () => { expect(result).toBe(expected); });
});
```

Kumo tests import the renderer source directly and use `react-dom/server` renderToString. Console warnings are captured via mock to detect Kumo warnings.

## E2E Tests

Framework: Playwright. Config: `playwright.config.ts` — `testDir: "tests/e2e"`, `testMatch: "*.pw.ts"`, `headless: true`.

### Server Spawning Pattern

Each test file spawns its own server instance on a unique port (6557–6561) with isolated spec directory:

```typescript
const PORT = process.env.E2E_PORT || "6557";
const SPEC_DIR = resolve(import.meta.dirname, "..", "..", ".e2e-{name}");
let serverProcess: ChildProcess;

test.beforeAll(async () => {
  await mkdir(SPEC_DIR, { recursive: true });
  await writeFile(SPEC_FILE, "", "utf-8");
  // Kumo tests: also write config.json + install-library

  serverProcess = spawn("bun", ["src/server.ts"], {
    cwd: SERVER_CWD, stdio: "ignore", shell: true,
    env: { ...process.env, PREVIEWER_PORT: PORT, OPENUI_SPEC_DIR: SPEC_DIR },
  });
  await waitForServer(`http://localhost:${PORT}/api/spec`);
});

test.afterAll(async () => {
  serverProcess.kill();
  await rm(SPEC_DIR, { recursive: true });
});
```

### Port Map

| File | Port |
|------|------|
| `e2e.pw.ts` | 6557 |
| `error-boundary.pw.ts` | 6558 |
| `library-switch.pw.ts` | 6559 |
| `kumo.pw.ts` | 6560 |
| `kumo-components.pw.ts` | 6561 |

### Console Warning Checking

`kumo-components.pw.ts` captures browser console to detect Kumo warnings/errors:
```typescript
const messages: string[] = [];
page.on("console", (msg) => {
  if (msg.type() === "warning" || msg.type() === "error")
    messages.push(`[${msg.type()}] ${msg.text()}`);
});
expect(messages).toHaveLength(0);
```

## Running

```bash
bun test                                       # 75 existing unit tests
bun test ./adapters/kumo/tests/renderer.test.ts  # 112 Kumo renderer tests
bunx playwright test                           # 34 E2E tests
bun run test:all                               # All three sequentially
```
