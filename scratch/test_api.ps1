# Disable SSL certificate verification (since localhost uses self-signed certs)
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

# Step 1: Login
$loginUrl = "https://localhost:7201/api/staff/auth/login"
$loginBody = @{
    username = "superadmin"
    password = "SuperAdmin@123"
} | ConvertTo-Json

Write-Host "Logging in..."
try {
    $loginRes = Invoke-RestMethod -Uri $loginUrl -Method Post -ContentType "application/json" -Body $loginBody
    $token = $loginRes.data.accessToken
    Write-Host "Login successful!"
} catch {
    Write-Error "Login failed: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Host "Response body: $body"
    }
    exit
}

# Step 2: Get Roles
$rolesUrl = "https://localhost:7201/api/staff/roles"
$headers = @{
    Authorization = "Bearer $token"
}

Write-Host "`nFetching roles..."
try {
    $rolesRes = Invoke-RestMethod -Uri $rolesUrl -Method Get -Headers $headers
    Write-Host "Roles Response:"
    $rolesRes | ConvertTo-Json -Depth 5
} catch {
    Write-Error "Fetch roles failed: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Host "Response body: $body"
    }
}

# Step 3: Get Staff Users
$usersUrl = "https://localhost:7201/api/staff/users?page=1&pageSize=20"
Write-Host "`nFetching staff users..."
try {
    $usersRes = Invoke-RestMethod -Uri $usersUrl -Method Get -Headers $headers
    Write-Host "Users Response:"
    $usersRes | ConvertTo-Json -Depth 5
} catch {
    Write-Error "Fetch users failed: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Host "Response body: $body"
    }
}
