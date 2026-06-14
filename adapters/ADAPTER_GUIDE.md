# OpenUI MCP Adapter Guide

Create library adapters to use any React component library with OpenUI MCP.

## What is an adapter?

An adapter bundles a component library into a format OpenUI MCP can use at runtime. It produces:

```
manifest.json    — metadata + integrity checksums
library.mjs      — server-side: Zod schemas, prompt generation, validation
renderer.mjs     — client-side: React components for the previewer
styles.css       — compiled CSS for the library
```

## The Spec File: `openui-mcp-adapter.yaml`

This is the standard declarative format describing your library's components and their mapping to OpenUI Lang's positional argument system.

### Minimal Example

```yaml
id: my-library
name: My Design System
version: 1.0.0
upstream: "@my-org/components@^2.0.0"

styles:
  entry: "@my-org/components/dist/styles.css"

components:
  - name: Button
    import: "{ Button } from @my-org/components"
    description: "Interactive button element"
    props:
      - name: children
        type: any
        required: true
        position: 0
      - name: variant
        type: enum [primary, secondary, ghost]
        position: 1
      - name: size
        type: enum [sm, md, lg]
        position: 2
```

### Full Spec Reference

```yaml
# Required metadata
id: string                    # Unique ID (used in config.json and CLI)
name: string                  # Human-readable name
version: string               # Adapter version (semver)

# Optional metadata
upstream: string              # npm package + version (e.g. "@cloudflare/kumo@^2.0.0")
description: string           # One-line description

# Styles
styles:
  entry: string               # CSS entry point (npm path or relative file)
  framework: string           # Optional: "tailwind-v4", "css-modules", "plain-css"

# Component groups (for prompt organization)
componentGroups:
  - name: Layout
    components: [Stack, Card, Tabs]
    notes:
      - "Use Stack for flex layouts"
  - name: Content
    components: [Text, Badge, CodeBlock]

# Root component (the outermost wrapper)
root: Stack                   # Component name used as root = {Root}([...])

# Components
components:
  - name: string              # PascalCase component name
    import: string            # Import statement for the React component
    description: string       # One-line description (used in LLM prompt)
    props:
      - name: string          # Prop name as it appears in React
        type: string          # Type (see Type Reference below)
        required: boolean     # Whether the prop is required
        position: number      # Positional arg index (0-based)
        default: any          # Optional default value
        description: string   # Optional prop description for the prompt
```

### Type Reference

| YAML Type | Zod Output | OpenUI Lang |
|-----------|-----------|-------------|
| `any` | `z.any()` | Any value |
| `string` | `z.string()` | `"text"` |
| `number` | `z.number()` | `42` |
| `boolean` | `z.boolean()` | `true` / `false` |
| `any[]` | `z.array(z.any())` | `[a, b, c]` |
| `string[]` | `z.array(z.string())` | `["a", "b"]` |
| `enum [a, b, c]` | `z.enum(["a", "b", "c"])` | `"a"` or `"b"` or `"c"` |
| `component` | Component ref schema | Inline or reference |
| `component[]` | Array of component refs | `[child1, child2]` |

## How Positional Args Work

OpenUI Lang uses positional arguments, not named props:

```
Button("Click me", "primary", "lg")
```

Maps to:

```tsx
<Button children="Click me" variant="primary" size="lg" />
```

The `position` field in the YAML determines the mapping order. Props without a position are keyword-only (not exposed as positional args).

Rules:
- Position 0 is the first argument
- Required props should come first
- Optional props should come last (can be omitted from the end)
- Props with `type: component[]` are typically position 0 (children)

## Workflow: Creating an Adapter

### Path A: From YAML (recommended)

1. Write `openui-mcp-adapter.yaml` describing your components
2. Run `openui-mcp build-adapter ./openui-mcp-adapter.yaml --output ./dist/`
3. Test locally: `openui-mcp install-library ./dist/`
4. Publish: release as GitHub Release or npm package

### Path B: AI-assisted

1. Give your AI agent this guide + your library's documentation/types
2. Agent generates `openui-mcp-adapter.yaml`
3. Run build + install as above

### Path C: From an existing registry

If your library has a component registry (like Kumo's `component-registry.json`):

1. Write a codegen script that reads your registry → outputs `openui-mcp-adapter.yaml`
2. Run `openui-mcp build-adapter` on the generated YAML
3. Automate with CI: upstream update → regenerate → publish

## Building the Bundle

```bash
openui-mcp build-adapter ./openui-mcp-adapter.yaml --output ./dist/
```

This produces:
- `dist/manifest.json` — with SHA-256 checksums
- `dist/library.mjs` — Zod schemas + `createLibrary()` result
- `dist/renderer.mjs` — React components (React externalized to host)
- `dist/styles.css` — compiled CSS

### React Externalization

Plugin renderer.mjs must NOT bundle React. The host previewer exposes React on `window.__OPENUI_REACT`. The build process handles this automatically.

## Installing & Testing

```bash
# Install from local build
openui-mcp install-library ./dist/

# Set project library
openui-mcp init --library=my-library

# Start server (will use your library)
openui-mcp
```

## Publishing

### GitHub Releases (recommended)

1. Create a GitHub repo for your adapter
2. Build the bundle in CI
3. Publish the `dist/` contents as a `.tar.gz` release artifact
4. Users install with: `openui-mcp install-library github:your-org/openui-my-library`

### npm

1. Publish the built bundle as an npm package
2. Users install with: `openui-mcp install-library npm:@your-org/openui-my-library`

## Security Contract

Adapter bundles MUST:
- Be pure (no side effects beyond registering components)
- Not access filesystem, network, or environment variables
- Not execute shell commands
- Export only: library object + React components + CSS

Adapter bundles MUST NOT:
- Import `node:fs`, `node:child_process`, `node:net`
- Call `fetch()` or make network requests
- Access `process.env`
- Modify global state beyond component registration

## Example: Kumo Adapter

See `adapters/kumo/` in this repo for a complete reference implementation:
- `codegen.ts` — reads Kumo's `component-registry.json` → generates YAML
- `openui-mcp-adapter.yaml` — the generated spec
- `build.ts` — produces the final bundle

## Tips for AI Agents

When generating an `openui-mcp-adapter.yaml`:

1. Start with the most common components (5-10) before adding everything
2. Put `children` as position 0 for container components
3. Use `enum` types for variant/size/color props
4. Required props first, optional props last in position order
5. Write clear descriptions — they become the LLM's prompt for using the component
6. Group components logically (Layout, Content, Data, Forms)
7. Match the library's actual prop names exactly (the renderer passes them through)
