# ============================================================
# MIDORI - Frontend Smoke Test
# ============================================================
# Validates frontend config and builds the app.
# Does NOT require the backend to be running.
# ============================================================

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$FrontendDir = Join-Path $ProjectRoot "midori-fe"
$EnvLocal = Join-Path $FrontendDir ".env.local"
$EnvExample = Join-Path $FrontendDir ".env.example"
$ALL_PASSED = $true

function Write-Test($name, $passed, $detail = "") {
    if ($passed) {
        Write-Host "[PASS] $name" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $name" -ForegroundColor Red
        $script:ALL_PASSED = $false
    }
    if ($detail) {
        Write-Host "       $detail" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== MIDORI Frontend Smoke Test ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check .env.local exists
Write-Host "[1/4] Checking .env.local exists..." -ForegroundColor Yellow
if (Test-Path $EnvLocal) {
    Write-Test ".env.local exists" $true
} else {
    Write-Test ".env.local exists" $false "File not found at $EnvLocal"
    Write-Host ""
    Write-Host "Run this to create it:" -ForegroundColor Yellow
    Write-Host "  copy-item '$EnvExample' '$EnvLocal'" -ForegroundColor Gray
}

# 2. Validate required env vars are not placeholders
Write-Host ""
Write-Host "[2/4] Validating env var values (no placeholders)..." -ForegroundColor Yellow
$requiredVars = @(
    "VITE_API_BASE_URL",
    "VITE_GOOGLE_CLIENT_ID",
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_AVATAR_BUCKET"
)
$badPatterns = @(
    "YOUR_GOOGLE_CLIENT_ID",
    "YOUR_PROJECT",
    "PASTE_",
    "placeholder",
    "your-supabase"
)

if (Test-Path $EnvLocal) {
    $envContent = Get-Content $EnvLocal -Raw
    foreach ($var in $requiredVars) {
        $val = ($envContent -split "`n" | Where-Object { $_ -match "^$var=" }) -replace "^$var=", "" -replace '"', "" -replace "'", ""
        $val = $val.Trim()
        if ([string]::IsNullOrEmpty($val)) {
            Write-Test "$var is set" $false "Value is empty"
        } else {
            $hasBad = $false
            foreach ($pat in $badPatterns) {
                if ($val -match $pat) {
                    Write-Test "$var is set" $false "Contains placeholder: $pat"
                    $hasBad = $true
                    break
                }
            }
            if (-not $hasBad) {
                Write-Test "$var is set" $true "OK"
            }
        }
    }
} else {
    foreach ($var in $requiredVars) {
        Write-Test "$var is set" $false ".env.local not found"
    }
}

# 3. Check node_modules
Write-Host ""
Write-Host "[3/4] Checking node_modules..." -ForegroundColor Yellow
$nodeModules = Join-Path $FrontendDir "node_modules"
if (Test-Path $nodeModules) {
    Write-Test "node_modules exists" $true
} else {
    Write-Test "node_modules exists" $false "Run 'npm install' in midori-fe first"
    Write-Host "  cd midori-fe; npm install" -ForegroundColor Gray
}

# 4. Build test
Write-Host ""
Write-Host "[4/4] Running npm run build..." -ForegroundColor Yellow
if (-not (Test-Path $nodeModules)) {
    Write-Test "npm run build" $false "node_modules missing - run npm install first"
} else {
    $outFile = Join-Path $env:TEMP "midori-build-out.txt"
    $errFile = Join-Path $env:TEMP "midori-build-err.txt"
    $proc = Start-Process npm.cmd -ArgumentList "run","build" -WorkingDirectory $FrontendDir `
        -RedirectStandardOutput $outFile -RedirectStandardError $errFile -Wait -NoNewWindow -PassThru
    $buildExit = $proc.ExitCode

    if ($buildExit -eq 0) {
        Write-Test "npm run build" $true "Build completed successfully"
    } else {
        Write-Test "npm run build" $false "Exit code: $buildExit"
    }
}

# Summary
Write-Host ""
Write-Host "=== Result ===" -ForegroundColor Cyan
if ($ALL_PASSED) {
    Write-Host "All tests PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some tests FAILED - review output above" -ForegroundColor Red
    exit 1
}
