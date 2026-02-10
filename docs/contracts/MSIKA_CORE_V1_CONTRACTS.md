# MSIKA Core v1.1 — API Contracts & JSON Schemas

## Overview
MSIKA Core is the **Products & Services Registry** for the Impilo vNext platform.
It manages national baseline catalogs, tenant overlays, polymorphic items (PRODUCT, SERVICE, ORDERABLE, CHARGEABLE, CAPABILITY), and pack distribution for downstream consumers.

---

## 1. API Endpoints (OpenAPI Summary)

### 1.1 Catalog Lifecycle
| Method | Path | Description | Step-up |
|--------|------|-------------|---------|
| POST | `/v1/catalogs` | Create catalog (DRAFT) | No |
| GET | `/v1/catalogs` | List catalogs (filter scope/status/tenant) | No |
| POST | `/v1/catalogs/{id}/submit-review` | DRAFT → REVIEW | No |
| POST | `/v1/catalogs/{id}/approve` | REVIEW → APPROVED | NATIONAL only |
| POST | `/v1/catalogs/{id}/publish` | APPROVED → PUBLISHED (computes checksum) | Yes |
| POST | `/v1/catalogs/{id}/rollback/{version}` | Clone published snapshot as new DRAFT | Yes |

### 1.2 Items CRUD
| Method | Path | Description | Step-up |
|--------|------|-------------|---------|
| POST | `/v1/catalogs/{id}/items` | Create item + detail row | No |
| PUT | `/v1/items/{itemId}` | Update with optimistic lock | No |
| GET | `/v1/items/{itemId}` | Get item + details | No |

### 1.3 Search
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/search?q=&kind=&tag=&restriction=&tenantId=` | Full-text search (tsvector) |

### 1.4 Packs (Consumer Integration)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/packs/item-master?tenantId=` | PRODUCT items pack |
| GET | `/v1/packs/orderables?tenantId=` | ORDERABLE items pack |
| GET | `/v1/packs/chargeables?tenantId=` | CHARGEABLE items pack |
| GET | `/v1/packs/capabilities/facility?tenantId=` | CAPABILITY_FACILITY pack |
| GET | `/v1/packs/capabilities/provider?tenantId=` | CAPABILITY_PROVIDER pack |

- ETag = catalog checksum; supports `If-None-Match` → 304
- Tenant overlay merges: tenant items override national by `canonical_code`

### 1.5 Imports
| Method | Path | Description | Step-up |
|--------|------|-------------|---------|
| POST | `/v1/import/csv` | Bulk CSV import with staging | Yes |
| GET | `/v1/import/jobs/{id}` | Job stats + staging items | No |
| POST | `/v1/import/sources` | Create external source | No |

### 1.6 Mapping Workflow
| Method | Path | Description | Step-up |
|--------|------|-------------|---------|
| GET | `/v1/mappings/pending` | List pending mappings | No |
| POST | `/v1/mappings/{id}/approve` | Approve mapping | NATIONAL scope |
| POST | `/v1/mappings/{id}/reject` | Reject mapping | No |

### 1.7 Validation
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/validate/item` | Validate item against schema |
| POST | `/v1/validate/pack` | Validate pack structure |

---

## 2. JSON Schemas

### 2.1 Restrictions Schema
```json
{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "prescription_required": { "$ref": "#/$defs/RestrictionFlag" },
    "facility_only": { "$ref": "#/$defs/RestrictionFlag" },
    "provider_only_order": { "$ref": "#/$defs/RestrictionFlag" },
    "controlled_item": { "$ref": "#/$defs/RestrictionFlag" },
    "age_restricted": { "$ref": "#/$defs/RestrictionFlag" },
    "cold_chain_required": { "$ref": "#/$defs/RestrictionFlag" },
    "hazardous_handling_required": { "$ref": "#/$defs/RestrictionFlag" },
    "requires_schedule": { "$ref": "#/$defs/RestrictionFlag" },
    "requires_referral": { "$ref": "#/$defs/RestrictionFlag" },
    "requires_licenced_provider": { "$ref": "#/$defs/RestrictionFlag" }
  },
  "$defs": {
    "RestrictionFlag": {
      "type": "object",
      "required": ["enabled"],
      "properties": {
        "enabled": { "type": "boolean" },
        "reason_code": { "type": "string" },
        "enforcement_hint": { "type": "string" }
      }
    }
  }
}
```

### 2.2 CatalogItem Schema
```json
{
  "type": "object",
  "required": ["kind", "canonical_code", "display_name"],
  "properties": {
    "item_id": { "type": "string", "description": "ULID" },
    "catalog_id": { "type": "string" },
    "kind": { "enum": ["PRODUCT","SERVICE","ORDERABLE","CHARGEABLE","CAPABILITY_FACILITY","CAPABILITY_PROVIDER"] },
    "canonical_code": { "type": "string" },
    "display_name": { "type": "string" },
    "description": { "type": "string" },
    "synonyms": { "type": "array", "items": { "type": "string" } },
    "tags": { "type": "array", "items": { "type": "string" } },
    "restrictions": { "$ref": "restrictions.schema.json" },
    "zibo_bindings": { "type": "object" },
    "metadata": { "type": "object" },
    "lock_version": { "type": "integer" }
  }
}
```

### 2.3 ProductDetails Schema
```json
{
  "type": "object",
  "properties": {
    "form": { "type": "string" },
    "strength": { "type": "string" },
    "route": { "type": "string" },
    "uom": { "type": "string" },
    "pack_size": { "type": "integer" },
    "barcode_gtin": { "type": "string" },
    "batch_tracked": { "type": "boolean" },
    "expiry_tracked": { "type": "boolean" },
    "cold_chain": { "type": "boolean" },
    "controlled": { "type": "boolean" }
  }
}
```

### 2.4 Pack Response Schema
```json
{
  "type": "object",
  "properties": {
    "pack": { "type": "string" },
    "version": { "type": "string" },
    "items": { "type": "array", "items": { "$ref": "catalog-item.schema.json" } },
    "checksum": { "type": "string" }
  }
}
```

### 2.5 Standard Error Envelope
```json
{
  "type": "object",
  "properties": {
    "error": {
      "type": "object",
      "properties": {
        "code": { "type": "string" },
        "message": { "type": "string" },
        "details": { "type": "object" }
      }
    }
  }
}
```

### 2.6 STEP_UP_REQUIRED Error
```json
{
  "error": {
    "code": "STEP_UP_REQUIRED",
    "message": "Step-up authentication required",
    "next": {
      "method": "OIDC_STEP_UP",
      "reason": "HIGH_RISK_ACTION"
    }
  }
}
```

---

## 3. TSHEPO Headers (Required on all requests)

| Header | Required | Description |
|--------|----------|-------------|
| `X-Tenant-Id` | Yes | Tenant identifier |
| `X-Correlation-Id` | Yes | Request correlation |
| `X-Device-Fingerprint` | Yes | Device UUID |
| `X-Purpose-Of-Use` | Yes | ADMINISTRATION / PUBLIC_BROWSE |
| `X-Actor-Id` | Yes | Actor identifier |
| `X-Actor-Type` | Yes | USER / SYSTEM |
| `X-Facility-Id` | Context | Facility scope |
| `X-Workspace-Id` | Context | Workspace scope |
| `X-Shift-Id` | Context | Active shift |
| `X-Session-Assurance` | Step-up | Must be "HIGH" for protected actions |

---

## 4. Tenant Overlay Merge Rules

1. **Baseline**: Latest NATIONAL PUBLISHED catalog
2. **Overlay**: Latest TENANT PUBLISHED catalog for the requesting tenant
3. **Merge**: Tenant items override national items by `canonical_code`
4. **Restriction Guard**: Tenant overlay **cannot weaken** national restrictions unless `policy_allow_relaxation=true` (hardcoded `false` in prototype)
5. **Pack checksum**: `national_checksum:tenant_checksum`
