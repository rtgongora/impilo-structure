# BUTANO Events — Technical Reference

**Version:** 1.0  
**Status:** Wave 4 Implementation  
**Spec Reference:** Tech Companion Spec §1.4.4  

---

## Overview

BUTANO (Shared Health Record) emits v1.1 events for clinical data lifecycle transitions. These drive timeline refresh, PCT/OROS state coupling, and offline reconciliation visibility.

## Event Topics

### `impilo.butano.fhir.resource.created.v1`
Emitted when a new FHIR resource is stored in BUTANO.

### `impilo.butano.fhir.resource.updated.v1`  
Emitted when an existing FHIR resource is updated.

### `impilo.butano.reconcile.completed.v1`
Emitted when an O-CPID → CPID reconciliation completes.

## Payload Structure

All payloads are **PII-free** — no names, contact info, or national IDs.

### Resource Created/Updated Payload (Delta)
```json
{
  "op": "CREATE",
  "before": null,
  "after": {
    "resource_type": "Observation",
    "fhir_id": "obs-123",
    "subject_cpid": "CPID-abc",
    "encounter_id": "enc-456",
    "effective_at": "2026-02-10T10:00:00Z",
    "is_provisional": false,
    "tags": ["vitals", "blood-pressure"]
  },
  "changed_fields": ["*"]
}
```

### Reconcile Completed Payload (Delta)
```json
{
  "op": "UPDATE",
  "before": { "subject_ref": "O-CPID-old" },
  "after": {
    "from_ocpid": "O-CPID-old",
    "to_cpid": "CPID-canonical",
    "records_rewritten": 42
  },
  "changed_fields": ["subject_ref"]
}
```

## Partitioning

| Event | Partition Key |
|-------|---------------|
| resource.created | `patient_cpid` (or `o_cpid` if provisional) |
| resource.updated | `patient_cpid` |
| reconcile.completed | `to_cpid` (canonical) |

## Idempotency & Audit

- All emits go through the v1.1 schema gate (`validateEventOrThrow`)
- All emits use the dual-emit policy (`emitWithPolicy`)
- Outbox pattern ensures exactly-once semantics under retries
- PDP decisions (if applicable) are logged before emit
