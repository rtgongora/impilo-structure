import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Phone,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Users,
  Send,
  Paperclip,
  FileText,
  Activity,
  Pill,
  AlertTriangle,
  Clock,
  User,
  Play,
  Square,
  PhoneOff,
  Maximize2,
  Minimize2,
  MoreVertical,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DictatableTextarea } from "@/components/ui/dictatable-textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { 
  ReferralPackage, 
  ConsultationResponse, 
  TelemedicineMode,
  ChatMessage,
} from "@/types/telehealth";

interface LiveSessionWorkspaceProps {
  referral: ReferralPackage;
  activeMode: TelemedicineMode;
  onModeChange: (mode: TelemedicineMode) => void;
  onSubmitResponse: (response: ConsultationResponse) => void;
  onEndSession: () => void;
}

interface LocalChatMessage extends ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
  type: "text" | "system" | "attachment";
}

export function LiveSessionWorkspace({
  referral,
  activeMode,
  onModeChange,
  onSubmitResponse,
  onEndSession,
}: LiveSessionWorkspaceProps) {
  // Chat state
  const [messages, setMessages] = useState<LocalChatMessage[]>([
    {
      id: "1",
      senderId: referral.context.referringProviderId,
      senderName: referral.context.referringProviderName,
      senderRole: "Referring Clinician",
      content: `Requesting teleconsultation for patient. ${referral.clinicalNarrative.reasonForReferral}`,
      timestamp: new Date().toISOString(),
      type: "system",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Call state
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Response draft state
  const [responseDraft, setResponseDraft] = useState({
    assessment: "",
    clinicalInterpretation: "",
    workingDiagnosis: "",
    diagnosisCode: "",
    responseToQuestions: "",
    keyFindings: "",
    impressions: "",
    treatmentPlan: "",
    monitoringRequirements: "",
    followUpTimeframe: "",
    followUpMode: "",
    followUpInstructions: "",
  });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Board participants (for MDT mode)
  const [boardParticipants, setBoardParticipants] = useState([
    { id: "1", name: "Dr. Tendai Moyo", role: "Lead Reviewer", online: true },
    { id: "2", name: "Dr. Grace Mutasa", role: "Specialist", online: true },
    { id: "3", name: referral.context.referringProviderName, role: "Referring Clinician", online: true },
  ]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Call timer
  useEffect(() => {
    if (isCallActive) {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      setCallDuration(0);
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [isCallActive]);

  // Auto-save draft
  const autoSave = () => {
    setLastSaved(new Date());
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const message: LocalChatMessage = {
      id: Date.now().toString(),
      senderId: "current-user",
      senderName: "Dr. Current User",
      senderRole: "Consultant",
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: "text",
    };
    setMessages((prev) => [...prev, message]);
    setNewMessage("");
  };

  const startCall = (withVideo: boolean) => {
    setIsCallActive(true);
    setIsVideoOff(!withVideo);
    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      senderId: "system",
      senderName: "System",
      senderRole: "System",
      content: withVideo ? "Video call started" : "Audio call started",
      timestamp: new Date().toISOString(),
      type: "system",
    }]);
    toast.success(withVideo ? "Video call connected" : "Audio call connected");
  };

  const endCall = () => {
    setIsCallActive(false);
    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      senderId: "system",
      senderName: "System",
      senderRole: "System",
      content: `Call ended. Duration: ${formatDuration(callDuration)}`,
      timestamp: new Date().toISOString(),
      type: "system",
    }]);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmitResponse = () => {
    const response: ConsultationResponse = {
      referralId: referral.id,
      consultationId: `CONSULT-${Date.now()}`,
      consultantProviderId: "current-user",
      consultantFacilityId: "current-facility",
      modeUsed: activeMode,
      responseNote: {
        assessment: responseDraft.assessment,
        clinicalInterpretation: responseDraft.clinicalInterpretation,
        workingDiagnosis: responseDraft.workingDiagnosis,
        diagnosisCodes: responseDraft.diagnosisCode ? [{ code: responseDraft.diagnosisCode, description: responseDraft.workingDiagnosis }] : [],
        responseToQuestions: responseDraft.responseToQuestions,
        keyFindings: responseDraft.keyFindings,
        impressions: responseDraft.impressions,
      },
      plan: {
        treatmentPlan: responseDraft.treatmentPlan,
        medications: [],
        investigations: [],
        procedures: [],
        monitoringRequirements: responseDraft.monitoringRequirements,
      },
      disposition: {
        type: "continue_at_referring",
        instructions: "",
      },
      followUp: {
        type: responseDraft.followUpMode === "teleconsult" ? "tele_follow_up" : "in_person",
        when: responseDraft.followUpTimeframe,
        instructions: responseDraft.followUpInstructions,
        responsibleFacility: referral.context.referringFacilityName,
      },
      orders: {
        medications: [],
        labs: [],
        imaging: [],
        procedures: [],
      },
      documentation: {
        communicationLogRef: `LOG-${Date.now()}`,
        sessionDuration: callDuration,
        attachmentsUsed: [],
        boardParticipants: activeMode === "board" ? boardParticipants.map((p) => p.id) : undefined,
      },
      status: "submitted",
      timestamps: {
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
    };
    onSubmitResponse(response);
  };

  return (
    <div className="h-full flex">
      {/* LEFT PANE: Communication */}
      <div className="w-96 border-r flex flex-col bg-background">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Communication</h3>
            {isCallActive && (
              <Badge variant="destructive" className="animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                {formatDuration(callDuration)}
              </Badge>
            )}
          </div>
          <div className="flex gap-1 mt-2">
            <Button
              variant={activeMode === "chat" ? "default" : "outline"}
              size="sm"
              onClick={() => onModeChange("chat")}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button
              variant={activeMode === "audio" ? "default" : "outline"}
              size="sm"
              onClick={() => onModeChange("audio")}
            >
              <Phone className="w-4 h-4" />
            </Button>
            <Button
              variant={activeMode === "video" ? "default" : "outline"}
              size="sm"
              onClick={() => onModeChange("video")}
            >
              <Video className="w-4 h-4" />
            </Button>
            <Button
              variant={activeMode === "board" ? "default" : "outline"}
              size="sm"
              onClick={() => onModeChange("board")}
            >
              <Users className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Video/Audio Call Area */}
        {(activeMode === "video" || activeMode === "audio") && (
          <div className="p-3 bg-muted/50">
            {isCallActive ? (
              <div className="space-y-3">
                {activeMode === "video" && (
                  <div className="aspect-video bg-black rounded-lg flex items-center justify-center relative overflow-hidden">
                    <User className="w-16 h-16 text-muted-foreground" />
                    {/* Local video preview */}
                    <div className="absolute bottom-2 right-2 w-24 aspect-video bg-muted rounded border">
                      {isVideoOff ? (
                        <div className="h-full flex items-center justify-center">
                          <VideoOff className="w-6 h-6 text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <User className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsMuted(!isMuted)}
                    className={cn(isMuted && "bg-destructive text-destructive-foreground")}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  {activeMode === "video" && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsVideoOff(!isVideoOff)}
                      className={cn(isVideoOff && "bg-destructive text-destructive-foreground")}
                    >
                      {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    </Button>
                  )}
                  <Button variant="destructive" size="icon" onClick={endCall}>
                    <PhoneOff className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => startCall(true)} className="flex-1">
                  <Video className="w-4 h-4 mr-2" />
                  Start Video
                </Button>
                <Button variant="outline" onClick={() => startCall(false)} className="flex-1">
                  <Phone className="w-4 h-4 mr-2" />
                  Audio Only
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Board Participants (for MDT mode) */}
        {activeMode === "board" && (
          <div className="p-3 border-b">
            <p className="text-xs font-medium text-muted-foreground mb-2">Board Participants</p>
            <div className="space-y-2">
              {boardParticipants.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    p.online ? "bg-success" : "bg-muted"
                  )} />
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {p.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "rounded-lg p-3",
                  msg.type === "system" && "bg-muted/50 text-center text-sm text-muted-foreground",
                  msg.type === "text" && msg.senderId === "current-user" && "bg-primary/10 ml-4",
                  msg.type === "text" && msg.senderId !== "current-user" && "bg-muted mr-4"
                )}
              >
                {msg.type !== "system" && (
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {msg.senderName.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-xs">{msg.senderName}</span>
                    <span className="text-xs text-muted-foreground">{msg.senderRole}</span>
                  </div>
                )}
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(msg.timestamp), "HH:mm")}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-3 border-t">
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
            />
            <Button onClick={sendMessage} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* CENTER PANE: Response Note Draft */}
      <div className="flex-1 flex flex-col">
        <div className="p-3 border-b flex items-center justify-between bg-muted/30">
          <div>
            <h3 className="font-semibold">Response Note Draft</h3>
            {lastSaved && (
              <p className="text-xs text-muted-foreground">
                Auto-saved: {format(lastSaved, "HH:mm:ss")}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEndSession}>
              End Session
            </Button>
            <Button size="sm" onClick={handleSubmitResponse}>
              <Send className="w-4 h-4 mr-2" />
              Submit Response
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6 max-w-2xl">
            <div className="space-y-2">
              <Label>Assessment *</Label>
              <DictatableTextarea
                value={responseDraft.assessment}
                onChange={(e) => {
                  setResponseDraft((prev) => ({ ...prev, assessment: e.target.value }));
                  autoSave();
                }}
                placeholder="Your overall assessment of the case..."
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Clinical Interpretation *</Label>
              <DictatableTextarea
                value={responseDraft.clinicalInterpretation}
                onChange={(e) => {
                  setResponseDraft((prev) => ({ ...prev, clinicalInterpretation: e.target.value }));
                  autoSave();
                }}
                placeholder="Your clinical interpretation of the findings..."
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Working/Final Diagnosis *</Label>
                <Input
                  value={responseDraft.workingDiagnosis}
                  onChange={(e) => {
                    setResponseDraft((prev) => ({ ...prev, workingDiagnosis: e.target.value }));
                    autoSave();
                  }}
                  placeholder="Diagnosis"
                />
              </div>
              <div className="space-y-2">
                <Label>ICD-10 Code</Label>
                <Input
                  value={responseDraft.diagnosisCode}
                  onChange={(e) => {
                    setResponseDraft((prev) => ({ ...prev, diagnosisCode: e.target.value }));
                    autoSave();
                  }}
                  placeholder="e.g., I10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Response to Referrer's Questions</Label>
              <DictatableTextarea
                value={responseDraft.responseToQuestions}
                onChange={(e) => {
                  setResponseDraft((prev) => ({ ...prev, responseToQuestions: e.target.value }));
                  autoSave();
                }}
                placeholder="Address the specific questions asked by the referring clinician..."
              />
            </div>

            <div className="space-y-2">
              <Label>Key Findings</Label>
              <DictatableTextarea
                value={responseDraft.keyFindings}
                onChange={(e) => {
                  setResponseDraft((prev) => ({ ...prev, keyFindings: e.target.value }));
                  autoSave();
                }}
                placeholder="Important findings from your review..."
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Treatment Plan *</Label>
              <DictatableTextarea
                value={responseDraft.treatmentPlan}
                onChange={(e) => {
                  setResponseDraft((prev) => ({ ...prev, treatmentPlan: e.target.value }));
                  autoSave();
                }}
                placeholder="Recommended management plan..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Monitoring Requirements</Label>
              <DictatableTextarea
                value={responseDraft.monitoringRequirements}
                onChange={(e) => {
                  setResponseDraft((prev) => ({ ...prev, monitoringRequirements: e.target.value }));
                  autoSave();
                }}
                placeholder="Parameters to monitor and frequency..."
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Follow-Up Instructions</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Timeframe</Label>
                  <Select
                    value={responseDraft.followUpTimeframe}
                    onValueChange={(v) => {
                      setResponseDraft((prev) => ({ ...prev, followUpTimeframe: v }));
                      autoSave();
                    }}
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
                  <Label>Mode</Label>
                  <Select
                    value={responseDraft.followUpMode}
                    onValueChange={(v) => {
                      setResponseDraft((prev) => ({ ...prev, followUpMode: v }));
                      autoSave();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teleconsult">Teleconsult</SelectItem>
                      <SelectItem value="in-person">In-person visit</SelectItem>
                      <SelectItem value="labs">Labs review</SelectItem>
                      <SelectItem value="imaging">Imaging review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Instructions</Label>
                <DictatableTextarea
                  value={responseDraft.followUpInstructions}
                  onChange={(e) => {
                    setResponseDraft((prev) => ({ ...prev, followUpInstructions: e.target.value }));
                    autoSave();
                  }}
                  placeholder="Specific follow-up instructions..."
                />
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* RIGHT PANE: Patient Context */}
      <div className="w-80 border-l flex flex-col bg-muted/10">
        <Tabs defaultValue="summary" className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start px-3 pt-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="vitals">Vitals</TabsTrigger>
            <TabsTrigger value="meds">Meds</TabsTrigger>
            <TabsTrigger value="referral">Referral</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="flex-1 p-3 m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Patient: {referral.patientHID}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                {referral.supportingData.allergies.length > 0 && (
                  <div className="p-2 bg-destructive/10 rounded border border-destructive/20">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-medium">Allergies</span>
                    </div>
                    <p className="text-xs mt-1">
                      {referral.supportingData.allergies.map((a) => a.allergen).join(", ")}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Problem List</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {referral.supportingData.problemList.map((p, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-xs font-medium text-muted-foreground">From</p>
                  <p>{referral.context.referringProviderName}</p>
                  <p className="text-muted-foreground">{referral.context.referringFacilityName}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vitals" className="flex-1 p-3 m-0">
            <div className="space-y-2">
              {referral.supportingData.vitals.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No vitals</p>
              ) : (
                referral.supportingData.vitals.map((v, i) => (
                  <div key={i} className="p-2 bg-muted/50 rounded flex justify-between">
                    <span className="text-sm">{v.name}</span>
                    <span className="font-medium">{v.value}</span>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="meds" className="flex-1 p-3 m-0">
            <div className="space-y-2">
              {referral.supportingData.currentMedications.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No medications</p>
              ) : (
                referral.supportingData.currentMedications.map((m, i) => (
                  <div key={i} className="p-2 bg-muted/50 rounded">
                    <p className="font-medium text-sm">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.dose} - {m.frequency}</p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="referral" className="flex-1 p-3 m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Reason for Referral</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>{referral.clinicalNarrative.reasonForReferral}</p>
                {referral.clinicalNarrative.specificQuestions.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-muted-foreground">Questions:</p>
                    <ul className="list-decimal list-inside mt-1 text-xs space-y-1">
                      {referral.clinicalNarrative.specificQuestions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
