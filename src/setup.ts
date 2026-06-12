import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { homedir } from "node:os";
import * as readline from "node:readline";

const home = homedir();
const binaryPath = process.execPath;

interface ToolConfig {
  name: string;
  configPath: string;
  write: (port: number) => void;
}

function readJson(path: string): any {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return {};
  }
}

function writeJson(path: string, data: any) {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function writeMcpServersEntry(configPath: string, key: string, port: number, entry: any) {
  const data = readJson(configPath);
  data[key] = data[key] || {};
  data[key].openui = entry;
  writeJson(configPath, data);
}

function stdioEntry(port: number) {
  return {
    command: binaryPath,
    args: [],
    env: { PREVIEWER_PORT: String(port) },
  };
}

const tools: ToolConfig[] = [
  {
    name: "OpenCode",
    configPath: join(home, ".config", "opencode", "opencode.json"),
    write(port) {
      const data = readJson(this.configPath);
      data.mcp = data.mcp || {};
      data.mcp.openui = {
        type: "local",
        command: [binaryPath],
        environment: { PREVIEWER_PORT: String(port) },
        enabled: true,
      };
      writeJson(this.configPath, data);
    },
  },
  {
    name: "Claude Code",
    configPath: join(home, ".claude.json"),
    write(port) {
      writeMcpServersEntry(this.configPath, "mcpServers", port, stdioEntry(port));
    },
  },
  {
    name: "Cursor",
    configPath: join(home, ".cursor", "mcp.json"),
    write(port) {
      writeMcpServersEntry(this.configPath, "mcpServers", port, stdioEntry(port));
    },
  },
  {
    name: "Windsurf",
    configPath: join(home, ".codeium", "windsurf", "mcp_config.json"),
    write(port) {
      writeMcpServersEntry(this.configPath, "mcpServers", port, stdioEntry(port));
    },
  },
  {
    name: "Gemini CLI",
    configPath: join(home, ".gemini", "settings.json"),
    write(port) {
      writeMcpServersEntry(this.configPath, "mcpServers", port, stdioEntry(port));
    },
  },
  {
    name: "GitHub Copilot",
    configPath: join(process.cwd(), ".github", "copilot-mcp.json"),
    write(port) {
      writeMcpServersEntry(this.configPath, "servers", port, stdioEntry(port));
    },
  },
  {
    name: "Codex",
    configPath: join(home, ".codex", "config.toml"),
    write(port) {
      const dir = dirname(this.configPath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

      let content = "";
      if (existsSync(this.configPath)) {
        content = readFileSync(this.configPath, "utf-8");
      }

      const serverBlock = [
        "",
        "[mcp_servers.openui]",
        `command = "${binaryPath.replace(/\\/g, "/")}"`,
        "args = []",
        "",
        "[mcp_servers.openui.env]",
        `PREVIEWER_PORT = "${port}"`,
        "",
      ].join("\n");

      if (content.includes("[mcp_servers.openui]")) {
        content = content.replace(
          /\[mcp_servers\.openui\][\s\S]*?(?=\n\[|$)/,
          serverBlock.trim()
        );
      } else {
        content = content.trimEnd() + "\n" + serverBlock;
      }

      writeFileSync(this.configPath, content, "utf-8");
    },
  },
  {
    name: "Antigravity",
    configPath: join(home, ".gemini", "config", "mcp_config.json"),
    write(port) {
      writeMcpServersEntry(this.configPath, "mcpServers", port, stdioEntry(port));
    },
  },
  {
    name: "Crush",
    configPath: join(home, ".config", "crush", "crush.json"),
    write(port) {
      const data = readJson(this.configPath);
      data.mcp = data.mcp || {};
      data.mcp.openui = {
        type: "stdio",
        command: binaryPath,
        args: [],
        env: { PREVIEWER_PORT: String(port) },
      };
      writeJson(this.configPath, data);
    },
  },
];

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

export async function runSetup(defaultPort: number) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log("\n  openui-mcp setup\n");
  console.log("  Select your MCP client:\n");

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

  tool.write(port);

  console.log(`\n  ✓ Added openui-mcp to ${tool.name}`);
  console.log(`    Config: ${tool.configPath}`);
  console.log(`    Preview: http://localhost:${port}`);
  console.log(`    MCP: stdio (auto-managed by ${tool.name})\n`);
}
