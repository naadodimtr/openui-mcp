# OpenUI MCP

MCP server + live previewer for generating structured web UI through AI chat.

## Architecture

```
MCP Client (stdio) → src/server.ts → writes .openui/spec.oui
                                    → Bun.serve() on PREVIEWER_PORT
                                       ├── GET / → serves previewer SPA
                                       └── GET /api/spec → returns spec JSON
Previewer SPA (polls /api/spec every 500ms) → <Renderer> renders in browser
```

Two packages:
- Root: MCP server (TypeScript, Bun runtime, stdio + HTTP)
- `previewer/`: Vite + React SPA that renders OpenUI specs

## MCP Server (`src/server.ts`)

Single-file server using `@modelcontextprotocol/sdk`. Stdio transport + `Bun.serve()` HTTP server.

Tools exposed:
- `get_system_prompt` — dynamically generated from `openuiLibrary.prompt()`
- `get_components` — component name/description/props summary (reads from Zod schema `.shape`)
- `update_spec` — writes to `SPEC_DIR/spec.oui` via `Bun.write()`
- `get_current_spec` — reads current spec file
- `get_preview_url` — returns `http://localhost:{PREVIEWER_PORT}`

HTTP server serves:
- Static files from `previewer/dist/` (pre-built Vite SPA)
- `/api/spec` endpoint (JSON: `{ spec, lastModified }`)
- SPA fallback (all routes → index.html)

Dual mode:
- **Dev mode**: serves from `previewer/dist/` on disk
- **Compiled binary**: serves from `src/embedded-assets.ts` (generated, embedded in binary)

CLI flags:
- `--port=N` — override previewer port
- `--setup` — interactive MCP client configuration wizard

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `OPENUI_SPEC_DIR` | `.openui` | Spec file directory (relative to CWD or absolute) |
| `PREVIEWER_PORT` | `6556` | HTTP server port for previewer + API |
| `PREVIEWER_DIST` | `../previewer/dist` (relative to server) | Override previewer static files path |

## Key Dependencies

- `@modelcontextprotocol/sdk` — MCP protocol implementation
- `@openuidev/react-ui` — component library + prompt generation
- `@openuidev/react-lang` — OpenUI Lang renderer
- `@openuidev/lang-core` — parser, runtime, validation
- `react`, `react-dom` — required by `@openuidev/react-ui` for component metadata imports

## Development

```bash
bun install && cd previewer && bun install && bun run build && cd ..
bun src/server.ts        # MCP server + HTTP on port 6556
# OR for previewer hot-reload:
bun src/server.ts &      # MCP server (background)
cd previewer && bun run dev  # Vite dev server on 5173, proxies /api to 6556
```

## Testing

```bash
bun test   # Runs tests/server.test.ts + tests/specs.test.ts
```

## Building (compiled binary)

```bash
cd previewer && bun run build && cd ..
bun scripts/embed-assets.ts
bun build --compile src/server.ts --outfile dist/openui-mcp
```

Cross-compile: `--target=bun-linux-x64`, `--target=bun-darwin-arm64`, `--target=bun-windows-x64`

## E2E Tests

```bash
bunx playwright test   # Browser-based tests (starts server, verifies rendering)
```

Tests cover: empty state, text, cards, tables, charts, forms, spec updates, complex dashboards, callouts, tabs.

## Scripts

- `scripts/embed-assets.ts` — reads `previewer/dist/`, generates `src/embedded-assets.ts`
- `scripts/generate-e2e-specs.ts` — reads component library, generates per-component test specs

## Conventions

- Bun runtime, TypeScript, ESM (`"type": "module"`)
- No comments in code
- Pin OpenUI package versions with `^` semver
- `openui/` directory is gitignored reference-only clone
- Tests use `bun:test` (built-in test runner)
