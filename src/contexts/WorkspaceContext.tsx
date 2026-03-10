import React, { createContext, useContext, useState, ReactNode } from "react";

export type WorkspaceView = "personal" | "department" | "team";
export type CareSetting = "inpatient" | "outpatient" | "emergency" | "all";

// Page context determines what sidebar navigation to show
export type PageContext = 
  | "clinical"        // Clinical EHR, patient encounters
  | "operations"      // Stock, consumables, billing
  | "scheduling"      // Appointments, theatre scheduling
  | "registry"        // HIE registries (HPR, Facility, Client)
  | "admin"           // System administration
  | "portal"          // Patient portal, social hub
  | "public-health"   // Public health & local authority ops
  | "coverage"        // Coverage, financing & payer ops
  | "ai"              // Intelligence, automation & AI
  | "omnichannel"     // Experience, omnichannel access
  | "home";           // Dashboard, module home

// Department to care setting mapping
const DEPARTMENT_CARE_SETTINGS: Record<string, CareSetting> = {
  // Inpatient departments
  "Medical Ward": "inpatient",
  "Surgical Ward": "inpatient",
  "ICU": "inpatient",
  "Pediatrics Ward": "inpatient",
  "Maternity Ward": "inpatient",
  "Oncology Ward": "inpatient",
  // Outpatient departments
  "General OPD": "outpatient",
  "Dermatology": "outpatient",
  "ENT": "outpatient",
  "Ophthalmology": "outpatient",
  "Dental": "outpatient",
  "Cardiology Clinic": "outpatient",
  // Emergency
  "Emergency": "emergency",
  "Casualty": "emergency",
  "Trauma": "emergency",
  // Mixed/All
  "Pharmacy": "all",
  "Laboratory": "all",
  "Radiology": "all",
};

export function getCareSetting(department: string): CareSetting {
  return DEPARTMENT_CARE_SETTINGS[department] || "all";
}

interface WorkspaceContextType {
  currentView: WorkspaceView;
  setCurrentView: (view: WorkspaceView) => void;
  currentDepartment: string;
  setCurrentDepartment: (dept: string) => void;
  careSetting: CareSetting;
  setCareSetting: (setting: CareSetting) => void;
  isInpatientContext: boolean;
  isOutpatientContext: boolean;
  isEmergencyContext: boolean;
  // Page context for sidebar navigation
  pageContext: PageContext;
  setPageContext: (context: PageContext) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return context;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<WorkspaceView>("personal");
  const [currentDepartment, setCurrentDepartment] = useState("Emergency");
  const [careSetting, setCareSetting] = useState<CareSetting>(() => 
    getCareSetting("Emergency")
  );
  const [pageContext, setPageContext] = useState<PageContext>("home");

  // Update care setting when department changes
  const handleSetDepartment = (dept: string) => {
    setCurrentDepartment(dept);
    setCareSetting(getCareSetting(dept));
  };

  const isInpatientContext = careSetting === "inpatient" || careSetting === "all";
  const isOutpatientContext = careSetting === "outpatient" || careSetting === "all";
  const isEmergencyContext = careSetting === "emergency" || careSetting === "all";

  return (
    <WorkspaceContext.Provider value={{ 
      currentView, 
      setCurrentView, 
      currentDepartment, 
      setCurrentDepartment: handleSetDepartment,
      careSetting,
      setCareSetting,
      isInpatientContext,
      isOutpatientContext,
      isEmergencyContext,
      pageContext,
      setPageContext,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}
