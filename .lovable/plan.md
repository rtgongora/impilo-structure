
# Complete Public Health & Coverage Modules

## Current State
Both modules have tab structures but most tabs show placeholder text. Need full operational UI for day-to-day service delivery and admin processes.

## Public Health & Local Authority Operations
The page is ~416 lines. Will refactor into components under `src/components/public-health/`:

### Tabs to complete (currently placeholder):
1. **Surveillance / eIDSR** — Case-based reporting form, threshold alert list, weekly reporting table, signal triage queue
2. **Field Operations** — Field team roster, deployment map/table, task assignment board, mobile data collection forms, GPS check-in log
3. **Emergency Coordination** — EOC activation panel, resource mobilization tracker, situation reports (SitRep) list, inter-agency contact directory, incident action plan

### Tabs to enhance (basic content exists):
4. **Dashboard** — Add trend sparklines, jurisdiction-specific KPIs, reporting completeness heatmap
5. **Outbreaks** — Add outbreak detail drill-down, contact tracing queue, epi-curve placeholder, response team assignment
6. **Inspections** — Add inspection form workflow (schedule → conduct → findings → enforcement), compliance scoring, follow-up tracking
7. **Complaints** — Add complaint intake form, investigation workflow, enforcement actions, resolution tracking
8. **Campaigns** — Add campaign planning wizard, target population segmentation, supply/logistics tracking, coverage monitoring by site

## Coverage, Financing & Payer Operations  
The page is ~394 lines. Will refactor into components under `src/components/coverage/`:

### Tabs to complete (currently placeholder):
1. **Membership** — Member search, enrollment form, beneficiary management, coverage period table, waiting period tracker
2. **Provider Contracting** — Contract list, rate schedule editor, network tier assignment, credentialing status, sanction tracking
3. **Preauthorization** — Preauth request queue, review workflow, clinical evidence panel, approval/denial with reasons
4. **Contributions & Billing** — Premium schedule, employer billing batches, receipt log, arrears dashboard, subsidy tracking
5. **Settlement & Remittance** — Payment batch creation, remittance advice generation, capitation calculations, recovery/clawback queue
6. **Appeals & Queries** — Appeal submission form, review queue, escalation workflow, resolution tracking
7. **Payer Intelligence** — Fraud detection alerts, utilization pattern charts, cost analysis, medical loss ratio trends

### Tabs to enhance:
8. **Dashboard** — Add financial trend charts, scheme comparison, risk pool health indicators
9. **Schemes** — Add scheme detail drill-down, benefit package editor, formulary rules, exclusion management
10. **Eligibility** — Add eligibility check form with member lookup, batch eligibility verification
11. **Claims** — Add claim detail view, adjudication workspace, coding edit review, batch claim submission

## Approach
- Extract each tab into its own component file for maintainability
- Use consistent mock data patterns across related tabs
- Full CRUD-style UI with tables, forms, status workflows, and action buttons
- No database changes needed (mock data for prototype)

## Estimated: ~15 component files across both modules
