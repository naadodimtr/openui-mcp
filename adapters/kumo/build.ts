import { resolve } from "node:path";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { buildAdapter } from "../../src/plugins/builder.js";

const YAML_PATH = resolve(import.meta.dir, "openui-mcp-adapter.yaml");
const OUTPUT_DIR = resolve(import.meta.dir, "dist");
const KUMO_CSS = resolve(import.meta.dir, "styles.css");
const RDP_CSS = resolve(import.meta.dir, "..", "..", "node_modules/react-day-picker/src/style.css");
const MERGED_CSS = resolve(import.meta.dir, ".merged-styles.css");

async function main() {
  console.log("\n  Building Kumo adapter...\n");

  const kumoCSS = readFileSync(KUMO_CSS, "utf-8");
  let merged = kumoCSS;
  if (existsSync(RDP_CSS)) {
    merged += "\n" + readFileSync(RDP_CSS, "utf-8");
  }
  writeFileSync(MERGED_CSS, merged);

  const orig = readFileSync(YAML_PATH, "utf-8");
  const patched = orig.replace(/entry: styles\.css/, "entry: .merged-styles.css");
  writeFileSync(YAML_PATH, patched);

  try {
    const result = await buildAdapter(YAML_PATH, OUTPUT_DIR);
    console.log(`  ✓ Built "${result.name}" v${result.version}`);
    console.log(`    Output: ${result.outputDir}`);
    console.log(`    Files: ${result.files.join(", ")}\n`);
  } finally {
    writeFileSync(YAML_PATH, orig);
    if (existsSync(MERGED_CSS)) unlinkSync(MERGED_CSS);
  }
}

main().catch((err) => {
  console.error(`  Error: ${err.message}`);
  process.exit(1);
});
