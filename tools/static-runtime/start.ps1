param(
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$distManifest = Join-Path $projectRoot 'dist\data\package.json'
$packageManifest = Join-Path $projectRoot 'data\package.json'
if (Test-Path -LiteralPath $distManifest) {
  $siteRoot = Join-Path $projectRoot 'dist'
  $packageManifest = $distManifest
} elseif (Test-Path -LiteralPath $packageManifest) {
  $siteRoot = $projectRoot
} else {
  throw 'Manifesto data\package.json ausente em dist/ e na raiz.'
}
$packageVersion = [string]((Get-Content -LiteralPath $packageManifest -Raw | ConvertFrom-Json).version)
if ([string]::IsNullOrWhiteSpace($packageVersion)) { throw 'Versao ausente em data\package.json.' }
Set-Location $projectRoot

$runtime = Join-Path $projectRoot '.runtime'
New-Item -ItemType Directory -Force -Path $runtime | Out-Null
$stateFile = Join-Path $runtime 'server.json'
$pidFile = Join-Path $runtime 'server.pid'
$portFile = Join-Path $runtime 'server.port'
$stdoutLog = Join-Path $runtime 'server.stdout.log'
$stderrLog = Join-Path $runtime 'server.stderr.log'

function Write-Step([string]$Kind, [string]$Message) {
  Write-Host ("[{0}] {1}" -f $Kind, $Message)
}

function Test-PortAvailable([int]$Port) {
  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
  try { $listener.Start(); return $true }
  catch { return $false }
  finally { try { $listener.Stop() } catch {} }
}

function Get-CommandLine([int]$ProcessId) {
  try {
    return [string](Get-CimInstance Win32_Process -Filter ("ProcessId={0}" -f $ProcessId) -ErrorAction Stop).CommandLine
  } catch {
    return ''
  }
}

function Stop-OwnedProcess([int]$ProcessId) {
  if ($ProcessId -le 0 -or $ProcessId -eq $PID) { return }
  $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  if (-not $process) { return }
  $commandLine = Get-CommandLine $ProcessId
  $escapedRoot = [regex]::Escape($projectRoot)
  if ($commandLine -and ($commandLine -match $escapedRoot) -and ($commandLine -match 'static-runtime[\\/](serve\.py|serve\.ps1)')) {
    Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 200
  }
}

function Read-PreviewResponse([string]$Url) {
  $request = [System.Net.HttpWebRequest][System.Net.WebRequest]::Create($Url)
  $request.Timeout = 10000
  $request.ReadWriteTimeout = 10000
  $request.KeepAlive = $false
  $response = [System.Net.HttpWebResponse]$request.GetResponse()
  try {
    $stream = $response.GetResponseStream()
    $buffer = New-Object byte[] 512
    $count = $stream.Read($buffer, 0, $buffer.Length)
    return [pscustomobject]@{
      status = [int]$response.StatusCode
      bytes = $count
      prefix = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $count)
      cache = [string]$response.Headers['Cache-Control']
      package = [string]$response.Headers['X-Filomatia-Package']
      content_type_options = [string]$response.Headers['X-Content-Type-Options']
    }
  } finally { $response.Dispose() }
}

function Test-ExpectedPreview([int]$Port) {
  $script:LastVerificationFailures = @()
  try {
    $base = "http://127.0.0.1:$Port/"
    $routes = @('') + @(1..35 | ForEach-Object { 'topicos/t{0:D2}/' -f $_ })
    foreach ($route in $routes) {
      $response = Read-PreviewResponse ($base + $route)
      if ($response.status -ne 200 -or $response.bytes -eq 0 -or $response.prefix -notmatch '(?i)<!doctype html') {
        $script:LastVerificationFailures += "Rota invalida: $route"
      }
      if ($response.cache -notmatch 'no-store' -or $response.package -ne $packageVersion -or $response.content_type_options -ne 'nosniff') {
        $script:LastVerificationFailures += "Cabecalhos invalidos: $route"
      }
    }
    $assets = @(
      'data/package.json', 'data/topics.json', 'data/search-index.json', 'sitemap.xml',
      "assets/css/base.css?v=$packageVersion", "assets/js/app.js?v=$packageVersion",
      'assets/vendor/mermaid-11.17.2.min.js', 'assets/vendor/highlight-11.12.0.min.js'
    )
    foreach ($asset in $assets) {
      $response = Read-PreviewResponse ($base + $asset)
      if ($response.status -ne 200 -or $response.bytes -eq 0) {
        $script:LastVerificationFailures += "Asset invalido: $asset"
      }
    }
    if ($script:LastVerificationFailures.Count -eq 0) { Write-Step 'PASS' 'Rotas: 36/36; dados e assets essenciais: PASS.' }
    return ($script:LastVerificationFailures.Count -eq 0)
  } catch {
    $script:LastVerificationFailures += ('erro HTTP: ' + $_.Exception.Message)
    return $false
  }
}

Write-Step 'INFO' ("Projeto: {0}" -f $projectRoot)
Write-Step 'INFO' ("Preview: v{0}" -f $packageVersion)

$requiredFiles = @(
  'index.html',
  'data\topics.json',
  'data\search-index.json',
  'data\package.json',
  'sitemap.xml',
  'assets\css\base.css',
  'assets\js\app.js',
  'assets\vendor\mermaid-11.17.2.min.js',
  'assets\vendor\highlight-11.12.0.min.js'
)
$requiredFiles += @(1..35 | ForEach-Object { 'topicos\t{0:D2}\index.html' -f $_ })
$missingFiles = @($requiredFiles | Where-Object { -not (Test-Path (Join-Path $siteRoot $_)) })
if ($missingFiles.Count -gt 0) {
  throw ('Pacote incompleto. Ausente(s): ' + ($missingFiles -join ', '))
}
Write-Step 'PASS' 'Estrutura minima do pacote validada.'

# Reuse an already-running instance only when it is this exact package and root.
if (Test-Path $stateFile) {
  try {
    $state = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
    $statePid = [int]$state.pid
    $statePort = [int]$state.port
    if (($state.version -eq $packageVersion) -and ($state.project_root -eq $projectRoot) -and ($state.site_root -eq $siteRoot) -and (Get-Process -Id $statePid -ErrorAction SilentlyContinue) -and (Test-ExpectedPreview $statePort)) {
      $existingUrl = "http://localhost:$statePort/"
      Write-Step 'PASS' ("Preview ja estava ativo na porta {0}." -f $statePort)
      if (-not $NoBrowser) { Start-Process $existingUrl }
      exit 0
    }
    Stop-OwnedProcess $statePid
  } catch {}
}

# Clean only previews whose command line names this exact project root and server.
Write-Step 'INFO' 'Limpando previews antigos deste projeto...'
try {
  $familyProcesses = Get-CimInstance Win32_Process -ErrorAction Stop | Where-Object {
    $_.ProcessId -ne $PID -and
    $_.CommandLine -and
    ($_.CommandLine -match [regex]::Escape($projectRoot)) -and
    ($_.CommandLine -match 'static-runtime[\\/](serve\.py|serve\.ps1)')
  }
  foreach ($fp in $familyProcesses) {
    Stop-Process -Id ([int]$fp.ProcessId) -Force -ErrorAction SilentlyContinue
  }
  if ($familyProcesses) { Start-Sleep -Milliseconds 250 }
} catch {
  Write-Step 'WARN' 'Nao foi possivel enumerar todos os previews antigos; a selecao de porta continua protegida.'
}

Remove-Item $stateFile, $pidFile, $portFile -Force -ErrorAction SilentlyContinue
Remove-Item $stdoutLog, $stderrLog -Force -ErrorAction SilentlyContinue

$port = $null
foreach ($candidate in 8826..8835) {
  if (Test-PortAvailable $candidate) { $port = $candidate; break }
}
if ($null -eq $port) { throw 'Nenhuma porta livre encontrada entre 8826 e 8835.' }
Write-Step 'INFO' ("Porta selecionada: {0}" -f $port)

$pythonLauncher = $null
$pythonPrefix = @()
if (Get-Command py -ErrorAction SilentlyContinue) {
  $pythonLauncher = 'py'
  $pythonPrefix = @('-3')
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
  $pythonLauncher = 'python'
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
  $pythonLauncher = 'python3'
}

$process = $null
$engine = $null
if ($pythonLauncher) {
  $engine = 'python'
  $serverScript = Join-Path $PSScriptRoot 'serve.py'
  $arguments = @($pythonPrefix + @(
    "`"$serverScript`"",
    '--port', "$port",
    '--bind', '127.0.0.1',
    '--directory', "`"$siteRoot`"",
    '--package-version', $packageVersion
  ))
  Write-Step 'INFO' ("Motor HTTP: Python ({0})." -f $pythonLauncher)
  $process = Start-Process -FilePath $pythonLauncher -ArgumentList $arguments -WorkingDirectory $siteRoot -WindowStyle Hidden -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog -PassThru
} else {
  $engine = 'powershell'
  $serverScript = Join-Path $PSScriptRoot 'serve.ps1'
  Write-Step 'INFO' 'Python nao encontrado; usando servidor PowerShell nativo.'
  $arguments = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', "`"$serverScript`"",
    '-Port', "$port",
    '-Root', "`"$siteRoot`"",
    '-PackageVersion', $packageVersion
  )
  $process = Start-Process -FilePath 'powershell.exe' -ArgumentList $arguments -WorkingDirectory $siteRoot -WindowStyle Hidden -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog -PassThru
}

Write-Step 'INFO' ("Servidor iniciado em segundo plano. PID {0}." -f $process.Id)

$verified = $false
for ($attempt = 1; $attempt -le 16; $attempt++) {
  Start-Sleep -Milliseconds 200
  $process.Refresh()
  if ($process.HasExited) { break }
  if (Test-ExpectedPreview $port) {
    $verified = $true
    break
  }
  if ($script:LastVerificationFailures.Count -gt 0) {
    Write-Step 'WARN' ('Tentativa de autoverificacao: ' + ($script:LastVerificationFailures -join '; '))
  }
}

if (-not $verified) {
  if ($process -and -not $process.HasExited) {
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  }
  if ($script:LastVerificationFailures -and $script:LastVerificationFailures.Count -gt 0) {
    Write-Step 'FAIL' ('Autoverificacao: ' + ($script:LastVerificationFailures -join '; '))
  }
  $stderrTail = if (Test-Path $stderrLog) { (Get-Content $stderrLog -Tail 8 -ErrorAction SilentlyContinue) -join [Environment]::NewLine } else { '' }
  if ($stderrTail) { Write-Host $stderrTail }
  throw 'Falha de autoverificacao do preview. Consulte os itens [FAIL] acima e .runtime\server.stderr.log.'
}

$state = [ordered]@{
  version = $packageVersion
  project_root = $projectRoot
  site_root = $siteRoot
  pid = $process.Id
  port = $port
  engine = $engine
  started_at = (Get-Date).ToString('o')
  home = "http://localhost:$port/"
}
$state | ConvertTo-Json | Set-Content -LiteralPath $stateFile -Encoding UTF8
$process.Id | Set-Content -LiteralPath $pidFile -Encoding ASCII
$port | Set-Content -LiteralPath $portFile -Encoding ASCII

Write-Step 'PASS' 'Autoverificacao HTTP concluida.'
Write-Step 'PASS' 'Home, T01-T35, dados e assets validados; cache desativado.'
Write-Step 'PASS' ("Runtime registrado em .runtime\server.json ({0})." -f $engine)

$homeUrl = "http://localhost:$port/"
Write-Step 'PASS' ("Home: {0}" -f $homeUrl)
if (-not $NoBrowser) { Start-Process $homeUrl }
exit 0
