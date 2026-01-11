/**
 * AsyncReviewSession - Asynchronous case review with save/pause/resume functionality
 * Allows practitioners to review cases, save progress, and return later
 */
import { useState, useCallback } from "react";
import {
  Save,
  Pause,
  Play,
  CheckCircle,
  Clock,
  FileText,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTeleconsultSessionDraft, type SessionDraftData } from "@/hooks/useTeleconsultSessionDraft";
import type { ReferralPackage, ConsultationResponse, DispositionType, FollowUpType } from "@/types/telehealth";
import { ReferralPackageViewer } from "./ReferralPackageViewer";

interface AsyncReviewSessionProps {
  sessionId: string;
  referral: ReferralPackage;
  onComplete: (response: ConsultationResponse) => void;
  onBack: () => void;
  onConvertToLive?: () => void;
}

export function AsyncReviewSession({
  sessionId,
  referral,
  onComplete,
  onBack,
  onConvertToLive,
}: AsyncReviewSessionProps) {
  // Session draft management
  const {
    draft,
    draftData,
    isLoading,
    isSaving,
    isDirty,
    lastSavedAt,
    updateDraftData,
    saveDraft,
    pauseSession,
    resumeSession,
    completeSession,
    isPaused,
  } = useTeleconsultSessionDraft({
    sessionId,
    referralId: referral.id,
    patientId: referral.patientId,
    autoSaveInterval: 30000, // Auto-save every 30 seconds
  });

  // UI state
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [pauseReason, setPauseReason] = useState("");
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  // Calculate completion percentage
  const calculateCompletion = (): number => {
    if (!draftData?.responseNote) return 0;
    
    let filled = 0;
    const total = 5; // Required fields count
    
    if (draftData.responseNote.clinicalInterpretation) filled++;
    if (draftData.responseNote.workingDiagnosis) filled++;
    if (draftData.plan?.treatmentPlan) filled++;
    if (draftData.disposition?.instructions) filled++;
    if (draftData.followUp?.instructions) filled++;
    
    return Math.round((filled / total) * 100);
  };

  const completionPercent = calculateCompletion();

  // Handle pause
  const handlePause = async () => {
    if (pauseReason.trim()) {
      await pauseSession(pauseReason);
      setShowPauseDialog(false);
      setPauseReason("");
      onBack();
    } else {
      toast.error("Please provide a reason for pausing");
    }
  };

  // Handle resume
  const handleResume = async () => {
    await resumeSession();
  };

  // Handle complete review
  const handleCompleteReview = async () => {
    if (completionPercent < 60) {
      toast.error("Please complete at least 60% of the required fields before marking as complete");
      return;
    }

    const success = await completeSession();
    if (success) {
      setShowCompleteDialog(false);
      
      // Build final response
      const response: ConsultationResponse = {
        referralId: referral.id,
        consultationId: draft?.id || '',
        consultantProviderId: draft?.providerId || '',
        consultantFacilityId: '',
        modeUsed: 'async',
        responseNote: {
          assessment: draftData?.responseNote?.assessment || '',
          clinicalInterpretation: draftData?.responseNote?.clinicalInterpretation || '',
          workingDiagnosis: draftData?.responseNote?.workingDiagnosis || '',
          diagnosisCodes: draftData?.responseNote?.diagnosisCodes || [],
          responseToQuestions: draftData?.responseNote?.responseToQuestions || '',
          keyFindings: draftData?.responseNote?.keyFindings || '',
          impressions: draftData?.responseNote?.impressions || '',
        },
        plan: {
          treatmentPlan: draftData?.plan?.treatmentPlan || '',
          medications: draftData?.plan?.medications || [],
          investigations: draftData?.plan?.investigations || [],
          procedures: draftData?.plan?.procedures || [],
          monitoringRequirements: draftData?.plan?.monitoringRequirements || '',
        },
        disposition: {
          type: (draftData?.disposition?.type as DispositionType) || 'continue_at_referring',
          instructions: draftData?.disposition?.instructions || '',
        },
        followUp: {
          type: (draftData?.followUp?.type as FollowUpType) || 'none',
          when: draftData?.followUp?.when || '',
          instructions: draftData?.followUp?.instructions || '',
          responsibleFacility: draftData?.followUp?.responsibleFacility || '',
          responsibleProvider: draftData?.followUp?.responsibleProvider || '',
        },
        orders: draftData?.orders || {
          medications: [],
          labs: [],
          imaging: [],
          procedures: [],
        },
        documentation: {
          communicationLogRef: draftData?.documentation?.communicationLogRef || '',
          sessionDuration: draftData?.documentation?.sessionDuration || 0,
          attachmentsUsed: draftData?.documentation?.attachmentsUsed || [],
          boardParticipants: draftData?.documentation?.boardParticipants || [],
        },
        status: 'submitted',
        timestamps: {
          startedAt: draft?.createdAt || new Date().toISOString(),
          completedAt: new Date().toISOString(),
        },
      };

      onComplete(response);
    }
  };

  // Handle quick save
  const handleQuickSave = async () => {
    await saveDraft();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading session...</span>
      </div>
    );
  }

  // Paused state - show resume prompt
  if (isPaused) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-warning">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-full bg-warning/20 mx-auto mb-4 flex items-center justify-center">
              <Pause className="h-8 w-8 text-warning" />
            </div>
            <CardTitle>Session Paused</CardTitle>
            <CardDescription>
              This review was paused. You can resume where you left off.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p><strong>Patient:</strong> {referral.patientHID}</p>
              <p><strong>Last saved:</strong> {lastSavedAt ? format(lastSavedAt, "PPpp") : 'Never'}</p>
              <p><strong>Progress:</strong> {completionPercent}% complete</p>
              {draft?.pauseReason && (
                <p><strong>Pause reason:</strong> {draft.pauseReason}</p>
              )}
            </div>

            <Progress value={completionPercent} className="h-2" />

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={onBack} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
              <Button onClick={handleResume} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Resume Review
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with session status and actions */}
      <div className="border-b p-3 flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h3 className="font-semibold">Asynchronous Case Review</h3>
            <p className="text-xs text-muted-foreground">
              Patient: {referral.patientHID} • {referral.context.specialty}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto-save indicator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : lastSavedAt ? (
              <>
                <CheckCircle className="h-4 w-4 text-success" />
                Saved {format(lastSavedAt, "HH:mm")}
              </>
            ) : null}
            {isDirty && !isSaving && (
              <Badge variant="outline" className="text-warning border-warning">
                Unsaved changes
              </Badge>
            )}
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            <Progress value={completionPercent} className="w-24 h-2" />
            <span className="text-sm font-medium">{completionPercent}%</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickSave}
              disabled={isSaving || !isDirty}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPauseDialog(true)}
            >
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
            {onConvertToLive && (
              <Button
                variant="outline"
                size="sm"
                onClick={onConvertToLive}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Go Live
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setShowCompleteDialog(true)}
              disabled={completionPercent < 60}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Mark Complete
            </Button>
          </div>
        </div>
      </div>

      {/* Main content - split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane - Referral Package */}
        <div className="w-1/2 border-r flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Referral Package
            </h4>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4">
              <ReferralPackageViewer referral={referral} readOnly={true} />
            </div>
          </ScrollArea>
        </div>

        {/* Right Pane - Response Form */}
        <div className="w-1/2 flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Consultation Response
            </h4>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Clinical Interpretation */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Clinical Interpretation
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={draftData?.responseNote?.clinicalInterpretation || ''}
                  onChange={(e) => updateDraftData({
                    responseNote: {
                      ...draftData?.responseNote!,
                      clinicalInterpretation: e.target.value,
                    }
                  })}
                  placeholder="Your clinical interpretation of the case..."
                  className="min-h-[120px]"
                />
              </div>

              {/* Diagnosis */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Working/Final Diagnosis
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={draftData?.responseNote?.workingDiagnosis || ''}
                    onChange={(e) => updateDraftData({
                      responseNote: {
                        ...draftData?.responseNote!,
                        workingDiagnosis: e.target.value,
                      }
                    })}
                    placeholder="Diagnosis"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ICD-10 Code</Label>
                  <Input
                    value={draftData?.responseNote?.diagnosisCodes?.[0]?.code || ''}
                    onChange={(e) => updateDraftData({
                      responseNote: {
                        ...draftData?.responseNote!,
                        diagnosisCodes: [{ code: e.target.value, description: '' }],
                      }
                    })}
                    placeholder="e.g., I10"
                  />
                </div>
              </div>

              {/* Response to Questions */}
              <div className="space-y-2">
                <Label>Response to Referrer's Questions</Label>
                <Textarea
                  value={draftData?.responseNote?.responseToQuestions || ''}
                  onChange={(e) => updateDraftData({
                    responseNote: {
                      ...draftData?.responseNote!,
                      responseToQuestions: e.target.value,
                    }
                  })}
                  placeholder="Address the specific clinical questions asked..."
                />
              </div>

              {/* Treatment Plan */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Treatment Plan
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={draftData?.plan?.treatmentPlan || ''}
                  onChange={(e) => updateDraftData({
                    plan: {
                      ...draftData?.plan!,
                      treatmentPlan: e.target.value,
                    }
                  })}
                  placeholder="Recommended management plan..."
                  className="min-h-[100px]"
                />
              </div>

              <Separator />

              {/* Disposition */}
              <div className="space-y-4">
                <h4 className="font-medium">Disposition</h4>
                <div className="space-y-2">
                  <Label>Disposition Type</Label>
                  <Select
                    value={draftData?.disposition?.type || 'continue_at_referring'}
                    onValueChange={(v) => updateDraftData({
                      disposition: {
                        ...draftData?.disposition!,
                        type: v,
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="continue_at_referring">Continue at Referring</SelectItem>
                      <SelectItem value="joint_management">Joint Management</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="refer_elsewhere">Refer Elsewhere</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Disposition Instructions
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    value={draftData?.disposition?.instructions || ''}
                    onChange={(e) => updateDraftData({
                      disposition: {
                        ...draftData?.disposition!,
                        instructions: e.target.value,
                      }
                    })}
                    placeholder="Key instructions for referring provider..."
                  />
                </div>
              </div>

              <Separator />

              {/* Follow-up */}
              <div className="space-y-4">
                <h4 className="font-medium">Follow-Up Instructions</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>When</Label>
                    <Select
                      value={draftData?.followUp?.when || ''}
                      onValueChange={(v) => updateDraftData({
                        followUp: {
                          ...draftData?.followUp!,
                          when: v,
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">Within 24 hours</SelectItem>
                        <SelectItem value="48h">Within 48 hours</SelectItem>
                        <SelectItem value="1w">Within 1 week</SelectItem>
                        <SelectItem value="2w">Within 2 weeks</SelectItem>
                        <SelectItem value="1m">Within 1 month</SelectItem>
                        <SelectItem value="prn">As needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Follow-up Type</Label>
                    <Select
                      value={draftData?.followUp?.type || 'none'}
                      onValueChange={(v) => updateDraftData({
                        followUp: {
                          ...draftData?.followUp!,
                          type: v,
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tele_follow_up">Teleconsult Review</SelectItem>
                        <SelectItem value="in_person">In-person Visit</SelectItem>
                        <SelectItem value="none">None Required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Instructions
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    value={draftData?.followUp?.instructions || ''}
                    onChange={(e) => updateDraftData({
                      followUp: {
                        ...draftData?.followUp!,
                        instructions: e.target.value,
                      }
                    })}
                    placeholder="Specific follow-up instructions..."
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Pause Dialog */}
      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pause className="h-5 w-5" />
              Pause Review Session
            </DialogTitle>
            <DialogDescription>
              Your progress will be saved automatically. You can resume this review later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for pausing (required)</Label>
              <Textarea
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="e.g., Called to emergency, Need additional information..."
              />
            </div>
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Session will be saved</AlertTitle>
              <AlertDescription>
                Your current progress ({completionPercent}%) will be preserved. 
                You can resume from where you left off at any time.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPauseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePause} disabled={!pauseReason.trim()}>
              <Pause className="h-4 w-4 mr-2" />
              Pause & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Complete Review
            </DialogTitle>
            <DialogDescription>
              Mark this review as complete and proceed to submit your response.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <p><strong>Patient:</strong> {referral.patientHID}</p>
              <p><strong>Diagnosis:</strong> {draftData?.responseNote?.workingDiagnosis || 'Not specified'}</p>
              <p><strong>Disposition:</strong> {draftData?.disposition?.type?.replace(/_/g, ' ') || 'Not specified'}</p>
              <p><strong>Completion:</strong> {completionPercent}%</p>
            </div>
            {completionPercent < 100 && (
              <Alert variant="default">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Some fields are incomplete</AlertTitle>
                <AlertDescription>
                  You can still submit, but consider completing all required fields for a comprehensive response.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Continue Editing
            </Button>
            <Button onClick={handleCompleteReview}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete & Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
