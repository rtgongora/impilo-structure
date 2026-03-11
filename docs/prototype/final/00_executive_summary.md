# 00 — Executive Summary

## What This Prototype Covers

Impilo vNext is a comprehensive Health Information Exchange (HIE) and Digital Health Platform prototype built with React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Supabase. It covers the following zones end-to-end:

### Zones & Modules

1. **Auth Zone** — 4 login pathways: Provider ID & Biometric, Patient Portal, Staff Email, System Maintenance (hidden)
2. **Module Home (`/`)** — 3-tab hub (Work, My Professional, My Life) with workplace context selection, communication noticeboard, quick access, 17 expandable module category cards, and floating emergency FAB
3. **Clinical Zone** — EHR encounters (EHRLayout), patient queue, bed management, patient sorting/triage, discharge, shift handoff, telemedicine/referrals, communication
4. **Orders & Diagnostics** — Order entry, pharmacy/dispensing, LIMS laboratory, PACS imaging
5. **Scheduling** — Appointment scheduling, theatre scheduling, provider noticeboard, resource calendar
6. **Registry Zone** — Client Registry (VITO), Provider Registry (VARAPI/HPR), Facility Registry (TUSO)
7. **Marketplace** — Product catalogue, health marketplace, prescription fulfillment, vendor portal
8. **Finance** — Payments, charges, COSTA costing, MUSHEX payment switch
9. **Inventory** — Stock management, consumables
10. **Identity Services** — Health ID generation, validation, recovery, batch generation
11. **Admin Zone** — System admin, user management, above-site dashboard, workspace management
12. **Kernel Admin Surfaces** (39 routes under `/admin/`):
    - TSHEPO (5): consents, audit, breakglass, access-history, offline
    - VITO (4): patients, merges, events, audit
    - TUSO (6): facilities, workspaces, start-shift, resources, config, control-tower
    - VARAPI (5): providers, privileges, councils, tokens, portal
    - BUTANO (5): timeline, ips, visit-summary, reconciliation, stats
    - Suite (2): docs, portal
    - PCT (2): work, control-tower
    - ZIBO (1), OROS (1), Pharmacy (1), Inventory (1)
    - MSIKA Core (1), MSIKA Flow (1), COSTA (1), MUSHEX (1)
    - INDAWO (1), UBOMI (1)
13. **Specialized Context Pages** — Public Health Ops, Coverage Operations, AI Governance, Omnichannel Hub
14. **Public/Standalone** — Portal, Install/PWA, Kiosk, Shared Summary, Product Catalogue, Health Marketplace
15. **Social** — Professional networking, communities, CPD tracking
16. **Reports & Help** — Reports dashboard, help desk

### Auth Model

- Supabase Auth with email/password
- `profiles` table stores display_name, role, specialty, department, facility_id, provider_registry_id
- Roles: doctor, nurse, specialist, patient, admin, client
- Additional role tables: `user_roles`, `platform_roles`, `registry_admin_roles`, `above_site_roles`
- Session tracking via `user_sessions` table
- Login attempt tracking via `track-login-attempt` edge function
- Provider biometric login maps Provider Registry IDs to demo email accounts

### Tenancy & Workspace Model

- **Provider Hierarchy**: Auth → FacilityContext → WorkspaceContext → ShiftContext
- **Context nesting in App.tsx**: `QueryClientProvider > AuthProvider > FacilityProvider > WorkspaceProvider > ShiftProvider`
- **Facility selection**: stored in `sessionStorage` key `impilo_current_facility_id`
- **Workspace selection**: stored in `sessionStorage` key `activeWorkspace` (JSON with department, physicalWorkspace, workstation, facility, loginTime)
- **PageContext**: determines sidebar navigation, derived from URL path prefix in `AppSidebar`
- **11 sidebar contexts**: home, clinical, operations, scheduling, registry, admin, portal, public-health, coverage, ai, omnichannel

### Layout System

| Layout | Used By | Structure |
|--------|---------|-----------|
| **Standalone** (no shell) | `/auth`, `/reset-password`, `/forgot-password` | Full-screen, split left/right on desktop |
| **ModuleHome** (custom) | `/` | Sticky header + full-height tabs + floating FAB |
| **AppLayout** | Most protected routes | Sidebar (w-48/w-12) + Header (h-12) + scrollable main |
| **EHRLayout** | `/encounter`, `/encounter/:id` | TopBar (h-14) + PatientBanner + MainWorkArea + EncounterMenu (w-64) |
| **Public Standalone** | `/portal`, `/install`, `/catalogue`, `/marketplace`, `/kiosk`, `/shared/:type/:token` | Varies per page |

### Design System

- **Fonts**: Work Sans (headings via `font-display`), system sans-serif body
- **Colors**: HSL-based CSS custom properties via Tailwind semantic tokens
- **Components**: shadcn/ui with custom EHR-specific tokens (topbar-bg, encounter-bg, etc.)
- **Animations**: Framer Motion for encounter menu items, workspace cards
- **Icons**: Lucide React exclusively
- **PWA**: vite-plugin-pwa for offline service worker caching
