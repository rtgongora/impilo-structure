#!/usr/bin/env bash
set -euo pipefail

echo "▶ Running Wave 3 tests…"
echo "  npx vitest run src/lib/kernel/wave3/__tests__/wave3.test.ts"
npx vitest run src/lib/kernel/wave3/__tests__/wave3.test.ts
echo "✅ Wave 3 tests passed."
