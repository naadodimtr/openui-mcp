import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { mkdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";

const SPEC_DIR = resolve(process.env.OPENUI_SPEC_DIR || ".openui");
const SPEC_FILE = resolve(SPEC_DIR, "spec.oui");
const PREVIEWER_PORT = parseInt(process.env.PREVIEWER_PORT || "3000", 10);
const PREVIEWER_DIST = resolve(import.meta.dir, "..", "previewer", "dist");

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
  if (path.endsWith(".js")) return "application/javascript";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".woff2")) return "font/woff2";
  return "application/octet-stream";
}

function startHttpServer() {
  Bun.serve({
    port: PREVIEWER_PORT,
    async fetch(req) {
      const url = new URL(req.url);

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

      let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
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

      const indexFile = Bun.file(join(PREVIEWER_DIST, "index.html"));
      if (await indexFile.exists()) {
        return new Response(indexFile, {
          headers: { "Content-Type": "text/html" },
        });
      }

      return new Response("Not Found", { status: 404 });
    },
  });
}

async function getSystemPrompt(): Promise<string> {
  const { openuiLibrary, openuiPromptOptions } = await import(
    "@openuidev/react-ui/genui-lib"
  );
  return openuiLibrary.prompt(openuiPromptOptions);
}

async function getComponents(): Promise<
  Array<{ name: string; description: string; props: string[] }>
> {
  const { openuiLibrary } = await import("@openuidev/react-ui/genui-lib");
  const components: Array<{
    name: string;
    description: string;
    props: string[];
  }> = [];

  for (const [name, def] of Object.entries(openuiLibrary.components || {})) {
    const comp = def as {
      description?: string;
      props?: { shape?: Record<string, unknown> };
    };
    components.push({
      name,
      description: comp.description || "",
      props: comp.props?.shape ? Object.keys(comp.props.shape) : [],
    });
  }

  return components;
}

const server = new McpServer({
  name: "openui-mcp",
  version: "0.2.0",
});

server.tool(
  "get_system_prompt",
  "Get the full system prompt for generating OpenUI Lang specs. Inject this into context so the LLM knows the component syntax, available components, and rules.",
  {},
  async () => {
    const prompt = await getSystemPrompt();
    return { content: [{ type: "text", text: prompt }] };
  }
);

server.tool(
  "get_components",
  "Get a summary list of available UI components with their names, descriptions, and prop names.",
  {},
  async () => {
    const components = await getComponents();
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

async function main() {
  await ensureSpecDir();
  startHttpServer();

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(`[openui-mcp] Fatal error: ${err.message}`);
  process.exit(1);
});
