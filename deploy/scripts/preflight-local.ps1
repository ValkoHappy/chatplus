param(
  [switch]$RequireToken,
  [switch]$SkipPortCheck
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$deployDir = Split-Path -Parent $scriptDir
$envFile = Join-Path $deployDir '.env.local'
$exampleFile = Join-Path $deployDir '.env.local.example'

function Read-DotEnv {
  param([string]$Path)

  $values = @{}
  foreach ($line in Get-Content $Path) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    if ($line.TrimStart().StartsWith('#')) { continue }
    $parts = $line -split '=', 2
    if ($parts.Count -ne 2) { continue }
    $values[$parts[0].Trim()] = $parts[1].Trim()
  }
  return $values
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw 'Docker CLI is not installed. Install Docker Desktop first.'
}

try {
  docker compose version | Out-Null
} catch {
  throw 'Docker Compose is not available. Start Docker Desktop or install the compose plugin.'
}

if (-not (Test-Path $envFile)) {
  if (-not (Test-Path $exampleFile)) {
    throw "Missing $envFile and $exampleFile."
  }

  Copy-Item $exampleFile $envFile
  Write-Host "Created $envFile from $exampleFile."
  Write-Host 'Review it before the first full run.'
}

$envValues = Read-DotEnv -Path $envFile

if ($RequireToken) {
  $token = $envValues['STRAPI_API_TOKEN']
  if ([string]::IsNullOrWhiteSpace($token) -or $token -eq 'replace-with-strapi-api-token') {
    throw 'Set STRAPI_API_TOKEN in deploy/.env.local before running this command.'
  }
}

if (-not $SkipPortCheck) {
  $busyPorts = @(1337, 8080) | Where-Object {
    Get-NetTCPConnection -State Listen -LocalPort $_ -ErrorAction SilentlyContinue
  }

  if ($busyPorts.Count -gt 0) {
    throw ("These ports are already in use: " + ($busyPorts -join ', ') + ". Free them before starting the local stack.")
  }
}

Write-Host 'Local Docker preflight OK.'
