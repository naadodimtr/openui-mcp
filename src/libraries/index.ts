import type { OpenUIError } from "@openuidev/lang-core";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { listInstalledPlugins, loadPlugin } from "../plugins/loader.js";

export interface ValidationResult {
  valid: boolean;
  errors: OpenUIError[];
  meta: {
    statementCount: number;
    unresolved: string[];
    orphaned: string[];
    incomplete: boolean;
  };
}

export interface LibraryProfile {
  id: string;
  name: string;
  description: string;
  getPrompt(): Promise<string>;
  getComponents(): Promise<
    Array<{ name: string; description: string; props: string[] }>
  >;
  validate(spec: string): Promise<ValidationResult>;
}

interface LibraryEntry {
  id: string;
  name: string;
  description: string;
  loader: () => Promise<LibraryProfile>;
}

const registry = new Map<string, LibraryEntry>();

export function registerLibrary(entry: LibraryEntry) {
  registry.set(entry.id, entry);
}

export async function getProfile(id: string): Promise<LibraryProfile> {
  const entry = registry.get(id);
  if (!entry) {
    throw new Error(
      `Unknown library: ${id}. Available: ${[...registry.keys()].join(", ")}`,
    );
  }
  return entry.loader();
}

export function listProfiles(): Array<{
  id: string;
  name: string;
  description: string;
}> {
  return [...registry.values()].map(({ id, name, description }) => ({
    id,
    name,
    description,
  }));
}

export function getProjectLibrary(specDir: string): string {
  const configPath = resolve(specDir, "config.json");
  if (!existsSync(configPath)) return "openui-default";
  try {
    const raw = JSON.parse(readFileSync(configPath, "utf-8"));
    return raw.library || "openui-default";
  } catch {
    return "openui-default";
  }
}

export function initPlugins() {
  const plugins = listInstalledPlugins();
  for (const id of plugins) {
    if (registry.has(id)) continue;
    registerLibrary({
      id,
      name: id,
      description: `Plugin: ${id}`,
      loader: () => loadPlugin(id),
    });
  }
}

import { registerOpenUIDefault } from "./openui-default.js";
registerOpenUIDefault();
