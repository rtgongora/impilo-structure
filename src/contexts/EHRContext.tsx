import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  EncounterMenuItem,
  TopBarAction,
  CriticalEventData,
  CriticalEventType,
  WorkspaceData,
  Encounter,
  MOCK_ENCOUNTER,
} from "@/types/ehr";

interface EHRContextValue {
  // Current encounter
  currentEncounter: Encounter;
  
  // Navigation
  activeMenuItem: EncounterMenuItem;
  setActiveMenuItem: (item: EncounterMenuItem) => void;
  
  // Orders sub-menu navigation
  activeOrdersSubItem: string;
  setActiveOrdersSubItem: (subItem: string) => void;
  
  // Top bar actions
  activeTopBarAction: TopBarAction | null;
  setActiveTopBarAction: (action: TopBarAction | null) => void;
  
  // Workspaces
  activeWorkspace: WorkspaceData | null;
  openWorkspace: (type: string) => void;
  closeWorkspace: () => void;
  
  // Critical Events
  activeCriticalEvent: CriticalEventData | null;
  isCriticalEventActive: boolean;
  activateCriticalEvent: (type: CriticalEventType, trigger: string) => void;
  terminateCriticalEvent: (outcome: CriticalEventData["outcome"]) => void;
  
  // Supporting Panels
  isConsumablesOpen: boolean;
  setConsumablesOpen: (open: boolean) => void;
  isChargesOpen: boolean;
  setChargesOpen: (open: boolean) => void;
}

const EHRContext = createContext<EHRContextValue | null>(null);

export function EHRProvider({ children }: { children: ReactNode }) {
  const [currentEncounter] = useState<Encounter>(MOCK_ENCOUNTER);
  const [activeMenuItem, setActiveMenuItem] = useState<EncounterMenuItem>("overview");
  const [activeOrdersSubItem, setActiveOrdersSubItem] = useState<string>("order-entry");
  const [activeTopBarAction, setActiveTopBarAction] = useState<TopBarAction | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceData | null>(null);
  const [activeCriticalEvent, setActiveCriticalEvent] = useState<CriticalEventData | null>(null);
  const [isConsumablesOpen, setConsumablesOpen] = useState(false);
  const [isChargesOpen, setChargesOpen] = useState(false);

  const openWorkspace = useCallback((type: string) => {
    const workspace: WorkspaceData = {
      id: `WS-${Date.now()}`,
      type,
      encounterId: currentEncounter.id,
      startTime: new Date(),
      status: "active",
      phase: "start",
      initiatingUser: "Current User",
      location: currentEncounter.location,
      participatingRoles: ["Physician", "Nurse"],
    };
    setActiveWorkspace(workspace);
    setActiveTopBarAction(null);
  }, [currentEncounter]);

  const closeWorkspace = useCallback(() => {
    setActiveWorkspace(null);
  }, []);

  const activateCriticalEvent = useCallback((type: CriticalEventType, trigger: string) => {
    const event: CriticalEventData = {
      id: `CE-${Date.now()}`,
      type: type,
      eventType: type,
      encounterId: currentEncounter.id,
      startTime: new Date(),
      status: "active",
      phase: "execute",
      initiatingUser: "Current User",
      activatingUser: "Current User",
      location: currentEncounter.location,
      participatingRoles: ["Physician", "Nurse", "Emergency Team"],
      trigger,
    };
    setActiveCriticalEvent(event);
    setActiveWorkspace(null);
    setActiveTopBarAction(null);
  }, [currentEncounter]);

  const terminateCriticalEvent = useCallback((outcome: CriticalEventData["outcome"]) => {
    if (activeCriticalEvent) {
      setActiveCriticalEvent({
        ...activeCriticalEvent,
        status: "completed",
        phase: "exit",
        outcome,
        endTime: new Date(),
        terminatingUser: "Current User",
      });
      // Keep visible for summary, then clear
      setTimeout(() => setActiveCriticalEvent(null), 500);
    }
  }, [activeCriticalEvent]);

  return (
    <EHRContext.Provider
      value={{
        currentEncounter,
        activeMenuItem,
        setActiveMenuItem,
        activeOrdersSubItem,
        setActiveOrdersSubItem,
        activeTopBarAction,
        setActiveTopBarAction,
        activeWorkspace,
        openWorkspace,
        closeWorkspace,
        activeCriticalEvent,
        isCriticalEventActive: activeCriticalEvent?.status === "active",
        activateCriticalEvent,
        terminateCriticalEvent,
        isConsumablesOpen,
        setConsumablesOpen,
        isChargesOpen,
        setChargesOpen,
      }}
    >
      {children}
    </EHRContext.Provider>
  );
}

export function useEHR() {
  const context = useContext(EHRContext);
  if (!context) {
    throw new Error("useEHR must be used within an EHRProvider");
  }
  return context;
}
