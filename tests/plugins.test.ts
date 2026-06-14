import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { resolve, join } from "node:path";
import { existsSync } from "node:fs";
import { rm, mkdir, writeFile } from "node:fs/promises";
import { listInstalledPlugins, loadPlugin } from "../src/plugins/loader.js";
import { generateChecksum, verifyChecksums, writeManifest } from "../src/plugins/manifest.js";
import { getProjectLibrary } from "../src/libraries/index.js";

const TEST_DIR = resolve(import.meta.dir, "..", ".test-plugins");
const MOCK_PLUGIN_DIR = resolve(TEST_DIR, "libraries", "mock-lib");
const MOCK_CONFIG_DIR = resolve(TEST_DIR, "config");

describe("Plugin Manifest", () => {
  beforeAll(async () => {
    if (existsSync(TEST_DIR)) await rm(TEST_DIR, { recursive: true });
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterAll(async () => {
    if (existsSync(TEST_DIR)) await rm(TEST_DIR, { recursive: true });
  });

  it("generateChecksum produces sha256 hash", async () => {
    const filePath = resolve(TEST_DIR, "test-file.txt");
    await Bun.write(filePath, "hello world");
    const checksum = await generateChecksum(filePath);
    expect(checksum).toStartWith("sha256:");
    expect(checksum.length).toBeGreaterThan(10);
  });

  it("verifyChecksums passes for matching files", async () => {
    const filePath = resolve(TEST_DIR, "verified.txt");
    await Bun.write(filePath, "content");
    const checksum = await generateChecksum(filePath);
    const { valid, failures } = await verifyChecksums(TEST_DIR, { "verified.txt": checksum });
    expect(valid).toBe(true);
    expect(failures).toHaveLength(0);
  });

  it("verifyChecksums fails for mismatched content", async () => {
    const filePath = resolve(TEST_DIR, "modified.txt");
    await Bun.write(filePath, "original");
    const { valid } = await verifyChecksums(TEST_DIR, { "modified.txt": "sha256:wrong" });
    expect(valid).toBe(false);
  });

  it("verifyChecksums fails for missing files", async () => {
    const { valid, failures } = await verifyChecksums(TEST_DIR, { "missing.txt": "sha256:abc" });
    expect(valid).toBe(false);
    expect(failures).toContain("missing.txt");
  });
});

describe("Plugin Loader", () => {
  beforeAll(async () => {
    if (existsSync(MOCK_PLUGIN_DIR)) await rm(MOCK_PLUGIN_DIR, { recursive: true });
    await mkdir(MOCK_PLUGIN_DIR, { recursive: true });
  });

  afterAll(async () => {
    if (existsSync(MOCK_PLUGIN_DIR)) await rm(MOCK_PLUGIN_DIR, { recursive: true });
  });

  it("loadPlugin fails for nonexistent plugin", async () => {
    await expect(loadPlugin("definitely-not-real")).rejects.toThrow();
  });
});

describe("Project Config", () => {
  beforeAll(async () => {
    if (existsSync(MOCK_CONFIG_DIR)) await rm(MOCK_CONFIG_DIR, { recursive: true });
    await mkdir(MOCK_CONFIG_DIR, { recursive: true });
  });

  afterAll(async () => {
    if (existsSync(MOCK_CONFIG_DIR)) await rm(MOCK_CONFIG_DIR, { recursive: true });
  });

  it("returns openui-default when no config exists", () => {
    const lib = getProjectLibrary(MOCK_CONFIG_DIR);
    expect(lib).toBe("openui-default");
  });

  it("reads library from config.json", async () => {
    await writeFile(
      resolve(MOCK_CONFIG_DIR, "config.json"),
      JSON.stringify({ library: "kumo" }),
      "utf-8",
    );
    const lib = getProjectLibrary(MOCK_CONFIG_DIR);
    expect(lib).toBe("kumo");
  });

  it("returns openui-default for invalid JSON", async () => {
    await writeFile(
      resolve(MOCK_CONFIG_DIR, "config.json"),
      "not json",
      "utf-8",
    );
    const lib = getProjectLibrary(MOCK_CONFIG_DIR);
    expect(lib).toBe("openui-default");
  });
});
