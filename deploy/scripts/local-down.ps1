$deployDir = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $deployDir '.env.local'
$exampleFile = Join-Path $deployDir '.env.local.example'
$prodCompose = Join-Path $deployDir 'docker-compose.prod.yml'
$localCompose = Join-Path $deployDir 'docker-compose.local.yml'

if (-not (Test-Path $envFile)) {
  if (Test-Path $exampleFile) {
    Copy-Item $exampleFile $envFile
  } else {
    throw "Missing $envFile and $exampleFile."
  }
}

docker compose --env-file $envFile -f $prodCompose -f $localCompose down

Write-Host 'Local stack stopped.'
