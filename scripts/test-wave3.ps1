$ErrorActionPreference = "Stop"

Write-Host "▶ Running Wave 3 tests…"
Write-Host "  npx vitest run src/lib/kernel/wave3/__tests__/wave3.test.ts"
npx vitest run src/lib/kernel/wave3/__tests__/wave3.test.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "✅ Wave 3 tests passed."
