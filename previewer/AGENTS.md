# Previewer

Vite + React SPA. Polls the MCP server's `/api/spec` endpoint and renders OpenUI components.

## Data Flow

```
MCP server writes .openui/spec.oui → Bun.serve() serves /api/spec → App.tsx polls (500ms) → <Renderer> re-renders
App.tsx also fetches /api/library-info on mount → dynamically loads library renderer + CSS
```

## Dynamic Library Loading

`App.tsx` calls `/api/library-info` on mount. Response determines library:
- `id === "openui-default"` → uses bundled `openuiLibrary`
- Other ID → loads `<link rel="stylesheet">` for `styles.css`, then dynamic `import()` of `renderer.mjs`
- Renderer.mjs uses `window.__OPENUI_REACT` (exposed from `main.tsx`) via Bun's React global plugin

Library ID displayed in "Waiting for spec..." placeholder.

## Key Files

- `src/App.tsx` — Polls `/api/spec`, fetches `/api/library-info`, renders `<Renderer>` inside `<ErrorBoundary>`. Layout: `max-width: 1200px` centered with `#f9fafb` background and `2rem` padding.
- `src/ErrorBoundary.tsx` — React error boundary. On render failure, shows error message + stack trace + raw spec text. Auto-resets when spec changes.
- `src/libraries/openui-default.ts` — Re-exports `openuiLibrary` + CSS imports. Centralized for future library swapping.
- `src/main.tsx` — React entry point (`createRoot`). Exposes `window.__OPENUI_REACT` and `window.__OPENUI_JSX_RUNTIME` for externalized React in dynamic library bundles.
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
