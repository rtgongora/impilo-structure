import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Monitor,
  FileText,
  Send,
  Paperclip,
  User,
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Camera,
  Settings,
  Loader2,
  Users,
  FileCheck,
  ClipboardCheck,
  Activity,
  AlertTriangle,
  Image,
  FileImage,
} from "lucide-react";
import { useTeleconsultation } from "@/hooks/useTeleconsultation";
import { useAuth } from "@/contexts/AuthContext";
import { useEHR } from "@/contexts/EHRContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ConsultRequest {
  id: string;
  specialty: string;
  urgency: "routine" | "urgent" | "stat";
  reason: string;
  clinicalQuestion: string;
  attachments: string[];
}

interface ChatMessage {
  id: string;
  sender: string;
  senderRole: string;
  content: string;
  timestamp: Date;
  type: "text" | "system" | "attachment";
}

const WORKFLOW_STAGES = [
  { stage: 1, label: "Case Identified", icon: Stethoscope },
  { stage: 2, label: "Build Package", icon: Paperclip },
  { stage: 3, label: "Routing & Consent", icon: ClipboardCheck },
  { stage: 4, label: "Review & Accept", icon: FileCheck },
  { stage: 5, label: "Live Session", icon: Video },
  { stage: 6, label: "Response Note", icon: FileText },
  { stage: 7, label: "Completion", icon: CheckCircle2 },
];

const COMMUNICATION_MODES = [
  { id: "chat", label: "Chat", icon: MessageSquare, description: "Real-time text messaging" },
  { id: "audio", label: "Audio", icon: Phone, description: "Voice call only" },
  { id: "video", label: "Video", icon: Video, description: "Video consultation" },
  { id: "board", label: "MDT Board", icon: Users, description: "Multi-participant case review" },
] as const;

type CommunicationMode = typeof COMMUNICATION_MODES[number]["id"];

export function TeleconsultationWorkspace() {
  const { user } = useAuth();
  const { patientContext } = useEHR();
  const {
    session,
    notes,
    loading,
    isVideoEnabled,
    isAudioEnabled,
    connectionState,
    createSession,
    updateSession,
    advanceStage,
    captureConsent,
    joinWaitingRoom,
    startVideoCall,
    endVideoCall,
    toggleVideo,
    toggleAudio,
    completeSession,
  } = useTeleconsultation();

  // State
  const [consultRequest, setConsultRequest] = useState<Partial<ConsultRequest>>({
    urgency: "routine",
    attachments: [],
  });
  const [activeMode, setActiveMode] = useState<CommunicationMode>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [consultNotes, setConsultNotes] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [duration, setDuration] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [responseDraft, setResponseDraft] = useState({
    clinicalInterpretation: "",
    workingDiagnosis: "",
    diagnosisCode: "",
    responseToQuestions: "",
    actionPlan: "",
    followUp: { timeframe: "", mode: "", instructions: "" },
  });

  const currentStage = session?.workflow_stage || 1;
  const callState = connectionState === 'connected' ? 'connected' : 
                    connectionState === 'connecting' ? 'connecting' : 
                    session?.session_ended_at ? 'ended' : 'idle';
  const isCallActive = callState === "connecting" || callState === "connected";

  // Duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState]);

  // Auto-save
  useEffect(() => {
    const timer = setInterval(() => {
      if (responseDraft.clinicalInterpretation || responseDraft.actionPlan) {
        setLastSaved(new Date());
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [responseDraft]);

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  const specialties = [
    "Cardiology", "Dermatology", "Endocrinology", "Gastroenterology",
    "Infectious Disease", "Nephrology", "Neurology", "Oncology",
    "Pulmonology", "Rheumatology", "Psychiatry", "Radiology", "Surgery",
    "Obstetrics & Gynaecology", "Paediatrics", "Internal Medicine",
  ];

  const handleCreateSession = async () => {
    if (!consultRequest.specialty || !consultRequest.reason) {
      toast.error("Please fill in specialty and reason");
      return;
    }
    await createSession(consultRequest.specialty);
  };

  const handleCaptureConsent = async () => {
    if (!session) return;
    await captureConsent();
    setConsentChecked(true);
    toast.success("Patient consent recorded");
  };

  const handleJoinWaitingRoom = async () => {
    await joinWaitingRoom();
  };

  const handleStartCall = async (audioOnly: boolean = false) => {
    if (!session) return;
    setActiveMode(audioOnly ? "audio" : "video");
    await startVideoCall(true);
  };

  const handleEndCall = async () => {
    await endVideoCall();
    setActiveMode("chat");
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: user?.email || "You",
      senderRole: "Referring Clinician",
      content: newMessage,
      timestamp: new Date(),
      type: "text",
    };
    setMessages(prev => [...prev, message]);
    setNewMessage("");
  };

  const handleAdvanceStage = async () => {
    await advanceStage();
  };

  // Determine if we should show the 3-pane session view (stages 4-6)
  const showSessionView = currentStage >= 4 && currentStage <= 6;

  // Render the preparation/referral building stages (1-3)
  if (currentStage <= 3) {
    return (
      <div className="space-y-6">
        {/* Progress Indicator */}
        <StageProgressIndicator currentStage={currentStage} session={session} />

        {/* Stage 1: Case Identified / Preparation */}
        {currentStage === 1 && (
          <PreparationStage
            consultRequest={consultRequest}
            setConsultRequest={setConsultRequest}
            specialties={specialties}
            patientContext={patientContext}
            loading={loading}
            onCreateSession={handleCreateSession}
          />
        )}

        {/* Stage 2: Build Referral Package */}
        {currentStage === 2 && (
          <PackageBuildingStage
            consultRequest={consultRequest}
            consentChecked={consentChecked}
            session={session}
            loading={loading}
            onCaptureConsent={handleCaptureConsent}
            onAdvance={handleAdvanceStage}
          />
        )}

        {/* Stage 3: Routing & Consent */}
        {currentStage === 3 && (
          <RoutingStage
            session={session}
            loading={loading}
            onJoinWaitingRoom={handleJoinWaitingRoom}
          />
        )}
      </div>
    );
  }

  // Render the 3-pane session view (stages 4-6)
  if (showSessionView) {
    return (
      <div className="h-full flex flex-col">
        {/* Progress Indicator */}
        <div className="mb-4">
          <StageProgressIndicator currentStage={currentStage} session={session} />
        </div>

        {/* 3-Pane Layout */}
        <div className="flex-1 flex min-h-0 border rounded-lg overflow-hidden">
          {/* LEFT PANE: Communication */}
          <div className="w-96 border-r flex flex-col bg-background">
            <div className="p-3 border-b">
              <h3 className="font-semibold text-sm">Communication</h3>
              <div className="flex gap-1 mt-2">
                {COMMUNICATION_MODES.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = activeMode === mode.id;
                  const isInCall = (mode.id === "audio" || mode.id === "video") && isCallActive;
                  return (
                    <Button
                      key={mode.id}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveMode(mode.id)}
                      className={cn(
                        "relative",
                        isInCall && "ring-2 ring-success ring-offset-1"
                      )}
                      title={mode.description}
                    >
                      <Icon className="w-4 h-4" />
                      {isInCall && mode.id === activeMode && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full animate-pulse" />
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Chat Mode */}
            {activeMode === "chat" && (
              <ChatPane
                messages={messages}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                onSendMessage={handleSendMessage}
                isCallActive={isCallActive}
                onViewCall={() => setActiveMode("video")}
              />
            )}

            {/* Audio Mode */}
            {activeMode === "audio" && (
              <AudioPane
                callState={callState}
                duration={duration}
                formatDuration={formatDuration}
                isAudioEnabled={isAudioEnabled}
                onToggleAudio={toggleAudio}
                onStartCall={() => handleStartCall(true)}
                onEndCall={handleEndCall}
                loading={loading}
              />
            )}

            {/* Video Mode */}
            {activeMode === "video" && (
              <VideoPane
                callState={callState}
                duration={duration}
                formatDuration={formatDuration}
                isAudioEnabled={isAudioEnabled}
                isVideoEnabled={isVideoEnabled}
                onToggleAudio={toggleAudio}
                onToggleVideo={toggleVideo}
                onStartCall={() => handleStartCall(false)}
                onEndCall={handleEndCall}
                loading={loading}
              />
            )}

            {/* Board/MDT Mode */}
            {activeMode === "board" && (
              <BoardPane />
            )}
          </div>

          {/* CENTER PANE: Response Note Draft */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-3 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Response Note Draft</h3>
                {lastSaved && (
                  <p className="text-xs text-muted-foreground">
                    Last saved: {format(lastSaved, "HH:mm:ss")}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Save Draft
                </Button>
                <Button size="sm" onClick={handleAdvanceStage} disabled={currentStage >= 7}>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Response
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <ResponseNoteForm
                responseDraft={responseDraft}
                setResponseDraft={setResponseDraft}
                consultNotes={consultNotes}
                setConsultNotes={setConsultNotes}
              />
            </ScrollArea>
          </div>

          {/* RIGHT PANE: Information */}
          <div className="w-80 border-l flex flex-col bg-background">
            <InformationPane patientContext={patientContext} />
          </div>
        </div>
      </div>
    );
  }

  // Stage 7: Completion
  return (
    <div className="space-y-6">
      <StageProgressIndicator currentStage={currentStage} session={session} />
      <CompletionStage
        consultNotes={consultNotes}
        setConsultNotes={setConsultNotes}
        recommendations={recommendations}
        setRecommendations={setRecommendations}
        duration={duration}
        formatDuration={formatDuration}
      />
    </div>
  );
}

// Sub-components

function StageProgressIndicator({ currentStage, session }: { currentStage: number; session: any }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Teleconsultation Workflow</span>
          <Badge variant={session ? "default" : "secondary"}>
            {session ? `Stage ${currentStage} of 7` : "New Consultation"}
          </Badge>
        </div>
        <Progress value={(currentStage / 7) * 100} className="h-2 mb-4" />
        <div className="flex justify-between">
          {WORKFLOW_STAGES.map(({ stage, label, icon: Icon }) => (
            <div
              key={stage}
              className={cn(
                "flex flex-col items-center gap-1",
                stage === currentStage && "text-primary",
                stage < currentStage && "text-success",
                stage > currentStage && "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  stage === currentStage && "bg-primary text-primary-foreground",
                  stage < currentStage && "bg-success/20 text-success",
                  stage > currentStage && "bg-muted"
                )}
              >
                {stage < currentStage ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span className="text-xs text-center hidden md:block max-w-[60px]">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PreparationStage({ consultRequest, setConsultRequest, specialties, patientContext, loading, onCreateSession }: any) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Stage 1: Case Identified
          </CardTitle>
          <CardDescription>
            Initiate a teleconsultation request for specialist input
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Specialty Required *</Label>
              <Select
                value={consultRequest.specialty}
                onValueChange={(v) => setConsultRequest({ ...consultRequest, specialty: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((s: string) => (
                    <SelectItem key={s} value={s.toLowerCase()}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Urgency *</Label>
              <Select
                value={consultRequest.urgency}
                onValueChange={(v) =>
                  setConsultRequest({ ...consultRequest, urgency: v as ConsultRequest["urgency"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine (24-48h)</SelectItem>
                  <SelectItem value="urgent">Urgent (4-8h)</SelectItem>
                  <SelectItem value="stat">STAT (Immediate)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reason for Consultation *</Label>
            <Input
              value={consultRequest.reason || ""}
              onChange={(e) => setConsultRequest({ ...consultRequest, reason: e.target.value })}
              placeholder="Brief reason for referral"
            />
          </div>
          <div className="space-y-2">
            <Label>Clinical Question</Label>
            <Textarea
              value={consultRequest.clinicalQuestion || ""}
              onChange={(e) => setConsultRequest({ ...consultRequest, clinicalQuestion: e.target.value })}
              placeholder="What specific clinical question do you need answered?"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Demographics</p>
              <p className="font-medium">
                {patientContext?.demographics?.sex || "Unknown"}, {patientContext?.demographics?.age || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Chief Complaint</p>
              <p className="font-medium">{patientContext?.chiefComplaint || "Not documented"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Working Diagnosis</p>
              <p className="font-medium">{patientContext?.diagnosis || "Pending assessment"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onCreateSession} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Consultation & Continue"
          )}
        </Button>
      </div>
    </>
  );
}

function PackageBuildingStage({ consultRequest, consentChecked, session, loading, onCaptureConsent, onAdvance }: any) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-primary" />
            Stage 2: Build Referral Package
          </CardTitle>
          <CardDescription>
            Compose the referral letter and attach relevant documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Referral Letter *</Label>
            <Textarea
              placeholder="Compose referral letter with clinical context..."
              rows={6}
              defaultValue={`Dear Colleague,

I am referring this patient for your expert opinion regarding ${consultRequest?.reason || "the presenting condition"}.

${consultRequest?.clinicalQuestion || ""}

Thank you for your assistance.`}
            />
          </div>

          <div className="space-y-3">
            <Label>Attachments</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "Patient Summary", type: "auto", selected: true },
                { name: "Visit Summary", type: "auto", selected: true },
                { name: "Recent Vitals", type: "data", selected: true },
                { name: "Lab Results", type: "lab", selected: false },
              ].map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center gap-2 p-3 border rounded-lg"
                >
                  <Checkbox defaultChecked={doc.selected} />
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{doc.name}</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {doc.type}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm">
              <Paperclip className="h-4 w-4 mr-1" />
              Add More Files
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Digital Consent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <Checkbox 
              id="consent" 
              checked={consentChecked || session?.consent_obtained}
              onCheckedChange={onCaptureConsent}
            />
            <Label htmlFor="consent" className="text-sm flex-1">
              Patient has consented to teleconsultation and data sharing with the specialist
            </Label>
            {session?.consent_obtained && (
              <Badge variant="outline" className="text-success">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Recorded
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" disabled>
          Back
        </Button>
        <Button 
          onClick={onAdvance} 
          disabled={!session?.consent_obtained || loading}
        >
          <Send className="h-4 w-4 mr-1" />
          Continue to Routing
        </Button>
      </div>
    </>
  );
}

function RoutingStage({ session, loading, onJoinWaitingRoom }: any) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Stage 3: Routing & Assignment
          </CardTitle>
          <CardDescription>
            Select the destination for this consultation request
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Route To *</Label>
            <Select defaultValue="specialty-pool">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="practitioner">Specific Practitioner</SelectItem>
                <SelectItem value="workspace">Workspace</SelectItem>
                <SelectItem value="on-call">On-Call Team</SelectItem>
                <SelectItem value="unit">Unit/Ward</SelectItem>
                <SelectItem value="service">Facility Clinical Service</SelectItem>
                <SelectItem value="specialty-pool">Specialty Pool (Default)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Consent verified</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Referral package complete</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Routing target selected</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline">
          Back
        </Button>
        <Button onClick={onJoinWaitingRoom} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Submit & Join Waiting Room
        </Button>
      </div>
    </>
  );
}

function ChatPane({ messages, newMessage, setNewMessage, onSendMessage, isCallActive, onViewCall }: any) {
  return (
    <>
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </p>
          )}
          {messages.map((msg: ChatMessage) => (
            <div
              key={msg.id}
              className={cn(
                "rounded-lg p-3",
                msg.type === "system" && "bg-muted/50 text-center text-sm text-muted-foreground",
                msg.type === "text" && msg.senderRole === "Referring Clinician" && "bg-primary/10 ml-4",
                msg.type === "text" && msg.senderRole !== "Referring Clinician" && "bg-muted mr-4"
              )}
            >
              {msg.type !== "system" && (
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {msg.sender.split(" ").map((n: string) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-xs">{msg.sender}</span>
                  <span className="text-xs text-muted-foreground">{msg.senderRole}</span>
                </div>
              )}
              <p className="text-sm">{msg.content}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(msg.timestamp, "HH:mm")}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSendMessage()}
            placeholder="Type a message..."
          />
          <Button onClick={onSendMessage} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isCallActive && (
        <div 
          className="p-3 bg-success/10 border-t cursor-pointer hover:bg-success/20"
          onClick={onViewCall}
        >
          <div className="flex items-center justify-between">
            <Badge className="bg-success text-success-foreground animate-pulse">
              <span className="w-2 h-2 bg-success-foreground rounded-full mr-2" />
              Call Active
            </Badge>
            <span className="text-xs text-muted-foreground">Tap to view</span>
          </div>
        </div>
      )}
    </>
  );
}

function AudioPane({ callState, duration, formatDuration, isAudioEnabled, onToggleAudio, onStartCall, onEndCall, loading }: any) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className={cn(
        "w-24 h-24 rounded-full flex items-center justify-center mb-4",
        callState === "connected" ? "bg-success/20" : "bg-muted"
      )}>
        {callState === "connecting" ? (
          <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
        ) : callState === "connected" ? (
          <Phone className="h-12 w-12 text-success" />
        ) : (
          <Phone className="h-12 w-12 text-muted-foreground" />
        )}
      </div>

      {callState === "connected" && (
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          <span className="font-mono text-lg">{formatDuration(duration)}</span>
        </div>
      )}

      <p className="text-sm text-muted-foreground mb-6">
        {callState === "idle" && "Start an audio call with the specialist"}
        {callState === "connecting" && "Connecting..."}
        {callState === "connected" && "Audio call in progress"}
        {callState === "ended" && "Call ended"}
      </p>

      <div className="flex gap-2">
        {callState === "connected" && (
          <Button
            variant={isAudioEnabled ? "secondary" : "destructive"}
            size="icon"
            onClick={onToggleAudio}
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
        )}
        {callState === "idle" || callState === "ended" ? (
          <Button className="bg-success hover:bg-success/90" onClick={onStartCall} disabled={loading}>
            <Phone className="h-5 w-5 mr-2" />
            Start Audio Call
          </Button>
        ) : (
          <Button variant="destructive" onClick={onEndCall}>
            <PhoneOff className="h-5 w-5 mr-2" />
            End Call
          </Button>
        )}
      </div>
    </div>
  );
}

function VideoPane({ callState, duration, formatDuration, isAudioEnabled, isVideoEnabled, onToggleAudio, onToggleVideo, onStartCall, onEndCall, loading }: any) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 bg-slate-900 relative flex items-center justify-center">
        {callState === "idle" && (
          <div className="text-center text-white">
            <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Ready to connect</p>
            <p className="text-sm text-slate-400">Click Start Call to begin</p>
          </div>
        )}
        {callState === "connecting" && (
          <div className="text-center text-white">
            <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin" />
            <p className="text-lg">Connecting...</p>
          </div>
        )}
        {callState === "connected" && (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
            <div className="text-center text-white">
              <User className="h-24 w-24 mx-auto mb-2 p-4 bg-white/10 rounded-full" />
              <p className="text-lg font-medium">Specialist Connected</p>
            </div>
            <div className="absolute bottom-4 right-4 w-24 h-18 bg-slate-800 rounded-lg border border-white/20 flex items-center justify-center">
              {isVideoEnabled ? (
                <Camera className="h-6 w-6 text-white/50" />
              ) : (
                <VideoOff className="h-6 w-6 text-red-400" />
              )}
            </div>
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white text-sm font-mono">{formatDuration(duration)}</span>
            </div>
          </>
        )}
        {callState === "ended" && (
          <div className="text-center text-white">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-400" />
            <p className="text-lg">Call Ended</p>
            <p className="text-sm text-slate-400">Duration: {formatDuration(duration)}</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-800 flex items-center justify-center gap-3">
        <Button
          variant={isAudioEnabled ? "secondary" : "destructive"}
          size="icon"
          onClick={onToggleAudio}
        >
          {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>
        <Button
          variant={isVideoEnabled ? "secondary" : "destructive"}
          size="icon"
          onClick={onToggleVideo}
        >
          {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>
        <Button variant="secondary" size="icon" title="Share screen">
          <Monitor className="h-5 w-5" />
        </Button>
        {callState === "idle" || callState === "ended" ? (
          <Button className="bg-success hover:bg-success/90" onClick={onStartCall} disabled={loading}>
            <Phone className="h-5 w-5 mr-2" />
            Start Call
          </Button>
        ) : (
          <Button variant="destructive" onClick={onEndCall}>
            <PhoneOff className="h-5 w-5 mr-2" />
            End Call
          </Button>
        )}
        <Button variant="secondary" size="icon" title="Settings">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

function BoardPane() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
        <Users className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-2">MDT Board Mode</h3>
      <p className="text-sm text-muted-foreground text-center mb-4">
        Multi-participant case review with shared case board and read-only patient context
      </p>
      <Button>
        <Users className="h-4 w-4 mr-2" />
        Start Board Session
      </Button>
    </div>
  );
}

function ResponseNoteForm({ responseDraft, setResponseDraft, consultNotes, setConsultNotes }: any) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label>Clinical Interpretation *</Label>
        <Textarea
          value={responseDraft.clinicalInterpretation}
          onChange={(e) => setResponseDraft({ ...responseDraft, clinicalInterpretation: e.target.value })}
          placeholder="Your clinical interpretation of the case..."
          className="min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Working/Final Diagnosis *</Label>
          <Input
            value={responseDraft.workingDiagnosis}
            onChange={(e) => setResponseDraft({ ...responseDraft, workingDiagnosis: e.target.value })}
            placeholder="Diagnosis"
          />
        </div>
        <div className="space-y-2">
          <Label>ICD-10 Code</Label>
          <Input
            value={responseDraft.diagnosisCode}
            onChange={(e) => setResponseDraft({ ...responseDraft, diagnosisCode: e.target.value })}
            placeholder="e.g., I10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Response to Referrer's Questions</Label>
        <Textarea
          value={responseDraft.responseToQuestions}
          onChange={(e) => setResponseDraft({ ...responseDraft, responseToQuestions: e.target.value })}
          placeholder="Address the specific clinical questions asked..."
        />
      </div>

      <div className="space-y-2">
        <Label>Action Plan *</Label>
        <Textarea
          value={responseDraft.actionPlan}
          onChange={(e) => setResponseDraft({ ...responseDraft, actionPlan: e.target.value })}
          placeholder="Recommended management plan..."
          className="min-h-[100px]"
        />
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="font-medium">Follow-Up Instructions</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Timeframe</Label>
            <Select
              value={responseDraft.followUp.timeframe}
              onValueChange={(v) => setResponseDraft({
                ...responseDraft,
                followUp: { ...responseDraft.followUp, timeframe: v }
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
            <Label>Mode</Label>
            <Select
              value={responseDraft.followUp.mode}
              onValueChange={(v) => setResponseDraft({
                ...responseDraft,
                followUp: { ...responseDraft.followUp, mode: v }
              })}
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
          <Textarea
            value={responseDraft.followUp.instructions}
            onChange={(e) => setResponseDraft({
              ...responseDraft,
              followUp: { ...responseDraft.followUp, instructions: e.target.value }
            })}
            placeholder="Specific follow-up instructions..."
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Session Notes</Label>
        <Textarea
          value={consultNotes}
          onChange={(e) => setConsultNotes(e.target.value)}
          placeholder="Key points from the consultation..."
          rows={4}
        />
      </div>
    </div>
  );
}

function InformationPane({ patientContext }: any) {
  return (
    <Tabs defaultValue="patient" className="flex-1 flex flex-col">
      <TabsList className="w-full justify-start px-3 pt-3 h-auto flex-wrap">
        <TabsTrigger value="patient" className="text-xs">Patient</TabsTrigger>
        <TabsTrigger value="visit" className="text-xs">Visit</TabsTrigger>
        <TabsTrigger value="attachments" className="text-xs">Files</TabsTrigger>
        <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
      </TabsList>

      <TabsContent value="patient" className="flex-1 p-3 m-0 overflow-auto">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{patientContext?.patientName || "Patient"}</CardTitle>
            <CardDescription>
              {patientContext?.demographics?.age || "N/A"} {patientContext?.demographics?.sex || ""} • {patientContext?.mrn || "No MRN"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Allergies</p>
              <p className="font-medium">{patientContext?.allergies?.join(", ") || "No known allergies"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Active Conditions</p>
              <p className="font-medium">{patientContext?.conditions?.join(", ") || "None documented"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Current Medications</p>
              <p className="font-medium">{patientContext?.medications?.join(", ") || "None"}</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="visit" className="flex-1 p-3 m-0 overflow-auto">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Current Visit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Chief Complaint</p>
              <p className="font-medium">{patientContext?.chiefComplaint || "Not documented"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Working Diagnosis</p>
              <p className="font-medium">{patientContext?.diagnosis || "Pending"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Recent Vitals</p>
              <p className="font-medium">BP: 130/85 | HR: 78 | Temp: 36.8°C</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="attachments" className="flex-1 p-3 m-0 overflow-auto">
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50 cursor-pointer">
            <FileImage className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">ECG - Today</span>
          </div>
          <div className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50 cursor-pointer">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Lab Results</span>
          </div>
          <div className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50 cursor-pointer">
            <Image className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Chest X-Ray</span>
          </div>
          <Button variant="outline" size="sm" className="w-full mt-2">
            <Paperclip className="h-4 w-4 mr-1" />
            Add Attachment
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="timeline" className="flex-1 p-3 m-0 overflow-auto">
        <div className="space-y-3">
          {[
            { time: "10:30", event: "Consultation requested", actor: "Dr. Smith" },
            { time: "10:32", event: "Assigned to Cardiology pool", actor: "System" },
            { time: "10:45", event: "Accepted by specialist", actor: "Dr. Chen" },
            { time: "10:50", event: "Session started", actor: "System" },
          ].map((item, idx) => (
            <div key={idx} className="flex gap-3 text-sm">
              <span className="text-muted-foreground w-12">{item.time}</span>
              <div className="flex-1">
                <p>{item.event}</p>
                <p className="text-xs text-muted-foreground">{item.actor}</p>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function CompletionStage({ consultNotes, setConsultNotes, recommendations, setRecommendations, duration, formatDuration }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success" />
          Stage 7: Consultation Complete
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Consultant</p>
            <p className="font-medium">Dr. Sarah Chen</p>
            <p className="text-sm text-muted-foreground">Cardiology</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="font-medium">{formatDuration(duration)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date/Time</p>
            <p className="font-medium">{new Date().toLocaleDateString()}</p>
            <p className="text-sm text-muted-foreground">{new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Session Notes</Label>
          <Textarea
            value={consultNotes}
            onChange={(e) => setConsultNotes(e.target.value)}
            rows={4}
            placeholder="Summary of consultation discussion..."
          />
        </div>

        <div className="space-y-2">
          <Label>Consultant Recommendations</Label>
          <Textarea
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
            rows={4}
            placeholder="Specialist recommendations and follow-up actions..."
          />
        </div>

        <div className="space-y-2">
          <Label>Follow-up Required</Label>
          <Select defaultValue="none">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No follow-up needed</SelectItem>
              <SelectItem value="phone">Phone follow-up in 1 week</SelectItem>
              <SelectItem value="video">Video follow-up in 2 weeks</SelectItem>
              <SelectItem value="inperson">In-person appointment</SelectItem>
              <SelectItem value="transfer">Transfer care to specialist</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline">Save as Draft</Button>
          <Button>
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Complete & Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
