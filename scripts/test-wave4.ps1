$ErrorActionPreference = "Stop"

Write-Host "▶ Running Wave 4 tests…"
Write-Host "  npx vitest run src/lib/kernel/wave4/__tests__/wave4.test.ts"
npx vitest run src/lib/kernel/wave4/__tests__/wave4.test.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "✅ Wave 4 tests passed."
