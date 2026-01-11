import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Route,
  Clock,
  Video,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  User,
  Building,
  Send,
  Phone,
  MessageSquare,
  Users,
  Play,
  Pause,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { 
  ReferralPackage, 
  ConsultationResponse, 
  TelemedicineMode,
  TelehealthWorkItem,
} from "@/types/telehealth";

// Import sub-components
import { ReferralBuilder } from "./ReferralBuilder";
import { ReferralPackageViewer } from "./ReferralPackageViewer";
import { LiveSessionWorkspace } from "./LiveSessionWorkspace";
import { ConsultationResponseBuilder } from "./ConsultationResponseBuilder";
import { CompletionNoteForm } from "./CompletionNote";
import { TelemedicineModeSelection } from "./TelemedicineModeSelection";
import { InstantCallOverlay } from "./InstantCallOverlay";
import { TeleconsultStatusTracker } from "./TeleconsultStatusTracker";
import { useTeleconsultSession, type TeleconsultStatus, type TeleconsultSessionData } from "@/hooks/useTeleconsultSession";
import type { ReferralUrgency } from "@/types/telehealth";

// 7 Stage Workflow Definition
export const TELEMEDICINE_STAGES = [
  { 
    stage: 1, 
    id: "case-identified",
    name: "Case Identified", 
    description: "Clinical trigger recognized, teleconsult initiated",
    icon: AlertTriangle,
    actor: "referrer",
  },
  { 
    stage: 2, 
    id: "build-package",
    name: "Build Referral Package", 
    description: "Compose clinical narrative, attach data, set routing",
    icon: FileText,
    actor: "referrer",
  },
  { 
    stage: 3, 
    id: "routing",
    name: "Routing & Worklists", 
    description: "Referral travels to appropriate queue",
    icon: Route,
    actor: "system",
  },
  { 
    stage: 4, 
    id: "review-accept",
    name: "Review & Accept", 
    description: "Receiver reviews package and takes responsibility",
    icon: User,
    actor: "consultant",
  },
  { 
    stage: 5, 
    id: "live-session",
    name: "Live Teleconsult", 
    description: "Chat, audio, video or board session",
    icon: Video,
    actor: "both",
  },
  { 
    stage: 6, 
    id: "response",
    name: "Submit Response", 
    description: "Consultant submits structured response package",
    icon: Send,
    actor: "consultant",
  },
  { 
    stage: 7, 
    id: "completion",
    name: "Completion & Closure", 
    description: "Referrer documents actions taken and closes loop",
    icon: CheckCircle,
    actor: "referrer",
  },
];

type WorkflowRole = "referrer" | "consultant";
type WorkflowStage = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface TelemedicineWorkflowProps {
  role: WorkflowRole;
  initialStage?: WorkflowStage;
  workItem?: TelehealthWorkItem;
  referralPackage?: ReferralPackage;
  patientId?: string;
  patientName?: string;
  onComplete?: () => void;
  onBack?: () => void;
}

export function TelemedicineWorkflow({
  role,
  initialStage = 1,
  workItem,
  referralPackage: existingReferral,
  patientId,
  patientName,
  onComplete,
  onBack,
}: TelemedicineWorkflowProps) {
  const [currentStage, setCurrentStage] = useState<WorkflowStage>(initialStage);
  const [referralPackage, setReferralPackage] = useState<ReferralPackage | null>(existingReferral || null);
  const [consultationResponse, setConsultationResponse] = useState<ConsultationResponse | null>(null);
  const [activeMode, setActiveMode] = useState<TelemedicineMode>("async");
  const [isSessionActive, setIsSessionActive] = useState(false);
  
  // Stage 1 mode selection state
  const [selectedModes, setSelectedModes] = useState<TelemedicineMode[]>([]);
  const [preferredMode, setPreferredMode] = useState<TelemedicineMode | null>(null);
  const [urgency, setUrgency] = useState<ReferralUrgency>("routine");
  const [scheduledAt, setScheduledAt] = useState<string | undefined>();
  
  // Instant call state
  const [showCallOverlay, setShowCallOverlay] = useState(false);
  const [callStatus, setCallStatus] = useState<TeleconsultStatus>("pending");
  
  // Session tracking hook
  const {
    session: teleconsultSession,
    isRinging,
    ringingTimeLeft,
    createSession,
    acceptSession,
    declineSession,
    cancelSession,
    startSession,
  } = useTeleconsultSession({
    onStatusChange: (status, session) => {
      setCallStatus(status);
      if (status === "accepted") {
        setShowCallOverlay(false);
        setCurrentStage(5);
        setIsSessionActive(true);
      }
    },
    onCallAnswered: () => {
      setShowCallOverlay(false);
      setCurrentStage(5);
      setIsSessionActive(true);
      toast.success("Call connected!");
    },
    onCallDeclined: () => {
      setCallStatus("declined");
    },
    onCallMissed: () => {
      setCallStatus("missed");
    },
  });

  const currentStageInfo = TELEMEDICINE_STAGES.find(s => s.stage === currentStage)!;
  const progress = (currentStage / 7) * 100;

  // Stage navigation
  const advanceStage = useCallback(() => {
    if (currentStage < 7) {
      setCurrentStage((prev) => (prev + 1) as WorkflowStage);
      toast.success(`Advanced to Stage ${currentStage + 1}: ${TELEMEDICINE_STAGES[currentStage].name}`);
    }
  }, [currentStage]);

  const goToStage = useCallback((stage: WorkflowStage) => {
    setCurrentStage(stage);
  }, []);

  // Handle referral submission (Stage 2 → 3)
  const handleReferralSubmit = async (pkg: any) => {
    // Convert the builder output to our ReferralPackage type
    const fullPackage: ReferralPackage = {
      id: `REF-${Date.now()}`,
      referralNumber: `REF-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      patientId: patientId || "",
      patientHID: "PHID-ZW-PENDING",
      clinicalNarrative: {
        chiefComplaint: pkg.presentingProblems?.[0] || "",
        historyOfPresentIllness: pkg.letterContent || "",
        pastMedicalHistory: "",
        provisionalDiagnosis: "",
        interventionsDone: "",
        reasonForReferral: pkg.clinicalQuestion || "",
        specificQuestions: pkg.presentingProblems || [],
      },
      supportingData: {
        problemList: pkg.presentingProblems || [],
        currentMedications: [],
        allergies: [],
        vitals: [],
        labResults: [],
        imaging: [],
        attachments: pkg.attachments || [],
      },
      context: {
        referringFacilityId: "current-facility",
        referringFacilityName: "Current Facility",
        referringProviderId: "current-user",
        referringProviderName: "Current User",
        targetType: pkg.routingType || "practitioner",
        targetId: pkg.routingTarget || "",
        targetName: pkg.routingTargetName || "",
        specialty: "",
      },
      urgency: pkg.urgency || "routine",
      requestedModes: pkg.requestedModes || ["async"],
      preferredMode: pkg.preferredMode || "async",
      consent: {
        status: pkg.consentObtained ? "obtained" : "pending",
        type: pkg.consentType || "digital",
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
    toast.success("Referral package sent successfully");

    // Create a backend session so Stage 4 can show live status updates.
    const targetType = (() => {
      switch (pkg.routingType) {
        case "practitioner":
          return "provider" as const;
        case "facility-service":
        case "workspace":
          return "facility" as const;
        case "pool":
          return "pool" as const;
        case "on-call":
          return "on_call" as const;
        default:
          return "provider" as const;
      }
    })();

    await createSession({
      patientId: patientId || "",
      mode: (pkg.preferredMode || "async"),
      urgency: (pkg.urgency || "routine"),
      targetType,
      targetId: pkg.routingTarget || "",
      targetName: pkg.routingTargetName || "",
      reasonForConsult: pkg.clinicalQuestion || pkg.letterContent || "Teleconsult request",
      clinicalQuestions: pkg.presentingProblems || [],
      scheduledAt: pkg.scheduledAt,
      isInstant: false,
    });

    // Routing delay then advance
    setTimeout(() => {
      setCurrentStage(4);
    }, 1500);
  };

  // Handle accepting referral (Stage 4 → 5)
  const handleAcceptReferral = () => {
    if (referralPackage) {
      setReferralPackage({
        ...referralPackage,
        status: "accepted",
        timestamps: {
          ...referralPackage.timestamps,
          acceptedAt: new Date().toISOString(),
        },
      });
    }
    advanceStage();
    setIsSessionActive(true);
  };

  // Handle response submission (Stage 5/6 → 7)
  const handleResponseSubmit = (response: ConsultationResponse) => {
    setConsultationResponse(response);
    setIsSessionActive(false);
    setCurrentStage(7);
    toast.success("Consultation response submitted");
  };

  // Handle completion (Stage 7 → Done)
  const handleCompletionSubmit = (note: any) => {
    toast.success("Case closed successfully");
    onComplete?.();
  };

  // Render stage-specific content
  const renderStageContent = () => {
    switch (currentStage) {
      case 1:
        // Case Identified - Mode Selection Entry Point
        const handleStartInstantSession = async (mode: TelemedicineMode) => {
          // Create an auto-generated minimal referral package for instant sessions
          const instantReferral: ReferralPackage = {
            id: `INSTANT-${Date.now()}`,
            referralNumber: `INST-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            patientId: patientId || "",
            patientHID: "PHID-ZW-PENDING",
            clinicalNarrative: {
              chiefComplaint: "Instant teleconsultation requested",
              historyOfPresentIllness: "",
              pastMedicalHistory: "",
              provisionalDiagnosis: "",
              interventionsDone: "",
              reasonForReferral: `Instant ${mode} session initiated`,
              specificQuestions: [],
            },
            supportingData: {
              problemList: [],
              currentMedications: [],
              allergies: [],
              vitals: [],
              labResults: [],
              imaging: [],
              attachments: [],
            },
            context: {
              referringFacilityId: "current-facility",
              referringFacilityName: "Current Facility",
              referringProviderId: "current-user",
              referringProviderName: "Current User",
              targetType: "provider",
              targetId: "",
              targetName: "On-Call Specialist",
              specialty: "",
            },
            urgency: "urgent",
            requestedModes: [mode],
            preferredMode: mode,
            consent: {
              status: "pending",
              type: "verbal",
              timestamp: new Date().toISOString(),
              obtainedBy: "current-user",
            },
            status: "pending",
            timestamps: {
              createdAt: new Date().toISOString(),
              sentAt: new Date().toISOString(),
            },
          };
          
          setReferralPackage(instantReferral);
          setActiveMode(mode);
          setSelectedModes([mode]);
          setPreferredMode(mode);
          setCallStatus("ringing");
          setShowCallOverlay(true);
          
          // Create a database session for tracking
          await createSession({
            patientId: patientId || "",
            mode,
            urgency: "urgent",
            targetType: "provider",
            targetId: "on-call",
            targetName: "On-Call Specialist",
            reasonForConsult: `Instant ${mode} consultation`,
            isInstant: true,
          });
        };

        const handleContinueToReferral = () => {
          if (selectedModes.length === 0) {
            toast.error("Please select at least one consultation mode");
            return;
          }
          if (!preferredMode) {
            toast.error("Please select a preferred mode");
            return;
          }
          setCurrentStage(2);
        };

        return (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <Card>
              <CardHeader className="text-center pb-4">
                <Video className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle>Start Teleconsultation</CardTitle>
                <CardDescription>
                  {patientName 
                    ? `Initiate a teleconsult for ${patientName}`
                    : "Select consultation mode and initiate teleconsultation"
                  }
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Quick Start - Instant Sessions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Quick Connect (Instant Session)
                </CardTitle>
                <CardDescription>
                  Start an immediate session - referral package will be created automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-24 flex-col gap-2 hover:border-primary hover:bg-primary/5"
                    onClick={() => handleStartInstantSession("video")}
                  >
                    <Video className="w-8 h-8 text-primary" />
                    <span className="font-medium">Video Call</span>
                    <span className="text-xs text-muted-foreground">Face-to-face</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex-col gap-2 hover:border-primary hover:bg-primary/5"
                    onClick={() => handleStartInstantSession("audio")}
                  >
                    <Phone className="w-8 h-8 text-green-600" />
                    <span className="font-medium">Audio Call</span>
                    <span className="text-xs text-muted-foreground">Voice only</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex-col gap-2 hover:border-primary hover:bg-primary/5"
                    onClick={() => handleStartInstantSession("chat")}
                  >
                    <MessageSquare className="w-8 h-8 text-blue-600" />
                    <span className="font-medium">Chat / IM</span>
                    <span className="text-xs text-muted-foreground">Text messaging</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Full Referral Mode Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Scheduled Consultation (Full Referral)
                </CardTitle>
                <CardDescription>
                  Build a complete referral package with multiple consultation options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <TelemedicineModeSelection
                  urgency={urgency}
                  selectedModes={selectedModes}
                  preferredMode={preferredMode}
                  onModesChange={setSelectedModes}
                  onPreferredModeChange={setPreferredMode}
                  scheduledAt={scheduledAt}
                  onScheduleChange={setScheduledAt}
                />
                
                <Separator className="my-4" />
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {selectedModes.length === 0 
                      ? "Select at least one mode above"
                      : `${selectedModes.length} mode(s) selected, preferred: ${preferredMode || "none"}`
                    }
                  </div>
                  <Button 
                    onClick={handleContinueToReferral}
                    disabled={selectedModes.length === 0 || !preferredMode}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Build Referral Package
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        // Build Referral Package
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
              <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-6" />
              <CardTitle className="mb-2">Routing Referral</CardTitle>
              <CardDescription>
                Finding the right specialist or team...
              </CardDescription>
              <div className="mt-6 text-sm text-muted-foreground">
                <p>Target: {referralPackage?.context.targetName}</p>
                <p>Urgency: {referralPackage?.urgency}</p>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        // Review & Accept - ROLE-SPECIFIC VIEWS
        if (role === "consultant" && referralPackage) {
          // CONSULTANT VIEW: Review and accept/decline the referral
          return (
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Role Alert */}
              <Alert className="border-primary/50 bg-primary/5">
                <User className="h-4 w-4" />
                <AlertTitle className="flex items-center gap-2">
                  <Badge variant="default">Consulting Practitioner</Badge>
                  Referral Awaiting Your Review
                </AlertTitle>
                <AlertDescription>
                  You are the receiving consultant. Review the referral package below and accept responsibility for this case, reassign to a colleague, or decline with a reason.
                </AlertDescription>
              </Alert>
              
              <ReferralPackageViewer
                referral={referralPackage}
                onAccept={handleAcceptReferral}
                onReassign={() => toast.info("Reassign functionality")}
                onDecline={() => {
                  toast.error("Referral declined");
                  onBack?.();
                }}
              />
            </div>
          );
        }
        
        // REFERRER VIEW: Waiting for consultant to accept
        return (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Role Alert */}
            <Alert className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
              <Building className="h-4 w-4" />
              <AlertTitle className="flex items-center gap-2">
                <Badge variant="secondary">Referring Practitioner</Badge>
                Awaiting Consultant Response
              </AlertTitle>
              <AlertDescription>
                Your referral has been routed. The consulting practitioner will review and accept the case.
              </AlertDescription>
            </Alert>
            
            {/* Status Tracker */}
            {teleconsultSession && (
              <TeleconsultStatusTracker
                session={teleconsultSession}
                userRole="referrer"
                onRetry={() => setCurrentStage(1)}
              />
            )}
            
            {/* Fallback if no session */}
            {!teleconsultSession && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-6 animate-pulse" />
                  <CardTitle className="mb-2">Awaiting Acceptance</CardTitle>
                  <CardDescription>
                    Your referral has been sent to {referralPackage?.context.targetName}
                  </CardDescription>
                  <Badge className="mt-4" variant="secondary">
                    {referralPackage?.urgency.toUpperCase()}
                  </Badge>
                  <div className="mt-6 text-sm text-muted-foreground">
                    <p>You will be notified when the consultant accepts the referral.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 5:
        // Live Teleconsult Session
        if (referralPackage) {
          return (
            <LiveSessionWorkspace
              referral={referralPackage}
              activeMode={activeMode}
              onModeChange={setActiveMode}
              onSubmitResponse={(response) => {
                setConsultationResponse(response);
                setCurrentStage(6);
              }}
              onEndSession={() => setCurrentStage(6)}
            />
          );
        }
        return null;

      case 6:
        // Submit Response (Consultant)
        if (role === "consultant" && referralPackage) {
          return (
            <ConsultationResponseBuilder
              referral={referralPackage}
              initialResponse={consultationResponse || undefined}
              onSubmit={handleResponseSubmit}
              onBack={() => setCurrentStage(5)}
            />
          );
        }
        // Referrer waiting for response
        return (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 text-primary mx-auto mb-6" />
              <CardTitle className="mb-2">Consultation In Progress</CardTitle>
              <CardDescription>
                The specialist is reviewing your case and preparing a response.
              </CardDescription>
            </CardContent>
          </Card>
        );

      case 7:
        // Completion Note (Referrer)
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
    <>
      {/* Instant Call Overlay */}
      {showCallOverlay && (
        <InstantCallOverlay
          mode={activeMode}
          status={callStatus}
          isOutgoing={role === "referrer"}
          caller={{
            id: "current-user",
            name: "Current User",
            role: "Referring Clinician",
            facility: "Current Facility",
          }}
          callee={{
            id: "consultant",
            name: referralPackage?.context.targetName || "On-Call Specialist",
            role: "Consultant",
          }}
          patientName={patientName}
          ringingTimeLeft={ringingTimeLeft}
          maxRingingTime={60}
          onAnswer={() => {
            acceptSession(teleconsultSession?.id || "");
          }}
          onDecline={() => {
            declineSession(teleconsultSession?.id || "");
            setShowCallOverlay(false);
          }}
          onCancel={() => {
            cancelSession(teleconsultSession?.id || "");
            setShowCallOverlay(false);
          }}
          onClose={() => setShowCallOverlay(false)}
        />
      )}
      
    <div className="h-full flex flex-col">
      {/* Workflow Progress Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {onBack && currentStage > 1 && (
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
              <p className="text-sm text-muted-foreground">{currentStageInfo.description}</p>
            </div>
          </div>
          <Badge variant="outline">
            {role === "referrer" ? "Referring Facility" : "Consulting Facility"}
          </Badge>
        </div>

        {/* Stage Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {TELEMEDICINE_STAGES.map((stage) => {
              const Icon = stage.icon;
              const isCompleted = stage.stage < currentStage;
              const isCurrent = stage.stage === currentStage;
              return (
                <button
                  key={stage.stage}
                  onClick={() => stage.stage <= currentStage && goToStage(stage.stage as WorkflowStage)}
                  className={cn(
                    "flex flex-col items-center gap-1 text-xs transition-colors",
                    isCompleted && "text-success cursor-pointer",
                    isCurrent && "text-primary font-medium",
                    !isCompleted && !isCurrent && "text-muted-foreground opacity-50"
                  )}
                  disabled={stage.stage > currentStage}
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
                </button>
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
    </>
  );
}
