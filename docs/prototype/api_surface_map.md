# Impilo vNext — API Surface Map

> Maps all API calls, edge functions, and Supabase queries observed in the prototype.

---

## Authentication

### Sign In (Email/Password)
- **Trigger**: Email login form submit on `/auth`
- **Call**: `supabase.auth.signInWithPassword({ email, password })`
- **Pre-call**: `supabase.functions.invoke('track-login-attempt', { body: { email, success: false, userAgent } })` — checks if account is locked
- **Post-success**: `supabase.functions.invoke('track-login-attempt', { body: { email, success: true, userAgent } })`
- **UI handling**: Success → toast + navigate "/"; Error → toast with message; Locked → toast with lock message

### Sign Up
- **Call**: `supabase.auth.signUp({ email, password, options: { emailRedirectTo, data: metadata } })`
- **Metadata**: `display_name, role, specialty, department`

### Sign Out
- **Call**: `supabase.auth.signOut()`
- **Side effects**: Clear user/session/profile state, end session tracking

### Password Reset
- **Request**: `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
- **Update**: `supabase.auth.updateUser({ password })`

---

## Session Management

### Create Session
- **Trigger**: SIGNED_IN auth event
- **Call**: `supabase.from('user_sessions').insert/update(...)` with session_token, user_agent, device_info
- **Post-insert**: `supabase.functions.invoke('geolocate-ip', { body: { sessionId } })`

### Update Session Activity
- **Trigger**: Every 5 minutes (interval)
- **Call**: `supabase.from('user_sessions').update({ last_activity_at }).eq('session_token', ...).eq('is_active', true)`

### End Session
- **Trigger**: SIGNED_OUT auth event
- **Call**: `supabase.from('user_sessions').update({ is_active: false, ended_at }).eq('session_token', ...)`

### Update Last Active
- **Trigger**: Session load
- **Call**: `supabase.from('profiles').update({ last_active_at }).eq('user_id', ...)`

---

## Profile

### Fetch Profile
- **Call**: `supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle()`
- **Returns**: Profile with role, display_name, specialty, department, phone, license_number, avatar_url, facility_id

---

## Patient Data

### Fetch Patients
- **Page**: `/patients`
- **Call**: `supabase.from('patients').select('*').order('created_at', { ascending: false })`
- **Columns**: id, mrn, first_name, middle_name, last_name, date_of_birth, gender, phone_primary, email, city, allergies, is_active

### Patient Search
- **Component**: `PatientSearch` (`src/components/search/PatientSearch.tsx`)
- **Trigger**: Dialog opened via button or ⌘K / Ctrl+K keyboard shortcut
- **Call**: `supabase.from("patients").select("id, mrn, first_name, last_name, date_of_birth, gender, allergies, phone_primary").or("first_name.ilike.%${query}%,last_name.ilike.%${query}%,mrn.ilike.%${query}%,phone_primary.ilike.%${query}%").limit(10)`
- **Debounce**: 300ms (`setTimeout` in `useEffect`)
- **On select**: Checks for active encounter via `supabase.from("encounters").select(...).eq("patient_id", id).in("status", ["active","in-progress","waiting"]).limit(1)` — if found, navigates to `/encounter/{id}`; otherwise navigates to `/patients?selected={id}`
- **Recent patients**: Stored/retrieved from `localStorage` key `"recentPatients"` (max 5)

---

## Queue Management

### Fetch Queues
- **Hook**: `useQueueManagement()`
- **Call**: `supabase.from('queue_definitions').select('*')` (assumed)
- **Related tables**: queue_items, queue_transitions

### Add to Queue
- **Component**: AddToQueueDialog
- **Call**: `supabase.from('queue_items').insert(...)` (assumed)
- **Trigger functions**: `queue_item_before_insert()` (auto-generates sequence_number and ticket_number)

### Queue Status Changes
- **Trigger function**: `queue_item_status_change()` — logs transitions, calculates wait/service times

---

## Dashboard Data

### Fetch Dashboard Data
- **Hook**: `useDashboardData()`
- **Returns**: patients, tasks, orders, referrals, results, stats, loading
- **Queries**: UNKNOWN/NOT OBSERVED — likely multiple Supabase queries

---

## Encounter / EHR

### Open Chart
- **Context**: EHRContext
- **Process**: Fetch encounter by ID from URL, load patient data, validate access
- **Call**: `supabase.from('encounters').select(...)` (assumed)

### Provider Login Logging
- **Call**: `supabase.from('provider_registry_logs').insert({ user_id, provider_registry_id, action: 'biometric_login', biometric_method, verification_status, user_agent })`

---

## Edge Functions

All deployed automatically from `supabase/functions/`:

| Function | Purpose |
|----------|---------|
| `ai-diagnostic` | AI diagnostic assistant |
| `butano-v1` | BUTANO SHR operations |
| `cleanup-sessions` | Session cleanup cron |
| `costa-v1` | COSTA costing engine |
| `dicomweb` | DICOM web proxy for PACS |
| `emergency-triage` | Emergency triage logic |
| `geolocate-ip` | IP geolocation for sessions |
| `inventory-v1` | Inventory service |
| `landela-process-document` | Document processing |
| `landela-suite-v1` | Landela suite operations |
| `msika-core-v1` | MSIKA product registry |
| `msika-flow-v1` | MSIKA commerce/fulfillment |
| `mushex-v1` | MUSHEX payment switch |
| `odoo-integration` | Odoo ERP integration |
| `oros-v1` | OROS orders & results |
| `pct-v1` | PCT patient care tracker |
| `pharmacy-v1` | Pharmacy service |
| `seed-test-users` | Test user seeding |
| `send-password-reset` | Password reset emails |
| `send-role-notification` | Role assignment notifications |
| `send-secure-id` | Secure ID delivery |
| `send-security-notification` | Security alert emails |
| `send-verification-email` | Email verification |
| `totp-management` | TOTP/MFA management |
| `track-login-attempt` | Login attempt tracking & lockout |
| `trust-layer` | Trust layer operations |
| `tshepo` | TSHEPO PDP/IAM operations |
| `tuso-v1` | TUSO facility operations |
| `varapi-v1` | VARAPI provider operations |
| `vito-v1-1` | VITO patient registry operations |
| `zibo-v1` | ZIBO terminology service |

---

## Database Functions (RPC)

Key database functions called via `supabase.rpc()`:

| Function | Purpose |
|----------|---------|
| `generate_impilo_id()` | Generate composite Impilo ID (CR + SHR) |
| `generate_health_id()` | Generate Health ID with Luhn check digit |
| `generate_upid()` | Generate Unique Provider ID |
| `generate_provider_registry_id()` | Generate VARAPI provider ID |
| `generate_facility_registry_id()` | Generate TUSO facility ID |
| `generate_client_registry_id()` | Generate client registry ID |
| `check_provider_eligibility()` | Check provider roles/privileges at facility |
| `get_provider_facilities()` | Get user's affiliated facilities |
| `get_user_workspaces()` | Get user's workspace memberships |
| `get_active_shift()` | Get current active shift |
| `get_todays_roster_assignment()` | Get today's roster assignment |
| `get_queue_metrics()` | Get queue statistics |
| `has_role()` | Check user role |
| `has_above_site_role()` | Check above-site role |
| `has_platform_role()` | Check platform role |
| `is_licensed_practitioner()` | Verify active license |
| `can_access_workspace()` | Workspace access check |
| `can_access_patient()` | Patient access authorization |
| `can_access_facility_in_jurisdiction()` | Jurisdiction-based facility access |
| `get_cpd_summary()` | Get CPD points summary |
| `flag_missed_appointments()` | Auto-flag no-show appointments |
| `trust_layer_resolve_clinical()` | Resolve CPID for clinical access |
| `trust_layer_resolve_registry()` | Resolve CRID for registry access |
| `get_device_context()` | Get remembered device context |
| `save_device_context()` | Save device context for auto-selection |

---

## Realtime Subscriptions

UNKNOWN/NOT OBSERVED from code reviewed. Tables with realtime potentially enabled:
- `queue_items` (queue status changes)
- `message_channels` / messages (communication)
- `call_sessions` (telemedicine)

---

## Key Supabase Tables Referenced in UI

| Table | Used By |
|-------|---------|
| `profiles` | Auth context, user display |
| `patients` | Patients page, search, encounters |
| `encounters` | EHR, dashboard |
| `queue_definitions` | Queue management |
| `queue_items` | Queue workstation |
| `beds` | Bed management |
| `appointments` | Scheduling |
| `user_sessions` | Session tracking |
| `provider_registry_logs` | Login audit |
| `health_providers` | Provider registry |
| `provider_licenses` | License checks |
| `provider_affiliations` | Facility affiliations |
| `facilities` | Facility registry |
| `workspaces` | Workspace management |
| `workspace_memberships` | Workspace access |
| `shifts` | Shift management |
| `clinical_orders` | Order entry |
| `above_site_roles` | Above-site access |
| `above_site_sessions` | Above-site session tracking |
| `user_roles` | Role-based access |
| `client_registry` | National client registry |
| `trust_layer_identity_mapping` | Trust layer |
| `trust_layer_consent` | Consent management |
| `tshepo_audit_ledger` | Audit trail |
| `offline_entitlements` | Offline access (assumed) |
