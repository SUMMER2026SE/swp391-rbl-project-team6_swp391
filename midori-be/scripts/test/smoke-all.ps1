# ============================================================
# MIDORI - Run All Smoke Tests
# ============================================================
# Runs frontend build check, backend API test, and secret scan.
# ============================================================

$ErrorActionPreference = "Continue"
$TestDir = $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MIDORI - Running All Smoke Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$overallFailed = $false

# 1. Frontend smoke test
Write-Host ""
Write-Host ">>> [1/3] Frontend Smoke Test" -ForegroundColor Yellow
Write-Host ("=" * 45) -ForegroundColor Yellow
& "$TestDir\smoke-frontend.ps1"
$feExit = $LASTEXITCODE
if ($feExit -ne 0) {
    Write-Host ""
    Write-Host "[!] Frontend smoke test FAILED (exit $feExit)" -ForegroundColor Red
    $overallFailed = $true
}

# 2. Backend smoke test
Write-Host ""
Write-Host ">>> [2/3] Backend Smoke Test" -ForegroundColor Yellow
Write-Host ("=" * 45) -ForegroundColor Yellow
& "$TestDir\smoke-backend.ps1"
$beExit = $LASTEXITCODE
if ($beExit -ne 0) {
    Write-Host ""
    Write-Host "[!] Backend smoke test FAILED (exit $beExit)" -ForegroundColor Red
    $overallFailed = $true
}

# 3. Secret check
Write-Host ""
Write-Host ">>> [3/3] Secret Check" -ForegroundColor Yellow
Write-Host ("=" * 45) -ForegroundColor Yellow
& "$TestDir\check-secrets.ps1"
$scExit = $LASTEXITCODE
if ($scExit -ne 0) {
    Write-Host ""
    Write-Host "[!] Secret check FAILED (exit $scExit)" -ForegroundColor Red
    $overallFailed = $true
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($overallFailed) {
    Write-Host "  OVERALL: SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Fix the failures above before committing." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "  OVERALL: ALL TESTS PASSED" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ready to commit!" -ForegroundColor Green
    exit 0
}
