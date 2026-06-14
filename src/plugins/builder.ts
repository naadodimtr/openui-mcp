import { resolve, join, dirname } from "node:path";
import { existsSync, mkdirSync, readFileSync, cpSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { generateManifestChecksums, writeManifest } from "./manifest.js";

interface PropDef {
  name: string;
  type: string;
  required?: boolean;
  position: number;
  default?: unknown;
  description?: string;
}

interface ComponentDef {
  name: string;
  import: string;
  description: string;
  props: PropDef[];
}

interface ComponentGroup {
  name: string;
  components: string[];
  notes?: string[];
}

interface AdapterSpec {
  id: string;
  name: string;
  version: string;
  upstream?: string;
  description?: string;
  styles?: { entry: string; framework?: string };
  renderer?: string;
  root?: string;
  componentGroups?: ComponentGroup[];
  components: ComponentDef[];
}

function parseType(type: string): string {
  if (type === "any") return "z.any()";
  if (type === "string") return "z.string()";
  if (type === "number") return "z.number()";
  if (type === "boolean") return "z.boolean()";
  if (type === "any[]") return "z.array(z.any())";
  if (type === "string[]") return "z.array(z.string())";
  if (type === "number[]") return "z.array(z.number())";
  if (type === "component") return "z.any()";
  if (type === "component[]") return "z.array(z.any())";
  if (type.startsWith("enum ")) {
    const values = type
      .slice(5)
      .replace(/[\[\]]/g, "")
      .split(",")
      .map((v) => v.trim());
    return `z.enum([${values.map((v) => `"${v}"`).join(", ")}])`;
  }
  return "z.any()";
}

function generateZodSchema(props: PropDef[]): string {
  const sorted = [...props].sort((a, b) => a.position - b.position);
  const fields = sorted.map((p) => {
    let schema = parseType(p.type);
    if (!p.required) schema += ".optional()";
    return `    ${p.name}: ${schema}`;
  });
  return `z.object({\n${fields.join(",\n")}\n  })`;
}

function generateLibrarySource(spec: AdapterSpec): string {
  const lines: string[] = [];
  lines.push(`import { createLibrary, defineComponent, createParser, enrichErrors } from "@openuidev/lang-core";`);
  lines.push(`import { z } from "zod/v4";`);
  lines.push(``);

  for (const comp of spec.components) {
    lines.push(`const ${comp.name}Def = defineComponent({`);
    lines.push(`  name: "${comp.name}",`);
    lines.push(`  props: ${generateZodSchema(comp.props)},`);
    lines.push(`  description: "${comp.description.replace(/"/g, '\\"')}",`);
    lines.push(`  component: null,`);
    lines.push(`});`);
    lines.push(``);
  }

  const compNames = spec.components.map((c) => `${c.name}Def`);
  lines.push(`const library = createLibrary({`);
  lines.push(`  components: [${compNames.join(", ")}],`);
  if (spec.componentGroups) {
    lines.push(`  componentGroups: ${JSON.stringify(spec.componentGroups)},`);
  }
  if (spec.root) {
    lines.push(`  root: "${spec.root}",`);
  }
  lines.push(`});`);
  lines.push(``);
  lines.push(`const schema = library.toJSONSchema();`);
  lines.push(`const parser = createParser(schema);`);
  lines.push(`const componentNames = Object.keys(library.components);`);
  lines.push(``);
  lines.push(`export default {`);
  lines.push(`  id: "${spec.id}",`);
  lines.push(`  name: "${spec.name}",`);
  lines.push(`  description: "${(spec.description || spec.name).replace(/"/g, '\\"')}",`);
  lines.push(`  async getPrompt() { return library.prompt(); },`);
  lines.push(`  async getComponents() {`);
  lines.push(`    const components = [];`);
  lines.push(`    for (const [name, def] of Object.entries(library.components)) {`);
  lines.push(`      const comp = def;`);
  lines.push(`      components.push({`);
  lines.push(`        name,`);
  lines.push(`        description: comp.description || "",`);
  lines.push(`        props: comp.props?.shape ? Object.keys(comp.props.shape) : [],`);
  lines.push(`      });`);
  lines.push(`    }`);
  lines.push(`    return components;`);
  lines.push(`  },`);
  lines.push(`  async validate(spec) {`);
  lines.push(`    const result = parser.parse(spec);`);
  lines.push(`    const enriched = enrichErrors(result.meta.errors, schema, componentNames);`);
  lines.push(`    return {`);
  lines.push(`      valid: enriched.length === 0 && result.meta.unresolved.length === 0 && result.root !== null,`);
  lines.push(`      errors: enriched,`);
  lines.push(`      meta: {`);
  lines.push(`        statementCount: result.meta.statementCount,`);
  lines.push(`        unresolved: result.meta.unresolved,`);
  lines.push(`        orphaned: result.meta.orphaned,`);
  lines.push(`        incomplete: result.meta.incomplete,`);
  lines.push(`      },`);
  lines.push(`    };`);
  lines.push(`  },`);
  lines.push(`};`);

  return lines.join("\n");
}

function generateRendererSource(spec: AdapterSpec): string {
  const lines: string[] = [];
  lines.push(`import { createLibrary, defineComponent } from "@openuidev/lang-core";`);
  lines.push(`import { z } from "zod/v4";`);
  lines.push(``);

  const importMap = new Map<string, string[]>();
  for (const comp of spec.components) {
    const match = comp.import.match(/\{(.+)\}\s+from\s+(.+)/);
    if (match) {
      const names = match[1].split(",").map((n) => n.trim());
      const pkg = match[2].trim();
      const existing = importMap.get(pkg) || [];
      importMap.set(pkg, [...existing, ...names]);
    }
  }

  for (const [pkg, names] of importMap) {
    lines.push(`import { ${[...new Set(names)].join(", ")} } from "${pkg}";`);
  }
  lines.push(``);

  for (const comp of spec.components) {
    const match = comp.import.match(/\{(.+)\}/);
    const reactComp = match ? match[1].split(",")[0].trim() : comp.name;
    lines.push(`const ${comp.name}Def = defineComponent({`);
    lines.push(`  name: "${comp.name}",`);
    lines.push(`  props: ${generateZodSchema(comp.props)},`);
    lines.push(`  description: "${comp.description.replace(/"/g, '\\"')}",`);
    lines.push(`  component: ${reactComp},`);
    lines.push(`});`);
    lines.push(``);
  }

  const compNames = spec.components.map((c) => `${c.name}Def`);
  lines.push(`const library = createLibrary({`);
  lines.push(`  components: [${compNames.join(", ")}],`);
  if (spec.componentGroups) {
    lines.push(`  componentGroups: ${JSON.stringify(spec.componentGroups)},`);
  }
  if (spec.root) {
    lines.push(`  root: "${spec.root}",`);
  }
  lines.push(`});`);
  lines.push(``);
  lines.push(`export default library;`);

  return lines.join("\n");
}

export async function buildAdapter(yamlPath: string, outputDir: string) {
  const resolvedYaml = resolve(yamlPath);
  const resolvedOutput = resolve(outputDir);

  if (!existsSync(resolvedYaml)) {
    throw new Error(`Adapter spec not found: ${resolvedYaml}`);
  }

  const raw = readFileSync(resolvedYaml, "utf-8");
  const spec: AdapterSpec = parseYaml(raw);

  if (!spec.id || !spec.name || !spec.version || !spec.components) {
    throw new Error("Invalid adapter spec: missing required fields (id, name, version, components)");
  }

  mkdirSync(resolvedOutput, { recursive: true });

  const librarySource = generateLibrarySource(spec);
  const libSrcPath = join(resolvedOutput, "_library.ts");
  await Bun.write(libSrcPath, librarySource);

  const yamlDir = dirname(resolvedYaml);
  const rendSrcPath = spec.renderer
    ? resolve(yamlDir, spec.renderer)
    : join(resolvedOutput, "_renderer.ts");

  if (!spec.renderer) {
    const rendererSource = generateRendererSource(spec);
    await Bun.write(rendSrcPath, rendererSource);
  }

  const libResult = await Bun.build({
    entrypoints: [libSrcPath],
    outdir: resolvedOutput,
    naming: "library.mjs",
    format: "esm",
    target: "bun",
    external: [],
  });

  if (!libResult.success) {
    const errors = libResult.logs.map((l) => l.message).join("\n");
    console.log(`  ⚠ library.mjs build failed. Source saved as _library.ts`);
    console.log(`  Errors:\n${errors}`);
  }

  try {
    const rendResult = await Bun.build({
      entrypoints: [rendSrcPath],
      outdir: resolvedOutput,
      naming: "renderer.mjs",
      format: "esm",
      target: "browser",
      external: ["react", "react-dom", "zod"],
    });

    if (!rendResult.success) {
      const errors = rendResult.logs.map((l) => l.message).join("\n");
      console.log(`  ⚠ renderer.mjs build failed. Source saved as _renderer.ts`);
      console.log(`  Errors:\n${errors}`);
    }
  } catch {
    console.log(`  ⚠ renderer.mjs build failed (unresolved imports). Source saved as _renderer.ts`);
  }

  if (spec.styles?.entry) {
    const yamlDir = dirname(resolvedYaml);
    const styleSrc = resolve(yamlDir, spec.styles.entry);
    if (existsSync(styleSrc)) {
      cpSync(styleSrc, join(resolvedOutput, "styles.css"));
    } else {
      await Bun.write(join(resolvedOutput, "styles.css"), "");
      console.log(`  ⚠ Styles entry not found: ${spec.styles.entry}. Empty styles.css created.`);
    }
  } else {
    await Bun.write(join(resolvedOutput, "styles.css"), "");
  }

  const tempFiles = [libSrcPath];
  if (!spec.renderer) tempFiles.push(rendSrcPath);
  for (const f of tempFiles) {
    try { const file = Bun.file(f); if (await file.exists()) await Bun.write(f, ""); Bun.spawnSync(["rm", "-f", f]); } catch {}
  }

  const bundleFiles = ["library.mjs", "renderer.mjs", "styles.css"].filter((f) =>
    existsSync(join(resolvedOutput, f)),
  );

  const checksums = await generateManifestChecksums(resolvedOutput, bundleFiles);

  await writeManifest(resolvedOutput, {
    id: spec.id,
    name: spec.name,
    version: spec.version,
    upstream: spec.upstream || "",
    source: "",
    checksums,
    publishedAt: new Date().toISOString(),
  });

  return {
    id: spec.id,
    name: spec.name,
    version: spec.version,
    outputDir: resolvedOutput,
    files: ["manifest.json", ...bundleFiles],
  };
}
