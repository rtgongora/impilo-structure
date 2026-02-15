$ErrorActionPreference = "Stop"

Write-Host "▶ Running ALL kernel tests…"
Write-Host "  npx vitest run"
npx vitest run
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "✅ All tests passed."
