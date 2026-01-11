/**
 * IncomingConsultWorkflow - Complete workflow for consulting facility
 * Enforces: Review Referral Package → Accept/Decline/Route → Session → Response
 * Integrates Trust Layer for secure EHR access
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
  ExternalLink,
  RotateCcw,
  XCircle,
  ArrowRight,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { usePatientSummary } from "@/hooks/useSummaries";
import { useTelemedicineTrustLayer, type EHRAccessScope } from "@/hooks/useTelemedicineTrustLayer";
import { useTelemedicineRoles } from "@/hooks/useTelemedicineRoles";

// Workflow stages for the consulting facility
const CONSULTANT_STAGES = [
  { stage: 1, id: "review", name: "Review Package", icon: FileText, description: "Review referral details" },
  { stage: 2, id: "decision", name: "Accept/Route", icon: CheckCircle, description: "Make triage decision" },
  { stage: 3, id: "session", name: "Consultation", icon: Video, description: "Live or async session" },
  { stage: 4, id: "response", name: "Submit Response", icon: Send, description: "Document findings" },
  { stage: 5, id: "complete", name: "Complete", icon: CheckCircle, description: "Case closed" },
];

type ConsultantStage = 1 | 2 | 3 | 4 | 5;
type TriageDecision = 'accept' | 'decline' | 'route' | null;

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
  // Stage management
  const [currentStage, setCurrentStage] = useState<ConsultantStage>(1);
  const [referralPackage, setReferralPackage] = useState<ReferralPackage>(initialReferral);
  const [consultationResponse, setConsultationResponse] = useState<ConsultationResponse | null>(null);
  const [activeMode, setActiveMode] = useState<TelemedicineMode>(
    initialReferral.preferredMode || "async"
  );
  const [isSessionActive, setIsSessionActive] = useState(false);
  
  // Triage decision state
  const [triageDecision, setTriageDecision] = useState<TriageDecision>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [routeToFacility, setRouteToFacility] = useState("");
  const [routeReason, setRouteReason] = useState("");
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  
  // EHR Access state
  const [ehrAccessRequested, setEhrAccessRequested] = useState(false);
  const [showEhrAccessDialog, setShowEhrAccessDialog] = useState(false);
  const [selectedAccessScope, setSelectedAccessScope] = useState<EHRAccessScope>('read_full');

  // Hooks
  const { permissions, primaryRole, getRoleLabel } = useTelemedicineRoles();
  const trustLayer = useTelemedicineTrustLayer(workItem.workItemId);
  const patientId = initialReferral.patientId;
  const { ips, generating: generatingIPS, generateNewIPS } = usePatientSummary(patientId);

  const currentStageInfo = CONSULTANT_STAGES.find(s => s.stage === currentStage)!;
  const progress = (currentStage / 5) * 100;

  // Check if user can proceed with clinical actions
  const canAcceptCase = permissions.canAcceptConsultations;
  const canRouteCase = permissions.canRouteConsultations;
  const canAccessEHR = permissions.canAccessPatientEHR && trustLayer.isAccessGranted;

  // Handle accepting the referral
  const handleAcceptReferral = useCallback(async () => {
    if (!canAcceptCase) {
      toast.error('You do not have permission to accept consultations');
      return;
    }

    setTriageDecision('accept');
    setReferralPackage(prev => ({
      ...prev,
      status: "accepted",
      timestamps: {
        ...prev.timestamps,
        acceptedAt: new Date().toISOString(),
      },
    }));
    
    // Move to stage 2 for EHR access setup
    setCurrentStage(2);
    toast.success("Referral accepted - Configure EHR access");
  }, [canAcceptCase]);

  // Handle declining the referral
  const handleDeclineReferral = useCallback(() => {
    if (!declineReason.trim()) {
      toast.error('Please provide a reason for declining');
      return;
    }

    setReferralPackage(prev => ({
      ...prev,
      status: "declined",
      timestamps: {
        ...prev.timestamps,
        declinedAt: new Date().toISOString(),
      },
    }));
    
    toast.warning("Referral declined - Notification sent to referring facility");
    setShowDeclineDialog(false);
    onComplete?.();
  }, [declineReason, onComplete]);

  // Handle routing to another provider/facility
  const handleRouteReferral = useCallback(() => {
    if (!routeToFacility || !routeReason.trim()) {
      toast.error('Please select a destination and provide routing reason');
      return;
    }

    setReferralPackage(prev => ({
      ...prev,
      status: "routed",
      timestamps: {
        ...prev.timestamps,
        routedAt: new Date().toISOString(),
      },
    }));
    
    toast.info(`Referral routed to ${routeToFacility}`);
    setShowRouteDialog(false);
    onComplete?.();
  }, [routeToFacility, routeReason, onComplete]);

  // Handle requesting EHR access
  const handleRequestEHRAccess = useCallback(async () => {
    if (referralPackage.consent.status !== 'obtained') {
      toast.error('Patient consent not obtained');
      return;
    }

    const token = await trustLayer.requestAccess({
      patientId,
      referralId: referralPackage.id,
      grantedToProviderId: 'current-user', // Would be actual user ID
      scope: selectedAccessScope,
      consentType: referralPackage.consent.type as any,
      durationMinutes: 180, // 3 hours default
    });

    if (token) {
      setEhrAccessRequested(true);
      setShowEhrAccessDialog(false);
      
      // If async mode, go to response building, otherwise to live session
      if (activeMode === "async") {
        setCurrentStage(4);
        toast.success("Proceeding to asynchronous review");
      } else {
        setCurrentStage(3);
        setIsSessionActive(true);
        toast.success("Starting live session");
      }
    }
  }, [patientId, referralPackage, selectedAccessScope, activeMode, trustLayer]);

  // Handle session end
  const handleEndSession = useCallback(() => {
    setIsSessionActive(false);
    setCurrentStage(4);
  }, []);

  // Handle response submission
  const handleResponseSubmit = useCallback((response: ConsultationResponse) => {
    // Add EHR actions to the response
    const ehrActions = trustLayer.getEHRActionsForResponse();
    const enrichedResponse = {
      ...response,
      documentation: {
        ...response.documentation,
        ehrActionsPerformed: ehrActions,
      },
    };
    
    setConsultationResponse(enrichedResponse);
    setReferralPackage(prev => ({
      ...prev,
      status: "completed",
      timestamps: {
        ...prev.timestamps,
        completedAt: new Date().toISOString(),
      },
    }));
    
    // Revoke EHR access
    trustLayer.revokeAccess('Consultation completed');
    
    setCurrentStage(5);
    toast.success("Consultation response submitted successfully");
  }, [trustLayer]);

  // Handle final completion
  const handleComplete = useCallback(() => {
    toast.success("Case closed - Response sent to referring facility");
    onComplete?.();
  }, [onComplete]);

  // Render stage content
  const renderStageContent = () => {
    switch (currentStage) {
      case 1:
        // Review Package - Must review before any action
        return (
          <div className="space-y-4">
            <Card className="border-primary bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium">Review Required</p>
                    <p className="text-sm text-muted-foreground">
                      You must review the referral package before accepting, declining, or routing this case.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <ReferralPackageViewer
              referral={referralPackage}
              readOnly={true}
            />
            
            {/* Action buttons at bottom */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Your Role: {getRoleLabel(primaryRole || 'clinician')}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeclineDialog(true)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                    {canRouteCase && (
                      <Button
                        variant="outline"
                        onClick={() => setShowRouteDialog(true)}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Route
                      </Button>
                    )}
                    {canAcceptCase && (
                      <Button onClick={handleAcceptReferral}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept Case
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        // EHR Access Configuration
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Configure EHR Access
                </CardTitle>
                <CardDescription>
                  Based on patient consent, you can access their health record during this consultation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Consent verification */}
                <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="font-medium text-success">
                      Patient Consent Verified
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {referralPackage.consent.type} consent obtained by {referralPackage.context.referringProviderName}
                  </p>
                </div>

                {/* Access scope selection */}
                <div className="space-y-2">
                  <Label>Access Scope</Label>
                  <Select 
                    value={selectedAccessScope} 
                    onValueChange={(v) => setSelectedAccessScope(v as EHRAccessScope)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="read_summary">Read Summary Only</SelectItem>
                      <SelectItem value="read_full">Read Full Record</SelectItem>
                      <SelectItem value="read_write">Read & Write (Orders, Notes)</SelectItem>
                      <SelectItem value="orders_only">Place Orders Only</SelectItem>
                      <SelectItem value="notes_only">Add Notes Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Session mode */}
                <div className="space-y-2">
                  <Label>Consultation Mode</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['async', 'video', 'audio', 'chat'] as TelemedicineMode[]).map((mode) => (
                      <Button
                        key={mode}
                        variant={activeMode === mode ? "default" : "outline"}
                        className="flex-col h-auto py-3"
                        onClick={() => setActiveMode(mode)}
                      >
                        {mode === 'async' && <FileText className="h-5 w-5 mb-1" />}
                        {mode === 'video' && <Video className="h-5 w-5 mb-1" />}
                        {mode === 'audio' && <Phone className="h-5 w-5 mb-1" />}
                        {mode === 'chat' && <MessageSquare className="h-5 w-5 mb-1" />}
                        <span className="text-xs capitalize">{mode}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setCurrentStage(1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Review
                  </Button>
                  <Button 
                    onClick={handleRequestEHRAccess}
                    disabled={trustLayer.isValidating}
                    className="flex-1"
                  >
                    {trustLayer.isValidating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4 mr-2" />
                    )}
                    Grant Access & Start Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        // Live Session
        return (
          <LiveSessionWorkspace
            referral={referralPackage}
            activeMode={activeMode}
            onModeChange={setActiveMode}
            onSubmitResponse={(response) => {
              setConsultationResponse(response);
              setCurrentStage(4);
            }}
            onEndSession={handleEndSession}
          />
        );

      case 4:
        // Submit Response
        return (
          <ConsultationResponseBuilder
            referral={referralPackage}
            initialResponse={consultationResponse || undefined}
            onSubmit={handleResponseSubmit}
            onBack={() => activeMode !== "async" ? setCurrentStage(3) : setCurrentStage(2)}
          />
        );

      case 5:
        // Completion
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
                {currentStageInfo.name}
                {isSessionActive && (
                  <Badge variant="default" className="animate-pulse">
                    <Play className="w-3 h-3 mr-1" />
                    Live
                  </Badge>
                )}
                {trustLayer.isAccessGranted && (
                  <Badge variant="outline" className="text-success border-success">
                    <Lock className="w-3 h-3 mr-1" />
                    EHR Access Active
                  </Badge>
                )}
              </h2>
              <p className="text-sm text-muted-foreground">
                {currentStageInfo.description} • From {referralPackage.context.referringFacilityName}
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

      {/* Decline Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Referral</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this consultation request.
              The referring facility will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for Declining</Label>
              <Textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g., Outside scope of practice, Specialist unavailable, etc."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeclineDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeclineReferral}>
              Decline Referral
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Route Dialog */}
      <Dialog open={showRouteDialog} onOpenChange={setShowRouteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Route to Another Facility</DialogTitle>
            <DialogDescription>
              Select a more appropriate facility or specialist for this case.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Route To</Label>
              <Select value={routeToFacility} onValueChange={setRouteToFacility}>
                <SelectTrigger>
                  <SelectValue placeholder="Select facility or department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cardiology-harare">Cardiology - Parirenyatwa</SelectItem>
                  <SelectItem value="neurology-harare">Neurology - Harare Central</SelectItem>
                  <SelectItem value="general-bulawayo">General Medicine - Bulawayo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Routing Reason</Label>
              <Textarea
                value={routeReason}
                onChange={(e) => setRouteReason(e.target.value)}
                placeholder="Explain why this case is being routed..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRouteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRouteReferral}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Route Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
