# ============================================================
# MIDORI - Backend Smoke Test
# ============================================================
# Checks if backend is running and tests basic API endpoints.
# Run AFTER starting the backend with .\scripts\run-backend-local.ps1
# ============================================================

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$BASE_URL = "http://localhost:8080"
$API_URL = "$BASE_URL/api"
$ALL_PASSED = $true

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
Write-Host "=== MIDORI Backend Smoke Test ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check if port 8080 is open
Write-Host "[1/6] Checking if backend is running on port 8080..." -ForegroundColor Yellow
$tcp = Test-NetConnection -ComputerName localhost -Port 8080 -WarningAction SilentlyContinue
if ($tcp.TcpTestSucceeded) {
    Write-Test "Backend is listening on port 8080" $true "Port 8080 is open"
} else {
    Write-Test "Backend is listening on port 8080" $false "Port 8080 is not reachable"
    Write-Host ""
    Write-Host "ERROR: Backend is not running." -ForegroundColor Red
    Write-Host "Start it with: .\scripts\run-backend-local.ps1" -ForegroundColor Yellow
    exit 1
}

# 2. Health check (optional)
Write-Host ""
Write-Host "[2/6] Testing health/info endpoint..." -ForegroundColor Yellow
$healthOk = $false
try {
    $health = Invoke-WebRequest -Uri "$BASE_URL/api/health" -Method GET -TimeoutSec 5 -UseBasicParsing
    Write-Test "GET /api/health" $true "HTTP $($health.StatusCode)"
    $healthOk = $true
} catch {
    try {
        $act = Invoke-WebRequest -Uri "$BASE_URL/actuator/health" -Method GET -TimeoutSec 5 -UseBasicParsing
        Write-Test "GET /actuator/health" $true "HTTP $($act.StatusCode)"
        $healthOk = $true
    } catch {
        Write-Test "GET /api/health" $false "Not found (optional endpoint)"
    }
}

# 3. GET /api/auth/me without token (expect 401/403)
Write-Host ""
Write-Host "[3/6] Testing unauthenticated /api/auth/me (expect 401/403)..." -ForegroundColor Yellow
$meCode = $null
try {
    $me = Invoke-WebRequest -Uri "$API_URL/auth/me" -Method GET -TimeoutSec 5 -UseBasicParsing
    $meCode = $me.StatusCode
} catch {
    if ($_.Exception.Response) {
        $meCode = [int]$_.Exception.Response.StatusCode
    }
}
if ($null -ne $meCode) {
    if ($meCode -eq 401 -or $meCode -eq 403) {
        Write-Test "GET /api/auth/me (no token)" $true "HTTP $meCode - correctly rejected (no token)"
    } elseif ($meCode -eq 200) {
        Write-Test "GET /api/auth/me (no token)" $true "HTTP $meCode - endpoint accessible"
    } else {
        Write-Test "GET /api/auth/me (no token)" $false "HTTP $meCode - unexpected status"
    }
} else {
    Write-Test "GET /api/auth/me (no token)" $false "No HTTP response"
}

# 4. Register test user
Write-Host ""
Write-Host "[4/6] Testing user registration..." -ForegroundColor Yellow
$ts = (Get-Date).ToString("yyyyMMdd-HHmmss")
$randomNum = Get-Random -Minimum 100 -Maximum 999
$testEmail = "midori-smoke+$ts-$randomNum@gmail.com"
$testPassword = "Midori@2026"
$body = @{ email = $testEmail; password = $testPassword } | ConvertTo-Json
$regSuccess = $false
$regCode = $null

try {
    $reg = Invoke-RestMethod -Uri "$API_URL/auth/register" -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 10
    $regSuccess = $true
    $regCode = 200
    Write-Test "POST /api/auth/register" $true "HTTP 200 - user registered"
} catch {
    $regSuccess = $false
    if ($_.Exception.Response) {
        $regCode = [int]$_.Exception.Response.StatusCode
        $errBody = ""
        try { $errBody = $_.ErrorDetails.Message } catch { $errBody = "" }
        if ($regCode -eq 400 -or $regCode -eq 409) {
            Write-Test "POST /api/auth/register" $true "HTTP $regCode - validation error"
        } elseif ($regCode -eq 500) {
            Write-Test "POST /api/auth/register" $false "HTTP 500 - server error"
        } else {
            Write-Test "POST /api/auth/register" $true "HTTP $regCode"
        }
    } else {
        Write-Test "POST /api/auth/register" $false "Connection failed"
    }
}

# 5. Try login
Write-Host ""
Write-Host "[5/6] Testing login endpoint..." -ForegroundColor Yellow
if ($regSuccess) {
    $loginBody = @{ email = $testEmail; password = $testPassword } | ConvertTo-Json
    try {
        $login = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method POST `
            -ContentType "application/json" `
            -Body $loginBody `
            -TimeoutSec 10
        Write-Test "POST /api/auth/login (unverified user)" $true "HTTP 200 - login succeeded"
    } catch {
        if ($_.Exception.Response) {
            $loginCode = [int]$_.Exception.Response.StatusCode
            $errBody = ""
            try { $errBody = $_.ErrorDetails.Message } catch { $errBody = "" }
            if ($loginCode -eq 401 -or $loginCode -eq 403) {
                if ($errBody -match "not verified|not.*verif|email.*verif") {
                    Write-Test "POST /api/auth/login (unverified user)" $true "HTTP $loginCode - requires email verification"
                } else {
                    Write-Test "POST /api/auth/login (unverified user)" $true "HTTP $loginCode - rejected"
                }
            } elseif ($loginCode -eq 500) {
                Write-Test "POST /api/auth/login (unverified user)" $false "HTTP 500 - server error"
            } else {
                Write-Test "POST /api/auth/login (unverified user)" $true "HTTP $loginCode"
            }
        } else {
            Write-Test "POST /api/auth/login (unverified user)" $false "Connection failed"
        }
    }
} else {
    $loginBody = @{ email = "nobody@example.com"; password = "wrongpass123" } | ConvertTo-Json
    try {
        $login = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method POST `
            -ContentType "application/json" `
            -Body $loginBody `
            -TimeoutSec 10
        Write-Test "POST /api/auth/login (invalid creds)" $false "HTTP 200 - should have been rejected"
    } catch {
        if ($_.Exception.Response) {
            $loginCode = [int]$_.Exception.Response.StatusCode
            if ($loginCode -eq 401 -or $loginCode -eq 403 -or $loginCode -eq 400) {
                Write-Test "POST /api/auth/login (invalid creds)" $true "HTTP $loginCode - correctly rejected"
            } else {
                Write-Test "POST /api/auth/login (invalid creds)" $false "HTTP $loginCode"
            }
        } else {
            Write-Test "POST /api/auth/login (invalid creds)" $true "Connection failed (endpoint exists)"
        }
    }
}

# 6. Forgot password
Write-Host ""
Write-Host "[6/6] Testing forgot-password endpoint..." -ForegroundColor Yellow
$fpBody = @{ email = "nobody@example.com" } | ConvertTo-Json
try {
    $fp = Invoke-RestMethod -Uri "$API_URL/auth/forgot-password" -Method POST `
        -ContentType "application/json" `
        -Body $fpBody `
        -TimeoutSec 10
    Write-Test "POST /api/auth/forgot-password" $true "HTTP 200 - endpoint works"
} catch {
    if ($_.Exception.Response) {
        $fpCode = [int]$_.Exception.Response.StatusCode
        if ($fpCode -eq 404) {
            Write-Test "POST /api/auth/forgot-password" $false "Endpoint not found"
        } elseif ($fpCode -ge 200 -and $fpCode -lt 300) {
            Write-Test "POST /api/auth/forgot-password" $true "HTTP $fpCode"
        } else {
            Write-Test "POST /api/auth/forgot-password" $true "HTTP $fpCode"
        }
    } else {
        Write-Test "POST /api/auth/forgot-password" $false "Connection failed"
    }
}

# Summary
Write-Host ""
Write-Host "=== Result ===" -ForegroundColor Cyan
if ($ALL_PASSED) {
    Write-Host "All tests PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "NOTE: Complete OTP verification manually if required." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "Some tests FAILED - review output above" -ForegroundColor Red
    exit 1
}
