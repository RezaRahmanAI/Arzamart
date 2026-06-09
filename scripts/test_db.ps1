$connectionString = 'Server=104.234.134.230\MSSQLSERVER2019;Database=arzamartcom;User ID=sherasho_arzamartdb;Password=3vQ4$lKrPue8%mys;Encrypt=True;TrustServerCertificate=True;'
$connection = New-Object System.Data.SqlClient.SqlConnection
$connection.ConnectionString = $connectionString
try {
    $connection.Open()
    Write-Host "Connection Successful!"
    
    $cmd = $connection.CreateCommand()
    $cmd.CommandText = "SELECT Email, Role, FullName, IsActive, AllowedMenusJson FROM AspNetUsers"
    $reader = $cmd.ExecuteReader()
    while ($reader.Read()) {
        Write-Host "Email: $($reader['Email'])"
        Write-Host "  Role: $($reader['Role'])"
        Write-Host "  Name: $($reader['FullName'])"
        Write-Host "  IsActive: $($reader['IsActive'])"
        Write-Host "  AllowedMenus: $($reader['AllowedMenusJson'])"
        Write-Host ""
    }
    
    $connection.Close()
} catch {
    Write-Error $_.Exception.Message
}
