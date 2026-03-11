# Impilo vNext — Page-by-Page Specification (v2)

> Complete page-by-page spec for Claude Opus replication. Every route, every layout region, every UI string.
>
> **DO NOT CHANGE** any labels, headings, button text, placeholders, toasts, or empty states.
>
> See `docs/prototype/site_map.md` for the full 98-route table.
> See `docs/prototype/api_surface_map.md` for all API contracts.
> See `docs/prototype/state_and_storage.md` for context providers and persistence.
> See `docs/prototype/component_inventory.md` for shared component contracts.

---

# AUTH ZONE (Public, Standalone Layout)

## Route: `/auth`

### Purpose
Login method selection hub with 4 pathways.

### Layout
Standalone (no AppLayout). Split layout: left branded panel (desktop only, `hidden lg:flex`), right auth forms.

### Left Panel (Desktop)
- Gradient: `from-primary via-primary/90 to-primary/80`
- Decorative: blurred circles + SVG grid pattern
- Logo: Impilo, `h-14`, `brightness-0 invert`
- H1: `"Digital Health Platform"`
- P: `"Empowering healthcare providers with seamless, secure, and intelligent clinical solutions."`
- 3 badges: `"Patient-Centered"` (Heart), `"Secure"` (Shield), `"Real-time"` (Activity)
- Footer: `"© 2025 Impilo Health. All rights reserved."`

### Right Panel — Method Select (view="method-select")
- Mobile logo: `h-12`, long-press 1.5s reveals maintenance + toast `"Maintenance mode revealed"`
- H2: `"Welcome back"` — P: `"Choose your preferred login method"`
- 4 cards (vertical):
  1. Fingerprint icon → `"Provider ID & Biometric"` / `"For clinical staff with registered Provider ID"`
  2. UserCircle icon → `"Patient Portal"` / `"Access your health records & appointments"`
  3. Mail icon → `"Staff Email Login"` / `"For admin and system users"`
  4. Wrench icon (hidden) → `"System Maintenance"` / `"Platform admins & developers only"` — revealed via `?mode=maintenance`, `Ctrl+Shift+M`, or mobile long-press
- Footer: Shield + `"Secure authentication powered by Impilo"`

### Right Panel — Email Login (view="email-login")
- Card: `border-0 shadow-xl`
- Logo `h-10` centered
- Title: `"Sign in"` — Desc: `"Enter your email and password to continue"`
- Fields: `"Email address"` (placeholder `"you@example.com"`, h-12) + `"Password"` (placeholder `"••••••••"`, h-12, toggle Eye/EyeOff)
- Link: `"Forgot password?"` → `/forgot-password`
- Submit: `"Sign In"` / loading: `"Signing in..."`
- Back: `"Back to login options"` (ghost, ArrowLeft)
- Toast success: `"Welcome back!"` / `"You have been logged in successfully."`
- Toast error: `"Login failed"` / `error.message`

### Right Panel — Other Views
| View | Component | File |
|------|-----------|------|
| `lookup` | `<ProviderIdLookup>` | `src/components/auth/ProviderIdLookup.tsx` |
| `biometric` | `<BiometricAuth>` | `src/components/auth/BiometricAuth.tsx` |
| `workspace` | `<WorkspaceSelection>` | `src/components/auth/WorkspaceSelection.tsx` |
| `above-site-context` | `<AboveSiteContextSelection>` | `src/components/auth/AboveSiteContextSelection.tsx` |
| `client-auth` | `<ClientAuth>` | `src/components/auth/ClientAuth.tsx` |
| `system-maintenance` | `<SystemMaintenanceAuth>` | `src/components/auth/SystemMaintenanceAuth.tsx` |

### Key Toasts
- `"Welcome, {fullName}!"` / `"Logged in to {department} at {workstation}"`
- `"No user account linked to this Provider ID"`
- `"Failed to complete authentication"`
- `"Demo login not available for this provider"`
- `"Biometric verification failed"` / error string

### Data
- `supabase.auth.signInWithPassword`
- `profiles` table (SELECT by provider_registry_id)
- `provider_registry_logs` table (INSERT)
- `sessionStorage.setItem('activeWorkspace', ...)`

---

## Route: `/reset-password`
UNKNOWN — inspect `src/pages/ResetPassword.tsx`

## Route: `/forgot-password`
UNKNOWN — inspect `src/pages/ForgotPassword.tsx`

---

# MODULE HOME (Custom Layout)

## Route: `/`

### Layout
Custom: sticky header + full-height tabs + floating FAB. NOT AppLayout.

### Header
- Logo `h-8` left
- Right: workspace button (MapPin + name + RefreshCw, `hidden md:flex`) + profile dropdown (Avatar h-8)

### Profile Dropdown Items
`"View Profile"`, `"Account Settings"`, `"Security & Privacy"` → `/profile`
(admin) `"Admin Dashboard"` → `/admin`
`"Sign Out"` → toast `"Signed out successfully"` → `/auth`

### Welcome (when context active)
`"Welcome, {Dr/Nurse/} {name}"` + `"Working from: {facility}"`

### Tabs (providers: 3, clients: 1)
| Tab | Label | Icon | Active Style |
|-----|-------|------|-------------|
| work | `"Work"` | Briefcase | `bg-primary text-primary-foreground` |
| professional | `"My Professional"` | Stethoscope | gradient teal→cyan |
| personal | `"My Life"` | Heart | gradient pink→purple |

### Work Tab — No Context
`<WorkplaceSelectionHub>` (8 access mode callbacks)

### Work Tab — With Context
1. **Communication Noticeboard**: `"Messages"`, `"Pages"`, `"Calls"` buttons + HealthDocumentScanner
2. **Quick Access**: `"EHR"`, `"Dashboard"`, `"Queue"`, `"Prescribe"`, `"Register"`, `"Lab"`, `"Radiology"`, `"Schedule"`
3. **Module Categories**: 3-col grid (lg:4-col) of `<ExpandableCategoryCard>` — 17 categories from `workModuleCategories`

### Floating Emergency FAB
- Fixed bottom-6 right-6, h-16 w-16, `bg-destructive`, AlertTriangle h-8, `animate-pulse`
- Opens Dialog → `<EmergencyHub>`

---

# APP LAYOUT PAGES

Structure: `AppSidebar` (w-48/w-12) + `AppHeader` (h-12) + scrollable main.

### AppHeader
- Left: Home button + Back button + title
- Center: `<PatientSearch>` max-w-xs
- Right: FacilitySelector (hidden md) + ActiveWorkspaceIndicator (hidden lg) + VoiceCommandButton + HandoffNotifications + Bell (badge "3") + User dropdown (`"My Account"` → `"Profile Settings"` / `"Sign Out"`)

### AppSidebar
- 11 context-dependent nav configurations (see `site_map.md`)
- Collapse toggle: `"Collapse"` / ChevronRight
- WorkspaceSelector shown for clinical/home contexts only

---

# EHR LAYOUT

## Route: `/encounter`, `/encounter/:encounterId`
TopBar → PatientBanner → MainWorkArea + EncounterMenu (right)
- Critical event: `ring-4 ring-critical`
- EncounterMenu: 8 fixed items (Overview, Assessment, Problems & Diagnoses, Orders & Results, Care & Management, Consults & Referrals, Notes & Attachments, Visit Outcome)
- Wrapped in `<EHRProvider>` + `<ProviderContextProvider>`

---

# REMAINING ROUTES (Grouped)

All use AppLayout. Internal details marked UNKNOWN with file paths for inspection.

### Clinical
`/queue`, `/beds`, `/patients`, `/pharmacy`, `/pacs`, `/lims`, `/orders`, `/handoff`, `/sorting`, `/discharge`, `/telemedicine`

### Operations
`/stock`, `/consumables`, `/charges`, `/payments`, `/operations`

### Scheduling
`/scheduling`, `/scheduling/theatre`, `/scheduling/noticeboard`, `/scheduling/resources`, `/appointments`, `/theatre`

### Registry
`/registry-management`, `/hpr`, `/facility-registry`, `/client-registry`

### Admin
`/admin`, `/above-site`, `/workspace-management`, `/landela`, `/odoo`, `/profile`, `/reports`, `/help`

### Kernel (39 routes under `/admin/`)
TSHEPO (5), VITO (4), TUSO (6), VARAPI (5), BUTANO (5), Suite (2), PCT (2), ZIBO, OROS, Pharmacy, Inventory, MSIKA-Core, MSIKA-Flow, COSTA, MUSHEX, INDAWO, UBOMI

### Specialized
`/public-health` (public-health context), `/coverage` (coverage context), `/ai-governance` (ai context), `/omnichannel` (omnichannel context)

### Public Standalone
`/portal`, `/install`, `/catalogue`, `/marketplace`, `/kiosk`, `/shared/:type/:token`

### Marketplace (protected)
`/fulfillment`, `/vendor-portal`, `/admin/product-registry`

---

# GOLDEN PATH SCRIPTS

## A) Email Login → ModuleHome
1. Navigate `/auth` → see method-select
2. Click `"Staff Email Login"` → email form
3. Enter email (`"Email address"`) + password (`"Password"`)
4. Click `"Sign In"` → spinner `"Signing in..."`
5. Toast: `"Welcome back!"` / `"You have been logged in successfully."`
6. Route → `/` (ModuleHome, Work tab)

## B) Provider ID + Biometric → Workspace → ModuleHome
1. `/auth` → click `"Provider ID & Biometric"`
2. ProviderIdLookup → enter ID + facility
3. BiometricAuth → complete verification
4. WorkspaceSelection → select department/workspace/workstation
5. Toast: `"Welcome, {name}!"` / `"Logged in to {dept} at {ws}"`
6. Route → `/`

## C) Queue → Encounter → Close
1. From `/`, click `"Queue"` → `/queue`
2. Select patient → `/encounter/{id}`
3. EHRLayout renders, navigate 8 menu items
4. Click Home → return to `/`

## D) Admin → TSHEPO Audit
1. From `/`, navigate to admin category → `/admin`
2. Navigate → `/admin/tshepo/audit`
3. Search audit records
4. Navigate → `/admin/tshepo/breakglass`

## E) Marketplace
1. Browse `/catalogue` (public)
2. Browse `/marketplace` (public)
3. Auth'd: `/fulfillment` for Rx bidding
4. Vendor: `/vendor-portal` for bids

---

# ACCEPTANCE CHECKLIST
- [ ] All 98 routes present with correct guards and layouts
- [ ] UI string diff = zero
- [ ] Layout regions match (AppLayout, EHRLayout, ModuleHome)
- [ ] 11 sidebar contexts derive correctly from URL
- [ ] 4 auth pathways work with exact transitions
- [ ] EncounterMenu = exactly 8 items
- [ ] Emergency FAB on ModuleHome
- [ ] Golden paths A-E pass

---

# INSPECTION TO-DO

All page components marked UNKNOWN need file-level inspection for internal strings, tabs, forms, and data calls. See file paths in `src/pages/` and `src/pages/admin/` and `src/components/auth/`.
