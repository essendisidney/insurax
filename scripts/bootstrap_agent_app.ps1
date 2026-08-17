# Bootstrap Tamin Flutter agent app (generates android/ios/web if missing).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$app = Join-Path $root "agent_app"

if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
  Write-Host "Flutter SDK not found on PATH."
  Write-Host "Install from https://docs.flutter.dev/get-started/install then re-run."
  exit 1
}

Set-Location $app

if (-not (Test-Path (Join-Path $app "android"))) {
  Write-Host "Generating Flutter platform folders..."
  flutter create . --project-name tamin_agent --org africa.tamin
}

flutter pub get
Write-Host "Ready. Run: flutter run"
