// Hook to manage the active work context (facility + workspace selection)
// Controls whether user sees workplace selection or module grid
// Supports: facility-level clinical, above-site oversight, remote/pool work, and system support modes

import { useState, useEffect, useCallback } from 'react';
import type { ProviderFacility } from './useProviderFacilities';

// Access mode determines what the user can do and see
export type AccessMode = 
  | 'clinical'        // Direct patient care at a facility
  | 'oversight'       // Aggregate/administrative view without patient access
  | 'oversight_drill' // Drilled down to specific facility in oversight mode
  | 'support'         // System superadmin technical support
  | 'remote_clinical' // Remote clinical work (telemedicine pool)
  | 'remote_admin';   // Remote administrative work

export type WorkContextType = 'facility' | 'above_site' | 'remote' | 'combined' | 'support';

export interface ActiveWorkContext {
  type: WorkContextType;
  accessMode: AccessMode;
  
  // Facility context (for clinical or drilled-down oversight)
  facilityId?: string;
  facilityName?: string;
  facilityType?: string;
  levelOfCare?: string;
  contextLabel?: string;
  isPic?: boolean;
  isOwner?: boolean;
  privileges?: string[];
  hasClinicalRole?: boolean;  // Does user have clinical privileges at this facility?
  
  // Above-site/oversight specific
  aboveSiteRoleId?: string;
  aboveSiteRoleType?: string;
  aboveSiteContextType?: string;
  jurisdiction?: {
    province?: string;
    district?: string;
    programme?: string;
    facilityIds?: string[];  // For facility-list oversight
  };
  
  // Combined view for managers with many facilities
  combinedScope?: {
    totalFacilities: number;
    levels: string[];
    regions: string[];
  };
  
  // Support mode specific
  supportMode?: {
    targetFacilityId?: string;
    targetFacilityName?: string;
    reason?: string;
    ticketId?: string;
  };
  
  // Telemedicine/pool specific
  poolId?: string;
  poolName?: string;
  
  // Metadata
  selectedAt: string;
  sessionId?: string;
  canAccessPatientData: boolean;
  canIntervene: boolean;
}

const STORAGE_KEY = 'activeWorkContext';

interface UseActiveWorkContextReturn {
  activeContext: ActiveWorkContext | null;
  hasActiveContext: boolean;
  accessMode: AccessMode | null;
  
  // Selection methods
  selectFacility: (facility: ProviderFacility) => void;
  selectAboveSite: (
    roleId: string,
    roleType: string,
    contextType: string,
    contextLabel: string,
    jurisdiction?: { province?: string; district?: string; programme?: string; facilityIds?: string[] },
    canAccessPatientData?: boolean,
    canIntervene?: boolean
  ) => void;
  selectCombinedView: (
    totalFacilities: number,
    levels: string[],
    regions: string[],
    aboveSiteRoleId?: string
  ) => void;
  selectRemote: (isClinical?: boolean, poolId?: string, poolName?: string) => void;
  selectSupportMode: (targetFacilityId?: string, targetFacilityName?: string, reason?: string, ticketId?: string) => void;
  
  // Drilling and narrowing
  drillToFacility: (facilityId: string, facilityName: string, hasClinicalRole: boolean) => void;
  returnToOversightView: () => void;
  
  // Context management
  clearContext: () => void;
  switchContext: () => void;
  
  // Access checks
  canAccessPatientData: boolean;
  isInClinicalMode: boolean;
  isInOversightMode: boolean;
  isInSupportMode: boolean;
}

export function useActiveWorkContext(): UseActiveWorkContextReturn {
  const [activeContext, setActiveContext] = useState<ActiveWorkContext | null>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Sync with sessionStorage
  useEffect(() => {
    if (activeContext) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(activeContext));
      // Also update the legacy activeWorkspace for backward compatibility
      sessionStorage.setItem('activeWorkspace', JSON.stringify({
        department: activeContext.contextLabel || 'General',
        physicalWorkspace: {
          name: activeContext.facilityName || activeContext.contextLabel || 'Unknown',
          location: activeContext.levelOfCare || '',
          type: activeContext.facilityType || activeContext.type,
        },
        facility: activeContext.facilityName,
        loginTime: activeContext.selectedAt,
        accessMode: activeContext.accessMode,
      }));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem('activeWorkspace');
    }
  }, [activeContext]);

  // Select a facility for direct clinical work
  const selectFacility = useCallback((facility: ProviderFacility) => {
    const context: ActiveWorkContext = {
      type: 'facility',
      accessMode: 'clinical',
      facilityId: facility.facility_id,
      facilityName: facility.facility_name,
      facilityType: facility.facility_type,
      levelOfCare: facility.level_of_care,
      contextLabel: facility.context_label,
      isPic: facility.is_pic,
      isOwner: facility.is_owner,
      privileges: facility.privileges,
      hasClinicalRole: true,
      selectedAt: new Date().toISOString(),
      canAccessPatientData: true,
      canIntervene: false,
    };
    setActiveContext(context);
  }, []);

  // Select an above-site oversight context
  const selectAboveSite = useCallback((
    roleId: string,
    roleType: string,
    contextType: string,
    contextLabel: string,
    jurisdiction?: { province?: string; district?: string; programme?: string; facilityIds?: string[] },
    canAccessPatientData: boolean = false,
    canIntervene: boolean = false
  ) => {
    const context: ActiveWorkContext = {
      type: 'above_site',
      accessMode: 'oversight',
      aboveSiteRoleId: roleId,
      aboveSiteRoleType: roleType,
      aboveSiteContextType: contextType,
      contextLabel,
      jurisdiction,
      selectedAt: new Date().toISOString(),
      canAccessPatientData,
      canIntervene,
    };
    setActiveContext(context);
  }, []);

  // Select combined/aggregate view for managers with many facilities
  const selectCombinedView = useCallback((
    totalFacilities: number,
    levels: string[],
    regions: string[],
    aboveSiteRoleId?: string
  ) => {
    const context: ActiveWorkContext = {
      type: 'combined',
      accessMode: 'oversight',
      contextLabel: 'Combined View',
      combinedScope: {
        totalFacilities,
        levels,
        regions,
      },
      aboveSiteRoleId,
      selectedAt: new Date().toISOString(),
      canAccessPatientData: false,
      canIntervene: false,
    };
    setActiveContext(context);
  }, []);

  // Select remote work mode
  const selectRemote = useCallback((
    isClinical: boolean = false,
    poolId?: string,
    poolName?: string
  ) => {
    const context: ActiveWorkContext = {
      type: 'remote',
      accessMode: isClinical ? 'remote_clinical' : 'remote_admin',
      contextLabel: isClinical ? (poolName || 'Telemedicine Pool') : 'Remote Work',
      poolId,
      poolName,
      selectedAt: new Date().toISOString(),
      canAccessPatientData: isClinical,
      canIntervene: false,
    };
    setActiveContext(context);
  }, []);

  // Select system support mode (superadmin only)
  const selectSupportMode = useCallback((
    targetFacilityId?: string,
    targetFacilityName?: string,
    reason?: string,
    ticketId?: string
  ) => {
    const context: ActiveWorkContext = {
      type: 'support',
      accessMode: 'support',
      contextLabel: targetFacilityName ? `Support: ${targetFacilityName}` : 'System Support',
      supportMode: {
        targetFacilityId,
        targetFacilityName,
        reason,
        ticketId,
      },
      facilityId: targetFacilityId,
      facilityName: targetFacilityName,
      selectedAt: new Date().toISOString(),
      canAccessPatientData: false, // Support mode never has patient access by default
      canIntervene: true, // Can make system changes
    };
    setActiveContext(context);
  }, []);

  // Drill down from oversight to a specific facility
  const drillToFacility = useCallback((
    facilityId: string,
    facilityName: string,
    hasClinicalRole: boolean
  ) => {
    if (!activeContext) return;
    
    const updatedContext: ActiveWorkContext = {
      ...activeContext,
      accessMode: hasClinicalRole ? 'clinical' : 'oversight_drill',
      facilityId,
      facilityName,
      hasClinicalRole,
      canAccessPatientData: hasClinicalRole,
    };
    setActiveContext(updatedContext);
  }, [activeContext]);

  // Return to oversight view from drilled-down state
  const returnToOversightView = useCallback(() => {
    if (!activeContext || activeContext.accessMode !== 'oversight_drill') return;
    
    const updatedContext: ActiveWorkContext = {
      ...activeContext,
      accessMode: 'oversight',
      facilityId: undefined,
      facilityName: undefined,
      hasClinicalRole: false,
      canAccessPatientData: false,
    };
    setActiveContext(updatedContext);
  }, [activeContext]);

  const clearContext = useCallback(() => {
    setActiveContext(null);
  }, []);

  const switchContext = useCallback(() => {
    // Clear context to show selection hub again
    setActiveContext(null);
  }, []);

  // Derived values
  const accessMode = activeContext?.accessMode || null;
  const canAccessPatientData = activeContext?.canAccessPatientData ?? false;
  const isInClinicalMode = accessMode === 'clinical' || accessMode === 'remote_clinical';
  const isInOversightMode = accessMode === 'oversight' || accessMode === 'oversight_drill';
  const isInSupportMode = accessMode === 'support';

  return {
    activeContext,
    hasActiveContext: activeContext !== null,
    accessMode,
    selectFacility,
    selectAboveSite,
    selectCombinedView,
    selectRemote,
    selectSupportMode,
    drillToFacility,
    returnToOversightView,
    clearContext,
    switchContext,
    canAccessPatientData,
    isInClinicalMode,
    isInOversightMode,
    isInSupportMode,
  };
}
