// Summary Actions Component - Quick actions for generating/viewing summaries
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  FileText,
  Shield,
  ChevronDown,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { PatientSummaryViewer } from "./PatientSummaryViewer";
import { VisitSummaryViewer } from "./VisitSummaryViewer";
import { generateIPS, generateVisitSummary } from "@/services/summaryGenerationService";
import { toast } from "sonner";

interface SummaryActionsProps {
  patientId: string;
  patientName?: string;
  healthId?: string;
  encounterId?: string;
  compact?: boolean;
}

export function SummaryActions({
  patientId,
  patientName,
  healthId,
  encounterId,
  compact = false,
}: SummaryActionsProps) {
  const [showIPSViewer, setShowIPSViewer] = useState(false);
  const [showVisitViewer, setShowVisitViewer] = useState(false);
  const [generatingIPS, setGeneratingIPS] = useState(false);
  const [generatingVisit, setGeneratingVisit] = useState(false);

  const handleGenerateEmergencyIPS = async () => {
    setGeneratingIPS(true);
    try {
      const result = await generateIPS(patientId, {
        trigger: 'emergency',
        accessLevel: 'emergency',
        purpose: 'Emergency access - immediate care required',
      });
      if (result) {
        toast.success('Emergency IPS generated');
        setShowIPSViewer(true);
      }
    } catch (error) {
      toast.error('Failed to generate emergency IPS');
    } finally {
      setGeneratingIPS(false);
    }
  };

  const handleGenerateReferralIPS = async () => {
    setGeneratingIPS(true);
    try {
      const result = await generateIPS(patientId, {
        trigger: 'referral',
        accessLevel: 'full',
        purpose: 'Referral to another provider',
      });
      if (result) {
        toast.success('IPS generated for referral');
        setShowIPSViewer(true);
      }
    } catch (error) {
      toast.error('Failed to generate IPS');
    } finally {
      setGeneratingIPS(false);
    }
  };

  const handleGenerateVisitSummary = async () => {
    if (!encounterId) {
      toast.error('No active encounter');
      return;
    }
    setGeneratingVisit(true);
    try {
      const result = await generateVisitSummary(encounterId, {
        includeProviderDetails: true,
        patientFriendly: true,
      });
      if (result) {
        toast.success('Visit Summary generated');
        setShowVisitViewer(true);
      }
    } catch (error) {
      toast.error('Failed to generate Visit Summary');
    } finally {
      setGeneratingVisit(false);
    }
  };

  if (compact) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Summaries
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Patient Summary (IPS)</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setShowIPSViewer(true)}>
              <Shield className="h-4 w-4 mr-2" />
              View Patient Summary
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleGenerateReferralIPS} disabled={generatingIPS}>
              {generatingIPS ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Generate for Referral
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleGenerateEmergencyIPS} disabled={generatingIPS}>
              <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
              Emergency IPS
            </DropdownMenuItem>
            
            {encounterId && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Visit Summary</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setShowVisitViewer(true)}>
                  <FileText className="h-4 w-4 mr-2" />
                  View Visit Summary
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleGenerateVisitSummary} disabled={generatingVisit}>
                  {generatingVisit ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Generate Visit Summary
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={showIPSViewer} onOpenChange={setShowIPSViewer}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <PatientSummaryViewer
              patientId={patientId}
              patientName={patientName}
              healthId={healthId}
              onClose={() => setShowIPSViewer(false)}
            />
          </DialogContent>
        </Dialog>

        {encounterId && (
          <Dialog open={showVisitViewer} onOpenChange={setShowVisitViewer}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <VisitSummaryViewer
                encounterId={encounterId}
                patientName={patientName}
                onClose={() => setShowVisitViewer(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setShowIPSViewer(true)}>
          <Shield className="h-4 w-4 mr-2" />
          Patient Summary (IPS)
        </Button>
        {encounterId && (
          <Button variant="outline" onClick={() => setShowVisitViewer(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Visit Summary
          </Button>
        )}
      </div>

      <Dialog open={showIPSViewer} onOpenChange={setShowIPSViewer}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <PatientSummaryViewer
            patientId={patientId}
            patientName={patientName}
            healthId={healthId}
            onClose={() => setShowIPSViewer(false)}
          />
        </DialogContent>
      </Dialog>

      {encounterId && (
        <Dialog open={showVisitViewer} onOpenChange={setShowVisitViewer}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <VisitSummaryViewer
              encounterId={encounterId}
              patientName={patientName}
              onClose={() => setShowVisitViewer(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
