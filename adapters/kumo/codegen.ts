import { writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { stringify } from "yaml";

const OUTPUT = resolve(import.meta.dir, "openui-mcp-adapter.yaml");

async function main() {
  let registry: any;
  try {
    const registryPath = require.resolve(
      "@cloudflare/kumo/ai/component-registry.json",
    );
    registry = JSON.parse(
      require("node:fs").readFileSync(registryPath, "utf-8"),
    );
  } catch {
    console.log("  @cloudflare/kumo not installed. Using existing YAML.");
    console.log("  To regenerate: npm install @cloudflare/kumo && bun adapters/kumo/codegen.ts");
    return;
  }

  const typeMap: Record<string, string> = {
    string: "string",
    number: "number",
    boolean: "boolean",
    ReactNode: "any",
    ReactNode_array: "any[]",
  };

  function mapType(prop: any): string {
    if (prop.type === "enum" && prop.values) {
      return `enum [${prop.values.join(", ")}]`;
    }
    return typeMap[prop.type] || "any";
  }

  const components: any[] = [];

  for (const [name, def] of Object.entries(registry.components || {})) {
    const comp = def as any;
    const props: any[] = [];
    let position = 0;

    for (const [propName, propDef] of Object.entries(comp.props || {})) {
      const p = propDef as any;
      props.push({
        name: propName,
        type: mapType(p),
        required: p.required || false,
        position: position++,
        ...(p.default !== undefined && { default: p.default }),
        ...(p.description && { description: p.description }),
      });
    }

    components.push({
      name,
      import: `{ ${name} } from @cloudflare/kumo`,
      description: comp.description || `${name} component`,
      props,
    });
  }

  const spec = {
    id: "kumo",
    name: "Cloudflare Kumo",
    version: "0.1.0",
    upstream: `@cloudflare/kumo@^2.0.0`,
    description:
      "Cloudflare's design system — semantic tokens, Tailwind v4, accessible components",
    styles: {
      entry: "styles.css",
      framework: "tailwind-v4",
    },
    root: "Stack",
    components,
  };

  writeFileSync(OUTPUT, stringify(spec), "utf-8");
  console.log(`  ✓ Generated ${OUTPUT} (${components.length} components)`);
}

main();
