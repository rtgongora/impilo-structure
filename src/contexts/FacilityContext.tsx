import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

/**
 * Facility capability codes
 * These map to features/modules that can be enabled or disabled based on facility type
 */
export type FacilityCapability =
  | 'theatre'          // Surgical theatre operations
  | 'inpatient'        // Inpatient beds/wards
  | 'icu'              // Intensive care unit
  | 'maternity'        // Maternity/delivery services
  | 'dialysis'         // Dialysis unit
  | 'radiology'        // X-ray, CT, MRI imaging
  | 'laboratory'       // In-house laboratory
  | 'pharmacy'         // Full pharmacy services
  | 'pharmacy_basic'   // Basic drug dispensing only
  | 'blood_bank'       // Blood bank services
  | 'dental'           // Dental services
  | 'mental_health'    // Mental health services
  | 'rehabilitation'   // Rehabilitation services
  | 'physiotherapy'    // Physiotherapy
  | 'occupational_therapy'
  | 'emergency_24hr'   // 24/7 emergency services
  | 'chemotherapy'     // Cancer chemotherapy
  | 'radiotherapy'     // Cancer radiotherapy
  | 'pacs'             // Picture archiving (DICOM)
  | 'lims'             // Laboratory information system
  | 'teleconsult'      // Telemedicine capabilities
  | 'outpatient'       // Outpatient services
  | 'immunization'     // Vaccination services
  | 'anc'              // Antenatal care
  | 'referral'         // Can refer to higher level
  | 'dispensing'       // Can dispense medications
  | 'specimen_collection' // Can collect specimens
  | 'psychotherapy';   // Psychotherapy services

export type LevelOfCare = 'primary' | 'secondary' | 'tertiary' | 'quaternary';

export interface FacilityInfo {
  id: string;
  name: string;
  facility_code: string | null;
  facility_type_code: string | null;
  facility_type_name: string | null;
  level_of_care: LevelOfCare | null;
  category: string | null;
  capabilities: FacilityCapability[];
}

interface FacilityContextType {
  // Current facility state
  currentFacility: FacilityInfo | null;
  isLoading: boolean;
  error: string | null;
  
  // Facility selection (for login/session)
  availableFacilities: FacilityInfo[];
  selectFacility: (facilityId: string) => Promise<void>;
  clearFacility: () => void;
  
  // Capability checks
  hasCapability: (capability: FacilityCapability) => boolean;
  hasAnyCapability: (capabilities: FacilityCapability[]) => boolean;
  hasAllCapabilities: (capabilities: FacilityCapability[]) => boolean;
  
  // Level of care checks
  isAtLeastLevel: (level: LevelOfCare) => boolean;
  levelOfCare: LevelOfCare | null;
  
  // Refresh data
  refreshFacilityData: () => Promise<void>;
}

const FacilityContext = createContext<FacilityContextType | undefined>(undefined);

// Level of care hierarchy (lower index = higher level)
const LEVEL_HIERARCHY: LevelOfCare[] = ['quaternary', 'tertiary', 'secondary', 'primary'];

export function useFacility() {
  const context = useContext(FacilityContext);
  if (!context) {
    throw new Error("useFacility must be used within FacilityProvider");
  }
  return context;
}

// Hook for checking capabilities without full context
export function useFacilityCapabilities() {
  const context = useContext(FacilityContext);
  
  return {
    hasCapability: context?.hasCapability ?? (() => true),
    hasAnyCapability: context?.hasAnyCapability ?? (() => true),
    hasAllCapabilities: context?.hasAllCapabilities ?? (() => true),
    isAtLeastLevel: context?.isAtLeastLevel ?? (() => true),
    capabilities: context?.currentFacility?.capabilities ?? [],
    levelOfCare: context?.currentFacility?.level_of_care ?? null,
    facilityName: context?.currentFacility?.name ?? null,
    isLoaded: !!context?.currentFacility,
  };
}

export function FacilityProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [currentFacility, setCurrentFacility] = useState<FacilityInfo | null>(null);
  const [availableFacilities, setAvailableFacilities] = useState<FacilityInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch facility capabilities from the view
  const fetchFacilityCapabilities = useCallback(async (facilityId: string): Promise<FacilityInfo | null> => {
    try {
      const { data, error: queryError } = await supabase
        .from('facility_capabilities')
        .select('*')
        .eq('facility_id', facilityId)
        .maybeSingle();

      if (queryError) {
        console.error('Error fetching facility capabilities:', queryError);
        return null;
      }

      if (!data) return null;

      return {
        id: data.facility_id,
        name: data.facility_name,
        facility_code: data.facility_code,
        facility_type_code: data.facility_type_code,
        facility_type_name: data.facility_type_name,
        level_of_care: data.level_of_care as LevelOfCare,
        category: data.category,
        capabilities: (data.capabilities || []) as FacilityCapability[],
      };
    } catch (err) {
      console.error('Error in fetchFacilityCapabilities:', err);
      return null;
    }
  }, []);

  // Fetch all available facilities for selection
  const fetchAvailableFacilities = useCallback(async () => {
    try {
      const { data, error: queryError } = await supabase
        .from('facility_capabilities')
        .select('*')
        .order('facility_name');

      if (queryError) {
        console.error('Error fetching available facilities:', queryError);
        return;
      }

      const facilities: FacilityInfo[] = (data || []).map(f => ({
        id: f.facility_id,
        name: f.facility_name,
        facility_code: f.facility_code,
        facility_type_code: f.facility_type_code,
        facility_type_name: f.facility_type_name,
        level_of_care: f.level_of_care as LevelOfCare,
        category: f.category,
        capabilities: (f.capabilities || []) as FacilityCapability[],
      }));

      setAvailableFacilities(facilities);
    } catch (err) {
      console.error('Error in fetchAvailableFacilities:', err);
    }
  }, []);

  // Load facility from profile or session storage
  const loadFacility = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First, check session storage for selected facility
      const storedFacilityId = sessionStorage.getItem('impilo_current_facility_id');
      
      // Then check profile for assigned facility
      const facilityId = storedFacilityId || profile?.facility_id;

      if (facilityId) {
        const facility = await fetchFacilityCapabilities(facilityId);
        if (facility) {
          setCurrentFacility(facility);
          sessionStorage.setItem('impilo_current_facility_id', facilityId);
        }
      }

      // Also fetch available facilities for selection
      await fetchAvailableFacilities();
    } catch (err) {
      console.error('Error loading facility:', err);
      setError('Failed to load facility information');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.facility_id, fetchFacilityCapabilities, fetchAvailableFacilities]);

  // Select a facility for the current session
  const selectFacility = useCallback(async (facilityId: string) => {
    setIsLoading(true);
    try {
      const facility = await fetchFacilityCapabilities(facilityId);
      if (facility) {
        setCurrentFacility(facility);
        sessionStorage.setItem('impilo_current_facility_id', facilityId);
      } else {
        setError('Facility not found');
      }
    } catch (err) {
      console.error('Error selecting facility:', err);
      setError('Failed to select facility');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFacilityCapabilities]);

  // Clear facility selection
  const clearFacility = useCallback(() => {
    setCurrentFacility(null);
    sessionStorage.removeItem('impilo_current_facility_id');
  }, []);

  // Capability check functions
  const hasCapability = useCallback((capability: FacilityCapability): boolean => {
    if (!currentFacility) return true; // Allow by default if no facility set
    return currentFacility.capabilities.includes(capability);
  }, [currentFacility]);

  const hasAnyCapability = useCallback((capabilities: FacilityCapability[]): boolean => {
    if (!currentFacility) return true;
    return capabilities.some(cap => currentFacility.capabilities.includes(cap));
  }, [currentFacility]);

  const hasAllCapabilities = useCallback((capabilities: FacilityCapability[]): boolean => {
    if (!currentFacility) return true;
    return capabilities.every(cap => currentFacility.capabilities.includes(cap));
  }, [currentFacility]);

  // Level of care check
  const isAtLeastLevel = useCallback((level: LevelOfCare): boolean => {
    if (!currentFacility?.level_of_care) return true;
    const currentIndex = LEVEL_HIERARCHY.indexOf(currentFacility.level_of_care);
    const requiredIndex = LEVEL_HIERARCHY.indexOf(level);
    return currentIndex <= requiredIndex; // Lower index = higher level
  }, [currentFacility]);

  // Refresh facility data
  const refreshFacilityData = useCallback(async () => {
    await loadFacility();
  }, [loadFacility]);

  // Load facility when user/profile changes
  useEffect(() => {
    if (user) {
      loadFacility();
    } else {
      setCurrentFacility(null);
      setAvailableFacilities([]);
      setIsLoading(false);
    }
  }, [user, profile?.facility_id, loadFacility]);

  return (
    <FacilityContext.Provider value={{
      currentFacility,
      isLoading,
      error,
      availableFacilities,
      selectFacility,
      clearFacility,
      hasCapability,
      hasAnyCapability,
      hasAllCapabilities,
      isAtLeastLevel,
      levelOfCare: currentFacility?.level_of_care ?? null,
      refreshFacilityData,
    }}>
      {children}
    </FacilityContext.Provider>
  );
}

// Mapping of modules/features to required capabilities
export const MODULE_CAPABILITY_REQUIREMENTS: Record<string, FacilityCapability[]> = {
  // Theatre & Surgery
  'theatre': ['theatre'],
  'theatre-booking': ['theatre'],
  'theatre-scheduling': ['theatre'],
  'anaesthesia': ['theatre'],
  
  // Inpatient
  'beds': ['inpatient'],
  'bed-management': ['inpatient'],
  'ward-management': ['inpatient'],
  'nursing-care': ['inpatient'],
  'handoff': ['inpatient'],
  
  // ICU
  'icu': ['icu'],
  'vitals-monitor': ['icu'],
  
  // Maternity
  'maternity': ['maternity'],
  'labour-delivery': ['maternity'],
  'anc': ['anc', 'maternity'],
  
  // Dialysis
  'dialysis': ['dialysis'],
  
  // Imaging
  'pacs': ['pacs', 'radiology'],
  'radiology': ['radiology'],
  'imaging': ['radiology'],
  
  // Laboratory
  'lims': ['lims', 'laboratory'],
  'laboratory': ['laboratory'],
  'specimen-collection': ['specimen_collection', 'laboratory'],
  
  // Pharmacy
  'pharmacy': ['pharmacy', 'pharmacy_basic'],
  'dispensing': ['dispensing', 'pharmacy'],
  
  // Blood bank
  'blood-bank': ['blood_bank'],
  
  // Mental health
  'mental-health': ['mental_health'],
  'psychotherapy': ['psychotherapy', 'mental_health'],
  
  // Rehabilitation
  'rehabilitation': ['rehabilitation'],
  'physiotherapy': ['physiotherapy', 'rehabilitation'],
  
  // Cancer treatment
  'chemotherapy': ['chemotherapy'],
  'radiotherapy': ['radiotherapy'],
  
  // Emergency
  'emergency-24hr': ['emergency_24hr'],
  
  // Dental
  'dental': ['dental'],
  
  // Telemedicine
  'teleconsult': ['teleconsult'],
  
  // Outpatient (available at all levels)
  'queue': ['outpatient', 'emergency_24hr', 'inpatient'],
  'appointments': ['outpatient', 'emergency_24hr', 'inpatient'],
};

// Helper to check if a module is available at current facility
export function isModuleAvailable(moduleId: string, capabilities: FacilityCapability[]): boolean {
  const requiredCaps = MODULE_CAPABILITY_REQUIREMENTS[moduleId];
  if (!requiredCaps) return true; // No requirements = always available
  
  // Module is available if facility has ANY of the required capabilities
  return requiredCaps.some(cap => capabilities.includes(cap));
}