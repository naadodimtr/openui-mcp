# Kumo Adapter

Cloudflare Kumo component library adapter. Maps 41 Kumo components to OpenUI's declarative spec language.

## Files

| File | Purpose |
|------|---------|
| `src/renderer.tsx` | Component wrappers (368 lines) — imports Kumo, defines wrapper functions, registers via `createLibrary()` |
| `openui-mcp-adapter.yaml` | Declarative spec for codegen |
| `build.ts` | Bun build entry — compiles renderer + library bundles |
| `codegen.ts` | Generates renderer code from Kumo registry metadata |
| `theme.css` | Kumo theme tokens |
| `styles.css` | Compiled Tailwind CSS (116KB) — all utility classes available |
| `tests/renderer.test.ts` | 112 unit tests |

## Components (41 total)

### Layout (9)
Stack, Card, LayerCard, Grid, Tabs, TabItem, Separator, Collapsible, Dialog

### Content (13)
Text, Badge, Callout, Code, ClipboardText, Empty, Label, Link, Loader, Breadcrumbs, BreadcrumbItem, Tooltip, Skeleton

### Data (4)
Table, TableColumn, Meter, Pagination

### Forms (15)
Button, LinkButton, Input, Textarea, SensitiveInput, Select, SelectItem, RadioGroup, RadioItem, Switch, Checkbox, Field, DropdownMenu, MenuItem, DatePicker

## Component Design

### Simple Components (direct Kumo pass-through)
Text, Button, Badge, Input, Switch, Checkbox, Code, ClipboardText, Empty, Loader, Meter, SensitiveInput, Textarea, Pagination, LinkButton, DatePicker

Wrappers pass props directly to the Kumo component. Minimal mapping needed.

### Custom HTML Components
Stack, Card, Table, TableColumn, Select, SelectItem, Tabs, TabItem, Separator, Callout, Skeleton

Built with custom HTML + inline styles. These handle spec-language patterns (children arrays, data columns) that don't map 1:1 with Kumo primitives.

### Compound Components (Kumo sub-properties)
RadioGroup (Radio.Item), Collapsible (Collapsible.Root/.DefaultTrigger/.DefaultPanel), Breadcrumbs (Breadcrumbs.Link/.Separator/.Current), DropdownMenu (DropdownMenu.Trigger/.Content/.Item/.Separator), Dialog (Dialog.Root/.Title/.Description)

Wrappers create React elements using Kumo's compound sub-properties. Children from spec props are mapped to the appropriate sub-component.

## Variant Coverage

### Text
| Prop | Values |
|------|--------|
| size | xs, sm, base, lg |
| weight | normal, medium, semibold, bold (applied via inline font-weight) |
| color | default, subtle, muted, accent, success, warning, danger (applied via inline color) |

### Badge
| Prop | Values |
|------|--------|
| variant | neutral, info, success, warning, danger (maps to error), error, primary, secondary |
| size | xs, sm, base, lg |

### Button / LinkButton
| Prop | Values |
|------|--------|
| variant | primary, secondary, ghost, destructive, outline |
| size | xs, sm, base, lg |

### Card
| Prop | Values |
|------|--------|
| variant | elevated (p-6 rounded-xl), outlined (p-5 rounded-lg), ghost (p-4 rounded-lg) |

### Link
variant: inline, current, plain

### Code
lang: ts, tsx, bash, css, jsonc (maps javascript→ts, json→jsonc, sh→bash)

### Callout
variant: info, success, warning, danger

### Separator
orientation: horizontal, vertical

### Loader / ClipboardText / Empty
size: sm, base, lg

### Input
type: text, email, password, number, url

## Build

```bash
bun build.ts   # Outputs dist/manifest.json, library.mjs, renderer.mjs, styles.css
```

Build uses the React global plugin to replace `import React from "react"` with `window.__OPENUI_REACT`. All Kumo imports are bundled inline. Tailwind CSS is already compiled in `styles.css`.

## Testing

```
bun test ./adapters/kumo/tests/renderer.test.ts   # 112 unit tests
```

Tests verify:
- All 41 components defined in library metadata
- All compound sub-properties exist (Radio.Item, Breadcrumbs.Link, etc.)
- Each component renders with every valid enum value
- Variant maps produce correct output (danger→error, javascript→ts)
- Compound components render children
- Zero Kumo console warnings for valid inputs
