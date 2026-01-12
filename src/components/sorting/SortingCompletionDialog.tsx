import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Stethoscope, 
  RotateCcw,
  Ticket,
  CheckCircle2
} from "lucide-react";
import { useUserRoles, ClinicalRole } from "@/hooks/useUserRoles";

interface SortingCompletionDialogProps {
  open: boolean;
  onClose: () => void;
  ticketNumber?: string;
  patientName?: string;
  queueId?: string;
  queueName?: string;
  patientId?: string;
  encounterId?: string;
  outcome: 'queued' | 'immediate';
}

// Clinical roles that can attend to patients
const CLINICAL_ROLES: ClinicalRole[] = ['doctor', 'nurse', 'specialist'];

export function SortingCompletionDialog({
  open,
  onClose,
  ticketNumber,
  patientName,
  queueId,
  queueName,
  patientId,
  encounterId,
  outcome,
}: SortingCompletionDialogProps) {
  const navigate = useNavigate();
  const { clinicalRole, isAdmin } = useUserRoles();
  const [navigating, setNavigating] = useState(false);

  // Check if user can attend to patients (clinical role)
  const canAttendPatients = 
    isAdmin || 
    (clinicalRole && CLINICAL_ROLES.includes(clinicalRole));

  // Check if user can manage queues
  const canManageQueue = 
    isAdmin || 
    clinicalRole === 'receptionist' || 
    canAttendPatients;

  const handleContinueSorting = () => {
    setNavigating(true);
    onClose();
  };

  const handleGoToQueue = () => {
    setNavigating(true);
    // Navigate to queue workstation with the specific queue selected
    if (queueId) {
      navigate(`/queue?tab=workstation&queueId=${queueId}`);
    } else {
      navigate('/queue?tab=workstation');
    }
  };

  const handleAttendPatient = () => {
    setNavigating(true);
    // If we have an encounter, go directly to it
    if (encounterId) {
      navigate(`/encounter/${encounterId}${queueId ? `?selectedQueueId=${queueId}` : ''}`);
    } else if (patientId) {
      // Otherwise create a new encounter for this patient
      navigate(`/encounter?patientId=${patientId}${queueId ? `&selectedQueueId=${queueId}` : ''}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Patient Sorted Successfully
          </DialogTitle>
          <DialogDescription>
            {outcome === 'queued' ? (
              <>
                {patientName && <span className="font-medium">{patientName}</span>}
                {patientName && ' has been '}
                {!patientName && 'Patient '}queued
                {queueName && ` to ${queueName}`}
              </>
            ) : (
              <>
                {patientName && <span className="font-medium">{patientName}</span>}
                {patientName && ' has been '}
                {!patientName && 'Patient '}routed to immediate care
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Ticket display for queued patients */}
        {outcome === 'queued' && ticketNumber && (
          <div className="flex items-center justify-center py-4">
            <div className="bg-muted rounded-lg px-6 py-4 text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-1">
                <Ticket className="h-4 w-4" />
                Ticket Number
              </div>
              <div className="text-3xl font-bold text-primary">{ticketNumber}</div>
            </div>
          </div>
        )}

        {/* Action options */}
        <div className="space-y-3 pt-2">
          {/* Continue Sorting - Always available */}
          <Button
            variant="default"
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={handleContinueSorting}
            disabled={navigating}
          >
            <RotateCcw className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Continue Sorting</div>
              <div className="text-xs text-primary-foreground/70">
                Return to sorting desk for next patient
              </div>
            </div>
          </Button>

          {/* Go to Queue - For staff who manage queues */}
          {canManageQueue && outcome === 'queued' && (
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3"
              onClick={handleGoToQueue}
              disabled={navigating}
            >
              <Users className="h-5 w-5" />
              <div className="text-left flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Manage Queue</span>
                  {queueName && (
                    <Badge variant="secondary" className="text-xs">
                      {queueName}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Go to queue workstation to call patients
                </div>
              </div>
            </Button>
          )}

          {/* Attend Patient - Only for clinical staff */}
          {canAttendPatients && (patientId || encounterId) && (
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3"
              onClick={handleAttendPatient}
              disabled={navigating}
            >
              <Stethoscope className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Attend to Patient</div>
                <div className="text-xs text-muted-foreground">
                  Start clinical encounter immediately
                </div>
              </div>
            </Button>
          )}
        </div>

        {/* Role indicator for transparency */}
        <div className="pt-2 text-center">
          <span className="text-xs text-muted-foreground">
            Options based on your role: {clinicalRole || 'Staff'}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
