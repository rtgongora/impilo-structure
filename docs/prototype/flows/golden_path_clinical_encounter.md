# Golden Path: Shift Start → Queue → Patient → Encounter

## Prerequisites
- User is authenticated (provider role)
- On ModuleHome (`/`)

---

## Steps

### 1. Workplace Selection
- **Screen**: ModuleHome, "Work" tab active
- **See**: WorkplaceSelectionHub (no facility selected yet)
- **Action**: Select a facility from the list
- **Result**: `activeContext` is set, module grid appears
- **See**: "Welcome, Dr {Name}" / "Working from: {FacilityName}"

### 2. Navigate to Queue
- **Option A**: Click "Queue" button in "Quick Access" section
- **Option B**: Click "Patient Queue" in "Clinical Care" category card
- **Navigate**: `/queue`
- **Layout**: AppLayout with sidebar in "clinical" context
- **Sidebar shows**: Quick Access (Dashboard, My Worklist, Communication) + Clinical (Clinical EHR, Bed Management, Appointments, Patients) + Orders (Order Entry, Pharmacy, Laboratory, PACS Imaging, Shift Handoff)

### 3. Queue Page
- **Header**: AppHeader with title (if set)
- **Content**: Patient queue list with triage priorities
- **Actions**: Select patient to start encounter

### 4. Enter EHR
- **Action**: Select patient from queue → navigate to `/encounter`
- **Layout switches to**: EHRLayout
- **Sidebar disappears** (EHRLayout has no sidebar — uses EncounterMenu instead)

### 5. EHR Layout Active
- **TopBar** (dark, h-14):
  - Left: Back, Home, Impilo logo
  - Left actions (patient active): Queue, Beds, Pharmacy, Theatre Booking, Payments, Shift Handoff, Workspaces, Care Pathways, Consumables, Charges, Register
  - Center: "Chart Locked" badge + patient name/MRN/ward/bed + "Allergies" badge + "Close Chart" button
  - Right: PatientSearch, ActiveWorkspaceIndicator, AIDiagnosticAssistant, AlertBadge, CDSAlertBadge, CriticalEventButton, UserMenu

- **PatientBanner**: Below TopBar, shows demographics, alerts, active episodes

- **MainWorkArea**: Center content zone — shows one panel at a time based on active menu item

- **EncounterMenu** (right, w-64):
  - Header: "Encounter Record" / "Clinical Documentation"
  - "Patient File" button
  - Menu items: Overview → Assessment → Problems & Diagnoses → Orders & Results → Care & Management → Consults & Referrals → Notes & Attachments → Visit Outcome
  - Footer: "Last saved: 2 min ago" / "Active" (green dot)

### 6. Navigate Encounter Sections
- **Click** menu items to switch MainWorkArea content
- **Active item**: highlighted with primary background, chevron indicator
- **TopBar actions**: click to toggle overlay workspaces (Queue, Beds, etc.)

### 7. Close Chart
- **Click**: "Close Chart" in TopBar
- **Dialog**: "Close Patient Chart?" / "This will close {name}'s chart and return you to your worklist. Any unsaved changes may be lost."
- **Cancel**: "Continue Working"
- **Confirm**: "Close Chart" → navigates to `/queue`
- **Layout returns to**: AppLayout

---

## Critical Event Flow (within Encounter)

1. **Click**: CriticalEventButton in TopBar
2. **Result**: `isCriticalEventActive` = true
3. **EHRLayout**: gets `ring-4 ring-critical ring-inset critical-mode` classes
4. **EncounterMenu**: becomes `opacity-50 pointer-events-none`
5. **Critical event types**: resuscitation, code-blue, rapid-response, emergency
