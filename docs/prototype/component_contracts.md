# Component Contracts — Impilo vNext Prototype

> **DO NOT CHANGE** — These are exact contracts from the prototype.

---

## Layout Components

### AppLayout
- **File**: `src/components/layout/AppLayout.tsx`
- **Props**: `{ children: ReactNode; title?: string }`
- **Renders**: `<div h-screen flex bg-background>` → `<AppSidebar />` + `<div flex-1 flex-col>` → `<AppHeader title={title} />` + `<main flex-1 overflow-auto>{children}</main>`
- **Used by**: ~60 pages via direct wrapping in page components

### EHRLayout
- **File**: `src/components/layout/EHRLayout.tsx`
- **Props**: None (consumes EHRContext via `useEHR()`)
- **State consumed**: `isCriticalEventActive` (adds `ring-4 ring-critical ring-inset critical-mode` when true)
- **Renders**: `<div h-screen flex-col>` → `<TopBar />` + `<PatientBanner />` + `<div flex-1 flex>` → `<MainWorkArea />` + `<EncounterMenu />`
- **Used by**: `/encounter`, `/encounter/:encounterId`

### AppSidebar
- **File**: `src/components/layout/AppSidebar.tsx`
- **Props**: None
- **State consumed**: `useWorkspace()` (pageContext, currentView), `useAuth()` (profile.role), `useLocation()`
- **Internal state**: `collapsed: boolean` (default false)
- **Key behavior**: Auto-derives pageContext from URL path. Renders different nav item sets per context. Shows WorkspaceSelector only for clinical/home contexts.
- **Collapse button text**: "Collapse"
- **Width**: `w-48` expanded, `w-12` collapsed

### AppHeader
- **File**: `src/components/layout/AppHeader.tsx`
- **Props**: `{ title?: string }`
- **State consumed**: `useAuth()` (profile, signOut), `useNavigate()`, `useLocation()`
- **Height**: `h-12`
- **Structure**: Left (Home btn + Back btn + title) | Center (PatientSearch) | Right (FacilitySelector + ActiveWorkspaceIndicator + VoiceCommandButton + HandoffNotifications + Bell + UserDropdown)

### TopBar (EHR)
- **File**: `src/components/layout/TopBar.tsx`
- **Props**: None
- **State consumed**: `useEHR()` (activeTopBarAction, setActiveTopBarAction, isCriticalEventActive, currentEncounter, hasActivePatient, patientContext, closeChart)
- **Height**: `h-14`
- **Background**: `bg-topbar-bg text-topbar-foreground`
- **Actions shown when patient active**: Queue, Beds, Pharmacy, Theatre Booking, Payments, Shift Handoff, Workspaces, Care Pathways, Consumables, Charges, Register
- **Center (patient active)**: "Chart Locked" badge + patient name/MRN/ward/bed + Allergies badge + "Close Chart" button
- **Center (no patient)**: "No Patient Selected" with ShieldCheck icon

### EncounterMenu
- **File**: `src/components/layout/EncounterMenu.tsx`
- **Props**: None
- **Width**: `w-64`
- **Background**: `bg-encounter-bg`
- **Header**: "Encounter Record" (h2, uppercase) / "Clinical Documentation" (subtitle)
- **Items** (from `ENCOUNTER_MENU_ITEMS`):
  1. Overview — "Patient summary and status"
  2. Assessment — "Clinical assessments"
  3. Problems & Diagnoses — "Active problems and diagnoses"
  4. Orders & Results — "Lab orders and results"
  5. Care & Management — "Care plans and management"
  6. Consults & Referrals — "Specialist consultations"
  7. Notes & Attachments — "Clinical notes and documents"
  8. Visit Outcome — "Encounter disposition"
- **Patient File button**: Opens/closes patient file workspace
- **Footer**: "Last saved: 2 min ago" + green dot "Active"
- **De-emphasis**: `opacity-50 pointer-events-none` during critical events or active workspaces

### WorkspaceSelector
- **File**: `src/components/layout/WorkspaceSelector.tsx`
- **Props**: `{ currentView: WorkspaceView; onViewChange: (view) => void; collapsed: boolean }`
- **Views**: personal, department, team
- **Shown when**: pageContext is "clinical" or "home"

### FacilitySelector
- **File**: `src/components/layout/FacilitySelector.tsx`
- **Props**: None
- **Visibility**: `hidden md:block` in AppHeader

### ActiveWorkspaceIndicator
- **File**: `src/components/layout/ActiveWorkspaceIndicator.tsx`
- **Props**: `{ compact?: boolean }`
- **Visibility**: `hidden lg:block` in AppHeader, always shown in TopBar when patient active

---

## Auth Components

### ProtectedRoute
- **File**: `src/components/auth/ProtectedRoute.tsx`
- **Props**: `{ children: ReactNode }`
- **Behavior**: Shows "Loading..." spinner while auth loading. Redirects to `/auth` if no user.

### ProviderIdLookup
- **File**: `src/components/auth/ProviderIdLookup.tsx`
- **Props**: `{ onProviderFound: (provider, facility) => void; onCancel: () => void }`

### BiometricAuth
- **File**: `src/components/auth/BiometricAuth.tsx`
- **Props**: `{ providerId: string; onVerified: (method, confidence) => void; onFailed: (error) => void; onCancel: () => void; requiredMethods: string[] }`

### WorkspaceSelection
- **File**: `src/components/auth/WorkspaceSelection.tsx`
- **Props**: `{ facility: FacilityRegistryRecord; provider: ProviderRegistryRecord; onWorkspaceSelected: (selection) => void; onBack: () => void }`
- **Selection data**: `{ department: string; physicalWorkspace: {...}; workstation?: string }`

### ClientAuth
- **File**: `src/components/auth/ClientAuth.tsx`
- **Props**: `{ onBack: () => void }`

### SystemMaintenanceAuth
- **File**: `src/components/auth/SystemMaintenanceAuth.tsx`
- **Props**: `{ onBack: () => void }`

### AboveSiteContextSelection
- **File**: `src/components/auth/AboveSiteContextSelection.tsx`
- **Props**: `{ roles, availableContexts, onContextSelected: (roleId, contextType, contextLabel, scope?) => void; onBack: () => void }`

### UserMenu
- **File**: `src/components/auth/UserMenu.tsx`
- **Used in**: TopBar

---

## Home Components

### WorkplaceSelectionHub
- **File**: `src/components/home/WorkplaceSelectionHub.tsx`
- **Props**: `{ onFacilitySelect, onAboveSiteSelect, onCombinedViewSelect, onRemoteSelect, onSupportModeSelect, onIndependentPracticeSelect, onEmergencyWorkSelect, onCommunityOutreachSelect }`
- **Shown when**: No active work context on ModuleHome Work tab

### ExpandableCategoryCard
- **File**: `src/components/home/ExpandableCategoryCard.tsx`
- **Props**: `{ id, title, description, modules: ModuleItem[], icon, color, roles?, onModuleClick, defaultExpanded }`
- **Behavior**: Collapsible card that expands to show module links

### PersonalHub
- **File**: `src/components/home/PersonalHub.tsx`
- **Used in**: ModuleHome "My Life" tab

### MyProfessionalHub
- **File**: `src/components/home/MyProfessionalHub.tsx`
- **Props**: `{ onStartShift, onSwitchToWork }`
- **Used in**: ModuleHome "My Professional" tab

---

## Search Components

### PatientSearch
- **File**: `src/components/search/PatientSearch.tsx`
- **Used in**: AppHeader (center), TopBar (right, when patient active)

---

## EHR Components

### PatientBanner
- **File**: `src/components/ehr/PatientBanner.tsx`
- **Used in**: EHRLayout

### CriticalEventButton
- **File**: `src/components/ehr/CriticalEventButton.tsx`
- **Used in**: TopBar (when patient active)

### CDSAlertBadge (ClinicalDecisionSupport)
- **File**: `src/components/ehr/ClinicalDecisionSupport.tsx`
- **Used in**: TopBar (when patient active)

### AIDiagnosticAssistant
- **File**: `src/components/ehr/AIDiagnosticAssistant.tsx`
- **Used in**: TopBar (when patient active)

---

## Emergency Components

### EmergencyHub
- **File**: `src/components/emergency/EmergencyHub.tsx`
- **Used in**: ModuleHome (floating emergency button dialog)
- **Trigger**: Red floating button bottom-right with `animate-pulse`, AlertTriangle icon

---

## Document Components

### HealthDocumentScanner
- **File**: `src/components/documents/HealthDocumentScanner.tsx`
- **Props**: `{ variant?: string; className?: string }`
- **Used in**: ModuleHome Communication Noticeboard section

---

## Voice Components

### VoiceCommandButton
- **File**: `src/components/voice/VoiceCommandButton.tsx`
- **Props**: `{ onCommand: (cmd, action) => void }`
- **Used in**: AppHeader

---

## Handoff Components

### HandoffNotifications
- **File**: `src/components/handoff/HandoffNotifications.tsx`
- **Used in**: AppHeader

---

## Alert Components

### AlertBadge (ClinicalAlerts)
- **File**: `src/components/alerts/ClinicalAlerts.tsx`
- **Used in**: TopBar (when patient active)
