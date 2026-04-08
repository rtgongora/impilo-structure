
# Impilo vNext: Unified Login & Context-Aware Workspace Architecture

## Doctrine Statement
Impilo vNext shall support a single sign-on experience anchored in the Trust Layer, from which authenticated users may enter one or more authorized operational contexts, including personal, professional, facility, organizational, and registry administration workspaces. Health Facility Mode shall present facility-specific workflows optimized for operational service delivery, while registry administration shall be conducted through clearly separated high-trust administrative workspaces subject to elevated authorization, approval controls, and audit.

---

## Phase 1: Unified Sign-In & Identity Resolution

### 1.1 Single Login Page
- Replace the current multi-pathway auth page with **one universal sign-in**
- Authentication methods: email/password, Provider ID, phone/OTP, passkey
- Step-up auth triggered contextually (not at login)
- Remove separate "Patient Portal" and "Provider" login cards

### 1.2 Post-Login Identity Resolver
After Tshepo authenticates, resolve:
- Person identity (profile)
- Linked citizen/patient account (My Life)
- Linked provider records (My Professional)
- Facility affiliations + active shifts
- Organization memberships
- Registry admin roles
- Above-site oversight roles
- Session assurance level & device trust

### 1.3 Context Chooser
- If **single context** → auto-route (with "switch later" option)
- If **multiple contexts** → show context chooser:
  - 🏠 My Life
  - 👨‍⚕️ My Professional Profile
  - 🏥 Sally Mugabe Central Hospital — Facility Work
  - 🏥 Parirenyatwa OPD — Facility Work
  - 📋 Provider Registry Administration
  - 🏢 Organization Admin: MOHCC
- Support "Remember last workspace" preference
- Smart defaulting: auto-suggest if one facility + one shift + one role

---

## Phase 2: Health Facility Mode

### 2.1 Facility Context Shell
When entering Facility Mode, the platform knows:
- Which facility
- Which service point/workspace
- What role
- Current shift
- Permissions at this facility

### 2.2 Service Point Sub-Contexts (within Facility Mode)
| Sub-Context | Primary User | Key Views |
|---|---|---|
| Front Desk | Receptionist | Search, Registration, Check-in, Queue Assignment, Identity Verification |
| Triage | Triage Nurse | Waiting list, Vitals, Categorization, Fast-track routing |
| Consultation | Doctor | Patient list, Clinical workspace, Orders, e-Rx, Results, Referrals |
| Nursing Station | Ward Nurse | Bed board, Medication tasks, Observations, Handover |
| Pharmacy | Pharmacist | Prescription queue, Dispensing, Stock |
| Laboratory | Lab Tech | Order queue, Results entry, Sample tracking |
| Radiology | Radiographer | Imaging queue, PACS viewer, Reports |
| Theatre | Surgical team | Booking, Checklists, Anaesthesia, Notes |
| Billing | Cashier/Finance | Charges, Payments, Claims, Receipts |
| Supervisor | Facility Admin | Staff, Queues, Rosters, Reports, Approvals, Settings |

### 2.3 Workspace UI Reshaping
- Sidebar navigation adapts to service point
- Toolbar adapts to clinical vs administrative context
- Dashboard KPIs filtered to workspace scope
- Patient lists filtered to assigned/workspace patients

---

## Phase 3: Registry Admin Workspaces

### 3.1 Registry Admin Contexts
Each registry gets a dedicated high-trust workspace:
| Registry | Key Workflows |
|---|---|
| VITO (Client) | Duplicate resolution, Identity disputes, Merge/split review, Account recovery |
| VARAPI (Provider) | Record review, Duplicate reconciliation, Identity claims, Status management |
| TUSO (Facility) | Create/update facilities, Service points, Geocoding, Merge duplicates |
| TSHEPO (IAM) | Bootstrap admins, Policy config, Account lock/unlock, Suspicious access review |
| ZIBO (Terminology) | Code system management, Value set publishing, Artifact versioning |

### 3.2 Registry Workflow Pattern
All sensitive registry actions follow maker-checker:
1. **Submit** — author creates change request
2. **Review** — reviewer examines with full audit context
3. **Approve/Reject** — approver with elevated privilege acts

### 3.3 Elevated Controls
- Step-up auth for sensitive actions
- Mandatory justification for bulk operations
- Enhanced audit logging in registry mode
- Time-limited sessions for high-privilege actions

---

## Phase 4: Context-Aware Authorization

### 4.1 Permission Resolution
Permissions = intersection of:
- Identity → who is this person
- Actor type → citizen, provider, staff, admin
- Registry status → active license, valid registration
- Affiliation → which orgs/facilities
- Role assignment → what role at this context
- Workspace → current service point
- Shift/time → on-duty status
- Assurance level → MFA, device trust
- Policy constraints → TSHEPO PDP decisions

### 4.2 Account vs User Management Separation
| Account Management (Self) | User Management (Admin) |
|---|---|
| Password/passkey | Create/invite staff |
| MFA setup | Approve affiliations |
| Personal profile | Assign roles |
| Linked phone/email | Suspend access |
| Session history | Move between facilities |
| Context switching | Registry reviewer rights |

---

## Phase 5: Bootstrap & Seeding

### 5.1 Registry Bootstrap
Seed initial national admins for:
- Provider Registry (VARAPI)
- Facility Registry (TUSO)
- Client Registry (VITO)
- IAM/Trust (TSHEPO)
- Terminology (ZIBO)

### 5.2 Facility Bootstrap
Per onboarded facility, seed:
- Facility admin
- Registration supervisor
- Clinical lead / focal person
- Local IT/admin support (optional)

These seed actors then invite/approve others per policy.

---

## Implementation Priority
1. **Unified login page** (replace multi-pathway auth)
2. **Post-login context resolver** (identity + affiliations query)
3. **Context chooser UI** (with smart defaulting)
4. **Facility Mode shell** (service point sub-contexts)
5. **Registry admin workspaces** (with maker-checker)
6. **Permission intersection engine** (context-aware auth)

## What Changes from Current Code
- `Auth.tsx` → single universal sign-in (consolidate 4 pathways)
- `WorkspaceContext.tsx` → expand to full context model (facility, registry, org)
- Post-login routing → new `ContextResolver` component
- Sidebar/navigation → driven by active context, not page URL
- New: `FacilityMode` shell with service-point sub-views
- New: `RegistryAdminWorkspace` with maker-checker workflows
- Existing facility/workspace tables already support this model
