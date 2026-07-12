# ============================================================
# MIDORI - Setup/validate FFmpeg for local development
# ============================================================
# Usage: .\scripts\setup-ffmpeg.ps1
# This script does NOT download FFmpeg.
# ============================================================

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DefaultFfmpegDir = Join-Path $ProjectRoot "ffmpeg\bin"

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

function Resolve-FfmpegPath {
    param(
        [string]$EnvKey,
        [string]$DefaultFile
    )

    $envValue = [Environment]::GetEnvironmentVariable($EnvKey)
    if ($envValue) {
        $resolved = $envValue
    } else {
        $resolved = Join-Path $DefaultFfmpegDir $DefaultFile
    }

    return $resolved
}

function Test-Binary {
    param(
        [string]$Name,
        [string]$Path
    )

    if (-not (Test-Path $Path -PathType Leaf)) {
        Write-Fail "$Name not found: $Path"
        return $false
    }

    try {
        $proc = Start-Process -FilePath $Path -ArgumentList "-version" -NoNewWindow -Wait -PassThru -RedirectStandardOutput "$env:TEMP\midori-$Name-version.txt" -RedirectStandardError "$env:TEMP\midori-$Name-version.err"
        $output = Get-Content "$env:TEMP\midori-$Name-version.txt" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($output) {
            Write-Ok "$Name version: $output"
        } else {
            Write-Warn "$Name exists but `-version` produced no output."
        }
        return $true
    } catch {
        Write-Warn "$Name exists at $Path but could not be executed: $($_.Exception.Message)"
        return $false
    }
}

Write-Header "MIDORI FFmpeg Setup Check"

$ffmpegPath = Resolve-FfmpegPath -EnvKey "FFMPEG_PATH" -DefaultFile "ffmpeg.exe"
$ffprobePath = Resolve-FfmpegPath -EnvKey "FFPROBE_PATH" -DefaultFile "ffprobe.exe"

Write-Host "Resolved paths:" -ForegroundColor Cyan
Write-Host "  FFMPEG_PATH=$ffmpegPath"
Write-Host "  FFPROBE_PATH=$ffprobePath"
Write-Host ""

$ok = $true
$ok = Test-Binary -Name "ffmpeg" -Path $ffmpegPath -and $ok
$ok = Test-Binary -Name "ffprobe" -Path $ffprobePath -and $ok

Write-Host ""
if (-not $ok) {
    Write-Fail "FFmpeg setup is incomplete."
    Write-Host ""
    Write-Host "Installation instructions:" -ForegroundColor Yellow
    Write-Host "1. Download FFmpeg from https://www.gyan.dev/ffmpeg/builds/" -ForegroundColor Yellow
    Write-Host "2. Extract it into: $ProjectRoot\ffmpeg\" -ForegroundColor Yellow
    Write-Host "3. Expected structure:" -ForegroundColor Yellow
    Write-Host "   $ProjectRoot\ffmpeg\bin\ffmpeg.exe" -ForegroundColor Yellow
    Write-Host "   $ProjectRoot\ffmpeg\bin\ffprobe.exe" -ForegroundColor Yellow
    Write-Host "4. Or set environment variables before starting the backend:" -ForegroundColor Yellow
    Write-Host '   $env:FFMPEG_PATH = "C:\path\to\ffmpeg.exe"' -ForegroundColor Yellow
    Write-Host '   $env:FFPROBE_PATH = "C:\path\to\ffprobe.exe"' -ForegroundColor Yellow
    Write-Host "5. Re-run this script to validate." -ForegroundColor Yellow
    exit 1
}

Write-Ok "FFmpeg is installed and validated."
exit 0
