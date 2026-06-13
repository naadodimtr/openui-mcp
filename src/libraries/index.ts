import type { OpenUIError } from "@openuidev/lang-core";

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

import { registerOpenUIDefault } from "./openui-default.js";
registerOpenUIDefault();
