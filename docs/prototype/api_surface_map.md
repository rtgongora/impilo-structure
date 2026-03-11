# Impilo vNext — API Surface Map (v2)

> All Supabase tables, RPCs, and Edge Functions referenced by the prototype UI.
> Grouped by feature area. Extracted from hooks, contexts, and page components.

---

## 1. Authentication & Session

### Tables
| Table | Operations | Called From |
|-------|-----------|------------|
| `profiles` | SELECT (by user_id, by provider_registry_id) | `AuthContext`, `Auth.tsx` |
| `user_sessions` | INSERT, UPDATE | `AuthContext` on sign-in/sign-out/activity |
| `account_lockouts` | SELECT | `track-login-attempt` edge function |
| `user_roles` | SELECT | `useUserRoles`, `useSystemRoles` |
| `platform_roles` | SELECT | `has_platform_role()` RPC |

### RPCs
| Function | Inputs | Purpose |
|----------|--------|---------|
| `has_role(_user_id, _role)` | uuid, app_role | Check user role (used in RLS) |
| `can_bypass_restrictions(_user_id)` | uuid | Admin/dev bypass check |
| `has_platform_role(_user_id, _role_type)` | uuid, platform_role_type | Platform role check |
| `is_platform_superuser(_user_id)` | uuid | Superuser check |

### Edge Functions
| Function | Method | Purpose |
|----------|--------|---------|
| `track-login-attempt` | POST | Pre/post login attempt logging + lockout check |
| `geolocate-ip` | GET | IP geolocation for session tracking |

---

## 2. Provider & Facility Identity

### Tables
| Table | Called From |
|-------|------------|
| `health_providers` | `HealthProviderRegistry`, `VarapiProviders`, eligibility |
| `provider_licenses` | `useLicenseCheck`, eligibility |
| `provider_affiliations` | Eligibility, facility context |
| `provider_registry_logs` | `Auth.tsx` (biometric login log — INSERT) |
| `provider_state_transitions` | Trigger on `health_providers.lifecycle_state` change |
| `facilities` | `FacilityContext`, `FacilityRegistry`, `TusoFacilities` |
| `facility_types` | `FacilityRegistry` |
| `facility_services` | `FacilityContext` |
| `workspaces` | `WorkspaceSelection`, `TusoWorkspaces` |
| `workspace_memberships` | `can_access_workspace()` |
| `providers` | Shift management, workspace memberships |

### RPCs
| Function | Purpose |
|----------|---------|
| `generate_provider_registry_id(p_province_code)` | VARAPI-format provider ID |
| `generate_facility_registry_id(p_province_code)` | THUSO-format facility ID |
| `generate_upid()` | Universal Provider ID |
| `check_provider_eligibility(p_provider_id, ...)` | Full eligibility + decision logging |
| `is_licensed_practitioner(_user_id)` | License validity |
| `get_provider_facilities(_user_id)` | Provider facility affiliations |
| `get_user_workspaces(_user_id, _facility_id)` | Available workspaces |
| `can_access_workspace(_user_id, _workspace_id)` | Workspace access check |
| `get_device_context(p_device_fingerprint)` | Device-facility binding recall |
| `save_device_context(...)` | Device-facility binding store |

### Edge Functions
| Function | Purpose |
|----------|---------|
| `varapi-v1` | Provider registry operations |
| `tuso-v1` | Facility/workspace operations |

---

## 3. Client Registry (VITO)

### Tables
| Table | Called From |
|-------|------------|
| `client_registry` | `ClientRegistry`, `VitoPatients`, registration |
| `client_state_transitions` | Trigger on lifecycle_state change |
| `client_registry_events` | Trigger on create/death/merge |
| `patients` | `Patients`, `Registration`, queue |

### RPCs
| Function | Purpose |
|----------|---------|
| `generate_client_registry_id()` | CR-format client ID |
| `generate_health_id()` | HID-format health ID |
| `generate_impilo_id()` | Composite Impilo ID (CR + SHR) |

### Edge Functions
| Function | Purpose |
|----------|---------|
| `vito-v1-1` | Client registry operations |

---

## 4. Clinical (EHR)

### Tables
| Table | Called From |
|-------|------------|
| `encounters` | `Encounter`, `EHRContext`, queue |
| `visits` | Registration, discharge |
| `clinical_observations` | EHR observation panels |
| `clinical_orders` | `Orders`, order entry |
| `clinical_notes` | EHR notes section |
| `clinical_documents` | Document generation |
| `clinical_pages` | Clinical paging |
| `care_plans` | Care management |
| `problems` | Problem list |
| `referrals` | Consults & referrals |
| `beds` | Bed management |
| `discharge_cases` | Discharge workflow |
| `discharge_clearances` | Auto-created via trigger on discharge_case insert |

### RPCs
| Function | Purpose |
|----------|---------|
| `generate_visit_number()` | Auto-generate visit number |
| `generate_document_number()` | Auto-generate clinical document number |
| `can_access_patient(_user_id, _patient_id)` | Patient access authorization |

### Edge Functions
| Function | Purpose |
|----------|---------|
| `oros-v1` | Orders & results orchestration |
| `pharmacy-v1` | Pharmacy dispensing |
| `ai-diagnostic` | AI diagnostic assistant |
| `emergency-triage` | Emergency triage support |

---

## 5. Queue Management

### Tables
| Table | Called From |
|-------|------------|
| `queue_definitions` | `Queue`, queue config |
| `queue_items` | `Queue`, workstation |
| `queue_transitions` | Trigger on status change |
| `appointments` | `Appointments`, scheduling |
| `appointment_waitlist` | Waitlist management |

### RPCs
| Function | Purpose |
|----------|---------|
| `generate_queue_ticket(p_queue_id, p_prefix)` | Generate ticket number |
| `get_next_queue_sequence(p_queue_id)` | Next sequence number |
| `get_queue_metrics(p_queue_id)` | Queue statistics |
| `flag_missed_appointments(hours_threshold)` | Auto-flag no-shows |

---

## 6. Shift & Operations

### Tables
| Table | Called From |
|-------|------------|
| `shifts` | `ShiftContext`, `useShiftManagement` |
| `shift_definitions` | Roster planning |
| `shift_assignments` | Roster assignments |
| `roster_plans` | Roster management |
| `operational_supervisors` | Supervisor checks |
| `facility_operations_config` | Ops mode |

### RPCs
| Function | Purpose |
|----------|---------|
| `get_active_shift(_user_id)` | Current active shift |
| `get_todays_roster_assignment(_user_id, _facility_id)` | Today's roster |
| `is_operational_supervisor(_user_id, _facility_id)` | Supervisor check |
| `get_facility_ops_mode(_facility_id)` | Facility operations mode |

---

## 7. TSHEPO Trust Layer

### Tables
| Table | Called From |
|-------|------------|
| `tshepo_audit_ledger` | `TshepoAuditSearch`, kernel audit lib |
| `trust_layer_identity_mapping` | Trust resolution |
| `trust_layer_consent` | `TshepoConsentAdmin` |
| `offline_entitlements` | `TshepoOfflineStatus` |

### RPCs
| Function | Purpose |
|----------|---------|
| `tshepo_next_chain_sequence(p_tenant_id, p_pod_id)` | Next audit chain sequence |
| `tshepo_last_audit_hash(p_tenant_id, p_pod_id)` | Last audit record hash |
| `trust_layer_resolve_clinical(p_impilo_id)` | Resolve clinical identity |
| `trust_layer_resolve_registry(p_impilo_id)` | Resolve registry identity |

### Edge Functions
| Function | Purpose |
|----------|---------|
| `tshepo` | Trust layer operations |
| `trust-layer` | Trust resolution |

---

## 8. BUTANO Shared Health Record

### Tables
| Table | Called From |
|-------|------------|
| `butano_fhir_resources` | `ButanoTimeline`, `ButanoIPS` |
| `butano_document_references` | `ButanoTimeline` |
| `butano_outbox_events` | `ButanoStats` |
| `butano_subject_mappings` | `ButanoReconciliation` |
| `butano_reconciliation_queue` | `ButanoReconciliation` |
| `butano_pii_violations` | `ButanoStats` |
| `butano_tenants` | Multi-tenant config |
| `butano_tenant_config` | Tenant config |

### Edge Functions
| Function | Purpose |
|----------|---------|
| `butano-v1` | SHR FHIR operations |

---

## 9. Above-Site Oversight

### Tables
| Table | Called From |
|-------|------------|
| `above_site_roles` | `useAboveSiteRole` |
| `above_site_sessions` | `AboveSiteContextSelection`, session mgmt |
| `above_site_audit_log` | `AboveSiteDashboard` |
| `above_site_interventions` | `useAboveSiteInterventions` |
| `jurisdiction_assignments` | Jurisdiction scope |

### RPCs
| Function | Purpose |
|----------|---------|
| `has_above_site_role(_user_id)` | Above-site role check |
| `get_above_site_roles(_user_id)` | All active above-site roles |
| `get_jurisdiction_scope(_role_id)` | Jurisdiction scope for role |
| `can_access_facility_in_jurisdiction(_user_id, _facility_id)` | Jurisdiction access |

---

## 10. Commerce & Marketplace (MSIKA)

### Tables
| Table | Called From |
|-------|------------|
| `fulfillment_requests` | `PrescriptionFulfillment` |
| `vendors` | `VendorPortal`, marketplace |
| `vendor_ratings` | Rating system |
| `bid_notifications` | `VendorPortal` |

### RPCs
| Function | Purpose |
|----------|---------|
| `generate_fulfillment_number()` | Fulfillment request number |

### Edge Functions
| Function | Purpose |
|----------|---------|
| `msika-core-v1` | Products & services registry |
| `msika-flow-v1` | Commerce & fulfillment |

---

## 11. Finance (COSTA / MUSHEX)

### Tables
| Table | Called From |
|-------|------------|
| `charge_sheets` | `Charges` |
| `invoices` | `Payments` |
| `billing_adjustments` | Billing |
| `visit_financial_accounts` | Visit billing |
| `bed_day_costs` | Bed day accrual |

### Edge Functions
| Function | Purpose |
|----------|---------|
| `costa-v1` | Costing engine |
| `mushex-v1` | Payment switch & claims |

---

## 12. Social & Communication

### Tables
| Table | Called From |
|-------|------------|
| `posts` | Social feed |
| `post_reactions`, `post_comments` | Social interactions |
| `communities`, `community_members` | Communities |
| `clubs`, `club_members` | Clubs |
| `professional_pages`, `page_followers`, `page_reviews` | Professional pages |
| `crowdfunding_campaigns`, `crowdfunding_donations` | Crowdfunding |
| `message_channels`, `messages` | Messaging |
| `call_sessions`, `call_ice_candidates`, `call_recordings` | Voice/video |
| `announcements`, `announcement_acknowledgments` | Noticeboard |

---

## 13. All Edge Functions (Complete List)

| Function | Purpose |
|----------|---------|
| `ai-diagnostic` | AI diagnostic assistant |
| `butano-v1` | SHR FHIR operations |
| `cleanup-sessions` | Session cleanup cron |
| `costa-v1` | Costing engine |
| `dicomweb` | DICOM image serving |
| `emergency-triage` | Emergency triage |
| `geolocate-ip` | IP geolocation |
| `inventory-v1` | Inventory management |
| `landela-process-document` | Document processing |
| `landela-suite-v1` | Credentials suite |
| `msika-core-v1` | Products & services |
| `msika-flow-v1` | Commerce & fulfillment |
| `mushex-v1` | Payment switch |
| `odoo-integration` | Odoo ERP connector |
| `oros-v1` | Orders & results |
| `pct-v1` | Patient care team |
| `pharmacy-v1` | Pharmacy dispensing |
| `seed-test-users` | Test data seeding |
| `send-password-reset` | Password reset email |
| `send-role-notification` | Role change notification |
| `send-secure-id` | Secure ID delivery |
| `send-security-notification` | Security alert |
| `send-verification-email` | Verification email |
| `totp-management` | TOTP 2FA |
| `track-login-attempt` | Login attempt tracking |
| `trust-layer` | Trust resolution |
| `tshepo` | Trust layer ops |
| `tuso-v1` | Facility/workspace ops |
| `varapi-v1` | Provider registry |
| `vito-v1-1` | Client registry |
| `zibo-v1` | Terminology service |
