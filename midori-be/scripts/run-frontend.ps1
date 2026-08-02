# ============================================================
# MIDORI - Run Frontend Locally
# ============================================================
# Usage: .\scripts\run-frontend.ps1
# This script loads environment variables from midori-fe/.env.local
# before running the frontend dev server.
# ============================================================

$ErrorActionPreference = "Stop"
$BackendDir = Split-Path -Parent $PSScriptRoot
$ProjectRoot = Split-Path -Parent $BackendDir

Write-Host "Starting MIDORI Frontend..." -ForegroundColor Green
Write-Host ""

$FrontendDir = Join-Path $ProjectRoot "midori-fe"
if (-not (Test-Path $FrontendDir)) {
    Write-Host "ERROR: midori-fe directory not found at $FrontendDir" -ForegroundColor Red
    exit 1
}

# Check if .env.local exists
$EnvLocal = Join-Path $FrontendDir ".env.local"
if (Test-Path $EnvLocal) {
    Write-Host "Loading environment variables from: $EnvLocal" -ForegroundColor Cyan
    Get-Content $EnvLocal | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "Environment variables loaded." -ForegroundColor Green
} else {
    Write-Host "WARNING: .env.local not found at $EnvLocal" -ForegroundColor Yellow
    Write-Host "Please copy .env.example to .env.local and fill in your secrets:" -ForegroundColor Yellow
    Write-Host "  copy-item '$FrontendDir\.env.example' '$EnvLocal'" -ForegroundColor Yellow
    Write-Host ""
}

Push-Location $FrontendDir

try {
    Write-Host "Installing dependencies (if needed)..." -ForegroundColor Cyan
    npm install --silent

    Write-Host ""
    Write-Host "Starting dev server..." -ForegroundColor Cyan
    Write-Host "Config:  .env.local" -ForegroundColor Cyan
    Write-Host "URL:     http://localhost:8081" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Gray
    Write-Host ""

    npm run dev
} finally {
    Pop-Location
}
