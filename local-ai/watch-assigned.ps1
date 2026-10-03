# Watches local-ai/ASSIGNED.md and BUS.md. Prints a line when they change.
# Usage: powershell -File local-ai/watch-assigned.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }
Set-Location $root

$files = @(
  (Join-Path $root "local-ai\ASSIGNED.md"),
  (Join-Path $root "local-ai\BUS.md")
)

Write-Host "watch-assigned: monitoring ASSIGNED.md + BUS.md (Ctrl+C to stop)"
Write-Host "agy: when you see CHANGED, re-read ASSIGNED.md and act if status is GO"

$last = @{}
foreach ($f in $files) {
  if (Test-Path $f) {
    $last[$f] = (Get-Item $f).LastWriteTimeUtc.Ticks
  }
}

while ($true) {
  Start-Sleep -Seconds 5
  foreach ($f in $files) {
    if (-not (Test-Path $f)) { continue }
    $ticks = (Get-Item $f).LastWriteTimeUtc.Ticks
    if (-not $last.ContainsKey($f) -or $ticks -ne $last[$f]) {
      $last[$f] = $ticks
      $name = Split-Path $f -Leaf
      $stamp = Get-Date -Format "HH:mm:ss"
      Write-Host "[$stamp] CHANGED $name - re-read local-ai/ASSIGNED.md"
      if ($name -eq "ASSIGNED.md") {
        Get-Content -Path $f | Where-Object { $_ -match "^(status|slice|task):" } | ForEach-Object {
          Write-Host ("  " + $_)
        }
      }
    }
  }
}
