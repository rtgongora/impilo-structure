#!/usr/bin/env bash
set -euo pipefail

echo "▶ Running Wave 4 tests…"
echo "  npx vitest run src/lib/kernel/wave4/__tests__/wave4.test.ts"
npx vitest run src/lib/kernel/wave4/__tests__/wave4.test.ts
echo "✅ Wave 4 tests passed."
