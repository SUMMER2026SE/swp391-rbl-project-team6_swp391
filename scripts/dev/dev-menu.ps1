# ============================================================
# MIDORI - Dev Server Controls (one-click menu)
# ============================================================
# Usage: .\scripts\dev\dev-menu.ps1
# Interactive menu to kill / restart backend (8080) and frontend (8081).
# ============================================================

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot

function Show-Menu {
    Clear-Host
    Write-Host "============================================================" -ForegroundColor Magenta
    Write-Host "  MIDORI - Dev Server Controls" -ForegroundColor Magenta
    Write-Host "============================================================" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "  [1] Kill ALL (BE 8080 + FE 8081 + node)" -ForegroundColor White
    Write-Host "  [2] Restart Backend  (kill 8080 -> start)" -ForegroundColor White
    Write-Host "  [3] Restart Frontend (kill 8081 -> start)" -ForegroundColor White
    Write-Host "  [4] Restart BOTH (kill all -> start both)" -ForegroundColor White
    Write-Host "  [5] Show port status (8080 / 8081)" -ForegroundColor White
    Write-Host "  [0] Exit" -ForegroundColor White
    Write-Host ""
}

function Show-Ports {
    Write-Host ""
    Write-Host "Port status:" -ForegroundColor Cyan
    foreach ($p in 8080, 8081) {
        $conn = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
        if ($conn) {
            $pid = ($conn | Select-Object -ExpandProperty OwningProcess -Unique) -join ", "
            try {
                $procName = (Get-Process -Id $pid -ErrorAction Stop).ProcessName
            } catch {
                $procName = "?"
            }
            Write-Host "  Port $p : IN USE (PID $pid, $procName)" -ForegroundColor Yellow
        } else {
            Write-Host "  Port $p : FREE" -ForegroundColor Green
        }
    }
    Write-Host ""
    Read-Host "Press ENTER to return to menu"
}

while ($true) {
    Show-Menu
    $choice = Read-Host "Choose"
    switch ($choice) {
        "1" {
            & powershell -NoProfile -File "$ScriptDir\kill-all.ps1"
            Read-Host "Press ENTER to return to menu"
        }
        "2" {
            & powershell -NoProfile -File "$ScriptDir\restart-backend.ps1"
            Read-Host "Press ENTER to return to menu"
        }
        "3" {
            & powershell -NoProfile -File "$ScriptDir\restart-frontend.ps1"
            Read-Host "Press ENTER to return to menu"
        }
        "4" {
            & powershell -NoProfile -File "$ScriptDir\restart-all.ps1"
            Read-Host "Press ENTER to return to menu"
        }
        "5" { Show-Ports }
        "0" { return }
        default { Start-Sleep -Seconds 1 }
    }
}
