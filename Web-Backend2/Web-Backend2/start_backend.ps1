$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

$codexPython = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

if (Test-Path $codexPython) {
  $python = $codexPython
} else {
  $python = "python"
}

Write-Host "Starting Indoor Navigation API at http://127.0.0.1:8000"
Write-Host "Keep this window open while using the React web app."
& $python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
