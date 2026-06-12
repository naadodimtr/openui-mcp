# @naadodimtr/openui-mcp

MCP server for creating structured web UI through AI chat. Connects to any MCP client (opencode, Claude Desktop, etc.) and renders OpenUI components live in a browser previewer.

## Architecture

```
MCP Client (opencode)  →  MCP Server (stdio + HTTP)  →  writes .openui/spec.oui
                                                      →  Bun.serve() on :6556
                                                              ↓
                                                      Browser polls /api/spec → renders UI
```

## Quick Start

```bash
bun install
cd previewer && bun install && bun run build && cd ..
bun src/server.ts   # MCP server + previewer on http://localhost:6556
```

## Setup Wizard

Auto-configure your MCP client with a compiled binary:

```bash
./openui-mcp --setup
```

Supports: OpenCode, Claude Code, Cursor, Windsurf, Gemini CLI, GitHub Copilot, Codex, Antigravity, Crush.

## MCP Client Configuration

### opencode

```json
{
  "mcp": {
    "openui": {
      "type": "local",
      "command": ["/path/to/openui-mcp"],
      "enabled": true
    }
  }
}
```

### Claude Desktop / Cursor / Windsurf

```json
{
  "mcpServers": {
    "openui": {
      "command": "/path/to/openui-mcp",
      "args": [],
      "env": { "PREVIEWER_PORT": "6556" }
    }
  }
}
```

### From source (no compile)

```json
{
  "mcpServers": {
    "openui": {
      "command": "bun",
      "args": ["src/server.ts"],
      "env": { "PREVIEWER_PORT": "6556" }
    }
  }
}
```

## CLI Flags

| Flag | Description |
|------|-------------|
| `--port=N` | Override previewer HTTP port (default: 6556) |
| `--setup` | Interactive MCP client configuration wizard |
| `--update [version]` | Self-update from GitHub Releases (latest or pinned) |
| `--version` | Print current version |

## MCP Tools

| Tool | Description |
|------|-------------|
| `get_system_prompt` | Returns the full system prompt for generating valid OpenUI Lang specs |
| `get_components` | Returns available component names, descriptions, and prop names |
| `update_spec` | Writes a spec to the previewer (triggers re-render in browser) |
| `get_current_spec` | Reads the current spec being rendered |
| `get_preview_url` | Returns the previewer URL |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENUI_SPEC_DIR` | `.openui` | Directory for spec files (relative to CWD or absolute) |
| `PREVIEWER_PORT` | `6556` | Port for the previewer + API |

## Development

```bash
# Terminal 1: MCP server (serves API + pre-built previewer)
bun src/server.ts

# Terminal 2: Previewer with hot-reload (optional)
cd previewer && PREVIEWER_PORT=6556 bun run dev   # Vite on :5173, proxies /api to :6556
```

## Testing

```bash
bun test                # Unit + spec stress tests
bunx playwright test    # E2E browser tests (starts server, verifies rendering)
```

## Building

```bash
bun run build   # Runs prebuild (previewer build + embed assets) then compiles binary
```

### Cross-Platform

```bash
bun build --compile src/server.ts --target=bun-linux-x64 --outfile dist/openui-mcp-linux
bun build --compile src/server.ts --target=bun-darwin-arm64 --outfile dist/openui-mcp-darwin
bun build --compile src/server.ts --target=bun-windows-x64 --outfile dist/openui-mcp.exe
```
