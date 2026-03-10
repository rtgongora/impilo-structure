# Storage & State Map — Impilo vNext Prototype

> **DO NOT CHANGE** — Exact state model from the prototype.

---

## 1. Context Provider Hierarchy

Wrapping order in `App.tsx` (outermost first):

```
QueryClientProvider (react-query)
  └─ AuthProvider
       └─ FacilityProvider
            └─ WorkspaceProvider
                 └─ ShiftProvider
                      └─ TooltipProvider (radix)
                           └─ BrowserRouter
                                └─ Routes
```

### EHR-specific context

The Encounter page (`/encounter*`) uses `EHRContext` (via `EHRProvider`) which manages:
- `activeMenuItem: EncounterMenuItem`
- `activeTopBarAction: TopBarAction | null`
- `isCriticalEventActive: boolean`
- `currentEncounter: Encounter | null`
- `hasActivePatient: boolean`
- `patientContext`
- `activeWorkspace`
- `openWorkspace(type)`, `closeWorkspace()`, `closeChart(redirectTo)`

---

## 2. AuthContext

**File**: `src/contexts/AuthContext.tsx`

### State
| Field | Type | Default | Persisted |
|-------|------|---------|-----------|
| user | User \| null | null | Supabase auth (localStorage) |
| session | Session \| null | null | Supabase auth (localStorage) |
| profile | Profile \| null | null | Fetched from `profiles` table |
| loading | boolean | true | — |

### Profile Shape
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

### Methods
- `signUp(email, password, metadata?)` → calls `supabase.auth.signUp`
- `signIn(email, password)` → calls `track-login-attempt` edge function, then `supabase.auth.signInWithPassword`
- `signOut()` → calls `supabase.auth.signOut`, clears all state
- `refreshProfile()` → re-fetches profile from DB

### Session Tracking
- Creates record in `user_sessions` on SIGNED_IN
- Updates `last_activity_at` every 5 minutes
- Ends session (sets `is_active: false`) on SIGNED_OUT
- Calls `geolocate-ip` edge function for IP geolocation

---

## 3. FacilityContext

**File**: `src/contexts/FacilityContext.tsx`

### State
| Field | Type | Default | Persisted |
|-------|------|---------|-----------|
| currentFacility | FacilityInfo \| null | null | sessionStorage `impilo_current_facility_id` |
| availableFacilities | FacilityInfo[] | [] | — |
| isLoading | boolean | true | — |
| error | string \| null | null | — |

### FacilityInfo Shape
```typescript
interface FacilityInfo {
  id: string;
  name: string;
  facility_code: string | null;
  facility_type_code: string | null;
  facility_type_name: string | null;
  level_of_care: 'primary' | 'secondary' | 'tertiary' | 'quaternary' | null;
  category: string | null;
  capabilities: FacilityCapability[];
  facilityServices: string[];
}
```

### Capability Types (30+)
`theatre, inpatient, icu, maternity, dialysis, radiology, laboratory, pharmacy, pharmacy_basic, blood_bank, dental, mental_health, rehabilitation, physiotherapy, occupational_therapy, emergency_24hr, chemotherapy, radiotherapy, pacs, lims, teleconsult, outpatient, immunization, anc, referral, dispensing, specimen_collection, psychotherapy`

### Methods
- `selectFacility(facilityId)` — fetches from `facility_capabilities` view, stores in sessionStorage
- `clearFacility()` — removes from sessionStorage
- `hasCapability(cap)` — returns true if no facility set (default allow)
- `hasAnyCapability(caps)` — same default behavior
- `hasAllCapabilities(caps)`
- `isAtLeastLevel(level)` — hierarchy check

### Data Source
- Reads from `facility_capabilities` materialized view
- Falls back to profile's `facility_id` if no sessionStorage value

---

## 4. WorkspaceContext

**File**: `src/contexts/WorkspaceContext.tsx`

### State
| Field | Type | Default | Persisted |
|-------|------|---------|-----------|
| currentView | WorkspaceView | "personal" | — |
| currentDepartment | string | "Emergency" | — |
| careSetting | CareSetting | derived from dept | — |
| pageContext | PageContext | "home" | — |

### Types
```typescript
type WorkspaceView = "personal" | "department" | "team";
type CareSetting = "inpatient" | "outpatient" | "emergency" | "all";
type PageContext = "clinical" | "operations" | "scheduling" | "registry" | "admin" | "portal" | "public-health" | "coverage" | "ai" | "omnichannel" | "home";
```

### PageContext Derivation Rules (from URL)
| Path Prefix | Context |
|-------------|---------|
| `/facility-registry`, `/hpr`, `/client-registry`, `/registry` | registry |
| `/encounter`, `/beds`, `/queue`, `/patients` | clinical |
| `/stock`, `/consumables`, `/charges`, `/payments` | operations |
| `/scheduling`, `/appointments`, `/theatre` | scheduling |
| `/public-health` | public-health |
| `/coverage` | coverage |
| `/ai-governance` | ai |
| `/omnichannel` | omnichannel |
| `/admin` | admin |
| `/portal`, `/social` | portal |
| Everything else | home |

### Department → CareSetting Map
Inpatient: Medical Ward, Surgical Ward, ICU, Pediatrics Ward, Maternity Ward, Oncology Ward
Outpatient: General OPD, Dermatology, ENT, Ophthalmology, Dental, Cardiology Clinic
Emergency: Emergency, Casualty, Trauma
All: Pharmacy, Laboratory, Radiology

---

## 5. ShiftContext

**File**: `src/contexts/ShiftContext.tsx`

### State
| Field | Type | Default | Persisted |
|-------|------|---------|-----------|
| activeShift | ActiveShift \| null | null | DB (shifts table) |
| isOnShift | boolean | false | — |
| shiftDuration | number (minutes) | 0 | — (computed) |
| loading | boolean | — | — |
| actionLoading | boolean | — | — |

### Methods
- `startShift(facilityId, workspaceId)` → DB insert
- `endShift(handoverNotes?, summary?)` → DB update
- `transferWorkspace(workspaceId, reason, notes?)` → DB update
- `refreshShift()` → re-fetch from DB

### Duration Update
- Computed every 60 seconds via `setInterval`

---

## 6. Active Work Context (Hook, not Context)

**File**: `src/hooks/useActiveWorkContext.ts`

### State (component-local, managed via useState)
| Field | Type |
|-------|------|
| activeContext | ActiveWorkContext \| null |
| hasActiveContext | boolean |

### ActiveWorkContext Shape
```typescript
interface ActiveWorkContext {
  type: WorkContextType; // facility | above_site | remote | combined | support | independent | emergency | community
  accessMode: AccessMode; // clinical | oversight | ... | community
  facilityId?: string;
  facilityName?: string;
  facilityType?: string;
  contextLabel: string;
  // ... additional fields per type
}
```

### Selection Methods
- `selectFacility(facility)` — clinical access mode
- `selectAboveSite(context)` — oversight access mode
- `selectCombinedView()` — multi-facility
- `selectRemote()` — remote clinical/admin
- `selectSupportMode()` — system support
- `selectIndependentPractice()` — independent
- `selectEmergencyWork()` — emergency
- `selectCommunityOutreach()` — community
- `switchContext()` — clears and re-selects

---

## 7. sessionStorage Keys

| Key | Written By | Read By | Shape |
|-----|-----------|---------|-------|
| `activeWorkspace` | Auth.tsx (provider login) | Various | `{ department: string, physicalWorkspace: object, workstation?: string, facility?: string, loginTime: string }` |
| `impilo_current_facility_id` | FacilityContext | FacilityContext | UUID string |

---

## 8. localStorage Keys (Supabase-managed)

| Key | Purpose |
|-----|---------|
| `sb-{projectRef}-auth-token` | Supabase auth session token (auto-managed) |

---

## 9. React Query Cache Keys

Used via `@tanstack/react-query` but specific cache key patterns are UNKNOWN without inspecting individual hooks. Key hooks that likely use react-query:
- `useWorkspaceData`
- `useDashboardData`
- `useQueueData`
- `useBedData`
- `useLabData`
- `usePrescriptionData`
- `useStockManagement`
- `useClientRegistryData`
- `useFacilityData`
- Various admin page data hooks
