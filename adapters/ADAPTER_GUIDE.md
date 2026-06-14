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

## Critical: zod/v4 Requirement

All adapter code MUST use `import { z } from "zod/v4"` — NOT `"zod"`.

`@openuidev/lang-core` rejects Zod v3 schemas at runtime with:
```
[OpenUI] Component "X" was defined with a Zod 3 schema. OpenUI requires Zod 4 schemas.
```

- The `build-adapter` command handles this automatically for YAML-generated code
- Custom renderer files (`.tsx`) must import from `"zod/v4"` manually
- If on zod@3.25+, the `zod/v4` sub-path is available without installing zod v4 separately

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
  entry: string               # CSS file path (relative to YAML or npm path)
  framework: string           # Optional: "tailwind-v4", "css-modules", "plain-css"

# Custom renderer (for compound components — see section below)
renderer: string              # Optional: path to custom renderer.tsx (relative to YAML)

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

## Discovering Component APIs

When creating an adapter for a library, check these sources (in order of reliability):

1. **`ai/component-registry.json`** — structured component data (Kumo has this)
2. **`package.json` exports field** — shows available import paths
3. **`dist/*.d.ts` type definitions** — TypeScript prop interfaces
4. **Storybook argTypes** — prop names, types, defaults, descriptions
5. **README / documentation site** — descriptions, usage examples
6. **Source code** (`src/components/*/`) — ground truth

### Example: Reading Kumo's registry

```bash
# Check what the package exports
cat node_modules/@cloudflare/kumo/package.json | jq '.exports | keys'

# Read the component registry
cat node_modules/@cloudflare/kumo/ai/component-registry.json | jq '.components | keys'

# Get a specific component's props
cat node_modules/@cloudflare/kumo/ai/component-registry.json | jq '.components.Button.props'
```

Map each prop to the YAML format:
- `"type": "enum", "values": ["primary", "secondary"]` → `type: enum [primary, secondary]`
- `"type": "string", "required": true` → `type: string` + `required: true`
- `"type": "ReactNode"` → `type: any` (for children)

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

## Custom Renderer (`renderer` field)

For libraries with compound components or complex rendering needs, use a custom renderer file instead of auto-generated imports.

### When to use

- Library uses compound component patterns (e.g., `Table.Row`, `Tabs.Trigger`)
- Components need wrapper logic to bridge flat OpenUI props → compound React tree
- Library requires context providers or special setup
- Auto-generated imports don't produce correct output

### How to use

Add to your YAML:
```yaml
renderer: ./src/renderer.tsx
```

The file must:
- Import from `"zod/v4"` (NOT `"zod"`)
- Import from `"@openuidev/lang-core"` (`createLibrary`, `defineComponent`)
- Import actual React components from the upstream library
- Export the library as the default export: `export default library`

### Structure

```tsx
import { createLibrary, defineComponent } from "@openuidev/lang-core";
import { z } from "zod/v4";
import { Button, Table } from "@my-org/components";

// Direct components (no wrapper needed)
const ButtonDef = defineComponent({
  name: "Button",
  props: z.object({ children: z.string(), variant: z.enum(["primary", "secondary"]).optional() }),
  description: "Interactive button",
  component: Button,  // Direct pass-through
});

// Wrapped compound component
function MyTable({ columns }: any) { /* wrapper logic */ }
const TableDef = defineComponent({
  name: "Table",
  props: z.object({ columns: z.array(z.any()) }),
  description: "Data table",
  component: MyTable,  // Wrapper component
});

const library = createLibrary({ components: [ButtonDef, TableDef], root: "Stack" });
export default library;
```

## Compound Component Recipe

Most modern React libraries use compound component patterns:

```tsx
// How the library expects usage:
<Table>
  <Table.Header>
    <Table.Row>
      <Table.ColumnHeader>Name</Table.ColumnHeader>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    <Table.Row>
      <Table.Cell>Alice</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table>
```

OpenUI Lang uses flat, positional components:
```
Table([TableColumn("Name", ["Alice", "Bob"]), TableColumn("Score", [95, 87])])
```

### Pattern A: HTML Bridge (for full control)

When the library's compound structure is too nested for flat data, build custom HTML:

```tsx
function SimpleTable({ columns }: any) {
  const cols = columns.map((c: any) => c.props || c);
  const rowCount = cols[0]?.data?.length || 0;
  return (
    <table>
      <thead><tr>{cols.map((col, i) => <th key={i}>{col.label}</th>)}</tr></thead>
      <tbody>
        {Array.from({ length: rowCount }, (_, r) => (
          <tr key={r}>{cols.map((col, c) => <td key={c}>{col.data?.[r]}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}
```

Use this when the library's compound structure is too rigid for your flat data or when styling consistency matters more than using native components.

### Pattern B: Sub-Property Bridge (for light wrappers)

When the library's sub-properties survive bundling (most React compound components do), use them directly:

```tsx
// Import the parent compound component
import { Radio, Breadcrumbs, Collapsible, DropdownMenu, Dialog } from "@my-org/components";

function MyRadioGroup({ items, name, defaultValue }: any) {
  const options = items.map((item: any) => item.props || item);
  return (
    <Radio name={name} defaultValue={defaultValue || options[0]?.value}>
      {options.map((opt) => <Radio.Item key={opt.value} value={opt.value} label={opt.label} />)}
    </Radio>
  );
}

function MyBreadcrumbs({ items }: any) {
  const crumbs = items.map((item: any) => item.props || item);
  return (
    <Breadcrumbs>
      {crumbs.map((crumb, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Breadcrumbs.Separator />}
          {crumb.href ? <Breadcrumbs.Link href={crumb.href}>{crumb.label}</Breadcrumbs.Link> : <Breadcrumbs.Current>{crumb.label}</Breadcrumbs.Current>}
        </React.Fragment>
      ))}
    </Breadcrumbs>
  );
}
```

**Important**: Bun bundler preserves static properties on function components. `Radio.Item`, `Breadcrumbs.Link`, `Collapsible.Root`, `DropdownMenu.Trigger`, `Dialog.Root` all survive the build. If a sub-property is `undefined` after build, it means the library uses a different export pattern (e.g., barrel exports that tree-shake).

### Pattern C: RenderNode Recursion (for nesting other spec components)

When a component wraps child spec components, use the `renderNode` callback:

```tsx
import { type ComponentRenderProps } from "@openuidev/lang-core";

function MyCard({ props, renderNode }: ComponentRenderProps) {
  const { children, variant } = props as any;
  const rendered = Array.isArray(children)
    ? children.map((c: any, i: number) => <React.Fragment key={i}>{renderNode(c)}</React.Fragment>)
    : null;
  return <Surface className={variant === "elevated" ? "p-6 rounded-xl" : "p-4"}>{rendered}</Surface>;
}
```

`renderNode` recursively walks the OpenUI component tree. Use it whenever a component accepts `children: z.array(z.any())`.

### Common Compound Patterns

| Pattern | Flat OpenUI Spec | Wrapper receives |
|---------|-----------------|-----------------|
| **Table** | `Table([TableColumn("Name", data)])` | `{ columns: [{ props: { label, data } }] }` |
| **Tabs** | `Tabs([TabItem("id", "Label", [content])])` | `{ items: [{ props: { value, label, content } }] }` |
| **Select** | `Select("name", [SelectItem("val", "Label")])` | `{ name, items: [{ props: { value, label } }] }` |
| **Radio** | `RadioGroup("name", [RadioItem("val", "Label")])` | `{ name, items: [{ props: { value, label } }], defaultValue }` |
| **Breadcrumbs** | `Breadcrumbs([BreadcrumbItem("Home", "/"), BreadcrumbItem("Page")])` | `{ items: [{ props: { label, href? } }] }` |
| **Collapsible** | `Collapsible("Title", [content])` | `{ title, children: [...] }` |
| **Dropdown** | `DropdownMenu("Button", [MenuItem("Edit"), MenuItem("Delete")])` | `{ trigger, items: [{ props: { label, separator? } }] }` |
| **Dialog** | `Dialog("Title", "Description", [buttons])` | `{ title, description, children: [...] }` |
| **Tooltip** | `Tooltip("Help text", [content])` | `{ content: string, children: [...] }` |
| **Field** | `Field("Label", "Hint", [input])` | `{ label, hint, children: [...] }` | |

### Sub-component pattern

Define sub-components as `component: null` renderers (they exist only for the schema/prompt):

```tsx
// TabItem doesn't render on its own — parent Tabs wrapper reads its props
const TabItemDef = defineComponent({
  name: "TabItem",
  props: z.object({ value: z.string(), label: z.string(), content: z.array(z.any()) }),
  description: "Tab panel within Tabs",
  component: () => null,  // Never rendered directly
});
```

The parent (Tabs wrapper) reads `item.props.value`, `item.props.label`, `item.props.content` from the passed children.

## Variant Mapping & Inline Styles

### When library enums differ from your desired API

Map values inside the wrapper function:

```tsx
function MyBadge({ label, variant = "neutral" }: any) {
  const variantMap: Record<string, string> = { danger: "error" };
  return <Badge variant={variantMap[variant] || variant}>{label}</Badge>;
}

function MyCode({ lang, code }: any) {
  const langMap: Record<string, string> = { javascript: "ts", js: "ts", json: "jsonc", sh: "bash" };
  return <Code lang={langMap[lang] || lang} code={code} />;
}
```

### When the library component lacks your prop (e.g., no `color` or `weight` prop)

Apply via inline styles:

```tsx
function MyText({ children, size = "base", weight, color }: any) {
  const weightMap: Record<string, string> = { normal: "400", medium: "500", semibold: "600", bold: "700" };
  const colorMap: Record<string, string> = { default: "inherit", subtle: "#6b7280", danger: "#dc2626" };
  const style: any = {};
  if (weight && weight !== "normal") style.fontWeight = weightMap[weight];
  if (color && color !== "default") style.color = colorMap[color];
  return <Text size={size} style={style}>{children}</Text>;
}
```

### When the library component needs `aria-label` (accessibility)

Some Kumo components warn if missing accessible labels. Always add:

```tsx
function MyInput({ name, placeholder, type = "text" }: any) {
  return <Input name={name} placeholder={placeholder} type={type} aria-label={name} />;
}
```

### Card padding via Tailwind classes

If the library's CSS bundle includes Tailwind utilities, use `className` for spacing:

```tsx
function MyCard({ children, variant = "elevated" }: any) {
  const classMap: Record<string, string> = {
    elevated: "p-6 rounded-xl",
    outlined: "p-5 rounded-lg",
    ghost: "p-4 rounded-lg",
  };
  return <Surface className={classMap[variant] || classMap.elevated}>{children}</Surface>;
}
```

Always test that the Tailwind utility classes exist in the library's bundled CSS before relying on them.

## Console Warning Detection

Kumo (and some other libraries) emit `console.warn` when receiving invalid enum values. Capture these in tests to validate your variant maps:

```tsx
// In tests:
const warnings: string[] = [];
const originalWarn = console.warn;
beforeEach(() => { warnings.length = 0; console.warn = (...a: any[]) => warnings.push(a.join(" ")); });
afterEach(() => { console.warn = originalWarn; });

// After renderToString:
expect(warnings).toHaveLength(0);  // Valid variants produce no warnings
```

Use this to find enum mismatches between your adapter and the upstream library.

## CSS & Styles

### Finding CSS for your library

| Library type | Where to find CSS | Example |
|-------------|-------------------|---------|
| **Pre-built CSS** | `dist/styles/` in package | `@cloudflare/kumo/dist/styles/kumo-standalone.css` |
| **Tailwind library** | Look for `*-standalone.css` or build with Tailwind CLI | Kumo ships `kumo-standalone.css` (113KB) |
| **CSS-in-JS** | May not need styles.css (runtime styling) | styled-components, Emotion |
| **Component CSS** | Import path in package.json exports | `@my-lib/styles.css` |

### Handling Tailwind libraries

If the library uses Tailwind but doesn't ship pre-built CSS:
1. Create a minimal `input.css`: `@import "@my-lib/styles";`
2. Build with Tailwind CLI: `npx tailwindcss -i input.css -o styles.css`
3. Reference the output in your YAML: `styles: { entry: styles.css }`

### Theme tokens

Some libraries (like Kumo) use semantic tokens that require a theme CSS file:
```bash
# Copy both the component CSS and theme
cp node_modules/@cloudflare/kumo/dist/styles/kumo-standalone.css ./styles.css
cat node_modules/@cloudflare/kumo/dist/styles/theme-kumo.css >> ./styles.css
```

## Building the Bundle

```bash
openui-mcp build-adapter ./openui-mcp-adapter.yaml --output ./dist/
```

This produces:
- `dist/manifest.json` — with SHA-256 checksums
- `dist/library.mjs` — Zod schemas + `createLibrary()` result (server-side)
- `dist/renderer.mjs` — React components (browser-side, React externalized)
- `dist/styles.css` — compiled CSS

### Build behavior

- **library.mjs**: Always generated from the YAML components (uses `component: null`)
- **renderer.mjs**: Auto-generated from YAML imports, OR uses custom `renderer` file if specified
- **styles.css**: Copied from `styles.entry` path, or empty if not specified
- If renderer build fails (missing deps), the build still produces library.mjs + styles.css with a warning

### React Externalization

Plugin renderer.mjs must NOT bundle React. The host previewer exposes React on `window.__OPENUI_REACT`. The build process handles this automatically by externalizing `react` and `react-dom`.

## Workflow: Creating an Adapter

### Path A: From YAML (simple libraries)

1. Write `openui-mcp-adapter.yaml` describing your components
2. Run `openui-mcp build-adapter ./openui-mcp-adapter.yaml --output ./dist/`
3. Test locally: `openui-mcp install-library ./dist/`
4. Publish: release as GitHub Release

### Path B: With custom renderer (compound components)

1. Write `openui-mcp-adapter.yaml` with `renderer: ./src/renderer.tsx`
2. Create `src/renderer.tsx` with wrapper components
3. Run `openui-mcp build-adapter ./openui-mcp-adapter.yaml --output ./dist/`
4. Test locally: `openui-mcp install-library ./dist/`
5. Publish

### Path C: AI-assisted

1. Give your AI agent this guide + your library's documentation/types
2. Agent generates `openui-mcp-adapter.yaml` (and optionally `src/renderer.tsx` for compound components)
3. Run build + install as above

### Path D: From an existing registry (codegen)

1. Write a codegen script that reads your library's registry → outputs `openui-mcp-adapter.yaml`
2. Run `openui-mcp build-adapter` on the generated YAML
3. Automate with CI: upstream update → regenerate → publish

## Testing Your Adapter

### Unit tests (renderer verification)

Write `bun:test` unit tests that import the renderer source directly and use `react-dom/server` renderToString:

```tsx
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import library from "../src/renderer";

// Capture console.warn to detect library warnings
const warnings: string[] = [];
beforeEach(() => { warnings.length = 0; console.warn = (...a: any[]) => warnings.push(a.join(" ")); });
afterEach(() => { console.warn = originalWarn; });

function renderComponent(name: string, props: any): string {
  const comp = (library.components as any)[name];
  if (!comp) throw new Error(`Component "${name}" not found`);
  return renderToString(React.createElement(comp.component, { props, renderNode }));
}

describe("Badge Component", () => {
  it.each(["neutral", "info", "success", "warning", "error"])(
    "renders variant=%s without warning", (variant) => {
      const html = renderComponent("Badge", { children: "X", variant });
      expect(html).toContain("X");
      expect(warnings).toHaveLength(0);
    }
  );

  it("danger maps to error", () => {
    renderComponent("Badge", { children: "X", variant: "danger" });
    expect(warnings).toHaveLength(0);  // no warning = mapping worked
  });
});
```

Test pattern coverage:
- Each enum value renders without console warnings
- Variant maps produce correct output
- Compound sub-properties exist on imports (e.g., `expect(Radio.Item).toBeDefined()`)
- Library metadata (component count, groups, root)

### E2E tests (browser rendering)

Playwright tests spawn the MCP server and verify components render in a real browser:

```typescript
test("full showcase renders with zero console warnings", async ({ page }) => {
  const consoleMessages: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "warning" || msg.type() === "error")
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  await writeSpec(specContent);
  await page.goto(`http://localhost:${PORT}`);
  await page.waitForTimeout(8000);

  const body = await page.textContent("body");
  expect(body).toContain("Expected text");
  expect(consoleMessages.filter(m => m.startsWith("[error]"))).toHaveLength(0);
});
```

### Step-by-step verification

```bash
# 1. Build the adapter
openui-mcp build-adapter ./openui-mcp-adapter.yaml --output ./dist/

# 2. Install locally
openui-mcp install-library ./dist/

# 3. Set as project default
openui-mcp init --library=my-lib

# 4. Run unit tests
bun test ./adapters/my-lib/tests/renderer.test.ts

# 5. Run E2E tests
bunx playwright test tests/e2e/my-lib-components.pw.ts

# 6. Manually verify in previewer
# Open http://localhost:6556 — check console for warnings
```

### Common errors and fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Zod 3 schema" | Using `import { z } from "zod"` | Change to `import { z } from "zod/v4"` |
| "renderer.mjs build failed" | Missing peer dependencies | Install library's peer deps: `bun add -d @peer/pkg` |
| "Could not resolve" in renderer | Wrong import path | Check package.json `exports` for correct paths |
| "Checksum verification failed" | Files modified after build | Rebuild and reinstall |
| Library loads but previewer blank | renderer.mjs missing or failed | Check build output for warnings |
| Components not in prompt | YAML component missing `description` | Add description to each component |

## Installing & Publishing

### Install from local build
```bash
openui-mcp install-library ./dist/
```

### Install from GitHub Release
```bash
openui-mcp install-library github:your-org/openui-my-library
```

### Publishing to GitHub Releases

1. Create a GitHub repo for your adapter
2. Build the bundle in CI
3. Package as `.tar.gz`: `tar -czf my-lib-adapter.tar.gz -C dist .`
4. Publish as a release artifact
5. Users install with: `openui-mcp install-library github:your-org/openui-my-library`

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

## Tips for AI Agents

When generating an `openui-mcp-adapter.yaml`:

1. Start with the most common components (5-10) before adding everything
2. Put `children` as position 0 for container components
3. Use `enum` types for variant/size/color props
4. Required props first, optional props last in position order
5. Write clear descriptions — they become the LLM's prompt for using the component
6. Group components logically (Layout, Content, Data, Forms)
7. Match the library's actual prop names exactly (the renderer passes them through)
8. Always import from `"zod/v4"` in custom renderer files
9. For compound components, create a custom `renderer.tsx` with wrapper functions
10. Check if the library has a pre-built CSS file before trying to build one

## Reference: Kumo Adapter

See `adapters/kumo/` for a complete, battle-tested working example:

| File | Purpose |
|------|---------|
| `openui-mcp-adapter.yaml` | Declarative spec for 41 components across 4 groups |
| `src/renderer.tsx` | Custom renderer (368 lines) — wrappers for all 41 components |
| `styles.css` | Kumo's pre-built Tailwind CSS (116KB) |
| `codegen.ts` | Reads Kumo's `ai/component-registry.json` → generates YAML/code |
| `build.ts` | Bun build with React global plugin, CSS inlining |
| `tests/renderer.test.ts` | 112 unit tests — every component × every variant |

### Component Architecture

| Category | Pattern | Examples |
|----------|---------|----------|
| **Direct pass-through** | Import → pass props directly | Button, Text, Badge, Input, Switch, Checkbox, Code, ClipboardText, Empty, Label, Link, Loader, Meter, SensitiveInput, Textarea, Pagination, LinkButton, DatePicker |
| **HTML bridge** | Custom HTML + inline styles | Stack, Table, TableColumn, Select, SelectItem, Tabs, TabItem, Separator, Callout, Skeleton, Card, Grid, LayerCard |
| **Compound bridge** | Sub-property React elements | RadioGroup (Radio.Item), Collapsible (Collapsible.Root), Breadcrumbs (Breadcrumbs.Link), DropdownMenu (DropdownMenu.Trigger), Dialog (Dialog.Root) |
| **Wrappers** | Wraps child with provider/context | Tooltip (TooltipProvider), Field (Field) |

### Variant Coverage Demonstrated

- **Text**: 4 sizes × 4 weights × 7 colors (inline styles for unsupported props)
- **Badge**: 8 variants with mapping (danger→error)
- **Button**: 5 variants × 4 sizes
- **Card**: 3 variants with Tailwind padding classes
- **Code**: 5 languages with mapping (javascript→ts, json→jsonc)
- **Callout**: 4 variants with custom HTML styling
- **Link**: 3 variants (inline, current, plain)
- **Separator**: horizontal + vertical
- **Input**: 5 types (text, email, password, number, url)

### Key Lessons

1. **Bun preserves compound sub-properties**: `Radio.Item`, `Breadcrumbs.Link` etc. survive bundling. Only specific barrel-export patterns cause issues.
2. **Surface is deprecated** in Kumo but still functional. `className` prop works for Tailwind utilities.
3. **Kumo Text** only supports `size` and `variant` — no `weight` or `color` prop. Use inline styles for these.
4. **Accessibility**: Kumo Input/SensitiveInput warn without `aria-label`. Always add it.
5. **Tailwind CSS is fully available**: The 116KB Kumo CSS bundle includes all standard utilities (p-4, p-6, rounded-xl, gap-4, etc.).
6. **Test console.warn**: Capture it during renderToString to detect API mismatches early.
7. **Sub-component stubs**: Define `TableColumn`, `TabItem`, `SelectItem`, `BreadcrumbItem`, `MenuItem`, `RadioItem` with `component: () => null` — they're never rendered directly, only read as props by their parent wrapper.
