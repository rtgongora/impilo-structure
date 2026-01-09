import { useMemo } from 'react';
import { useFacilityCapabilities as useFacilityCapabilitiesContext, FacilityCapability, MODULE_CAPABILITY_REQUIREMENTS, isModuleAvailable } from '@/contexts/FacilityContext';

/**
 * Hook for filtering navigation items and modules based on facility capabilities
 */
export function useModuleAvailability() {
  const { capabilities, levelOfCare, hasCapability, hasAnyCapability, isAtLeastLevel, isLoaded } = useFacilityCapabilitiesContext();

  const checkModuleAvailable = useMemo(() => {
    return (moduleId: string): boolean => {
      if (!isLoaded) return true; // Show all while loading
      return isModuleAvailable(moduleId, capabilities);
    };
  }, [capabilities, isLoaded]);

  const filterNavItems = useMemo(() => {
    return <T extends { path?: string; moduleId?: string }>(items: T[]): T[] => {
      if (!isLoaded) return items; // Show all while loading
      
      return items.filter(item => {
        // Extract module ID from path or use moduleId property
        const moduleId = item.moduleId || item.path?.replace(/^\//, '').split('/')[0];
        if (!moduleId) return true;
        
        return isModuleAvailable(moduleId, capabilities);
      });
    };
  }, [capabilities, isLoaded]);

  return {
    checkModuleAvailable,
    filterNavItems,
    capabilities,
    levelOfCare,
    hasCapability,
    hasAnyCapability,
    isAtLeastLevel,
    isLoaded,
    
    // Convenience checks for common modules
    hasTheatre: hasCapability('theatre'),
    hasInpatient: hasCapability('inpatient'),
    hasICU: hasCapability('icu'),
    hasPACS: hasAnyCapability(['pacs', 'radiology']),
    hasLIMS: hasAnyCapability(['lims', 'laboratory']),
    hasPharmacy: hasAnyCapability(['pharmacy', 'pharmacy_basic']),
    hasMaternity: hasAnyCapability(['maternity', 'anc']),
    hasEmergency: hasCapability('emergency_24hr'),
    hasTeleconsult: hasCapability('teleconsult'),
    hasMentalHealth: hasCapability('mental_health'),
  };
}

/**
 * Component for conditionally rendering based on capability
 */
export function CapabilityGate({ 
  requires, 
  requiresAll = false,
  children, 
  fallback 
}: { 
  requires: FacilityCapability | FacilityCapability[];
  requiresAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}): JSX.Element | null {
  const { hasAnyCapability, hasAllCapabilities, isLoaded } = useFacilityCapabilitiesContext();
  
  if (!isLoaded) {
    return null;
  }
  
  const caps = Array.isArray(requires) ? requires : [requires];
  const hasAccess = requiresAll 
    ? hasAllCapabilities(caps)
    : hasAnyCapability(caps);
  
  if (!hasAccess) {
    return fallback ? fallback as JSX.Element : null;
  }
  
  return children as JSX.Element;
}

/**
 * Component for conditionally rendering based on level of care
 */
export function LevelOfCareGate({ 
  minLevel, 
  children, 
  fallback 
}: { 
  minLevel: 'primary' | 'secondary' | 'tertiary' | 'quaternary';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}): JSX.Element | null {
  const { isAtLeastLevel, isLoaded } = useFacilityCapabilitiesContext();
  
  if (!isLoaded) {
    return null;
  }
  
  if (!isAtLeastLevel(minLevel)) {
    return fallback ? fallback as JSX.Element : null;
  }
  
  return children as JSX.Element;
}