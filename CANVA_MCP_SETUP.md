# Canva MCP setup for Atelier Vow

The updated server uses this production flow:

1. GPT Image creates the wedding invitation PNG.
2. The customer approves the PNG.
3. The server uploads that approved PNG to Canva through `upload-asset-from-url`.
4. The server calls `generate-design`, passing the uploaded asset ID and the exact-recreation prompt.
5. The server selects the first returned candidate and calls `create-design-from-candidate`.
6. The resulting design is created in the connected operator Canva account.
7. When `CANVA_MCP_PUBLISH_TEMPLATE=1`, the existing Canva Connect API flow publishes that design as a Brand Template and returns its template/create link.

## 1. Public HTTPS URL

Canva must be able to download the approved PNG, so `PUBLIC_BASE_URL` must be a public HTTPS URL, such as your Cloudflare Tunnel URL.

```powershell
$env:PUBLIC_BASE_URL="https://YOUR-TUNNEL.trycloudflare.com"
```

## 2. Register an OAuth client for Canva MCP

Use the same public callback URL that the server will use:

```powershell
$body = @{
    client_name   = "Atelier Vow"
    redirect_uris = @(
        "https://mumbai-diagram-framed-incident.trycloudflare.com/api/canva/mcp/auth/callback"
    )
    grant_types = @(
        "authorization_code"
    )
} | ConvertTo-Json -Compress

$response = Invoke-RestMethod `
    -Method Post `
    -Uri "https://mcp.canva.com/register" `
    -ContentType "application/json" `
    -Body $body

$response | ConvertTo-Json -Depth 10
```

Save the returned client ID and client secret.

## 3. Environment variables

```powershell
$env:CANVA_MCP_ENABLED="1"
$env:CANVA_MCP_CLIENT_ID="YOUR_MCP_CLIENT_ID"
$env:CANVA_MCP_CLIENT_SECRET="YOUR_MCP_CLIENT_SECRET"
$env:CANVA_MCP_REDIRECT_URI="https://YOUR-TUNNEL.trycloudflare.com/api/canva/mcp/auth/callback"
$env:CANVA_MCP_SERVER_URL="https://mcp.canva.com/mcp"
$env:CANVA_MCP_PROTOCOL_VERSION="2025-11-25"
$env:CANVA_MCP_DESIGN_TYPE="card"
$env:CANVA_MCP_TIMEOUT_MS="120000"
$env:CANVA_MCP_PUBLISH_TEMPLATE="1"
```

A temporary access token can also be supplied with `CANVA_MCP_ACCESS_TOKEN`, but OAuth with refresh tokens is the intended persistent setup.

The existing Canva Connect API variables are still required only for the final Brand Template publication:

```powershell
$env:CANVA_IMPORT_ENABLED="1"
$env:CANVA_CLIENT_ID="YOUR_CONNECT_CLIENT_ID"
$env:CANVA_CLIENT_SECRET="YOUR_CONNECT_CLIENT_SECRET"
$env:CANVA_REDIRECT_URI="https://YOUR-TUNNEL.trycloudflare.com/api/canva/auth/callback"
```

## 4. Authorize both Canva connections

After starting the server, open these URLs in the browser:

```text
https://YOUR-TUNNEL.trycloudflare.com/api/canva/mcp/auth/start
https://YOUR-TUNNEL.trycloudflare.com/api/canva/auth/start
```

The first authorizes Canva MCP design generation. The second authorizes the existing Connect API Brand Template publisher.

Check both states here:

```text
https://YOUR-TUNNEL.trycloudflare.com/api/canva/status
```

## 5. MCP Inspector

`http://localhost:6274/#tools` is the MCP Inspector interface for testing tool calls. The application server does not call port 6274. It calls Canva's remote MCP endpoint directly at `https://mcp.canva.com/mcp` using its own OAuth token.
