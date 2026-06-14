import { join } from "node:path";
import { homedir } from "node:os";
import { readdirSync, existsSync } from "node:fs";
import { readManifest, verifyChecksums, type Manifest } from "./manifest.js";
import type { LibraryProfile } from "../libraries/index.js";

export const PLUGINS_DIR = join(homedir(), ".openui-mcp", "libraries");

export function getPluginsDir(): string {
  return PLUGINS_DIR;
}

export function listInstalledPlugins(): string[] {
  if (!existsSync(PLUGINS_DIR)) return [];
  return readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .filter((d) => existsSync(join(PLUGINS_DIR, d.name, "manifest.json")))
    .map((d) => d.name);
}

export async function loadPlugin(id: string): Promise<LibraryProfile> {
  const dir = join(PLUGINS_DIR, id);
  if (!existsSync(dir)) {
    throw new Error(`Library plugin "${id}" not found in ${PLUGINS_DIR}`);
  }

  const manifest = await readManifest(dir);

  const { valid, failures } = await verifyChecksums(dir, manifest.checksums);
  if (!valid) {
    throw new Error(
      `Checksum verification failed for "${id}": ${failures.join(", ")}. ` +
        `Run "openui-mcp update-library ${id}" to re-install.`,
    );
  }

  const libraryPath = join(dir, "library.mjs");
  if (!existsSync(libraryPath)) {
    throw new Error(`Library plugin "${id}" is missing library.mjs`);
  }

  const mod = await import(libraryPath);
  const profile: LibraryProfile = mod.default;

  if (!profile || !profile.id || !profile.getPrompt || !profile.validate) {
    throw new Error(
      `Library plugin "${id}" does not export a valid LibraryProfile`,
    );
  }

  return profile;
}

export async function getPluginManifest(id: string): Promise<Manifest> {
  const dir = join(PLUGINS_DIR, id);
  return readManifest(dir);
}

export function getPluginDir(id: string): string {
  return join(PLUGINS_DIR, id);
}
