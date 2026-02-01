# Impilo EHR - Provider Journey Documentation

## Document Purpose
This document provides a complete technical specification of the provider journey from identity registration through daily clinical/operational work to professional development. It covers both regulated practitioners (clinical) and unregulated staff (non-clinical).

---

## Table of Contents
1. [Provider Identity & Registration](#1-provider-identity--registration)
2. [Authentication Flow](#2-authentication-flow)
3. [Workspace & Facility Selection](#3-workspace--facility-selection)
4. [Shift Management](#4-shift-management)
5. [Clinical Provider Journey](#5-clinical-provider-journey)
6. [Non-Clinical Provider Journey](#6-non-clinical-provider-journey)
7. [Above-Site & Oversight Roles](#7-above-site--oversight-roles)
8. [Professional Development](#8-professional-development)
9. [State Machines & Transitions](#9-state-machines--transitions)
10. [Technical Implementation](#10-technical-implementation)

---

## 1. Provider Identity & Registration

### 1.1 Provider Classification

The platform distinguishes between two fundamental provider types:

```typescript
type ProviderType = 'regulated' | 'unregulated';

interface RegulatedPractitioner {
  // Licensed healthcare professionals
  upid: string;                    // Universal Provider ID (from HPR)
  cadre: ClinicalCadre;            // doctor, nurse, midwife, CHW, allied_health, specialist
  licenses: ProfessionalLicense[]; // Active professional registrations
  councilRegistrations: CouncilRegistration[];
  canPerformClinicalActs: true;
}

interface UnregulatedStaff {
  // Administrative/support personnel
  staffId: string;                 // Organization-issued ID
  role: AdministrativeRole;        // clerk, porter, receptionist, manager, etc.
  department: string;
  canPerformClinicalActs: false;
}
```

### 1.2 Health Provider Registry (HPR) Integration

The HPR (based on iHRIS/Varapi) serves as the authoritative source for practitioner identity:

```typescript
interface HealthProvider {
  id: string;                      // Internal UUID
  upid: string;                    // Universal Provider ID (format: PRV-XXXXXX)
  user_id: string | null;          // Link to auth.users
  
  // Demographics
  national_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  
  // Professional Identity
  cadre: string;                   // Primary clinical role
  specialties: string[];           // Additional specializations
  
  // Verification Status
  status: 'active' | 'suspended' | 'inactive' | 'pending_verification';
  verified_at: string | null;
  verification_method: string | null;
  
  // Biometric Templates (encrypted references)
  biometric_enrolled: boolean;
  biometric_modalities: ('fingerprint' | 'facial' | 'iris')[];
}
```

### 1.3 Licensing & Credentials

```typescript
interface ProfessionalLicense {
  id: string;
  provider_id: string;
  council_id: string;              // Regulatory body (e.g., MDPCZ, NCZ)
  registration_number: string;     // Council-issued number
  license_type: string;            // Full, provisional, specialist
  
  // Validity
  issued_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  
  // Scope
  practice_scope: string[];        // Authorized clinical activities
  restrictions: string[];          // Any limitations
}
```

### 1.4 Facility Affiliations

Providers can have multiple concurrent relationships with facilities:

```typescript
interface ProviderAffiliation {
  id: string;
  provider_id: string;
  facility_id: string;
  
  // Relationship Type
  affiliation_type: 'employment' | 'locum' | 'honorary' | 'visiting' | 'ownership';
  
  // Role at Facility
  department: string;
  position: string;
  is_primary: boolean;
  
  // Regulatory Status
  is_practitioner_in_charge: boolean;  // PIC designation
  
  // Validity
  start_date: string;
  end_date: string | null;
  status: 'active' | 'inactive' | 'pending';
  
  // Privileges
  granted_privileges: string[];
  workspace_access: string[];      // Authorized workspaces/units
}
```

---

## 2. Authentication Flow

### 2.1 Authentication Pathways

The platform supports four distinct login pathways:

| Pathway | Risk Level | User Type | Primary Method |
|---------|------------|-----------|----------------|
| Provider ID & Biometric | Low | Clinical Staff | UPID + Fingerprint/Face |
| Patient Portal | Low | Clients/Patients | Phone/Email + OTP |
| Staff Email | Medium | Unregulated Staff | Email + Password |
| System Maintenance | High | Platform Admins | Hidden + MFA |

### 2.2 Clinical Provider Authentication

**Step 1: Provider ID Lookup**
```typescript
// ProviderIdLookup.tsx
interface ProviderLookupState {
  providerId: string;              // User enters UPID or searches by name
  searchResults: HealthProvider[];
  selectedProvider: HealthProvider | null;
}

// Lookup triggers HPR query
const lookupProvider = async (query: string) => {
  // Search by UPID, name, or council registration
  const provider = await HPRService.searchProvider(query);
  
  // Verify provider status
  if (provider.status !== 'active') {
    throw new Error('Provider account is not active');
  }
  
  // Check license validity
  const eligibility = await HPRService.checkEligibility(provider.id);
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason_codes.join(', '));
  }
  
  return provider;
};
```

**Step 2: Biometric Verification**
```typescript
// BiometricVerification.tsx
interface BiometricState {
  provider: HealthProvider;
  modality: 'fingerprint' | 'facial' | 'iris';
  capturedTemplate: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
}

const verifyBiometric = async (
  providerId: string,
  template: string,
  modality: string
) => {
  // Match against enrolled templates
  const result = await BiometricService.verify({
    providerId,
    template,
    modality,
    threshold: 0.85  // Match confidence threshold
  });
  
  if (!result.matched) {
    // Log failed attempt
    await AuditService.log({
      action: 'biometric_verification_failed',
      providerId,
      modality,
      confidence: result.confidence
    });
    throw new Error('Biometric verification failed');
  }
  
  return result;
};
```

**Step 3: Session Establishment**
```typescript
// After successful verification
const establishSession = async (provider: HealthProvider) => {
  // Create authenticated session
  const { data: session } = await supabase.auth.signInWithPassword({
    email: provider.email,
    password: await generateSessionToken(provider.id)
  });
  
  // Link provider context
  await ProviderContext.setProvider(provider);
  
  // Log successful authentication
  await AuditService.log({
    action: 'provider_authenticated',
    providerId: provider.id,
    method: 'biometric',
    timestamp: new Date().toISOString()
  });
  
  return session;
};
```

### 2.3 IdP Authorization Flow

The Identity Provider (IdP) service implements IDP-FR requirements:

```typescript
// idpService.ts
interface AuthorizationResult {
  authorized: boolean;
  provider: HealthProvider | null;
  eligibility: EligibilityResponse | null;
  claims: Partial<IdPTokenClaims> | null;
  denialReasons: string[];
}

const authorizeCurrentUser = async (
  requestedRole?: string,
  requestedPrivileges?: string[],
  facilityContext?: string
): Promise<AuthorizationResult> => {
  // Step 1: Verify authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { authorized: false, denialReasons: ['USER_NOT_AUTHENTICATED'] };
  }
  
  // Step 2: Retrieve linked provider (IDP-FR-012)
  const provider = await HPRService.getProviderByUserId(user.id);
  if (!provider) {
    return { authorized: false, denialReasons: ['NO_LINKED_PROVIDER'] };
  }
  
  // Step 3: Check HPR eligibility
  const eligibility = await HPRService.checkEligibility(
    provider.id,
    requestedRole,
    requestedPrivileges,
    facilityContext
  );
  
  // Step 4: Evaluate policy
  if (!eligibility.eligible) {
    return {
      authorized: false,
      provider,
      eligibility,
      denialReasons: eligibility.reason_codes
    };
  }
  
  // Step 5: Build token claims (IDP-FR-021)
  const claims: Partial<IdPTokenClaims> = {
    sub: user.id,
    provider_id: provider.upid,
    cadre: provider.cadre,
    roles: eligibility.roles,
    privileges: eligibility.privileges,
    facility_scope: eligibility.facility_scope,
    license_expiry: eligibility.license_valid_until,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  
  return { authorized: true, provider, eligibility, claims, denialReasons: [] };
};
```

---

## 3. Workspace & Facility Selection

### 3.1 Context Inheritance Model

```typescript
interface WorkContext {
  // Organization Level
  organization_id: string | null;  // For multi-tenant deployments
  
  // Facility Level
  facility_id: string;
  facility_name: string;
  facility_type: FacilityType;
  facility_level: 'primary' | 'secondary' | 'tertiary' | 'quaternary';
  
  // Physical Location
  department: string;
  ward: string | null;
  room: string | null;
  workstation_id: string | null;
  
  // Operational Context
  service_point: string;           // e.g., "OPD", "Emergency", "Theatre"
  queue_id: string | null;         // Associated queue
  
  // Detection Method
  context_source: 'manual' | 'device' | 'gps' | 'ip';
}
```

### 3.2 Workplace Selection Flow

**For providers with single affiliation:**
```
Authentication → Auto-select Facility → Select Department/Unit → Start Shift
```

**For providers with multiple affiliations:**
```
Authentication → Select Organization (if multi-tenant) → Select Facility → 
Select Department/Unit → Start Shift
```

### 3.3 Context Detection Methods

```typescript
// Context can be auto-detected on fixed workstations
interface ContextDetection {
  // Method 1: Device Fingerprinting
  deviceId: string;                // Known workstation
  registeredFacility: string;
  
  // Method 2: IP Detection
  ipAddress: string;
  networkFacility: string;         // Facility network mapping
  
  // Method 3: GPS (mobile)
  coordinates: { lat: number; lng: number };
  nearestFacility: string;
}

const detectContext = async (): Promise<WorkContext | null> => {
  // Check device registry
  const device = await DeviceRegistry.lookup(getDeviceFingerprint());
  if (device?.facility_id) {
    return buildContext(device.facility_id, 'device');
  }
  
  // Check network mapping
  const network = await NetworkMapping.lookup(getClientIP());
  if (network?.facility_id) {
    return buildContext(network.facility_id, 'ip');
  }
  
  // GPS fallback (mobile only)
  if (isMobileDevice()) {
    const coords = await getGeolocation();
    const facility = await FacilityRegistry.findNearest(coords);
    if (facility && facility.distance < 100) { // Within 100m
      return buildContext(facility.id, 'gps');
    }
  }
  
  return null; // Manual selection required
};
```

### 3.4 Facility Capability Sensitivity

The selected workspace drives UI filtering:

```typescript
interface FacilityCapabilities {
  facility_id: string;
  facility_type: string;
  level_of_care: number;           // 1-4
  
  // Available Services (from service_catalog)
  services: string[];              // e.g., ["outpatient", "emergency", "surgery"]
  
  // Module Availability
  available_modules: string[];     // Filtered based on capabilities
  available_workspaces: string[];  // e.g., ["ICU", "Theatre"] only if capable
  available_pathways: string[];    // e.g., ["Chemotherapy"] only if oncology
  
  // Equipment/Resources
  has_pacs: boolean;
  has_lims: boolean;
  has_pharmacy: boolean;
}

// UI adapts based on capabilities
const filterModules = (
  allModules: Module[],
  capabilities: FacilityCapabilities
): Module[] => {
  return allModules.filter(module => 
    capabilities.available_modules.includes(module.id) ||
    module.alwaysAvailable
  );
};
```

---

## 4. Shift Management

### 4.1 Shift Lifecycle

```
Not Started → Starting → Active → Ending → Ended
                ↓           ↓
            Cancelled    Paused (break)
```

### 4.2 Start Shift Workflow

```typescript
interface ShiftStartRequest {
  provider_id: string;
  facility_id: string;
  department: string;
  workspace_id: string;
  
  // Shift Details
  shift_type: 'day' | 'night' | 'call' | 'on_demand';
  planned_start: string;
  planned_end: string;
  
  // Role Context
  role_during_shift: string;       // May differ from primary role
  supervising_provider_id?: string;
}

const startShift = async (request: ShiftStartRequest): Promise<Shift> => {
  // Validate provider eligibility for this workspace
  const eligible = await validateWorkspaceAccess(
    request.provider_id,
    request.workspace_id
  );
  
  if (!eligible) {
    throw new Error('Not authorized for this workspace');
  }
  
  // Check for existing active shifts
  const existingShift = await getActiveShift(request.provider_id);
  if (existingShift) {
    throw new Error('Already have an active shift at ' + existingShift.facility_name);
  }
  
  // Create shift record
  const shift = await supabase.from('shifts').insert({
    ...request,
    status: 'active',
    actual_start: new Date().toISOString(),
    created_at: new Date().toISOString()
  });
  
  // Initialize workspace context
  await WorkspaceContext.initialize({
    shift_id: shift.id,
    facility_id: request.facility_id,
    workspace_id: request.workspace_id
  });
  
  // Join facility queues
  await QueueService.assignProviderToQueues(
    request.provider_id,
    request.workspace_id
  );
  
  // Log shift start
  await AuditService.log({
    action: 'shift_started',
    provider_id: request.provider_id,
    facility_id: request.facility_id,
    workspace_id: request.workspace_id
  });
  
  return shift;
};
```

### 4.3 Active Shift Operations

During an active shift, the provider has access to:

```typescript
interface ActiveShiftContext {
  shift: Shift;
  provider: HealthProvider;
  facility: Facility;
  workspace: Workspace;
  
  // Assigned Work
  queues: Queue[];                 // Assigned service point queues
  worklist: WorklistItem[];        // Personal task list
  activeEncounters: Encounter[];   // Open patient charts
  
  // Team Context
  colleagues: ProviderSummary[];   // Others on shift
  supervisors: ProviderSummary[];
  
  // Operational Data
  pendingOrders: Order[];          // Orders awaiting action
  pendingResults: Result[];        // Results requiring review
  pendingHandoffs: Handoff[];      // Incoming handoffs
}
```

### 4.4 End Shift Workflow

```typescript
interface ShiftEndRequest {
  shift_id: string;
  
  // Reconciliation
  open_encounters: EncounterHandoff[];
  pending_orders: OrderHandoff[];
  pending_tasks: TaskHandoff[];
  
  // Handoff Notes
  handoff_notes: string;
  critical_alerts: string[];
  
  // Successor
  handoff_to_provider_id?: string;
  handoff_to_role?: string;        // If no specific provider
}

const endShift = async (request: ShiftEndRequest): Promise<void> => {
  // Validate all work is reconciled
  const unreconciled = await validateReconciliation(request);
  
  if (unreconciled.hasOpenItems) {
    throw new Error('Cannot end shift with unreconciled items');
  }
  
  // Process handoffs
  for (const encounter of request.open_encounters) {
    await processEncounterHandoff(encounter);
  }
  
  for (const order of request.pending_orders) {
    await processOrderHandoff(order);
  }
  
  // Update shift record
  await supabase.from('shifts').update({
    status: 'ended',
    actual_end: new Date().toISOString(),
    handoff_notes: request.handoff_notes,
    handoff_to: request.handoff_to_provider_id
  }).eq('id', request.shift_id);
  
  // Clear workspace context
  await WorkspaceContext.clear();
  
  // Remove from queues
  await QueueService.removeProviderFromQueues(request.shift_id);
  
  // Log shift end
  await AuditService.log({
    action: 'shift_ended',
    shift_id: request.shift_id,
    open_encounters_handed_off: request.open_encounters.length,
    pending_orders_handed_off: request.pending_orders.length
  });
};
```

---

## 5. Clinical Provider Journey

### 5.1 Provider Dashboard (No Active Patient)

When no patient chart is open, the provider sees the clinical command center:

```typescript
// NoPatientSelected.tsx - Provider Dashboard
interface ProviderDashboard {
  tabs: [
    'queues',      // Assigned queue items
    'results',     // Pending results for review
    'tasks',       // Personal clinical tasks
    'alerts',      // Critical notifications
    'referrals',   // Incoming/outgoing referrals
    'stock',       // Ward stock alerts
    'handoff'      // Shift handoff items
  ];
  
  // Quick Actions
  actions: [
    'patient_search',
    'new_encounter',
    'view_schedule',
    'team_status'
  ];
}
```

### 5.2 Queue-to-Chart Workflow

```typescript
// Patient selection from queue
const selectPatientFromQueue = async (queueItem: QueueItem) => {
  // Pre-authorization check (queue source = pre-authorized)
  const authorization = {
    source: 'queue' as PatientContextSource,
    reason: 'queue_assignment' as ChartAccessReason,
    preAuthorized: true
  };
  
  // Log chart access
  await supabase.from('audit_logs').insert({
    entity_type: 'patient_chart',
    entity_id: queueItem.encounter_id,
    action: 'chart_access_queue',
    performed_by: currentProvider.id,
    metadata: {
      patient_id: queueItem.patient_id,
      access_reason: 'queue_assignment',
      source: 'queue'
    }
  });
  
  // Update queue item status
  await supabase.from('queue_items').update({
    status: 'in_service',
    called_at: new Date().toISOString(),
    serving_provider_id: currentProvider.id
  }).eq('id', queueItem.id);
  
  // Navigate to encounter
  navigate(`/encounter/${queueItem.encounter_id}?source=queue`);
};
```

### 5.3 Clinical Encounter Flow

```
Overview → Assessment → Problems → Orders → Care → Consults → Notes → Outcome
```

**Each section's clinical workflow:**

```typescript
// Section workflows
const encounterSections = {
  overview: {
    // Quick view of patient context
    components: ['PatientBanner', 'VitalsSummary', 'ActiveProblems', 'RecentOrders'],
    actions: ['escalate', 'transfer', 'admit']
  },
  
  assessment: {
    // Clinical evaluation
    tabs: ['triage', 'history', 'exam', 'vitals', 'pain', 'functional', 'risk'],
    acuityScoring: true,
    triageRequired: true  // For ED/OPD
  },
  
  problems: {
    // Problem list management
    actions: ['add_diagnosis', 'resolve_problem', 'link_to_order'],
    codingSystems: ['ICD-10', 'SNOMED-CT']
  },
  
  orders: {
    // Order entry
    categories: ['medications', 'labs', 'imaging', 'procedures', 'consults', 'nursing'],
    workflow: 'Draft → Signed → Verified → Active → Completed',
    requiresPrivilege: true
  },
  
  care: {
    // Nursing/inpatient care
    modules: ['MAR', 'FluidBalance', 'NursingTasks', 'Vitals'],
    shiftBased: true
  },
  
  consults: {
    // Specialty referrals
    types: ['internal', 'external', 'telehealth'],
    urgencyLevels: ['routine', 'urgent', 'emergent']
  },
  
  notes: {
    // Clinical documentation
    templates: ['progress', 'admission', 'discharge', 'procedure', 'consult'],
    requiresSignature: true
  },
  
  outcome: {
    // Disposition
    options: ['discharge', 'admit', 'transfer', 'refer', 'death'],
    generates: ['DischargeSummary', 'IPS', 'Prescriptions', 'FollowUp']
  }
};
```

### 5.4 Order Lifecycle

```typescript
type OrderStatus = 
  | 'draft'           // Being composed
  | 'pending_cosign'  // Awaiting supervisor approval
  | 'signed'          // Provider signed, awaiting verification
  | 'verified'        // Pharmacist/nurse verified
  | 'active'          // In progress
  | 'on_hold'         // Temporarily paused
  | 'completed'       // Fulfilled
  | 'cancelled'       // Cancelled before completion
  | 'discontinued';   // Stopped during active phase

interface OrderTransition {
  from: OrderStatus;
  to: OrderStatus;
  action: string;
  requiredRole: string[];
  requiresReason: boolean;
}

const orderTransitions: OrderTransition[] = [
  { from: 'draft', to: 'signed', action: 'sign', requiredRole: ['doctor', 'nurse'], requiresReason: false },
  { from: 'draft', to: 'pending_cosign', action: 'submit_for_cosign', requiredRole: ['intern', 'student'], requiresReason: false },
  { from: 'pending_cosign', to: 'signed', action: 'cosign', requiredRole: ['doctor', 'specialist'], requiresReason: false },
  { from: 'signed', to: 'verified', action: 'verify', requiredRole: ['pharmacist', 'nurse'], requiresReason: false },
  { from: 'verified', to: 'active', action: 'activate', requiredRole: ['system', 'nurse'], requiresReason: false },
  { from: 'active', to: 'completed', action: 'complete', requiredRole: ['nurse', 'lab_tech'], requiresReason: false },
  { from: 'active', to: 'on_hold', action: 'hold', requiredRole: ['doctor', 'nurse'], requiresReason: true },
  { from: 'active', to: 'discontinued', action: 'discontinue', requiredRole: ['doctor'], requiresReason: true },
  { from: 'on_hold', to: 'active', action: 'resume', requiredRole: ['doctor', 'nurse'], requiresReason: false },
];
```

### 5.5 Cadre-Sensitive UX

UI complexity adapts based on provider cadre:

```typescript
interface CadreUIConfig {
  cadre: ClinicalCadre;
  
  // Form Complexity
  formLevel: 'simplified' | 'standard' | 'full';
  
  // Decision Support
  showDangerSigns: boolean;        // Prominent for CHW
  showReferralPrompts: boolean;    // For lower cadres
  showOverrideOptions: boolean;    // For specialists
  
  // Available Sections
  encounterSections: string[];     // Filtered by scope
  orderCategories: string[];       // Filtered by privilege
  
  // Workspaces
  availableWorkspaces: string[];   // ICU only for qualified
}

const cadreConfigs: Record<ClinicalCadre, CadreUIConfig> = {
  chw: {
    cadre: 'chw',
    formLevel: 'simplified',
    showDangerSigns: true,
    showReferralPrompts: true,
    showOverrideOptions: false,
    encounterSections: ['overview', 'assessment', 'outcome'],
    orderCategories: [],  // Cannot order
    availableWorkspaces: ['community', 'outreach']
  },
  
  nurse: {
    cadre: 'nurse',
    formLevel: 'standard',
    showDangerSigns: true,
    showReferralPrompts: true,
    showOverrideOptions: false,
    encounterSections: ['overview', 'assessment', 'problems', 'orders', 'care', 'notes', 'outcome'],
    orderCategories: ['nursing', 'labs_basic'],
    availableWorkspaces: ['opd', 'ward', 'emergency']
  },
  
  doctor: {
    cadre: 'doctor',
    formLevel: 'full',
    showDangerSigns: false,
    showReferralPrompts: false,
    showOverrideOptions: true,
    encounterSections: ['*'],  // All sections
    orderCategories: ['*'],    // All categories
    availableWorkspaces: ['*'] // All workspaces
  },
  
  specialist: {
    cadre: 'specialist',
    formLevel: 'full',
    showDangerSigns: false,
    showReferralPrompts: false,
    showOverrideOptions: true,
    encounterSections: ['*'],
    orderCategories: ['*'],
    availableWorkspaces: ['*']
  }
};
```

---

## 6. Non-Clinical Provider Journey

### 6.1 Administrative Staff Workflow

```typescript
interface AdministrativeContext {
  role: 'clerk' | 'receptionist' | 'scheduler' | 'billing' | 'records';
  
  // Available Modules
  modules: {
    registration: boolean;         // Patient registration
    scheduling: boolean;           // Appointment booking
    billing: boolean;              // Charge capture, invoicing
    records: boolean;              // HIM functions
    reporting: boolean;            // Administrative reports
  };
  
  // Restricted from
  restricted: [
    'clinical_documentation',
    'order_entry',
    'medication_administration',
    'clinical_decision_support'
  ];
}
```

### 6.2 Registration Clerk Journey

```
Login → Select Workstation → Start Shift → 
  → Patient Registration
  → Appointment Scheduling
  → Queue Assignment
  → Insurance Verification
→ End Shift
```

### 6.3 Billing Staff Journey

```
Login → Select Workstation → Start Shift →
  → Charge Review
  → Insurance Claims
  → Payment Processing
  → Account Reconciliation
→ End Shift
```

### 6.4 Support Staff Journey

```typescript
interface SupportStaffContext {
  role: 'porter' | 'cleaner' | 'maintenance' | 'security';
  
  // Task-Based Work
  taskQueue: Task[];
  assignedAreas: string[];
  
  // Restricted
  canAccessPatientData: false;
  canEnterClinicalAreas: boolean;  // Based on role
}
```

---

## 7. Above-Site & Oversight Roles

### 7.1 Above-Site Role Types

```typescript
type AboveSiteRoleType = 
  | 'district_manager'
  | 'provincial_director'
  | 'national_admin'
  | 'programme_officer'
  | 'quality_assurance'
  | 'auditor';

interface AboveSiteRole {
  id: string;
  user_id: string;
  role_type: AboveSiteRoleType;
  
  // Jurisdiction
  jurisdiction_level: 'district' | 'province' | 'national';
  jurisdiction_scope: string[];    // List of district/province codes
  
  // Permissions
  can_access_patient_data: boolean;
  can_intervene: boolean;          // Override facility decisions
  can_act_as: boolean;             // Impersonate facility user
  
  // Status
  is_active: boolean;
  effective_from: string;
  effective_to: string | null;
}
```

### 7.2 Above-Site Session

```typescript
interface AboveSiteSession {
  id: string;
  above_site_role_id: string;
  user_id: string;
  
  // Context Selection
  context_type: 'aggregated' | 'facility_specific';
  context_label: string;
  
  // Jurisdiction Filter
  selected_province: string | null;
  selected_district: string | null;
  selected_facility_id: string | null;
  
  // Act-As Mode (requires enhanced audit)
  is_acting_as: boolean;
  acting_as_workspace_id: string | null;
  acting_as_reason: string | null;
  acting_as_started_at: string | null;
  acting_as_expires_at: string | null;
  
  // Session Timing
  started_at: string;
  last_activity_at: string;
  ended_at: string | null;
}
```

### 7.3 Above-Site Dashboard

```
Login → Select Jurisdiction Context →
  → Master Dashboard (Aggregated Metrics)
  → Facility Comparison
  → Performance Reports
  → Intervention Management
  → Quality Indicators
→ End Session
```

### 7.4 Act-As Mode (Time-Limited)

```typescript
const initiateActAsMode = async (
  sessionId: string,
  workspaceId: string,
  reason: string,
  durationMinutes: number = 30
): Promise<void> => {
  // Validate permissions
  const session = await getAboveSiteSession(sessionId);
  if (!session.above_site_role.can_act_as) {
    throw new Error('Role does not permit Act-As mode');
  }
  
  // Validate workspace is within jurisdiction
  const workspace = await getWorkspace(workspaceId);
  if (!isWithinJurisdiction(session, workspace.facility_id)) {
    throw new Error('Workspace outside jurisdiction');
  }
  
  // Enable Act-As with time limit
  await supabase.from('above_site_sessions').update({
    is_acting_as: true,
    acting_as_workspace_id: workspaceId,
    acting_as_reason: reason,
    acting_as_started_at: new Date().toISOString(),
    acting_as_expires_at: addMinutes(new Date(), durationMinutes).toISOString()
  }).eq('id', sessionId);
  
  // Enhanced audit logging
  await supabase.from('above_site_audit_log').insert({
    user_id: session.user_id,
    session_id: sessionId,
    action_type: 'act_as_started',
    action_category: 'oversight',
    target_type: 'workspace',
    target_id: workspaceId,
    description: reason,
    jurisdiction_scope: session.jurisdiction_scope
  });
};
```

---

## 8. Professional Development

### 8.1 My Professional Hub

The "My Professional" tab serves as the practice management center:

```typescript
interface MyProfessionalHub {
  sections: {
    dashboard: {
      // Role-adaptive overview
      alerts: Alert[];
      pendingActions: Action[];
      upcomingDeadlines: Deadline[];
    };
    
    affiliations: {
      // Multi-facility management
      facilities: ProviderAffiliation[];
      activeShift: Shift | null;
      shiftHistory: Shift[];
    };
    
    myPatients: {
      // Cross-facility patient panels
      panels: PatientPanel[];
      pendingResults: Result[];
      alertingPatients: Patient[];
    };
    
    schedule: {
      // Personal schedule
      appointments: Appointment[];
      onCallDuties: OnCallSlot[];
      leaves: LeaveRequest[];
    };
    
    credentials: {
      // CPD & Licensing
      licenses: ProfessionalLicense[];
      cpdProgress: CPDProgress;
      mandatoryTraining: TrainingRequirement[];
      certificates: Certificate[];
    };
  };
}
```

### 8.2 CPD Tracking

```typescript
interface CPDProgress {
  provider_id: string;
  cycle_start: string;
  cycle_end: string;
  
  // Points
  required_points: number;
  earned_points: number;
  
  // Categories
  categories: {
    name: string;
    required: number;
    earned: number;
  }[];
  
  // Activities
  activities: CPDActivity[];
  
  // Status
  status: 'on_track' | 'behind' | 'at_risk' | 'completed';
}

interface CPDActivity {
  id: string;
  provider_id: string;
  activity_type: 'course' | 'conference' | 'publication' | 'teaching' | 'self_study';
  title: string;
  provider_org: string;           // Training provider
  completion_date: string;
  points_earned: number;
  category: string;
  certificate_url: string | null;
  verified: boolean;
}
```

### 8.3 Training & Compliance

```typescript
interface TrainingProfile {
  provider_id: string;
  
  // Mandatory Training
  mandatory: {
    requirement: TrainingRequirement;
    status: 'not_started' | 'in_progress' | 'completed' | 'expired';
    due_date: string;
    completion_date: string | null;
  }[];
  
  // Competency Pathways
  pathways: {
    pathway: CompetencyPathway;
    progress: number;              // 0-100%
    current_module: string;
  }[];
  
  // Certifications
  certifications: {
    name: string;
    issuer: string;
    issued_date: string;
    expiry_date: string | null;
    qr_verification_code: string;
  }[];
}
```

---

## 9. State Machines & Transitions

### 9.1 Provider Session States

```
Unauthenticated
     ↓ (authenticate)
Authenticated
     ↓ (select facility)
FacilitySelected
     ↓ (start shift)
ShiftActive
     ↓ (end shift)
ShiftEnded → Authenticated
     ↓ (logout)
Unauthenticated
```

### 9.2 Shift States

```typescript
type ShiftStatus = 
  | 'scheduled'     // Future shift
  | 'active'        // Currently working
  | 'on_break'      // Temporary pause
  | 'ending'        // Handoff in progress
  | 'ended'         // Completed
  | 'cancelled';    // Never started

const shiftTransitions: StateTransition<ShiftStatus>[] = [
  { from: 'scheduled', to: 'active', action: 'start' },
  { from: 'scheduled', to: 'cancelled', action: 'cancel' },
  { from: 'active', to: 'on_break', action: 'break' },
  { from: 'active', to: 'ending', action: 'initiate_end' },
  { from: 'on_break', to: 'active', action: 'resume' },
  { from: 'ending', to: 'ended', action: 'complete_handoff' },
  { from: 'ending', to: 'active', action: 'cancel_end' },
];
```

### 9.3 Provider Authorization States

```
Unverified → Pending_Verification → Active → Suspended → Reinstated → Active
                                      ↓
                                   Inactive (license expired)
                                      ↓
                                   Renewed → Active
```

---

## 10. Technical Implementation

### 10.1 Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `AuthContext` | Authentication state | `src/contexts/AuthContext.tsx` |
| `ProviderContext` | Provider identity | `src/contexts/ProviderContext.tsx` |
| `EHRContext` | Clinical session | `src/contexts/EHRContext.tsx` |
| `ProviderIdLookup` | ID search | `src/components/auth/ProviderIdLookup.tsx` |
| `BiometricVerification` | Biometric auth | `src/components/auth/BiometricVerification.tsx` |
| `FacilitySelector` | Workplace selection | `src/components/auth/FacilitySelector.tsx` |
| `ShiftManager` | Shift operations | `src/components/shift/ShiftManager.tsx` |
| `NoPatientSelected` | Provider dashboard | `src/components/ehr/NoPatientSelected.tsx` |
| `EHRLayout` | Clinical UI | `src/components/layout/EHRLayout.tsx` |

### 10.2 Key Services

| Service | Purpose | Location |
|---------|---------|----------|
| `HPRService` | Provider registry | `src/services/hprService.ts` |
| `IdPService` | Authorization | `src/services/idpService.ts` |
| `BiometricService` | Biometric ops | `src/services/biometricService.ts` |
| `ShiftService` | Shift management | `src/services/shiftService.ts` |
| `AuditService` | Audit logging | `src/services/auditService.ts` |

### 10.3 Key Database Tables

| Table | Purpose |
|-------|---------|
| `health_providers` | Provider registry |
| `provider_licenses` | Licensing records |
| `provider_affiliations` | Facility relationships |
| `shifts` | Shift records |
| `above_site_roles` | Oversight roles |
| `above_site_sessions` | Oversight sessions |
| `above_site_audit_log` | Enhanced audit |
| `training_profiles` | CPD tracking |
| `cpd_activities` | CPD records |

### 10.4 Key Hooks

| Hook | Purpose |
|------|---------|
| `useAuth` | Authentication state |
| `useProvider` | Provider context |
| `useEHR` | Clinical session |
| `useShift` | Active shift |
| `useWorkspace` | Workspace context |
| `useAboveSite` | Oversight context |
| `useCPD` | CPD progress |

---

## Appendix A: Access Control Matrix

| Role | Patient Data | Orders | Admin | Oversight |
|------|--------------|--------|-------|-----------|
| CHW | Own encounters | None | None | None |
| Nurse | Department | Nursing orders | None | None |
| Doctor | Facility-wide | All clinical | None | None |
| Specialist | Referred cases | All clinical | None | None |
| Clerk | Demographics only | None | Limited | None |
| Manager | Aggregated only | None | Full | Facility |
| District | Aggregated only | None | Limited | District |
| Provincial | Aggregated only | None | Limited | Province |

---

## Appendix B: Audit Events

| Event | Trigger | Data Captured |
|-------|---------|---------------|
| `provider_authenticated` | Successful login | Provider ID, method, timestamp |
| `shift_started` | Shift begins | Provider, facility, workspace |
| `shift_ended` | Shift ends | Duration, handoffs, notes |
| `chart_accessed` | Patient chart opened | Patient ID, reason, source |
| `order_signed` | Order authorized | Order details, signer |
| `act_as_started` | Oversight impersonation | Reason, duration, target |
| `act_as_ended` | Impersonation ends | Actions taken summary |

---

*Document Version: 1.0*
*Last Updated: 2026-02-01*
*Maintainer: Impilo Platform Team*
