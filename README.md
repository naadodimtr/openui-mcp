# @naadodimtr/openui-mcp

MCP server for creating structured web UI through AI chat. Connects to any MCP client (opencode, Claude Desktop, etc.) and renders OpenUI components live in a browser previewer.

## Architecture

```
MCP Client (opencode)  →  MCP Server (stdio)  →  writes .openui/spec.oui  →  Previewer (polls file)  →  browser
```

## Setup

```bash
git clone https://github.com/naadodimtr/openui-mcp
cd openui-mcp
npm install
cd previewer && npm install && cd ..
```

## Usage

### Development

Add to your MCP client config (e.g. opencode.json):

```json
{
  "mcpServers": {
    "openui": {
      "command": "npx",
      "args": ["tsx", "src/server.ts"],
      "cwd": "/path/to/openui-mcp",
      "env": {
        "PREVIEWER_PORT": "3000",
        "OPENUI_SPEC_DIR": ".openui"
      }
    }
  }
}
```

The server auto-starts the previewer at `http://localhost:3000`.

### MCP Tools

| Tool | Description |
|------|-------------|
| `get_system_prompt` | Returns the full system prompt for generating valid OpenUI Lang specs |
| `get_components` | Returns available component names, descriptions, and prop names |
| `update_spec` | Writes a spec to the previewer (triggers re-render) |
| `get_current_spec` | Reads the current spec being rendered |
| `get_preview_url` | Returns the previewer URL |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENUI_SPEC_DIR` | `.openui` | Directory for spec files (relative to CWD or absolute) |
| `PREVIEWER_PORT` | `3000` | Port for the previewer web app |
| `NODE_ENV` | — | Set to `production` to use `next start` instead of `next dev` |

## How It Works

1. MCP client calls `get_system_prompt` → LLM learns OpenUI Lang syntax
2. User describes desired UI in chat
3. LLM generates OpenUI Lang spec, client calls `update_spec`
4. MCP server writes spec to `.openui/spec.oui`
5. Previewer polls the file every 500ms, detects change, re-renders with `<Renderer>`
6. User sees live UI in browser, iterates via chat
