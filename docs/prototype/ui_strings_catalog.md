# UI Strings Catalog — Impilo vNext Prototype

> **DO NOT CHANGE** — Every string listed here must match exactly in any replica.

---

## Auth Page (`/auth`)

### Method Select View
- Page heading: "Welcome back"
- Page subtext: "Choose your preferred login method"
- Button 1 title: "Provider ID & Biometric"
- Button 1 description: "For clinical staff with registered Provider ID"
- Button 2 title: "Patient Portal"
- Button 2 description: "Access your health records & appointments"
- Button 3 title: "Staff Email Login"
- Button 3 description: "For admin and system users"
- Button 4 title: "System Maintenance" (hidden by default)
- Button 4 description: "Platform admins & developers only"
- Footer: "Secure authentication powered by Impilo"
- Toast (maintenance reveal): "Maintenance mode revealed"

### Left Branding Panel (Desktop)
- Heading: "Digital Health Platform"
- Subtext: "Empowering healthcare providers with seamless, secure, and intelligent clinical solutions."
- Badge 1: "Patient-Centered"
- Badge 2: "Secure"
- Badge 3: "Real-time"
- Footer: "© 2025 Impilo Health. All rights reserved."

### Email Login View
- Card title: "Sign in"
- Card description: "Enter your email and password to continue"
- Email label: "Email address"
- Email placeholder: "you@example.com"
- Password label: "Password"
- Password placeholder: "••••••••"
- Forgot link: "Forgot password?"
- Submit button: "Sign In"
- Submit loading: "Signing in..."
- Back button: "Back to login options"
- Toast success: "Welcome back!" / "You have been logged in successfully."
- Toast failure: "Login failed" / `{error.message}`

### Provider Login
- Toast success: "Welcome, {provider.fullName}!" / "Logged in to {department} at {workstation}"
- Toast link error: "No user account linked to this Provider ID"
- Toast demo error: "Demo login not available for this provider"
- Toast failure: "Failed to complete authentication"
- Toast general: "Failed to complete login"

### Biometric
- Toast failure: "Biometric verification failed" / `{error}`

---

## ModuleHome (`/`)

### Header
- Welcome: "Welcome, {displayTitle}" (Dr/Nurse prefix based on role)
- Subtitle: "Working from: {facilityName or contextLabel}"

### Tabs
- Tab 1: "Work" (with Briefcase icon)
- Tab 2: "My Professional" (with Stethoscope icon)
- Tab 3: "My Life" (with Heart icon)

### Communication Noticeboard
- Section title: "Communication Noticeboard"
- Button 1: "Messages"
- Button 2: "Pages"
- Button 3: "Calls"

### Quick Access
- Section title: "Quick Access"
- Buttons: "EHR", "Dashboard", "Queue", "Prescribe", "Register", "Lab", "Radiology", "Schedule"

### Module Categories (exact titles)
- "Practice Management" / "Manage your practice or facility"
- "Clinical Care" / "Patient encounters, assessments, and care delivery"
- "Consults & Referrals" / "Telemedicine, specialist consults, and inter-facility referrals"
- "Orders & Diagnostics" / "Lab, imaging, pharmacy, and clinical orders"
- "Scheduling & Registration" / "Appointments, patient registration, and theatre"
- "Health Products & Marketplace" / "Browse products, compare vendors, and order supplies"
- "Finance & Billing" / "Payments, charges, and financial operations"
- "Inventory & Supply Chain" / "Stock management and consumables tracking"
- "Identity Services" / "Generate, validate, and recover health IDs"
- "Kernel & Sovereign Registries" / "Ring 0 shared sovereign services — TSHEPO, VITO, VARAPI, TUSO, INDAWO, MSIKA, ZIBO, BUTANO, UBOMI, MUSHEX"
- "Public Health & Local Authority" / "Surveillance, outbreaks, inspections, campaigns, complaints — configured per jurisdiction pack"
- "Coverage, Financing & Payer" / "Schemes, membership, eligibility, claims, settlement — native platform capability"
- "Intelligence, Automation & AI" / "Governed AI insights, model registry, inference records — I1/I2/I3 classification"
- "Experience, Omnichannel & Access" / "SMS, USSD, IVR, WhatsApp, call-centre, community-worker, and facility-desk access — no citizen left behind"
- "Governance & Configuration" / "System settings, audit, jurisdiction packs, and platform administration"
- "Clinical Tools" / "Advanced clinical documentation and utilities"
- "Help & Support" / "FAQs, user guides, system utilities and documentation"

### User Dropdown Menu
- "View Profile"
- "Account Settings"
- "Security & Privacy"
- "Admin Dashboard" (admin only)
- "Sign Out"
- Switch Workplace: "{facilityName}" / "Switch Workplace"
- Toast: "Signed out successfully"

### Emergency Button
- aria-label: "Emergency"

---

## AppHeader

- Home button: "Home"
- Back button: "Back"
- Bell badge: "3"
- Dropdown label: "My Account"
- Dropdown item 1: "Profile Settings"
- Dropdown item 2: "Sign Out"

---

## EHR TopBar

### Top Bar Actions (exact labels)
- "Queue"
- "Beds"
- "Pharmacy"
- "Theatre Booking"
- "Payments"
- "Shift Handoff"
- "Workspaces"
- "Care Pathways"
- "Consumables"
- "Charges"
- "Register"

### Patient Context
- Badge: "Chart Locked"
- Badge (allergies): "Allergies"
- Button: "Close Chart"
- No patient: "No Patient Selected"

### Close Chart Dialog
- Title: "Close Patient Chart?"
- Description: "This will close {patientName}'s chart and return you to your worklist. Any unsaved changes may be lost."
- Cancel: "Continue Working"
- Confirm: "Close Chart"

---

## Encounter Menu

- Header: "Encounter Record"
- Subtitle: "Clinical Documentation"
- Button: "Patient File" / "Active"
- Menu items:
  1. "Overview" / "Patient summary and status"
  2. "Assessment" / "Clinical assessments"
  3. "Problems & Diagnoses" / "Active problems and diagnoses"
  4. "Orders & Results" / "Lab orders and results"
  5. "Care & Management" / "Care plans and management"
  6. "Consults & Referrals" / "Specialist consultations"
  7. "Notes & Attachments" / "Clinical notes and documents"
  8. "Visit Outcome" / "Encounter disposition"
- Footer: "Last saved: 2 min ago" / "Active"

---

## Sidebar Context Labels

- "Registry"
- "Operations"
- "Scheduling"
- "Portal"
- "Admin"
- "Public Health"
- "Coverage & Financing"
- "AI & Intelligence"
- "Omnichannel"

---

## Sidebar Navigation Labels (exact, grouped by context)

### Home
- Quick Access: "Dashboard", "My Worklist", "Communication", "Social Hub"
- Clinical: "Clinical EHR", "Appointments", "Patients", "Pharmacy"
- System: "ID Services", "Reports", "Help Desk"

### Clinical
- Quick Access: "Dashboard", "My Worklist", "Communication"
- Clinical: "Clinical EHR", "Bed Management", "Appointments", "Patients"
- Orders: "Order Entry", "Pharmacy", "Laboratory", "PACS Imaging", "Shift Handoff"

### Operations
- "Dashboard", "Stock Management", "Consumables", "Charges", "Payments", "Theatre"

### Scheduling
- "Dashboard", "Appointments", "Theatre Booking", "Noticeboard", "Resources"

### Registry
- Registry: "Back to Home", "Client Registry", "Provider Registry", "Facility Registry"
- Tools: "Data Reconciliation", "Change Requests", "Reference Data", "Reports"
- Admin: "Access Control", "API & Integrations", "Audit Log"

### Admin
- "Dashboard", "System Settings", "User Management", "Security", "Audit Logs", "Integrations"

### Portal
- "Dashboard", "My Health", "Social Hub", "Marketplace", "Communication"

### Public Health
- "Dashboard", "Operations Hub", "Surveillance", "Outbreaks", "Inspections", "Campaigns", "INDAWO Sites"

### Coverage & Financing
- "Dashboard", "Coverage Hub", "Eligibility", "Claims", "Settlement", "Schemes"

### AI & Intelligence
- "Dashboard", "AI Governance", "Insights", "Model Registry"

### Omnichannel Access
- "Dashboard", "Channel Overview", "SMS Journeys", "USSD Menus", "IVR / Voice", "Callbacks", "Trust Rules", "AI Agent"

---

## Sidebar Collapse
- Button text: "Collapse"

---

## ProtectedRoute
- Loading text: "Loading..."

---

## 404 Page
- Title: "404"
- (Additional copy varies — see NotFound.tsx)

---

## Mock Patient Data (EHR demo)
- Patient name: "Sarah M. Johnson"
- DOB: "1985-03-15"
- MRN: "MRN-2024-001847"
- Allergies: "Penicillin", "Sulfa drugs"
- Ward: "Ward 4A"
- Bed: "Bed 12"
- Encounter type: "inpatient"
- Attending: "Dr. James Mwangi"
- Location: "Ward 4A - Medical"
