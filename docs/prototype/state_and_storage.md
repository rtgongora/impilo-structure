# Impilo vNext — State & Storage Model

> Documents authentication, session persistence, context management, and storage patterns.

---

## 1. Authentication Model

**Provider**: Supabase Auth (via `@supabase/supabase-js`)

**Client**: `src/integrations/supabase/client.ts` (auto-generated, not editable)

**Auth Context**: `src/contexts/AuthContext.tsx`

### Auth State

```typescript
interface AuthContextType {
  user: User | null;           // Supabase User object
  session: Session | null;     // Supabase Session
  profile: Profile | null;     // Custom profiles table data
  loading: boolean;
  signUp, signIn, signOut, refreshProfile
}
```

### Profile Schema

```typescript
interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  role: 'doctor' | 'nurse' | 'specialist' | 'patient' | 'admin' | 'client';
  specialty: string | null;
  department: string | null;
  phone: string | null;
  license_number: string | null;
  avatar_url: string | null;
  facility_id: string | null;
}
```

### Auth Flow

1. `supabase.auth.onAuthStateChange` listener registered FIRST
2. `supabase.auth.getSession()` called to check existing session
3. On `SIGNED_IN`: Profile fetched, session created in `user_sessions` table
4. On `SIGNED_OUT`: Session ended in `user_sessions` table
5. Activity tracking: Session updated every 5 minutes

### Login Attempt Tracking

- Pre-login: Edge function `track-login-attempt` called with `success: false`
- If account locked: Returns `{ locked: true, message }` → login blocked
- Post-success: Edge function called with `success: true`

### Session Tracking (user_sessions table)

```typescript
{
  user_id, session_token (first 50 chars of access_token),
  user_agent, device_info ('Mobile'|'Tablet'|'Desktop'),
  is_active, last_activity_at, ended_at, ip_address (via geolocate-ip)
}
```

---

## 2. Session Persistence

### Supabase Auth Session
- **Storage**: Managed by `@supabase/supabase-js` internally (localStorage by default)
- **Persistence**: Survives page refresh, persists until sign out or token expiry

### Active Workspace (sessionStorage)
- **Key**: `activeWorkspace`
- **Set during**: Provider ID → Biometric → Workspace login flow
- **Schema**:
```json
{
  "department": "Emergency",
  "physicalWorkspace": { "id": "...", "name": "Resus Bay" },
  "workstation": "WS-01",
  "facility": "Parirenyatwa Hospital",
  "loginTime": "2025-01-15T08:00:00.000Z"
}
```
- **Lifetime**: Session only (cleared on tab close)

---

## 3. React Context Providers

Provider hierarchy (from `App.tsx`):

```
QueryClientProvider
  └── AuthProvider
        └── FacilityProvider
              └── WorkspaceProvider
                    └── ShiftProvider
                          └── TooltipProvider
                                └── BrowserRouter / Routes
```

### AuthContext (`src/contexts/AuthContext.tsx`)
- Manages: user, session, profile, loading
- Provides: signUp, signIn, signOut, refreshProfile

### FacilityContext (`src/contexts/FacilityContext.tsx`)
- **State**:
  - `currentFacility: FacilityInfo | null`
  - `availableFacilities: FacilityInfo[]`
  - `isLoading, error`
- **Capability System**: 27 facility capabilities (theatre, inpatient, icu, maternity, etc.)
- **Methods**: `hasCapability()`, `hasAnyCapability()`, `hasAllCapabilities()`, `isAtLeastLevel()`
- **Level of care hierarchy**: primary < secondary < tertiary < quaternary

### WorkspaceContext (`src/contexts/WorkspaceContext.tsx`)
- **State**:
  - `currentView: 'personal' | 'department' | 'team'`
  - `currentDepartment: string` (default: "Emergency")
  - `careSetting: 'inpatient' | 'outpatient' | 'emergency' | 'all'`
  - `pageContext: PageContext` (10 values: clinical, operations, scheduling, registry, admin, portal, public-health, coverage, ai, omnichannel, home)
- **Auto-derived**: `pageContext` from URL path in `AppSidebar`
- **Department → CareSetting mapping**: Hardcoded (e.g., "Medical Ward" → inpatient, "Emergency" → emergency)

### ShiftContext (`src/contexts/ShiftContext.tsx`)
- UNKNOWN/NOT OBSERVED in detail — manages active shift state

### EHRContext (`src/contexts/EHRContext.tsx`)
- **Only active on `/encounter` routes** (provided by `<EHRProvider>`)
- **State**:
  - `patientContext: PatientContext` (isActive, encounterId, patientId, patientName, mrn, accessRequest, lockedAt, source)
  - `currentEncounter: Encounter | null`
  - `activeMenuItem: EncounterMenuItem` (overview, assessment, problems, orders, care, consults, notes, outcome)
  - `activeTopBarAction: TopBarAction | null` (10 actions)
  - `activeWorkspace: WorkspaceData | null`
  - `activeCriticalEvent: CriticalEventData | null`
  - `isConsumablesOpen, isChargesOpen`

### ProviderContext (`src/contexts/ProviderContext.tsx`)
- **Only active on `/encounter` routes** (provided by `<ProviderContextProvider>`)
- UNKNOWN/NOT OBSERVED in detail

---

## 4. Feature Flags

No explicit feature flag system observed. Feature visibility is controlled via:

1. **Role-based filtering**: Module `roles[]` arrays in `ModuleHome.tsx` category definitions
2. **Capability-based filtering**: Module `capabilities[]` arrays checked against facility capabilities
3. **URL-based secrets**: Maintenance login via `?mode=maintenance`
4. **Keyboard shortcuts**: Ctrl+Shift+M for maintenance mode reveal

---

## 5. Offline Entitlements Storage

### Kernel-level implementation (code, not UI)

- **File**: `src/lib/kernel/audit/` — Audit ledger module
- **Types**: `AuditRecord, AuditRecordInput, AuditActor, AuditDecision, ChainVerificationResult`
- **Functions**: `appendAuditRecord, verifyChain, listByCorrelationId, getAuditChain, clearAuditLedger, logPolicyDecision`

### Database table
- `offline_entitlements` table exists (trigger `update_offline_entitlements_updated_at`)
- **UI surface**: `/admin/tshepo/offline` (TshepoOfflineStatus component)

### Offline trust model (from architecture memory)
- Entitlements signed with Ed25519
- Max TTL: 6 hours
- Persisted in Postgres before issuance
- Every issuance/consumption/revocation recorded in Audit Ledger

---

## 6. Audit/Log Storage Surfaces

### Supabase Tables

| Table | Purpose |
|-------|---------|
| `audit_logs` | General audit trail (action, entity_type, entity_id, old/new values) |
| `above_site_audit_log` | Above-site user actions |
| `tshepo_audit_ledger` | TSHEPO trust layer audit (chained, with record_hash) |
| `provider_registry_logs` | Provider login/action tracking |
| `provider_state_transitions` | Provider lifecycle state changes |
| `client_state_transitions` | Client lifecycle state changes |
| `client_registry_events` | Client registry events (health_id_issued, client_deceased, identity_merged) |
| `queue_transitions` | Queue item status transitions |
| `eligibility_decisions` | Provider eligibility check decisions |
| `idp_revocation_events` | Identity provider revocation events |

### UI Surfaces

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin?tab=audit` | AdminDashboard | General audit log viewer |
| `/admin/tshepo/audit` | TshepoAuditSearch | TSHEPO audit ledger search |
| `/admin/tshepo/access-history` | TshepoPatientAccessHistory | Patient data access history |
| `/admin/vito/audit` | VitoAuditViewer | VITO audit trail |
| `/admin/vito/events` | VitoEventsViewer | Client registry event stream |

---

## 7. Data Fetching Patterns

### React Query
- `QueryClient` instantiated in `App.tsx`
- Used for data fetching/caching across the app
- No custom default options observed

### Custom Hooks (85+ hooks in `src/hooks/`)
Major hooks:
- `useAuth()` — Auth state
- `useWorkspace()` — Workspace context
- `useUserRoles()` — Role-based access (ModuleAccessRole type)
- `useModuleAvailability()` / `useFacilityCapabilities()` — Facility capability checks
- `useActiveWorkContext()` — Active work context management
- `useProviderFacilities()` — Provider facility affiliations
- `useAboveSiteRole()` — Above-site role detection
- `useSystemRoles()` — System role management
- `useLicenseCheck()` — License validity
- `useTelemedicinePools()` — Virtual pool management
- `useDashboardData()` — Dashboard aggregations
- `useQueueManagement()` — Queue CRUD
- `useBedData()` — Bed management
- `useStockManagement()` — Inventory
- `useShiftManagement()` — Shift operations
- `useIdempotentMutation()` — Idempotent mutation helper
- `useKernelRequest()` — Kernel service request helper
- `useKernelError()` — Kernel error handling
- `useFederationGuard()` — Federation authority guard
- `usePIIProtection()` — PII protection helper

---

## 8. Tenant/Organization Context

### Multi-tenancy
- Not a traditional multi-tenant SaaS — instead uses facility/jurisdiction-based access
- Users belong to organizations via `organization_staff` table
- Facilities are the primary organizational unit
- Above-site users operate across facilities within jurisdiction scope

### Jurisdiction Model
- National → Province → District → Facility List
- Stored in `jurisdiction_assignments` table
- Checked via `can_access_facility_in_jurisdiction()` function

---

## 9. Environment Variables

Auto-configured (not editable):
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Anon key
- `VITE_SUPABASE_PROJECT_ID` — Project ID

---

## 10. PWA / Offline

- `vite-plugin-pwa` is installed as a dependency
- `/install` page exists for PWA installation
- Full offline data sync strategy UNKNOWN/NOT OBSERVED in UI
- `src/components/sync/` directory exists (conflict resolution & sync status)
