# ============================================================
# MIDORI - Secret Check Before Commit
# ============================================================
# Scans staged files for leaked secrets, passwords, and tokens.
# Run before every commit.
# ============================================================

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ALL_PASSED = $true
$SECRET_PATTERNS = @(
    @{ Name = "Supabase secret key"; Pattern = "sb_secret_" },
    @{ Name = "DB password assignment"; Pattern = "SUPABASE_DB_PASSWORD=" },
    @{ Name = "Gmail App Password"; Pattern = "GMAIL_APP_PASSWORD" },
    @{ Name = "Gmail App Password value"; Pattern = "gsdo[a-z]{12}" },
    @{ Name = "Placeholder DB password"; Pattern = "PASTE_SUPABASE_DB_PASSWORD_HERE" }
)
$FORBIDDEN_FILES = @(
    "application-local.yml",
    ".env.local"
)

function Write-Test($name, $passed, $detail) {
    if ($passed) {
        Write-Host "[PASS] $name" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $name" -ForegroundColor Red
        $script:ALL_PASSED = $false
    }
    if ($detail -and -not $passed) {
        Write-Host "       $detail" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== MIDORI Secret Check ===" -ForegroundColor Cyan
Write-Host ""

# 1. git status --short
Write-Host "[1/4] Checking git status..." -ForegroundColor Yellow
Push-Location $ProjectRoot
try {
    $status = git status --short 2>&1
    if ($LASTEXITCODE -ne 0) { throw "git failed" }
    $statusLines = $status -split "`n" | Where-Object { $_ -match "\S" }
    if ($statusLines.Count -eq 0) {
        Write-Host "       No changes to commit" -ForegroundColor Gray
    } else {
        foreach ($line in $statusLines) { Write-Host "  $line" -ForegroundColor Gray }
    }
} finally {
    Pop-Location
}

# 2. Check that secret files are ignored
Write-Host ""
Write-Host "[2/4] Verifying secret files are ignored..." -ForegroundColor Yellow
$checkPaths = @(
    "midori-be/src/main/resources/application-local.yml",
    "midori-fe/.env.local"
)
foreach ($p in $checkPaths) {
    Push-Location $ProjectRoot
    $result = git check-ignore -v $p 2>&1
    $gitExit = $LASTEXITCODE
    Pop-Location

    $base = Split-Path $p -Leaf
    if ($gitExit -eq 0 -and $result) {
        Write-Test "$base is ignored" $true $result
    } else {
        Write-Test "$base is ignored" $false "NOT in .gitignore - must not be committed!"
    }
}

# 3. Check staged files for forbidden filenames
Write-Host ""
Write-Host "[3/4] Checking staged files..." -ForegroundColor Yellow
Push-Location $ProjectRoot
try {
    $stagedOutput = git diff --cached --name-only 2>&1
    if ($LASTEXITCODE -ne 0) { throw "git diff --cached failed" }

    if ([string]::IsNullOrWhiteSpace($stagedOutput)) {
        Write-Test "No secret files staged" $true "Nothing is staged yet"
    } else {
        $stagedList = $stagedOutput -split "`n" | Where-Object { $_ -match "\S" }
        $hasBad = $false
        foreach ($sf in $stagedList) {
            $basename = Split-Path $sf -Leaf
            if ($FORBIDDEN_FILES -contains $basename) {
                Write-Test "Staged file check" $false "FORBIDDEN file staged: $sf"
                $hasBad = $true
            }
        }
        if (-not $hasBad) {
            Write-Test "No forbidden files staged" $true "$($stagedList.Count) file(s) staged (OK)"
        }
    }
} finally {
    Pop-Location
}

# 4. Scan staged diff for secret patterns
Write-Host ""
Write-Host "[4/4] Scanning staged diff for secret patterns..." -ForegroundColor Yellow
Push-Location $ProjectRoot
try {
    $stagedOutput = git diff --cached --name-only 2>&1
    if ([string]::IsNullOrWhiteSpace($stagedOutput)) {
        Write-Test "Staged diff scan" $true "No staged files to scan"
    } else {
        $diffOutput = git diff --cached 2>&1
        if ($LASTEXITCODE -ne 0) { throw "git diff --cached failed" }

        $secretsFound = $false
        foreach ($sp in $SECRET_PATTERNS) {
            if ($diffOutput -cmatch $sp.Pattern) {
                $lines = $diffOutput -split "`n"
                $hitLine = $lines | Where-Object { $_ -cmatch $sp.Pattern } | Select-Object -First 1
                Write-Test "Secret pattern scan" $false "$($sp.Name) found in staged diff"
                if ($hitLine) {
                    $sanitized = $hitLine -replace $sp.Pattern, "***REDACTED***"
                    Write-Host "       Line: $sanitized" -ForegroundColor Yellow
                }
                $secretsFound = $true
            }
        }

        if (-not $secretsFound) {
            Write-Test "Secret pattern scan" $true "No secret patterns detected in staged diff"
        }

        # Also check untracked files
        $untracked = git ls-files --others --exclude-standard 2>&1
        if ($untracked) {
            $untrackedList = $untracked -split "`n" | Where-Object { $_ -match "\S" }
            $badUntracked = $untrackedList | Where-Object {
                $name = Split-Path $_ -Leaf
                $FORBIDDEN_FILES -contains $name
            }
            if ($badUntracked) {
                Write-Test "Untracked file check" $false "Forbidden files exist locally:"
                foreach ($b in $badUntracked) { Write-Host "  $b" -ForegroundColor Red }
            } else {
                Write-Test "Untracked file check" $true "No forbidden files found in working tree"
            }
        }
    }
} finally {
    Pop-Location
}

# Summary
Write-Host ""
Write-Host "=== Result ===" -ForegroundColor Cyan
if ($ALL_PASSED) {
    Write-Host "All checks PASSED - safe to commit" -ForegroundColor Green
    exit 0
} else {
    Write-Host "FAILED - review output above before committing!" -ForegroundColor Red
    Write-Host ""
    Write-Host "If secret files are staged, run:" -ForegroundColor Yellow
    Write-Host "  git reset HEAD midori-be/src/main/resources/application-local.yml" -ForegroundColor Gray
    Write-Host "  git reset HEAD midori-fe/.env.local" -ForegroundColor Gray
    exit 1
}
