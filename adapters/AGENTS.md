# Adapters

Library adapters map component design systems (Kumo, Shadcn, etc.) to OpenUI's declarative spec language.

## Structure

```
adapters/
  ADAPTER_GUIDE.md          — Authoring guide (for building new adapters)
  adapter-schema.json        — JSON Schema for openui-mcp-adapter.yaml
  kumo/                      — Reference adapter: Cloudflare Kumo (41 components)
    src/renderer.tsx          — Component wrappers using Kumo primitives
    openui-mcp-adapter.yaml   — Declarative component mapping spec
    build.ts                  — Bun build with React global plugin
    codegen.ts                — Codegen from Kumo registry metadata
    tests/renderer.test.ts    — 112 unit tests
    styles.css                — Compiled Tailwind CSS (116KB)
```

## Build Pipeline

```bash
bun adapters/kumo/build.ts            # Build adapter from source
bun src/server.ts install-library ./adapters/kumo/dist/  # Install plugin
```

Build output (`dist/`):
```
manifest.json    — Metadata + SHA-256 checksums
library.mjs      — Server-side: Zod schemas, prompt, validation
renderer.mjs     — Client-side: React components (React externalized)
styles.css       — Compiled CSS
```

## Key Patterns

### React Global Plugin
Builder replaces `import React from "react"` with `window.__OPENUI_REACT` to avoid dual React bundles. Required because the previewer SPA hosts React and dynamic libraries must share the same instance.

### Compound Components
Kumo uses React compound components (e.g., `Radio.Item`, `Breadcrumbs.Link`). Bun bundler preserves static properties on function components. Wrappers read children from spec props and render them with the parent's sub-properties.

### Variant Mapping
Some Kumo enums differ from OpenUI's expected values. Maps:
- Badge: `"danger"` → `"error"`
- Code: `"javascript"` → `"ts"`, `"json"` → `"jsonc"`, `"sh"` → `"bash"`
- Text color/weight: applied via inline styles (Kumo Text only supports `size` + `variant`)

### Padding
Cards use Tailwind classes from Kumo's CSS bundle: `p-6 rounded-xl` (elevated), `p-5 rounded-lg` (outlined), `p-4 rounded-lg` (ghost). LayerCard uses `p-4`.

## Testing

```
bun test ./adapters/kumo/tests/renderer.test.ts   # 112 tests — all components + variants
bunx playwright test tests/e2e/kumo-components.pw.ts  # 12 tests — browser rendering + console checks
```
