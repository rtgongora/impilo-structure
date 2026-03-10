# API Contracts Observed — Impilo vNext Prototype

> **DO NOT CHANGE** — These are the actual Supabase interactions from the prototype.

---

## 1. Authentication API

### Sign Up
- **Called by**: AuthContext.signUp
- **Method**: `supabase.auth.signUp({ email, password, options: { emailRedirectTo, data: metadata } })`
- **Metadata**: `{ display_name?, role?, specialty?, department? }`

### Sign In (Email/Password)
- **Called by**: AuthContext.signIn, Auth.tsx email-login
- **Pre-check**: Calls `track-login-attempt` edge function with `{ email, success: false, userAgent }`
- **If locked**: Returns `{ locked: true, message: string }`
- **Method**: `supabase.auth.signInWithPassword({ email, password })`
- **Post-success**: Calls `track-login-attempt` again with `{ email, success: true, userAgent }`

### Sign Out
- **Called by**: AuthContext.signOut
- **Method**: `supabase.auth.signOut()`

### Password Reset
- **Request**: `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`
- **Update**: `supabase.auth.updateUser({ password })`

---

## 2. Profile Operations

### Fetch Profile
- **Called by**: AuthContext.fetchProfile
- **Query**: `supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle()`
- **Response shape**: Profile object (see AuthContext)

### Update Last Active
- **Called by**: AuthContext.updateLastActive
- **Query**: `supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('user_id', userId)`

---

## 3. Session Tracking

### Create Session
- **Called by**: AuthContext.createSession
- **Check existing**: `supabase.from('user_sessions').select('id').eq('session_token', token).maybeSingle()`
- **Insert new**: `supabase.from('user_sessions').insert({ user_id, session_token, user_agent, device_info, is_active: true }).select('id').maybeSingle()`
- **Update existing**: `supabase.from('user_sessions').update({ is_active: true, last_activity_at, ended_at: null }).eq('id', id)`

### Update Session Activity
- **Called by**: AuthContext (5-min interval)
- **Query**: `supabase.from('user_sessions').update({ last_activity_at }).eq('session_token', token).eq('is_active', true)`

### End Session
- **Called by**: AuthContext.endSession
- **Query**: `supabase.from('user_sessions').update({ is_active: false, ended_at }).eq('session_token', token)`

---

## 4. Facility Operations

### Fetch Facility Capabilities
- **Called by**: FacilityContext.fetchFacilityCapabilities
- **Query**: `supabase.from('facility_capabilities').select('*').eq('facility_id', facilityUUID).maybeSingle()`
- **Fallback**: If facilityId is not UUID, looks up via `supabase.from('facilities').select('id').eq('gofr_id', facilityIdOrCode).maybeSingle()`

### Fetch All Facilities
- **Called by**: FacilityContext.fetchAvailableFacilities
- **Query**: `supabase.from('facility_capabilities').select('*').order('facility_name')`

---

## 5. Provider Login Flow

### Provider Lookup (in Auth.tsx provider login)
- **Query**: `supabase.from('profiles').select('user_id').eq('provider_registry_id', providerId).maybeSingle()`
- **Provider login log**: `supabase.from('provider_registry_logs').insert({ user_id, provider_registry_id, action: 'biometric_login', biometric_method, verification_status: 'success', user_agent })`

---

## 6. Edge Functions

### geolocate-ip
- **Called by**: AuthContext.createSession
- **Invocation**: `supabase.functions.invoke('geolocate-ip', { body: { sessionId } })`
- **Purpose**: Updates session with IP geolocation data
- **Error handling**: `.catch(err => console.log(...))`

### track-login-attempt
- **Called by**: AuthContext.signIn
- **Invocation**: `supabase.functions.invoke('track-login-attempt', { body: { email, success, userAgent } })`
- **Response**: `{ locked?: boolean, message?: string }`

### oros-v1
- **Purpose**: Orders & Results orchestration
- **Called by**: OROS admin and clinical order pages

### zibo-v1
- **Purpose**: Terminology validation
- **Called by**: ZIBO admin pages

---

## 7. RPC Functions (Called from UI)

### generate_impilo_id()
- **Returns**: `{ impilo_id, client_registry_id, shr_id }`
- **Called from**: ID Services hub

### check_provider_eligibility(provider_id, role?, privileges?, facility_context?)
- **Returns**: `{ eligible, provider_id, roles, privileges, facility_scope, license_valid_until, reason_codes }`
- **Called from**: Provider registry, auth flows

### get_provider_facilities(user_id)
- **Returns**: Table of `{ facility_id, facility_name, facility_type, level_of_care, context_label, is_primary, is_pic, is_owner, can_access, privileges }`
- **Called from**: Facility selection flows

### get_user_workspaces(user_id, facility_id?)
- **Returns**: Table of `{ workspace_id, workspace_name, workspace_type, facility_id, facility_name, workspace_role, service_tags }`
- **Called from**: Workspace selection

### get_active_shift(user_id)
- **Returns**: `{ shift_id, facility_id, facility_name, current_workspace_id, current_workspace_name, started_at, duration_minutes }`
- **Called from**: ShiftContext

### get_queue_metrics(queue_id)
- **Returns**: `{ queue_length, avg_wait_minutes, longest_wait_minutes, in_service_count, completed_today }`
- **Called from**: Queue management pages

### tshepo_next_chain_sequence(tenant_id, pod_id)
- **Returns**: BIGINT (next sequence number)
- **Called from**: Kernel audit operations

### tshepo_last_audit_hash(tenant_id, pod_id)
- **Returns**: TEXT (last hash)
- **Called from**: Kernel audit chain verification

### trust_layer_resolve_clinical(impilo_id)
- **Returns**: `{ cpid, status, consent_active }`
- **Called from**: Clinical identity resolution

### trust_layer_resolve_registry(impilo_id)
- **Returns**: `{ crid, status }`
- **Called from**: Registry identity resolution

### get_device_context(device_fingerprint)
- **Returns**: `{ facility_id, facility_name, workspace_id, workspace_name, last_used_at }`
- **Called from**: Device context detection

### save_device_context(fingerprint, user_id, facility_id, workspace_id?)
- **Returns**: UUID
- **Called from**: Login/facility selection

---

## 8. Kernel Client Calls (src/lib/kernel/)

These are kernel-level primitives used by admin surfaces and clinical workflows:

### Event Emission
- `emitV11(envelope)` — publishes v1.1 event
- `emitPatientCreated(context)` — VITO patient creation event
- `emitPatientUpdated(context)` — VITO patient update event
- `emitPatientMerged(context)` — VITO patient merge event
- `emitButanoResourceCreated(meta)` — BUTANO resource event

### Idempotency
- `requireIdempotencyKey(headers)` — validates Idempotency-Key header
- `checkIdempotency(key, hash)` — checks for existing result
- `storeIdempotencyResult(key, hash, result)` — stores result

### Audit
- `appendAuditRecord(record)` — appends to hash chain
- `verifyChain(tenantId, podId)` — verifies chain integrity
- `logPolicyDecision(input)` — logs PDP decision

### PDP
- `pdpDecide(request)` — evaluates policy
- `evaluatePolicy(subject, action, resource)` — convenience wrapper

### VITO Commands
- `vitoPatientUpsert(request)` — create/update patient
- `vitoPatientMerge(request)` — merge patients

### Offline Entitlements
- `issueEntitlement(request)` — issue offline entitlement
- `verifyEntitlementOffline(signed)` — verify without network
- `revokeEntitlement(id, reason)` — revoke
- `consumeEntitlement(id)` — mark consumed
