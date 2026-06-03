# ============================================================
# MIDORI - Run Backend Locally
# ============================================================
# Usage: .\scripts\run-backend-local.ps1
# Requires: application-local.yml with real secrets configured
# ============================================================

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "Starting MIDORI Backend (local profile)..." -ForegroundColor Green
Write-Host ""

$BackendDir = Join-Path $ProjectRoot "midori-be"
if (-not (Test-Path $BackendDir)) {
    Write-Host "ERROR: midori-be directory not found at $BackendDir" -ForegroundColor Red
    exit 1
}

Push-Location $BackendDir

try {
    $env:SPRING_PROFILES_ACTIVE = "local"
    Write-Host "Profile: local" -ForegroundColor Cyan
    Write-Host "Config:  src/main/resources/application-local.yml" -ForegroundColor Cyan
    Write-Host ""

    # Check if application-local.yml exists
    $localConfig = Join-Path $BackendDir "src\main\resources\application-local.yml"
    if (-not (Test-Path $localConfig)) {
        Write-Host "WARNING: application-local.yml not found!" -ForegroundColor Yellow
        Write-Host "Please copy application-local.example.yml to application-local.yml and fill in your secrets." -ForegroundColor Yellow
        Write-Host "Path: $localConfig" -ForegroundColor Yellow
        Write-Host ""
    }

    Write-Host "Running: mvn spring-boot:run" -ForegroundColor Gray
    Write-Host ""
    mvn spring-boot:run
} finally {
    Pop-Location
}
