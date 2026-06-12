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
                # 1. Ensure security/requestFiltering/requestLimits
                $security = $systemWebServer.security
                if ($null -eq $security) {
                    $security = $xml.CreateElement("security")
                    $systemWebServer.AppendChild($security) | Out-Null
                }
                $requestFiltering = $security.requestFiltering
                if ($null -eq $requestFiltering) {
                    $requestFiltering = $xml.CreateElement("requestFiltering")
                    $security.AppendChild($requestFiltering) | Out-Null
                }
                $requestLimits = $requestFiltering.requestLimits
                if ($null -eq $requestLimits) {
                    $requestLimits = $xml.CreateElement("requestLimits")
                    $requestLimits.SetAttribute("maxAllowedContentLength", "104857600") # 100MB
                    $requestFiltering.AppendChild($requestLimits) | Out-Null
                    Write-Host "Added requestLimits." -ForegroundColor Gray
                }

                # 2. Ensure requestFiltering/verbs for DELETE and PUT
                $verbs = $requestFiltering.verbs
                if ($null -eq $verbs) {
                    $verbs = $xml.CreateElement("verbs")
                    $requestFiltering.AppendChild($verbs) | Out-Null
                }
                
                # Check for DELETE verb
                $deleteVerb = $verbs.SelectSingleNode("add[@verb='DELETE']")
                if ($null -eq $deleteVerb) {
                    $addDelete = $xml.CreateElement("add")
                    $addDelete.SetAttribute("verb", "DELETE")
                    $addDelete.SetAttribute("allowed", "true")
                    $verbs.AppendChild($addDelete) | Out-Null
                    Write-Host "Allowed DELETE verb." -ForegroundColor Gray
                }
                
                # Check for PUT verb
                $putVerb = $verbs.SelectSingleNode("add[@verb='PUT']")
                if ($null -eq $putVerb) {
                    $addPut = $xml.CreateElement("add")
                    $addPut.SetAttribute("verb", "PUT")
                    $addPut.SetAttribute("allowed", "true")
                    $verbs.AppendChild($addPut) | Out-Null
                    Write-Host "Allowed PUT verb." -ForegroundColor Gray
                }

                # 3. Ensure modules and remove WebDAVModule
                $modules = $systemWebServer.modules
                if ($null -eq $modules) {
                    $modules = $xml.CreateElement("modules")
                    $modules.SetAttribute("runAllManagedModulesForAllRequests", "false")
                    $systemWebServer.AppendChild($modules) | Out-Null
                }
                $removeModule = $modules.SelectSingleNode("remove[@name='WebDAVModule']")
                if ($null -eq $removeModule) {
                    $removeModule = $xml.CreateElement("remove")
                    $removeModule.SetAttribute("name", "WebDAVModule")
                    $modules.PrependChild($removeModule) | Out-Null
                    Write-Host "Added modules/remove WebDAVModule." -ForegroundColor Gray
                }

                # 4. Ensure handlers and remove WebDAV
                $handlers = $systemWebServer.handlers
                if ($null -eq $handlers) {
                    $handlers = $xml.CreateElement("handlers")
                    $systemWebServer.AppendChild($handlers) | Out-Null
                }
                $removeHandler = $handlers.SelectSingleNode("remove[@name='WebDAV']")
                if ($null -eq $removeHandler) {
                    $removeHandler = $xml.CreateElement("remove")
                    $removeHandler.SetAttribute("name", "WebDAV")
                    $handlers.PrependChild($removeHandler) | Out-Null
                    Write-Host "Added handlers/remove WebDAV." -ForegroundColor Gray
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

