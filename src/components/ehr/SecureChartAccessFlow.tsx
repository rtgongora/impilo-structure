/**
 * Secure Chart Access Flow
 * 
 * Orchestrates the complete flow from queue selection to chart opening:
 * 1. Patient selection in queue (PII masked)
 * 2. Authorization dialog with identity verification
 * 3. Audit logging and context establishment
 * 4. Secure navigation to patient chart
 * 
 * Standards:
 * - IHE CCOW Context Synchronization
 * - HIPAA Access Controls (45 CFR 164.312)
 * - Joint Commission NPSG.01.01.01 (Patient Identification)
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChartAccessDialog } from "./ChartAccessDialog";
import { 
  ChartAccessReason, 
  PatientContextSource,
} from "@/types/patientContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PendingChartAccess {
  patientId: string;
  encounterId: string;
  patientName: string;
  patientMrn: string;
  patientDob: string;
  source: PatientContextSource;
}

export function useSecureChartAccess() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingAccess, setPendingAccess] = useState<PendingChartAccess | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  // Initiate chart access - shows authorization dialog
  const initiateChartAccess = useCallback((
    pending: PendingChartAccess
  ) => {
    setPendingAccess(pending);
  }, []);

  // Cancel pending access
  const cancelChartAccess = useCallback(() => {
    setPendingAccess(null);
  }, []);

  // Complete authorization and navigate
  const authorizeAndOpen = useCallback(async (
    reason: ChartAccessReason,
    justification?: string
  ) => {
    if (!pendingAccess) return;

    setIsAuthorizing(true);

    try {
      // Log the access attempt for audit
      await supabase.from("audit_logs").insert({
        entity_type: "patient_chart",
        entity_id: pendingAccess.encounterId,
        action: "chart_access_authorized",
        performed_by: user?.id || "unknown",
        metadata: {
          patient_id: pendingAccess.patientId,
          access_reason: reason,
          justification: justification,
          source: pendingAccess.source,
          authorized_at: new Date().toISOString(),
        },
      });

      // Navigate with authorization context
      navigate(
        `/encounter/${pendingAccess.encounterId}?source=${pendingAccess.source}&reason=${reason}`
      );

      toast.success("Chart access authorized", {
        description: `Opening record for ${pendingAccess.patientName}`,
      });

      setPendingAccess(null);
    } catch (error) {
      console.error("Error authorizing chart access:", error);
      toast.error("Failed to authorize access");
    } finally {
      setIsAuthorizing(false);
    }
  }, [pendingAccess, user, navigate]);

  // Quick access from queue (pre-authorized for queue source)
  const quickAccessFromQueue = useCallback(async (
    encounterId: string,
    patientId: string
  ) => {
    try {
      // Log queue-based access
      await supabase.from("audit_logs").insert({
        entity_type: "patient_chart",
        entity_id: encounterId,
        action: "chart_access_queue",
        performed_by: user?.id || "unknown",
        metadata: {
          patient_id: patientId,
          access_reason: "queue_assignment",
          source: "queue",
          authorized_at: new Date().toISOString(),
        },
      });

      // Navigate directly - queue access is pre-authorized
      navigate(`/encounter/${encounterId}?source=queue&reason=queue_assignment`);
    } catch (error) {
      console.error("Error logging queue access:", error);
      // Navigate anyway, audit is best-effort
      navigate(`/encounter/${encounterId}?source=queue`);
    }
  }, [user, navigate]);

  return {
    pendingAccess,
    isAuthorizing,
    initiateChartAccess,
    cancelChartAccess,
    authorizeAndOpen,
    quickAccessFromQueue,
  };
}

// Component wrapper for the authorization dialog
interface SecureChartAccessFlowProps {
  pendingAccess: PendingChartAccess | null;
  isAuthorizing: boolean;
  onAuthorize: (reason: ChartAccessReason, justification?: string) => void;
  onCancel: () => void;
}

export function SecureChartAccessFlow({
  pendingAccess,
  isAuthorizing,
  onAuthorize,
  onCancel,
}: SecureChartAccessFlowProps) {
  if (!pendingAccess) return null;

  return (
    <ChartAccessDialog
      open={true}
      onOpenChange={(open) => !open && onCancel()}
      patientName={pendingAccess.patientName}
      patientMrn={pendingAccess.patientMrn}
      patientDob={pendingAccess.patientDob}
      onConfirmAccess={onAuthorize}
      onCancel={onCancel}
      isLoading={isAuthorizing}
    />
  );
}
