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

  # ---- generate local API key file (this machine only, never in the repo) ----
  $cred = Join-Path $env:USERPROFILE '.dsh\.credentials.yaml'
  if (Test-Path $cred) {
    $raw = Get-Content $cred -Raw
    $ds = [regex]::Match($raw, 'DEEPSEEK_API_KEY:\s*(\S+)')
    $kimi = [regex]::Match($raw, 'KIMI_CODING_API_KEY:\s*(\S+)')
    if (-not $kimi.Success) { $kimi = [regex]::Match($raw, 'MOONSHOTAI_CN_API_KEY:\s*(\S+)') }
    $zai = [regex]::Match($raw, 'ZAI_API_KEY:\s*(\S+)')

    # 兼容旧版 neko-ds-key.js
    if ($ds.Success) {
      $keyJs = 'window.__NEKO_DS_KEY__ = "' + $ds.Groups[1].Value + '";'
      [System.IO.File]::WriteAllText((Join-Path $assetsOut 'neko-ds-key.js'), $keyJs, (New-Object System.Text.UTF8Encoding($false)))
    }

    # 多供应商 Key：neko-keys.js
    $parts = @()
    if ($ds.Success) { $parts += '  deepseek: "' + $ds.Groups[1].Value + '"' }
    if ($kimi.Success) { $parts += '  kimi: "' + $kimi.Groups[1].Value + '"' }
    if ($zai.Success) { $parts += '  zai: "' + $zai.Groups[1].Value + '"' }
    $keysJs = "/* 本机部署专用：由 install.ps1 从 ~/.dsh/.credentials.yaml 生成，勿提交到仓库 */`r`nwindow.__NEKO_KEYS__ = {`r`n" + ($parts -join ",`r`n") + "`r`n};`r`n"
    [System.IO.File]::WriteAllText((Join-Path $assetsOut 'neko-keys.js'), $keysJs, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "[OK] local API key files generated (deepseek/kimi/zai)"
  }

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
  if ($html -notmatch 'neko-ds-key\.js') {
    $html = $html.Replace('<script src="/assets/neko-theme.js" defer>', '<script src="/assets/neko-ds-key.js"></script><script src="/assets/neko-keys.js"></script><script src="/assets/neko-theme.js" defer>')
  } elseif ($html -notmatch 'neko-keys\.js') {
    $html = $html.Replace('<script src="/assets/neko-ds-key.js"></script>', '<script src="/assets/neko-ds-key.js"></script><script src="/assets/neko-keys.js"></script>')
  }
  [System.IO.File]::WriteAllText($idxFile, $html, (New-Object System.Text.UTF8Encoding($false)))

  Write-Host "[OK] installed to $root"
}

Write-Host "Done! Hard-refresh the DSH web page (Ctrl+F5)."
Write-Host "Backups: $ScriptDir\backup (use uninstall.ps1 to restore)"
