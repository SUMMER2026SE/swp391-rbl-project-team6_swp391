# ============================================================
# MIDORI - Kill All Dev Servers (Backend 8080 + Frontend 8081)
# ============================================================
# Usage: .\scripts\dev\kill-all.ps1
# Kills any process holding port 8080 (backend) and 8081 (frontend).
# Safe to run multiple times.
# ============================================================

$ErrorActionPreference = "SilentlyContinue"

$BackendPort = 8080
$FrontendPort = 8081

function Stop-ProcessOnPort {
    param([int]$Port, [string]$Label)

    Write-Host ""
    Write-Host "[$Label] Looking for process on port $Port ..." -ForegroundColor Cyan

    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if (-not $connections) {
        Write-Host "  -> No process listening on port $Port" -ForegroundColor DarkGray
        return
    }

    $killed = @{}
    foreach ($conn in $connections) {
        $pid = $conn.OwningProcess
        if ($pid -le 0) { continue }
        if ($killed.ContainsKey($pid)) { continue }
        $killed[$pid] = $true

        try {
            $proc = Get-Process -Id $pid -ErrorAction Stop
            Write-Host "  -> Killing PID $pid ($($proc.ProcessName))" -ForegroundColor Yellow
            Stop-Process -Id $pid -Force -ErrorAction Stop
        } catch {
            Write-Host "  -> Could not kill PID $pid : $_" -ForegroundColor Red
        }
    }
}

# Also kill known dev commands that may not own the port yet
function Stop-ProcessByName {
    param([string]$Name, [string]$Label)

    $procs = Get-Process -Name $Name -ErrorAction SilentlyContinue
    if (-not $procs) {
        Write-Host "  -> No $Name process running" -ForegroundColor DarkGray
        return
    }
    foreach ($p in $procs) {
        try {
            Write-Host "  -> Killing $Name (PID $($p.Id))" -ForegroundColor Yellow
            Stop-Process -Id $p.Id -Force -ErrorAction Stop
        } catch {}
    }
}

Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "  MIDORI - Kill All Dev Servers" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta

Stop-ProcessOnPort -Port $BackendPort  -Label "Backend"
Stop-ProcessOnPort -Port $FrontendPort -Label "Frontend"

Write-Host ""
Write-Host "[Extra] Killing leftover dev processes (node, java/mvn) ..." -ForegroundColor Cyan
Stop-ProcessByName -Name "node" -Label "node"
# Note: avoid blanket-killing java because IDE may run on JVM; only kill those holding port 8080

Write-Host ""
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "  Done." -ForegroundColor Green
Write-Host "  Backend  ($BackendPort): stopped" -ForegroundColor Green
Write-Host "  Frontend ($FrontendPort): stopped" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
