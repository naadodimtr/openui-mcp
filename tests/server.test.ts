import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const TEST_SPEC_DIR = resolve(import.meta.dirname, "..", ".test-openui");
const TEST_SPEC_FILE = resolve(TEST_SPEC_DIR, "spec.oui");

describe("MCP Server - File I/O", () => {
  beforeAll(async () => {
    if (existsSync(TEST_SPEC_DIR)) {
      await rm(TEST_SPEC_DIR, { recursive: true });
    }
    await mkdir(TEST_SPEC_DIR, { recursive: true });
  });

  afterAll(async () => {
    if (existsSync(TEST_SPEC_DIR)) {
      await rm(TEST_SPEC_DIR, { recursive: true });
    }
  });

  it("creates spec directory if missing", () => {
    expect(existsSync(TEST_SPEC_DIR)).toBe(true);
  });

  it("writes and reads spec file correctly", async () => {
    const spec = 'root = Stack([text])\ntext = TextContent("hello")';
    await writeFile(TEST_SPEC_FILE, spec, "utf-8");
    const content = await readFile(TEST_SPEC_FILE, "utf-8");
    expect(content).toBe(spec);
  });

  it("overwrites spec file on subsequent writes", async () => {
    const spec1 = 'root = Stack([a])\na = TextContent("first")';
    const spec2 = 'root = Stack([b])\nb = TextContent("second")';
    await writeFile(TEST_SPEC_FILE, spec1, "utf-8");
    await writeFile(TEST_SPEC_FILE, spec2, "utf-8");
    const content = await readFile(TEST_SPEC_FILE, "utf-8");
    expect(content).toBe(spec2);
  });

  it("handles empty spec", async () => {
    await writeFile(TEST_SPEC_FILE, "", "utf-8");
    const content = await readFile(TEST_SPEC_FILE, "utf-8");
    expect(content).toBe("");
  });

  it("handles unicode and special characters in spec", async () => {
    const spec = 'root = Stack([t])\nt = TextContent("日本語テスト 🚀 <script>alert(1)</script>")';
    await writeFile(TEST_SPEC_FILE, spec, "utf-8");
    const content = await readFile(TEST_SPEC_FILE, "utf-8");
    expect(content).toBe(spec);
  });

  it("handles very large specs", async () => {
    const refs = Array.from({ length: 500 }, (_, i) => `t${i}`);
    const defs = refs.map((r, i) => `${r} = TextContent("Line ${i} with some padding text to make it longer")`);
    const spec = `root = Stack([${refs.join(", ")}])\n${defs.join("\n")}`;
    await writeFile(TEST_SPEC_FILE, spec, "utf-8");
    const content = await readFile(TEST_SPEC_FILE, "utf-8");
    expect(content).toBe(spec);
    expect(content.length).toBeGreaterThan(30000);
  });
});

describe("MCP Server - System Prompt", () => {
  beforeAll(async () => {
    await import("@openuidev/react-ui/genui-lib");
  }, 30000);

  it("generates a non-empty system prompt", async () => {
    const { openuiLibrary, openuiPromptOptions } = await import(
      "@openuidev/react-ui/genui-lib"
    );
    const prompt = openuiLibrary.prompt(openuiPromptOptions);
    expect(prompt).toBeDefined();
    expect(prompt.length).toBeGreaterThan(1000);
  });

  it("system prompt contains key syntax rules", async () => {
    const { openuiLibrary, openuiPromptOptions } = await import(
      "@openuidev/react-ui/genui-lib"
    );
    const prompt = openuiLibrary.prompt(openuiPromptOptions);
    expect(prompt).toContain("Stack");
    expect(prompt).toContain("root");
    expect(prompt).toContain("TextContent");
    expect(prompt).toContain("Card");
    expect(prompt).toContain("BarChart");
    expect(prompt).toContain("Form");
  });

  it("system prompt contains component signatures", async () => {
    const { openuiLibrary, openuiPromptOptions } = await import(
      "@openuidev/react-ui/genui-lib"
    );
    const prompt = openuiLibrary.prompt(openuiPromptOptions);
    expect(prompt).toContain("Series");
    expect(prompt).toContain("Table");
    expect(prompt).toContain("Col");
    expect(prompt).toContain("Button");
    expect(prompt).toContain("Input");
  });
});

describe("MCP Server - Component Library", () => {
  it("lists all components with correct structure", async () => {
    const { openuiLibrary } = await import("@openuidev/react-ui/genui-lib");
    const components = Object.entries(openuiLibrary.components || {});
    expect(components.length).toBeGreaterThan(30);

    for (const [name, def] of components) {
      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
      const comp = def as { description?: string; props?: { shape?: Record<string, unknown> } };
      if (comp.props?.shape) {
        const propNames = Object.keys(comp.props.shape);
        expect(Array.isArray(propNames)).toBe(true);
      }
    }
  });

  it("Stack component exists and has expected props", async () => {
    const { openuiLibrary } = await import("@openuidev/react-ui/genui-lib");
    const stack = (openuiLibrary.components as Record<string, any>)["Stack"];
    expect(stack).toBeDefined();
    const shape = stack.props?.shape;
    if (shape) {
      const props = Object.keys(shape);
      expect(props).toContain("children");
      expect(props).toContain("direction");
      expect(props).toContain("gap");
    }
  });

  it("TextContent component exists", async () => {
    const { openuiLibrary } = await import("@openuidev/react-ui/genui-lib");
    const tc = (openuiLibrary.components as Record<string, any>)["TextContent"];
    expect(tc).toBeDefined();
    expect(tc.description).toContain("Text");
  });

  it("Card component exists and has variant prop", async () => {
    const { openuiLibrary } = await import("@openuidev/react-ui/genui-lib");
    const card = (openuiLibrary.components as Record<string, any>)["Card"];
    expect(card).toBeDefined();
    const props = Object.keys(card.props?.shape || {});
    expect(props).toContain("variant");
    expect(props).toContain("children");
  });

  it("all chart components exist", async () => {
    const { openuiLibrary } = await import("@openuidev/react-ui/genui-lib");
    const comps = openuiLibrary.components as Record<string, any>;
    const chartNames = [
      "BarChart", "LineChart", "AreaChart", "PieChart",
      "RadarChart", "ScatterChart", "HorizontalBarChart",
      "RadialChart", "SingleStackedBarChart",
    ];
    for (const name of chartNames) {
      expect(comps[name], `${name} should exist`).toBeDefined();
    }
  });

  it("form components exist", async () => {
    const { openuiLibrary } = await import("@openuidev/react-ui/genui-lib");
    const comps = openuiLibrary.components as Record<string, any>;
    const formNames = [
      "Form", "FormControl", "Input", "TextArea",
      "Select", "SelectItem", "DatePicker", "Slider",
      "CheckBoxGroup", "RadioGroup", "Button", "Buttons",
    ];
    for (const name of formNames) {
      expect(comps[name], `${name} should exist`).toBeDefined();
    }
  });
});
