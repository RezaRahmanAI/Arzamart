Write-Host "Starting Backend Publish..." -ForegroundColor Cyan

# Define paths
$projectPath = ".\ECommerce.API\ECommerce.API.csproj"
$outputPath = ".\publish_api"

# Execute publish
dotnet publish $projectPath -c Release -o $outputPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nPublish Successful! Applying web.config patches..." -ForegroundColor Green
    
    $webConfigPath = Join-Path $outputPath "web.config"
    if (Test-Path $webConfigPath) {
        try {
            # Use absolute path for XML save
            $fullWebConfigPath = (Resolve-Path $webConfigPath).Path
            $xml = [xml](Get-Content $fullWebConfigPath)
            
            # Robustly find system.webServer node
            $systemWebServer = $xml.configuration.location."system.webServer"
            if ($null -eq $systemWebServer) {
                 $systemWebServer = $xml.configuration."system.webServer"
            }

            if ($null -ne $systemWebServer) {
                # 1. Add request limits if not present
                if ($null -eq $systemWebServer.security) {
                    $security = $xml.CreateElement("security")
                    $requestFiltering = $xml.CreateElement("requestFiltering")
                    $requestLimits = $xml.CreateElement("requestLimits")
                    $requestLimits.SetAttribute("maxAllowedContentLength", "104857600") # 100MB
                    $requestFiltering.AppendChild($requestLimits) | Out-Null
                    $security.AppendChild($requestFiltering) | Out-Null
                    $systemWebServer.AppendChild($security) | Out-Null
                    Write-Host "Added security/requestFiltering/requestLimits." -ForegroundColor Gray
                }

                # 2. Remove WebDAV if not present
                if ($null -eq $systemWebServer.modules) {
                    $modules = $xml.CreateElement("modules")
                    $modules.SetAttribute("runAllManagedModulesForAllRequests", "false")
                    $remove = $xml.CreateElement("remove")
                    $remove.SetAttribute("name", "WebDAVModule")
                    $modules.AppendChild($remove) | Out-Null
                    $systemWebServer.AppendChild($modules) | Out-Null
                    Write-Host "Added modules/remove WebDAVModule." -ForegroundColor Gray
                }

                $xml.Save($fullWebConfigPath)
                Write-Host "web.config patches applied successfully." -ForegroundColor Cyan
            } else {
                Write-Host "Warning: Could not find system.webServer node in web.config" -ForegroundColor Red
            }
        } catch {
            Write-Host "Error patching web.config: $($_.Exception.Message)" -ForegroundColor Red
        }
    }



    Write-Host "`nFiles are ready in: $(Resolve-Path $outputPath)" -ForegroundColor Yellow
} else {
    Write-Host "`nPublish Failed!" -ForegroundColor Red
}

