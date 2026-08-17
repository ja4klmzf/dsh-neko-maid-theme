# Neko Maid Theme for DeepSeek Harness Web GUI - installer
# One-click install: run install.bat, or:
#   powershell -NoProfile -ExecutionPolicy Bypass -File install.ps1
# Manual dist path: install.ps1 -Dist "C:\path\to\dsh-web-frontend\dist"
param([string]$Dist = '')

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AssetsDir = Join-Path $ScriptDir 'assets'

# Auto-detect common DSH web dist locations
$Candidates = @()
$c1 = Join-Path $env:APPDATA 'npm\node_modules\@deepseek-ai\dsh\node_modules\@deepseek-ai\dsh-web-frontend\dist'
$c2 = Join-Path $env:USERPROFILE '.dsh\profiles\node_modules\@deepseek-ai\dsh\node_modules\@deepseek-ai\dsh-web-frontend\dist'
$c3 = Join-Path $env:USERPROFILE '.dsh\profiles\node_modules\@deepseek-ai\dsh-web-frontend\dist'
foreach ($c in @($c1, $c2, $c3)) {
  if (Test-Path (Join-Path $c 'index.html')) { $Candidates += $c }
}
$Candidates = @($Candidates | Select-Object -Unique)

if ($Dist) { $Candidates = @($Dist) }

if ($Candidates.Count -eq 0) {
  Write-Host "[ERROR] No dsh-web-frontend dist found."
  Write-Host "Try:  .\install.ps1 -Dist 'C:\path\to\...\dsh-web-frontend\dist'"
  exit 1
}

foreach ($root in $Candidates) {
  $idxFile = Join-Path $root 'index.html'
  if (-not (Test-Path $idxFile)) {
    Write-Host "[SKIP] no index.html at $root"
    continue
  }
  $assetsOut = Join-Path $root 'assets'
  New-Item -ItemType Directory -Force -Path $assetsOut | Out-Null

  # ---- backup original files ----
  $backupDir = Join-Path $ScriptDir 'backup'
  New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  Copy-Item $idxFile (Join-Path $backupDir "index-$stamp.html.bak") -Force
  if (Test-Path (Join-Path $assetsOut 'override.css')) {
    Copy-Item (Join-Path $assetsOut 'override.css') (Join-Path $backupDir "override-$stamp.css.bak") -Force
  }

  # ---- copy skin assets (flat into dist/assets) ----
  Copy-Item (Join-Path $AssetsDir '*') $assetsOut -Force

  # ---- patch index.html ----
  $html = [System.IO.File]::ReadAllText($idxFile)
  $m = [regex]::Match($html, 'override\.css\?v=(\d+)')
  if ($m.Success) {
    $newV = [int]$m.Groups[1].Value + 1
    $html = $html.Replace($m.Value, "override.css?v=$newV")
  } elseif ($html -notmatch 'override\.css') {
    $html = $html.Replace('</head>', '<link rel="stylesheet" href="/assets/override.css?v=1"></head>')
  }
  if ($html -notmatch 'neko-theme\.js') {
    $html = $html.Replace('</body>', '<script src="/assets/neko-theme.js" defer></script></body>')
  }
  [System.IO.File]::WriteAllText($idxFile, $html, (New-Object System.Text.UTF8Encoding($false)))

  Write-Host "[OK] installed to $root"
}

Write-Host "Done! Hard-refresh the DSH web page (Ctrl+F5)."
Write-Host "Backups: $ScriptDir\backup (use uninstall.ps1 to restore)"
