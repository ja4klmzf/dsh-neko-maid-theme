# Neko Maid Theme - uninstaller
# Restores the newest index.html / override.css backup and removes skin files.
param([string]$Dist = '')

$ErrorActionPreference = 'Continue'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackupDir = Join-Path $ScriptDir 'backup'

$Candidates = @()
$c1 = Join-Path $env:APPDATA 'npm\node_modules\@deepseek-ai\dsh\node_modules\@deepseek-ai\dsh-web-frontend\dist'
$c2 = Join-Path $env:USERPROFILE '.dsh\profiles\node_modules\@deepseek-ai\dsh\node_modules\@deepseek-ai\dsh-web-frontend\dist'
$c3 = Join-Path $env:USERPROFILE '.dsh\profiles\node_modules\@deepseek-ai\dsh-web-frontend\dist'
foreach ($c in @($c1, $c2, $c3)) {
  if (Test-Path (Join-Path $c 'index.html')) { $Candidates += $c }
}
$Candidates = @($Candidates | Select-Object -Unique)
if ($Dist) { $Candidates = @($Dist) }

$skinFiles = @(
  'override.css', 'neko-theme.js',
  'neko-bg-day.jpg', 'neko-bg-night.jpg',
  'neko-pet-lace.svg', 'neko-pet-lace-day.svg',
  'neko-pet-avatar.png', 'neko-pet-pat.png', 'neko-pet-feed.png',
  'neko-pet-kiss.png', 'neko-pet-proud.png', 'neko-pet-pout.png',
  'neko-pet-sleep.png', 'neko-pet-watch.png', 'neko-pet-think.png',
  'neko-pet-tea.png', 'neko-pet-search.png', 'neko-pet-edit.png',
  'neko-pet-pwsh.png', 'neko-pet-chin.png', 'neko-pet-tail.png',
  'neko-pet-jealous.png', 'neko-ds-key.js'
)

$idxBak = Get-ChildItem $BackupDir -Filter 'index-*.html.bak' -ErrorAction SilentlyContinue |
  Sort-Object Name -Descending | Select-Object -First 1
$cssBak = Get-ChildItem $BackupDir -Filter 'override-*.css.bak' -ErrorAction SilentlyContinue |
  Sort-Object Name -Descending | Select-Object -First 1

foreach ($root in $Candidates) {
  $idxFile = Join-Path $root 'index.html'
  if (-not (Test-Path $idxFile)) { Write-Host "[SKIP] $root"; continue }
  if ($idxBak) {
    Copy-Item $idxBak.FullName $idxFile -Force
    Write-Host "[OK] restored index.html from $($idxBak.Name)"
  } else {
    # fallback: strip skin references from current index.html
    $html = [System.IO.File]::ReadAllText($idxFile)
    $html = [regex]::Replace($html, '<link rel="stylesheet" href="/assets/override\.css[^"]*">\s*', '')
    $html = [regex]::Replace($html, '<script src="/assets/neko-theme\.js"[^>]*></script>\s*', '')
    $html = [regex]::Replace($html, '<script src="/assets/neko-ds-key\.js"[^>]*></script>\s*', '')
    [System.IO.File]::WriteAllText($idxFile, $html, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "[OK] stripped skin references (no backup found)"
  }
  if ($cssBak) {
    Copy-Item $cssBak.FullName (Join-Path $root 'assets\override.css') -Force
    Write-Host "[OK] restored override.css from $($cssBak.Name)"
  }
  foreach ($f in $skinFiles) {
    $p = Join-Path $root "assets\$f"
    if (Test-Path $p) { Remove-Item $p -Force }
  }
  Write-Host "[OK] cleaned skin files at $root"
}
Write-Host "Uninstall done."
