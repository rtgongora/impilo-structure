import React, { createContext, useContext, useState, ReactNode } from "react";

export type WorkspaceView = "personal" | "department" | "team";

interface WorkspaceContextType {
  currentView: WorkspaceView;
  setCurrentView: (view: WorkspaceView) => void;
  currentDepartment: string;
  setCurrentDepartment: (dept: string) => void;
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

  return (
    <WorkspaceContext.Provider value={{ 
      currentView, 
      setCurrentView, 
      currentDepartment, 
      setCurrentDepartment 
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}
