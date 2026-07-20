# ============================================================
# MIDORI - Restart ALL (kill 8080 + 8081, start both)
# ============================================================
# Usage: .\scripts\dev\restart-all.ps1
# ============================================================

$ErrorActionPreference = "Stop"

$ScriptDir = $PSScriptRoot
$Backend  = Join-Path $ScriptDir "restart-backend.ps1"
$Frontend = Join-Path $ScriptDir "restart-frontend.ps1"

Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "  MIDORI - Restart ALL" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "This will:" -ForegroundColor White
Write-Host "  1. Kill  anything on port 8080 (Backend)" -ForegroundColor White
Write-Host "  2. Kill  anything on port 8081 (Frontend)" -ForegroundColor White
Write-Host "  3. Restart Backend in a new window" -ForegroundColor White
Write-Host "  4. Restart Frontend in a new window" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "Press ENTER to continue, or type 'no' to cancel"
if ($confirm -eq "no") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

# Kill both ports first (single shot, faster)
& powershell -NoProfile -File "$ScriptDir\kill-all.ps1"

Start-Sleep -Seconds 2

# Then launch both
Start-Process powershell -ArgumentList "-NoExit", "-File", "`"$Backend`""
Start-Sleep -Seconds 1
Start-Process powershell -ArgumentList "-NoExit", "-File", "`"$Frontend`""

Write-Host ""
Write-Host "Both servers are restarting." -ForegroundColor Green
Write-Host "  Backend  window: wait for 'Tomcat started on port 8080'" -ForegroundColor Green
Write-Host "  Frontend window: wait for 'VITE ready'" -ForegroundColor Green
Write-Host ""
