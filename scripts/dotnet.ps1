param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $DotNetArguments
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$localDotnet = Join-Path $projectRoot '.dotnet/dotnet.exe'
$env:DOTNET_CLI_HOME = Join-Path $projectRoot '.dotnet-home'
$env:NUGET_PACKAGES = Join-Path $projectRoot '.nuget/packages'
$env:DOTNET_CLI_TELEMETRY_OPTOUT = '1'
$env:DOTNET_NOLOGO = '1'

if (Test-Path -LiteralPath $localDotnet) {
    $dotnetCommand = $localDotnet
    $env:DOTNET_ROOT = Split-Path -Parent $localDotnet
    $env:PATH = "$env:DOTNET_ROOT;$env:PATH"
} else {
    $dotnetCommand = (Get-Command dotnet -ErrorAction Stop).Source
}

Push-Location $projectRoot
try {
    & $dotnetCommand @DotNetArguments
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
