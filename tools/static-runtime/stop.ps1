$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$packageManifest = Join-Path $projectRoot 'dist\data\package.json'
if (-not (Test-Path -LiteralPath $packageManifest)) { $packageManifest = Join-Path $projectRoot 'data\package.json' }
$packageVersion = if (Test-Path -LiteralPath $packageManifest) { [string]((Get-Content -LiteralPath $packageManifest -Raw | ConvertFrom-Json).version) } else { 'desconhecida' }
$runtime = Join-Path $projectRoot '.runtime'
$stateFile = Join-Path $runtime 'server.json'
$pidFile = Join-Path $runtime 'server.pid'
$portFile = Join-Path $runtime 'server.port'

function Get-CommandLine([int]$ProcessId) {
  try {
    return [string](Get-CimInstance Win32_Process -Filter ("ProcessId={0}" -f $ProcessId) -ErrorAction Stop).CommandLine
  } catch {
    return ''
  }
}

function Test-OwnedProcess([int]$ProcessId) {
  $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  if (-not $process) { return $false }
  $commandLine = Get-CommandLine $ProcessId
  if (-not $commandLine) { return $false }
  return (
    ($commandLine -match [regex]::Escape($projectRoot)) -and
    ($commandLine -match 'static-runtime[\\/](serve\.py|serve\.ps1)')
  )
}

$stopped = $false
$knownPort = $null
$knownPid = $null

if (Test-Path $stateFile) {
  try {
    $state = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
    $knownPid = [int]$state.pid
    $knownPort = [int]$state.port
  } catch {}
}
if (-not $knownPid -and (Test-Path $pidFile)) {
  try { $knownPid = [int](Get-Content $pidFile -ErrorAction Stop) } catch {}
}
if (-not $knownPort -and (Test-Path $portFile)) {
  try { $knownPort = [int](Get-Content $portFile -ErrorAction Stop) } catch {}
}

if ($knownPid -and (Test-OwnedProcess $knownPid)) {
  Stop-Process -Id $knownPid -Force -ErrorAction Stop
  $stopped = $true
  if ($knownPort) {
    Write-Host ("[PASS] Preview local v{0} na porta {1} encerrado." -f $packageVersion, $knownPort)
  } else {
    Write-Host ("[PASS] Preview local v{0} encerrado." -f $packageVersion)
  }
} else {
  # Recovery path: find only server processes that reference this exact project root.
  try {
    $escapedRoot = [regex]::Escape($projectRoot)
    $owned = Get-CimInstance Win32_Process -ErrorAction Stop | Where-Object {
      $_.CommandLine -and
      ($_.CommandLine -match $escapedRoot) -and
      ($_.CommandLine -match 'static-runtime[\\/](serve\.py|serve\.ps1)')
    }
    foreach ($item in $owned) {
      Stop-Process -Id ([int]$item.ProcessId) -Force -ErrorAction SilentlyContinue
      $stopped = $true
    }
    if ($stopped) {
      Write-Host '[PASS] Preview deste projeto localizado e encerrado.'
    }
  } catch {}
}

if (-not $stopped) {
  Write-Host '[INFO] Nenhum preview ativo deste projeto foi encontrado.'
}

Remove-Item $stateFile, $pidFile, $portFile -Force -ErrorAction SilentlyContinue
exit 0
