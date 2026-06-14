import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { rm, mkdir, readFile } from "node:fs/promises";

const SERVER = resolve(import.meta.dir, "..", "src", "server.ts");
const TEST_CWD = resolve(import.meta.dir, "..", ".test-cli");

function run(args: string[], cwd?: string) {
  const result = Bun.spawnSync(["bun", SERVER, ...args], {
    cwd: cwd || TEST_CWD,
    env: { ...process.env, OPENUI_SPEC_DIR: resolve(TEST_CWD, ".openui") },
  });
  return {
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
    exitCode: result.exitCode,
  };
}

describe("CLI Commands", () => {
  beforeAll(async () => {
    if (existsSync(TEST_CWD)) await rm(TEST_CWD, { recursive: true });
    await mkdir(TEST_CWD, { recursive: true });
  });

  afterAll(async () => {
    if (existsSync(TEST_CWD)) await rm(TEST_CWD, { recursive: true });
  });

  it("--version prints version", () => {
    const { stdout, exitCode } = run(["--version"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("openui-mcp v");
  });

  it("init creates .openui/config.json with default library", () => {
    const { stdout, exitCode } = run(["init"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Initialized");
    const configPath = resolve(TEST_CWD, ".openui", "config.json");
    expect(existsSync(configPath)).toBe(true);
  });

  it("init --library=kumo writes correct library", async () => {
    const { exitCode } = run(["init", "--library=kumo"]);
    expect(exitCode).toBe(0);
    const configPath = resolve(TEST_CWD, ".openui", "config.json");
    const content = JSON.parse(await readFile(configPath, "utf-8"));
    expect(content.library).toBe("kumo");
  });

  it("install-library with no source shows usage", () => {
    const { stderr, exitCode } = run(["install-library"]);
    expect(exitCode).toBe(1);
    expect(stderr).toContain("Usage");
  });

  it("install-library with invalid path fails", () => {
    const { stderr, exitCode } = run(["install-library", "./nonexistent"]);
    expect(exitCode).toBe(1);
    expect(stderr).toContain("Error");
  });

  it("remove-library with no id shows usage", () => {
    const { stderr, exitCode } = run(["remove-library"]);
    expect(exitCode).toBe(1);
    expect(stderr).toContain("Usage");
  });

  it("remove-library with nonexistent id fails", () => {
    const { stderr, exitCode } = run(["remove-library", "nonexistent-lib"]);
    expect(exitCode).toBe(1);
    expect(stderr).toContain("Error");
  });

  it("build-adapter with no yaml shows usage", () => {
    const { stderr, exitCode } = run(["build-adapter"]);
    expect(exitCode).toBe(1);
    expect(stderr).toContain("Usage");
  });
});
