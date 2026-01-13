// Hook to manage the active work context (facility + workspace selection)
// Controls whether user sees workplace selection or module grid

import { useState, useEffect, useCallback } from 'react';
import type { ProviderFacility } from './useProviderFacilities';

export type WorkContextType = 'facility' | 'above_site' | 'remote';

export interface ActiveWorkContext {
  type: WorkContextType;
  facilityId?: string;
  facilityName?: string;
  facilityType?: string;
  levelOfCare?: string;
  contextLabel?: string;
  isPic?: boolean;
  isOwner?: boolean;
  privileges?: string[];
  // Above-site specific
  aboveSiteRoleId?: string;
  aboveSiteContextType?: string;
  jurisdiction?: {
    province?: string;
    district?: string;
    programme?: string;
  };
  // Metadata
  selectedAt: string;
  sessionId?: string;
}

const STORAGE_KEY = 'activeWorkContext';

interface UseActiveWorkContextReturn {
  activeContext: ActiveWorkContext | null;
  hasActiveContext: boolean;
  selectFacility: (facility: ProviderFacility) => void;
  selectAboveSite: (
    roleId: string,
    contextType: string,
    contextLabel: string,
    jurisdiction?: { province?: string; district?: string; programme?: string }
  ) => void;
  selectRemote: () => void;
  clearContext: () => void;
  switchContext: () => void;
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
      }));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem('activeWorkspace');
    }
  }, [activeContext]);

  const selectFacility = useCallback((facility: ProviderFacility) => {
    const context: ActiveWorkContext = {
      type: 'facility',
      facilityId: facility.facility_id,
      facilityName: facility.facility_name,
      facilityType: facility.facility_type,
      levelOfCare: facility.level_of_care,
      contextLabel: facility.context_label,
      isPic: facility.is_pic,
      isOwner: facility.is_owner,
      privileges: facility.privileges,
      selectedAt: new Date().toISOString(),
    };
    setActiveContext(context);
  }, []);

  const selectAboveSite = useCallback((
    roleId: string,
    contextType: string,
    contextLabel: string,
    jurisdiction?: { province?: string; district?: string; programme?: string }
  ) => {
    const context: ActiveWorkContext = {
      type: 'above_site',
      aboveSiteRoleId: roleId,
      aboveSiteContextType: contextType,
      contextLabel,
      jurisdiction,
      selectedAt: new Date().toISOString(),
    };
    setActiveContext(context);
  }, []);

  const selectRemote = useCallback(() => {
    const context: ActiveWorkContext = {
      type: 'remote',
      contextLabel: 'Remote Work',
      selectedAt: new Date().toISOString(),
    };
    setActiveContext(context);
  }, []);

  const clearContext = useCallback(() => {
    setActiveContext(null);
  }, []);

  const switchContext = useCallback(() => {
    // Clear context to show selection hub again
    setActiveContext(null);
  }, []);

  return {
    activeContext,
    hasActiveContext: activeContext !== null,
    selectFacility,
    selectAboveSite,
    selectRemote,
    clearContext,
    switchContext,
  };
}
