# 02 — Page-by-Page Specification (Complete)

> Full page spec for every route in the prototype. Matches route order in 01_site_map.md.

---

## Route 1: `/auth`

### Purpose
Login method selection hub with 4 pathways.

### Auth/Guard
Public. No auth required. Authenticated users are redirected to `/`.

### Layout Regions
- **Standalone layout** (no AppLayout)
- **Left Panel** (desktop only, `hidden lg:flex`, `lg:w-1/2`): branded gradient panel
- **Right Panel** (`flex-1`): auth forms, max-w-md centered

### Left Panel (Desktop)
- Background: `bg-gradient-to-br from-primary via-primary/90 to-primary/80`
- Decorative: two blurred circles (white/20, white/10) + SVG grid pattern
- Logo: `<img>` impilo-logo.png, `h-14`, `brightness-0 invert`
- H1: `"Digital Health Platform"`
- P: `"Empowering healthcare providers with seamless, secure, and intelligent clinical solutions."`
- 3 badges: `"Patient-Centered"` (Heart), `"Secure"` (Shield), `"Real-time"` (Activity)
- Footer: `"© 2025 Impilo Health. All rights reserved."`

### Right Panel — Method Select (view="method-select")
- Mobile logo (lg:hidden): h-12, long-press 1.5s reveals maintenance + toast `"Maintenance mode revealed"` (duration 2000)
- H2: `"Welcome back"`
- P: `"Choose your preferred login method"`
- 4 cards:
  1. Fingerprint → `"Provider ID & Biometric"` / `"For clinical staff with registered Provider ID"` → view="lookup"
  2. UserCircle → `"Patient Portal"` / `"Access your health records & appointments"` → view="client-auth"
  3. Mail → `"Staff Email Login"` / `"For admin and system users"` → view="email-login"
  4. Wrench (hidden unless `showMaintenanceOption`) → `"System Maintenance"` / `"Platform admins & developers only"` → view="system-maintenance"
- Footer: Shield + `"Secure authentication powered by Impilo"`

### Maintenance Reveal Triggers
- URL: `?mode=maintenance`
- Keyboard: `Ctrl+Shift+M`
- Mobile: long-press logo 1.5s

### Right Panel — Email Login (view="email-login")
- Card: `border-0 shadow-xl`, Logo h-10 centered
- Title: `"Sign in"` / Desc: `"Enter your email and password to continue"`
- Field 1: `"Email address"`, email, placeholder `"you@example.com"`, h-12
- Field 2: `"Password"`, placeholder `"••••••••"`, h-12, Eye/EyeOff toggle
- Link: `"Forgot password?"` → `/forgot-password`
- Submit: `"Sign In"` / loading: spinner + `"Signing in..."`
- Back: ghost, ArrowLeft + `"Back to login options"`

### Other Auth Views
| View | Component | File |
|------|-----------|------|
| lookup | ProviderIdLookup | `src/components/auth/ProviderIdLookup.tsx` |
| biometric | BiometricAuth | `src/components/auth/BiometricAuth.tsx` |
| workspace | WorkspaceSelection | `src/components/auth/WorkspaceSelection.tsx` |
| above-site-context | AboveSiteContextSelection | `src/components/auth/AboveSiteContextSelection.tsx` |
| client-auth | ClientAuth | `src/components/auth/ClientAuth.tsx` |
| system-maintenance | SystemMaintenanceAuth | `src/components/auth/SystemMaintenanceAuth.tsx` |

### Data Interactions
- Email login: `supabase.auth.signInWithPassword({ email, password })`
- Provider ID: SELECT from `profiles` by `provider_registry_id`, INSERT into `provider_registry_logs`
- sessionStorage: `activeWorkspace` set on workspace selection

### Toasts
- `"Welcome back!"` / `"You have been logged in successfully."` (email success)
- `"Login failed"` / error.message (email failure)
- `"No user account linked to this Provider ID"` (provider lookup miss)
- `"Failed to complete authentication"` (auth error)
- `"Demo login not available for this provider"` (unmapped provider)
- `"Biometric verification failed"` / error (biometric fail)
- `"Welcome, {fullName}!"` / `"Logged in to {department} at {workstation}"` (provider success)
- `"Maintenance mode revealed"` (long-press, duration 2000)

---

## Route 2: `/reset-password`

### Purpose
Set new password after clicking reset link from email.

### Auth/Guard
Public. Requires valid recovery session from Supabase auth.

### Layout
Standalone. Centered card on gradient background (`from-background via-muted to-background`).

### Components
- `src/pages/ResetPassword.tsx`

### UI Inventory
- Loading state: centered `"Loading..."` with pulse animation
- Invalid session state:
  - Icon: KeyRound in destructive/10 circle (w-16 h-16)
  - Title: `"Invalid Link"`
  - Description: `"This password reset link is invalid or has expired."`
  - Button: `"Back to Sign In"` (ArrowLeft) → `/auth`
- Valid session state:
  - Icon: KeyRound in primary/10 circle
  - Title: `"Set New Password"`
  - Description: `"Enter your new password below"`
  - Field 1: Label `"New Password"`, type password, placeholder `"••••••••"`
  - Field 2: Label `"Confirm New Password"`, type password, placeholder `"••••••••"`
  - Submit: `"Update Password"` / loading: `"Updating..."`

### Data Interactions
- `supabase.auth.getSession()` on mount
- `supabase.auth.onAuthStateChange` listens for `PASSWORD_RECOVERY`
- `supabase.auth.updateUser({ password })`

### Validation
- Zod: password min 6 chars → toast.error with Zod message
- Mismatch: toast.error `"Passwords do not match"`

### Toasts
- Success: `"Password updated successfully!"` → navigate `/auth`
- Error: `error.message`

---

## Route 3: `/forgot-password`

### Purpose
Request password reset email.

### Auth/Guard
Public. Standalone layout.

### Layout
Centered card on gradient background.

### Components
- `src/pages/ForgotPassword.tsx`

### UI Inventory — Form State
- Icon: Mail in primary/10 circle (w-16 h-16)
- Title: `"Forgot Password?"`
- Description: `"Enter your email and we'll send you a reset link"`
- Field: Label `"Email Address"`, email, placeholder `"you@example.com"`, h-12
- Submit: `"Send Reset Link"` / loading: `"Sending..."` (h-12)
- Back: ghost, ArrowLeft + `"Back to Sign In"` → `/auth`

### UI Inventory — Email Sent State
- Icon: CheckCircle in green-500/10 circle
- Title: `"Check Your Email"`
- Description: `"We've sent a password reset link to {email}"`
- Body: `"Click the link in the email to reset your password. The link will expire in 1 hour."`
- Button: `"Back to Sign In"` → `/auth`
- Link: `"Try a different email"` (ghost) → resets form

### Data Interactions
- `supabase.auth.resetPasswordForEmail(email, { redirectTo })` with redirect to `/reset-password`
- `supabase.functions.invoke('send-password-reset', { body: { email, resetLink } })`

### Toasts
- `"Password reset email sent!"` (success)
- `"If an account exists with this email, you will receive a reset link."` (error, anti-enumeration)

---

## Route 4: `/`

### Purpose
Module home — 3-tab hub for all platform features.

### Auth/Guard
Protected (ProtectedRoute).

### Layout
Custom (not AppLayout). Sticky header + full-height tabs + floating emergency FAB.

### Header
- Logo h-8
- Right: workspace button (MapPin + facility name + RefreshCw, `hidden md:flex`) + profile dropdown (Avatar h-8)

### Profile Dropdown
- Avatar h-12 + display_name + role Badge + specialty
- `"View Profile"` → `/profile`
- `"Account Settings"` → `/profile`
- `"Security & Privacy"` → `/profile`
- (admin) `"Admin Dashboard"` → `/admin`
- `"Sign Out"` → toast `"Signed out successfully"` → `/auth`

### Welcome (when context active)
- H2: `"Welcome, {Dr/Nurse/}{name}"`
- P: `"Working from: {facilityName}"`

### Tabs
- `"Work"` (Briefcase), `"My Professional"` (Stethoscope), `"My Life"` (Heart)

### Work Tab — No Context
`<WorkplaceSelectionHub>` with 8 access mode callbacks

### Work Tab — With Context
1. Communication Noticeboard: `"Messages"`, `"Pages"`, `"Calls"` buttons + HealthDocumentScanner
2. Quick Access: `"EHR"`, `"Dashboard"`, `"Queue"`, `"Prescribe"`, `"Register"`, `"Lab"`, `"Radiology"`, `"Schedule"`
3. Module Categories: grid-cols-3 lg:grid-cols-4 with 17 ExpandableCategoryCard components

### My Professional Tab
`<MyProfessionalHub>` (`src/components/home/MyProfessionalHub.tsx`)

### My Life Tab
`<PersonalHub>` (`src/components/home/PersonalHub.tsx`)

### Emergency FAB
- Fixed bottom-6 right-6, h-16 w-16, bg-destructive, AlertTriangle h-8, animate-pulse
- Opens Dialog → `<EmergencyHub>`

---

## Route 5: `/dashboard`

### Purpose
Provider worklist, tasks, alerts, and communication hub.

### Auth/Guard
Protected. AppLayout.

### Layout
AppLayout (no title prop). Sidebar context: `home`.

### Components
- `src/pages/Dashboard.tsx`
- `src/components/alerts/MedicationDueAlerts.tsx`
- `src/components/orders/NurseMedDashboard.tsx`
- `src/components/dashboard/ProviderDashboardTabs.tsx`
- `src/components/dashboard/WorkspaceViews.tsx` (DepartmentView, TeamView)

### UI Inventory
- Welcome: `"Good {morning/afternoon/evening}, {firstName}"` + date string
- Communication card: heading `"Communication"` + `"View All"` button → `/communication`
  - 3 buttons: `"Messages"` (count 5), `"Pages"` (count 2), `"Calls"` (count 0)
- Stats grid (6 cols): `"My Patients"`, `"Pending"`, `"Referrals"`, `"Results"`, `"Critical"`, `"Done Today"`
- Quick actions (5 cols): `"Queue"` → `/queue`, `"Beds"` → `/beds`, `"Register"` → `/registration`, `"Appointments"` → `/appointments`, `"Inbox"` → `/orders`
- Worklist card: `"My Worklist"` with toggle `"Patients"` / `"Tasks"`
  - Empty patients: `"No assigned patients"`
  - Empty tasks: `"No pending tasks"`

### Data Interactions
- `useDashboardData()` hook fetches patients, tasks, orders, referrals, results, stats
- `useWorkspace()` for currentView (personal/department/team)

---

## Routes 6-7: `/encounter` and `/encounter/:encounterId`

### Purpose
Clinical EHR encounter workspace.

### Auth/Guard
Protected. Wrapped in `<ProviderContextProvider>` then `<EHRProvider>`.

### Layout
EHRLayout: TopBar (h-14) + PatientBanner + MainWorkArea + EncounterMenu (w-64).

### No Encounter ID
`<NoPatientSelected>` component

### Loading
Loader2 spinner + `"Loading patient chart..."`

### Error
- `"Unable to Load Chart"` + contextError message
- 3 buttons: `"Go Back"`, `"Back to Queue"`, `"Home"`

### TopBar (patient active)
- Left: Back, Home (→`/`), Logo h-7, separator, 10 action buttons
- Center: `"Chart Locked"` badge + patient name + MRN/ward/bed + Allergies + `"Close Chart"`
- Right: PatientSearch, ActiveWorkspaceIndicator, AIDiagnosticAssistant, AlertBadge, CDSAlertBadge, CriticalEventButton, UserMenu

### Close Chart Dialog
- Title: `"Close Patient Chart?"`
- Description: `"This will close {patientName}'s chart and return you to your worklist. Any unsaved changes may be lost."`
- Cancel: `"Continue Working"` / Confirm: `"Close Chart"`

### EncounterMenu (8 items)
1. `"Overview"` / `"Patient summary and status"`
2. `"Assessment"` / `"Clinical assessments"`
3. `"Problems & Diagnoses"` / `"Active problems and diagnoses"`
4. `"Orders & Results"` / `"Lab orders and results"`
5. `"Care & Management"` / `"Care plans and management"`
6. `"Consults & Referrals"` / `"Specialist consultations"`
7. `"Notes & Attachments"` / `"Clinical notes and documents"`
8. `"Visit Outcome"` / `"Encounter disposition"`
- Footer: `"Last saved: 2 min ago"` + green dot + `"Active"`

### Data
- `supabase.from("encounters").select(...)` with patient join
- audit_logs INSERT on chart access/close

---

## Route 8: `/queue`

### Purpose
Patient queue management across service points.

### Auth/Guard
Protected. AppLayout title=`"Queue Management"`.

### Layout
AppLayout. Sidebar context: `clinical`.

### Components
- `src/pages/Queue.tsx`
- QueueWorkstation, SupervisorDashboard, AddToQueueDialog, QueueConfigManager, QueuePathwayEditor (`src/components/queue`)
- SelfCheckInKiosk (`src/components/booking/SelfCheckInKiosk.tsx`)
- BookingManager (`src/components/booking/BookingManager.tsx`)

### UI Inventory
- Header: `"Queue Management"` / `"Manage patient queues across service points"` + AddToQueueDialog button
- 6 tabs:
  1. `"Workstation"` (Users icon)
  2. `"Supervisor"` (LayoutDashboard)
  3. `"Bookings"` (CalendarDays)
  4. `"Check-In"` (QrCode)
  5. `"Config"` (Settings)
  6. `"Pathways"` (GitBranch)

### Data
- `useQueueManagement()` hook for queues + refetch
- Supabase tables: `queue_definitions`, `queue_items`, `queue_transitions`
- RPCs: `get_queue_metrics`, `get_next_queue_sequence`, `generate_queue_ticket`

---

## Route 9: `/beds`

### Purpose
Ward bed management and admissions.

### Auth/Guard
Protected. AppLayout title=`"Bed Management"`.

### Layout
AppLayout. Sidebar context: `clinical`.

### Components
- `src/pages/Beds.tsx` → `<BedManagement>` (`src/components/ehr/beds/BedManagement.tsx`)

### Data
- Supabase table: `beds`

---

## Route 10: `/appointments`

### Purpose
Clinic appointment list with weekly calendar view.

### Auth/Guard
Protected. AppLayout title=`"Appointments"`.

### Layout
AppLayout. Sidebar context: `scheduling`.

### Components
- `src/pages/Appointments.tsx`
- BookingConfirmation, AdvancePayment (`src/components/booking/`)

### UI Inventory
- H2: `"Appointments"` / P: `"Schedule and manage patient appointments"`
- Button: `"New Appointment"` (Plus icon)
- Week navigation: `"Previous Week"` / `"Next Week"` with date range header
- 7-column grid (Mon-Sun), each day card with appointments
- Empty day: `"No appointments"`

### Schedule Dialog
- Title: `"Schedule Appointment"`
- Fields: Patient (search), Type (8 options: New Patient, Follow-up, Procedure, Consultation, Teleconsult, Lab Work, Imaging, Therapy), Priority (Urgent/High/Normal/Low), Date, Time (20 slots 08:00-17:30), Duration (15/30/45/60/90 min), Department (10 depts), Room (placeholder `"e.g., Room 101"`), Reason (textarea, placeholder `"Reason for appointment..."`)
- Buttons: `"Cancel"` / `"Schedule"` (loading: `"Scheduling..."`)

### Data
- Supabase: `appointments` table (SELECT with patient join, INSERT), `patients` table (SELECT)
- Toast: `"Appointment {status}"` on status update, error: `error.message || 'Failed to...'`

---

## Route 11: `/patients`

### Purpose
Patient search and registry directory.

### Auth/Guard
Protected. AppLayout title=`"Patients"`.

### Layout
AppLayout. Sidebar context: `clinical`.

### Components
- `src/pages/Patients.tsx`
- PatientRegistrationForm (`src/components/patients/PatientRegistrationForm.tsx`)
- PatientProfile (`src/components/patients/PatientProfile.tsx`)

### UI Inventory
- 4 stat cards: `"Total"`, `"Active"`, `"Today"`, `"Allergies"`
- Search: placeholder `"Search by name, MRN, or phone..."` + Filter + Download + `"Register"` button
- Register dialog: title `"Register New Patient"` / desc `"Enter patient demographics"`
- Card: `"Patient Directory"` with tabs: `"All ({n})"`, `"Active ({n})"`, `"Inactive ({n})"`
- Table columns: MRN, Patient Name, Age/Gender, Contact, Location, Status, actions
- Empty: `"No patients found"` (search) / `"No patients registered yet"` (no data)

### Data
- `supabase.from("patients").select("*").order("created_at", { ascending: false })`
- Toast: `"Patient registered successfully"` / `"Failed to load patients"`

---

## Route 12: `/stock`

### Purpose
Inventory management — items, levels, locations, movements.

### Auth/Guard
Protected. Custom header (not AppLayout wrapper; uses own sticky header).

### Layout
Custom standalone with sticky header + container. Sidebar context: `operations`.

### Components
- `src/pages/Stock.tsx`
- StockAlertsDashboard, PurchaseOrderManager, StockCountWorkflow (`src/components/stock/`)

### UI Inventory
- Header: Package icon + `"Stock Management"` / `"Inventory, items, and movements"`
- Buttons: `"Stock Movement"` (ArrowRightLeft) + `"Add Item"` (Plus)
- 4 stat cards: `"Total Items"`, `"Locations"`, `"Low Stock Items"`, `"Categories"`
- Low stock alert card: `"Low Stock Alert"` with item badges
- 6 tabs: `"Stock Items"`, `"Stock Levels"`, `"Locations"`, `"Alerts"`, `"Purchase Orders"`, `"Stock Counts"`
- Search: placeholder `"Search items..."`
- Items table: SKU, Item Name, Unit, Unit Cost, Selling Price, Total Stock, Reorder Level, Status (Low/OK)
- Levels table: Item, Location, Quantity, Reserved, Batch, Expiry
- Empty items: `"No items found"` / `"No stock items added yet"`
- Empty levels: `"No stock levels recorded yet"`

### Dialogs
- Stock Movement: title `"Record Stock Movement"` / desc `"Transfer, receive, or issue stock"`
- Add Item: title `"Add Stock Item"` / desc `"Add a new item to inventory"`
- Add Location: title `"Add Location"`

### Data
- Supabase: `stock_items`, `stock_levels` (with joins), `stock_locations`, `stock_categories`, `stock_movements`
- Toast: `"Failed to load stock data"`

---

## Route 13: `/consumables`

### Purpose
Consumable usage tracking, charge capture, and pricing rules.

### Auth/Guard
Protected. Custom standalone header (not wrapped in AppLayout).

### Layout
Custom with sticky header. Sidebar context: `operations`.

### Components
- `src/pages/Consumables.tsx`
- ChargeCaptureQueue, PricingRulesManager (`src/components/charges/`)

### UI Inventory
- Header: Syringe icon + `"Consumables & Charges"` / `"Track usage, billing, and pricing"`
- Button: `"Record Usage"` (Plus)
- 3 tabs: `"Usage Records"` (Package), `"Charge Queue"` (DollarSign), `"Pricing Rules"` (Settings)
- Search: placeholder `"Search by item, encounter, or patient..."`
- Usage table: Date/Time, Item, Quantity, Patient/Encounter, Location, Cost, Notes
- Empty: `"No usage records found"`

### Record Usage Dialog
- Title: `"Record Consumable Usage"` / Desc: `"Record consumables used for a patient encounter"`
- Fields: Patient Encounter *, Consumable Item *, Dispensing Location *, Quantity *, Batch Number (optional), Notes (placeholder `"Additional notes..."`)
- Cost preview: Unit Cost + Total Cost
- Submit: `"Record Usage"` / loading: `"Recording..."`

### Data
- Supabase: `consumable_usage` (with joins to stock_items, stock_locations, encounters), `stock_items`, `stock_locations`, `encounters`, `stock_levels`, `stock_movements`
- Toast success: `"Consumable usage recorded successfully"` / error: `"Failed to record usage: " + error.message`

---

## Route 14: `/charges`

### Purpose
Encounter charges and billing item management.

### Auth/Guard
Protected. Custom standalone header.

### Layout
Custom with sticky header. Sidebar context: `operations`.

### Components
- `src/pages/Charges.tsx`

### UI Inventory
- Header: DollarSign icon + `"Charges & Billing"` / `"Manage encounter charges and billing items"`
- 2 tabs: `"Encounter Charges"` (default), `"Charge Items"`
- Charges tab button: `"Add Charge"` / Items tab button: `"New Charge Item"`
- Search: (inline in main content)
- Charges table: Date, Item, Encounter, Patient, Qty, Amount, Tax, Total, Status, Actions
- Items table: Code, Name, Category, Base Price, Taxable, Tax Rate, Status

### Add Charge Dialog
- Title: `"Add Encounter Charge"` / Desc: `"Add a charge to a patient encounter"`
- Fields: Patient Encounter *, Charge Item *, Quantity *, Discount %, Notes
- Cost preview: Subtotal, Discount, Tax, Total
- Submit: `"Add Charge"` / loading: `"Adding..."`

### Create Charge Item Dialog
- Title: `"Create Charge Item"` / Desc: `"Add a new billable item to the charge catalog"`
- Fields: Item Code * (placeholder `"e.g., CONS-001"`), Category * (Consultation/Procedure/Laboratory/Radiology/Pharmacy/Supplies/Room & Board/Other), Item Name *, Description, Base Price *, Is Taxable (switch), Tax Rate
- Submit: `"Create Item"` / loading: `"Creating..."`

### Data
- Supabase: `encounter_charges`, `charge_items`, `encounters`
- Toasts: `"Charge added successfully"`, `"Charge voided successfully"`, `"Charge item created successfully"`

---

## Route 15: `/registration`

### Purpose
New patient registration, visit creation, and IAM architecture view.

### Auth/Guard
Protected. AppLayout.

### Layout
AppLayout. Sidebar context: `home`.

### Components
- `src/pages/Registration.tsx`
- RegistrationWizard (`src/components/registration/RegistrationWizard.tsx`)
- VisitCreation (`src/components/registration/VisitCreation.tsx`)
- IAMArchitecture (`src/components/registration/IAMArchitecture.tsx`)

### UI Inventory — Menu View
- H2: `"Patient Registration & Identity"` (centered)
- P: `"Register new clients, create visits, and manage identity with biometric verification"`
- 3 cards:
  1. `"New Client Registration"` / `"Register a new patient with demographics, biometrics, and consent"` / tags: Demographics, Biometric ID, FHIR Consent
  2. `"Create New Visit"` / `"Start a new encounter for an existing or new patient"` / tags: Patient Lookup, Biometric Verify, Visit Details
  3. `"IAM & Consent Architecture"` / `"View KeyCloak, eSignet integration and consent management flows"` / tags: KeyCloak, eSignet, FHIR Consent
- 4 stat cards: `"Registered Today"` (24), `"Biometric Captures"` (156), `"Consents Collected"` (89), `"Visits Created"` (42)

### Sub-views
- Registration: AppLayout title=`"New Client Registration"`, Back button `"Back"`
- Visit: AppLayout title=`"Create New Visit"`
- IAM: AppLayout title=`"IAM Architecture"`

### Toasts
- `"Patient registered successfully!"` / `"{firstName} {lastName} has been added to the system."`
- `"Visit created successfully!"` / `"The patient has been checked in."`

---

## Route 16: `/profile`

### Purpose
Account settings, identity management, security.

### Auth/Guard
Protected. Standalone (not AppLayout — custom gradient background).

### Layout
Standalone centered layout. Sidebar context: `home`.

### Components
- `src/pages/ProfileSettings.tsx`
- AvatarUpload, UserSessions, PasswordChange, LoginHistory, TrustedDevices, ActivityExport (`src/components/profile/`)
- TwoFactorSetup, EmailVerificationStatus (`src/components/auth/`)
- ProviderRegistryCard, ClientRegistryCard (`src/components/profile/`)

### UI Inventory
- Back button → `/`
- H1: `"My Profile"` / P: `"Manage your account, identity, and settings"`
- Avatar card with display_name, role badge, specialty, department, email
- 3 tabs: `"Identity"` (User), `"Account"` (Settings), `"Security"` (Shield)

### Identity Tab
- Provider Registry card (ProviderRegistryCard)
- Client Registry card (ClientRegistryCard)
- Profile form: `"Display Name"`, `"Specialty"`, `"Department"`, `"Phone"`, `"License Number"`
- Submit: `"Save Changes"` (Save icon) / loading: Loader2 + `"Saving..."`

### Data
- `supabase.from('profiles').update({...}).eq('user_id', user.id)`
- `supabase.functions.invoke('totp-management', { body: { action: 'check' } })`
- Toast: `"Profile updated successfully!"` / error: `"Failed to update profile: " + error.message`

### Validation (Zod)
- display_name: required, max 100
- specialty: max 100
- department: max 100
- phone: max 20
- license_number: max 50

---

## Route 17: `/admin`

### Purpose
System admin — user management, audit logs, security events, sessions.

### Auth/Guard
Protected. AppLayout (no explicit title in code). Requires `manage_users` permission or `admin` role.

### Layout
AppLayout. Sidebar context: `admin`.

### Components
- `src/pages/AdminDashboard.tsx`
- SessionsManagement, SystemSettings, SecurityEvents, LockedAccounts, IpWhitelist, ForcePasswordReset (`src/components/admin/`)

### UI Inventory
- 7 tabs: `"Users"`, `"Audit"`, `"Sessions"`, `"Security"`, `"Settings"`, `"Lockouts"`, `"IP Whitelist"`
- Users tab: search + role filter (All/Doctor/Nurse/Specialist/Patient/Admin), user table, edit role dialog, bulk role change
- Audit tab: date range filter, action filter, table with performer/target/action/entity
- Access denied: `"Access Denied"` / `"You don't have permission to access the admin dashboard"`

### Data
- `supabase.from('profiles').select('*')` for users
- `supabase.from('audit_logs').select('*').eq('entity_type', 'profile')` for audit
- Role updates: `supabase.from('profiles').update({ role }).eq('id', userId)` + audit_logs INSERT
- Toast: `"Role updated successfully"`, `"Failed to fetch users"`, etc.

---

## Route 18: `/pharmacy`

### Purpose
Medication dispensing and tracking.

### Auth/Guard
Protected. AppLayout title=`"Pharmacy"`.

### Layout
AppLayout. Sidebar context: `clinical`.

### Components
- `src/pages/Pharmacy.tsx` → `<MedicationDispensing>` (`src/components/pharmacy/MedicationDispensing.tsx`)

---

## Route 19: `/theatre`

### Purpose
Surgical booking system.

### Auth/Guard
Protected. AppLayout title=`"Theatre Booking"`.

### Layout
AppLayout. Sidebar context: `scheduling`.

### Components
- `src/pages/Theatre.tsx` → `<TheatreBookingSystem>` (`src/components/booking/TheatreBookingSystem.tsx`)

---

## Route 20: `/payments`

### Purpose
Patient billing, payment processing, claims, and reconciliation.

### Auth/Guard
Protected. AppLayout title=`"Payments & Billing"`.

### Layout
AppLayout. Sidebar context: `operations`.

### Components
- `src/pages/Payments.tsx`
- CashierBillingDashboard, CashReconciliation, PaymentGateway, CBZBankIntegration, HealthWallet, PaymentMethods, ClaimsManagement, RemittanceProcessing, CostTrackingDashboard (`src/components/payments/`)

### UI Inventory
- 9 tabs (scrollable): `"Cashier Dashboard"`, `"Cash Reconciliation"`, `"Payment Gateway"`, `"CBZ Bank"`, `"Health Wallet"`, `"Payment Methods"`, `"Claims Management"`, `"Remittance Processing"`, `"Cost Tracking"`

---

## Route 21: `/pacs`

### Purpose
Radiology PACS imaging — worklist, viewer, teleradiology, critical findings.

### Auth/Guard
Protected. AppLayout title=`"PACS Imaging"`.

### Layout
AppLayout. Sidebar context: `clinical`.

### Components
- `src/pages/PACS.tsx`
- RadiologistWorklist, PACSViewer, TeleradiologyHub, CriticalFindingsManager, PACSAdminDashboard (`src/components/imaging/`)

### UI Inventory
- 5 tabs: `"Worklist"` (ListTodo), `"Viewer"` (Monitor), `"Teleradiology"` (Globe), `"Critical Findings"` (AlertTriangle), `"Admin"` (Settings)

---

## Route 22: `/lims`

### Purpose
Laboratory information management system.

### Auth/Guard
Protected. AppLayout title=`"Laboratory Information System"`.

### Layout
AppLayout. Sidebar context: `clinical`.

### Components
- `src/pages/LIMS.tsx` → `<LIMSIntegration>` (`src/components/lab/LIMSIntegration.tsx`)

---

## Route 23: `/portal`

### Purpose
Patient self-service portal.

### Auth/Guard
Public. Standalone layout.

### Components
- `src/pages/Portal.tsx` → `<PatientPortal>` (`src/components/portal/PatientPortal.tsx`)

---

## Route 24: `/install`

### Purpose
PWA install instructions and status.

### Auth/Guard
Public. Standalone layout.

### Components
- `src/pages/Install.tsx`

### UI Inventory
- Logo: impilo-logo.png h-12
- P: `"Install the app on your device for the best experience"`
- Status badge: `"Online"` (green) / `"Offline Mode"` (destructive)
- Card title: `"Install Impilo"` (not installed) / `"App Installed!"` (installed)
- Desc: `"Add Impilo to your home screen for quick access"` / `"You're all set! Access Impilo from your home screen."`
- Install button: `"Install Now"` (Download icon)
- Installed: CheckCircle2 + `"Successfully Installed"` / `"Open the app from your home screen or app drawer"`
- Mobile instructions: `"Mobile (iOS/Android)"` with 3 steps
- Desktop instructions: `"Desktop (Chrome/Edge)"` with 3 steps
- 4 feature cards: `"Fast & Reliable"`, `"Offline Ready"`, `"Push Notifications"`, `"Secure"`

---

## Route 25: `/odoo`

### Purpose
ERP integration panel.

### Auth/Guard
Protected. AppLayout title=`"Odoo ERP Integration"`.

### Layout
AppLayout. Sidebar context: `admin`.

### Components
- `src/pages/Odoo.tsx` → `<OdooIntegration>` (`src/components/integrations/OdooIntegration.tsx`)

---

## Route 26: `/reports`

### Purpose
Analytics dashboards and custom report builder.

### Auth/Guard
Protected. AppLayout title=`"Reports & Analytics"`.

### Layout
AppLayout. Sidebar context: `home`.

### Components
- `src/pages/Reports.tsx`
- ReportingDashboard, CustomReportBuilder (`src/components/analytics/`)

### UI Inventory
- 2 tabs: `"Dashboard"`, `"Report Builder"`

---

## Route 27: `/orders`

### Purpose
Clinical order entry, medication administration, inbox.

### Auth/Guard
Protected. AppLayout title=`"Order Entry System"`.

### Layout
AppLayout. Sidebar context: `clinical`. Grid: lg:grid-cols-4.

### Components
- `src/pages/Orders.tsx`
- PatientSelector, OrderEntrySystem, PatientOrdersView, MedicationAdministration, MedicationTimeline, MedicationReconciliation, MARTimelineView (`src/components/orders/`)
- EscalatingMedicationAlerts (`src/components/alerts/`)
- ProviderInbox (`src/components/inbox/`)

### UI Inventory
- Left sidebar (lg:col-span-1): PatientSelector
- Main (lg:col-span-3): 8 tabs:
  1. `"Provider Inbox"` (Inbox)
  2. `"New Orders"` (ShoppingCart)
  3. `"View Orders"` (ClipboardList) — disabled without patient
  4. `"Administer Meds"` (Syringe) — disabled without patient
  5. `"Med Timeline"` (Timer) — disabled without patient
  6. `"Reconciliation"` (FileText) — disabled without patient
  7. `"MAR View"` (LayoutGrid)
  8. `"Critical Alerts"` (AlertTriangle)
- No encounter: `"No active encounter for this patient"` / `"Medication administration requires an active encounter"`

---

## Route 28: `/handoff`

### Purpose
Shift handoff report creation and history.

### Auth/Guard
Protected. AppLayout title=`"Shift Handoff"`.

### Layout
AppLayout. Sidebar context: `clinical`.

### Components
- `src/pages/Handoff.tsx`
- ShiftHandoffReport, HandoffHistory (`src/components/handoff/`)

### UI Inventory
- 2 tabs: `"New Handoff"` (ClipboardList), `"History"` (History)

---

## Route 29: `/help`

### Purpose
FAQs, user guides, documentation, support.

### Auth/Guard
Protected. AppLayout title=`"Help & Support"`.

### Layout
AppLayout. Sidebar context: `home`.

### Components
- `src/pages/HelpDesk.tsx`

### UI Inventory
- Tabs with FAQ categories, user guides, documentation sections
- FAQs include: `"How do I register a new patient?"`, `"How do I admit a patient to a bed?"`, `"How do I order medications?"`

---

## Route 30: `/catalogue`

### Purpose
Browse health products (public).

### Auth/Guard
Public. Standalone layout.

### Components
- `src/pages/ProductCatalogue.tsx`

### UI Inventory
- Search: product search
- Category filter with icons (Pharmaceutical, Medical Device, Laboratory, etc.)
- View modes: grid / list
- Product cards with name, generic name, prescription/controlled badges

### Data
- Supabase: `product_categories`, `products` (with category + manufacturer joins)

---

## Route 31: `/marketplace`

### Purpose
Compare prices and order from vendors (public).

### Auth/Guard
Public. Standalone layout.

### Components
- `src/pages/HealthMarketplace.tsx`
- VendorRatingDisplay, PackageDeals (`src/components/marketplace/`)

### UI Inventory
- Search, vendor listings, product comparison
- Vendor cards with ratings, delivery info

### Data
- Supabase: `vendor_products` (with product + vendor joins), `vendors`

---

## Route 32: `/admin/product-registry`

### Purpose
Product catalogue management (admin).

### Auth/Guard
Protected. AppLayout. Sidebar context: `admin`.

### Components
- `src/pages/admin/ProductManagement.tsx`

### Data
- Supabase: `products`, `product_categories`, `manufacturers`

---

## Route 33: `/fulfillment`

### Purpose
Prescription fulfillment — request creation, bidding, vendor selection.

### Auth/Guard
Protected. AppLayout. Sidebar context: `home`.

### Components
- `src/pages/PrescriptionFulfillment.tsx`
- OrderDetailsDialog (`src/components/fulfillment/`)
- useFulfillmentActions hook

### UI Inventory
- Header with back button + `"Prescription Fulfillment"`
- Tabs for request management, bidding, tracking
- Status pipeline: draft → submitted → bidding → awarded → confirmed → processing → ready → dispatched → delivered → completed

### Data
- Supabase: `fulfillment_requests` (with items/bids/patient/vendor joins), `fulfillment_items`, `vendor_bids`
- RPC: `generate_fulfillment_number`

---

## Route 34: `/vendor-portal`

### Purpose
Vendor bid management and order fulfillment.

### Auth/Guard
Protected. AppLayout. Sidebar context: `home`.

### Components
- `src/pages/VendorPortal.tsx`
- BidNotifications, VendorRatingDisplay (`src/components/marketplace/`)
- OrderDetailsDialog (`src/components/fulfillment/`)

### Data
- Supabase: `fulfillment_requests`, `vendor_bids`, `vendors`

---

## Route 35: `/scheduling`

### Purpose
Advanced appointment scheduling with calendar views.

### Auth/Guard
Protected. AppLayout. Sidebar context: `scheduling`.

### Components
- `src/pages/scheduling/AppointmentScheduling.tsx`

### Data
- Supabase: `appointments` (with patient joins)

---

## Route 36: `/scheduling/theatre`

### Purpose
Surgical suite calendar and booking.

### Auth/Guard
Protected. AppLayout. Sidebar context: `scheduling`.

### Components
- `src/pages/scheduling/TheatreScheduling.tsx`

### Data
- Supabase: `theatre_bookings`

---

## Route 37: `/scheduling/noticeboard`

### Purpose
Provider announcements and updates.

### Auth/Guard
Protected. AppLayout. Sidebar context: `scheduling`.

### Components
- `src/pages/scheduling/ProviderNoticeboard.tsx`

### Data
- Supabase: `announcements`, `announcement_acknowledgments`

---

## Route 38: `/scheduling/resources`

### Purpose
Room and equipment resource calendar.

### Auth/Guard
Protected. AppLayout. Sidebar context: `scheduling`.

### Components
- `src/pages/scheduling/ResourceCalendar.tsx`

### Data
- Supabase: `resource_bookings`, `scheduling_resources`

---

## Route 39: `/id-services`

### Purpose
Health ID generation, validation, batch generation, and recovery.

### Auth/Guard
Protected. AppLayout. Sidebar context: `home`.

### Components
- `src/pages/IdServices.tsx`
- IdGenerationCard, IdRecoveryPanel, IdValidationCard, IdBatchGenerator (`src/components/id/`)
- PHIDService, ProviderIdService, IdGenerationService (services)

### UI Inventory
- 5 tabs (URL-synced via `?tab=`):
  1. `"generate"` — ID generation
  2. `"validate"` — ID validation
  3. `"batch"` — Batch generator
  4. `"recovery"` — ID recovery
  5. `"architecture"` — Architecture view

### Data
- RPCs: `generate_impilo_id`, `generate_client_registry_id`, `generate_shr_id`, `generate_provider_registry_id`, `generate_facility_registry_id`

---

## Route 40: `/communication`

### Purpose
Messages, pages, and calls hub.

### Auth/Guard
Protected. AppLayout (no explicit title).

### Layout
AppLayout. Sidebar context: `clinical`.

### Components
- `src/pages/Communication.tsx` → `<CommunicationHub>` (`src/components/communication/CommunicationHub.tsx`)
- Reads `?tab=` URL param (messages/pages/calls), defaults to `"messages"`

---

## Route 41: `/social`

### Purpose
Professional networking — timeline, communities, clubs, pages, crowdfunding.

### Auth/Guard
Protected. AppLayout. Sidebar context: `portal`.

### Components
- `src/pages/Social.tsx`
- TimelineFeed, CommunitiesList, ClubsList, ProfessionalPages, CrowdfundingCampaigns, NewsFeedWidget (`src/components/social/`)

### UI Inventory
- Multiple tabs for timeline, communities, clubs, professional pages, crowdfunding

### Data
- Supabase: `posts`, `communities`, `clubs`, `professional_pages`, `crowdfunding_campaigns`

---

## Route 42: `/kiosk`

### Purpose
Self-service patient check-in kiosk.

### Auth/Guard
Public. Standalone layout.

### Components
- `src/pages/Kiosk.tsx` → `<SelfCheckInKiosk facilityName="Impilo Health Center">` (`src/components/booking/SelfCheckInKiosk.tsx`)

---

## Route 43: `/registry-management`

### Purpose
Central HIE registry management hub.

### Auth/Guard
Protected. AppLayout. Sidebar context: `registry`.

### Components
- `src/pages/RegistryManagement.tsx`
- Uses `useRegistryAdmin()` and `useRegistryRecords()` hooks

### UI Inventory
- 3 registry tabs:
  1. `"Client Registry"` (Users) / `"MOSIP - Patient Identity"`
  2. `"Provider Registry"` (UserCog) / `"Varapi - Healthcare Workers"`
  3. `"Facility Registry"` (Building2) / `"Thuso - Health Facilities"`
- Each with pending count badges, search, and status filters

### Data
- Supabase: `client_registry`, `health_providers`, `facilities`
- Permission: `has_registry_role` RPC

---

## Route 44: `/hpr`

### Purpose
National Health Provider Registry with lifecycle management.

### Auth/Guard
Protected. AppLayout. Sidebar context: `registry`.

### Components
- `src/pages/HealthProviderRegistry.tsx`

### Data
- Supabase: `health_providers`, `provider_licenses`, `provider_affiliations`, `eligibility_decisions`
- RPC: `check_provider_eligibility`

---

## Route 45: `/facility-registry`

### Purpose
Master Facility List (MFL) management, OpenHIE/GOFR compliant.

### Auth/Guard
Protected. AppLayout. Sidebar context: `registry`.

### Components
- `src/pages/FacilityRegistry.tsx`
- FacilityDashboard, FacilityList, FacilityDetailPanel, FacilityRegistrationWizard, FacilityMapView, FacilityReconciliation, FacilityChangeRequests, FacilityReferenceData (`src/components/facility/`)

### Data
- Supabase: `facilities` + related tables
- Hooks: `useFacilityData`, `useFacilityTypes`, `useFacilityAdminHierarchies`

---

## Route 46: `/client-registry`

### Purpose
National health ID registry, FHIR R4 compliant.

### Auth/Guard
Protected. AppLayout. Sidebar context: `registry`.

### Components
- `src/pages/ClientRegistry.tsx`
- ClientRegistryDashboard, ClientList, ClientDetailPanel, ClientRegistrationWizard, ClientDuplicateQueue, ClientMergeHistory (`src/components/clientRegistry/`)

### Data
- Supabase: `client_registry` + related
- Hook: `useClientRegistryData`

---

## Route 47: `/operations`

### Purpose
Operations hub — shift control, roster, on-duty, cover requests, control tower.

### Auth/Guard
Protected. AppLayout. Sidebar context: `operations`.

### Components
- `src/pages/Operations.tsx`
- ShiftControlPanel, ShiftIndicator (`src/components/shift/`)
- RosterDashboard, OnDutyView, CoverRequestWorkflow (`src/components/roster/`)
- FacilityControlTower (`src/components/operations/`)

### UI Inventory
- URL-synced tabs via `?tab=`:
  1. `"shift"` — Shift Control (Clock)
  2. `"roster"` — Roster (Calendar)
  3. `"on-duty"` — On Duty (Users)
  4. `"tasks"` — Task Board (ClipboardList)
  5. `"cover"` — Cover Requests (ArrowRightLeft)
  6. `"facility"` — Facility (Building2)
  7. `"tower"` — Control Tower (Gauge)

### Data
- Sets page context to `"operations"` via `useWorkspace().setPageContext`
- RPCs: `get_active_shift`, `get_todays_roster_assignment`, `is_operational_supervisor`, `get_facility_ops_mode`

---

## Route 48: `/above-site`

### Purpose
District/provincial oversight dashboard.

### Auth/Guard
Protected. AppLayout. Sidebar context: `admin`.

### Components
- `src/pages/AboveSiteDashboard.tsx`
- InterventionsList (`src/components/aboveSite/`)
- Uses `useAboveSiteRole()` hook

### UI Inventory
- Facility overview with queue metrics, staff on duty, SLA breaches
- Jurisdiction metrics cards
- Tabs for facilities, interventions, metrics

### Data
- Supabase: `above_site_roles`, `above_site_sessions`, `above_site_audit_log`, `above_site_interventions`
- RPCs: `has_above_site_role`, `get_above_site_roles`, `get_jurisdiction_scope`, `can_access_facility_in_jurisdiction`

---

## Route 49: `/telemedicine`

### Purpose
Teleconsultation hub.

### Auth/Guard
Protected. Standalone layout (no AppLayout wrapper).

### Layout
Custom `min-h-screen bg-background`. Sidebar context: `clinical`.

### Components
- `src/pages/Telemedicine.tsx` → `<FullCircleTelemedicineHub>` (`src/components/ehr/consults`)

---

## Route 50: `/sorting`

### Purpose
Front desk patient arrival and triage sorting.

### Auth/Guard
Protected. AppLayout title=`"Patient Sorting"`.

### Layout
AppLayout. Sidebar context: `clinical`.

### Components
- `src/pages/PatientSorting.tsx` → `<PatientSortingDesk>` (`src/components/sorting`)
- Uses `useFacility()` for currentFacility

---

## Route 51: `/discharge`

### Purpose
Discharge, death, and exit workflows.

### Auth/Guard
Protected. AppLayout (implied via component).

### Layout
Sidebar context: `clinical`.

### Components
- `src/pages/Discharge.tsx` → `<DischargeDashboard>` (`src/components/discharge`)

### Data
- Supabase: `discharge_cases`, `discharge_clearances`
- Trigger: `create_discharge_clearances` (auto-creates clearance items on insert)

---

## Route 52: `/workspace-management`

### Purpose
Workspace configuration and management for facilities.

### Auth/Guard
Protected. AppLayout. Sidebar context: `admin`.

### Components
- `src/pages/WorkspaceManagement.tsx`
- Uses `useSystemRoles()` hook

### UI Inventory
- Tabs for workspace types, facility selection, workspace CRUD
- Workspace properties: name, type (admin/clinical/support), service tags, sort order

### Data
- Supabase: `workspaces`, `workspace_memberships`, `facilities`
- RPCs: `get_user_workspaces`, `can_access_workspace`

---

## Route 53: `/landela`

### Purpose
Document management and scanning.

### Auth/Guard
Protected. AppLayout. Sidebar context: `admin`.

### Components
- `src/pages/Landela.tsx`

### UI Inventory
- Tabs for document scanning, search, filing
- Upload, filter, search functionality

---

## Route 54: `/shared/:type/:token`

### Purpose
Token-secured shared clinical summaries (IPS or visit).

### Auth/Guard
Public. Standalone layout.

### Components
- `src/pages/SharedSummary.tsx`
- PatientSummaryViewer, VisitSummaryViewer (`src/components/summaries`)

### UI Inventory
- Loading: Loader2 + `"Loading shared summary..."`
- Error states:
  - `"Invalid share link"`
  - `"This share link is invalid or has been revoked"`
  - `"This share link has expired"`
- Access info: badge with access level, expiry, recipient type
- Renders PatientSummaryViewer (type=ips) or VisitSummaryViewer (type=visit)

### Data
- Supabase: `summary_share_tokens` (SELECT by token + type), `clinical_documents` (SELECT by document_id)

---

## Route 55: `/admin/tshepo/consents`

### Purpose
TSHEPO FHIR R4 consent management — search, create, revoke.

### Auth/Guard
Protected. AppLayout. Sidebar context: `admin`.

### Components
- `src/pages/admin/TshepoConsentAdmin.tsx`

### UI Inventory
- Search by CPID, status filter (active/revoked/expired)
- Create consent dialog with fields: patient_cpid, grantor_ref, grantee_ref, purpose_of_use, provision_type, scope_code
- Table with consent records, revoke button

### Data
- Supabase: `trust_layer_consent` (SELECT, INSERT, UPDATE for revoke)
- Toast: `"Consent created"`, `"Consent revoked"`

---

## Route 56: `/admin/tshepo/audit`

### Purpose
TSHEPO hash-chained audit ledger search and verification.

### Auth/Guard
Protected. AppLayout. Sidebar context: `admin`.

### Components
- `src/pages/admin/TshepoAuditSearch.tsx`

### UI Inventory
- Filters: actor_id, action (ilike), decision (all/permit/deny/indeterminate)
- Table columns: chain_sequence, record_hash, actor_id, action, resource_type, decision, occurred_at
- Pagination (50 per page)

### Data
- Supabase: `tshepo_audit_ledger` (SELECT with filters, ordered by chain_sequence DESC)

---

## Route 57: `/admin/tshepo/breakglass`

### Purpose
Break-glass emergency access — request and supervisor review queue.

### Auth/Guard
Protected. AppLayout. Sidebar context: `admin`.

### Components
- `src/pages/admin/TshepoBreakGlass.tsx`

### UI Inventory
- 2 tabs: `"Request"`, `"Review Queue"`
- Request form: patient_cpid, justification (textarea), emergency_type (clinical_emergency/public_health_emergency/medico_legal)
- Review queue: table with approve/deny buttons + review notes

### Data
- Supabase: `tshepo_breakglass_requests` (SELECT pending, INSERT, UPDATE for approve/deny)
- Toast: `"Break-glass request submitted"`, `"Request approved"`, `"Request denied"`

---

## Route 58: `/admin/tshepo/access-history`

### Purpose
Patient access history — paginated, redacted view.

### Auth/Guard
Protected. AppLayout. Sidebar context: `admin`.

### Components
- `src/pages/admin/TshepoPatientAccessHistory.tsx`

### UI Inventory
- Input: Patient CPID search
- Table: occurred_at, accessor_type, accessor_role, facility_ref, action, purpose_of_use, resource_type, decision, is_break_glass, is_redacted
- Pagination (20 per page)

### Data
- Supabase: `tshepo_patient_access_log` (SELECT by patient_cpid)

---

## Route 59: `/admin/tshepo/offline`

### Purpose
Offline token and O-CPID status, reconciliation.

### Auth/Guard
Protected. AppLayout. Sidebar context: `admin`.

### Components
- `src/pages/admin/TshepoOfflineStatus.tsx`

### UI Inventory
- 2 tabs: `"Offline Tokens"` (Key), `"O-CPIDs"` (Fingerprint)
- Offline tokens table with revoke capability
- O-CPIDs table with reconciliation status

### Data
- Supabase: `trust_layer_offline_tokens`, `trust_layer_offline_cpids`

---

## Route 60: `/admin/vito/patients`

### Purpose
VITO patient identity records management.

### Auth/Guard
Protected. AppLayout. Sidebar context: `admin`.

### Components
- `src/pages/admin/VitoPatients.tsx`

### UI Inventory
- Back button → `/admin`
- Search by health_id, crid, cpid
- Create patient dialog: health_id, crid, cpid fields
- Table: health_id, crid, cpid, lifecycle_status, created_at

### Data
- Supabase: `vito_patients` (SELECT, INSERT)
- Toast: `"Patient created"`

---

## Route 61: `/admin/vito/merges`

### Purpose
VITO patient merge request queue.

### Auth/Guard
Protected. AppLayout. Sidebar context: `admin`.

### Components
- `src/pages/admin/VitoMergeQueue.tsx`

### UI Inventory
- Back button → `/admin`
- Create merge dialog: survivor_id, merged_ids (comma-separated), reason
- Queue table with approve/reject actions
- Auto-merge toggle from config

### Data
- Supabase: `vito_merge_requests` (SELECT, INSERT, UPDATE), `vito_config`
- Toast: `"Merge request created"`, `"Merge approved"`, `"Merge rejected"`

---

## Route 62: `/admin/vito/events`

### Purpose
VITO domain event log viewer.

### Auth/Guard
Protected. Standalone layout (no AppLayout wrapper).

### Components
- `src/pages/admin/VitoEventsViewer.tsx`

### UI Inventory
- Back button → `/admin`
- Filter by correlation_id, request_id, or event_type
- Table: occurred_at, event_type, correlation_id, request_id
- Detail dialog with full event payload (JSON)

### Data
- Supabase: `vito_event_envelopes` (SELECT)

---

## Route 63: `/admin/vito/audit`

### Purpose
VITO audit trail viewer.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/VitoAuditViewer.tsx`

### UI Inventory
- Back button → `/admin`
- Filter by correlation_id, request_id, actor_id, action
- Table: created_at, actor_id, action, resource_type, correlation_id

### Data
- Supabase: `vito_audit_log` (SELECT)

---

## Route 64: `/admin/tuso/facilities`

### Purpose
TUSO facility registry management.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/TusoFacilities.tsx`

### UI Inventory
- Search + status filter (all/ACTIVE/SUSPENDED)
- Create facility dialog
- Facility list with version history viewer

### Data
- Supabase: `tuso_facilities`, `tuso_facility_versions`

---

## Route 65: `/admin/tuso/workspaces`

### Purpose
TUSO workspace configuration per facility.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/TusoWorkspaces.tsx`

### UI Inventory
- Facility selector dropdown
- Workspace list with create dialog
- Override management per workspace

### Data
- Supabase: `tuso_facilities`, `tuso_workspaces`, `tuso_workspace_overrides`

---

## Route 66: `/admin/tuso/start-shift`

### Purpose
TUSO shift start workflow.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/TusoStartShift.tsx`

### UI Inventory
- Facility selector, workspace multi-select (checkboxes)
- Start Shift button (Play icon)
- Success state: CheckCircle + confirmation

### Data
- Supabase: `tuso_facilities`, `tuso_workspaces`, `tuso_shifts`

---

## Route 67: `/admin/tuso/resources`

### Purpose
TUSO resource (room/equipment) management and booking.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/TusoResources.tsx`

### UI Inventory
- Facility selector
- Resource list with create dialog
- Resource booking dialog with calendar

### Data
- Supabase: `tuso_facilities`, `tuso_resources`, `tuso_resource_bookings`

---

## Route 68: `/admin/tuso/config`

### Purpose
TUSO facility configuration (JSON editor).

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/TusoConfig.tsx`

### UI Inventory
- Facility selector
- JSON config editor (textarea)
- Configuration history list with rollback

### Data
- Supabase: `tuso_facilities`, `tuso_facility_config`, `tuso_config_history`

---

## Route 69: `/admin/tuso/control-tower`

### Purpose
TUSO control tower — real-time facility monitoring.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/TusoControlTower.tsx`

### UI Inventory
- Facility selector
- Alert list with acknowledge/resolve actions
- Occupancy metrics
- Resource status overview
- Telemetry data

### Data
- Supabase: `tuso_facilities`, `tuso_control_tower_alerts`, `tuso_occupancy_snapshots`, `tuso_resources`, `tuso_telemetry`

---

## Route 70: `/admin/varapi/providers`

### Purpose
VARAPI provider registry — CRUD, search, lifecycle.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/VarapiProviders.tsx`

### UI Inventory
- Back button → `/admin`
- Search + status filter (ALL/ACTIVE/PENDING_APPROVAL/SUSPENDED)
- Tabs for providers + affiliations
- Create provider dialog

### Data
- Supabase: `varapi_providers`, `varapi_affiliations`

---

## Route 71: `/admin/varapi/privileges`

### Purpose
VARAPI privilege request approval queue.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/VarapiPrivileges.tsx`

### UI Inventory
- Back button → `/admin`
- Filter by status (PENDING/APPROVED/DENIED)
- Table with approve/deny buttons + reason input

### Data
- Supabase: `varapi_privilege_requests`

---

## Route 72: `/admin/varapi/councils`

### Purpose
VARAPI regulatory council configuration.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/VarapiCouncils.tsx`

### UI Inventory
- Back button → `/admin`
- Create council dialog: name, council_type_code, mode (SOR)
- Tabs for councils + bulk import

### Data
- Supabase: `varapi_councils`

---

## Route 73: `/admin/varapi/tokens`

### Purpose
VARAPI token issuance and management.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/VarapiTokens.tsx`

### UI Inventory
- Back button → `/admin`
- Issue token: provider_id input + issue button
- Issued token display with show/hide toggle + copy
- Active tokens table with revoke
- Revocation events log

### Data
- Supabase: `varapi_tokens`, `idp_revocation_events`
- `varapiClient` for token operations

---

## Route 74: `/admin/varapi/portal`

### Purpose
VARAPI self-service portal for providers.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/VarapiPortal.tsx`

### UI Inventory
- Back button → `/admin`
- Tabs: profile view, CPD summary, license status
- Step-up authentication prompt

### Data
- Supabase: `varapi_providers`, `varapi_affiliations`
- RPC: `get_cpd_summary`

---

## Route 75: `/admin/butano/timeline`

### Purpose
BUTANO clinical timeline — FHIR resource viewer by CPID.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/ButanoTimeline.tsx`

### UI Inventory
- Back button → `/admin`
- CPID search input + resource type filter (Encounter, Condition, AllergyIntolerance, MedicationRequest, Observation, DiagnosticReport, Procedure, Immunization, CarePlan)
- Timeline cards showing FHIR resources

### Data
- Supabase: `butano_fhir_resources` (SELECT by subject_cpid + resource_type)

---

## Route 76: `/admin/butano/ips`

### Purpose
BUTANO International Patient Summary assembly.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/ButanoIPS.tsx`

### UI Inventory
- Back button → `/admin`
- CPID search
- 8 section tabs: Allergies, Problems, Medications, Immunizations, Vitals, Labs, Procedures, Care Plans

### Data
- Supabase: `butano_fhir_resources` (grouped by resource_type)

---

## Route 77: `/admin/butano/visit-summary`

### Purpose
BUTANO visit summary by encounter ID.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/ButanoVisitSummary.tsx`

### UI Inventory
- Back button → `/admin`
- Encounter ID search + Fetch button
- Summary cards for resources associated with encounter

### Data
- Supabase: `butano_fhir_resources` (SELECT by encounter_id)

---

## Route 78: `/admin/butano/reconciliation`

### Purpose
BUTANO O-CPID to CPID reconciliation queue.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/ButanoReconciliation.tsx`

### UI Inventory
- Back button → `/admin`
- Create reconciliation: from_ocpid + to_cpid inputs
- Job queue table with status (pending/completed/error)
- Refresh button

### Data
- Supabase: `butano_reconciliation_queue` (SELECT, INSERT)
- Toast: `"Reconciliation job queued"`

---

## Route 79: `/admin/butano/stats`

### Purpose
BUTANO FHIR resource statistics and PII violations.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/ButanoStats.tsx`

### UI Inventory
- Back button → `/admin`
- Resource type breakdown cards with counts and last_updated
- Total resources count
- PII violations table

### Data
- Supabase: `butano_fhir_resources` (aggregated), `butano_pii_violations`

---

## Route 80: `/admin/suite/docs`

### Purpose
Landela document console — search, lifecycle management.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/SuiteDocsConsole.tsx`

### UI Inventory
- Subject ID search + subject type filter + lifecycle filter (ACTIVE/ARCHIVED/PURGED)
- Document table with actions: archive, purge, delete
- Action reason input
- Retention policy viewer

### Data
- Supabase: `suite_documents`, `suite_retention_policies`

---

## Route 81: `/admin/suite/portal`

### Purpose
Landela self-service portal for document upload/share/verify.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/SuiteSelfService.tsx`

### UI Inventory
- Actor type toggle (PROVIDER/CLIENT)
- Tabs: My Documents, Upload, Share, Verify
- Upload form: title, document type
- Share dialog: document ID + QR generation
- Verify: token input + verification result

### Data
- Supabase: `suite_documents`, `suite_share_tokens`

---

## Route 82: `/admin/pct/work`

### Purpose
PCT (Patient Care Tracker) work tab — shift, queue, clinical workflow.

### Auth/Guard
Protected. AppLayout. Sidebar context: `admin`.

### Components
- `src/pages/admin/PctWorkTab.tsx`
- Uses `pctClient` kernel SDK

### UI Inventory
- Tabs: shift management, patient tracking, queue operations
- Start/stop shift, patient search, triage, routing

---

## Route 83: `/admin/pct/control-tower`

### Purpose
PCT control tower — facility-level patient flow monitoring.

### Auth/Guard
Protected. AppLayout. Sidebar context: `admin`.

### Components
- `src/pages/admin/PctControlTower.tsx`
- Uses `pctClient` kernel SDK

### UI Inventory
- Facility ID input (persisted to localStorage key `pct_facility_id`)
- Metrics dashboard: bottlenecks, patient counts, flow stats

---

## Route 84: `/admin/zibo`

### Purpose
ZIBO terminology governance — artifacts, packs, assignments, validation.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/ZiboAdmin.tsx`
- Uses `ziboClient` kernel SDK

### UI Inventory
- Back button → `/admin`
- Tabs: Artifacts, Packs, Assignments, Validation, Code Map
- Artifact lifecycle: Draft → Published → Deprecated → Retired
- FHIR bundle import, CSV codelist import
- Validation log viewer

---

## Route 85: `/admin/oros`

### Purpose
OROS orders & results admin — order lifecycle, configuration.

### Auth/Guard
Protected. AppLayout. Sidebar context: `admin`.

### Components
- `src/pages/admin/OrosAdmin.tsx`
- Uses `orosClient` kernel SDK

### UI Inventory
- Tabs for order management, result management, configuration
- Order statuses: PLACED → ACCEPTED → IN_PROGRESS → RESULT_AVAILABLE → REVIEWED → COMPLETED

---

## Route 86: `/admin/pharmacy`

### Purpose
Pharmacy service admin — dispensing, drug catalog, verification.

### Auth/Guard
Protected. AppLayout. Sidebar context: `admin`.

### Components
- `src/pages/admin/PharmacyAdmin.tsx`
- Uses `pharmacyClient` kernel SDK

### UI Inventory
- Tabs for prescriptions, dispensing, catalog, verification
- Priority labels: STAT (destructive), URGENT (default), ROUTINE (secondary)

---

## Route 87: `/admin/inventory`

### Purpose
Inventory service admin — stock management, transfers, auditing.

### Auth/Guard
Protected. AppLayout title=`"Inventory & Supply Chain v1.1"`. Sidebar context: `admin`.

### Components
- `src/pages/admin/InventoryAdmin.tsx`
- Uses `inventoryClient` kernel SDK

---

## Route 88: `/admin/msika-core`

### Purpose
MSIKA products and tariff registry admin.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/MsikaCoreAdmin.tsx`
- Uses `msikaCoreCient` SDK

### UI Inventory
- Back button → `/admin`
- Tabs: Products, Services, Tariffs, Suppliers, Categories
- Product lifecycle, pricing configuration

---

## Route 89: `/admin/msika-flow`

### Purpose
MSIKA commerce and fulfillment flow admin.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/MsikaFlowAdmin.tsx`
- Uses `msikaFlowClient` SDK

### UI Inventory
- Order flow: CREATED → VALIDATED → PRICED → APPROVED → DISPATCHED → DELIVERED → SETTLED
- Tabs for orders, fulfillment, returns

---

## Route 90: `/admin/costa`

### Purpose
COSTA costing engine admin — simulation, tariffs, charge sheets.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/CostaAdmin.tsx`
- Uses `costaClient` kernel SDK

### UI Inventory
- Tabs: Simulate (default), Tariffs, Charge Sheets, Audit
- Cost simulation form with line items

---

## Route 91: `/admin/mushex`

### Purpose
MUSHEX payment switch admin — intents, settlements, reconciliation.

### Auth/Guard
Protected. Standalone layout.

### Components
- `src/pages/admin/MushexAdmin.tsx`
- Uses `mushexClient` kernel SDK

### UI Inventory
- Default headers: tenantId, actorId, actorType, facilityId, deviceFingerprint, purposeOfUse
- Tabs for payment intents, settlements, reconciliation

---

## Route 92: `/admin/indawo`

### Purpose
INDAWO site and premises registry — non-health facilities.

### Auth/Guard
Protected. AppLayout. Sidebar context: `admin`.

### Components
- `src/pages/admin/IndawoAdmin.tsx`

### UI Inventory
- Site types: Market/Trading Post, School, Water Point/Borehole, Waste Disposal Site, Food Establishment, Warehouse/Store
- Search, filter by type
- Tabs: Sites, Inspections, Compliance

---

## Route 93: `/admin/ubomi`

### Purpose
UBOMI Civil Registration and Vital Statistics (CRVS) interface.

### Auth/Guard
Protected. AppLayout. Sidebar context: `admin`.

### Components
- `src/pages/admin/UbomiAdmin.tsx`

### UI Inventory
- Tabs: Birth Notifications, Death Notifications, Statistics, Integration
- Sample births table with columns: notification_number, childName, dob, sex, facility, status
- Sample deaths table

### Data
- Supabase: `birth_notifications`, `death_notifications`

---

## Route 94: `/public-health`

### Purpose
Public health operations hub — outbreak management, surveillance, jurisdiction packs.

### Auth/Guard
Protected. AppLayout. Sidebar context: `public-health`.

### Components
- `src/pages/PublicHealthOps.tsx`

### UI Inventory
- 6 Jurisdiction Packs: City Health Pack, Rural District Council Health Pack, Provincial Oversight Pack, National Oversight Pack, Port Health Pack, School Health Pack
- Outbreak tracker table with columns: id, disease, location, status, cases, deaths, started, lastUpdate, severity
- Tabs for surveillance, outbreaks, programs, settings

---

## Route 95: `/coverage`

### Purpose
Coverage, financing, and payer operations.

### Auth/Guard
Protected. AppLayout. Sidebar context: `coverage`.

### Components
- `src/pages/CoverageOperations.tsx`

### UI Inventory
- Schemes table: NHIS, CIMAS, First Mutual, Employer Wellness
- Claims table with statuses: approved, provisionally_adjudicated, preauthorized, denied, remitted
- Settlement state pipeline

---

## Route 96: `/ai-governance`

### Purpose
AI governance, model registry, and oversight.

### Auth/Guard
Protected. AppLayout. Sidebar context: `ai`.

### Components
- `src/pages/AIGovernance.tsx`

### UI Inventory
- 3 AI classes: I1 (Insight Only), I2 (Recommendation + Human Action), I3 (Governed Low-Risk Automation)
- Model registry table: name, version, class, domain, status, accuracy, driftStatus, lastInference, owner
- Model statuses: approved, pending_review, withdrawn

---

## Route 97: `/omnichannel`

### Purpose
Omnichannel experience hub — multi-channel management.

### Auth/Guard
Protected. AppLayout. Sidebar context: `omnichannel`.

### Components
- `src/pages/OmnichannelHub.tsx`

### UI Inventory
- 8 channel stats: Smartphone App, Web Portal, SMS/USSD, WhatsApp, IVR/Voice, Call Centre, Facility Desk, Community Worker
- Each with sessions, active count, trust level
- Session management, identity trust levels

---

## Route 98: `*` (404)

### Purpose
404 error page.

### Auth/Guard
Public. Standalone layout.

### Components
- `src/pages/NotFound.tsx`

### UI Inventory
- Centered on bg-muted
- H1: `"404"` (text-4xl font-bold)
- P: `"Oops! Page not found"` (text-xl text-muted-foreground)
- Link: `"Return to Home"` → `/` (text-primary underline)

### Behavior
- Logs `console.error("404 Error: User attempted to access non-existent route:", location.pathname)`
