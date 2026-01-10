import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  EncounterMenuItem,
  TopBarAction,
  CriticalEventData,
  CriticalEventType,
  WorkspaceData,
  Encounter,
  Patient,
} from "@/types/ehr";
import {
  PatientContext,
  ChartAccessRequest,
  ChartAccessReason,
  PatientContextSource,
} from "@/types/patientContext";
import { toast } from "sonner";

interface EHRContextValue {
  // Patient Context (secure access management)
  patientContext: PatientContext;
  hasActivePatient: boolean;
  isLoadingContext: boolean;
  contextError: string | null;
  
  // Chart Access
  openChart: (encounterId: string, source: PatientContextSource, reason?: ChartAccessReason) => Promise<void>;
  closeChart: (returnTo?: string) => void;
  requiresAccessJustification: boolean;
  
  // Current encounter (null if no patient selected)
  currentEncounter: Encounter | null;
  
  // Navigation
  activeMenuItem: EncounterMenuItem;
  setActiveMenuItem: (item: EncounterMenuItem) => void;
  
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

// Initial empty patient context
const EMPTY_PATIENT_CONTEXT: PatientContext = {
  isActive: false,
  encounterId: null,
  patientId: null,
  patientName: null,
  mrn: null,
  accessRequest: null,
  lockedAt: null,
  source: "none",
};

export function EHRProvider({ children }: { children: ReactNode }) {
  const { encounterId: urlEncounterId } = useParams<{ encounterId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Patient context state
  const [patientContext, setPatientContext] = useState<PatientContext>(EMPTY_PATIENT_CONTEXT);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  
  // Current encounter data
  const [currentEncounter, setCurrentEncounter] = useState<Encounter | null>(null);
  
  // UI state
  const [activeMenuItem, setActiveMenuItem] = useState<EncounterMenuItem>("overview");
  const [activeTopBarAction, setActiveTopBarAction] = useState<TopBarAction | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceData | null>(null);
  const [activeCriticalEvent, setActiveCriticalEvent] = useState<CriticalEventData | null>(null);
  const [isConsumablesOpen, setConsumablesOpen] = useState(false);
  const [isChargesOpen, setChargesOpen] = useState(false);

  // Determine if access justification is required based on source
  const source = searchParams.get("source") as PatientContextSource | null;
  const requiresAccessJustification = source === "search" || source === "emergency" || !source;

  // Load encounter when URL changes
  useEffect(() => {
    if (urlEncounterId && !patientContext.isActive) {
      // Check if coming from a secure source (queue, appointment, etc.)
      const accessSource = (source || "none") as PatientContextSource;
      
      // Auto-load if from queue or appointment (pre-authorized)
      if (accessSource === "queue" || accessSource === "appointment" || accessSource === "worklist") {
        loadEncounter(urlEncounterId, accessSource, "queue_assignment");
      }
      // Otherwise, context will be established via ChartAccessDialog
    }
  }, [urlEncounterId, source]);

  // Load encounter data from database
  const loadEncounter = async (
    encounterId: string,
    contextSource: PatientContextSource,
    accessReason: ChartAccessReason,
    justification?: string
  ) => {
    setIsLoadingContext(true);
    setContextError(null);

    try {
      // Fetch encounter with patient data
      const { data: encounterData, error } = await supabase
        .from("encounters")
        .select(`
          id,
          encounter_number,
          encounter_type,
          status,
          chief_complaint,
          created_at,
          patient_id,
          patients (
            id,
            first_name,
            last_name,
            date_of_birth,
            gender,
            mrn
          )
        `)
        .eq("id", encounterId)
        .maybeSingle();

      if (error) throw error;

      if (!encounterData) {
        setContextError("Encounter not found");
        return;
      }

      // Build patient object
      const patientData = encounterData.patients as any;
      const patient: Patient = {
        id: patientData?.id || encounterData.patient_id,
        name: patientData 
          ? `${patientData.first_name} ${patientData.last_name}`.trim() 
          : "Unknown Patient",
        dateOfBirth: patientData?.date_of_birth || "1990-01-01",
        gender: patientData?.gender || "other",
        mrn: patientData?.mrn || "MRN-000000",
        allergies: [], // Would fetch from allergies table
        ward: "Ward", // Would fetch from admission/location
        bed: "Bed",
      };

      // Build encounter object
      const encounter: Encounter = {
        id: encounterData.id,
        patient,
        type: mapEncounterType(encounterData.encounter_type),
        status: mapEncounterStatus(encounterData.status),
        admissionDate: new Date(encounterData.created_at),
        attendingPhysician: "Attending Provider", // Would fetch from care team
        location: "Clinical Location",
      };

      // Build access request for audit
      const accessRequest: ChartAccessRequest = {
        reason: accessReason,
        encounterId,
        patientId: patient.id,
        accessedAt: new Date(),
        accessedBy: user?.id || "unknown",
        justificationNotes: justification,
      };

      // Log chart access for audit
      await logChartAccess(accessRequest);

      // Update context
      setPatientContext({
        isActive: true,
        encounterId,
        patientId: patient.id,
        patientName: patient.name,
        mrn: patient.mrn,
        accessRequest,
        lockedAt: new Date(),
        source: contextSource,
      });

      setCurrentEncounter(encounter);
    } catch (err) {
      console.error("Error loading encounter:", err);
      setContextError("Failed to load patient chart");
    } finally {
      setIsLoadingContext(false);
    }
  };

  // Map database encounter type to UI type
  const mapEncounterType = (dbType: string | null): Encounter["type"] => {
    switch (dbType) {
      case "inpatient": return "inpatient";
      case "emergency": return "emergency";
      default: return "outpatient";
    }
  };

  // Map database status to UI status
  const mapEncounterStatus = (dbStatus: string | null): Encounter["status"] => {
    switch (dbStatus) {
      case "discharged": return "discharged";
      case "transferred": return "transferred";
      default: return "active";
    }
  };

  // Log chart access for HIPAA compliance
  const logChartAccess = async (access: ChartAccessRequest) => {
    try {
      await supabase.from("audit_logs").insert({
        entity_type: "patient_chart",
        entity_id: access.encounterId,
        action: "chart_access",
        performed_by: access.accessedBy,
        metadata: {
          patient_id: access.patientId,
          access_reason: access.reason,
          justification: access.justificationNotes,
          source: "ehr_context",
        },
      });
    } catch (err) {
      console.error("Error logging chart access:", err);
      // Don't block access for audit log failure, but this should be monitored
    }
  };

  // Open chart with proper context
  const openChart = useCallback(async (
    encounterId: string,
    source: PatientContextSource,
    reason: ChartAccessReason = "treatment"
  ) => {
    await loadEncounter(encounterId, source, reason);
    navigate(`/encounter/${encounterId}?source=${source}`);
  }, [navigate]);

  // Close chart and return to specified route
  const closeChart = useCallback((returnTo: string = "/") => {
    // Log chart close for audit
    if (patientContext.accessRequest) {
      (async () => {
        try {
          await supabase.from("audit_logs").insert({
            entity_type: "patient_chart",
            entity_id: patientContext.encounterId || "",
            action: "chart_closed",
            performed_by: user?.id || "",
            metadata: {
              duration_seconds: patientContext.lockedAt 
                ? Math.floor((Date.now() - patientContext.lockedAt.getTime()) / 1000)
                : 0,
            },
          });
        } catch (err) {
          console.error("Error logging chart close:", err);
        }
      })();
    }

    // Clear context
    setPatientContext(EMPTY_PATIENT_CONTEXT);
    setCurrentEncounter(null);
    setActiveMenuItem("overview");
    setActiveTopBarAction(null);
    setActiveWorkspace(null);
    
    navigate(returnTo);
    toast.info("Chart closed");
  }, [patientContext, user, navigate]);

  // Workspace management
  const openWorkspace = useCallback((type: string) => {
    if (!currentEncounter) return;
    
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

  // Critical event management
  const activateCriticalEvent = useCallback((type: CriticalEventType, trigger: string) => {
    if (!currentEncounter) return;
    
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
      setTimeout(() => setActiveCriticalEvent(null), 500);
    }
  }, [activeCriticalEvent]);

  return (
    <EHRContext.Provider
      value={{
        // Patient Context
        patientContext,
        hasActivePatient: patientContext.isActive && currentEncounter !== null,
        isLoadingContext,
        contextError,
        
        // Chart Access
        openChart,
        closeChart,
        requiresAccessJustification,
        
        // Current encounter
        currentEncounter,
        
        // Navigation
        activeMenuItem,
        setActiveMenuItem,
        
        // Top bar
        activeTopBarAction,
        setActiveTopBarAction,
        
        // Workspaces
        activeWorkspace,
        openWorkspace,
        closeWorkspace,
        
        // Critical events
        activeCriticalEvent,
        isCriticalEventActive: activeCriticalEvent?.status === "active",
        activateCriticalEvent,
        terminateCriticalEvent,
        
        // Supporting panels
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
