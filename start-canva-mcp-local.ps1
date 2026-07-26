$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

$authDir = Join-Path $projectRoot "generated\canva\mcp-remote-auth"
New-Item -ItemType Directory -Force -Path $authDir | Out-Null

$env:CANVA_MCP_ENABLED = "1"
$env:CANVA_MCP_TRANSPORT = "stdio"
$env:CANVA_MCP_SERVER_URL = "https://mcp.canva.com/mcp"
$env:CANVA_MCP_REMOTE_PACKAGE = "mcp-remote@latest"
$env:CANVA_MCP_REMOTE_CALLBACK_PORT = "3334"
$env:CANVA_MCP_REMOTE_AUTH_TIMEOUT_MS = "300000"
$env:CANVA_MCP_TIMEOUT_MS = "180000"
$env:CANVA_MCP_PROTOCOL_VERSION = "2025-06-18"
$env:CANVA_MCP_DESIGN_TYPE = "card"
$env:CANVA_MCP_PUBLISH_TEMPLATE = "1"
$env:CANVA_MCP_REMOTE_DEBUG = "1"
$env:MCP_REMOTE_CONFIG_DIR = $authDir

Remove-Item Env:CANVA_MCP_CLIENT_ID -ErrorAction SilentlyContinue
Remove-Item Env:CANVA_MCP_CLIENT_SECRET -ErrorAction SilentlyContinue
Remove-Item Env:CANVA_MCP_REDIRECT_URI -ErrorAction SilentlyContinue
Remove-Item Env:CANVA_MCP_ACCESS_TOKEN -ErrorAction SilentlyContinue

Write-Host "Checking Canva MCP authentication before starting the server..." -ForegroundColor Cyan
Write-Host "A Canva login window may open. Finish the login and return to this terminal." -ForegroundColor Yellow

& npx.cmd -y -p mcp-remote@latest mcp-remote-client "https://mcp.canva.com/mcp" --debug
if ($LASTEXITCODE -ne 0) {
    throw "Canva MCP preflight failed with exit code $LASTEXITCODE. Run .\reset-canva-mcp.ps1 and try again."
}

Write-Host "Canva MCP preflight succeeded." -ForegroundColor Green
Write-Host "Starting Atelier Vow server..." -ForegroundColor Cyan
npm start
