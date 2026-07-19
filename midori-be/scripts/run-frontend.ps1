# ============================================================
# MIDORI - Run Frontend Locally
# ============================================================
# Usage: .\scripts\run-frontend.ps1
# Requires: midori-fe/.env.local with real values configured
# ============================================================

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "Starting MIDORI Frontend..." -ForegroundColor Green
Write-Host ""

$FrontendDir = Join-Path $ProjectRoot "midori-fe"
if (-not (Test-Path $FrontendDir)) {
    Write-Host "ERROR: midori-fe directory not found at $FrontendDir" -ForegroundColor Red
    exit 1
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

    npm run dev
} finally {
    Pop-Location
}
