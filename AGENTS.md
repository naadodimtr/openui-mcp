# OpenUI MCP

MCP server + live previewer for generating structured web UI through AI chat.

## Architecture

```
MCP Client (stdio) → src/server.ts → writes .openui/spec.oui → previewer polls → renders in browser
```

Two independent packages:
- Root: MCP server (TypeScript, Node.js, stdio transport)
- `previewer/`: Next.js 16 app that renders OpenUI specs

## MCP Server (`src/server.ts`)

Single-file server using `@modelcontextprotocol/sdk`. Stdio transport.

Tools exposed:
- `get_system_prompt` — dynamically generated from `openuiLibrary.prompt()`
- `get_components` — component name/description/props summary
- `update_spec` — writes to `SPEC_DIR/spec.oui`, triggers previewer re-render
- `get_current_spec` — reads current spec file
- `get_preview_url` — returns `http://localhost:{PREVIEWER_PORT}`

Auto-spawns previewer as child process on startup. Kills on exit.

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `OPENUI_SPEC_DIR` | `.openui` | Spec file directory (relative to CWD or absolute) |
| `PREVIEWER_PORT` | `3000` | Previewer port |
| `NODE_ENV` | — | `production` → `next start`; otherwise `next dev` |

## Key Dependencies

- `@modelcontextprotocol/sdk` — MCP protocol implementation
- `@openuidev/react-ui` — component library + prompt generation
- `@openuidev/react-lang` — OpenUI Lang renderer
- `@openuidev/lang-core` — parser, runtime, validation

React is a dependency only because `@openuidev/react-ui` requires it for component metadata imports. No rendering happens server-side.

## Development

```bash
npm install && cd previewer && npm install
# MCP server: npx tsx src/server.ts
# Previewer standalone: OPENUI_SPEC_FILE=/abs/path npm run dev
```

## Publishing

Package name: `@naadodimtr/openui-mcp`. The `bin` entry points to `dist/server.js`. Run `npm run build` (tsc) before publish. The `files` field includes `dist/` and `previewer/`.

## Conventions

- TypeScript strict mode, ES2022 target, ESM (`"type": "module"`)
- No comments in code
- Pin OpenUI package versions with `^` semver
- `openui/` directory is gitignored reference-only clone (not a dependency)
