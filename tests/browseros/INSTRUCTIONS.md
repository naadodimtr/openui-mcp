# OpenUI MCP E2E Tests (BrowserOS)

Run these tests locally via opencode using BrowserOS tools.

## Prerequisites

- MCP server running (started automatically by opencode via config)
- Previewer accessible at http://localhost:6556

## How to Run

Say: **"run the openui-mcp browseros E2E tests"**

## Test Procedure

For each test case in `test-cases.ts`:

1. Call `openui_update_spec` with the test's `spec` value
2. Wait 1 second (allow browser poll to pick up the change)
3. Navigate BrowserOS to `http://localhost:6556` (if not already there)
4. Take a snapshot with `browseros_take_snapshot`
5. For each assertion:
   - `text-visible`: verify the text appears in the snapshot
   - `text-not-visible`: verify the text does NOT appear
   - `api-response`: fetch the endpoint and check the JSON field value
6. Report PASS or FAIL with the test name

## Expected Results

All 14 tests should pass. The error boundary test (case 9) intentionally writes an invalid spec — the previewer should show an error state, then recover on the next valid spec (case 10).

## API Endpoint Tests

For assertions with `type: "api-response"`:
- Use `webfetch` or `browseros_evaluate_script` to fetch the endpoint
- Parse JSON response and check the specified field

## After Running

Report a summary:
```
✓ 14/14 tests passed
```

Or list failures:
```
✓ 12/14 tests passed
✗ error boundary on invalid component — "Render Error" not visible
✗ recovery from error — "Render Error" still visible
```
