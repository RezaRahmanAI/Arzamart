[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}

$loginBody = @{
    identifier = "admin@arzamart.com"
    password = "Arzamart@321"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "https://localhost:7201/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login successful!"
    
    $headers = @{
        Authorization = "Bearer $token"
    }

    $products = Invoke-RestMethod -Uri "https://localhost:7201/api/admin/products?searchTerm=&category=all&statusTab=all&stockStatus=all&page=1&pageSize=10" -Method Get -Headers $headers
    Write-Host "Products Count: $($products.items.Count), Total: $($products.total)"
    
    $inventory = Invoke-RestMethod -Uri "https://localhost:7201/api/admin/products/inventory" -Method Get -Headers $headers
    Write-Host "Inventory Count: $($inventory.Count)"
} catch {
    Write-Error $_.Exception.Message
    if ($_.Exception.InnerException) {
        Write-Error $_.Exception.InnerException.Message
    }
}
