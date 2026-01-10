import { useState } from "react";
import {
  Send,
  Save,
  ArrowLeft,
  FileText,
  Stethoscope,
  Pill,
  FlaskConical,
  Activity,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { 
  ReferralPackage, 
  ConsultationResponse,
  DispositionType,
  FollowUpType,
} from "@/types/telehealth";

interface ConsultationResponseBuilderProps {
  referral: ReferralPackage;
  initialResponse?: ConsultationResponse;
  onSubmit: (response: ConsultationResponse) => void;
  onSaveDraft?: (response: Partial<ConsultationResponse>) => void;
  onBack?: () => void;
}

const DISPOSITION_OPTIONS: { value: DispositionType; label: string; description: string }[] = [
  { value: "continue_at_referring", label: "Continue at Referring Facility", description: "Patient continues care at Facility A" },
  { value: "joint_management", label: "Joint Management", description: "Shared care between facilities" },
  { value: "transfer", label: "Transfer Required", description: "Patient needs physical transfer" },
  { value: "refer_elsewhere", label: "Refer to Another Level", description: "Needs referral to different facility" },
];

const FOLLOW_UP_OPTIONS: { value: FollowUpType; label: string }[] = [
  { value: "tele_follow_up", label: "Teleconsult Follow-up" },
  { value: "in_person", label: "In-Person Follow-up" },
  { value: "none", label: "No Follow-up Required" },
];

export function ConsultationResponseBuilder({
  referral,
  initialResponse,
  onSubmit,
  onSaveDraft,
  onBack,
}: ConsultationResponseBuilderProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["clinical", "plan", "disposition"]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Response state
  const [response, setResponse] = useState<Partial<ConsultationResponse>>({
    referralId: referral.id,
    modeUsed: initialResponse?.modeUsed || "async",
    responseNote: initialResponse?.responseNote || {
      assessment: "",
      clinicalInterpretation: "",
      workingDiagnosis: "",
      diagnosisCodes: [],
      responseToQuestions: "",
      keyFindings: "",
      impressions: "",
    },
    plan: initialResponse?.plan || {
      treatmentPlan: "",
      medications: [],
      investigations: [],
      procedures: [],
      monitoringRequirements: "",
    },
    disposition: initialResponse?.disposition || {
      type: "continue_at_referring",
      instructions: "",
    },
    followUp: initialResponse?.followUp || {
      type: "tele_follow_up",
      when: "",
      instructions: "",
      responsibleFacility: referral.context.referringFacilityName,
    },
    orders: initialResponse?.orders || {
      medications: [],
      labs: [],
      imaging: [],
      procedures: [],
    },
    status: "draft",
  });

  // Order entry state
  const [newMedication, setNewMedication] = useState({ name: "", dose: "", frequency: "", duration: "" });
  const [newInvestigation, setNewInvestigation] = useState({ type: "", name: "", instructions: "" });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const updateResponseNote = (field: string, value: string) => {
    setResponse((prev) => ({
      ...prev,
      responseNote: {
        ...prev.responseNote!,
        [field]: value,
      },
    }));
  };

  const updatePlan = (field: string, value: string) => {
    setResponse((prev) => ({
      ...prev,
      plan: {
        ...prev.plan!,
        [field]: value,
      },
    }));
  };

  const addMedication = () => {
    if (!newMedication.name) return;
    setResponse((prev) => ({
      ...prev,
      plan: {
        ...prev.plan!,
        medications: [...prev.plan!.medications, newMedication],
      },
    }));
    setNewMedication({ name: "", dose: "", frequency: "", duration: "" });
  };

  const removeMedication = (index: number) => {
    setResponse((prev) => ({
      ...prev,
      plan: {
        ...prev.plan!,
        medications: prev.plan!.medications.filter((_, i) => i !== index),
      },
    }));
  };

  const addInvestigation = () => {
    if (!newInvestigation.name) return;
    setResponse((prev) => ({
      ...prev,
      plan: {
        ...prev.plan!,
        investigations: [...prev.plan!.investigations, newInvestigation],
      },
    }));
    setNewInvestigation({ type: "", name: "", instructions: "" });
  };

  const handleSaveDraft = () => {
    onSaveDraft?.(response);
    setLastSaved(new Date());
    toast.success("Draft saved");
  };

  const handleSubmit = () => {
    const fullResponse: ConsultationResponse = {
      referralId: referral.id,
      consultationId: `CONSULT-${Date.now()}`,
      consultantProviderId: "current-user",
      consultantFacilityId: "current-facility",
      modeUsed: response.modeUsed || "async",
      responseNote: response.responseNote!,
      plan: response.plan!,
      disposition: response.disposition!,
      followUp: response.followUp!,
      orders: response.orders!,
      documentation: {
        communicationLogRef: `LOG-${Date.now()}`,
        attachmentsUsed: [],
      },
      status: "submitted",
      timestamps: {
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
    };
    onSubmit(fullResponse);
    toast.success("Consultation response submitted");
  };

  const isComplete =
    response.responseNote?.assessment &&
    response.responseNote?.clinicalInterpretation &&
    response.plan?.treatmentPlan &&
    response.disposition?.type;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h2 className="font-semibold">Consultation Response</h2>
              <p className="text-sm text-muted-foreground">
                Referral #{referral.referralNumber} • {referral.context.referringFacilityName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                Saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={handleSubmit} disabled={!isComplete}>
              <Send className="h-4 w-4 mr-2" />
              Submit Response
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Referral Summary Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Referral Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">{referral.clinicalNarrative.reasonForReferral}</p>
              {referral.clinicalNarrative.specificQuestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-muted-foreground">Questions to Answer:</p>
                  <ul className="list-disc list-inside mt-1">
                    {referral.clinicalNarrative.specificQuestions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 1: Clinical Response */}
          <Collapsible open={expandedSections.includes("clinical")} onOpenChange={() => toggleSection("clinical")}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Stethoscope className="h-5 w-5" />
                      Clinical Response
                    </CardTitle>
                    {expandedSections.includes("clinical") ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Assessment *</Label>
                    <Textarea
                      value={response.responseNote?.assessment || ""}
                      onChange={(e) => updateResponseNote("assessment", e.target.value)}
                      placeholder="Your overall assessment of the case..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Clinical Interpretation *</Label>
                    <Textarea
                      value={response.responseNote?.clinicalInterpretation || ""}
                      onChange={(e) => updateResponseNote("clinicalInterpretation", e.target.value)}
                      placeholder="Your interpretation of the clinical findings..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Working/Final Diagnosis *</Label>
                      <Input
                        value={response.responseNote?.workingDiagnosis || ""}
                        onChange={(e) => updateResponseNote("workingDiagnosis", e.target.value)}
                        placeholder="Diagnosis"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ICD-10 Code</Label>
                      <Input
                        placeholder="e.g., I10"
                        onChange={(e) => {
                          const codes = e.target.value ? [{ code: e.target.value, description: response.responseNote?.workingDiagnosis || "" }] : [];
                          setResponse((prev) => ({
                            ...prev,
                            responseNote: { ...prev.responseNote!, diagnosisCodes: codes },
                          }));
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Response to Referrer's Questions</Label>
                    <Textarea
                      value={response.responseNote?.responseToQuestions || ""}
                      onChange={(e) => updateResponseNote("responseToQuestions", e.target.value)}
                      placeholder="Address the specific clinical questions asked..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Key Findings</Label>
                    <Textarea
                      value={response.responseNote?.keyFindings || ""}
                      onChange={(e) => updateResponseNote("keyFindings", e.target.value)}
                      placeholder="Important findings from your review..."
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 2: Treatment Plan */}
          <Collapsible open={expandedSections.includes("plan")} onOpenChange={() => toggleSection("plan")}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Treatment Plan & Orders
                    </CardTitle>
                    {expandedSections.includes("plan") ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Treatment Plan *</Label>
                    <Textarea
                      value={response.plan?.treatmentPlan || ""}
                      onChange={(e) => updatePlan("treatmentPlan", e.target.value)}
                      placeholder="Recommended management plan..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <Separator />

                  {/* Medications */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Pill className="h-4 w-4" />
                      Medications
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      <Input
                        placeholder="Medication"
                        value={newMedication.name}
                        onChange={(e) => setNewMedication((prev) => ({ ...prev, name: e.target.value }))}
                      />
                      <Input
                        placeholder="Dose"
                        value={newMedication.dose}
                        onChange={(e) => setNewMedication((prev) => ({ ...prev, dose: e.target.value }))}
                      />
                      <Input
                        placeholder="Frequency"
                        value={newMedication.frequency}
                        onChange={(e) => setNewMedication((prev) => ({ ...prev, frequency: e.target.value }))}
                      />
                      <Button onClick={addMedication}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {response.plan?.medications && response.plan.medications.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {response.plan.medications.map((m, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                            <span>{m.name} - {m.dose} - {m.frequency}</span>
                            <Button variant="ghost" size="icon" onClick={() => removeMedication(i)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Investigations */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FlaskConical className="h-4 w-4" />
                      Investigations
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      <Select
                        value={newInvestigation.type}
                        onValueChange={(v) => setNewInvestigation((prev) => ({ ...prev, type: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lab">Lab</SelectItem>
                          <SelectItem value="imaging">Imaging</SelectItem>
                          <SelectItem value="procedure">Procedure</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Name"
                        value={newInvestigation.name}
                        onChange={(e) => setNewInvestigation((prev) => ({ ...prev, name: e.target.value }))}
                      />
                      <Input
                        placeholder="Instructions"
                        value={newInvestigation.instructions}
                        onChange={(e) => setNewInvestigation((prev) => ({ ...prev, instructions: e.target.value }))}
                      />
                      <Button onClick={addInvestigation}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Monitoring Requirements</Label>
                    <Textarea
                      value={response.plan?.monitoringRequirements || ""}
                      onChange={(e) => updatePlan("monitoringRequirements", e.target.value)}
                      placeholder="Parameters to monitor, frequency, alert thresholds..."
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 3: Disposition & Follow-up */}
          <Collapsible open={expandedSections.includes("disposition")} onOpenChange={() => toggleSection("disposition")}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Disposition & Follow-up
                    </CardTitle>
                    {expandedSections.includes("disposition") ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Disposition *</Label>
                    <RadioGroup
                      value={response.disposition?.type}
                      onValueChange={(v) => setResponse((prev) => ({
                        ...prev,
                        disposition: { ...prev.disposition!, type: v as DispositionType },
                      }))}
                      className="grid grid-cols-2 gap-3"
                    >
                      {DISPOSITION_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-start space-x-2 p-3 border rounded-lg">
                          <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                          <Label htmlFor={option.value} className="cursor-pointer flex-1">
                            <p className="font-medium">{option.label}</p>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Disposition Instructions</Label>
                    <Textarea
                      value={response.disposition?.instructions || ""}
                      onChange={(e) => setResponse((prev) => ({
                        ...prev,
                        disposition: { ...prev.disposition!, instructions: e.target.value },
                      }))}
                      placeholder="Additional instructions for the disposition..."
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Follow-up</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Follow-up Type</Label>
                        <Select
                          value={response.followUp?.type}
                          onValueChange={(v) => setResponse((prev) => ({
                            ...prev,
                            followUp: { ...prev.followUp!, type: v as FollowUpType },
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {FOLLOW_UP_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Timeframe</Label>
                        <Select
                          value={response.followUp?.when || ""}
                          onValueChange={(v) => setResponse((prev) => ({
                            ...prev,
                            followUp: { ...prev.followUp!, when: v },
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="When?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="24h">Within 24 hours</SelectItem>
                            <SelectItem value="48h">Within 48 hours</SelectItem>
                            <SelectItem value="1w">Within 1 week</SelectItem>
                            <SelectItem value="2w">Within 2 weeks</SelectItem>
                            <SelectItem value="1m">Within 1 month</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Follow-up Instructions</Label>
                      <Textarea
                        value={response.followUp?.instructions || ""}
                        onChange={(e) => setResponse((prev) => ({
                          ...prev,
                          followUp: { ...prev.followUp!, instructions: e.target.value },
                        }))}
                        placeholder="Specific follow-up instructions for the referring team..."
                      />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Validation Summary */}
          <Card className={cn(
            "border-2",
            isComplete ? "border-success bg-success/5" : "border-warning bg-warning/5"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                {isComplete ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="font-medium text-success">Response is complete and ready to submit</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    <span className="font-medium text-warning">Please complete all required fields</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
