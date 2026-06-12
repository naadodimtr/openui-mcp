# @naadodimtr/openui-mcp

MCP server for creating structured web UI through AI chat. Connects to any MCP client (opencode, Claude Desktop, etc.) and renders OpenUI components live in a browser previewer.

## Architecture

```
MCP Client (opencode)  →  MCP Server (stdio + HTTP)  →  writes .openui/spec.oui
                                                      →  serves previewer SPA + /api/spec
                                                              ↓
                                                      Browser polls /api/spec → renders UI
```

## Quick Start

```bash
bun install
cd previewer && bun install && bun run build && cd ..
bun src/server.ts   # MCP server + previewer on http://localhost:3000
```

## MCP Client Configuration

### opencode

```json
{
  "mcpServers": {
    "openui": {
      "type": "local",
      "command": ["bun", "src/server.ts"],
      "cwd": "/path/to/openui-mcp",
      "enabled": true
    }
  }
}
```

### Compiled Binary (no Bun required)

```bash
bun build --compile src/server.ts --outfile openui-mcp
```

```json
{
  "mcpServers": {
    "openui": {
      "type": "local",
      "command": ["/path/to/openui-mcp"],
      "enabled": true
    }
  }
}
```

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
| `PREVIEWER_PORT` | `3000` | Port for the previewer + API |

## Development

```bash
# Terminal 1: MCP server (serves API + pre-built previewer)
bun src/server.ts

# Terminal 2: Previewer with hot-reload (optional)
cd previewer && bun run dev   # Vite on :5173, proxies /api to :3000
```

## Testing

```bash
bun test
```

## Cross-Platform Builds

```bash
bun build --compile src/server.ts --target=bun-linux-x64 --outfile dist/openui-mcp-linux
bun build --compile src/server.ts --target=bun-darwin-arm64 --outfile dist/openui-mcp-darwin
bun build --compile src/server.ts --target=bun-windows-x64 --outfile dist/openui-mcp.exe
```
