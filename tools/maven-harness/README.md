# Impilo vNext — Maven Integration Harness

A standalone Maven/JUnit 5 project that validates Wave 1–8 kernel contracts
against **running services** (local docker-compose or CI).

---

## Prerequisites

| Tool | Version |
|------|---------|
| JDK  | 17+     |
| Maven | 3.9+   |
| Docker + docker-compose | latest |

## Quick Start

### 1. Start the services

```bash
# From the repo root
docker compose up -d          # starts Supabase, Edge Functions, etc.
```

> The default `local` profile assumes Supabase runs on `localhost:54321`.

### 2. Run all tests

```bash
cd tools/maven-harness
mvn test
```

### 3. Run with custom parameters

```bash
mvn test \
  -DtenantId=my-tenant \
  -DfacilityId=my-facility \
  -DbaseUrlTshepo=http://my-host:54321/functions/v1
```

### 4. Run a specific Wave

```bash
# Wave 1 only
mvn test -Dgroups=wave1

# Wave 3 only
mvn test -Dgroups=wave3

# Waves 1+2
mvn test -Dgroups="wave1,wave2"
```

### 5. CI profile

```bash
# Uses env vars: BASE_URL_TSHEPO, BASE_URL_BUTANO, BASE_URL_MSIKA, etc.
mvn test -Pci
```

---

## Directory Structure

```
tools/maven-harness/
├── pom.xml                          # Build config, profiles, dependencies
├── README.md                        # This file
└── src/test/
    ├── java/health/impilo/harness/
    │   ├── HarnessConfig.java       # Centralised config resolution
    │   ├── HttpHelper.java          # HTTP client with v1.1 header injection
    │   ├── FixtureLoader.java       # JSON fixture loader
    │   ├── wave1/
    │   │   └── EventEnvelopeV11IT.java
    │   ├── wave2/
    │   │   └── IdempotencyIT.java
    │   ├── wave3/
    │   │   └── PdpDenyStepUpIT.java
    │   └── wave4/
    │       └── OfflineEntitlementIT.java
    └── resources/
        ├── harness.properties       # Maven-filtered config
        └── fixtures/
            ├── tenants.json
            ├── facilities.json
            ├── workspaces.json
            ├── patients.json         # CPIDs and O-CPIDs
            └── msika_items.json      # Tariffs for idempotency tests
```

## Fixtures

All test data lives in `src/test/resources/fixtures/`. To add data for new
Waves, drop a JSON file there and load it via:

```java
JsonNode data = FixtureLoader.load("my_new_fixture.json");
JsonNode first = FixtureLoader.load("my_new_fixture.json", 0);
```

## Extending for Waves 5–8

1. **Create a new test package** under `health.impilo.harness.wave5` (etc.).
2. **Tag tests** with `@Tag("wave5")` so they can be run selectively.
3. **Add fixtures** for new data shapes (e.g., FHIR bundles, OROS orders).
4. **Add new internal endpoints** under `/v1/internal/*` in Edge Functions if
   you need server-side diagnostic hooks. Keep them behind authentication
   and document in `docs/ci_notes.md`.

## Graceful Skipping

All tests use **graceful skip** when endpoints return 404:

```
[SKIP] Tariff-update endpoint not deployed; skipping idempotency test.
```

This lets you run the full suite even before all Wave endpoints are deployed,
without false failures.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Connection refused` | Ensure `docker compose up -d` is running |
| `401 Unauthorized` | Pass `-DsupabaseAnonKey=...` |
| All tests `[SKIP]` | Internal endpoints not yet deployed |
