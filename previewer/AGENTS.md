# Previewer

Vite + React SPA. Polls the MCP server's `/api/spec` endpoint and renders OpenUI components.

## Data Flow

```
MCP server writes .openui/spec.oui → Bun.serve() serves /api/spec → App.tsx polls (500ms) → <Renderer> re-renders
```

## Key Files

- `src/App.tsx` — Polls `/api/spec`, renders `<Renderer>` inside `<ErrorBoundary>`. Shows placeholder when empty.
- `src/ErrorBoundary.tsx` — React error boundary. On render failure, shows error message + stack trace + raw spec text. Auto-resets when spec changes.
- `src/libraries/openui-default.ts` — Re-exports `openuiLibrary` + CSS imports. Centralized for future library swapping.
- `src/main.tsx` — React entry point (`createRoot`).
- `index.html` — SPA shell.
- `vite.config.ts` — React plugin + dev proxy (`/api` → MCP server). Reads `PREVIEWER_PORT` env var, falls back to 6556.

## Development

```bash
PREVIEWER_PORT=6556 bun run dev    # Vite dev server on 5173, proxies /api to 6556
bun run build                      # Production build → dist/
```

## Styling

OpenUI component styles imported directly in App.tsx:
```
@openuidev/react-ui/components.css
@openuidev/react-ui/styles/index.css
```

## Behavior

- State resets on every spec change (no persistence)
- Empty spec → "Waiting for spec..." placeholder
- Render errors → ErrorBoundary catches, displays error + raw spec text
- No streaming — full spec re-render on each poll
- In production: embedded in compiled binary via `scripts/embed-assets.ts`
- In development: Vite dev server with HMR, proxies API to MCP server
