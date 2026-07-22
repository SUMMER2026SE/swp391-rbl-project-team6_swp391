$ErrorActionPreference = "Continue"
$headers = @{"Content-Type" = "application/json"}

# Login as admin
Write-Host "=== LOGIN ==="
$body = @{"email" = "admin@midori.local"; "password" = "MidoriAdmin2026!"} | ConvertTo-Json
$resp = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method POST -Headers $headers -Body $body -TimeoutSec 30
Write-Host "Success: $($resp.success)"
if ($resp.success) {
    $token = $resp.data.accessToken
    Write-Host "Token obtained: $($token.Substring(0, [Math]::Min(30, $token.Length)))..."
    
    # Save token to file
    $token | Out-File -FilePath "admin_token.txt" -Encoding UTF8
    Write-Host "Token saved to admin_token.txt"
} else {
    Write-Host "Login failed: $($resp.message)"
}
