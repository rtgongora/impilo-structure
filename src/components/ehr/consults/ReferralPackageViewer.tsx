import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  FileText,
  User,
  Building,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Activity,
  Pill,
  FlaskConical,
  Image as ImageIcon,
  Paperclip,
  Shield,
  Stethoscope,
  Phone,
  Video,
  MessageSquare,
  Users,
  Calendar,
  Eye,
  Download,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ReferralPackage, TelemedicineMode, ReferralUrgency } from "@/types/telehealth";

interface ReferralPackageViewerProps {
  referral: ReferralPackage;
  onAccept?: () => void;
  onReassign?: () => void;
  onDecline?: () => void;
  readOnly?: boolean;
}

const URGENCY_STYLES: Record<ReferralUrgency, { bg: string; text: string; border: string }> = {
  routine: { bg: "bg-muted", text: "text-muted-foreground", border: "border-muted" },
  urgent: { bg: "bg-warning/20", text: "text-warning", border: "border-warning" },
  stat: { bg: "bg-destructive/20", text: "text-destructive", border: "border-destructive" },
  emergency: { bg: "bg-destructive", text: "text-destructive-foreground", border: "border-destructive" },
};

const MODE_ICONS: Record<TelemedicineMode, React.ComponentType<{ className?: string }>> = {
  async: FileText,
  chat: MessageSquare,
  audio: Phone,
  video: Video,
  scheduled: Calendar,
  board: Users,
};

export function ReferralPackageViewer({
  referral,
  onAccept,
  onReassign,
  onDecline,
  readOnly = false,
}: ReferralPackageViewerProps) {
  const [activeTab, setActiveTab] = useState("referral");
  const urgencyStyle = URGENCY_STYLES[referral.urgency];
  const isEmergency = referral.urgency === "emergency";

  return (
    <div className="h-full flex flex-col">
      {/* Header with Patient Info & Urgency */}
      <Card className={cn(
        "mb-4",
        isEmergency && "border-destructive bg-destructive/5 animate-pulse"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className={cn("text-lg", isEmergency && "bg-destructive text-destructive-foreground")}>
                  {referral.patientHID?.slice(-2) || "PT"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Patient: {referral.patientHID}
                  {isEmergency && <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />}
                </h2>
                <p className="text-muted-foreground">
                  Referral #{referral.referralNumber}
                </p>
                <div className="flex items-center gap-3 mt-1 text-sm">
                  <span className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {referral.context.referringFacilityName}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {referral.context.referringProviderName}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right space-y-2">
              <Badge className={cn(urgencyStyle.bg, urgencyStyle.text, "text-sm px-3 py-1")}>
                {referral.urgency.toUpperCase()}
              </Badge>
              <p className="text-xs text-muted-foreground">
                <Clock className="inline-block h-3 w-3 mr-1" />
                Received {formatDistanceToNow(new Date(referral.timestamps.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Requested Modes */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Requested modes:</span>
            {referral.requestedModes.map((mode) => {
              const Icon = MODE_ICONS[mode];
              const isPreferred = mode === referral.preferredMode;
              return (
                <Badge
                  key={mode}
                  variant={isPreferred ? "default" : "outline"}
                  className={cn(isPreferred && "bg-primary")}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {mode}
                  {isPreferred && " (preferred)"}
                </Badge>
              );
            })}
          </div>

          {/* Consent Status */}
          <div className="mt-3 flex items-center gap-2">
            <Shield className={cn(
              "h-4 w-4",
              referral.consent.status === "obtained" ? "text-success" : "text-warning"
            )} />
            <span className="text-sm">
              Consent: {referral.consent.status} ({referral.consent.type})
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Card className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-4 pt-4">
            <TabsList className="w-full">
              <TabsTrigger value="referral" className="flex-1">
                <FileText className="h-4 w-4 mr-1" />
                Referral Letter
              </TabsTrigger>
              <TabsTrigger value="patient" className="flex-1">
                <User className="h-4 w-4 mr-1" />
                Patient Summary
              </TabsTrigger>
              <TabsTrigger value="visit" className="flex-1">
                <Activity className="h-4 w-4 mr-1" />
                Visit Summary
              </TabsTrigger>
              <TabsTrigger value="attachments" className="flex-1">
                <Paperclip className="h-4 w-4 mr-1" />
                Attachments
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4">
              <TabsContent value="referral" className="m-0 space-y-4">
                {/* Reason for Referral - Highlighted */}
                <Card className="border-primary bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-primary flex items-center gap-2">
                      <Stethoscope className="h-5 w-5" />
                      Reason for Referral
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium text-lg">{referral.clinicalNarrative.reasonForReferral}</p>
                    {referral.clinicalNarrative.specificQuestions.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Specific Questions:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          {referral.clinicalNarrative.specificQuestions.map((q, i) => (
                            <li key={i} className="text-sm">{q}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Clinical Narrative */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Clinical Narrative</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Chief Complaint</p>
                      <p>{referral.clinicalNarrative.chiefComplaint || "Not provided"}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-1">History of Present Illness</p>
                      <p className="whitespace-pre-wrap">{referral.clinicalNarrative.historyOfPresentIllness || "Not provided"}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Past Medical History</p>
                      <p>{referral.clinicalNarrative.pastMedicalHistory || "Not provided"}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Provisional Diagnosis</p>
                      <p className="font-medium">{referral.clinicalNarrative.provisionalDiagnosis || "Not provided"}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Interventions Done</p>
                      <p>{referral.clinicalNarrative.interventionsDone || "None documented"}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="patient" className="m-0 space-y-4">
                {/* Allergies Alert */}
                {referral.supportingData.allergies.length > 0 && (
                  <Card className="border-destructive bg-destructive/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Allergies
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {referral.supportingData.allergies.map((a, i) => (
                          <Badge key={i} variant="destructive">
                            {a.allergen}: {a.reaction} ({a.severity})
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Problem List */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Problem List</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {referral.supportingData.problemList.length === 0 ? (
                      <p className="text-muted-foreground">No active problems</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {referral.supportingData.problemList.map((p, i) => (
                          <Badge key={i} variant="outline">{p}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Current Medications */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Pill className="h-5 w-5" />
                      Current Medications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {referral.supportingData.currentMedications.length === 0 ? (
                      <p className="text-muted-foreground">No current medications</p>
                    ) : (
                      <div className="space-y-2">
                        {referral.supportingData.currentMedications.map((m, i) => (
                          <div key={i} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span className="font-medium">{m.name}</span>
                            <span className="text-muted-foreground">{m.dose} - {m.frequency}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Latest Vitals */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Latest Vitals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {referral.supportingData.vitals.length === 0 ? (
                      <p className="text-muted-foreground">No vitals recorded</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {referral.supportingData.vitals.map((v, i) => (
                          <div key={i} className="p-3 bg-muted/30 rounded text-center">
                            <p className="text-xs text-muted-foreground">{v.name}</p>
                            <p className="text-lg font-bold">{v.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="visit" className="m-0 space-y-4">
                {/* Lab Results */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FlaskConical className="h-5 w-5" />
                      Recent Lab Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {referral.supportingData.labResults.length === 0 ? (
                      <p className="text-muted-foreground">No lab results attached</p>
                    ) : (
                      <div className="space-y-2">
                        {referral.supportingData.labResults.map((l, i) => (
                          <div key={i} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span>{l.test}</span>
                            <span className="font-medium">{l.result}</span>
                            <span className="text-xs text-muted-foreground">{l.date}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Imaging */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Recent Imaging
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {referral.supportingData.imaging.length === 0 ? (
                      <p className="text-muted-foreground">No imaging attached</p>
                    ) : (
                      <div className="space-y-2">
                        {referral.supportingData.imaging.map((img, i) => (
                          <div key={i} className="p-3 bg-muted/30 rounded">
                            <p className="font-medium">{img.study}</p>
                            <p className="text-sm text-muted-foreground">{img.finding}</p>
                            <p className="text-xs text-muted-foreground mt-1">{img.date}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attachments" className="m-0">
                {referral.supportingData.attachments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No attachments</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {referral.supportingData.attachments.map((att, i) => (
                      <Card key={i} className="cursor-pointer hover:bg-muted/30">
                        <CardContent className="p-4 flex items-center gap-3">
                          <FileText className="h-10 w-10 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{att.name}</p>
                            <p className="text-sm text-muted-foreground">{att.type}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        {/* Action Buttons */}
        {!readOnly && (
          <div className="p-4 border-t bg-muted/30">
            <div className="flex justify-between gap-4">
              {onDecline && (
                <Button variant="outline" onClick={onDecline} className="text-destructive hover:text-destructive">
                  <XCircle className="h-4 w-4 mr-2" />
                  Decline
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                {onReassign && (
                  <Button variant="outline" onClick={onReassign}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reassign
                  </Button>
                )}
                {onAccept && (
                  <Button onClick={onAccept} className={cn(isEmergency && "bg-destructive hover:bg-destructive/90")}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept & Open Record
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
