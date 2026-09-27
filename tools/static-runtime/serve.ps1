param(
  [Parameter(Mandatory = $true)][int]$Port,
  [Parameter(Mandatory = $true)][string]$Root,
  [Parameter(Mandatory = $true)][string]$PackageVersion
)

$ErrorActionPreference = 'Stop'

function Get-ContentType([string]$Path) {
  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    '.html'  { return 'text/html; charset=utf-8' }
    '.htm'   { return 'text/html; charset=utf-8' }
    '.css'   { return 'text/css; charset=utf-8' }
    '.js'    { return 'application/javascript; charset=utf-8' }
    '.mjs'   { return 'application/javascript; charset=utf-8' }
    '.json'  { return 'application/json; charset=utf-8' }
    '.svg'   { return 'image/svg+xml' }
    '.png'   { return 'image/png' }
    '.jpg'   { return 'image/jpeg' }
    '.jpeg'  { return 'image/jpeg' }
    '.gif'   { return 'image/gif' }
    '.webp'  { return 'image/webp' }
    '.ico'   { return 'image/x-icon' }
    '.txt'   { return 'text/plain; charset=utf-8' }
    '.md'    { return 'text/markdown; charset=utf-8' }
    '.map'   { return 'application/json; charset=utf-8' }
    '.xml'   { return 'application/xml; charset=utf-8' }
    '.woff'  { return 'font/woff' }
    '.woff2' { return 'font/woff2' }
    '.ttf'   { return 'font/ttf' }
    '.otf'   { return 'font/otf' }
    '.eot'   { return 'application/vnd.ms-fontobject' }
    '.wasm'  { return 'application/wasm' }
    default  { return 'application/octet-stream' }
  }
}

function Send-Response {
  param(
    [System.IO.Stream]$Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [byte[]]$Body,
    [string]$ContentType,
    [bool]$HeadOnly = $false
  )

  if ($null -eq $Body) { $Body = [byte[]]::new(0) }
  if ([string]::IsNullOrWhiteSpace($ContentType)) { $ContentType = 'application/octet-stream' }

  $headers = @(
    ("HTTP/1.1 {0} {1}" -f $StatusCode, $StatusText),
    ("Content-Type: {0}" -f $ContentType),
    ("Content-Length: {0}" -f $Body.Length),
    'Cache-Control: no-store, no-cache, must-revalidate, max-age=0',
    'Pragma: no-cache',
    'Expires: 0',
    ("X-Filomatia-Package: {0}" -f $PackageVersion),
    'X-Content-Type-Options: nosniff',
    'Connection: close',
    '',
    ''
  ) -join "`r`n"

  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if (-not $HeadOnly -and $Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
  $Stream.Flush()
}

$rootPath = [System.IO.Path]::GetFullPath($Root)
if (-not $rootPath.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
  $rootPath += [System.IO.Path]::DirectorySeparatorChar
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Server.SetSocketOption(
  [System.Net.Sockets.SocketOptionLevel]::Socket,
  [System.Net.Sockets.SocketOptionName]::ReuseAddress,
  $true
)
$listener.Start()
Write-Output ("Filomatia preview PowerShell fallback: {0} -> http://127.0.0.1:{1}/ (package {2})" -f $rootPath, $Port, $PackageVersion)

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    $stream = $null
    $reader = $null
    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 8192, $true)
      $requestLine = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($requestLine)) {
        Send-Response -Stream $stream -StatusCode 400 -StatusText 'Bad Request' -Body ([System.Text.Encoding]::UTF8.GetBytes('400')) -ContentType 'text/plain; charset=utf-8'
        continue
      }

      while ($true) {
        $headerLine = $reader.ReadLine()
        if ($null -eq $headerLine -or $headerLine -eq '') { break }
      }

      $parts = $requestLine.Split(' ')
      if ($parts.Length -lt 2) {
        Send-Response -Stream $stream -StatusCode 400 -StatusText 'Bad Request' -Body ([System.Text.Encoding]::UTF8.GetBytes('400')) -ContentType 'text/plain; charset=utf-8'
        continue
      }

      $method = $parts[0].ToUpperInvariant()
      if ($method -ne 'GET' -and $method -ne 'HEAD') {
        Send-Response -Stream $stream -StatusCode 405 -StatusText 'Method Not Allowed' -Body ([System.Text.Encoding]::UTF8.GetBytes('405')) -ContentType 'text/plain; charset=utf-8'
        continue
      }

      $rawTarget = $parts[1].Split('?')[0]
      $decoded = [Uri]::UnescapeDataString($rawTarget).TrimStart('/') -replace '/', '\'
      if ([string]::IsNullOrWhiteSpace($decoded)) { $decoded = 'index.html' }

      $candidate = [System.IO.Path]::GetFullPath((Join-Path $rootPath $decoded))
      if (-not $candidate.StartsWith($rootPath, [StringComparison]::OrdinalIgnoreCase)) {
        Send-Response -Stream $stream -StatusCode 403 -StatusText 'Forbidden' -Body ([System.Text.Encoding]::UTF8.GetBytes('403')) -ContentType 'text/plain; charset=utf-8'
        continue
      }

      if ([System.IO.Directory]::Exists($candidate)) {
        $candidate = Join-Path $candidate 'index.html'
      }

      if (-not [System.IO.File]::Exists($candidate)) {
        Send-Response -Stream $stream -StatusCode 404 -StatusText 'Not Found' -Body ([System.Text.Encoding]::UTF8.GetBytes('404')) -ContentType 'text/plain; charset=utf-8'
        continue
      }

      $body = [System.IO.File]::ReadAllBytes($candidate)
      Send-Response -Stream $stream -StatusCode 200 -StatusText 'OK' -Body $body -ContentType (Get-ContentType $candidate) -HeadOnly ($method -eq 'HEAD')
    }
    catch {
      if ($stream) {
        try {
          Send-Response -Stream $stream -StatusCode 500 -StatusText 'Internal Server Error' -Body ([System.Text.Encoding]::UTF8.GetBytes('500')) -ContentType 'text/plain; charset=utf-8'
        } catch {}
      }
    }
    finally {
      try { if ($reader) { $reader.Dispose() } } catch {}
      try { if ($stream) { $stream.Dispose() } } catch {}
      try { $client.Close() } catch {}
    }
  }
}
finally {
  try { $listener.Stop() } catch {}
}
