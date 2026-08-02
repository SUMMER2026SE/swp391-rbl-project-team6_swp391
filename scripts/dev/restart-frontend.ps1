# ============================================================
# MIDORI - Restart Frontend (kill 8081 then start)
# ============================================================
# Usage: .\scripts\dev\restart-frontend.ps1
# 1. Kills anything on port 8081
# 2. Starts a new terminal running run-frontend.ps1
# ============================================================

$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$FrontendDir  = Join-Path $ProjectRoot "midori-fe"
$FrontendScript = Join-Path $FrontendDir "scripts\run-frontend.ps1"

if (-not (Test-Path $FrontendScript)) {
    Write-Host "ERROR: Cannot find $FrontendScript" -ForegroundColor Red
    exit 1
}

Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "  MIDORI - Restart Frontend (port 8081)" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta

# Step 1: kill anything on port 8081
Write-Host ""
Write-Host "[1/2] Killing existing process on port 8081 ..." -ForegroundColor Cyan
$conn = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
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
    Write-Host "  -> Port 8081 is free." -ForegroundColor DarkGray
}

# Also kill leftover node processes to free Vite lock files / sockets
$nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcs) {
    foreach ($p in $nodeProcs) {
        try {
            Write-Host "  -> Killing node (PID $($p.Id))" -ForegroundColor Yellow
            Stop-Process -Id $p.Id -Force -ErrorAction Stop
        } catch {}
    }
}

Start-Sleep -Milliseconds 800

# Step 2: start frontend in NEW window
Write-Host ""
Write-Host "[2/2] Launching frontend in a new window ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-File", "`"$FrontendScript`"" `
    -WorkingDirectory $FrontendDir

Write-Host ""
Write-Host "Frontend restart signal sent." -ForegroundColor Green
Write-Host "Watch the new window for: 'VITE ready in XXX ms'" -ForegroundColor Green
Write-Host ""
