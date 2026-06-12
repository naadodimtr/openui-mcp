# OpenUI MCP Previewer

Live preview web app for the OpenUI MCP server. Polls `.openui/spec.oui` and renders the UI using the OpenUI Renderer component.

Automatically started by the MCP server — no need to run manually.

## Manual Start (development)

```bash
OPENUI_SPEC_FILE=/path/to/.openui/spec.oui npm run dev -- -p 3000
```
