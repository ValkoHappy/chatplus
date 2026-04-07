& "$PSScriptRoot\preflight-local.ps1" -RequireToken -SkipPortCheck

$deployDir = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $deployDir '.env.local'
$prodCompose = Join-Path $deployDir 'docker-compose.prod.yml'
$localCompose = Join-Path $deployDir 'docker-compose.local.yml'
$publicRoot = Join-Path $deployDir 'data/public-site'
$releasesDir = Join-Path $publicRoot 'releases'
$currentDir = Join-Path $publicRoot 'current'
$previousDir = Join-Path $publicRoot 'previous'
$releaseId = if ($env:RELEASE_ID) { $env:RELEASE_ID } else { 'local-' + (Get-Date -Format 'yyyyMMdd-HHmmss') }
$nextDir = Join-Path $publicRoot ("incoming-" + $releaseId)

New-Item -ItemType Directory -Force -Path $releasesDir | Out-Null
if (Test-Path $nextDir) { Remove-Item -Recurse -Force $nextDir }

for ($i = 0; $i -lt 30; $i++) {
  try {
    $status = (Invoke-WebRequest -Uri 'http://127.0.0.1:1337/admin' -UseBasicParsing -TimeoutSec 5).StatusCode
    if ($status -eq 200) { break }
  } catch {}
  Start-Sleep -Seconds 2
}

docker compose --env-file $envFile -f $prodCompose -f $localCompose build portal-builder
docker compose --env-file $envFile -f $prodCompose -f $localCompose run --no-deps --rm -e "PORTAL_OUTPUT_DIR=/portal-output/incoming-$releaseId" portal-builder

$nextIndex = Join-Path $nextDir 'index.html'
if (-not (Test-Path $nextIndex)) {
  throw "Build did not produce $nextIndex"
}

$currentTarget = $null
if (Test-Path $currentDir) {
  $currentItem = Get-Item $currentDir -Force
  if (($currentItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
    $currentTarget = $currentItem.Target
  } elseif ($currentItem.PSIsContainer) {
    if (Test-Path $previousDir) { Remove-Item -Recurse -Force $previousDir }
    Move-Item -Force $currentDir $previousDir
  }
}

$releaseDir = Join-Path $releasesDir $releaseId
if (Test-Path $releaseDir) { Remove-Item -Recurse -Force $releaseDir }
Move-Item -Force $nextDir $releaseDir

$tmpCurrent = Join-Path $publicRoot ('.current-' + $releaseId)
if (Test-Path $tmpCurrent) { Remove-Item -Force $tmpCurrent }
New-Item -ItemType SymbolicLink -Path $tmpCurrent -Target $releaseDir | Out-Null
if (Test-Path $currentDir) { Remove-Item -Force $currentDir }
Move-Item -Force $tmpCurrent $currentDir

if ($currentTarget -and (Test-Path $currentTarget)) {
  $tmpPrevious = Join-Path $publicRoot ('.previous-' + $releaseId)
  if (Test-Path $tmpPrevious) { Remove-Item -Force $tmpPrevious }
  New-Item -ItemType SymbolicLink -Path $tmpPrevious -Target $currentTarget | Out-Null
  if (Test-Path $previousDir) { Remove-Item -Force $previousDir }
  if (Test-Path $previousDir) { Remove-Item -Recurse -Force $previousDir }
  Move-Item -Force $tmpPrevious $previousDir
}

Write-Host 'Local public build completed: http://127.0.0.1:8080'
