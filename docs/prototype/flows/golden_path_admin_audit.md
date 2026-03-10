# Golden Path: Admin Audit & Break-Glass Review

## Prerequisites
- User is authenticated with admin or hie_admin role

---

## Steps

### 1. Navigate to TSHEPO Trust Layer
- **From**: ModuleHome → "Kernel & Sovereign Registries" category → "Trust Layer (TSHEPO)"
- **Module path**: `/admin/tshepo/consents`
- **Navigate**: `/admin/tshepo/consents`
- **Layout**: AppLayout
- **Sidebar context**: Switches to "admin"

### 2. Admin Sidebar
- **Section "Admin"**:
  - "Dashboard" (Home icon, path `/`)
  - "System Settings" (Settings icon, path `/admin`)
  - "User Management" (Users icon, path `/admin?tab=users`)
  - "Security" (Shield icon, path `/admin?tab=security`)
  - "Audit Logs" (FileText icon, path `/admin?tab=audit`)
  - "Integrations" (Network icon, path `/admin?tab=integrations`)

### 3. TSHEPO Consent Admin
- **Page**: Consent management interface
- **Data source**: `trust_layer_consent` table

### 4. Navigate to Audit Search
- **Direct navigation**: `/admin/tshepo/audit`
- **Content**: Audit ledger search interface
- **Data source**: `tshepo_audit_ledger` table
- **Kernel functions**: `tshepo_next_chain_sequence()`, `tshepo_last_audit_hash()`, `verifyChain()`

### 5. Navigate to Break-Glass Review
- **Direct navigation**: `/admin/tshepo/breakglass`
- **Content**: Break-glass event review queue
- **Data source**: Break-glass audit records

### 6. Navigate to Access History
- **Direct navigation**: `/admin/tshepo/access-history`
- **Content**: Patient data access history log

### 7. Navigate to Offline Entitlements
- **Direct navigation**: `/admin/tshepo/offline`
- **Content**: Offline entitlement status and management
- **Kernel functions**: `issueEntitlement()`, `verifyEntitlementOffline()`, `revokeEntitlement()`

---

## VITO Admin Flow

### Navigate to VITO Patients
- **Path**: `/admin/vito/patients`
- **Content**: Client registry admin (VITO view)

### Navigate to Merge Queue
- **Path**: `/admin/vito/merges`
- **Content**: Patient merge request queue
- **Kernel functions**: `vitoPatientMerge()`, federation guard checks

### Navigate to Events Viewer
- **Path**: `/admin/vito/events`
- **Content**: VITO event stream viewer

### Navigate to Audit Viewer
- **Path**: `/admin/vito/audit`
- **Content**: VITO-specific audit records
