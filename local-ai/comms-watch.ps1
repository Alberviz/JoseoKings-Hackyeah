# Poll official COMMS for alvaro and print NEW open subjects.
# Usage: powershell -File local-ai/comms-watch.ps1
# Pair with Cursor Lead session: when you see NEW, tell Cursor to read COMMS.

$ErrorActionPreference = "Stop"
$bash = "C:\Program Files\Git\bin\bash.exe"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "comms-watch: polling alvaro every 20s (Ctrl+C to stop)"
$seen = New-Object 'System.Collections.Generic.HashSet[string]'

while ($true) {
  try {
    $out = & $bash -lc "cd /c/Users/Usuario/Projects/Hackaton && scripts/comms.sh open alvaro" 2>&1
    $text = ($out | Out-String)
    $matches = [regex]::Matches($text, '=== ([^\r\n]+)')
    foreach ($m in $matches) {
      $file = $m.Groups[1].Value.Trim()
      if ($seen.Add($file)) {
        $stamp = Get-Date -Format "HH:mm:ss"
        Write-Host "[$stamp] NEW OPEN $file"
        & $bash -lc "cd /c/Users/Usuario/Projects/Hackaton && scripts/comms.sh read $file" 2>&1 | ForEach-Object { Write-Host $_ }
        Write-Host "---- tell Cursor Lead: read COMMS $file ----"
      }
    }
  } catch {
    Write-Host ("comms-watch error: " + $_.Exception.Message)
  }
  Start-Sleep -Seconds 20
}
