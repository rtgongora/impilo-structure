# Unknowns & Gaps — Impilo vNext Prototype

> Items that cannot be fully observed from the codebase inspection performed. Each entry includes where to inspect next.

---

## 1. Individual Page Internal UI

### What's Unknown
The exact internal layout, sections, fields, and component composition of each of the ~90 page components. The master packet covers routing, layouts, sidebar contexts, and data sources, but detailed per-page inspection was not performed for every page.

### Why
The prototype has 90+ pages. Full forensic inspection of each would require reading every page file.

### How to Resolve
Read each page file individually:
- `src/pages/Dashboard.tsx` through `src/pages/WorkspaceManagement.tsx`
- `src/pages/admin/*.tsx` (39 files)
- `src/pages/scheduling/*.tsx` (4 files)

---

## 2. React Query Cache Keys

### What's Unknown
Exact cache key strings and invalidation patterns used by data hooks.

### Why
Each hook (80+ hooks in `src/hooks/`) would need individual inspection.

### How to Resolve
Read each hook file, search for `useQuery`, `useMutation`, `queryKey` patterns.

---

## 3. EHRContext Full Implementation

### What's Unknown
Complete EHRContext provider implementation (state management, mock data loading, workspace management within encounters).

### Why
The EHRContext file was not read. Only the consumer interface was observed via TopBar, EncounterMenu, and EHRLayout.

### How to Resolve
Read `src/contexts/EHRContext.tsx`

---

## 4. Individual Auth Sub-Component Internals

### What's Unknown
Exact UI fields, validation, and error messages inside: `ProviderIdLookup`, `BiometricAuth`, `WorkspaceSelection`, `ClientAuth`, `SystemMaintenanceAuth`, `AboveSiteContextSelection`.

### Why
Only the parent Auth.tsx and props interface were inspected.

### How to Resolve
Read each file in `src/components/auth/`

---

## 5. Design Token Full Catalog

### What's Unknown
Complete list of CSS custom properties and their HSL values. Known semantic tokens include standard shadcn plus custom: `--topbar-*`, `--encounter-*`, `--status-*`, `--critical`.

### Why
`index.css` and `tailwind.config.ts` were not fully read.

### How to Resolve
Read `src/index.css` and `tailwind.config.ts`

---

## 6. Edge Function Implementations

### What's Unknown
Full implementation of edge functions (`geolocate-ip`, `track-login-attempt`, `oros-v1`, `zibo-v1`, and any others).

### Why
Edge function source files in `supabase/functions/` were not inspected.

### How to Resolve
Read `supabase/functions/*/index.ts`

---

## 7. RLS Policies

### What's Unknown
Exact Row Level Security policies on all tables.

### Why
RLS policies are defined in migrations which are read-only and not inspected.

### How to Resolve
Use `supabase--read_query` to query `pg_policies` or inspect migration files.

---

## 8. Responsive Breakpoint Details Per Page

### What's Unknown
Exact responsive behavior differences for each individual page beyond the global patterns documented (sidebar collapse, header element hiding).

### Why
Would require inspecting each page's Tailwind classes individually.

### How to Resolve
Inspect each page component for responsive class prefixes (`sm:`, `md:`, `lg:`, `xl:`).

---

## 9. PersonalHub & MyProfessionalHub Internals

### What's Unknown
Exact content, sections, and sub-components of the "My Life" and "My Professional" tabs on ModuleHome.

### Why
Only the component names and props were observed from ModuleHome.

### How to Resolve
Read `src/components/home/PersonalHub.tsx` and `src/components/home/MyProfessionalHub.tsx`

---

## 10. EmergencyHub Content

### What's Unknown
Exact UI of the emergency dialog that opens from the floating red button.

### Why
Component was identified but not read.

### How to Resolve
Read `src/components/emergency/EmergencyHub.tsx`

---

## 11. Portal (PatientPortal) Content

### What's Unknown
Internal structure and sections of the patient portal page.

### Why
`src/components/portal/PatientPortal.tsx` was not inspected.

### How to Resolve
Read `src/components/portal/PatientPortal.tsx`

---

## 12. MainWorkArea Content

### What's Unknown
How MainWorkArea renders different content based on EHR state (which clinical documentation panels show for each encounter menu item).

### Why
`src/components/layout/MainWorkArea.tsx` was not fully inspected.

### How to Resolve
Read `src/components/layout/MainWorkArea.tsx` and related clinical components.

---

## 13. Complete Module List per Category with All Metadata

### What's Unknown
Some module items reference paths that may not have corresponding routes (e.g., `/lab`, `/radiology` in Quick Access). These may be handled by existing pages with different paths or may 404.

### Why
The Quick Access buttons reference `/lab` and `/radiology` which are not in the router — they would hit the 404 catch-all.

### How to Resolve
Verify by checking App.tsx routes against all navigation paths. Known mismatches:
- `/lab` → no route (likely should be `/lims`)
- `/radiology` → no route (likely should be `/pacs`)
