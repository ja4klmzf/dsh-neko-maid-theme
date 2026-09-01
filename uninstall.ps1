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

$petNames = @('avatar','pat','feed','kiss','proud','pout','sleep','watch','think','tea','search','edit','pwsh','chin','tail','jealous')
$skinFiles = @(
  'override.css', 'neko-theme.js',
  'neko-bg-day.webp', 'neko-bg-night.webp', 'neko-bg-day.jpg', 'neko-bg-night.jpg',
  'neko-pet-lace.svg', 'neko-pet-lace-day.svg', 'neko-ds-key.js', 'neko-keys.js'
)
foreach ($n in $petNames) { $skinFiles += "neko-pet-$n.webp"; $skinFiles += "neko-pet-$n.png" }

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
    $html = [regex]::Replace($html, '<script src="/assets/neko-keys\.js"[^>]*></script>\s*', '')
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
