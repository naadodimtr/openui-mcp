import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const DIST_DIR = join(import.meta.dir, "..", "previewer", "dist");
const OUTPUT = join(import.meta.dir, "..", "src", "embedded-assets.ts");

function walkDir(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walkDir(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

const files = walkDir(DIST_DIR);
const assets: Record<string, string> = {};

for (const file of files) {
  const key = relative(DIST_DIR, file).replace(/\\/g, "/");
  assets[key] = await Bun.file(file).text();
}

const output = `const assets: Record<string, string> = ${JSON.stringify(assets)};\nexport default assets;\n`;
await Bun.write(OUTPUT, output);

console.log(`Embedded ${Object.keys(assets).length} files into src/embedded-assets.ts (${(output.length / 1024).toFixed(0)} KB)`);
