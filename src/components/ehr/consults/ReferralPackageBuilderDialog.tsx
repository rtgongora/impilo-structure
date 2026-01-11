/**
 * ReferralPackageBuilderDialog - Build referral package during/after instant communication
 * Allows building a referral as follow-up to a call or chat session
 */
import { useState } from "react";
import {
  FileText,
  Send,
  Link2,
  Copy,
  CheckCircle,
  Plus,
  X,
  AlertTriangle,
  Paperclip,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useReferralPackageBuilder } from "@/hooks/useReferralPackageBuilder";
import type { TelemedicineMode, ReferralUrgency } from "@/types/telehealth";

interface ReferralPackageBuilderDialogProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  patientId: string;
  patientHID: string;
  linkedSessionId?: string;
  linkedSessionMode?: TelemedicineMode;
  onPackageSent?: (referralId: string, link: string) => void;
  onReferralCreated?: (referralId: string) => void;
  prefillContext?: {
    chiefComplaint?: string;
    discussionSummary?: string;
    urgency?: ReferralUrgency;
  };
}

export function ReferralPackageBuilderDialog({
  isOpen,
  open,
  onClose,
  onOpenChange,
  patientId,
  patientHID,
  linkedSessionId,
  linkedSessionMode,
  onPackageSent,
  onReferralCreated,
  prefillContext,
}: ReferralPackageBuilderDialogProps) {
  // Support both prop patterns
  const dialogOpen = open ?? isOpen ?? false;
  const handleClose = () => {
    onClose?.();
    onOpenChange?.(false);
  };
  const handleReferralSuccess = (referralId: string, link: string) => {
    onPackageSent?.(referralId, link);
    onReferralCreated?.(referralId);
  };
  const {
    draft,
    isSaving,
    isSending,
    completionPercent,
    isReady,
    isSent,
    updateDraft,
    addQuestion,
    removeQuestion,
    saveDraft,
    sendPackage,
    generateLink,
    prefillFromSession,
  } = useReferralPackageBuilder({
    patientId,
    patientHID,
    linkedSessionId,
    linkedSessionMode,
  });

  const [newQuestion, setNewQuestion] = useState("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Prefill on mount if context provided
  useState(() => {
    if (prefillContext) {
      prefillFromSession(prefillContext);
    }
  });

  // Add question handler
  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      addQuestion(newQuestion.trim());
      setNewQuestion("");
    }
  };

  // Generate and copy link
  const handleGenerateLink = () => {
    const link = generateLink();
    if (link) {
      setGeneratedLink(link);
    }
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(window.location.origin + generatedLink);
      setLinkCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  // Send package
  const handleSendPackage = async () => {
    const pkg = await sendPackage();
    if (pkg && generatedLink) {
      handleReferralSuccess(pkg.id, generatedLink);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Build Referral Package
          </DialogTitle>
          <DialogDescription>
            Create a referral package as follow-up to your consultation. 
            {linkedSessionMode && (
              <span className="ml-1">
                Linked to {linkedSessionMode} session.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-3 py-2">
          <Progress value={completionPercent} className="flex-1 h-2" />
          <Badge variant={completionPercent >= 80 ? "default" : "outline"}>
            {completionPercent}% Complete
          </Badge>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Patient Info */}
            <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold">P</span>
              </div>
              <div>
                <p className="font-medium">Patient: {patientHID}</p>
                <p className="text-sm text-muted-foreground">
                  Building referral from current session
                </p>
              </div>
            </div>

            {/* Chief Complaint */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Chief Complaint <span className="text-destructive">*</span>
              </Label>
              <Input
                value={draft.chiefComplaint}
                onChange={(e) => updateDraft({ chiefComplaint: e.target.value })}
                placeholder="Main presenting complaint"
              />
            </div>

            {/* History */}
            <div className="space-y-2">
              <Label>History of Present Illness</Label>
              <Textarea
                value={draft.historyOfPresentIllness}
                onChange={(e) => updateDraft({ historyOfPresentIllness: e.target.value })}
                placeholder="Detailed history, including discussion from this session..."
                className="min-h-[100px]"
              />
            </div>

            {/* Provisional Diagnosis */}
            <div className="space-y-2">
              <Label>Provisional Diagnosis</Label>
              <Input
                value={draft.provisionalDiagnosis}
                onChange={(e) => updateDraft({ provisionalDiagnosis: e.target.value })}
                placeholder="Working diagnosis"
              />
            </div>

            {/* Reason for Referral */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Reason for Referral <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={draft.reasonForReferral}
                onChange={(e) => updateDraft({ reasonForReferral: e.target.value })}
                placeholder="Why is this referral needed?"
                className="min-h-[80px]"
              />
            </div>

            <Separator />

            {/* Target Specialty & Urgency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Target Specialty <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={draft.targetSpecialty}
                  onValueChange={(v) => updateDraft({ targetSpecialty: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cardiology">Cardiology</SelectItem>
                    <SelectItem value="Oncology">Oncology</SelectItem>
                    <SelectItem value="Neurology">Neurology</SelectItem>
                    <SelectItem value="Surgery">Surgery</SelectItem>
                    <SelectItem value="Internal Medicine">Internal Medicine</SelectItem>
                    <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                    <SelectItem value="OB/GYN">OB/GYN</SelectItem>
                    <SelectItem value="Radiology">Radiology</SelectItem>
                    <SelectItem value="Pathology">Pathology</SelectItem>
                    <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Urgency</Label>
                <Select
                  value={draft.urgency}
                  onValueChange={(v) => updateDraft({ urgency: v as ReferralUrgency })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="stat">STAT</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Specific Questions */}
            <div className="space-y-2">
              <Label>Specific Questions for Consultant</Label>
              <div className="space-y-2">
                {draft.specificQuestions.map((q, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <span className="flex-1 text-sm">{q}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeQuestion(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Add a specific question..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
                />
                <Button variant="outline" onClick={handleAddQuestion}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Generated Link */}
            {generatedLink && (
              <div className="p-3 bg-success/10 border border-success/30 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-success" />
                  <span className="font-medium text-success">Referral Link Generated</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={window.location.origin + generatedLink}
                    readOnly
                    className="flex-1 text-sm"
                  />
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    {linkCopied ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link in chat or paste it to notify the consultant
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button variant="ghost" onClick={onClose} className="sm:mr-auto">
            Cancel
          </Button>
          
          <Button variant="outline" onClick={saveDraft} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save Draft
          </Button>
          
          {!generatedLink ? (
            <Button
              variant="outline"
              onClick={handleGenerateLink}
              disabled={completionPercent < 60}
            >
              <Link2 className="h-4 w-4 mr-1" />
              Generate Link
            </Button>
          ) : (
            <Button onClick={handleSendPackage} disabled={isSending}>
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Send Referral
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
