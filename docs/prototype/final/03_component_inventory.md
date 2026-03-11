# 03 — Component Inventory

## Layout Components

### AppLayout (`src/components/layout/AppLayout.tsx`)
- **Props**: `children: ReactNode`, `title?: string`
- **Structure**: `h-screen flex overflow-hidden bg-background` → AppSidebar + main column (AppHeader + scrollable main)
- **Used by**: Most protected routes (see site_map.md)

### AppSidebar (`src/components/layout/AppSidebar.tsx`)
- **Props**: none (reads from WorkspaceContext and AuthContext)
- **State**: `collapsed: boolean` (local, default false)
- **Width**: w-48 expanded, w-12 collapsed
- **Behavior**: Detects `pageContext` from URL path, renders appropriate nav sections
- **11 context configurations**: home, clinical, operations, scheduling, registry, admin, portal, public-health, coverage, ai, omnichannel
- **WorkspaceSelector**: shown only for "clinical" and "home" contexts
- **Collapse button**: `"Collapse"` text + ChevronLeft (expanded) / ChevronRight (collapsed)
- **Used by**: AppLayout

### AppHeader (`src/components/layout/AppHeader.tsx`)
- **Props**: `title?: string`
- **Structure**: h-12 bg-card border-b
- **Left**: Home button (hidden on `/`), Back button (hidden on `/` and `/dashboard`), title text
- **Center**: `<PatientSearch>` max-w-xs
- **Right**: FacilitySelector (hidden md), ActiveWorkspaceIndicator (hidden lg), VoiceCommandButton, HandoffNotifications, Bell button (badge "3"), User dropdown
- **User dropdown**: DropdownMenuLabel `"My Account"` → `"Profile Settings"` (Settings icon) → `"Sign Out"` (LogOut icon, text-destructive)
- **Used by**: AppLayout

### EHRLayout (`src/components/layout/EHRLayout.tsx`)
- **Props**: none (reads from EHRContext)
- **Structure**: h-screen flex-col → TopBar + PatientBanner + content area (MainWorkArea + EncounterMenu)
- **Critical mode**: `ring-4 ring-critical ring-inset critical-mode` class
- **Used by**: Encounter.tsx (when hasActivePatient)

### TopBar (`src/components/layout/TopBar.tsx`)
- **Props**: none (reads from EHRContext)
- **Structure**: h-14, dark background (topbar-bg)
- **10 action buttons** (from TOP_BAR_ACTIONS): Queue, Beds, Pharmacy, Theatre Booking, Payments, Shift Handoff, Workspaces, Care Pathways, Consumables, Charges
- **Used by**: EHRLayout

### EncounterMenu (`src/components/layout/EncounterMenu.tsx`)
- **Props**: none (reads from EHRContext)
- **Structure**: w-64, border-l
- **8 menu items** from `ENCOUNTER_MENU_ITEMS`
- **Used by**: EHRLayout

### MainWorkArea (`src/components/layout/MainWorkArea.tsx`)
- **Props**: none
- **Used by**: EHRLayout

### PatientBanner (`src/components/ehr/PatientBanner.tsx`)
- **Props**: none (reads from EHRContext)
- **Used by**: EHRLayout

## Auth Components

### ProtectedRoute (`src/components/auth/ProtectedRoute.tsx`)
- **Props**: `children: ReactNode`
- **Behavior**: If loading, shows `"Loading..."`. If no user, redirects to `/auth`.
- **Used by**: App.tsx (wraps all protected routes)

### ProviderIdLookup (`src/components/auth/ProviderIdLookup.tsx`)
- **Props**: `onProviderFound(provider, facility)`, `onCancel()`
- **Used by**: Auth.tsx

### BiometricAuth (`src/components/auth/BiometricAuth.tsx`)
- **Props**: `providerId`, `onVerified(method, confidence)`, `onFailed(error)`, `onCancel()`, `requiredMethods`
- **Used by**: Auth.tsx

### WorkspaceSelection (`src/components/auth/WorkspaceSelection.tsx`)
- **Props**: `facility`, `provider`, `onWorkspaceSelected(selection)`, `onBack()`
- **Used by**: Auth.tsx

### AboveSiteContextSelection (`src/components/auth/AboveSiteContextSelection.tsx`)
- **Props**: `roles`, `availableContexts`, `onContextSelected(roleId, contextType, contextLabel, scope?)`, `onBack()`
- **Used by**: Auth.tsx

### ClientAuth (`src/components/auth/ClientAuth.tsx`)
- **Props**: `onBack()`
- **Used by**: Auth.tsx

### SystemMaintenanceAuth (`src/components/auth/SystemMaintenanceAuth.tsx`)
- **Props**: `onBack()`
- **Used by**: Auth.tsx

### UserMenu (`src/components/auth/UserMenu.tsx`)
- **Used by**: TopBar.tsx

## Home Components

### WorkplaceSelectionHub (`src/components/home/WorkplaceSelectionHub.tsx`)
- **Props**: 8 callbacks (onFacilitySelect, onAboveSiteSelect, onCombinedViewSelect, onRemoteSelect, onSupportModeSelect, onIndependentPracticeSelect, onEmergencyWorkSelect, onCommunityOutreachSelect)
- **Used by**: ModuleHome.tsx (Work tab, no context)

### ExpandableCategoryCard (`src/components/home/ExpandableCategoryCard.tsx`)
- **Props**: id, title, description, modules[], icon, color, roles?, onModuleClick, defaultExpanded
- **Used by**: ModuleHome.tsx (Work tab, with context)

### PersonalHub (`src/components/home/PersonalHub.tsx`)
- **Used by**: ModuleHome.tsx (My Life tab)

### MyProfessionalHub (`src/components/home/MyProfessionalHub.tsx`)
- **Props**: `onStartShift`, `onSwitchToWork`
- **Used by**: ModuleHome.tsx (My Professional tab)

## EHR Components

### CriticalEventButton (`src/components/ehr/CriticalEventButton.tsx`)
- **Used by**: TopBar.tsx

### AIDiagnosticAssistant (`src/components/ehr/AIDiagnosticAssistant.tsx`)
- **Used by**: TopBar.tsx

### CDSAlertBadge (`src/components/ehr/ClinicalDecisionSupport.tsx`)
- **Used by**: TopBar.tsx

### NoPatientSelected (`src/components/ehr/NoPatientSelected.tsx`)
- **Used by**: Encounter.tsx (no encounterId)

### ChartAccessDialog (`src/components/ehr/ChartAccessDialog.tsx`)
- **Used by**: Encounter.tsx (imported but not actively used in current mock flow)

## Search & Navigation

### PatientSearch (`src/components/search/PatientSearch.tsx`)
- **Used by**: AppHeader.tsx, TopBar.tsx

### NavLink (`src/components/NavLink.tsx`)
- **Used by**: AppSidebar.tsx

## Header Sub-components

### FacilitySelector (`src/components/layout/FacilitySelector.tsx`)
- **Used by**: AppHeader.tsx (hidden md:block)

### ActiveWorkspaceIndicator (`src/components/layout/ActiveWorkspaceIndicator.tsx`)
- **Props**: `compact?: boolean`
- **Used by**: AppHeader.tsx (hidden lg:block), TopBar.tsx

### WorkspaceSelector (`src/components/layout/WorkspaceSelector.tsx`)
- **Props**: `currentView`, `onViewChange`, `collapsed`
- **Used by**: AppSidebar.tsx (shown for clinical and home contexts only)

## Notification & Communication

### HandoffNotifications (`src/components/handoff/HandoffNotifications.tsx`)
- **Used by**: AppHeader.tsx

### VoiceCommandButton (`src/components/voice/VoiceCommandButton.tsx`)
- **Props**: `onCommand(cmd, action)`
- **Used by**: AppHeader.tsx

## Documents & Scanning

### HealthDocumentScanner (`src/components/documents/HealthDocumentScanner.tsx`)
- **Props**: `variant`, `className`
- **Used by**: ModuleHome.tsx (Communication Noticeboard)

## Emergency

### EmergencyHub (`src/components/emergency/EmergencyHub.tsx`)
- **Used by**: ModuleHome.tsx (Emergency FAB dialog)

## Clinical Alerts

### AlertBadge (`src/components/alerts/ClinicalAlerts.tsx`)
- **Used by**: TopBar.tsx
