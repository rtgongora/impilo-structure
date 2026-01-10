/**
 * IncomingConsultWorkflow - Stage 4-7 for Consulting Facility (B/C)
 * Handles: Accept → Live Session → Response → Closure for incoming referrals
 * Auto-generates IPS and Visit Summary when accepting referral
 */
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  CheckCircle,
  ArrowLeft,
  AlertTriangle,
  User,
  Send,
  Video,
  MessageSquare,
  Phone,
  Users,
  Play,
  Clock,
  Shield,
  Building,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { 
  ReferralPackage, 
  ConsultationResponse, 
  TelemedicineMode,
  TelehealthWorkItem,
} from "@/types/telehealth";
import { ReferralPackageViewer } from "./ReferralPackageViewer";
import { LiveSessionWorkspace } from "./LiveSessionWorkspace";
import { ConsultationResponseBuilder } from "./ConsultationResponseBuilder";
import { usePatientSummary, useVisitSummary } from "@/hooks/useSummaries";

// Stages visible to the consulting facility
const CONSULTANT_STAGES = [
  { stage: 4, id: "review-accept", name: "Review & Accept", icon: FileText },
  { stage: 5, id: "live-session", name: "Live Session", icon: Video },
  { stage: 6, id: "response", name: "Submit Response", icon: Send },
  { stage: 7, id: "complete", name: "Complete", icon: CheckCircle },
];

type ConsultantStage = 4 | 5 | 6 | 7;

interface IncomingConsultWorkflowProps {
  workItem: TelehealthWorkItem;
  referralPackage: ReferralPackage;
  onComplete?: () => void;
  onBack?: () => void;
}

export function IncomingConsultWorkflow({
  workItem,
  referralPackage: initialReferral,
  onComplete,
  onBack,
}: IncomingConsultWorkflowProps) {
  const [currentStage, setCurrentStage] = useState<ConsultantStage>(4);
  const [referralPackage, setReferralPackage] = useState<ReferralPackage>(initialReferral);
  const [consultationResponse, setConsultationResponse] = useState<ConsultationResponse | null>(null);
  const [activeMode, setActiveMode] = useState<TelemedicineMode>(
    initialReferral.preferredMode || "async"
  );
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [summariesGenerated, setSummariesGenerated] = useState(false);

  // Auto-generate IPS and Visit Summary hooks for the patient being consulted on
  const patientId = initialReferral.patientId;
  const { 
    ips, 
    generating: generatingIPS, 
    fetchIPS,
    generateNewIPS 
  } = usePatientSummary(patientId);

  const currentStageInfo = CONSULTANT_STAGES.find(s => s.stage === currentStage)!;
  const progress = ((currentStage - 3) / 4) * 100;

  // Auto-generate/fetch patient summary when accepting the referral
  useEffect(() => {
    if (patientId && !summariesGenerated) {
      setSummariesGenerated(true);
      
      // First try to fetch existing IPS
      fetchIPS().then(() => {
        // If no IPS exists, generate one for consultation
        if (!ips) {
          generateNewIPS({ 
            trigger: 'on_demand',
            purpose: 'Telemedicine consultation',
            includeAttachments: true 
          }).then((generatedIPS) => {
            if (generatedIPS) {
              toast.success("Patient Summary generated for consultation");
            }
          });
        }
      });
    }
  }, [patientId, summariesGenerated, ips, fetchIPS, generateNewIPS]);

  // Handle accepting the referral (Stage 4 → 5)
  const handleAcceptReferral = useCallback(() => {
    setReferralPackage((prev) => ({
      ...prev,
      status: "accepted",
      timestamps: {
        ...prev.timestamps,
        acceptedAt: new Date().toISOString(),
      },
    }));
    
    // If async mode, go directly to response building
    if (activeMode === "async") {
      setCurrentStage(6);
      toast.success("Referral accepted - Ready for asynchronous review");
    } else {
      setCurrentStage(5);
      setIsSessionActive(true);
      toast.success("Referral accepted - Starting session");
    }
  }, [activeMode]);

  // Handle session end (Stage 5 → 6)
  const handleEndSession = useCallback(() => {
    setIsSessionActive(false);
    setCurrentStage(6);
  }, []);

  // Handle response submission (Stage 6 → 7)
  const handleResponseSubmit = useCallback((response: ConsultationResponse) => {
    setConsultationResponse(response);
    setReferralPackage((prev) => ({
      ...prev,
      status: "completed",
      timestamps: {
        ...prev.timestamps,
        completedAt: new Date().toISOString(),
      },
    }));
    setCurrentStage(7);
    toast.success("Consultation response submitted successfully");
  }, []);

  // Handle final completion
  const handleComplete = useCallback(() => {
    toast.success("Case closed - Response sent to referring facility");
    onComplete?.();
  }, [onComplete]);

  // Render stage content
  const renderStageContent = () => {
    switch (currentStage) {
      case 4:
        // Review & Accept
        return (
          <ReferralPackageViewer
            referral={referralPackage}
            onAccept={handleAcceptReferral}
            onReassign={() => toast.info("Reassign functionality coming soon")}
            onDecline={() => {
              toast.warning("Referral declined");
              onBack?.();
            }}
          />
        );

      case 5:
        // Live Session (all modes except async)
        return (
          <LiveSessionWorkspace
            referral={referralPackage}
            activeMode={activeMode}
            onModeChange={setActiveMode}
            onSubmitResponse={(response) => {
              setConsultationResponse(response);
              setCurrentStage(6);
            }}
            onEndSession={handleEndSession}
          />
        );

      case 6:
        // Submit Response
        return (
          <ConsultationResponseBuilder
            referral={referralPackage}
            initialResponse={consultationResponse || undefined}
            onSubmit={handleResponseSubmit}
            onBack={() => activeMode !== "async" ? setCurrentStage(5) : undefined}
          />
        );

      case 7:
        // Completion Confirmation
        return (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-success/20 mx-auto mb-6 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <CardTitle className="text-2xl mb-2">Consultation Complete</CardTitle>
              <CardDescription className="text-base mb-6">
                Your response has been submitted and will be available to the referring facility.
              </CardDescription>
              
              <div className="bg-muted/30 rounded-lg p-4 text-left max-w-md mx-auto mb-6">
                <h4 className="font-medium mb-2">Summary</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Patient:</strong> {referralPackage.patientHID}</p>
                  <p><strong>Diagnosis:</strong> {consultationResponse?.responseNote.workingDiagnosis}</p>
                  <p><strong>Disposition:</strong> {consultationResponse?.disposition.type.replace(/_/g, " ")}</p>
                  <p><strong>Follow-up:</strong> {consultationResponse?.followUp.type.replace(/_/g, " ")}</p>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={onBack}>
                  Return to Dashboard
                </Button>
                <Button onClick={handleComplete}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Close Case
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Workflow Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                Stage {currentStage}: {currentStageInfo.name}
                {isSessionActive && (
                  <Badge variant="default" className="animate-pulse">
                    <Play className="w-3 h-3 mr-1" />
                    Live
                  </Badge>
                )}
              </h2>
              <p className="text-sm text-muted-foreground">
                Incoming from {referralPackage.context.referringFacilityName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={referralPackage.urgency === "emergency" ? "destructive" : "outline"}
              className={referralPackage.urgency === "emergency" ? "animate-pulse" : ""}
            >
              {referralPackage.urgency === "emergency" && <AlertTriangle className="w-3 h-3 mr-1" />}
              {referralPackage.urgency.toUpperCase()}
            </Badge>
            <Badge variant="secondary">Consulting Facility</Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {CONSULTANT_STAGES.map((stage) => {
              const Icon = stage.icon;
              const isCompleted = stage.stage < currentStage;
              const isCurrent = stage.stage === currentStage;
              return (
                <div
                  key={stage.stage}
                  className={cn(
                    "flex flex-col items-center gap-1 text-xs transition-colors",
                    isCompleted && "text-success",
                    isCurrent && "text-primary font-medium",
                    !isCompleted && !isCurrent && "text-muted-foreground opacity-50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2",
                    isCompleted && "bg-success border-success text-success-foreground",
                    isCurrent && "bg-primary border-primary text-primary-foreground",
                    !isCompleted && !isCurrent && "border-muted-foreground/30"
                  )}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="hidden md:block max-w-[80px] text-center truncate">
                    {stage.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stage Content */}
      <div className="flex-1 overflow-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderStageContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
