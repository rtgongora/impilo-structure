# 06 — Golden Path Scripts

## A) Email Login → Module Home

1. **Navigate** to `/auth`
2. **See** method-select view with 3 visible cards (4th hidden)
3. **Click** `"Staff Email Login"` card
4. **See** email login form: title `"Sign in"`, description `"Enter your email and password to continue"`
5. **Type** email into `"Email address"` field (placeholder: `"you@example.com"`)
6. **Type** password into `"Password"` field (placeholder: `"••••••••"`)
7. **Click** `"Sign In"` button
8. **See** button change to spinner + `"Signing in..."`
9. **API call**: `supabase.auth.signInWithPassword({email, password})`
10. **Toast**: `"Welcome back!"` / `"You have been logged in successfully."`
11. **Route change**: → `/`
12. **See** ModuleHome with Work tab active, WorkplaceSelectionHub visible (no context yet)

## B) Provider ID + Biometric → Workspace → Module Home

1. **Navigate** to `/auth`
2. **Click** `"Provider ID & Biometric"` card
3. **See** `<ProviderIdLookup>` form
4. **Enter** provider ID and select facility
5. **Click** lookup/submit
6. **See** `<BiometricAuth>` component with fingerprint/facial/iris options
7. **Complete** biometric verification
8. **API call**: `supabase.from("profiles").select("user_id").eq("provider_registry_id", providerId)`
9. **See** `<WorkspaceSelection>` form (department, workspace, workstation)
10. **Select** department, workspace, workstation
11. **Click** confirm
12. **API call**: `supabase.auth.signInWithPassword` with mapped demo email
13. **sessionStorage**: `activeWorkspace` set to `{department, physicalWorkspace, workstation, facility, loginTime}`
14. **API call**: `supabase.from("provider_registry_logs").insert({...})`
15. **Toast**: `"Welcome, {fullName}!"` / `"Logged in to {department} at {workstation}"`
16. **Route change**: → `/`
17. **See** ModuleHome with Work tab, WorkplaceSelectionHub visible

## C) Workspace Selection → Queue → Encounter → Close Chart

1. **From** `/` (ModuleHome, Work tab), see WorkplaceSelectionHub
2. **Click** a facility card to select work context
3. **See** Work tab transitions to show Communication Noticeboard + Quick Access + Module Categories
4. **Click** `"Queue"` button in Quick Access
5. **Route change**: → `/queue`
6. **See** AppLayout with clinical sidebar context (Quick Access: Dashboard, My Worklist, Communication; Clinical: Clinical EHR, Bed Management, Appointments, Patients; Orders: Order Entry, Pharmacy, Laboratory, PACS Imaging, Shift Handoff)
7. **Select** a patient from queue list
8. **API call**: `openChart(encounterId, "queue")`
9. **Route change**: → `/encounter/{encounterId}?source=queue`
10. **See** EHRLayout: TopBar + PatientBanner + MainWorkArea + EncounterMenu
11. **See** EncounterMenu with 8 items, "Overview" active by default
12. **Click** `"Assessment"` in EncounterMenu
13. **See** MainWorkArea updates to show Assessment section
14. **Navigate** through all 8 menu items
15. **Click** `"Close Chart"` in TopBar
16. **See** AlertDialog: `"Close Patient Chart?"` / `"This will close {name}'s chart..."` + `"Continue Working"` / `"Close Chart"`
17. **Click** `"Close Chart"`
18. **API call**: audit_logs INSERT (chart_closed)
19. **Toast**: `"Chart closed"` (info)
20. **Route change**: → `/queue`

## D) Admin → TSHEPO Audit → Break-Glass Review

1. **From** `/` (ModuleHome), open profile dropdown
2. **Click** `"Admin Dashboard"` (visible for admin role)
3. **Route change**: → `/admin`
4. **See** AppLayout with admin sidebar context (Dashboard, System Settings, User Management, Security, Audit Logs, Integrations)
5. **Navigate** to `/admin/tshepo/audit` (via Kernel & Sovereign Registries category or direct URL)
6. **See** TSHEPO Audit Search page with AppLayout, admin sidebar
7. **Search** audit records
8. **Navigate** to `/admin/tshepo/breakglass`
9. **See** Break-Glass review page
10. **Review** break-glass access records

## E) Marketplace Browse → Order

1. **Navigate** to `/catalogue` (public, no auth required)
2. **See** Product Catalogue page (standalone layout)
3. **Browse** health products
4. **Navigate** to `/marketplace` (public, no auth required)
5. **See** Health Marketplace page (standalone layout)
6. **Compare** prices from vendors
7. **Auth required for ordering**: navigate to `/fulfillment` (protected)
8. **See** Prescription Fulfillment page with AppLayout
9. **Create** fulfillment request
10. **Vendors see**: `/vendor-portal` (protected) to view requests and submit bids

## F) Registry Path — Client/Provider/Facility

1. **From** `/`, navigate to Kernel & Sovereign Registries category
2. **Click** `"Client Registry (VITO)"` → `/client-registry`
3. **See** AppLayout with registry sidebar context (Back to Home, Client Registry, Provider Registry, Facility Registry + Tools + Admin sections)
4. **Search** patients in client registry
5. **Click** `"Provider Registry"` in sidebar → `/hpr`
6. **See** Health Provider Registry page
7. **Search** providers
8. **Click** `"Facility Registry"` in sidebar → `/facility-registry`
9. **See** Facility Registry page with Master Facility List
