## PCT Cadre Engine — Implementation Plan

### Phase 1: Database Terminology Tables (Migration)

Create three core tables in the database:

1. **`clinical_cadre_definitions`** — Master cadre registry
   - `cadre_code` (e.g. `cardiologist`, `icu_nurse`) — primary key
   - `cadre_category` — enum: `medical_officer`, `medical_specialist`, `surgical_specialist`, `nursing`, `midwifery`, `allied_health`, `diagnostic`, `emergency`, `dental`, `community`, `admin`
   - `parent_cadre_code` — self-referencing (e.g. `cardiologist` → `specialist`, `icu_nurse` → `nurse`)
   - `display_name`, `abbreviation`
   - `is_surgical` — boolean (distinguishes surgical vs medical specialists)
   - `form_complexity` — enum: `comprehensive`, `focused`, `simplified`
   - `scope_of_practice` — JSONB array of permitted actions (prescribe, order_labs, perform_surgery, etc.)
   - `specialty_exam_sections` — JSONB describing which exam/history sections apply
   - `cds_capabilities` — JSONB describing what CDS rules this cadre can action
   - `is_active`, `sort_order`

2. **`cadre_scope_rules`** — Scope-of-practice guardrails
   - `cadre_code` FK
   - `action_code` (e.g. `prescribe_schedule5`, `perform_surgery`, `order_mri`)
   - `permission` — enum: `allowed`, `supervised`, `blocked`
   - `requires_supervision_by` — optional cadre code
   - `facility_level_minimum` — optional (e.g. `district_hospital`)

3. **`cadre_form_sections`** — Which form sections each cadre sees
   - `cadre_code` FK
   - `section_code` (e.g. `socrates_hpi`, `cranial_nerves`, `gcs`, `obstetric_exam`)
   - `visibility` — enum: `required`, `optional`, `hidden`
   - `visit_type_filter` — optional (only show for certain visit types)

### Phase 2: Seed Data
Populate with comprehensive specialist list:

**Medical Specialists** (~20): Cardiologist, Pulmonologist, Gastroenterologist, Nephrologist, Neurologist, Rheumatologist, Endocrinologist, Haematologist, Oncologist, Infectious Disease, Dermatologist, Allergist/Immunologist, Geriatrician, Palliative Medicine, Neonatologist, Intensivist/Critical Care, Paediatrician (Medical)

**Surgical Specialists** (~15): General Surgeon, Orthopaedic Surgeon, Neurosurgeon, Cardiothoracic Surgeon, Vascular Surgeon, Urologist, Plastic/Reconstructive Surgeon, Paediatric Surgeon, ENT/ORL Surgeon, Ophthalmologist, Maxillofacial Surgeon, Trauma Surgeon, Transplant Surgeon, Colorectal Surgeon, Hepatobiliary Surgeon

**Nursing Specialties** (~10): ICU/Critical Care Nurse, Theatre/Perioperative Nurse, Emergency Nurse, Paediatric Nurse, Oncology Nurse, Psychiatric Nurse, Community Health Nurse, Midwife (Advanced), Infection Control Nurse, Wound Care Nurse

### Phase 3: PCT Cadre Engine (TypeScript)
Create `src/engines/pct/cadreEngine.ts`:
- `useCadreContext()` — resolves full cadre profile from DB + facility context
- `useScopeGuard(action)` — checks if current cadre can perform action
- `useCadreFormSections(visitType)` — returns visible sections for current cadre
- `useCDSCapabilities()` — exposes what CDS rules apply

### Phase 4: Update Dev Switcher
- Specialists grouped by medical/surgical with subspecialties
- Show scope-of-practice summary when selecting a cadre
