import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaceData, type ActiveShift, type WorkspaceTransferReason } from '@/hooks/useWorkspaceData';

interface ShiftContextType {
  // Current shift state
  activeShift: ActiveShift | null;
  isOnShift: boolean;
  shiftDuration: number; // in minutes
  
  // Loading states
  loading: boolean;
  actionLoading: boolean;
  
  // Shift actions
  startShift: (facilityId: string, workspaceId: string) => Promise<boolean>;
  endShift: (handoverNotes?: string, summary?: string) => Promise<boolean>;
  transferWorkspace: (workspaceId: string, reason: WorkspaceTransferReason, notes?: string) => Promise<boolean>;
  refreshShift: () => Promise<void>;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export function useShift() {
  const context = useContext(ShiftContext);
  if (!context) {
    throw new Error('useShift must be used within ShiftProvider');
  }
  return context;
}

export function ShiftProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { 
    activeShift, 
    shiftLoading,
    loading: dataLoading,
    startShift: doStartShift, 
    endShift: doEndShift, 
    transferWorkspace: doTransfer,
    fetchActiveShift 
  } = useWorkspaceData();

  const [shiftDuration, setShiftDuration] = useState(0);

  // Update shift duration every minute
  useEffect(() => {
    if (activeShift) {
      const updateDuration = () => {
        const started = new Date(activeShift.started_at).getTime();
        const now = Date.now();
        setShiftDuration(Math.floor((now - started) / (1000 * 60)));
      };

      updateDuration();
      const interval = setInterval(updateDuration, 60000); // Update every minute

      return () => clearInterval(interval);
    } else {
      setShiftDuration(0);
    }
  }, [activeShift]);

  const startShift = useCallback(async (facilityId: string, workspaceId: string): Promise<boolean> => {
    const result = await doStartShift(facilityId, workspaceId);
    return result !== null;
  }, [doStartShift]);

  const endShift = useCallback(async (handoverNotes?: string, summary?: string): Promise<boolean> => {
    return await doEndShift(handoverNotes, summary);
  }, [doEndShift]);

  const transferWorkspace = useCallback(async (
    workspaceId: string, 
    reason: WorkspaceTransferReason, 
    notes?: string
  ): Promise<boolean> => {
    return await doTransfer(workspaceId, reason, notes);
  }, [doTransfer]);

  const refreshShift = useCallback(async () => {
    await fetchActiveShift();
  }, [fetchActiveShift]);

  return (
    <ShiftContext.Provider value={{
      activeShift,
      isOnShift: !!activeShift,
      shiftDuration,
      loading: dataLoading,
      actionLoading: shiftLoading,
      startShift,
      endShift,
      transferWorkspace,
      refreshShift
    }}>
      {children}
    </ShiftContext.Provider>
  );
}
