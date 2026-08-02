# ============================================================
# MIDORI - Download KANJIDIC2.xml
# ============================================================
# Downloads KANJIDIC2.xml from the official EDRDG source.
# Usage: .\scripts\download-kanjidic.ps1
#
# KANJIDIC2 is provided by the Electronic Dictionary Research
# and Development Group (EDRDG). See license at:
# https://www.edrdg.org/edrdg/licence.html
# ============================================================

$ErrorActionPreference = "Stop"

# Determine project root (parent of midori-be)
$ScriptRoot = Split-Path -Parent $PSScriptRoot
$ProjectRoot = Split-Path -Parent $ScriptRoot

# Default download URL (can be overridden via KANJIDIC2_DOWNLOAD_URL env var)
# Note: The official EDRDG URL may return 404. Alternative URLs are:
# - https://www.csse.monash.edu.au/~jwb/kanjidic2/kanjidic2.xml.gz (Jim Breen's mirror)
# - Use the API endpoint below if available
$DefaultDownloadUrl = "https://www.csse.monash.edu.au/~jwb/kanjidic2/kanjidic2.xml"
$DownloadUrl = if ($env:KANJIDIC2_DOWNLOAD_URL) { $env:KANJIDIC2_DOWNLOAD_URL } else { $DefaultDownloadUrl }

# Output directory and file
$ResourcesDir = Join-Path $ProjectRoot "midori-be\src\main\resources"
$OutputDir = Join-Path $ResourcesDir "dictionary"
$OutputFile = Join-Path $OutputDir "KANJIDIC2.xml"

# For Sudachi-compatible path (alternative location)
$SudachiDir = Join-Path $OutputDir "sudachi"

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

Write-Header "MIDORI - Download KANJIDIC2.xml"

Write-Host "KANJIDIC2 is provided by:" -ForegroundColor White
Write-Host "  Electronic Dictionary Research and Development Group (EDRDG)" -ForegroundColor White
Write-Host "  https://www.edrdg.org/wiki/index.php/KANJIDIC2" -ForegroundColor White
Write-Host ""
Write-Host "License: https://www.edrdg.org/edrdg/licence.html" -ForegroundColor Gray
Write-Host ""

# Check if file already exists
if (Test-Path $OutputFile) {
    $existingSize = (Get-Item $OutputFile).Length
    Write-Host "Found existing KANJIDIC2.xml: $OutputFile" -ForegroundColor Yellow
    Write-Host "  Size: $([Math]::Round($existingSize / 1MB, 2)) MB" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Overwrite? [y/N]"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Download cancelled." -ForegroundColor Cyan
        exit 0
    }
}

# Create output directory if it doesn't exist
if (-not (Test-Path $OutputDir)) {
    Write-Host "Creating directory: $OutputDir" -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Also create sudachi directory (for compatibility)
if (-not (Test-Path $SudachiDir)) {
    Write-Host "Creating directory: $SudachiDir" -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $SudachiDir -Force | Out-Null
}

Write-Host "Download URL: $DownloadUrl" -ForegroundColor Cyan
Write-Host "Output file: $OutputFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "Downloading..." -ForegroundColor White

try {
    # Download with progress
    $ProgressPreference = "Continue"
    
    $webClient = New-Object System.Net.WebClient
    $webClient.DownloadFile($DownloadUrl, $OutputFile)
    
    # Verify download
    if (Test-Path $OutputFile) {
        $fileSize = (Get-Item $OutputFile).Length
        $fileSizeMB = [Math]::Round($fileSize / 1MB, 2)
        
        # Verify it's a valid XML file
        $firstLine = Get-Content $OutputFile -TotalCount 1 -ErrorAction SilentlyContinue
        if ($firstLine -match '<\?xml') {
            Write-Ok "Downloaded successfully!"
            Write-Host ""
            Write-Host "File: $OutputFile" -ForegroundColor White
            Write-Host "Size: $fileSizeMB MB" -ForegroundColor White
            Write-Host ""
            Write-Ok "KANJIDIC2.xml is ready for use."
            Write-Host ""
            Write-Host "To use with MIDORI:" -ForegroundColor Cyan
            Write-Host "  1. Restart the backend if it's running" -ForegroundColor Cyan
            Write-Host "  2. Optionally run: mvn spring-boot:run -- --import-kanji" -ForegroundColor Cyan
            Write-Host "     to import Kanji data into the database" -ForegroundColor Cyan
            exit 0
        } else {
            Write-Fail "Downloaded file is not valid XML. Removing corrupted file..."
            Remove-Item $OutputFile -Force -ErrorAction SilentlyContinue
            exit 1
        }
    } else {
        Write-Fail "Download failed - file not found."
        exit 1
    }
} catch {
    Write-Fail "Download failed: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "Alternative download methods:" -ForegroundColor Yellow
    Write-Host "  1. Visit https://www.edrdg.org/wiki/index.php/KANJIDIC2" -ForegroundColor Yellow
    Write-Host "  2. Download the XML file manually" -ForegroundColor Yellow
    Write-Host "  3. Save as: $OutputFile" -ForegroundColor Yellow
    Write-Host "" -ForegroundColor Yellow
    Write-Host "Known mirrors:" -ForegroundColor Yellow
    Write-Host "  - https://www.csse.monash.edu.au/~jwb/kanjidic2/kanjidic2.xml" -ForegroundColor Yellow
    exit 1
}
