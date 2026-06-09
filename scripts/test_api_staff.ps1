[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}

$loginBody = @{
    identifier = "tito@arzamart.com"
    password = "Arzamart@321"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "https://localhost:7201/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login successful!"
    
    $headers = @{
        Authorization = "Bearer $token"
    }

    $categories = Invoke-RestMethod -Uri "https://localhost:7201/api/admin/categories" -Method Get -Headers $headers
    Write-Host "Categories count: $($categories.Count)"
    Write-Host ($categories | ConvertTo-Json -Depth 4)
} catch {
    Write-Error $_.Exception.Message
    if ($_.Exception.InnerException) {
        Write-Error $_.Exception.InnerException.Message
    }
}
