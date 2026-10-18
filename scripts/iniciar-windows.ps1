param([string]$Action = '')
$ErrorActionPreference = 'Stop'
try {
  $project = Split-Path -Parent $PSScriptRoot
  $node = Get-Command node.exe -ErrorAction SilentlyContinue
  $nodePath = if ($node) { $node.Source } else { $null }
  if (-not $nodePath) {
    foreach ($candidate in @("$env:ProgramFiles\nodejs\node.exe", "$env:LOCALAPPDATA\Programs\nodejs\node.exe", "$env:NVM_SYMLINK\node.exe")) {
      if (Test-Path -LiteralPath $candidate) { $nodePath = $candidate; break }
    }
  }
  if (-not $nodePath) { throw 'No se encuentra Node.js. Instala Node 22.12+ o 24+ y vuelve a abrir SANITY-404.' }
  $command = switch ($Action) { '--stop' { 'stop' } '--status' { 'status' } '--check' { 'check' } '--no-browser' { 'start' } '' { 'start' } default { throw 'Usa --stop, --status, --check o --no-browser.' } }
  & $nodePath (Join-Path $PSScriptRoot 'launcher.mjs') $command $Action
  exit $LASTEXITCODE
} catch {
  Write-Host "SANITY-404: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
