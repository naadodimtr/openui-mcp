# Previewer

Next.js 16 App Router application. Polls a spec file and renders OpenUI components in the browser.

## Data Flow

```
MCP server writes .openui/spec.oui → API route reads file → page.tsx polls /api/spec (500ms) → <Renderer> re-renders
```

## Key Files

- `src/app/page.tsx` — Client component. Polls `/api/spec`, renders `<Renderer response={spec} library={openuiLibrary} />`. Shows placeholder when empty.
- `src/app/api/spec/route.ts` — GET endpoint. Reads `OPENUI_SPEC_FILE` env var path, returns `{ spec, lastModified }`. Force-dynamic (no caching).
- `src/library.ts` — Re-exports `openuiLibrary` and `openuiPromptOptions` from `@openuidev/react-ui/genui-lib`.
- `src/app/layout.tsx` — Minimal HTML shell.

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `OPENUI_SPEC_FILE` | `.openui/spec.oui` | Absolute path to spec file (set by MCP server when spawning) |

## Styling

Tailwind CSS v4 via `@tailwindcss/postcss`. OpenUI component styles imported via:
```
@openuidev/react-ui/components.css
@openuidev/react-ui/styles/index.css
```

## Behavior

- State resets on every spec change (no persistence)
- Empty spec → "Waiting for spec..." placeholder
- No streaming support — full spec re-render on each poll
- `dynamic = "force-dynamic"` on API route prevents Next.js caching
