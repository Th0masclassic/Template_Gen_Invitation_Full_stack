$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$authDir = Join-Path $projectRoot "generated\canva\mcp-remote-auth"

Get-Process node -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -and $_.Path -match "node"
} | Out-Null

if (Test-Path $authDir) {
    Remove-Item -Recurse -Force $authDir
}
New-Item -ItemType Directory -Force -Path $authDir | Out-Null

Write-Host "Local Canva MCP OAuth state cleared:" -ForegroundColor Yellow
Write-Host $authDir
Write-Host "Now run .\connect-canva-mcp.ps1 or .\start-canva-mcp-local.ps1." -ForegroundColor Cyan
