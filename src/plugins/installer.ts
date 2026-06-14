import { join } from "node:path";
import { existsSync, mkdirSync, rmSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { getPluginsDir } from "./loader.js";
import {
  readManifest,
  verifyChecksums,
  type Manifest,
} from "./manifest.js";

interface InstallResult {
  id: string;
  name: string;
  version: string;
  source: string;
}

function parseSource(source: string): { type: "github" | "local"; value: string } {
  if (source.startsWith("github:")) {
    return { type: "github", value: source.slice(7) };
  }
  if (source.startsWith("./") || source.startsWith("/") || source.startsWith("C:") || source.startsWith("~")) {
    return { type: "local", value: source };
  }
  if (source.includes("/") && !source.startsWith(".")) {
    return { type: "github", value: source };
  }
  return { type: "local", value: source };
}

async function fetchGitHubRelease(repo: string, version?: string): Promise<any> {
  const url = version
    ? `https://api.github.com/repos/${repo}/releases/tags/${version}`
    : `https://api.github.com/repos/${repo}/releases/latest`;

  const res = await fetch(url, {
    headers: { "User-Agent": "openui-mcp-installer" },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(version ? `Version ${version} not found for ${repo}` : `No releases found for ${repo}`);
    }
    throw new Error(`GitHub API error: ${res.status}`);
  }

  return res.json();
}

async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url, {
    headers: { "User-Agent": "openui-mcp-installer", Accept: "application/octet-stream" },
    redirect: "follow",
  });
  if (!res.ok || !res.body) {
    throw new Error(`Download failed: ${res.status}`);
  }
  const ws = createWriteStream(dest);
  await pipeline(Readable.fromWeb(res.body as any), ws);
}

async function installFromGitHub(
  repo: string,
  version?: string,
): Promise<InstallResult> {
  const release = await fetchGitHubRelease(repo, version);
  const asset = release.assets?.find(
    (a: any) => a.name.endsWith(".tar.gz") || a.name.endsWith(".zip"),
  );
  if (!asset) {
    throw new Error(`No bundle artifact found in release ${release.tag_name}`);
  }

  const tmpFile = join(tmpdir(), asset.name);
  await downloadFile(asset.browser_download_url, tmpFile);

  const extractDir = join(tmpdir(), `openui-mcp-lib-${Date.now()}`);
  mkdirSync(extractDir, { recursive: true });

  if (asset.name.endsWith(".tar.gz")) {
    Bun.spawnSync(["tar", "-xzf", tmpFile, "-C", extractDir]);
  } else {
    Bun.spawnSync(["unzip", "-o", tmpFile, "-d", extractDir]);
  }

  try { rmSync(tmpFile); } catch {}

  const manifest = await readManifest(extractDir);
  const destDir = join(getPluginsDir(), manifest.id);

  if (existsSync(destDir)) {
    rmSync(destDir, { recursive: true });
  }
  mkdirSync(destDir, { recursive: true });
  cpSync(extractDir, destDir, { recursive: true });

  try { rmSync(extractDir, { recursive: true }); } catch {}

  const { valid, failures } = await verifyChecksums(destDir, manifest.checksums);
  if (!valid) {
    rmSync(destDir, { recursive: true });
    throw new Error(`Checksum verification failed after install: ${failures.join(", ")}`);
  }

  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    source: `github:${repo}`,
  };
}

async function installFromLocal(path: string): Promise<InstallResult> {
  const resolvedPath = path.startsWith("~")
    ? join(require("node:os").homedir(), path.slice(1))
    : require("node:path").resolve(path);

  if (!existsSync(resolvedPath)) {
    throw new Error(`Path not found: ${resolvedPath}`);
  }

  const manifest = await readManifest(resolvedPath);
  const destDir = join(getPluginsDir(), manifest.id);

  if (existsSync(destDir)) {
    rmSync(destDir, { recursive: true });
  }
  mkdirSync(destDir, { recursive: true });
  cpSync(resolvedPath, destDir, { recursive: true });

  const { valid, failures } = await verifyChecksums(destDir, manifest.checksums);
  if (!valid) {
    rmSync(destDir, { recursive: true });
    throw new Error(`Checksum verification failed: ${failures.join(", ")}`);
  }

  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    source: path,
  };
}

export async function installLibrary(
  source: string,
  version?: string,
): Promise<InstallResult> {
  const parsed = parseSource(source);

  mkdirSync(getPluginsDir(), { recursive: true });

  if (parsed.type === "github") {
    return installFromGitHub(parsed.value, version);
  }
  return installFromLocal(parsed.value);
}

export async function updateLibrary(id: string): Promise<InstallResult> {
  const destDir = join(getPluginsDir(), id);
  if (!existsSync(destDir)) {
    throw new Error(`Library "${id}" is not installed`);
  }

  const manifest = await readManifest(destDir);
  if (!manifest.source) {
    throw new Error(`Library "${id}" has no source recorded — reinstall manually`);
  }

  const parsed = parseSource(manifest.source);
  if (parsed.type === "github") {
    return installFromGitHub(parsed.value);
  }
  throw new Error(`Cannot auto-update local installs. Reinstall from source.`);
}

export function removeLibrary(id: string): void {
  const destDir = join(getPluginsDir(), id);
  if (!existsSync(destDir)) {
    throw new Error(`Library "${id}" is not installed`);
  }
  rmSync(destDir, { recursive: true });
}

export async function getInstalledManifests(): Promise<Manifest[]> {
  const pluginsDir = getPluginsDir();
  if (!existsSync(pluginsDir)) return [];

  const dirs = require("node:fs")
    .readdirSync(pluginsDir, { withFileTypes: true })
    .filter((d: any) => d.isDirectory())
    .filter((d: any) => existsSync(join(pluginsDir, d.name, "manifest.json")));

  const manifests: Manifest[] = [];
  for (const d of dirs) {
    try {
      manifests.push(await readManifest(join(pluginsDir, d.name)));
    } catch {}
  }
  return manifests;
}
