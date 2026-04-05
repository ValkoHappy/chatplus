& "$PSScriptRoot\preflight-local.ps1" -RequireToken -SkipPortCheck

$deployDir = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $deployDir '.env.local'
$prodCompose = Join-Path $deployDir 'docker-compose.prod.yml'
$localCompose = Join-Path $deployDir 'docker-compose.local.yml'

for ($i = 0; $i -lt 30; $i++) {
  try {
    $status = (Invoke-WebRequest -Uri 'http://127.0.0.1:1337/admin' -UseBasicParsing -TimeoutSec 5).StatusCode
    if ($status -eq 200) { break }
  } catch {}
  Start-Sleep -Seconds 2
}

docker compose --env-file $envFile -f $prodCompose -f $localCompose build portal-builder
docker compose --env-file $envFile -f $prodCompose -f $localCompose run --no-deps --rm portal-builder

Write-Host 'Local public build completed: http://127.0.0.1:8080'
