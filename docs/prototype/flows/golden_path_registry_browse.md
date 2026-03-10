# Golden Path: Registry Search & Browse

## Prerequisites
- User is authenticated with admin or hie_admin role

---

## Steps

### 1. Navigate to Client Registry
- **From**: ModuleHome → "Kernel & Sovereign Registries" category → "Client Registry (VITO)"
- **Path**: Module item path = `/client-registry`
- **Navigate**: `/client-registry`
- **Layout**: AppLayout
- **Sidebar context**: Switches to "registry"

### 2. Registry Sidebar
- **Section "Registry"**:
  - "Back to Home" (Home icon, path `/`)
  - "Client Registry" (Users icon, path `/client-registry`) — ACTIVE
  - "Provider Registry" (UserCheck icon, path `/hpr`)
  - "Facility Registry" (Building2 icon, path `/facility-registry`)
- **Section "Tools"**:
  - "Data Reconciliation"
  - "Change Requests"
  - "Reference Data"
  - "Reports"
- **Section "Admin"**:
  - "Access Control"
  - "API & Integrations"
  - "Audit Log"

### 3. Client Registry Page
- **Content**: Search and browse client records
- **Data source**: `client_registry` table

### 4. Switch to Provider Registry
- **Click**: "Provider Registry" in sidebar
- **Navigate**: `/hpr`
- **Sidebar**: Same registry context, "Provider Registry" now ACTIVE
- **Content**: Search and browse health provider records
- **Data source**: `health_providers` table

### 5. Switch to Facility Registry
- **Click**: "Facility Registry" in sidebar
- **Navigate**: `/facility-registry`
- **Content**: Search and browse facility records
- **Data source**: `facilities` table

### 6. Return Home
- **Click**: "Back to Home" in sidebar
- **Navigate**: `/`
- **Sidebar context**: Switches back to "home"
