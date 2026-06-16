import { existsSync, unlinkSync, renameSync, createWriteStream } from "node:fs";
import { join, dirname, basename } from "node:path";
import { tmpdir } from "node:os";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const REPO = "naadodimtr/openui-mcp";
const VERSION = "1.1.3";

function getPlatformArtifact(): string {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === "win32") return "openui-mcp-win-x64.zip";
  if (platform === "darwin" && arch === "arm64") return "openui-mcp-darwin-arm64.tar.gz";
  if (platform === "darwin") return "openui-mcp-darwin-x64.tar.gz";
  if (platform === "linux" && arch === "arm64") return "openui-mcp-linux-arm64.tar.gz";
  if (platform === "linux") return "openui-mcp-linux-x64.tar.gz";

  throw new Error(`Unsupported platform: ${platform}/${arch}`);
}

function getBinaryName(): string {
  return process.platform === "win32" ? "openui-mcp.exe" : "openui-mcp";
}

async function fetchRelease(version: string): Promise<any> {
  const url =
    version === "latest"
      ? `https://api.github.com/repos/${REPO}/releases/latest`
      : `https://api.github.com/repos/${REPO}/releases/tags/${version}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "openui-mcp-updater" },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(version === "latest" ? "No releases found" : `Version ${version} not found`);
    }
    throw new Error(`GitHub API error: ${res.status}`);
  }

  return res.json();
}

async function downloadAsset(url: string, dest: string): Promise<void> {
  const res = await fetch(url, {
    headers: { "User-Agent": "openui-mcp-updater", Accept: "application/octet-stream" },
    redirect: "follow",
  });

  if (!res.ok || !res.body) {
    throw new Error(`Download failed: ${res.status}`);
  }

  const ws = createWriteStream(dest);
  await pipeline(Readable.fromWeb(res.body as any), ws);
}

export function applyPendingUpdate(): boolean {
  const execPath = process.execPath;
  const execDir = dirname(execPath);
  const execName = basename(execPath);
  const baseName = execName.replace(/\.exe$/i, "");

  const pendingPath = join(execDir, `${baseName}-pending${process.platform === "win32" ? ".exe" : ""}`);
  const oldPath = join(execDir, `${baseName}-old${process.platform === "win32" ? ".exe" : ""}`);

  if (existsSync(oldPath)) {
    try {
      unlinkSync(oldPath);
    } catch {}
  }

  if (existsSync(pendingPath)) {
    try {
      renameSync(execPath, oldPath);
      renameSync(pendingPath, execPath);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

export async function runUpdate(versionArg?: string) {
  const requestedVersion = versionArg || "latest";

  console.log(`\n  openui-mcp update\n`);
  console.log(`  Current version: ${VERSION}`);
  console.log(`  Checking for ${requestedVersion === "latest" ? "latest version" : requestedVersion}...\n`);

  let release: any;
  try {
    release = await fetchRelease(requestedVersion);
  } catch (err: any) {
    console.log(`  Error: ${err.message}`);
    return;
  }

  const latestVersion = release.tag_name.replace(/^v/, "");

  if (latestVersion === VERSION && requestedVersion === "latest") {
    console.log(`  Already on latest version (${VERSION})`);
    return;
  }

  console.log(`  New version: ${latestVersion}`);

  const artifactName = getPlatformArtifact();
  const asset = release.assets?.find((a: any) => a.name === artifactName);

  if (!asset) {
    console.log(`  Error: No binary found for ${process.platform}/${process.arch}`);
    console.log(`  Available assets: ${release.assets?.map((a: any) => a.name).join(", ") || "none"}`);
    return;
  }

  console.log(`  Downloading ${artifactName}...`);

  const tmpFile = join(tmpdir(), artifactName);
  await downloadAsset(asset.browser_download_url, tmpFile);

  const execDir = dirname(process.execPath);
  const binaryName = getBinaryName();

  if (process.platform === "win32") {
    const pendingPath = join(execDir, binaryName.replace(/\.exe$/, "-pending.exe"));

    if (artifactName.endsWith(".zip")) {
      const proc = Bun.spawnSync(["powershell", "-Command",
        `Expand-Archive -Path '${tmpFile}' -DestinationPath '${tmpdir()}/openui-mcp-update' -Force; ` +
        `Copy-Item '${tmpdir()}/openui-mcp-update/${binaryName}' '${pendingPath}' -Force; ` +
        `Remove-Item '${tmpdir()}/openui-mcp-update' -Recurse -Force`
      ]);
      if (proc.exitCode !== 0) {
        console.log(`  Error extracting update`);
        return;
      }
    } else {
      renameSync(tmpFile, pendingPath);
    }

    console.log(`\n  ✓ Update downloaded (v${latestVersion})`);
    console.log(`  Restart your MCP client to complete the update.\n`);
  } else {
    const targetPath = process.execPath;

    if (artifactName.endsWith(".tar.gz")) {
      const proc = Bun.spawnSync(["tar", "-xzf", tmpFile, "-C", tmpdir()]);
      if (proc.exitCode !== 0) {
        console.log(`  Error extracting update`);
        return;
      }
      const extractedBinary = join(tmpdir(), binaryName);
      if (existsSync(extractedBinary)) {
        renameSync(extractedBinary, targetPath);
        Bun.spawnSync(["chmod", "+x", targetPath]);
      }
    } else {
      renameSync(tmpFile, targetPath);
      Bun.spawnSync(["chmod", "+x", targetPath]);
    }

    console.log(`\n  ✓ Updated to v${latestVersion}`);
    console.log(`  Restart your MCP client to use the new version.\n`);
  }

  try {
    unlinkSync(tmpFile);
  } catch {}
}

export function getVersion(): string {
  return VERSION;
}
