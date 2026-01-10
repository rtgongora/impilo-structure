import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { EHRProvider, useEHR } from "@/contexts/EHRContext";
import { ProviderContextProvider } from "@/contexts/ProviderContext";
import { EHRLayout } from "@/components/layout/EHRLayout";
import { NoPatientSelected } from "@/components/ehr/NoPatientSelected";
import { ChartAccessDialog } from "@/components/ehr/ChartAccessDialog";
import { Button } from "@/components/ui/button";
import { Loader2, Home, ArrowLeft, Users } from "lucide-react";
import { ChartAccessReason, PatientContextSource } from "@/types/patientContext";

function EncounterContent() {
  const { encounterId } = useParams<{ encounterId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    hasActivePatient, 
    isLoadingContext, 
    contextError,
    requiresAccessJustification,
    openChart,
    patientContext,
  } = useEHR();

  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [pendingAccess, setPendingAccess] = useState<{
    encounterId: string;
    patientName: string;
    patientMrn: string;
    patientDob: string;
  } | null>(null);

  // Get source from URL params
  const source = searchParams.get("source") as PatientContextSource | null;
  const isPreAuthorized = source === "queue" || source === "appointment" || source === "worklist";

  // No encounter ID provided - show patient selection screen
  if (!encounterId) {
    return <NoPatientSelected />;
  }

  // Loading state
  if (isLoadingContext) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading patient chart...</p>
        </div>
      </div>
    );
  }

  // Error state with navigation options
  if (contextError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <span className="text-destructive text-2xl">!</span>
          </div>
          <h2 className="text-xl font-semibold">Unable to Load Chart</h2>
          <p className="text-muted-foreground">{contextError}</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button variant="outline" onClick={() => navigate("/queue")}>
              <Users className="h-4 w-4 mr-2" />
              Queue
            </Button>
            <Button onClick={() => navigate("/")}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Has active patient context - show EHR
  if (hasActivePatient) {
    return <EHRLayout />;
  }

  // Encounter ID present but no context yet
  // If pre-authorized source, context should load automatically via EHRContext
  // If not pre-authorized, would show access dialog (not implemented for mock)
  
  // For now, show the no patient selected screen which guides to proper flow
  return <NoPatientSelected />;
}

const Encounter = () => {
  return (
    <ProviderContextProvider>
      <EHRProvider>
        <EncounterContent />
      </EHRProvider>
    </ProviderContextProvider>
  );
};

export default Encounter;
