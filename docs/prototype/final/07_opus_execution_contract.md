# 07 — Claude Opus Execution Contract

## Mission

Replicate the Impilo vNext Lovable prototype exactly — structure-for-structure, string-for-string, route-for-route — so that the output is a functionally identical application.

## No Deviation Rules

1. **No redesign.** Do not alter layouts, spacing, color choices, or component composition.
2. **No renamed labels.** Every button text, heading, placeholder, toast message, menu item, and empty state must match exactly as specified.
3. **No altered flows.** Navigation paths, route guards, sidebar context switching, and state transitions must be identical.
4. **No removed routes.** All 98 routes must be present.
5. **No invented features.** If a page uses mock data, replicate it with mock data. Do not add real API integrations unless the prototype has them.
6. **No framework changes.** Stack is React 19 + Vite + TypeScript + Tailwind CSS + shadcn/ui + Supabase + Framer Motion + Lucide icons.

## Implementation Order

### Phase 1: Foundation
1. Project scaffolding (Vite + React 19 + TypeScript + Tailwind)
2. Design system tokens (index.css, tailwind.config.ts)
3. shadcn/ui components installation
4. Asset setup (Impilo logo, fonts)

### Phase 2: Auth & Contexts
5. Supabase client setup
6. AuthContext with full session tracking
7. FacilityContext with capability system
8. WorkspaceContext with page context
9. ShiftContext with duration tracking
10. ProtectedRoute component

### Phase 3: Layout Shells
11. AppLayout (sidebar + header + main)
12. AppSidebar with all 11 context-dependent nav configurations
13. AppHeader with search, facility selector, workspace indicator, notifications
14. EHRLayout (TopBar + PatientBanner + MainWorkArea + EncounterMenu)
15. ModuleHome custom layout

### Phase 4: Auth Pages
16. `/auth` — all 4 login pathways with exact UI strings
17. `/forgot-password`
18. `/reset-password`

### Phase 5: Module Home
19. `/` — WorkplaceSelectionHub, 3 tabs, 17 category cards, emergency FAB

### Phase 6: Clinical Zone
20. `/encounter` and `/encounter/:id` with EHRProvider + ProviderContext
21. `/queue` — patient queue
22. `/beds` — bed management
23. `/patients` — patient registry
24. `/sorting` — patient sorting/triage
25. `/discharge` — discharge workflows
26. `/handoff` — shift handoff
27. `/communication` — messages, pages, calls
28. `/telemedicine` — teleconsultation hub
29. `/dashboard` — provider worklist

### Phase 7: Orders, Scheduling, Operations
30. `/orders`, `/pharmacy`, `/lims`, `/pacs`
31. `/scheduling`, `/scheduling/theatre`, `/scheduling/noticeboard`, `/scheduling/resources`
32. `/appointments`, `/theatre`
33. `/stock`, `/consumables`, `/charges`, `/payments`
34. `/operations`

### Phase 8: Registries & Identity
35. `/client-registry`, `/hpr`, `/facility-registry`, `/registry-management`
36. `/id-services`

### Phase 9: Marketplace & Portal
37. `/catalogue`, `/marketplace`, `/fulfillment`, `/vendor-portal`
38. `/portal`, `/social`
39. `/kiosk`, `/install`

### Phase 10: Admin & Kernel (39 routes)
40. `/admin` — main admin dashboard
41. `/above-site`, `/workspace-management`, `/landela`, `/odoo`
42. TSHEPO (5 routes), VITO (4), TUSO (6), VARAPI (5), BUTANO (5)
43. Suite (2), PCT (2), ZIBO, OROS, Pharmacy, Inventory
44. MSIKA Core, MSIKA Flow, COSTA, MUSHEX, INDAWO, UBOMI

### Phase 11: Specialized Pages
45. `/public-health`, `/coverage`, `/ai-governance`, `/omnichannel`
46. `/reports`, `/help`, `/profile`
47. `/shared/:type/:token`
48. `*` (404)

## Spec Gap Protocol

There are no spec gaps. All routes, layouts, contexts, and navigation rules are fully specified.

For individual page internals (form fields, table columns, tab labels) on the 80+ pages not detailed at field-level in this document, the implementation source files are specified by path. Claude Opus should inspect `src/pages/<PageName>.tsx` and `src/pages/admin/<PageName>.tsx` directly to extract exact UI strings, component composition, and data interactions.

## Verification Checklist

### Route Map
- [ ] All 98 routes present in router
- [ ] Each route uses correct component
- [ ] Public routes (7): `/auth`, `/reset-password`, `/forgot-password`, `/portal`, `/install`, `/catalogue`, `/marketplace`, `/kiosk`, `/shared/:type/:token`, `*`
- [ ] All other routes wrapped in `<ProtectedRoute>`

### Layout Match
- [ ] ModuleHome uses custom layout (no AppSidebar/AppHeader)
- [ ] Encounter pages use EHRLayout (TopBar + PatientBanner + MainWorkArea + EncounterMenu)
- [ ] All other protected routes use AppLayout (AppSidebar + AppHeader + main)
- [ ] Public pages use standalone layouts

### Sidebar Context
- [ ] 11 sidebar contexts resolve correctly from URL path
- [ ] Each context shows correct nav sections with correct items
- [ ] WorkspaceSelector shown only for clinical and home contexts
- [ ] Context indicator text shown for non-home/non-clinical contexts

### Auth Flows
- [ ] 4 login method cards on method-select view
- [ ] System Maintenance hidden by default, revealed via `?mode=maintenance`, `Ctrl+Shift+M`, or mobile long-press (1.5s)
- [ ] Email login: fields "Email address" (placeholder "you@example.com") + "Password" (placeholder "••••••••")
- [ ] Email login submit: "Sign In" / "Signing in..."
- [ ] Toast on success: "Welcome back!" / "You have been logged in successfully."
- [ ] Toast on error: "Login failed" / error.message
- [ ] Provider ID flow: ProviderIdLookup → BiometricAuth → WorkspaceSelection → demo sign-in

### Module Home
- [ ] 3 tabs: "Work" (Briefcase), "My Professional" (Stethoscope), "My Life" (Heart)
- [ ] Work tab shows WorkplaceSelectionHub when no active context
- [ ] Work tab shows Communication Noticeboard + Quick Access + 17 category cards when context active
- [ ] Emergency FAB: fixed bottom-6 right-6, h-16 w-16, bg-destructive, AlertTriangle h-8, animate-pulse

### EHR Layout
- [ ] EncounterMenu has exactly 8 items: Overview, Assessment, Problems & Diagnoses, Orders & Results, Care & Management, Consults & Referrals, Notes & Attachments, Visit Outcome
- [ ] TopBar shows 10 action buttons when patient active: Queue, Beds, Pharmacy, Theatre Booking, Payments, Shift Handoff, Workspaces, Care Pathways, Consumables, Charges
- [ ] Critical event mode: ring-4 ring-critical on outer container
- [ ] Close Chart dialog: title "Close Patient Chart?", buttons "Continue Working" / "Close Chart"

### Provider Tree
- [ ] QueryClientProvider > AuthProvider > FacilityProvider > WorkspaceProvider > ShiftProvider
- [ ] Encounter page additionally wraps in ProviderContextProvider > EHRProvider

### Data Interactions
- [ ] Auth uses `supabase.auth.signInWithPassword`, `supabase.auth.signUp`, `supabase.auth.signOut`
- [ ] Profile fetched from `profiles` table by user_id
- [ ] Session tracking writes to `user_sessions` table
- [ ] Chart access logged to `audit_logs` table
- [ ] Facility capabilities read from `facility_capabilities` view
