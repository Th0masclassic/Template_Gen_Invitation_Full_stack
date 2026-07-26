# Canva MCP local bridge — corrected setup

This version uses `mcp-remote` through stdio and performs a standalone authentication preflight before the Atelier Vow server starts.

## Why the previous build could show `INTERNAL_ERROR`

The previous bridge tried several MCP protocol versions by sending multiple `initialize` calls through the same `mcp-remote` process. After one rejected initialization, the same remote session could no longer be safely reused. It also forced the `http-only` transport and hid the provider error.

This build:

- Uses MCP protocol `2025-06-18` for the whole session.
- Uses `http-first`, which is the `mcp-remote` default strategy.
- Runs `mcp-remote-client` first to complete OAuth and verify `tools/list`.
- Reuses the same local OAuth directory when the Node server launches `mcp-remote`.
- Prints the real MCP message and recent bridge stderr when connection fails.

## First run

Stop the existing Node server. In the project folder run:

```powershell
.\reset-canva-mcp.ps1
.\connect-canva-mcp.ps1
```

A browser should open. Sign in to the Canva atelier account and approve access. The terminal must finish by listing or confirming the available Canva tools.

Then start the application:

```powershell
.\start-canva-mcp-local.ps1
```

The start script also performs the same preflight. With a valid saved token it should finish quickly without asking you to log in again.

## Initialize the server bridge

After the application starts, open:

```text
http://127.0.0.1:3000/api/canva/mcp/auth/start
```

Then inspect:

```text
http://127.0.0.1:3000/api/canva/status
```

Expected MCP fields:

```json
{
  "transport": "stdio_mcp_remote",
  "authorized": true,
  "connected": true,
  "processRunning": true,
  "protocolVersion": "2025-06-18",
  "availableToolCount": 1,
  "lastError": null
}
```

`availableToolCount` will normally be greater than one.

## If authentication still fails

Confirm Node is current:

```powershell
node -v
npx -v
```

Then clear the local state and retry:

```powershell
.\reset-canva-mcp.ps1
.\connect-canva-mcp.ps1
```

The OAuth files are stored only in:

```text
generated\canva\mcp-remote-auth
```

Do not delete the separate Canva Connect token if Connect API authorization already works.
