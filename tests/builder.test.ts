import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { resolve, join } from "node:path";
import { existsSync } from "node:fs";
import { rm, mkdir, readFile } from "node:fs/promises";
import { buildAdapter } from "../src/plugins/builder.js";

const TEST_DIR = resolve(import.meta.dir, "..", ".test-builder");
const YAML_PATH = resolve(TEST_DIR, "openui-mcp-adapter.yaml");
const OUTPUT_DIR = resolve(TEST_DIR, "dist");

const MINIMAL_YAML = `
id: test-lib
name: Test Library
version: 0.1.0
description: Minimal test library

components:
  - name: Box
    description: "A simple container"
    props:
      - name: children
        type: any[]
        required: true
        position: 0
      - name: variant
        type: enum [default, outlined]
        position: 1

  - name: Label
    description: "Text label"
    props:
      - name: text
        type: string
        required: true
        position: 0
      - name: size
        type: enum [sm, md, lg]
        position: 1
`;

describe("Adapter Builder", () => {
  beforeAll(async () => {
    if (existsSync(TEST_DIR)) await rm(TEST_DIR, { recursive: true });
    await mkdir(TEST_DIR, { recursive: true });
    await Bun.write(YAML_PATH, MINIMAL_YAML);
  });

  afterAll(async () => {
    if (existsSync(TEST_DIR)) await rm(TEST_DIR, { recursive: true });
  });

  it("builds adapter from YAML", async () => {
    const result = await buildAdapter(YAML_PATH, OUTPUT_DIR);
    expect(result.id).toBe("test-lib");
    expect(result.name).toBe("Test Library");
    expect(result.version).toBe("0.1.0");
  }, 30000);

  it("generates manifest.json", async () => {
    expect(existsSync(join(OUTPUT_DIR, "manifest.json"))).toBe(true);
    const manifest = JSON.parse(await readFile(join(OUTPUT_DIR, "manifest.json"), "utf-8"));
    expect(manifest.id).toBe("test-lib");
    expect(manifest.name).toBe("Test Library");
    expect(manifest.checksums).toBeDefined();
  });

  it("generates library.mjs", () => {
    expect(existsSync(join(OUTPUT_DIR, "library.mjs"))).toBe(true);
  });

  it("generates styles.css", () => {
    expect(existsSync(join(OUTPUT_DIR, "styles.css"))).toBe(true);
  });

  it("manifest checksums are valid sha256", async () => {
    const manifest = JSON.parse(await readFile(join(OUTPUT_DIR, "manifest.json"), "utf-8"));
    for (const [file, hash] of Object.entries(manifest.checksums)) {
      expect(hash).toStartWith("sha256:");
      expect((hash as string).length).toBeGreaterThan(70);
    }
  });

  it("fails on missing YAML", async () => {
    await expect(buildAdapter("./nonexistent.yaml", OUTPUT_DIR)).rejects.toThrow();
  });

  it("fails on invalid YAML", async () => {
    const badYaml = resolve(TEST_DIR, "bad.yaml");
    await Bun.write(badYaml, "id: test\n");
    await expect(buildAdapter(badYaml, OUTPUT_DIR)).rejects.toThrow("missing required fields");
  });
});
