# ZIBO v1.1 — Terminology Service Contract Artifacts

## 1. Endpoint Contracts

### Artifact Lifecycle
| Method | Path | Input | Output |
|--------|------|-------|--------|
| POST | `/v1/artifacts/draft` | `{ fhir_type, canonical_url, version, content_json, tenant_id? }` | Artifact |
| PUT | `/v1/artifacts/draft/{id}` | `{ content_json, fhir_type?, canonical_url?, version? }` | Artifact (DRAFT only) |
| POST | `/v1/artifacts/{id}/publish` | – | Artifact (DRAFT→PUBLISHED) |
| POST | `/v1/artifacts/{id}/deprecate` | – | Artifact (PUBLISHED→DEPRECATED) |
| POST | `/v1/artifacts/{id}/retire` | – | Artifact (DEPRECATED→RETIRED) |
| GET | `/v1/artifacts/by-canonical` | `?canonical_url=&version=&tenant_scope=` | Artifact \| null |
| GET | `/v1/artifacts` | `?status=&tenant_id=` | `{ artifacts: Artifact[] }` |

### Import/Export
| Method | Path | Input | Output |
|--------|------|-------|--------|
| POST | `/v1/import/fhir-bundle` | FHIR Bundle JSON | `{ imported, results }` |
| POST | `/v1/import/csv-codelist` | `{ name, system_url, version, codes[], create_valueset? }` | `{ code_system, value_set, codes_count }` |
| GET | `/v1/export/pack` | `?pack_id=&version=&tenant_id=` | FHIR Bundle JSON |

### Packs
| Method | Path | Input | Output |
|--------|------|-------|--------|
| POST | `/v1/packs/draft` | `{ pack_id, name, version, tenant_id?, manifest_json? }` | Pack |
| PUT | `/v1/packs/draft/{pack_id}/{version}` | `{ name?, manifest_json?, artifact_ids? }` | Pack |
| POST | `/v1/packs/{pack_id}/{version}/publish` | `{ tenant_id? }` | Pack |
| POST | `/v1/packs/{pack_id}/{version}/deprecate` | `{ tenant_id? }` | Pack |
| GET | `/v1/packs/list` | `?tenant_id=&status=` | `{ packs: Pack[] }` |

### Assignments
| Method | Path | Input | Output |
|--------|------|-------|--------|
| POST | `/v1/assignments` | `{ scope_type, scope_id, pack_id, pack_version, policy_mode }` | Assignment |
| GET | `/v1/assignments/effective` | `?tenant_id=&facility_id=&workspace_id=` | `{ policy_mode, packs[], resolved_from }` |
| GET | `/v1/assignments` | `?tenant_id=` | `{ assignments: Assignment[] }` |

### Validation
| Method | Path | Input | Output |
|--------|------|-------|--------|
| POST | `/v1/validate/coding` | `{ coding: {system,code,display?}, context?, requested_mode? }` | `{ valid, mode, unvalidated?, issues[], suggested_mappings[] }` |
| POST | `/v1/validate/resource` | `{ resource, context? }` | `{ total_codings, issues[], summary }` |
| POST | `/v1/validate/job` | `{ payload_json, tenant_id?, facility_id?, requested_policy_mode? }` | ValidationJob |
| GET | `/v1/validate/job/{job_id}` | – | ValidationJob |

### Mapping
| Method | Path | Input | Output |
|--------|------|-------|--------|
| POST | `/v1/map` | `{ source_system, source_code, target_system? }` | `{ found, best_match?, mappings[] }` |

### Logs
| Method | Path | Input | Output |
|--------|------|-------|--------|
| GET | `/v1/logs` | `?tenant_id=&facility_id=&service_name=&limit=` | `{ logs: ValidationLog[] }` |

## 2. Mandatory Headers (TSHEPO Contract)
| Header | Required | Description |
|--------|----------|-------------|
| `X-Tenant-Id` | ✅ | Tenant context |
| `X-Correlation-Id` | ✅ | Trace ID |
| `X-Actor-Id` | ✅ | Authenticated user/service |
| `X-Actor-Type` | ✅ | provider\|patient\|system\|service |
| `X-Purpose-Of-Use` | ✅ | treatment\|operations\|etc |
| `X-Device-Fingerprint` | ✅ | Device identifier |
| `X-Facility-Id` | Context | Current facility |
| `X-Workspace-Id` | Context | Current workspace |

## 3. JSON Schemas

### Artifact
```json
{
  "id": "uuid",
  "tenant_id": "NATIONAL|<tenant>",
  "fhir_type": "CodeSystem|ValueSet|ConceptMap|...",
  "canonical_url": "string",
  "version": "string",
  "status": "DRAFT|PUBLISHED|DEPRECATED|RETIRED",
  "content_json": {},
  "hash": "string",
  "created_by_actor_id": "string",
  "created_at": "timestamptz"
}
```

### Pack
```json
{
  "pack_id": "string",
  "tenant_id": "NATIONAL|<tenant>",
  "name": "string",
  "version": "string",
  "status": "DRAFT|PUBLISHED|DEPRECATED|RETIRED",
  "manifest_json": {},
  "created_at": "timestamptz"
}
```

### Assignment
```json
{
  "id": "uuid",
  "tenant_id": "string",
  "scope_type": "TENANT|FACILITY|WORKSPACE",
  "scope_id": "string",
  "pack_tenant_id": "NATIONAL|<tenant>",
  "pack_id": "string",
  "pack_version": "string",
  "policy_mode": "STRICT|LENIENT",
  "created_at": "timestamptz"
}
```

### ValidateCodingRequest
```json
{
  "coding": { "system": "string", "code": "string", "display": "string?" },
  "context": { "tenant_id?": "", "facility_id?": "", "workspace_id?": "", "service_name?": "" },
  "requested_mode": "STRICT|LENIENT?"
}
```

### ValidateCodingResponse
```json
{
  "valid": "boolean",
  "mode": "STRICT|LENIENT",
  "unvalidated": "boolean?",
  "issues": [{ "code": "UNKNOWN_CODE", "severity": "ERROR|WARN", "message": "string" }],
  "suggested_mappings": [{ "target_system": "", "target_code": "", "confidence": 0.8 }]
}
```

### MapRequest/Response
```json
// Request
{ "source_system": "", "source_code": "", "target_system?": "" }
// Response
{ "found": true, "best_match": { "target_system": "", "target_code": "", "confidence": 1.0 }, "mappings": [] }
```

### Standard Error Envelope
```json
{
  "error": {
    "code": "MISSING_REQUIRED_HEADER|IMMUTABLE|INVALID_TRANSITION|STEP_UP_REQUIRED|...",
    "message": "string",
    "details": {}
  }
}
```

### STEP_UP_REQUIRED (403)
```json
{
  "error": {
    "code": "STEP_UP_REQUIRED",
    "message": "Step-up authentication required",
    "details": {
      "next": { "method": "OIDC_STEP_UP", "reason": "HIGH_RISK_ACTION" }
    }
  }
}
```

## 4. Policy Resolution Order
1. WORKSPACE assignment (if workspace_id provided)
2. FACILITY assignment (if facility_id provided)
3. TENANT assignment
4. Fallback: NATIONAL default + LENIENT

## 5. Immutability Rules
- DRAFT: editable
- PUBLISHED: immutable content_json, can transition to DEPRECATED
- DEPRECATED: immutable, can transition to RETIRED
- RETIRED: immutable, terminal state
