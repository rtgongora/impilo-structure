/**
 * OutgoingReferralWorkflow - Stage 1-3 + 7 for Referring Facility (A)
 * Handles: Case Identified → Build Package → Routing → (wait) → Completion
 * Auto-generates IPS and Visit Summary when entering workflow
 */
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Route,
  Clock,
  CheckCircle,
  ArrowLeft,
  AlertTriangle,
  Send,
  Eye,
  MessageSquare,
  Phone,
  Video,
  Users,
  Play,
  Loader2,
  Building,
  User,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import type { 
  ReferralPackage, 
  ConsultationResponse, 
  TelemedicineMode,
  ReferralStatus,
} from "@/types/telehealth";
import { ReferralBuilder } from "./ReferralBuilder";
import { CompletionNoteForm } from "./CompletionNote";
import { LiveSessionWorkspace } from "./LiveSessionWorkspace";
import { usePatientSummary, useVisitSummary } from "@/hooks/useSummaries";

// Stages for referring facility
const REFERRER_STAGES = [
  { stage: 1, id: "case-identified", name: "Case Identified", icon: AlertTriangle },
  { stage: 2, id: "build-package", name: "Build Package", icon: FileText },
  { stage: 3, id: "routing", name: "Routing", icon: Route },
  { stage: 4, id: "awaiting", name: "Awaiting Response", icon: Clock },
  { stage: 7, id: "completion", name: "Complete & Close", icon: CheckCircle },
];

type ReferrerStage = 1 | 2 | 3 | 4 | 7;

interface OutgoingReferralWorkflowProps {
  patientId?: string;
  patientName?: string;
  patientHID?: string;
  encounterId?: string;
  existingReferral?: ReferralPackage;
  consultationResponse?: ConsultationResponse;
  onComplete?: () => void;
  onBack?: () => void;
}

export function OutgoingReferralWorkflow({
  patientId,
  patientName,
  patientHID,
  encounterId,
  existingReferral,
  consultationResponse: existingResponse,
  onComplete,
  onBack,
}: OutgoingReferralWorkflowProps) {
  // Determine initial stage based on existing data
  const getInitialStage = (): ReferrerStage => {
    if (existingResponse) return 7;
    if (existingReferral?.status === "completed") return 7;
    if (existingReferral?.status === "in_progress" || existingReferral?.status === "accepted") return 4;
    if (existingReferral) return 4;
    return 1;
  };

  const [currentStage, setCurrentStage] = useState<ReferrerStage>(getInitialStage());
  const [referralPackage, setReferralPackage] = useState<ReferralPackage | null>(existingReferral || null);
  const [consultationResponse, setConsultationResponse] = useState<ConsultationResponse | null>(existingResponse || null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [activeMode, setActiveMode] = useState<TelemedicineMode>("chat");
  const [summariesGenerated, setSummariesGenerated] = useState(false);

  // Auto-generate IPS and Visit Summary hooks
  const { 
    ips, 
    generating: generatingIPS, 
    generateNewIPS 
  } = usePatientSummary(patientId);
  
  const { 
    summary: visitSummary, 
    generating: generatingVisitSummary, 
    generateNewSummary: generateNewVisitSummary 
  } = useVisitSummary(encounterId);

  const currentStageInfo = REFERRER_STAGES.find(s => s.stage === currentStage)!;
  const progress = currentStage === 7 ? 100 : ((currentStage) / 4) * 80;

  // Auto-generate summaries when entering the workflow
  useEffect(() => {
    if (patientId && !summariesGenerated && !existingReferral) {
      setSummariesGenerated(true);
      
      // Generate IPS for the referral package
      generateNewIPS({ 
        trigger: 'referral',
        purpose: 'Telemedicine referral package',
        includeAttachments: true 
      }).then((generatedIPS) => {
        if (generatedIPS) {
          toast.success("Patient Summary generated for referral");
        }
      });

      // Generate Visit Summary if we have an encounter
      if (encounterId) {
        generateNewVisitSummary({ 
          patientFriendly: true,
          includeProviderDetails: true,
          includeAllInvestigations: true
        }).then((generatedSummary) => {
          if (generatedSummary) {
            toast.success("Visit Summary generated for referral");
          }
        });
      }
    }
  }, [patientId, encounterId, summariesGenerated, existingReferral, generateNewIPS, generateNewVisitSummary]);

  // Simulate receiving response (in production, this would be real-time via Supabase)
  useEffect(() => {
    if (currentStage === 4 && referralPackage?.status === "in_progress") {
      // Simulate consultant completing their work
      const timer = setTimeout(() => {
        // In production, this would come from real-time subscription
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentStage, referralPackage?.status]);

  // Handle referral submission (Stage 2 → 3 → 4)
  const handleReferralSubmit = useCallback((builderOutput: any) => {
    const fullPackage: ReferralPackage = {
      id: `REF-${Date.now()}`,
      referralNumber: `REF-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      patientId: patientId || "",
      patientHID: patientHID || "PHID-ZW-PENDING",
      clinicalNarrative: {
        chiefComplaint: builderOutput.presentingProblems?.[0] || "",
        historyOfPresentIllness: builderOutput.letterContent || "",
        pastMedicalHistory: "",
        provisionalDiagnosis: "",
        interventionsDone: "",
        reasonForReferral: builderOutput.clinicalQuestion || "",
        specificQuestions: builderOutput.presentingProblems || [],
      },
      supportingData: {
        problemList: builderOutput.presentingProblems || [],
        currentMedications: [],
        allergies: [],
        vitals: [],
        labResults: [],
        imaging: [],
        attachments: builderOutput.attachments || [],
      },
      context: {
        referringFacilityId: "current-facility",
        referringFacilityName: "Current Facility",
        referringProviderId: "current-user",
        referringProviderName: "Current User",
        targetType: builderOutput.routingType || "facility",
        targetId: builderOutput.routingTarget || "",
        targetName: builderOutput.routingTargetName || "Cardiology Pool",
        specialty: builderOutput.specialty || "",
      },
      urgency: builderOutput.urgency || "routine",
      requestedModes: builderOutput.requestedModes || ["async"],
      preferredMode: builderOutput.preferredMode || "async",
      consent: {
        status: builderOutput.consentObtained ? "obtained" : "pending",
        type: builderOutput.consentType || "verbal",
        timestamp: new Date().toISOString(),
        obtainedBy: "current-user",
      },
      status: "pending",
      timestamps: {
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
      },
    };
    
    setReferralPackage(fullPackage);
    setCurrentStage(3);
    toast.success("Referral package created");
    
    // Simulate routing delay
    setTimeout(() => {
      setReferralPackage(prev => prev ? { ...prev, status: "pending" } : null);
      setCurrentStage(4);
      toast.info("Referral sent to target facility");
    }, 2000);
  }, [patientId, patientHID]);

  // Handle receiving response from consultant
  const handleResponseReceived = useCallback((response: ConsultationResponse) => {
    setConsultationResponse(response);
    setReferralPackage(prev => prev ? { 
      ...prev, 
      status: "completed",
      timestamps: { ...prev.timestamps, completedAt: new Date().toISOString() }
    } : null);
    setCurrentStage(7);
    toast.success("Consultation response received");
  }, []);

  // Handle completion (Stage 7 → Done)
  const handleCompletionSubmit = useCallback((note: any) => {
    toast.success("Case documented and closed");
    onComplete?.();
  }, [onComplete]);

  // Join live session if consultant initiates one
  const handleJoinSession = useCallback(() => {
    setIsSessionActive(true);
    setActiveMode(referralPackage?.preferredMode || "video");
  }, [referralPackage?.preferredMode]);

  const renderStageContent = () => {
    switch (currentStage) {
      case 1:
        // Case Identified - Entry point
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
              <CardTitle>Start Teleconsultation Referral</CardTitle>
              <CardDescription>
                {patientName 
                  ? `Initiate a teleconsult for ${patientName}`
                  : "Initiate a teleconsultation referral"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg text-sm">
                <p className="font-medium mb-2">Before proceeding, ensure:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Patient has a valid Health ID (HID)</li>
                  <li>Clinical assessment has been documented</li>
                  <li>Patient consent for telemedicine is obtained</li>
                </ul>
              </div>
              <Button className="w-full" onClick={() => setCurrentStage(2)}>
                <FileText className="w-4 h-4 mr-2" />
                Build Referral Package
              </Button>
            </CardContent>
          </Card>
        );

      case 2:
        // Build Package
        return (
          <ReferralBuilder 
            onSubmit={handleReferralSubmit}
            onCancel={onBack}
          />
        );

      case 3:
        // Routing in progress
        return (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-12 text-center">
              <Loader2 className="w-16 h-16 text-primary mx-auto mb-6 animate-spin" />
              <CardTitle className="mb-2">Routing Referral</CardTitle>
              <CardDescription>
                Finding the appropriate specialist or team...
              </CardDescription>
              <div className="mt-6 text-sm text-muted-foreground">
                <p>Target: {referralPackage?.context.targetName}</p>
                <p>Urgency: {referralPackage?.urgency}</p>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        // Awaiting Response
        if (isSessionActive && referralPackage) {
          return (
            <LiveSessionWorkspace
              referral={referralPackage}
              activeMode={activeMode}
              onModeChange={setActiveMode}
              onSubmitResponse={() => {}}
              onEndSession={() => setIsSessionActive(false)}
            />
          );
        }
        
        return (
          <div className="max-w-2xl mx-auto space-y-4">
            <Card>
              <CardContent className="py-8 text-center">
                <Clock className="w-16 h-16 text-primary mx-auto mb-6 animate-pulse" />
                <CardTitle className="mb-2">Referral Sent</CardTitle>
                <CardDescription>
                  Your referral has been sent to {referralPackage?.context.targetName}
                </CardDescription>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Badge variant="secondary">
                    {referralPackage?.urgency.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">
                    Status: {referralPackage?.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Referral Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Referral Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Referral Number:</span>
                  <span className="font-medium">{referralPackage?.referralNumber}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Patient:</span>
                  <span className="font-medium">{referralPackage?.patientHID}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reason:</span>
                  <span className="font-medium">{referralPackage?.clinicalNarrative.reasonForReferral}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Requested Modes:</span>
                  <div className="flex gap-1">
                    {referralPackage?.requestedModes.map(mode => (
                      <Badge key={mode} variant="outline" className="text-xs">{mode}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sent:</span>
                  <span className="font-medium">
                    {referralPackage?.timestamps.sentAt && 
                      formatDistanceToNow(new Date(referralPackage.timestamps.sentAt), { addSuffix: true })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Actions while waiting */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Button>
              {referralPackage?.status === "accepted" && (
                <Button className="flex-1" onClick={handleJoinSession}>
                  <Video className="w-4 h-4 mr-2" />
                  Join Live Session
                </Button>
              )}
            </div>

            {/* Simulate response for demo */}
            <div className="text-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleResponseReceived({
                  referralId: referralPackage?.id || "",
                  consultationId: `CONSULT-${Date.now()}`,
                  consultantProviderId: "specialist-1",
                  consultantFacilityId: "facility-b",
                  modeUsed: "async",
                  responseNote: {
                    assessment: "Reviewed chest X-ray and clinical findings. Consistent with community-acquired pneumonia.",
                    clinicalInterpretation: "Right lower lobe consolidation with air bronchograms.",
                    workingDiagnosis: "Community-acquired pneumonia (CAP)",
                    diagnosisCodes: [{ code: "J18.9", description: "Pneumonia, unspecified organism" }],
                    responseToQuestions: "Antibiotic therapy should be initiated. Consider Amoxicillin-Clavulanate.",
                    keyFindings: "Consolidation RLL, elevated WCC",
                    impressions: "Moderate severity CAP, suitable for outpatient management",
                  },
                  plan: {
                    treatmentPlan: "Start Amoxicillin-Clavulanate 625mg TDS for 7 days. Hydration. Rest.",
                    medications: [{ name: "Amoxicillin-Clavulanate", dose: "625mg", frequency: "TDS", duration: "7 days" }],
                    investigations: [],
                    procedures: [],
                    monitoringRequirements: "Temperature monitoring. Return if worsening.",
                  },
                  disposition: { type: "continue_at_referring", instructions: "Continue care at referring facility" },
                  followUp: { 
                    type: "tele_follow_up", 
                    when: "5 days", 
                    instructions: "Review response to treatment",
                    responsibleFacility: "Current Facility" 
                  },
                  orders: { medications: [], labs: [], imaging: [], procedures: [] },
                  documentation: { communicationLogRef: "LOG-001", attachmentsUsed: [] },
                  status: "submitted",
                  timestamps: { startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
                })}
              >
                (Demo: Simulate Response Received)
              </Button>
            </div>
          </div>
        );

      case 7:
        // Completion
        return (
          <CompletionNoteForm
            referral={{
              id: referralPackage?.id || "",
              type: "referral-sent",
              patientName: patientName || "Unknown",
              patientAge: 0,
              patientSex: "M",
              mrn: "",
              chiefComplaint: referralPackage?.clinicalNarrative.chiefComplaint || "",
              urgency: referralPackage?.urgency || "routine",
              status: "in-progress",
              stage: "pending-completion",
              specialty: referralPackage?.context.specialty || "",
              fromClinician: referralPackage?.context.referringProviderName || "",
              fromFacility: referralPackage?.context.referringFacilityName || "",
              toTarget: referralPackage?.context.targetName || "",
              createdAt: new Date(),
              updatedAt: new Date(),
              waitingTime: 0,
            }}
            responsePackage={consultationResponse}
            onSubmit={handleCompletionSubmit}
            onCancel={onBack}
          />
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
            {onBack && currentStage !== 3 && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                {currentStageInfo.name}
                {isSessionActive && (
                  <Badge variant="default" className="animate-pulse">
                    <Play className="w-3 h-3 mr-1" />
                    Live
                  </Badge>
                )}
              </h2>
              <p className="text-sm text-muted-foreground">
                Outgoing referral {patientName ? `for ${patientName}` : ""}
              </p>
            </div>
          </div>
          <Badge variant="outline">Referring Facility</Badge>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {REFERRER_STAGES.map((stage) => {
              const Icon = stage.icon;
              const isCompleted = stage.stage < currentStage || (currentStage === 7 && stage.stage <= 7);
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
