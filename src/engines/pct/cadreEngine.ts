/**
 * PCT Cadre Engine
 * 
 * Resolves the full cadre context for the current user within an encounter,
 * including specialty, scope-of-practice, form sections, and CDS capabilities.
 * 
 * Data is sourced from the clinical_cadre_definitions, cadre_scope_rules,
 * and cadre_form_sections tables in the database.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getDevOverrides, useDevOverrideListener } from '@/hooks/useCadreFormConfig';
import type { VisitType, AcuityLevel } from '@/hooks/useCadreFormConfig';

// ── Types ──────────────────────────────────────────

export interface CadreDefinition {
  cadre_code: string;
  cadre_category: string;
  parent_cadre_code: string | null;
  display_name: string;
  abbreviation: string | null;
  is_surgical: boolean;
  form_complexity: 'comprehensive' | 'focused' | 'simplified';
  scope_of_practice: string[];
  specialty_exam_sections: string[];
  cds_capabilities: string[];
  is_active: boolean;
  sort_order: number;
}

export interface ScopeRule {
  action_code: string;
  permission: 'allowed' | 'supervised' | 'blocked';
  requires_supervision_by: string | null;
  facility_level_minimum: string | null;
  description: string | null;
}

export interface FormSection {
  section_code: string;
  section_label: string;
  visibility: 'required' | 'optional' | 'hidden';
  visit_type_filter: string[] | null;
  sort_order: number;
}

export interface CadreContext {
  /** Resolved cadre definition */
  cadre: CadreDefinition | null;
  /** Parent cadre (e.g. 'specialist' for 'cardiologist') */
  parentCadre: CadreDefinition | null;
  /** Full hierarchy path (e.g. ['cardiologist', 'specialist']) */
  hierarchyPath: string[];
  /** Is this a surgical specialty? */
  isSurgical: boolean;
  /** Form complexity level */
  formComplexity: 'comprehensive' | 'focused' | 'simplified';
  /** Loading state */
  loading: boolean;
}

// ── Data Fetching ──────────────────────────────────

/** Fetch all active cadre definitions (cached globally) */
export function useCadreDefinitions() {
  return useQuery({
    queryKey: ['cadre-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinical_cadre_definitions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data || []) as unknown as CadreDefinition[];
    },
    staleTime: 1000 * 60 * 30, // 30 min cache — reference data
    gcTime: 1000 * 60 * 60,
  });
}

/** Fetch scope rules for a specific cadre (with parent inheritance) */
export function useCadreScopeRules(cadreCode: string | null) {
  const { data: definitions } = useCadreDefinitions();

  // Build hierarchy: cadre + parent + grandparent...
  const hierarchy: string[] = [];
  if (cadreCode && definitions) {
    let current = cadreCode;
    while (current) {
      hierarchy.push(current);
      const def = definitions.find(d => d.cadre_code === current);
      current = def?.parent_cadre_code || '';
    }
  }

  return useQuery({
    queryKey: ['cadre-scope-rules', hierarchy],
    queryFn: async () => {
      if (hierarchy.length === 0) return [];
      const { data, error } = await supabase
        .from('cadre_scope_rules')
        .select('*')
        .in('cadre_code', hierarchy)
        .eq('is_active', true);
      if (error) throw error;
      
      // More specific cadre rules override parent rules
      const ruleMap = new Map<string, ScopeRule>();
      // Process from parent to child so child overrides
      for (const code of [...hierarchy].reverse()) {
        const rules = (data || []).filter((r: any) => r.cadre_code === code);
        for (const r of rules) {
          ruleMap.set(r.action_code, {
            action_code: r.action_code,
            permission: r.permission as ScopeRule['permission'],
            requires_supervision_by: r.requires_supervision_by,
            facility_level_minimum: r.facility_level_minimum,
            description: r.description,
          });
        }
      }
      return Array.from(ruleMap.values());
    },
    enabled: hierarchy.length > 0,
    staleTime: 1000 * 60 * 30,
  });
}

/** Fetch form sections for a cadre (with inheritance) */
export function useCadreFormSectionsDB(cadreCode: string | null, visitType?: VisitType) {
  const { data: definitions } = useCadreDefinitions();

  const hierarchy: string[] = [];
  if (cadreCode && definitions) {
    let current = cadreCode;
    while (current) {
      hierarchy.push(current);
      const def = definitions.find(d => d.cadre_code === current);
      current = def?.parent_cadre_code || '';
    }
  }

  return useQuery({
    queryKey: ['cadre-form-sections', hierarchy, visitType],
    queryFn: async () => {
      if (hierarchy.length === 0) return [];
      const { data, error } = await supabase
        .from('cadre_form_sections')
        .select('*')
        .in('cadre_code', hierarchy)
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;

      // Merge with child overriding parent
      const sectionMap = new Map<string, FormSection>();
      for (const code of [...hierarchy].reverse()) {
        const sections = (data || []).filter((s: any) => s.cadre_code === code);
        for (const s of sections) {
          // Filter by visit type if specified
          if (visitType && s.visit_type_filter && s.visit_type_filter.length > 0) {
            if (!s.visit_type_filter.includes(visitType)) continue;
          }
          sectionMap.set(s.section_code, {
            section_code: s.section_code,
            section_label: s.section_label,
            visibility: s.visibility as FormSection['visibility'],
            visit_type_filter: s.visit_type_filter,
            sort_order: s.sort_order,
          });
        }
      }
      return Array.from(sectionMap.values()).sort((a, b) => a.sort_order - b.sort_order);
    },
    enabled: hierarchy.length > 0,
    staleTime: 1000 * 60 * 30,
  });
}

// ── Core Hooks ─────────────────────────────────────

/**
 * Resolves the full cadre context for the current user.
 * Respects dev overrides.
 */
export function useCadreContext(): CadreContext {
  const { profile } = useAuth();
  useDevOverrideListener();
  const overrides = getDevOverrides();
  const { data: definitions, isLoading } = useCadreDefinitions();

  const profileRole = (profile?.role as string) || 'doctor';
  const effectiveCadreCode = overrides.cadre || profileRole;

  if (!definitions || isLoading) {
    return {
      cadre: null,
      parentCadre: null,
      hierarchyPath: [],
      isSurgical: false,
      formComplexity: 'focused',
      loading: true,
    };
  }

  const cadre = definitions.find(d => d.cadre_code === effectiveCadreCode) || null;
  const parentCadre = cadre?.parent_cadre_code
    ? definitions.find(d => d.cadre_code === cadre.parent_cadre_code) || null
    : null;

  // Build hierarchy
  const hierarchyPath: string[] = [];
  let current = effectiveCadreCode;
  while (current) {
    hierarchyPath.push(current);
    const def = definitions.find(d => d.cadre_code === current);
    current = def?.parent_cadre_code || '';
  }

  return {
    cadre,
    parentCadre,
    hierarchyPath,
    isSurgical: cadre?.is_surgical || false,
    formComplexity: cadre?.form_complexity || 'focused',
    loading: false,
  };
}

/**
 * Scope-of-practice guardrail.
 * Returns permission status for a given action.
 */
export function useScopeGuard(actionCode: string) {
  const { cadre } = useCadreContext();
  const { data: rules, isLoading } = useCadreScopeRules(cadre?.cadre_code || null);

  const rule = rules?.find(r => r.action_code === actionCode);

  // If no explicit rule exists, check scope_of_practice array on cadre definition
  const inScopeOfPractice = cadre?.scope_of_practice?.includes(actionCode) || false;

  return {
    loading: isLoading,
    permission: rule?.permission || (inScopeOfPractice ? 'allowed' : 'blocked') as ScopeRule['permission'],
    requiresSupervision: rule?.permission === 'supervised',
    supervisorCadre: rule?.requires_supervision_by || null,
    facilityMinimum: rule?.facility_level_minimum || null,
    isAllowed: rule?.permission === 'allowed' || (!rule && inScopeOfPractice),
    isBlocked: rule?.permission === 'blocked' || (!rule && !inScopeOfPractice),
  };
}

/**
 * Returns CDS capabilities for the current cadre.
 * CDS rules can filter recommendations based on what this cadre can action.
 */
export function useCDSCapabilities() {
  const { cadre, parentCadre } = useCadreContext();

  // Merge parent + child capabilities
  const capabilities = new Set<string>();
  if (parentCadre?.cds_capabilities) {
    parentCadre.cds_capabilities.forEach(c => capabilities.add(c));
  }
  if (cadre?.cds_capabilities) {
    cadre.cds_capabilities.forEach(c => capabilities.add(c));
  }

  // Also include scope_of_practice as CDS can reference these
  if (cadre?.scope_of_practice) {
    cadre.scope_of_practice.forEach(s => capabilities.add(s));
  }

  return {
    capabilities: Array.from(capabilities),
    canAction: (action: string) => capabilities.has(action),
    isSurgical: cadre?.is_surgical || false,
    specialtyExamSections: cadre?.specialty_exam_sections || [],
  };
}

/**
 * Returns grouped cadre definitions for UI pickers (e.g. Dev Switcher).
 */
export function useCadreGroups() {
  const { data: definitions, isLoading } = useCadreDefinitions();

  if (!definitions) return { groups: [], loading: isLoading };

  const categoryLabels: Record<string, { label: string; emoji: string }> = {
    medical_officer: { label: 'Medical Officers', emoji: '🩺' },
    medical_specialist: { label: 'Medical Specialists', emoji: '🔬' },
    surgical_specialist: { label: 'Surgical Specialists', emoji: '🔪' },
    nursing: { label: 'Nursing', emoji: '👩‍⚕️' },
    midwifery: { label: 'Midwifery', emoji: '🤱' },
    allied_health: { label: 'Allied Health', emoji: '🦴' },
    diagnostic: { label: 'Diagnostic & Pharmacy', emoji: '🔬' },
    emergency: { label: 'Emergency', emoji: '🚑' },
    dental: { label: 'Dental', emoji: '🦷' },
    community: { label: 'Community & Public Health', emoji: '🏘️' },
    admin: { label: 'Administrative', emoji: '📋' },
  };

  const grouped = new Map<string, { label: string; emoji: string; items: CadreDefinition[] }>();

  for (const def of definitions) {
    const cat = def.cadre_category;
    if (!grouped.has(cat)) {
      const meta = categoryLabels[cat] || { label: cat, emoji: '👤' };
      grouped.set(cat, { ...meta, items: [] });
    }
    grouped.get(cat)!.items.push(def);
  }

  // Order by category
  const categoryOrder = [
    'medical_officer', 'medical_specialist', 'surgical_specialist',
    'nursing', 'midwifery', 'allied_health', 'diagnostic',
    'emergency', 'dental', 'community', 'admin',
  ];

  const groups = categoryOrder
    .filter(cat => grouped.has(cat))
    .map(cat => ({
      category: cat,
      ...grouped.get(cat)!,
    }));

  return { groups, loading: isLoading };
}
