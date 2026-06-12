import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn, ChildProcess } from "node:child_process";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SPEC_DIR = resolve(process.env.OPENUI_SPEC_DIR || ".openui");
const SPEC_FILE = resolve(SPEC_DIR, "spec.oui");
const PREVIEWER_PORT = process.env.PREVIEWER_PORT || "3000";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const PREVIEWER_DIR = resolve(__dirname, "..", "previewer");

let previewerProcess: ChildProcess | null = null;

async function ensureSpecDir() {
  if (!existsSync(SPEC_DIR)) {
    await mkdir(SPEC_DIR, { recursive: true });
  }
  if (!existsSync(SPEC_FILE)) {
    await writeFile(SPEC_FILE, "", "utf-8");
  }
}

function startPreviewer() {
  if (previewerProcess) return;

  const command = IS_PRODUCTION ? "start" : "dev";

  try {
    previewerProcess = spawn(`npx next ${command} -p ${PREVIEWER_PORT}`, [], {
      cwd: PREVIEWER_DIR,
      stdio: "ignore",
      shell: true,
      env: {
        ...process.env,
        OPENUI_SPEC_FILE: SPEC_FILE,
      },
      detached: false,
    });

    previewerProcess.on("error", (err) => {
      console.error(`[openui-mcp] Failed to start previewer: ${err.message}`);
      previewerProcess = null;
    });

    previewerProcess.on("exit", (code) => {
      if (code !== null && code !== 0) {
        console.error(`[openui-mcp] Previewer exited with code ${code}`);
      }
      previewerProcess = null;
    });
  } catch (err) {
    console.error(`[openui-mcp] Failed to spawn previewer: ${(err as Error).message}`);
  }
}

function stopPreviewer() {
  if (previewerProcess) {
    previewerProcess.kill();
    previewerProcess = null;
  }
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
  version: "0.1.0",
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
    await writeFile(SPEC_FILE, spec, "utf-8");
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
  startPreviewer();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.on("SIGINT", () => {
    stopPreviewer();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    stopPreviewer();
    process.exit(0);
  });

  process.on("exit", () => {
    stopPreviewer();
  });
}

main().catch((err) => {
  console.error(`[openui-mcp] Fatal error: ${err.message}`);
  stopPreviewer();
  process.exit(1);
});
