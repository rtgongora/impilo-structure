import { useState, useCallback, useMemo } from "react";
import { EncounterMenuItem, ENCOUNTER_MENU_ITEMS } from "@/types/ehr";

export type SectionStatus = "not-started" | "in-progress" | "completed" | "skipped" | "attention";

interface SectionRecommendation {
  priority: "high" | "medium" | "low" | "skip";
  reason: string;
}

interface UseEncounterWizardReturn {
  /** Status of each section */
  sectionStatuses: Record<EncounterMenuItem, SectionStatus>;
  /** Mark a section as visited/in-progress */
  markVisited: (section: EncounterMenuItem) => void;
  /** Mark a section as completed */
  markCompleted: (section: EncounterMenuItem) => void;
  /** Get recommended next section */
  recommendedNext: EncounterMenuItem | null;
  /** Get context-aware recommendations for each section */
  recommendations: Record<EncounterMenuItem, SectionRecommendation>;
  /** Overall progress percentage */
  progress: number;
  /** Navigate to next section in flow */
  nextSection: (current: EncounterMenuItem) => EncounterMenuItem | null;
  /** Navigate to previous section in flow */
  prevSection: (current: EncounterMenuItem) => EncounterMenuItem | null;
  /** Sections that need attention based on patient context */
  attentionSections: EncounterMenuItem[];
}

// Simulates context-aware intelligence based on patient data
function getRecommendations(): Record<EncounterMenuItem, SectionRecommendation> {
  // In production, this would analyze patient data, pending orders, etc.
  return {
    overview: { priority: "high", reason: "Review patient summary first" },
    assessment: { priority: "high", reason: "Clinical assessment pending" },
    problems: { priority: "high", reason: "2 active problems need review" },
    orders: { priority: "high", reason: "3 pending lab results" },
    care: { priority: "medium", reason: "Care plan needs update" },
    consults: { priority: "low", reason: "No pending consults" },
    notes: { priority: "medium", reason: "Shift note due" },
    outcome: { priority: "low", reason: "Complete when ready to discharge" },
  };
}

const SECTION_ORDER: EncounterMenuItem[] = ENCOUNTER_MENU_ITEMS.map(i => i.id);

export function useEncounterWizard(): UseEncounterWizardReturn {
  const [sectionStatuses, setSectionStatuses] = useState<Record<EncounterMenuItem, SectionStatus>>(() => {
    const initial: Record<string, SectionStatus> = {};
    SECTION_ORDER.forEach(id => { initial[id] = "not-started"; });
    return initial as Record<EncounterMenuItem, SectionStatus>;
  });

  const recommendations = useMemo(() => getRecommendations(), []);

  const markVisited = useCallback((section: EncounterMenuItem) => {
    setSectionStatuses(prev => {
      if (prev[section] === "completed") return prev;
      return { ...prev, [section]: "in-progress" };
    });
  }, []);

  const markCompleted = useCallback((section: EncounterMenuItem) => {
    setSectionStatuses(prev => ({ ...prev, [section]: "completed" }));
  }, []);

  const progress = useMemo(() => {
    const total = SECTION_ORDER.length;
    const completed = SECTION_ORDER.filter(id => 
      sectionStatuses[id] === "completed" || sectionStatuses[id] === "skipped"
    ).length;
    return Math.round((completed / total) * 100);
  }, [sectionStatuses]);

  const recommendedNext = useMemo(() => {
    // Find the first high-priority section that isn't completed
    const highPriority = SECTION_ORDER.filter(
      id => recommendations[id].priority === "high" && sectionStatuses[id] !== "completed"
    );
    if (highPriority.length > 0) return highPriority[0];

    // Then medium priority
    const medPriority = SECTION_ORDER.filter(
      id => recommendations[id].priority === "medium" && sectionStatuses[id] !== "completed"
    );
    if (medPriority.length > 0) return medPriority[0];

    // Then any not-started
    const notStarted = SECTION_ORDER.filter(id => sectionStatuses[id] === "not-started");
    return notStarted.length > 0 ? notStarted[0] : null;
  }, [sectionStatuses, recommendations]);

  const attentionSections = useMemo(() => {
    return SECTION_ORDER.filter(
      id => recommendations[id].priority === "high" && sectionStatuses[id] !== "completed"
    );
  }, [sectionStatuses, recommendations]);

  const nextSection = useCallback((current: EncounterMenuItem): EncounterMenuItem | null => {
    const idx = SECTION_ORDER.indexOf(current);
    return idx < SECTION_ORDER.length - 1 ? SECTION_ORDER[idx + 1] : null;
  }, []);

  const prevSection = useCallback((current: EncounterMenuItem): EncounterMenuItem | null => {
    const idx = SECTION_ORDER.indexOf(current);
    return idx > 0 ? SECTION_ORDER[idx - 1] : null;
  }, []);

  return {
    sectionStatuses,
    markVisited,
    markCompleted,
    recommendedNext,
    recommendations,
    progress,
    nextSection,
    prevSection,
    attentionSections,
  };
}
