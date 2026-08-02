# ============================================================
# MIDORI - Check FFmpeg Installation
# ============================================================
# Verifies FFmpeg is available in system PATH.
# Usage: .\scripts\setup-ffmpeg.ps1
#
# FFmpeg can be installed via:
# - Windows: winget, chocolatey, scoop, or manual download
# - Linux: apt-get, yum, dnf
# - macOS: brew
# ============================================================

$ErrorActionPreference = "Stop"

$OS = [Environment]::OSVersion.Platform
$IsWindows = ($OS -eq [PlatformID]::Win32NT) -or ($OS -eq [PlatformID]::Win32Windows)

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host $Text -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Ok {
    param([string]$Text)
    Write-Host "[OK] $Text" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Text)
    Write-Host "[WARN] $Text" -ForegroundColor Yellow
}

function Write-Fail {
    param([string]$Text)
    Write-Host "[FAIL] $Text" -ForegroundColor Red
}

function Test-Binary {
    param(
        [string]$Name,
        [string]$Executable
    )

    # First try to find in PATH
    $foundPath = Get-Command $Executable -ErrorAction SilentlyContinue
    if ($foundPath) {
        Write-Ok "$Name found: $($foundPath.Source)"
        return $true
    }

    # If not in PATH, try to run directly (Windows only)
    if ($IsWindows) {
        try {
            $output = & $Executable -version 2>&1 | Select-Object -First 1
            if ($output) {
                Write-Ok "$Name: $output"
                return $true
            }
        } catch {
            Write-Fail "$Name not found in PATH and cannot execute directly."
            return $false
        }
    }

    Write-Fail "$Name not found in PATH"
    return $false
}

Write-Header "MIDORI FFmpeg Setup Check"

Write-Host "Checking FFmpeg installation..." -ForegroundColor White
Write-Host ""

$ok = $true

# Test ffmpeg
$ok = (Test-Binary -Name "ffmpeg" -Executable "ffmpeg") -and $ok
Write-Host ""

# Test ffprobe
$ok = (Test-Binary -Name "ffprobe" -Executable "ffprobe") -and $ok
Write-Host ""

if (-not $ok) {
    Write-Fail "FFmpeg setup is incomplete."
    Write-Host ""
    if ($IsWindows) {
        Write-Host "To install FFmpeg on Windows, choose one method:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  Method 1: Winget (recommended if you have Windows Package Manager)" -ForegroundColor White
        Write-Host "    winget install ffmpeg" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  Method 2: Chocolatey" -ForegroundColor White
        Write-Host "    choco install ffmpeg" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  Method 3: Scoop" -ForegroundColor White
        Write-Host "    scoop install ffmpeg" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  Method 4: Manual download" -ForegroundColor White
        Write-Host "    1. Download from: https://www.gyan.dev/ffmpeg/builds/" -ForegroundColor Gray
        Write-Host "    2. Extract to a folder" -ForegroundColor Gray
        Write-Host "    3. Add the bin folder to your system PATH" -ForegroundColor Gray
        Write-Host "    4. Restart your terminal/IDE" -ForegroundColor Gray
        Write-Host ""
        Write-Host "After installation, restart your terminal/IDE and run this script again." -ForegroundColor Yellow
    } else {
        Write-Host "To install FFmpeg:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  Debian/Ubuntu:" -ForegroundColor White
        Write-Host "    sudo apt-get update && sudo apt-get install -y ffmpeg" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  macOS (with Homebrew):" -ForegroundColor White
        Write-Host "    brew install ffmpeg" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  CentOS/RHEL:" -ForegroundColor White
        Write-Host "    sudo yum install -y ffmpeg" -ForegroundColor Gray
        Write-Host ""
        Write-Host "After installation, restart your terminal and run this script again." -ForegroundColor Yellow
    }
    exit 1
}

Write-Ok "FFmpeg is installed and available in PATH."
Write-Host ""
Write-Host "Note: If shadowing video features don't work, verify FFmpeg is in your system PATH." -ForegroundColor Gray
exit 0
