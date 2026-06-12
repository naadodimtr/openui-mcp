import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { homedir } from "node:os";
import * as readline from "node:readline";

interface ToolConfig {
  name: string;
  configPath: string;
  format: (binary: string, port: number) => object;
  merge: (existing: any, entry: object) => any;
}

const home = homedir();
const binaryPath = process.execPath;

const tools: ToolConfig[] = [
  {
    name: "OpenCode",
    configPath: join(home, ".config", "opencode", "opencode.json"),
    format: (bin, port) => ({
      type: "local",
      command: [bin],
      environment: { PREVIEWER_PORT: String(port) },
      enabled: true,
    }),
    merge: (existing, entry) => {
      existing.mcp = existing.mcp || {};
      existing.mcp.openui = entry;
      return existing;
    },
  },
  {
    name: "Claude Code",
    configPath: join(home, ".claude.json"),
    format: (bin, port) => ({
      command: bin,
      args: [],
      env: { PREVIEWER_PORT: String(port) },
    }),
    merge: (existing, entry) => {
      existing.mcpServers = existing.mcpServers || {};
      existing.mcpServers.openui = entry;
      return existing;
    },
  },
  {
    name: "Cursor",
    configPath: join(home, ".cursor", "mcp.json"),
    format: (bin, port) => ({
      command: bin,
      args: [],
      env: { PREVIEWER_PORT: String(port) },
    }),
    merge: (existing, entry) => {
      existing.mcpServers = existing.mcpServers || {};
      existing.mcpServers.openui = entry;
      return existing;
    },
  },
  {
    name: "Windsurf",
    configPath: join(home, ".codeium", "windsurf", "mcp_config.json"),
    format: (bin, port) => ({
      command: bin,
      args: [],
      env: { PREVIEWER_PORT: String(port) },
    }),
    merge: (existing, entry) => {
      existing.mcpServers = existing.mcpServers || {};
      existing.mcpServers.openui = entry;
      return existing;
    },
  },
  {
    name: "Gemini CLI",
    configPath: join(home, ".gemini", "settings.json"),
    format: (bin, port) => ({
      command: bin,
      args: [],
      env: { PREVIEWER_PORT: String(port) },
    }),
    merge: (existing, entry) => {
      existing.mcpServers = existing.mcpServers || {};
      existing.mcpServers.openui = entry;
      return existing;
    },
  },
  {
    name: "GitHub Copilot",
    configPath: join(process.cwd(), ".github", "copilot-mcp.json"),
    format: (bin, port) => ({
      command: bin,
      args: [],
      env: { PREVIEWER_PORT: String(port) },
    }),
    merge: (existing, entry) => {
      existing.servers = existing.servers || {};
      existing.servers.openui = entry;
      return existing;
    },
  },
  {
    name: "Amazon Q",
    configPath: join(home, ".aws", "amazonq", "mcp.json"),
    format: (bin, port) => ({
      command: bin,
      args: [],
      env: { PREVIEWER_PORT: String(port) },
    }),
    merge: (existing, entry) => {
      existing.mcpServers = existing.mcpServers || {};
      existing.mcpServers.openui = entry;
      return existing;
    },
  },
  {
    name: "Cline",
    configPath: join(home, ".vscode", "settings.json"),
    format: (bin, port) => ({
      command: bin,
      args: [],
      env: { PREVIEWER_PORT: String(port) },
    }),
    merge: (existing, entry) => {
      existing["cline.mcpServers"] = existing["cline.mcpServers"] || {};
      existing["cline.mcpServers"].openui = entry;
      return existing;
    },
  },
  {
    name: "RooCode",
    configPath: join(home, ".vscode", "settings.json"),
    format: (bin, port) => ({
      command: bin,
      args: [],
      env: { PREVIEWER_PORT: String(port) },
    }),
    merge: (existing, entry) => {
      existing["roo-cline.mcpServers"] = existing["roo-cline.mcpServers"] || {};
      existing["roo-cline.mcpServers"].openui = entry;
      return existing;
    },
  },
  {
    name: "Kilo Code",
    configPath: join(home, ".vscode", "settings.json"),
    format: (bin, port) => ({
      command: bin,
      args: [],
      env: { PREVIEWER_PORT: String(port) },
    }),
    merge: (existing, entry) => {
      existing["kilo-code.mcpServers"] = existing["kilo-code.mcpServers"] || {};
      existing["kilo-code.mcpServers"].openui = entry;
      return existing;
    },
  },
];

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

export async function runSetup(defaultPort: number) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log("\n  openui-mcp setup\n");
  console.log("  Available MCP clients:\n");

  tools.forEach((t, i) => {
    console.log(`    ${i + 1}. ${t.name}`);
  });

  console.log("");
  const choice = await prompt(rl, `  Select client (1-${tools.length}): `);
  const idx = parseInt(choice, 10) - 1;

  if (idx < 0 || idx >= tools.length) {
    console.log("  Invalid selection.");
    rl.close();
    return;
  }

  const tool = tools[idx];

  const portInput = await prompt(rl, `  Previewer port (default: ${defaultPort}): `);
  const port = portInput.trim() ? parseInt(portInput.trim(), 10) : defaultPort;

  rl.close();

  const entry = tool.format(binaryPath, port);
  const configDir = dirname(tool.configPath);

  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  let existing: any = {};
  if (existsSync(tool.configPath)) {
    try {
      existing = JSON.parse(readFileSync(tool.configPath, "utf-8"));
    } catch {
      existing = {};
    }
  }

  const updated = tool.merge(existing, entry);
  writeFileSync(tool.configPath, JSON.stringify(updated, null, 2) + "\n", "utf-8");

  console.log(`\n  ✓ Added openui-mcp to ${tool.name} config`);
  console.log(`    Config: ${tool.configPath}`);
  console.log(`    Preview: http://localhost:${port}`);
  console.log(`    MCP: stdio (auto-managed by ${tool.name})\n`);
}
