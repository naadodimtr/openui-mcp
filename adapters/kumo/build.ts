import { resolve } from "node:path";
import { buildAdapter } from "../../src/plugins/builder.js";

const YAML_PATH = resolve(import.meta.dir, "openui-mcp-adapter.yaml");
const OUTPUT_DIR = resolve(import.meta.dir, "dist");

async function main() {
  console.log("\n  Building Kumo adapter...\n");
  const result = await buildAdapter(YAML_PATH, OUTPUT_DIR);
  console.log(`  ✓ Built "${result.name}" v${result.version}`);
  console.log(`    Output: ${result.outputDir}`);
  console.log(`    Files: ${result.files.join(", ")}\n`);
}

main().catch((err) => {
  console.error(`  Error: ${err.message}`);
  process.exit(1);
});
