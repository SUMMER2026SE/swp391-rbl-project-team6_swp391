# ============================================================
# MIDORI - Restart Backend (kill 8080 then start)
# ============================================================
# Usage: .\scripts\dev\restart-backend.ps1
# 1. Kills anything on port 8080
# 2. Starts a new terminal running run-backend-local.ps1
# ============================================================

$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$BackendDir  = Join-Path $ProjectRoot "midori-be"
$BackendScript = Join-Path $BackendDir "scripts\run-backend-local.ps1"

if (-not (Test-Path $BackendScript)) {
    Write-Host "ERROR: Cannot find $BackendScript" -ForegroundColor Red
    exit 1
}

Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "  MIDORI - Restart Backend (port 8080)" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta

# Step 1: kill anything on port 8080
Write-Host ""
Write-Host "[1/2] Killing existing process on port 8080 ..." -ForegroundColor Cyan
$conn = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    $pids = $conn | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $pids) {
        if ($pid -gt 0) {
            try {
                $p = Get-Process -Id $pid -ErrorAction Stop
                Write-Host "  -> Killing PID $pid ($($p.ProcessName))" -ForegroundColor Yellow
                Stop-Process -Id $pid -Force -ErrorAction Stop
            } catch {}
        }
    }
} else {
    Write-Host "  -> Port 8080 is free." -ForegroundColor DarkGray
}

# Wait briefly for port release
Start-Sleep -Milliseconds 800

# Step 2: start backend in a NEW window so this script can return
Write-Host ""
Write-Host "[2/2] Launching backend in a new window ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-File", "`"$BackendScript`"" `
    -WorkingDirectory $BackendDir

Write-Host ""
Write-Host "Backend restart signal sent." -ForegroundColor Green
Write-Host "Watch the new window for: 'Started MidoriBeApplication in X.XXX seconds'" -ForegroundColor Green
Write-Host ""
