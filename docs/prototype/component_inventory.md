# Impilo vNext — Component Inventory

> Global list of reusable UI components observed in the prototype codebase.

---

## Shell / Layout Components

### AppLayout
- **File**: `src/components/layout/AppLayout.tsx`
- **Props**: `children: ReactNode`, `title?: string`
- **Used by**: Most authenticated pages (Dashboard, Queue, Beds, PACS, LIMS, Patients, Stock, Consumables, Charges, Registration, Pharmacy, etc.)
- **Composition**: `AppSidebar` + `AppHeader` + `<main>` content area
- **Variants**: None

### EHRLayout
- **File**: `src/components/layout/EHRLayout.tsx`
- **Props**: None (uses EHRContext)
- **Used by**: `/encounter` route only
- **Composition**: `TopBar` + `PatientBanner` + `MainWorkArea` + `EncounterMenu`
- **Variants**: Critical event mode (ring-4 ring-critical)

### AppSidebar
- **File**: `src/components/layout/AppSidebar.tsx`
- **Props**: None (uses WorkspaceContext, AuthContext, location)
- **State**: `collapsed` (boolean), `pageContext` (derived from URL)
- **Used by**: AppLayout
- **Behavior**: Context-aware navigation (10 page contexts), collapsible (w-48 ↔ w-12), Impilo logo, WorkspaceSelector

### AppHeader
- **File**: `src/components/layout/AppHeader.tsx`
- **Props**: `title?: string`
- **Used by**: AppLayout
- **Contains**: Home/Back buttons, title, PatientSearch, FacilitySelector, ActiveWorkspaceIndicator, VoiceCommandButton, HandoffNotifications, Bell, User dropdown

### TopBar
- **File**: `src/components/layout/TopBar.tsx`
- **Props**: None (uses EHRContext)
- **Used by**: EHRLayout
- **Contains**: Navigation (Back/Home), logo, TopBar action buttons (10 actions), patient context info, CriticalEventButton, CDSAlertBadge, AIDiagnosticAssistant, UserMenu

### EncounterMenu
- **File**: `src/components/layout/EncounterMenu.tsx`
- **Props**: None (uses EHRContext)
- **Used by**: EHRLayout
- **Contains**: 8 clinical documentation menu items, Patient File toggle button

### MainWorkArea
- **File**: `src/components/layout/MainWorkArea.tsx`
- **Props**: None (uses EHRContext)
- **Used by**: EHRLayout
- **Behavior**: Priority rendering: Critical Event → Workspace → TopBarPanel → EncounterSection

### PatientBanner
- **File**: `src/components/ehr/PatientBanner.tsx`
- **Used by**: EHRLayout
- **Purpose**: Patient demographics, alerts, active episodes banner

---

## Navigation Components

### NavLink
- **File**: `src/components/NavLink.tsx`
- **Purpose**: Styled navigation link wrapper

### WorkspaceSelector
- **File**: `src/components/layout/WorkspaceSelector.tsx`
- **Used by**: AppSidebar (when pageContext is "clinical" or "home")

### FacilitySelector
- **File**: `src/components/layout/FacilitySelector.tsx`
- **Used by**: AppHeader

### ActiveWorkspaceIndicator
- **File**: `src/components/layout/ActiveWorkspaceIndicator.tsx`
- **Props**: `compact?: boolean`
- **Used by**: AppHeader, TopBar

---

## Home / Hub Components

### WorkplaceSelectionHub
- **File**: `src/components/home/WorkplaceSelectionHub.tsx` (749 lines)
- **Props**: 8 callback props for different access modes (facility, above-site, combined, remote, support, independent, emergency, community)
- **Used by**: ModuleHome (Work tab, when no active context)
- **Purpose**: Post-login workplace selection with all facility affiliations

### MyProfessionalHub
- **File**: `src/components/home/MyProfessionalHub.tsx` (615 lines)
- **Props**: `onStartShift`, `onSwitchToWork`
- **Used by**: ModuleHome (My Professional tab)
- **Contains**: Dashboard, Affiliations, My Patients, Schedule, Credentials sub-tabs

### PersonalHub
- **File**: `src/components/home/PersonalHub.tsx` (541 lines)
- **Props**: None
- **Used by**: ModuleHome (My Life tab)
- **Contains**: Health section (10+ tabs), Social section (5 tabs)

### ExpandableCategoryCard
- **File**: `src/components/home/ExpandableCategoryCard.tsx`
- **Props**: `id, title, description, modules[], icon, color, roles?, onModuleClick, defaultExpanded`
- **Used by**: ModuleHome (Work tab module grid)
- **Behavior**: Card that opens Dialog (max-w-[90vw], max-h-[90vh]) with module grid

---

## Auth Components

### ProtectedRoute
- **File**: `src/components/auth/ProtectedRoute.tsx`
- **Props**: `children: ReactNode`
- **Behavior**: Redirects to `/auth` if not authenticated, shows loading while checking

### UserMenu
- **File**: `src/components/auth/UserMenu.tsx`
- **Used by**: TopBar

### ProviderIdLookup
- **File**: `src/components/auth/ProviderIdLookup.tsx`
- **Used by**: Auth page (lookup view)

### BiometricAuth
- **File**: `src/components/auth/BiometricAuth.tsx`
- **Props**: `providerId, onVerified, onFailed, onCancel, requiredMethods`
- **Used by**: Auth page (biometric view)

### WorkspaceSelection
- **File**: `src/components/auth/WorkspaceSelection.tsx`
- **Used by**: Auth page (workspace view)

### AboveSiteContextSelection
- **File**: `src/components/auth/AboveSiteContextSelection.tsx`
- **Used by**: Auth page (above-site-context view)

### ClientAuth
- **File**: `src/components/auth/ClientAuth.tsx`
- **Used by**: Auth page (client-auth view)

### SystemMaintenanceAuth
- **File**: `src/components/auth/SystemMaintenanceAuth.tsx`
- **Used by**: Auth page (system-maintenance view)

---

## Clinical Components

### EncounterSection
- **File**: `src/components/ehr/EncounterSection.tsx`
- **Used by**: MainWorkArea (default view)

### CriticalEventWorkspace
- **File**: `src/components/ehr/CriticalEventWorkspace.tsx`
- **Used by**: MainWorkArea (priority 1)

### CriticalEventButton
- **File**: `src/components/ehr/CriticalEventButton.tsx`
- **Used by**: TopBar

### WorkspaceView
- **File**: `src/components/ehr/WorkspaceView.tsx`
- **Used by**: MainWorkArea (priority 2)

### TopBarPanel
- **File**: `src/components/ehr/TopBarPanel.tsx`
- **Used by**: MainWorkArea (priority 3)

### NoPatientSelected
- **File**: `src/components/ehr/NoPatientSelected.tsx`
- **Used by**: Encounter page (no encounterId)

### ChartAccessDialog
- **File**: `src/components/ehr/ChartAccessDialog.tsx`
- **Used by**: Encounter page

### AIDiagnosticAssistant
- **File**: `src/components/ehr/AIDiagnosticAssistant.tsx`
- **Used by**: TopBar

### CDSAlertBadge (ClinicalDecisionSupport)
- **File**: `src/components/ehr/ClinicalDecisionSupport.tsx`
- **Used by**: TopBar

### BedManagement
- **File**: `src/components/ehr/beds/BedManagement.tsx`
- **Used by**: Beds page

---

## Search Components

### PatientSearch
- **File**: `src/components/search/PatientSearch.tsx`
- **Used by**: AppHeader, TopBar

---

## Alert Components

### AlertBadge (ClinicalAlerts)
- **File**: `src/components/alerts/ClinicalAlerts.tsx`
- **Used by**: TopBar

### MedicationDueAlerts
- **File**: `src/components/alerts/MedicationDueAlerts.tsx`
- **Used by**: Dashboard

---

## Queue Components

### QueueWorkstation, SupervisorDashboard, AddToQueueDialog, QueueConfigManager, QueuePathwayEditor
- **File**: `src/components/queue/`
- **Used by**: Queue page

### SelfCheckInKiosk
- **File**: `src/components/booking/SelfCheckInKiosk.tsx`
- **Used by**: Queue page (check-in tab)

### BookingManager
- **File**: `src/components/booking/BookingManager.tsx`
- **Used by**: Queue page (bookings tab)

---

## Document Components

### HealthDocumentScanner
- **File**: `src/components/documents/HealthDocumentScanner.tsx`
- **Props**: `variant?: "button"`, `className?`
- **Used by**: ModuleHome (Communication Noticeboard), PersonalHub

---

## Emergency Components

### EmergencyHub
- **File**: `src/components/emergency/EmergencyHub.tsx`
- **Used by**: ModuleHome (floating emergency button dialog)

---

## Imaging Components

### PACSViewer, RadiologistWorklist, TeleradiologyHub, CriticalFindingsManager, PACSAdminDashboard
- **File**: `src/components/imaging/`
- **Used by**: PACS page

---

## Lab Components

### LIMSIntegration
- **File**: `src/components/lab/LIMSIntegration.tsx`
- **Used by**: LIMS page

---

## Pharmacy Components

### MedicationDispensing
- **File**: `src/components/pharmacy/MedicationDispensing.tsx`
- **Used by**: Pharmacy page

---

## Portal Components

Located in `src/components/portal/` and `src/components/portal/modules/`:
- EmergencySOS, PortalQueueStatus, HealthIdManager, ServiceDiscovery
- PortalConsentDashboard, PortalHealthTimeline, PortalMedications, PortalAppointments
- PortalWallet, PortalCommunities, PortalRemoteMonitoring, PortalSecureMessaging
- PortalMarketplace, PortalWellness

**Used by**: PersonalHub (My Life tab)

---

## Social Components

Located in `src/components/social/`:
- TimelineFeed, CommunitiesList, ClubsList, ProfessionalPages, CrowdfundingCampaigns, NewsFeedWidget

**Used by**: PersonalHub (Social section), Social page

---

## Professional Components

### LandelaNotificationsPanel
- **File**: `src/components/professional/LandelaNotificationsPanel.tsx`
- **Used by**: MyProfessionalHub

### ProfessionalEmailPanel
- **File**: `src/components/professional/ProfessionalEmailPanel.tsx`
- **Used by**: MyProfessionalHub

---

## Voice / Communication Components

### VoiceCommandButton
- **File**: `src/components/voice/VoiceCommandButton.tsx`
- **Used by**: AppHeader

### HandoffNotifications
- **File**: `src/components/handoff/HandoffNotifications.tsx`
- **Used by**: AppHeader

---

## Discharge Components

### DischargeDashboard
- **File**: `src/components/discharge/`
- **Used by**: Discharge page

---

## Telemedicine Components

### FullCircleTelemedicineHub
- **File**: `src/components/ehr/consults/`
- **Used by**: Telemedicine page

---

## Registration Components

### RegistrationWizard
- **File**: `src/components/registration/RegistrationWizard.tsx`
- **Used by**: Registration page

### VisitCreation
- **File**: `src/components/registration/VisitCreation.tsx`
- **Used by**: Registration page

### IAMArchitecture
- **File**: `src/components/registration/IAMArchitecture.tsx`
- **Used by**: Registration page

---

## Patient Components

### PatientRegistrationForm
- **File**: `src/components/patients/PatientRegistrationForm.tsx`
- **Used by**: Patients page

### PatientProfile
- **File**: `src/components/patients/PatientProfile.tsx`
- **Used by**: Patients page

---

## Dashboard Components

### DepartmentView, TeamView
- **File**: `src/components/dashboard/WorkspaceViews.tsx`
- **Used by**: Dashboard page

### ProviderDashboardTabs
- **File**: `src/components/dashboard/ProviderDashboardTabs.tsx`
- **Used by**: Dashboard page

---

## Component Directory Summary

| Directory | Count | Purpose |
|-----------|-------|---------|
| `src/components/ui/` | ~40+ | shadcn/ui base components |
| `src/components/ehr/` | 15+ | EHR clinical components |
| `src/components/layout/` | 10 | Shell and layout |
| `src/components/home/` | 4 | Module home hub |
| `src/components/auth/` | 7+ | Authentication flows |
| `src/components/portal/` | 15+ | Patient portal modules |
| `src/components/social/` | 6+ | Social hub |
| `src/components/queue/` | 5+ | Queue management |
| `src/components/imaging/` | 5 | PACS/radiology |
| `src/components/lab/` | 1+ | Laboratory |
| `src/components/pharmacy/` | 1+ | Pharmacy |
| `src/components/admin/` | varies | Admin panels |
| `src/components/kernel/` | varies | Kernel service UIs |
| `src/components/aboveSite/` | varies | Above-site oversight |
| `src/components/discharge/` | varies | Discharge workflows |
| `src/components/registration/` | 3+ | Patient registration |
| `src/components/communication/` | varies | Messaging/pages/calls |
| `src/components/professional/` | 2 | Professional hub panels |
| `src/components/emergency/` | 1+ | Emergency hub |
