# ============================================================
# MIDORI - Run Backend Locally
# ============================================================
# Usage: .\scripts\run-backend-local.ps1
# This script loads environment variables from midori-be/.env
# before running the backend.
# NOTE: application-local.yml is NOT required. All configuration
# comes from environment variables via application.yml.
# ============================================================

$ErrorActionPreference = "Stop"
$BackendDir = Split-Path -Parent $PSScriptRoot

Write-Host "Starting MIDORI Backend..." -ForegroundColor Green
Write-Host ""

if (-not (Test-Path $BackendDir)) {
    Write-Host "ERROR: midori-be directory not found at $BackendDir" -ForegroundColor Red
    exit 1
}

# Load environment variables from .env file
$EnvFile = Join-Path $BackendDir ".env"
if (Test-Path $EnvFile) {
    Write-Host "Loading environment variables from: $EnvFile" -ForegroundColor Cyan
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "Environment variables loaded." -ForegroundColor Green
} else {
    Write-Host "WARNING: .env file not found at $EnvFile" -ForegroundColor Yellow
    Write-Host "Please copy .env.example to .env and fill in your secrets:" -ForegroundColor Yellow
    Write-Host "  copy-item '$BackendDir\.env.example' '$EnvFile'" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Running: mvn spring-boot:run" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Gray
Write-Host ""

Push-Location $BackendDir
try {
    mvn spring-boot:run
} finally {
    Pop-Location
}
