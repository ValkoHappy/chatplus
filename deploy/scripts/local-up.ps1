& "$PSScriptRoot\preflight-local.ps1" -SkipPortCheck

$deployDir = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $deployDir '.env.local'
$prodCompose = Join-Path $deployDir 'docker-compose.prod.yml'
$localCompose = Join-Path $deployDir 'docker-compose.local.yml'

docker compose --env-file $envFile -f $prodCompose -f $localCompose up -d --build postgres strapi nginx

Write-Host 'Local stack is up.'
Write-Host 'Strapi admin: http://127.0.0.1:1337/admin'
Write-Host 'Public site after build: http://127.0.0.1:8080'
Write-Host 'If STRAPI_API_TOKEN is configured, run .\deploy\scripts\local-build-portal.ps1'
