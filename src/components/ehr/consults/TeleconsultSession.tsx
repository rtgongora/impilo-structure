import { useState } from "react";
import {
  MessageSquare,
  Phone,
  Video,
  Users,
  FileText,
  Send,
  Paperclip,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { WorklistItem } from "@/contexts/ProviderContext";
import { VideoCallPanel } from "./VideoCallPanel";
import { useWebRTC } from "@/hooks/useWebRTC";

// Stage 5: Teleconsultation Session
interface ChatMessage {
  id: string;
  sender: string;
  senderRole: string;
  content: string;
  timestamp: Date;
  type: "text" | "system" | "attachment";
  attachmentUrl?: string;
}

interface ResponseDraft {
  clinicalInterpretation: string;
  workingDiagnosis: string;
  diagnosisCode: string;
  responseToQuestions: string;
  labInterpretation: string;
  imagingInterpretation: string;
  redFlags: string[];
  actionPlan: string;
  escalationRules: string;
  orders: {
    medications: string[];
    labs: string[];
    imaging: string[];
    procedures: string[];
    monitoring: string[];
  };
  followUp: {
    timeframe: string;
    mode: string;
    instructions: string;
    riskNotes: string;
  };
}

interface TeleconsultSessionProps {
  referral: WorklistItem;
  onSubmitResponse?: (response: ResponseDraft) => void;
  onClose?: () => void;
}

export function TeleconsultSession({ referral, onSubmitResponse, onClose }: TeleconsultSessionProps) {
  const [activeMode, setActiveMode] = useState<"chat" | "call" | "board">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: referral.fromClinician,
      senderRole: "Referring Clinician",
      content: `Requesting consultation for ${referral.patientName}. ${referral.chiefComplaint}`,
      timestamp: referral.createdAt,
      type: "text",
    },
    {
      id: "2",
      sender: "System",
      senderRole: "System",
      content: "Consultation accepted by Dr. J. Mwangi",
      timestamp: new Date(referral.createdAt.getTime() + 30 * 60 * 1000),
      type: "system",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [responseDraft, setResponseDraft] = useState<ResponseDraft>({
    clinicalInterpretation: "",
    workingDiagnosis: "",
    diagnosisCode: "",
    responseToQuestions: "",
    labInterpretation: "",
    imagingInterpretation: "",
    redFlags: [],
    actionPlan: "",
    escalationRules: "",
    orders: {
      medications: [],
      labs: [],
      imaging: [],
      procedures: [],
      monitoring: [],
    },
    followUp: {
      timeframe: "",
      mode: "",
      instructions: "",
      riskNotes: "",
    },
  });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // WebRTC hook for real-time video/audio
  const {
    callState,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    remoteParticipant,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useWebRTC({
    participantId: "dr-consultant-001", // Would come from auth context in production
    referralId: referral.id,
  });

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: "Dr. J. Mwangi",
      senderRole: "Consultant",
      content: newMessage,
      timestamp: new Date(),
      type: "text",
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage("");
  };

  const autoSave = () => {
    setLastSaved(new Date());
    // In real implementation, this would save to backend
  };

  const handleSubmitResponse = () => {
    onSubmitResponse?.(responseDraft);
    toast.success("Response submitted successfully");
  };

  const handleStartCall = async (audio: boolean, video: boolean) => {
    setActiveMode("call");
    await startCall(audio, video);
  };

  const handleEndCall = async () => {
    await endCall();
    setActiveMode("chat");
  };

  const isCallActive = callState === "connecting" || callState === "connected";

  return (
    <div className="h-full flex">
      {/* LEFT PANE: Communication */}
      <div className="w-96 border-r flex flex-col">
        <div className="p-3 border-b">
          <h3 className="font-semibold">Communication</h3>
          <div className="flex gap-1 mt-2">
            <Button
              variant={activeMode === "chat" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveMode("chat")}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button
              variant={activeMode === "call" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveMode("call")}
            >
              <Video className="w-4 h-4" />
            </Button>
            <Button
              variant={activeMode === "board" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveMode("board")}
            >
              <Users className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Video Call Panel (when in call mode) */}
        {activeMode === "call" && (
          <div className="flex-1 flex flex-col">
            <VideoCallPanel
              callState={callState}
              localStream={localStream}
              remoteStream={remoteStream}
              isMuted={isMuted}
              isVideoOff={isVideoOff}
              remoteParticipant={remoteParticipant}
              onStartCall={handleStartCall}
              onEndCall={handleEndCall}
              onToggleMute={toggleMute}
              onToggleVideo={toggleVideo}
            />
          </div>
        )}

        {/* Chat Messages (when in chat mode) */}
        {activeMode === "chat" && (
          <>
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "rounded-lg p-3",
                      msg.type === "system" && "bg-muted/50 text-center text-sm text-muted-foreground",
                      msg.type === "text" && msg.sender === "Dr. J. Mwangi" && "bg-primary/10 ml-4",
                      msg.type === "text" && msg.sender !== "Dr. J. Mwangi" && "bg-muted mr-4"
                    )}
                  >
                    {msg.type !== "system" && (
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {msg.sender.split(" ").map(n => n[0]).join("")}
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

            {/* Message Input */}
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="shrink-0">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                />
                <Button onClick={sendMessage} size="icon" className="shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Active Call Indicator (when in chat but call is active) */}
        {activeMode === "chat" && isCallActive && (
          <div 
            className="p-3 bg-success/10 border-t cursor-pointer hover:bg-success/20"
            onClick={() => setActiveMode("call")}
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
      </div>

      {/* CENTER PANE: Response Note Draft */}
      <div className="flex-1 flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Response Note Draft</h3>
            {lastSaved && (
              <p className="text-xs text-muted-foreground">
                Last saved: {format(lastSaved, "HH:mm:ss")}
              </p>
            )}
          </div>
          <Button onClick={handleSubmitResponse}>
            <Send className="w-4 h-4 mr-2" />
            Submit Response
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6 max-w-2xl">
            <div className="space-y-2">
              <Label>Clinical Interpretation *</Label>
              <Textarea
                value={responseDraft.clinicalInterpretation}
                onChange={(e) => {
                  setResponseDraft(prev => ({ ...prev, clinicalInterpretation: e.target.value }));
                  autoSave();
                }}
                placeholder="Your clinical interpretation of the case..."
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Working/Final Diagnosis *</Label>
                <Input
                  value={responseDraft.workingDiagnosis}
                  onChange={(e) => {
                    setResponseDraft(prev => ({ ...prev, workingDiagnosis: e.target.value }));
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
                    setResponseDraft(prev => ({ ...prev, diagnosisCode: e.target.value }));
                    autoSave();
                  }}
                  placeholder="e.g., I10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Response to Referrer's Questions</Label>
              <Textarea
                value={responseDraft.responseToQuestions}
                onChange={(e) => {
                  setResponseDraft(prev => ({ ...prev, responseToQuestions: e.target.value }));
                  autoSave();
                }}
                placeholder="Address the specific clinical questions asked..."
              />
            </div>

            <div className="space-y-2">
              <Label>Action Plan *</Label>
              <Textarea
                value={responseDraft.actionPlan}
                onChange={(e) => {
                  setResponseDraft(prev => ({ ...prev, actionPlan: e.target.value }));
                  autoSave();
                }}
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
                    onValueChange={(v) => {
                      setResponseDraft(prev => ({
                        ...prev,
                        followUp: { ...prev.followUp, timeframe: v }
                      }));
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
                    value={responseDraft.followUp.mode}
                    onValueChange={(v) => {
                      setResponseDraft(prev => ({
                        ...prev,
                        followUp: { ...prev.followUp, mode: v }
                      }));
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
                <Textarea
                  value={responseDraft.followUp.instructions}
                  onChange={(e) => {
                    setResponseDraft(prev => ({
                      ...prev,
                      followUp: { ...prev.followUp, instructions: e.target.value }
                    }));
                    autoSave();
                  }}
                  placeholder="Specific follow-up instructions..."
                />
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* RIGHT PANE: Information */}
      <div className="w-80 border-l flex flex-col">
        <Tabs defaultValue="patient" className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start px-3 pt-3">
            <TabsTrigger value="patient">Patient</TabsTrigger>
            <TabsTrigger value="visit">Visit</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="patient" className="flex-1 p-3 m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{referral.patientName}</CardTitle>
                <CardDescription>
                  {referral.patientAge}y {referral.patientSex} • {referral.mrn}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Allergies: Penicillin, Sulfa</span>
                </div>
                <Separator />
                <div>
                  <h5 className="font-medium mb-1">Active Problems</h5>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Type 2 Diabetes Mellitus</li>
                    <li>• Essential Hypertension</li>
                    <li>• Chronic Kidney Disease Stage 3</li>
                  </ul>
                </div>
                <Separator />
                <div>
                  <h5 className="font-medium mb-1">Current Medications</h5>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Metformin 500mg BD</li>
                    <li>• Amlodipine 5mg OD</li>
                    <li>• Enalapril 10mg OD</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visit" className="flex-1 p-3 m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Current Visit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Facility:</span>
                  <p className="font-medium">{referral.fromFacility}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Referring Clinician:</span>
                  <p className="font-medium">{referral.fromClinician}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Chief Complaint:</span>
                  <p className="font-medium">{referral.chiefComplaint}</p>
                </div>
                <Separator />
                <div>
                  <span className="text-muted-foreground">Recent Vitals:</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="p-2 bg-muted/50 rounded text-center">
                      <div className="font-bold">152/94</div>
                      <div className="text-xs text-muted-foreground">BP</div>
                    </div>
                    <div className="p-2 bg-muted/50 rounded text-center">
                      <div className="font-bold">88</div>
                      <div className="text-xs text-muted-foreground">HR</div>
                    </div>
                    <div className="p-2 bg-muted/50 rounded text-center">
                      <div className="font-bold">37.2</div>
                      <div className="text-xs text-muted-foreground">Temp</div>
                    </div>
                    <div className="p-2 bg-muted/50 rounded text-center">
                      <div className="font-bold">97%</div>
                      <div className="text-xs text-muted-foreground">SpO2</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attachments" className="flex-1 p-3 m-0">
            <div className="space-y-2">
              <Card className="cursor-pointer hover:bg-muted/50">
                <CardContent className="p-3 flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium text-sm">ECG Report.pdf</p>
                    <p className="text-xs text-muted-foreground">245 KB • 2 hours ago</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-muted/50">
                <CardContent className="p-3 flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Lab Results.pdf</p>
                    <p className="text-xs text-muted-foreground">128 KB • 4 hours ago</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="flex-1 p-3 m-0">
            <div className="space-y-3">
              {[
                { time: "10:30", event: "Referral received", status: "done" },
                { time: "10:45", event: "Accepted by Dr. Mwangi", status: "done" },
                { time: "11:00", event: "Chat session started", status: "done" },
                { time: "11:15", event: "Audio call (5 min)", status: "done" },
                { time: "Now", event: "Drafting response", status: "current" },
                { time: "—", event: "Submit response", status: "pending" },
                { time: "—", event: "Completion note", status: "pending" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-2",
                    item.status === "done" && "bg-success",
                    item.status === "current" && "bg-primary animate-pulse",
                    item.status === "pending" && "bg-muted"
                  )} />
                  <div>
                    <p className="text-sm font-medium">{item.event}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
