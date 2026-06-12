# Previewer

Vite + React SPA. Polls the MCP server's `/api/spec` endpoint and renders OpenUI components.

## Data Flow

```
MCP server writes .openui/spec.oui → Bun.serve() serves /api/spec → App.tsx polls (500ms) → <Renderer> re-renders
```

## Key Files

- `src/App.tsx` — Polls `/api/spec`, renders `<Renderer response={spec} library={openuiLibrary} />`. Shows placeholder when empty.
- `src/main.tsx` — React entry point (`createRoot`).
- `index.html` — SPA shell.
- `vite.config.ts` — React plugin + dev proxy (`/api` → MCP server on port 3000).

## Development

```bash
bun run dev    # Vite dev server on 5173, proxies /api to port 3000
bun run build  # Production build → dist/
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
- No streaming — full spec re-render on each poll
- In production: served as static files by MCP server's Bun.serve()
- In development: Vite dev server with HMR, proxies API to MCP server
