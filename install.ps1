$ErrorActionPreference = "Stop"

$Repo = "naadodimtr/openui-mcp"
$InstallDir = if ($env:OPENUI_MCP_DIR) { $env:OPENUI_MCP_DIR } else { "$env:USERPROFILE\.openui-mcp" }
$Version = if ($args[0]) { $args[0] } else { "latest" }

if ($Version -eq "latest") {
    $Release = Invoke-RestMethod "https://api.github.com/repos/$Repo/releases/latest"
    $Version = $Release.tag_name
    if (-not $Version) {
        Write-Error "Could not determine latest version"
        exit 1
    }
}

$Artifact = "openui-mcp-win-x64"
$Url = "https://github.com/$Repo/releases/download/$Version/$Artifact.zip"

Write-Host ""
Write-Host "  Installing openui-mcp $Version (windows/x64)..."
Write-Host "    From: $Url"
Write-Host "    To:   $InstallDir"
Write-Host ""

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

$TempZip = "$env:TEMP\openui-mcp.zip"
Invoke-WebRequest -Uri $Url -OutFile $TempZip
Expand-Archive -Path $TempZip -DestinationPath $InstallDir -Force
Remove-Item $TempZip

$Binary = Join-Path $InstallDir "openui-mcp.exe"
$Extracted = Join-Path $InstallDir "$Artifact.exe"
if (Test-Path $Extracted -PathType Leaf) {
    Move-Item -Force $Extracted $Binary
} elseif (Test-Path (Join-Path $InstallDir $Artifact) -PathType Leaf) {
    Move-Item -Force (Join-Path $InstallDir $Artifact) $Binary
}

$CurrentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($CurrentPath -notlike "*$InstallDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$InstallDir;$CurrentPath", "User")
    Write-Host "  Added $InstallDir to user PATH"
}

Write-Host ""
Write-Host "  ✓ openui-mcp $Version installed successfully!"
Write-Host ""

if ([Console]::IsInputRedirected) {
    Write-Host "  Run 'openui-mcp --setup' to configure your MCP client."
    Write-Host "  Preview: http://localhost:6556 (default)"
} else {
    & $Binary --setup
}

Write-Host ""
Write-Host "  Update later with: openui-mcp --update"
Write-Host ""
