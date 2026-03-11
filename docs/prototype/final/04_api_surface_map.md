# 04 — API Surface Map

## Supabase Tables Referenced by UI

### Auth & Session
| Table | Used By | Operations |
|-------|---------|------------|
| `profiles` | AuthContext, Auth.tsx | SELECT by user_id, SELECT by provider_registry_id, UPDATE last_active_at |
| `user_sessions` | AuthContext | INSERT (new session), UPDATE (activity/end), SELECT by session_token |
| `provider_registry_logs` | Auth.tsx | INSERT on biometric login |
| `account_lockouts` | track-login-attempt edge fn | Used internally |

### Clinical
| Table | Used By | Operations |
|-------|---------|------------|
| `encounters` | EHRContext | SELECT by id with patients join |
| `patients` | EHRContext (via join), PatientSearch, Queue, Patients pages | SELECT |
| `audit_logs` | EHRContext | INSERT chart_access, INSERT chart_closed |
| `queue_definitions` | Queue page | SELECT |
| `queue_items` | Queue page | SELECT, INSERT, UPDATE |
| `beds` | Beds page | SELECT, UPDATE |
| `appointments` | Appointments page | SELECT, INSERT, UPDATE |
| `visits` | Various clinical pages | SELECT, INSERT |
| `clinical_orders` | Orders page | SELECT, INSERT |
| `prescriptions` | Pharmacy page | SELECT, INSERT |
| `care_plans` | EHR (care section) | SELECT, INSERT |
| `referrals` | Telemedicine page | SELECT, INSERT |

### Facility & Workspace
| Table/View | Used By | Operations |
|------------|---------|------------|
| `facility_capabilities` (view) | FacilityContext | SELECT by facility_id, SELECT all |
| `facilities` | FacilityContext, FacilityRegistry | SELECT |
| `workspaces` | WorkspaceManagement | SELECT |
| `workspace_memberships` | useWorkspaceData | SELECT |
| `shifts` | ShiftContext (via useWorkspaceData) | SELECT, INSERT, UPDATE |
| `shift_workspace_logs` | useWorkspaceData | INSERT, UPDATE |

### Registry
| Table | Used By | Operations |
|-------|---------|------------|
| `client_registry` | ClientRegistry page | SELECT, INSERT |
| `health_providers` | HealthProviderRegistry page | SELECT |
| `provider_licenses` | HPR page | SELECT |
| `provider_affiliations` | HPR page | SELECT |

### Admin & Kernel
| Table | Used By | Operations |
|-------|---------|------------|
| `above_site_roles` | useAboveSiteRole | SELECT |
| `above_site_sessions` | useAboveSiteRole | INSERT, UPDATE |
| `jurisdiction_assignments` | AboveSiteDashboard | SELECT |
| `tshepo_audit_ledger` | TshepoAuditSearch | SELECT |
| `offline_entitlements` | TshepoOfflineStatus | SELECT |
| `user_roles` | useUserRoles, RLS functions | SELECT |
| `platform_roles` | usePermissions | SELECT |
| `registry_admin_roles` | useRegistryAdmin | SELECT |
| `trust_layer_identity_mapping` | Trust layer RPCs | SELECT |
| `trust_layer_consent` | Trust layer RPCs | SELECT |

### Marketplace & Finance
| Table | Used By | Operations |
|-------|---------|------------|
| `fulfillment_requests` | PrescriptionFulfillment | SELECT, INSERT |
| `vendors` | VendorPortal | SELECT |
| `vendor_bids` | VendorPortal | SELECT, INSERT |
| `charge_sheets` | Charges page | SELECT, INSERT |
| `invoices` | Payments page | SELECT |

## RPC Functions Referenced by UI

| Function | Used By | Parameters | Returns |
|----------|---------|------------|---------|
| `generate_impilo_id()` | IdServices | none | `{impilo_id, client_registry_id, shr_id}` |
| `generate_provider_registry_id(province_code)` | IdServices | text | text |
| `generate_facility_registry_id(province_code)` | IdServices | text | text |
| `generate_health_id()` | IdServices | none | text |
| `generate_upid()` | HPR/registration | none | text |
| `trust_layer_resolve_clinical(impilo_id)` | Trust layer | text | `{cpid, status, consent_active}` |
| `trust_layer_resolve_registry(impilo_id)` | Trust layer | text | `{crid, status}` |
| `tshepo_next_chain_sequence(tenant_id, pod_id)` | TSHEPO admin | text, text | bigint |
| `tshepo_last_audit_hash(tenant_id, pod_id)` | TSHEPO admin | text, text | text |
| `check_provider_eligibility(provider_id, role?, privileges?, facility?)` | VARAPI | uuid, text, text[], text | jsonb |
| `get_active_shift(user_id)` | ShiftContext | uuid | table row |
| `get_user_workspaces(user_id, facility_id?)` | WorkspaceManagement | uuid, uuid? | table rows |
| `get_provider_facilities(user_id)` | useProviderFacilities | uuid | table rows |
| `get_queue_metrics(queue_id)` | Queue page | uuid | metrics row |
| `get_cpd_summary(user_id)` | MyProfessionalHub | uuid | summary row |
| `get_user_organizations(user_id)` | WorkplaceSelectionHub | uuid | table rows |
| `get_above_site_roles(user_id)` | useAboveSiteRole | uuid | table rows |
| `get_todays_roster_assignment(user_id, facility_id?)` | Roster | uuid, uuid? | table row |
| `get_device_context(device_fingerprint)` | Device detection | text | table row |
| `save_device_context(fingerprint, user_id, facility_id, workspace_id?)` | Device save | text, uuid, uuid, uuid? | uuid |
| `flag_missed_appointments(hours_threshold)` | Scheduling | int | int |
| `can_access_patient(user_id, patient_id)` | RLS policies | uuid, uuid | boolean |
| `can_access_workspace(user_id, workspace_id)` | RLS policies | uuid, uuid | boolean |
| `has_role(user_id, role)` | RLS policies | uuid, app_role | boolean |
| `has_platform_role(user_id, role_type)` | RLS policies | uuid, platform_role_type | boolean |
| `has_registry_role(user_id, registry_role)` | RLS policies | uuid, registry_role | boolean |
| `has_above_site_role(user_id)` | RLS policies | uuid | boolean |
| `is_platform_superuser(user_id)` | RLS policies | uuid | boolean |
| `is_licensed_practitioner(user_id)` | RLS policies | uuid | boolean |
| `is_operational_supervisor(user_id, facility_id?)` | Operations | uuid, uuid? | boolean |

## Edge Functions

| Function | Endpoint | JWT | Used By | Payload |
|----------|----------|-----|---------|---------|
| `track-login-attempt` | POST | No | AuthContext (signIn) | `{email, success, userAgent}` |
| `geolocate-ip` | POST | Yes | AuthContext (session create) | `{sessionId}` |
| `cleanup-sessions` | POST | No | Scheduled/manual | none |
| `seed-test-users` | POST | No | Setup | none |
| `send-role-notification` | POST | Yes | Admin role changes | notification data |
| `send-security-notification` | POST | Yes | Security events | notification data |
| `totp-management` | POST | Yes | Profile/security | TOTP operations |
| `send-verification-email` | POST | No | Registration | email data |
| `ai-diagnostic` | POST | Yes | AIDiagnosticAssistant | diagnostic query |
| `odoo-integration` | POST | Yes | Odoo page | ERP sync data |
| `emergency-triage` | POST | No | EmergencyHub | triage data |
| `costa-v1` | POST | No | COSTA admin | costing operations |
| `mushex-v1` | POST | No | MUSHEX admin | payment operations |
| `oros-v1` | POST | Yes | OROS admin | order operations |
| `pct-v1` | POST | Yes | PCT admin | patient flow operations |
| `vito-v1-1` | POST | Yes | VITO admin | client registry operations |
| `varapi-v1` | POST | Yes | VARAPI admin | provider registry operations |
| `tuso-v1` | POST | Yes | TUSO admin | facility operations |
| `zibo-v1` | POST | Yes | ZIBO admin | terminology operations |
| `butano-v1` | POST | Yes | BUTANO admin | SHR operations |
| `msika-core-v1` | POST | Yes | MSIKA Core admin | product registry operations |
| `msika-flow-v1` | POST | Yes | MSIKA Flow admin | commerce operations |
| `pharmacy-v1` | POST | Yes | Pharmacy admin | pharmacy operations |
| `inventory-v1` | POST | Yes | Inventory admin | stock operations |
| `landela-suite-v1` | POST | Yes | Landela page | document operations |
| `landela-process-document` | POST | Yes | Landela page | document processing |
| `tshepo` | POST | Yes | TSHEPO admin | trust layer operations |
| `trust-layer` | POST | Yes | Trust layer | identity resolution |
| `send-password-reset` | POST | No | ForgotPassword | `{email}` |
| `send-secure-id` | POST | Yes | IdServices | secure ID delivery |
| `dicomweb` | POST | Yes | PACS viewer | DICOM operations |

## Storage Buckets

Referenced in code but bucket creation is managed by Supabase:
- `call_recordings` — referenced in `call_recordings` table (storage_bucket column)
- Document storage via Landela edge functions
