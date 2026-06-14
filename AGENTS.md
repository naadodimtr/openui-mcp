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
- `get_system_prompt` — dynamically generated via library profile. Optional `libraryId` param.
- `get_components` — component name/description/props summary. Optional `libraryId` param.
- `update_spec` — writes to `SPEC_DIR/spec.oui` via `Bun.write()`
- `get_current_spec` — reads current spec file
- `get_preview_url` — returns `http://localhost:{PREVIEWER_PORT}`
- `validate_spec` — parses spec with `createParser` from `@openuidev/lang-core`, returns errors/unresolved/orphaned without writing. Optional `libraryId` param.
- `list_libraries` — returns available library profile IDs, names, and descriptions

HTTP server (binds to `127.0.0.1`) serves:
- Static files from embedded assets (compiled binary) or `previewer/dist/` (dev mode)
- `/api/spec` endpoint (JSON: `{ spec, lastModified }`)
- SPA fallback (all routes → index.html)

Dual serving mode:
- **Compiled binary**: `scripts/embed-assets.ts` inlines `previewer/dist/` into `src/embedded-assets.ts` as strings at build time. Single executable, no external files.
- **Dev mode**: falls back to reading `previewer/dist/` from disk

CLI flags:
- `--port=N` — override previewer port
- `--setup` — interactive MCP client configuration wizard (9 clients)
- `--update [version]` — self-update from GitHub Releases
- `--version` — print current version

CLI commands:
- `init [--library=ID]` — create `.openui/config.json` with default library
- `install-library <source>` — install plugin from `github:org/repo` or local path
- `update-library <id>` — update installed plugin from its source
- `remove-library <id>` — uninstall plugin
- `build-adapter <yaml> [--output=dir]` — build adapter bundle from `openui-mcp-adapter.yaml`

## Library Profiles

Abstraction layer for swapping component libraries / design systems.

```
src/libraries/
  index.ts            — registry: registerLibrary(), getProfile(), listProfiles()
  openui-default.ts   — wraps @openuidev/react-ui/genui-lib (prompt, components, validation)

previewer/src/libraries/
  openui-default.ts   — re-exports openuiLibrary + CSS for renderer
```

Interface: `LibraryProfile { id, name, description, getPrompt(), getComponents(), validate() }`

Validation uses `createParser()` + `enrichErrors()` from `@openuidev/lang-core`.

## Plugin System

Runtime library plugins stored in `~/.openui-mcp/libraries/{id}/`:

```
manifest.json    — metadata + SHA-256 checksums
library.mjs      — server-side: Zod schemas, prompt, validation
renderer.mjs     — client-side: React components (React externalized)
styles.css       — compiled CSS
```

Per-project library selection via `.openui/config.json`:
```json
{ "library": "kumo" }
```

Server reads config on startup, uses it as default for all tool calls. `libraryId` param on tools overrides.

Plugin loading flow:
1. `initPlugins()` scans `~/.openui-mcp/libraries/` for manifest.json files
2. Registers each as a lazy-loaded `LibraryProfile` in the registry
3. On first use, verifies checksums then dynamic `import()` of library.mjs

Security: SHA-256 checksums verified on every load. Source recorded in manifest for audit.

## Adapter Authoring

See `adapters/ADAPTER_GUIDE.md` for creating library adapters.

Standard spec file: `openui-mcp-adapter.yaml` — declarative component mapping.
JSON Schema: `adapters/adapter-schema.json` — validation for the YAML format.
Reference adapter: `adapters/kumo/` — Cloudflare Kumo (demonstrates codegen from registry).

Build pipeline: `openui-mcp build-adapter ./openui-mcp-adapter.yaml --output ./dist/`

## Source Files

| File | Purpose |
|------|---------|
| `src/server.ts` | MCP server + HTTP server, main entry |
| `src/libraries/index.ts` | Library profile registry + plugin integration |
| `src/libraries/openui-default.ts` | Default OpenUI library profile |
| `src/plugins/manifest.ts` | Manifest schema, checksum generation/verification |
| `src/plugins/loader.ts` | Plugin discovery, loading, verification |
| `src/plugins/installer.ts` | Install/update/remove from GitHub or local |
| `src/plugins/builder.ts` | Build adapter bundle from YAML spec |
| `src/setup.ts` | `--setup` wizard, writes MCP config for 9 clients |
| `src/update.ts` | `--update` self-updater, `getVersion()`, `applyPendingUpdate()` |
| `src/embedded-assets.ts` | Generated — inlined previewer dist (gitignored) |

## Version

Version constant lives in `src/update.ts` (`const VERSION = "x.y.z"`). `getVersion()` is used by the MCP server registration and `--version` flag.

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `OPENUI_SPEC_DIR` | `.openui` | Spec file directory (relative to CWD or absolute) |
| `PREVIEWER_PORT` | `6556` | HTTP server port for previewer + API |

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
cd previewer && PREVIEWER_PORT=6556 bun run dev  # Vite dev server on 5173, proxies /api
```

## Testing

```bash
bun test   # Runs tests/server.test.ts + tests/specs.test.ts
```

## Building (compiled binary)

```bash
bun run build   # prebuild (previewer build + embed assets) then bun build --compile
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
