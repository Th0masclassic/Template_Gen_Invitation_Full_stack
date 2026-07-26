$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot
$authDir = Join-Path $projectRoot "generated\canva\mcp-remote-auth"
New-Item -ItemType Directory -Force -Path $authDir | Out-Null
$env:MCP_REMOTE_CONFIG_DIR = $authDir

Write-Host "Opening the standalone mcp-remote Canva authentication test..." -ForegroundColor Cyan
& npx.cmd -y -p mcp-remote@latest mcp-remote-client "https://mcp.canva.com/mcp" --debug
if ($LASTEXITCODE -ne 0) {
    throw "Canva MCP authentication failed with exit code $LASTEXITCODE."
}

Write-Host "Authentication succeeded and Canva tools were listed." -ForegroundColor Green
