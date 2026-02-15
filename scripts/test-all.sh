#!/usr/bin/env bash
set -euo pipefail

echo "▶ Running ALL kernel tests…"
echo "  npx vitest run"
npx vitest run
echo "✅ All tests passed."
