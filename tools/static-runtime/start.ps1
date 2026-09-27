$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$packageManifest = Join-Path $projectRoot 'data\package.json'
if (-not (Test-Path -LiteralPath $packageManifest)) { throw 'Manifesto data\package.json ausente.' }
$packageVersion = [string]((Get-Content -LiteralPath $packageManifest -Raw | ConvertFrom-Json).version)
if ($packageVersion -notmatch '^\d+\.\d+\.\d+$') { throw 'Versao invalida em data\package.json.' }
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

function Test-ExpectedPreview([int]$Port) {
  $script:LastVerificationFailures = @()
  try {
    $topicUrl = "http://127.0.0.1:$Port/topicos/t25/"
    $response = Invoke-WebRequest -UseBasicParsing -Uri $topicUrl -TimeoutSec 2
    $html = [string]$response.Content
    $cacheHeader = [string]$response.Headers['Cache-Control']
    $packageHeader = [string]$response.Headers['X-Filomatia-Package']

    $homeResponse = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$Port/" -TimeoutSec 2
    $homeHtml = [string]$homeResponse.Content

    $topicScriptResponse = Invoke-WebRequest -UseBasicParsing -Uri ("http://127.0.0.1:{0}/assets/js/topic.js?v={1}" -f $Port, $packageVersion) -TimeoutSec 2
    $topicScript = [string]$topicScriptResponse.Content

    $appScriptResponse = Invoke-WebRequest -UseBasicParsing -Uri ("http://127.0.0.1:{0}/assets/js/app.js?v={1}" -f $Port, $packageVersion) -TimeoutSec 2
    $appScript = [string]$appScriptResponse.Content

    $mermaidLoaderResponse = Invoke-WebRequest -UseBasicParsing -Uri ("http://127.0.0.1:{0}/assets/js/mermaid-loader.js?v={1}" -f $Port, $packageVersion) -TimeoutSec 2
    $mermaidLoader = [string]$mermaidLoaderResponse.Content

    $codeCssResponse = Invoke-WebRequest -UseBasicParsing -Uri ("http://127.0.0.1:{0}/assets/css/code.css?v={1}" -f $Port, $packageVersion) -TimeoutSec 2
    $codeCss = [string]$codeCssResponse.Content

    $topicCssResponse = Invoke-WebRequest -UseBasicParsing -Uri ("http://127.0.0.1:{0}/assets/css/topic.css?v={1}" -f $Port, $packageVersion) -TimeoutSec 2
    $topicCss = [string]$topicCssResponse.Content

    $homeCssResponse = Invoke-WebRequest -UseBasicParsing -Uri ("http://127.0.0.1:{0}/assets/css/home.css?v={1}" -f $Port, $packageVersion) -TimeoutSec 2
    $homeCss = [string]$homeCssResponse.Content

    $faviconResponse = Invoke-WebRequest -UseBasicParsing -Uri ("http://127.0.0.1:{0}/assets/img/favicon.svg?v={1}" -f $Port, $packageVersion) -TimeoutSec 2
    $faviconSvg = [string]$faviconResponse.Content

    $iconCount = ([regex]::Matches($html, 'class="lab-panel-icon"')).Count
    $flowCount = ([regex]::Matches($html, 'activity-flow')).Count
    $escapedPackageVersion = [regex]::Escape($packageVersion)

    $checks = [ordered]@{
      'cabecalho X-Filomatia-Package' = ($packageHeader -eq $packageVersion)
      '88 SVGs dos LABs' = ($iconCount -eq 88)
      'fluxo antigo ausente' = ($flowCount -eq 0)
      'topic.css corresponde ao pacote' = ($html -match ("topic\.css\?v={0}" -f $escapedPackageVersion))
      'code.css corresponde ao pacote' = ($html -match ("code\.css\?v={0}" -f $escapedPackageVersion))
      'app.js corresponde ao pacote' = ($html -match ("app\.js\?v={0}" -f $escapedPackageVersion))
      'Mermaid markup presente' = ($html -match 'class="mermaid-figure"')
      'app inicializa Mermaid' = ($appScript -match 'initMermaid')
      'app inicializa blocos de codigo' = ($appScript -match 'initCodeBlocks')
      'Mermaid loader renderiza SVG' = ($mermaidLoader -match 'host\.innerHTML=rendered\.svg')
      'degrade dos blocos de codigo presente' = ($codeCss -match 'show-fade')
      'hierarquia tipografica das abas T25' = ($topicCss -match '\.tab-panel>h2\.chapter-title')
      'scrollspy usa documentTop' = ($topicScript -match 'documentTop')
      'scrollspy nao usa offsetTop' = ($topicScript -notmatch '\.offsetTop')
      'home.css corresponde ao pacote' = ($homeHtml -match ("home\.css\?v={0}" -f $escapedPackageVersion))
      'home.js corresponde ao pacote' = ($homeHtml -match ("home\.js\?v={0}" -f $escapedPackageVersion))
      'tabs da Home presentes' = ($homeHtml -match 'data-home-tabs')
      'project-cover do Hero presente' = ($homeCss -match 'project-cover-hero\.webp')
      'disclosure Navegacao presente' = ($homeHtml -match 'homeNavToggle')
      'favicon do logo presente' = ($faviconSvg -match 'filomatia-favicon')
      'GitHub no footer presente' = ($homeHtml -match 'diego-ch4m4x\.github\.io')
      'LinkedIn no footer presente' = ($homeHtml -match 'linkedin\.com/in/diegodsl')
      'legenda das quatro linguagens correta' = ($homeHtml -match 'Quatro perspectivas sobre os mesmos fundamentos\.')
      'secao interna Projeto e publicacao ausente' = ($homeHtml -notmatch '09-projeto-e-publicação')
      'secao interna Estado da colecao ausente' = ($homeHtml -notmatch '10-estado-da-coleção')
      'cache HTTP desativado' = ($cacheHeader -match 'no-store')
    }

    $script:LastVerificationFailures = @(
      $checks.GetEnumerator() |
        Where-Object { -not $_.Value } |
        ForEach-Object { [string]$_.Key }
    )

    return ($script:LastVerificationFailures.Count -eq 0)
  } catch {
    $script:LastVerificationFailures = @('erro HTTP: ' + $_.Exception.Message)
    return $false
  }
}

Write-Step 'INFO' ("Projeto: {0}" -f $projectRoot)
Write-Step 'INFO' ("Preview: v{0}" -f $packageVersion)

$requiredFiles = @(
  'index.html',
  'topicos\t25\index.html',
  'data\topics.json',
  'data\search-index.json',
  'data\package.json',
  'assets',
  'tools\static-runtime\serve.py',
  'tools\static-runtime\serve.ps1'
)
$missingFiles = @($requiredFiles | Where-Object { -not (Test-Path (Join-Path $projectRoot $_)) })
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
    if (($state.version -eq $packageVersion) -and ($state.root -eq $projectRoot) -and (Get-Process -Id $statePid -ErrorAction SilentlyContinue) -and (Test-ExpectedPreview $statePort)) {
      $existingUrl = "http://localhost:$statePort/"
      Write-Step 'PASS' ("Preview ja estava ativo na porta {0}." -f $statePort)
      Start-Process $existingUrl
      exit 0
    }
    Stop-OwnedProcess $statePid
  } catch {}
}

# Clean old previews from this project family only. Never kill an unrelated listener.
Write-Step 'INFO' 'Limpando previews antigos desta familia de projeto...'
try {
  $familyProcesses = Get-CimInstance Win32_Process -ErrorAction Stop | Where-Object {
    $_.ProcessId -ne $PID -and
    $_.CommandLine -and
    ($_.CommandLine -match 'LOGICA_HOME_T25_PILOTO_v') -and
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
    '--directory', "`"$projectRoot`"",
    '--package-version', $packageVersion
  ))
  Write-Step 'INFO' ("Motor HTTP: Python ({0})." -f $pythonLauncher)
  $process = Start-Process -FilePath $pythonLauncher -ArgumentList $arguments -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog -PassThru
} else {
  $engine = 'powershell'
  $serverScript = Join-Path $PSScriptRoot 'serve.ps1'
  Write-Step 'INFO' 'Python nao encontrado; usando servidor PowerShell nativo.'
  $arguments = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', "`"$serverScript`"",
    '-Port', "$port",
    '-Root', "`"$projectRoot`"",
    '-PackageVersion', $packageVersion
  )
  $process = Start-Process -FilePath 'powershell.exe' -ArgumentList $arguments -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog -PassThru
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
  root = $projectRoot
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
Write-Step 'PASS' 'T25 preservado; nova Home validada; navegacao/tabs presentes; cache desativado.'
Write-Step 'PASS' ("Runtime registrado em .runtime\server.json ({0})." -f $engine)

$homeUrl = "http://localhost:$port/"
Write-Step 'PASS' ("Home: {0}" -f $homeUrl)
Start-Process $homeUrl
exit 0
