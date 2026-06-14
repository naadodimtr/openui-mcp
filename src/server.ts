import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { mkdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { applyPendingUpdate, getVersion } from "./update.js";
import { getProfile, listProfiles, initPlugins, getProjectLibrary } from "./libraries/index.js";
import { getPluginDir } from "./plugins/loader.js";

applyPendingUpdate();

let embeddedAssets: Record<string, string> = {};
try {
  const mod = await import("./embedded-assets.js");
  embeddedAssets = mod.default;
} catch {}

const args = process.argv.slice(2);
const portFlag = args.find((a) => a.startsWith("--port="));
const portArg = portFlag ? portFlag.split("=")[1] : undefined;

if (args.includes("--version")) {
  console.log(`openui-mcp v${getVersion()}`);
  process.exit(0);
}

if (args.includes("--update")) {
  const { runUpdate } = await import("./update.js");
  const versionArg = args[args.indexOf("--update") + 1];
  const version = versionArg && !versionArg.startsWith("--") ? versionArg : undefined;
  await runUpdate(version);
  process.exit(0);
}

if (args.includes("install-library")) {
  const { installLibrary } = await import("./plugins/installer.js");
  const source = args[args.indexOf("install-library") + 1];
  if (!source || source.startsWith("--")) {
    console.error("Usage: openui-mcp install-library <source>");
    console.error("  Sources: github:owner/repo, ./local/path");
    process.exit(1);
  }
  const versionArg = args.find((a) => a.startsWith("--version="));
  const version = versionArg ? versionArg.split("=")[1] : undefined;
  try {
    const result = await installLibrary(source, version);
    console.log(`\n  ✓ Installed "${result.name}" (${result.id}) v${result.version}`);
    console.log(`    Source: ${result.source}\n`);
  } catch (err) {
    console.error(`  Error: ${(err as Error).message}`);
    process.exit(1);
  }
  process.exit(0);
}

if (args.includes("update-library")) {
  const { updateLibrary } = await import("./plugins/installer.js");
  const id = args[args.indexOf("update-library") + 1];
  if (!id || id.startsWith("--")) {
    console.error("Usage: openui-mcp update-library <id>");
    process.exit(1);
  }
  try {
    const result = await updateLibrary(id);
    console.log(`\n  ✓ Updated "${result.name}" to v${result.version}\n`);
  } catch (err) {
    console.error(`  Error: ${(err as Error).message}`);
    process.exit(1);
  }
  process.exit(0);
}

if (args.includes("remove-library")) {
  const { removeLibrary } = await import("./plugins/installer.js");
  const id = args[args.indexOf("remove-library") + 1];
  if (!id || id.startsWith("--")) {
    console.error("Usage: openui-mcp remove-library <id>");
    process.exit(1);
  }
  try {
    removeLibrary(id);
    console.log(`\n  ✓ Removed "${id}"\n`);
  } catch (err) {
    console.error(`  Error: ${(err as Error).message}`);
    process.exit(1);
  }
  process.exit(0);
}

if (args.includes("build-adapter")) {
  const { buildAdapter } = await import("./plugins/builder.js");
  const yamlPath = args[args.indexOf("build-adapter") + 1];
  if (!yamlPath || yamlPath.startsWith("--")) {
    console.error("Usage: openui-mcp build-adapter <yaml-path> [--output=./dist]");
    process.exit(1);
  }
  const outputFlag = args.find((a) => a.startsWith("--output="));
  const outputDir = outputFlag ? outputFlag.split("=")[1] : "./dist";
  try {
    console.log(`\n  Building adapter from ${yamlPath}...\n`);
    const result = await buildAdapter(yamlPath, outputDir);
    console.log(`  ✓ Built "${result.name}" (${result.id}) v${result.version}`);
    console.log(`    Output: ${result.outputDir}`);
    console.log(`    Files: ${result.files.join(", ")}\n`);
  } catch (err) {
    console.error(`  Error: ${(err as Error).message}`);
    process.exit(1);
  }
  process.exit(0);
}

if (args.includes("init")) {
  const specDir = resolve(process.env.OPENUI_SPEC_DIR || ".openui");
  if (!existsSync(specDir)) {
    await mkdir(specDir, { recursive: true });
  }
  const libArg = args.find((a) => a.startsWith("--library="));
  const library = libArg ? libArg.split("=")[1] : "openui-default";
  const configPath = resolve(specDir, "config.json");
  await Bun.write(configPath, JSON.stringify({ library }, null, 2) + "\n");
  console.log(`\n  ✓ Initialized .openui/config.json`);
  console.log(`    Library: ${library}\n`);
  process.exit(0);
}

const SPEC_DIR = resolve(process.env.OPENUI_SPEC_DIR || ".openui");
const SPEC_FILE = resolve(SPEC_DIR, "spec.oui");
const PREVIEWER_PORT = parseInt(portArg || process.env.PREVIEWER_PORT || "6556", 10);
const PREVIEWER_DIST = process.env.PREVIEWER_DIST
  ? resolve(process.env.PREVIEWER_DIST)
  : resolve(import.meta.dir, "..", "previewer", "dist");

const HAS_EMBEDDED = Object.keys(embeddedAssets).length > 0;

async function ensureSpecDir() {
  if (!existsSync(SPEC_DIR)) {
    await mkdir(SPEC_DIR, { recursive: true });
  }
  if (!existsSync(SPEC_FILE)) {
    await Bun.write(SPEC_FILE, "");
  }
}

function getMimeType(path: string): string {
  if (path.endsWith(".html")) return "text/html";
  if (path.endsWith(".js") || path.endsWith(".mjs")) return "application/javascript";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".woff2")) return "font/woff2";
  return "application/octet-stream";
}

function serveEmbedded(filePath: string): Response | null {
  const content = embeddedAssets[filePath];
  if (content !== undefined) {
    return new Response(content, {
      headers: { "Content-Type": getMimeType(filePath) },
    });
  }
  return null;
}

async function serveDisk(filePath: string): Promise<Response | null> {
  const fullPath = join(PREVIEWER_DIST, filePath);
  if (!fullPath.startsWith(PREVIEWER_DIST)) {
    return new Response("Forbidden", { status: 403 });
  }
  const file = Bun.file(fullPath);
  if (await file.exists()) {
    return new Response(file, {
      headers: { "Content-Type": getMimeType(fullPath) },
    });
  }
  return null;
}

function startHttpServer() {
  try {
  Bun.serve({
    hostname: "127.0.0.1",
    port: PREVIEWER_PORT,
    async fetch(req) {
      const url = new URL(req.url);

      if (url.pathname === "/api/library-info") {
        return Response.json({ id: getProjectLibrary(SPEC_DIR) });
      }

      if (url.pathname.startsWith("/libraries/")) {
        const parts = url.pathname.slice("/libraries/".length).split("/");
        const libId = parts[0];
        const libFile = parts.slice(1).join("/");
        if (libId && libFile) {
          const pluginDir = getPluginDir(libId);
          const fullPath = join(pluginDir, libFile);
          if (!fullPath.startsWith(pluginDir)) {
            return new Response("Forbidden", { status: 403 });
          }
          const file = Bun.file(fullPath);
          if (await file.exists()) {
            const content = await file.arrayBuffer();
            return new Response(content, {
              headers: {
                "Content-Type": getMimeType(fullPath),
                "Access-Control-Allow-Origin": "*",
              },
            });
          }
        }
        return new Response("Not Found", { status: 404 });
      }

      if (url.pathname === "/api/spec") {
        try {
          if (!existsSync(SPEC_FILE)) {
            return Response.json({ spec: "", lastModified: 0 });
          }
          const [content, stats] = await Promise.all([
            readFile(SPEC_FILE, "utf-8"),
            stat(SPEC_FILE),
          ]);
          return Response.json({ spec: content, lastModified: stats.mtimeMs });
        } catch {
          return Response.json({ spec: "", lastModified: 0 });
        }
      }

      const filePath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);

      if (HAS_EMBEDDED) {
        const res = serveEmbedded(filePath);
        if (res) return res;
        const fallback = serveEmbedded("index.html");
        if (fallback) return fallback;
      } else {
        const res = await serveDisk(filePath);
        if (res) return res;
        const fallback = await serveDisk("index.html");
        if (fallback) return fallback;
      }

      return new Response("Not Found", { status: 404 });
    },
  });
  } catch (err) {
    const msg = (err as Error).message || "";
    if (msg.includes("EADDRINUSE") || msg.includes("address already in use") || msg.includes("already being used") || msg.includes("Failed to start")) {
      console.error(`[openui-mcp] Port ${PREVIEWER_PORT} is already in use. Previewer disabled — MCP tools still active.`);
      console.error(`[openui-mcp] To use a different port: openui-mcp --port=${PREVIEWER_PORT + 1}`);
      return;
    }
    throw err;
  }
}

const DEFAULT_LIBRARY = getProjectLibrary(SPEC_DIR);

if (args.includes("--setup")) {
  const { runSetup } = await import("./setup.js");
  await runSetup(PREVIEWER_PORT);
  process.exit(0);
}

const server = new McpServer({
  name: "openui-mcp",
  version: getVersion(),
});

server.tool(
  "get_system_prompt",
  "Get the full system prompt for generating OpenUI Lang specs. Inject this into context so the LLM knows the component syntax, available components, and rules.",
  { libraryId: z.string().optional().describe("Library profile ID (default: openui-default)") },
  async ({ libraryId }) => {
    const profile = await getProfile(libraryId || DEFAULT_LIBRARY);
    const prompt = await profile.getPrompt();
    return { content: [{ type: "text", text: prompt }] };
  }
);

server.tool(
  "get_components",
  "Get a summary list of available UI components with their names, descriptions, and prop names.",
  { libraryId: z.string().optional().describe("Library profile ID (default: openui-default)") },
  async ({ libraryId }) => {
    const profile = await getProfile(libraryId || DEFAULT_LIBRARY);
    const components = await profile.getComponents();
    return {
      content: [{ type: "text", text: JSON.stringify(components, null, 2) }],
    };
  }
);

server.tool(
  "update_spec",
  "Write an OpenUI Lang spec to the previewer. The spec will be rendered live in the browser. Pass the full spec string (not a diff).",
  { spec: z.string().describe("The full OpenUI Lang spec to render") },
  async ({ spec }) => {
    await ensureSpecDir();
    await Bun.write(SPEC_FILE, spec);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            preview_url: `http://localhost:${PREVIEWER_PORT}`,
          }),
        },
      ],
    };
  }
);

server.tool(
  "get_current_spec",
  "Read the current OpenUI Lang spec from the previewer file. Use this to understand what's currently rendered before making changes.",
  {},
  async () => {
    await ensureSpecDir();
    const spec = await readFile(SPEC_FILE, "utf-8");
    return { content: [{ type: "text", text: spec || "(empty)" }] };
  }
);

server.tool(
  "get_preview_url",
  "Get the URL where the live preview is running.",
  {},
  async () => {
    return {
      content: [
        { type: "text", text: `http://localhost:${PREVIEWER_PORT}` },
      ],
    };
  }
);

server.tool(
  "validate_spec",
  "Validate an OpenUI Lang spec without writing it. Returns parse errors, unresolved references, and orphaned statements.",
  {
    spec: z.string().describe("The OpenUI Lang spec to validate"),
    libraryId: z.string().optional().describe("Library profile ID (default: openui-default)"),
  },
  async ({ spec, libraryId }) => {
    const profile = await getProfile(libraryId || DEFAULT_LIBRARY);
    const result = await profile.validate(spec);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "list_libraries",
  "List available component library profiles.",
  {},
  async () => {
    const libraries = listProfiles();
    return {
      content: [{ type: "text", text: JSON.stringify(libraries, null, 2) }],
    };
  }
);

async function main() {
  await ensureSpecDir();
  initPlugins();
  startHttpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(`[openui-mcp] Fatal error: ${err.message}`);
  process.exit(1);
});
