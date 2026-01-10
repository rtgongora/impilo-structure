import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  User,
  Activity,
  Pill,
  AlertTriangle,
  FlaskConical,
  Image as ImageIcon,
  Clock,
  CheckCircle2,
  Send,
  Download,
  Printer,
  Eye,
  Save,
  ClipboardCheck,
  Stethoscope,
  CalendarClock,
  Building,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { 
  ReferralPackage, 
  ConsultationResponse, 
  DispositionType, 
  FollowUpType 
} from "@/types/telehealth";

interface AsynchronousReviewPaneProps {
  referral: ReferralPackage;
  onBack?: () => void;
  onSubmitResponse?: (response: ConsultationResponse) => void;
  onSaveDraft?: (response: Partial<ConsultationResponse>) => void;
  onRequestLiveSession?: () => void;
}

const DISPOSITION_OPTIONS: { value: DispositionType; label: string; description: string }[] = [
  { value: "continue_at_referring", label: "Continue at Referring Facility", description: "Patient continues care at originating facility" },
  { value: "joint_management", label: "Joint Management", description: "Shared care between both facilities" },
  { value: "transfer", label: "Transfer Required", description: "Patient needs physical transfer" },
  { value: "refer_elsewhere", label: "Refer to Another Level", description: "Needs referral to higher/different level" },
];

const FOLLOW_UP_OPTIONS: { value: FollowUpType; label: string }[] = [
  { value: "tele_follow_up", label: "Teleconsult Follow-up" },
  { value: "in_person", label: "In-Person Follow-up" },
  { value: "none", label: "No Follow-up Required" },
];

export function AsynchronousReviewPane({
  referral,
  onBack,
  onSubmitResponse,
  onSaveDraft,
  onRequestLiveSession,
}: AsynchronousReviewPaneProps) {
  const [activeTab, setActiveTab] = useState("referral");
  const [response, setResponse] = useState<Partial<ConsultationResponse>>({
    referralId: referral.id,
    modeUsed: "async",
    responseNote: {
      assessment: "",
      clinicalInterpretation: "",
      workingDiagnosis: "",
      diagnosisCodes: [],
      responseToQuestions: "",
      keyFindings: "",
      impressions: "",
    },
    plan: {
      treatmentPlan: "",
      medications: [],
      investigations: [],
      procedures: [],
      monitoringRequirements: "",
    },
    disposition: {
      type: "continue_at_referring",
      instructions: "",
    },
    followUp: {
      type: "tele_follow_up",
      when: "",
      instructions: "",
      responsibleFacility: referral.context.referringFacilityName,
    },
    status: "draft",
  });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const updateResponseNote = (field: string, value: string) => {
    setResponse(prev => ({
      ...prev,
      responseNote: {
        ...prev.responseNote!,
        [field]: value,
      },
    }));
  };

  const updatePlan = (field: string, value: string) => {
    setResponse(prev => ({
      ...prev,
      plan: {
        ...prev.plan!,
        [field]: value,
      },
    }));
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
      consultantProviderId: "", // Would come from auth context
      consultantFacilityId: "",
      modeUsed: "async",
      responseNote: response.responseNote!,
      plan: response.plan!,
      disposition: response.disposition!,
      followUp: response.followUp!,
      orders: {
        medications: [],
        labs: [],
        imaging: [],
        procedures: [],
      },
      documentation: {
        communicationLogRef: "",
        attachmentsUsed: [],
      },
      status: "submitted",
      timestamps: {
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
    };
    onSubmitResponse?.(fullResponse);
    toast.success("Consultation response submitted");
  };

  const isComplete = 
    response.responseNote?.assessment && 
    response.responseNote?.clinicalInterpretation &&
    response.plan?.treatmentPlan &&
    response.disposition?.type;

  return (
    <div className="h-full flex">
      {/* Left: Referral Package View */}
      <div className="w-1/2 border-r flex flex-col">
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h3 className="font-semibold">Referral Package</h3>
                <p className="text-sm text-muted-foreground">
                  From {referral.context.referringFacilityName}
                </p>
              </div>
            </div>
            <Badge variant={referral.urgency === "emergency" ? "destructive" : "secondary"}>
              {referral.urgency.toUpperCase()}
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-4 border-b">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="referral">
                <FileText className="h-4 w-4 mr-1" />
                Referral
              </TabsTrigger>
              <TabsTrigger value="patient">
                <User className="h-4 w-4 mr-1" />
                Patient
              </TabsTrigger>
              <TabsTrigger value="investigations">
                <FlaskConical className="h-4 w-4 mr-1" />
                Results
              </TabsTrigger>
              <TabsTrigger value="attachments">
                <ImageIcon className="h-4 w-4 mr-1" />
                Attachments
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-4">
            <TabsContent value="referral" className="m-0 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Referring Provider</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><strong>{referral.context.referringProviderName}</strong></p>
                  <p className="text-muted-foreground">{referral.context.referringFacilityName}</p>
                  <p className="text-muted-foreground">Specialty: {referral.context.specialty}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Clinical Narrative
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Chief Complaint</Label>
                    <p>{referral.clinicalNarrative.chiefComplaint || "Not provided"}</p>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-xs text-muted-foreground">History of Present Illness</Label>
                    <p>{referral.clinicalNarrative.historyOfPresentIllness || "Not provided"}</p>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-xs text-muted-foreground">Past Medical History</Label>
                    <p>{referral.clinicalNarrative.pastMedicalHistory || "Not provided"}</p>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-xs text-muted-foreground">Provisional Diagnosis</Label>
                    <p className="font-medium">{referral.clinicalNarrative.provisionalDiagnosis || "Not provided"}</p>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-xs text-muted-foreground">Interventions Done</Label>
                    <p>{referral.clinicalNarrative.interventionsDone || "None documented"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-primary">Reason for Referral</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="font-medium">{referral.clinicalNarrative.reasonForReferral}</p>
                  
                  {referral.clinicalNarrative.specificQuestions.length > 0 && (
                    <div className="mt-3">
                      <Label className="text-xs text-muted-foreground">Specific Questions</Label>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {referral.clinicalNarrative.specificQuestions.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="patient" className="m-0 space-y-4">
              {/* Allergies */}
              {referral.supportingData.allergies.length > 0 && (
                <Card className="border-warning">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-warning">
                      <AlertTriangle className="h-4 w-4" />
                      Allergies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {referral.supportingData.allergies.map((a, i) => (
                        <Badge key={i} variant="destructive">
                          {a.allergen} - {a.reaction}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Medications */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    Current Medications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {referral.supportingData.currentMedications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No medications listed</p>
                  ) : (
                    <div className="space-y-2">
                      {referral.supportingData.currentMedications.map((m, i) => (
                        <div key={i} className="text-sm">
                          <span className="font-medium">{m.name}</span>
                          <span className="text-muted-foreground"> - {m.dose} {m.frequency}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Vitals */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Latest Vitals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {referral.supportingData.vitals.map((v, i) => (
                      <div key={i} className="p-2 bg-muted/30 rounded text-sm">
                        <span className="text-muted-foreground">{v.name}: </span>
                        <span className="font-medium">{v.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Problem List */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Problem List</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {referral.supportingData.problemList.map((p, i) => (
                      <Badge key={i} variant="outline">{p}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="investigations" className="m-0 space-y-4">
              {/* Lab Results */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FlaskConical className="h-4 w-4" />
                    Lab Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {referral.supportingData.labResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No lab results attached</p>
                  ) : (
                    <div className="space-y-2">
                      {referral.supportingData.labResults.map((l, i) => (
                        <div key={i} className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                          <span>{l.test}</span>
                          <span className="font-medium">{l.result}</span>
                          <span className="text-muted-foreground">{l.date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Imaging */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Imaging Studies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {referral.supportingData.imaging.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No imaging attached</p>
                  ) : (
                    <div className="space-y-2">
                      {referral.supportingData.imaging.map((img, i) => (
                        <div key={i} className="p-2 bg-muted/30 rounded text-sm">
                          <p className="font-medium">{img.study}</p>
                          <p className="text-muted-foreground">{img.finding}</p>
                          <p className="text-xs text-muted-foreground">{img.date}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attachments" className="m-0">
              {referral.supportingData.attachments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No attachments</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {referral.supportingData.attachments.map((att, i) => (
                    <Card key={i} className="cursor-pointer hover:bg-muted/30">
                      <CardContent className="p-3 flex items-center gap-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{att.name}</p>
                          <p className="text-xs text-muted-foreground">{att.type}</p>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Action to escalate to live session */}
        <div className="p-4 border-t bg-muted/30">
          <Button variant="outline" className="w-full" onClick={onRequestLiveSession}>
            Need Live Session?
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Right: Response Form */}
      <div className="w-1/2 flex flex-col">
        <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Consultation Response</h3>
            {lastSaved && (
              <p className="text-xs text-muted-foreground">
                Last saved: {format(lastSaved, "HH:mm:ss")}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveDraft}>
              <Save className="h-4 w-4 mr-1" />
              Save Draft
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={!isComplete}>
              <Send className="h-4 w-4 mr-1" />
              Submit Response
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {/* Assessment Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Assessment *
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Clinical Interpretation</Label>
                  <Textarea
                    value={response.responseNote?.clinicalInterpretation || ""}
                    onChange={(e) => updateResponseNote("clinicalInterpretation", e.target.value)}
                    placeholder="Your interpretation of the clinical picture..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Overall Assessment</Label>
                  <Textarea
                    value={response.responseNote?.assessment || ""}
                    onChange={(e) => updateResponseNote("assessment", e.target.value)}
                    placeholder="Your assessment and impressions..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Working Diagnosis</Label>
                    <Input
                      value={response.responseNote?.workingDiagnosis || ""}
                      onChange={(e) => updateResponseNote("workingDiagnosis", e.target.value)}
                      placeholder="Primary diagnosis"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ICD-10 Code</Label>
                    <Input
                      placeholder="e.g., I25.1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Response to Clinical Questions</Label>
                  <Textarea
                    value={response.responseNote?.responseToQuestions || ""}
                    onChange={(e) => updateResponseNote("responseToQuestions", e.target.value)}
                    placeholder="Address each question raised by the referring clinician..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Plan Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Treatment Plan *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Treatment Instructions</Label>
                  <Textarea
                    value={response.plan?.treatmentPlan || ""}
                    onChange={(e) => updatePlan("treatmentPlan", e.target.value)}
                    placeholder="Detailed treatment plan and instructions..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Monitoring Requirements</Label>
                  <Textarea
                    value={response.plan?.monitoringRequirements || ""}
                    onChange={(e) => updatePlan("monitoringRequirements", e.target.value)}
                    placeholder="What should be monitored and how often..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Disposition Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Disposition *
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Disposition Decision</Label>
                  <Select
                    value={response.disposition?.type}
                    onValueChange={(v) => setResponse(prev => ({
                      ...prev,
                      disposition: { ...prev.disposition!, type: v as DispositionType }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select disposition" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISPOSITION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div>
                            <p>{opt.label}</p>
                            <p className="text-xs text-muted-foreground">{opt.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Disposition Instructions</Label>
                  <Textarea
                    value={response.disposition?.instructions || ""}
                    onChange={(e) => setResponse(prev => ({
                      ...prev,
                      disposition: { ...prev.disposition!, instructions: e.target.value }
                    }))}
                    placeholder="Specific instructions for the referring facility..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Follow-up Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  Follow-up Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Follow-up Type</Label>
                    <Select
                      value={response.followUp?.type}
                      onValueChange={(v) => setResponse(prev => ({
                        ...prev,
                        followUp: { ...prev.followUp!, type: v as FollowUpType }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {FOLLOW_UP_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>When</Label>
                    <Input
                      type="date"
                      value={response.followUp?.when || ""}
                      onChange={(e) => setResponse(prev => ({
                        ...prev,
                        followUp: { ...prev.followUp!, when: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Follow-up Instructions</Label>
                  <Textarea
                    value={response.followUp?.instructions || ""}
                    onChange={(e) => setResponse(prev => ({
                      ...prev,
                      followUp: { ...prev.followUp!, instructions: e.target.value }
                    }))}
                    placeholder="Instructions for follow-up..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
