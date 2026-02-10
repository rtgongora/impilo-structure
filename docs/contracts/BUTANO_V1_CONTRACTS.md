# BUTANO v1.1 — API Contract Specification

## Overview
BUTANO is the national Shared Health Record (SHR) storing longitudinal clinical data in HL7 FHIR R4 shape. **PII-free**: no names, phone numbers, addresses, national IDs. CPID only for patient identity.

## Mandatory Headers (TSHEPO-gated)
| Header | Required | Description |
|--------|----------|-------------|
| X-Tenant-Id | ✅ | Tenant isolation |
| X-Correlation-Id | ✅ | Request chain tracking |
| X-Device-Fingerprint | ✅ | Device identity |
| X-Purpose-Of-Use | ✅ | Access purpose |
| X-Actor-Id | ✅ | Acting subject |
| X-Actor-Type | ✅ | Actor classification |
| X-Facility-Id | Context | Facility scope |
| X-Workspace-Id | Context | Workspace scope |
| X-Shift-Id | Context | Shift scope |
| X-Decision-Id | Optional | TSHEPO decision ref |
| X-Break-Glass | Optional | Emergency access |
| X-Consent-Decision | Optional | Consent pass-through |

## PII Policy
### Forbidden Fields (hard reject at write time)
- `Patient.name`, `Patient.telecom`, `Patient.address`
- National IDs, phone numbers, emails
- Portal identifiers or human-friendly identifiers

### Subject Identity Rule
All clinical resources must reference CPID or O-CPID only.
Patient resource allowed only with: `Patient.identifier = [{ system: ".../cpid", value: "<CPID>" }]`

## FHIR-ish Endpoints
```
POST   /fhir/{resourceType}           Create resource
PUT    /fhir/{resourceType}/{id}      Update resource  
GET    /fhir/{resourceType}/{id}      Read resource
GET    /fhir/{resourceType}?subject={CPID}  Search
```

### Supported Resource Types
Encounter, Condition, AllergyIntolerance, MedicationRequest, MedicationStatement, Observation, DiagnosticReport, Procedure, Immunization, CarePlan, ServiceRequest, DocumentReference, Binary, Appointment, ImagingStudy

## Custom Endpoints

### GET /v1/summary/ips/{cpid}
Returns IPS bundle with sections: allergies, problems, medications, immunizations, vitals, labs, procedures, carePlans

### GET /v1/summary/visit/{encounterId}
Returns encounter-scoped clinical bundle

### GET /v1/timeline/{cpid}?since=&type=&page=
Paged timeline items sorted by last_updated_at desc

### POST /v1/internal/reconcile-subject
```json
{ "from_ocpid": "O-CPID-ABC123", "to_cpid": "CPID-12345" }
```
Rewrites subject_cpid, clears provisional flag, preserves audit stamps.

### GET /v1/internal/stats
Resource counts per type + last updated timestamps

### GET /v1/internal/health/tenants
Diagnostic tenant list

### GET /v1/internal/reconciliation/queue
List reconciliation jobs

### GET /v1/internal/pii-violations
List PII violation events

## Error Envelope
```json
{
  "error": {
    "code": "PII_VIOLATION",
    "message": "Payload contains prohibited PII fields",
    "details": {},
    "request_id": "uuid",
    "correlation_id": "uuid"
  }
}
```

## ZIBO Validation Modes
- **STRICT**: Reject unknown codes
- **LENIENT**: Accept but tag `meta.tags += ["unvalidated-code"]`

Configured per tenant in `butano_tenant_config.zibo_validation_mode`.

## O-CPID / Offline Support
- Identifiers starting with `O-CPID-` accepted
- Resources tagged `is_provisional=true` and `meta.tags += ["provisional"]`
- Reconcile endpoint converts O-CPID → CPID
