# 05 — State & Storage Map

## React Context / Provider Tree

From `src/App.tsx`, the provider nesting order is:

```
QueryClientProvider (TanStack React Query)
  └─ AuthProvider (src/contexts/AuthContext.tsx)
       └─ FacilityProvider (src/contexts/FacilityContext.tsx)
            └─ WorkspaceProvider (src/contexts/WorkspaceContext.tsx)
                 └─ ShiftProvider (src/contexts/ShiftContext.tsx)
                      └─ TooltipProvider
                           └─ BrowserRouter + Routes
```

Additionally, the Encounter page wraps its content in:
```
ProviderContextProvider (src/contexts/ProviderContext.tsx)
  └─ EHRProvider (src/contexts/EHRContext.tsx)
       └─ EncounterContent
```

### AuthContext (`src/contexts/AuthContext.tsx`)

**Stored state:**
- `user: User | null` — Supabase auth user
- `session: Session | null` — Supabase session
- `profile: Profile | null` — from `profiles` table (id, user_id, display_name, role, specialty, department, phone, license_number, avatar_url, facility_id)
- `loading: boolean`

**Methods:**
- `signUp(email, password, metadata?)` — calls `supabase.auth.signUp` with emailRedirectTo
- `signIn(email, password)` — calls `track-login-attempt` edge function first, then `supabase.auth.signInWithPassword`
- `signOut()` — calls `supabase.auth.signOut`, clears user/session/profile
- `refreshProfile()` — re-fetches profile from `profiles` table

**Side effects:**
- On `SIGNED_IN`: creates/updates `user_sessions` row, calls `geolocate-ip` edge function
- On `SIGNED_OUT`: marks `user_sessions` row as inactive
- Every 5 minutes: updates `last_activity_at` on active session
- On session load: updates `last_active_at` on profile

### FacilityContext (`src/contexts/FacilityContext.tsx`)

**Stored state:**
- `currentFacility: FacilityInfo | null` — id, name, facility_code, facility_type_code, facility_type_name, level_of_care, category, capabilities[], facilityServices[]
- `availableFacilities: FacilityInfo[]`
- `isLoading: boolean`
- `error: string | null`

**Methods:**
- `selectFacility(facilityId)` — fetches from `facility_capabilities` view, stores in sessionStorage
- `clearFacility()` — removes from sessionStorage
- `hasCapability(cap)` / `hasAnyCapability(caps)` / `hasAllCapabilities(caps)` — boolean checks
- `isAtLeastLevel(level)` — checks level_of_care hierarchy

**Persistence:** `sessionStorage.getItem('impilo_current_facility_id')`

### WorkspaceContext (`src/contexts/WorkspaceContext.tsx`)

**Stored state:**
- `currentView: WorkspaceView` — "personal" | "department" | "team"
- `currentDepartment: string` — defaults to "Emergency"
- `careSetting: CareSetting` — "inpatient" | "outpatient" | "emergency" | "all"
- `pageContext: PageContext` — one of 11 sidebar contexts

**Methods:**
- `setCurrentView(view)`, `setCurrentDepartment(dept)` (also updates careSetting), `setPageContext(context)`

**Persistence:** None (in-memory only). PageContext is derived from URL path in AppSidebar on every navigation.

### ShiftContext (`src/contexts/ShiftContext.tsx`)

**Stored state:**
- `activeShift: ActiveShift | null` — from `useWorkspaceData` hook
- `isOnShift: boolean`
- `shiftDuration: number` — minutes, updated every 60s
- `loading: boolean`, `actionLoading: boolean`

**Methods:**
- `startShift(facilityId, workspaceId)` — delegates to `useWorkspaceData`
- `endShift(handoverNotes?, summary?)` — delegates to `useWorkspaceData`
- `transferWorkspace(workspaceId, reason, notes?)` — delegates to `useWorkspaceData`
- `refreshShift()`

### EHRContext (`src/contexts/EHRContext.tsx`)

**Stored state:**
- `patientContext: PatientContext` — isActive, encounterId, patientId, patientName, mrn, accessRequest, lockedAt, source
- `currentEncounter: Encounter | null` — patient object, type, status, admissionDate, attendingPhysician, location
- `activeMenuItem: EncounterMenuItem` — defaults to "overview"
- `activeTopBarAction: TopBarAction | null`
- `activeWorkspace: WorkspaceData | null`
- `activeCriticalEvent: CriticalEventData | null`
- `isConsumablesOpen: boolean`, `isChargesOpen: boolean`

**Methods:**
- `openChart(encounterId, source, reason?)` — loads encounter from DB, logs chart access to `audit_logs`, navigates to `/encounter/:id`
- `closeChart(returnTo?)` — logs chart close to `audit_logs`, clears all state, navigates, shows toast `"Chart closed"`

### ProviderContext (`src/contexts/ProviderContext.tsx`)

**Stored state (mock):**
- `provider: ProviderProfile` — hardcoded mock (Dr. James Mwangi at Parirenyatwa)
- `worklist: WorklistItem[]` — 4 mock referral items
- `stats: DashboardStats` — mock statistics

## sessionStorage Keys

| Key | Value Type | Set By | Read By |
|-----|-----------|--------|---------|
| `activeWorkspace` | JSON `{department, physicalWorkspace, workstation, facility, loginTime}` | Auth.tsx (provider ID login flow) | ModuleHome.tsx, ActiveWorkspaceIndicator |
| `impilo_current_facility_id` | UUID string | FacilityContext.tsx | FacilityContext.tsx |

## localStorage Keys

No localStorage keys observed in contexts or core flows.

## Auth Token Model

- Supabase manages JWT tokens internally via `supabase.auth.getSession()`
- Access token substring (first 50 chars) used as `session_token` in `user_sessions` table
- No custom token management or refresh logic outside Supabase's built-in handling

## Capability Gating Logic

From `src/contexts/FacilityContext.tsx`:

- `MODULE_CAPABILITY_REQUIREMENTS` maps module IDs to required `FacilityCapability[]`
- A module is available if the facility has ANY of the required capabilities
- If no facility is set (`currentFacility === null`), all capabilities return `true` (permissive default)
- Level of care hierarchy: quaternary > tertiary > secondary > primary

From `src/hooks/useUserRoles.ts` (referenced but not shown in full):
- `canAccessModule(roles?)` checks if user's profile role matches any of the allowed roles
- If no roles specified, module is visible to all authenticated users

## Role Checking Functions (Database)

- `has_role(user_id, role)` — checks `user_roles` table
- `has_platform_role(user_id, role_type)` — checks `platform_roles` table
- `has_registry_role(user_id, registry_role)` — checks `registry_admin_roles` table
- `has_above_site_role(user_id)` — checks `above_site_roles` table
- `is_platform_superuser(user_id)` — shorthand for `has_platform_role(user_id, 'platform_superuser')`
- `is_licensed_practitioner(user_id)` — checks `health_providers` + `provider_licenses`
- `can_bypass_restrictions(user_id)` — checks for admin or dev_tester roles
- `can_access_workspace(user_id, workspace_id)` — checks `workspace_memberships` via providers
- `can_access_patient(user_id, patient_id)` — checks encounters, care_plans, orders, referrals
- `can_access_facility_in_jurisdiction(user_id, facility_id)` — checks `jurisdiction_assignments`
