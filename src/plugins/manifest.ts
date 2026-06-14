import { z } from "zod";
import { join } from "node:path";

export const ManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  upstream: z.string().optional(),
  source: z.string(),
  checksums: z.record(z.string()),
  publishedAt: z.string().optional(),
});

export type Manifest = z.infer<typeof ManifestSchema>;

export async function generateChecksum(filePath: string): Promise<string> {
  const file = Bun.file(filePath);
  const buffer = await file.arrayBuffer();
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(buffer);
  return `sha256:${hasher.digest("hex")}`;
}

export async function generateManifestChecksums(
  dir: string,
  files: string[],
): Promise<Record<string, string>> {
  const checksums: Record<string, string> = {};
  for (const file of files) {
    checksums[file] = await generateChecksum(join(dir, file));
  }
  return checksums;
}

export async function verifyChecksums(
  dir: string,
  checksums: Record<string, string>,
): Promise<{ valid: boolean; failures: string[] }> {
  const failures: string[] = [];
  for (const [file, expected] of Object.entries(checksums)) {
    const filePath = join(dir, file);
    const bunFile = Bun.file(filePath);
    if (!(await bunFile.exists())) {
      failures.push(file);
      continue;
    }
    const actual = await generateChecksum(filePath);
    if (actual !== expected) {
      failures.push(file);
    }
  }
  return { valid: failures.length === 0, failures };
}

export async function readManifest(dir: string): Promise<Manifest> {
  const raw = await Bun.file(join(dir, "manifest.json")).json();
  return ManifestSchema.parse(raw);
}

export async function writeManifest(dir: string, manifest: Manifest) {
  await Bun.write(
    join(dir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
}
