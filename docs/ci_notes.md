# CI / Test Runner Notes

## Why not `npm test`?

`package.json` is treated as **read-only** in the Lovable Cloud build environment.
Custom `scripts` entries cannot be added or modified by the AI agent, so we cannot
guarantee `npm test` maps to the correct vitest invocation.

To keep CI deterministic and self-contained, we provide **repo-local wrapper scripts**
under `/scripts/` that call `npx vitest run` directly.

## Recommended CI Commands

### Bash (Linux / macOS / GitHub Actions)

```bash
# All tests
bash scripts/test-all.sh

# Wave 3 only
bash scripts/test-wave3.sh

# Wave 4 only
bash scripts/test-wave4.sh
```

### PowerShell (Windows / Azure DevOps)

```powershell
# All tests
pwsh scripts/test-all.ps1

# Wave 3 only
pwsh scripts/test-wave3.ps1

# Wave 4 only
pwsh scripts/test-wave4.ps1
```

### Direct npx (any OS)

```bash
npx vitest run                                                    # all
npx vitest run src/lib/kernel/wave3/__tests__/wave3.test.ts       # wave 3
npx vitest run src/lib/kernel/wave4/__tests__/wave4.test.ts       # wave 4
```

## Exit Codes

All scripts propagate vitest's exit code. A non-zero exit means at least one test failed.
