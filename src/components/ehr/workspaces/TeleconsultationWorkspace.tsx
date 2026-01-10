import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { useTeleconsultation, TeleconsultSession } from "@/hooks/useTeleconsultation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ConsultRequest {
  id: string;
  specialty: string;
  urgency: "routine" | "urgent" | "stat";
  reason: string;
  clinicalQuestion: string;
  attachments: string[];
}

const WORKFLOW_STAGES = [
  { stage: 1, label: "Referral Request", icon: FileText },
  { stage: 2, label: "Package Building", icon: Paperclip },
  { stage: 3, label: "Routing & Consent", icon: ClipboardCheck },
  { stage: 4, label: "Waiting Room", icon: Users },
  { stage: 5, label: "Live Session", icon: Video },
  { stage: 6, label: "Response Note", icon: FileCheck },
  { stage: 7, label: "Completion", icon: CheckCircle2 },
];

export function TeleconsultationWorkspace() {
  const { user } = useAuth();
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

  const [consultRequest, setConsultRequest] = useState<Partial<ConsultRequest>>({
    urgency: "routine",
    attachments: [],
  });
  const [consultNotes, setConsultNotes] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [duration, setDuration] = useState(0);

  const currentStage = session?.workflow_stage || 1;
  const activeTab = getTabFromStage(currentStage);
  const callState = connectionState === 'connected' ? 'connected' : 
                    connectionState === 'connecting' ? 'connecting' : 
                    session?.session_ended_at ? 'ended' : 'idle';

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

  function getTabFromStage(stage: number): string {
    if (stage <= 2) return "preparation";
    if (stage === 3) return "referral";
    if (stage === 4) return "waiting";
    if (stage === 5) return "session";
    if (stage === 6) return "response";
    return "completion";
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  const specialties = [
    "Cardiology",
    "Dermatology",
    "Endocrinology",
    "Gastroenterology",
    "Infectious Disease",
    "Nephrology",
    "Neurology",
    "Oncology",
    "Pulmonology",
    "Rheumatology",
    "Psychiatry",
    "Radiology",
    "Surgery",
  ];

  const handleCreateSession = async () => {
    if (!consultRequest.specialty || !consultRequest.reason) {
      toast.error("Please fill in specialty and reason");
      return;
    }
    // Create session with specialty as the argument, then update with additional details
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

  const handleStartCall = async () => {
    if (!session) return;
    await startVideoCall(true); // true = initiator
  };

  const handleEndCall = async () => {
    await endVideoCall();
  };

  const handleAdvanceToCompletion = async () => {
    await advanceStage();
  };

  return (
    <div className="space-y-6">
      {/* 7-Stage Progress Indicator */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Consultation Workflow</span>
            <Badge variant={session ? "default" : "secondary"}>
              {session ? `Stage ${currentStage} of 7` : "New Consultation"}
            </Badge>
          </div>
          <Progress value={(currentStage / 7) * 100} className="h-2 mb-4" />
          <div className="flex justify-between">
            {WORKFLOW_STAGES.map(({ stage, label, icon: Icon }) => (
              <div
                key={stage}
                className={`flex flex-col items-center gap-1 ${
                  stage === currentStage
                    ? "text-primary"
                    : stage < currentStage
                    ? "text-green-600"
                    : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    stage === currentStage
                      ? "bg-primary text-primary-foreground"
                      : stage < currentStage
                      ? "bg-green-100 dark:bg-green-900"
                      : "bg-muted"
                  }`}
                >
                  {stage < currentStage ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span className="text-xs text-center hidden md:block">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="preparation" disabled={currentStage > 2}>Preparation</TabsTrigger>
          <TabsTrigger value="referral" disabled={currentStage < 2 || currentStage > 3}>Referral</TabsTrigger>
          <TabsTrigger value="waiting" disabled={currentStage < 4 || currentStage > 4}>Waiting</TabsTrigger>
          <TabsTrigger value="session" disabled={currentStage < 5 || currentStage > 5}>Session</TabsTrigger>
          <TabsTrigger value="response" disabled={currentStage < 6 || currentStage > 6}>Response</TabsTrigger>
          <TabsTrigger value="completion" disabled={currentStage < 7}>Complete</TabsTrigger>
        </TabsList>

        {/* PREPARATION TAB */}
        <TabsContent value="preparation" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Consultation Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Specialty Required</Label>
                  <Select
                    value={consultRequest.specialty}
                    onValueChange={(v) => setConsultRequest({ ...consultRequest, specialty: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((s) => (
                        <SelectItem key={s} value={s.toLowerCase()}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Urgency</Label>
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
                <Label>Reason for Consultation</Label>
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
                  <p className="font-medium">Male, 58 years</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Chief Complaint</p>
                  <p className="font-medium">Chest pain, shortness of breath</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Working Diagnosis</p>
                  <p className="font-medium">ACS - NSTEMI</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Key History</p>
                <p className="text-sm">HTN, DM2, Previous MI (2019), Smoker 40 pack-years</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleCreateSession} disabled={loading}>
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
        </TabsContent>

        {/* REFERRAL PACKAGE TAB */}
        <TabsContent value="referral" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Referral Package
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Referral Letter</Label>
                <Textarea
                  placeholder="Compose referral letter with clinical context..."
                  rows={6}
                  defaultValue={`Dear Colleague,

I am referring this 58-year-old male patient with suspected NSTEMI for your expert opinion.

${consultRequest.clinicalQuestion || ""}

Thank you for your assistance.`}
                />
              </div>

              <div className="space-y-3">
                <Label>Attachments</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "ECG - Today", type: "image" },
                    { name: "Troponin Results", type: "lab" },
                    { name: "Chest X-Ray", type: "image" },
                    { name: "Previous Echo (2023)", type: "report" },
                  ].map((doc) => (
                    <div
                      key={doc.name}
                      className="flex items-center gap-2 p-3 border rounded-lg"
                    >
                      <Checkbox defaultChecked />
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

              <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <Checkbox 
                  id="consent" 
                  checked={consentChecked || session?.consent_obtained}
                  onCheckedChange={() => handleCaptureConsent()}
                />
                <Label htmlFor="consent" className="text-sm">
                  Patient has consented to teleconsultation and data sharing with the specialist
                </Label>
                {session?.consent_obtained && (
                  <Badge variant="outline" className="ml-auto text-green-600">
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
              onClick={handleJoinWaitingRoom} 
              disabled={!session?.consent_obtained || loading}
            >
              <Send className="h-4 w-4 mr-1" />
              Submit & Join Waiting Room
            </Button>
          </div>
        </TabsContent>

        {/* WAITING ROOM TAB */}
        <TabsContent value="waiting" className="space-y-4 mt-4">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Waiting for Specialist</h3>
              <p className="text-muted-foreground mb-4">
                You are in the virtual waiting room. The specialist will join shortly.
              </p>
              <Badge variant="outline" className="text-lg py-1 px-4">
                <Clock className="h-4 w-4 mr-2" />
                Estimated wait: 5-10 minutes
              </Badge>
              <div className="mt-6">
                <Button onClick={handleStartCall} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Video className="h-4 w-4 mr-2" />
                  )}
                  Start Session Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LIVE SESSION TAB */}
        <TabsContent value="session" className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Video Area */}
            <div className="col-span-2 space-y-4">
              <Card className="overflow-hidden">
                <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                  {callState === "idle" && (
                    <div className="text-center text-white">
                      <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Ready to connect</p>
                      <p className="text-sm text-slate-400">Click Start Call to begin</p>
                    </div>
                  )}
                  {callState === "connecting" && (
                    <div className="text-center text-white">
                      <div className="animate-pulse">
                        <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin" />
                        <p className="text-lg">Connecting...</p>
                      </div>
                    </div>
                  )}
                  {callState === "connected" && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                      <div className="text-center text-white">
                        <User className="h-24 w-24 mx-auto mb-2 p-4 bg-white/10 rounded-full" />
                        <p className="text-lg font-medium">Specialist Connected</p>
                        <p className="text-sm text-slate-300">Live Session in Progress</p>
                      </div>
                      {/* Self-view */}
                      <div className="absolute bottom-4 right-4 w-32 h-24 bg-slate-800 rounded-lg border-2 border-white/20">
                        <div className="w-full h-full flex items-center justify-center">
                          {isVideoEnabled ? (
                            <Camera className="h-6 w-6 text-white/50" />
                          ) : (
                            <VideoOff className="h-6 w-6 text-red-400" />
                          )}
                        </div>
                      </div>
                      {/* Call timer */}
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
                <div className="p-4 bg-slate-800 flex items-center justify-center gap-4">
                  <Button
                    variant={isAudioEnabled ? "secondary" : "destructive"}
                    size="icon"
                    onClick={toggleAudio}
                  >
                    {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant={isVideoEnabled ? "secondary" : "destructive"}
                    size="icon"
                    onClick={toggleVideo}
                  >
                    {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>
                  <Button variant="secondary" size="icon">
                    <Monitor className="h-5 w-5" />
                  </Button>
                  {callState === "idle" || callState === "ended" ? (
                    <Button className="bg-green-600 hover:bg-green-700" onClick={handleStartCall}>
                      <Phone className="h-5 w-5 mr-2" />
                      Start Call
                    </Button>
                  ) : (
                    <Button variant="destructive" onClick={handleEndCall}>
                      <PhoneOff className="h-5 w-5 mr-2" />
                      End Call
                    </Button>
                  )}
                  <Button variant="secondary" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </div>
              </Card>
            </div>

            {/* Notes & Chat */}
            <div className="space-y-4">
              <Card className="h-[300px] flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Session Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <Textarea
                    className="flex-1 resize-none"
                    placeholder="Document key points from consultation..."
                    value={consultNotes}
                    onChange={(e) => setConsultNotes(e.target.value)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Share Patient Summary
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Camera className="h-4 w-4 mr-2" />
                    Share Screen/Images
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* COMPLETION TAB */}
        <TabsContent value="completion" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Consultation Complete
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
                  <p className="font-medium">15 minutes 42 seconds</p>
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
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline">Save as Draft</Button>
            <Button>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Complete & Close
            </Button>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleAdvanceToCompletion} disabled={callState === "connected"}>
              Continue to Response Note
            </Button>
          </div>
        </TabsContent>

        {/* RESPONSE NOTE TAB (Stage 6) */}
        <TabsContent value="response" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                Response Note
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Session Summary</Label>
                <Textarea
                  value={consultNotes}
                  onChange={(e) => setConsultNotes(e.target.value)}
                  rows={4}
                  placeholder="Summarize key discussion points from the consultation..."
                />
              </div>

              <div className="space-y-2">
                <Label>Specialist Recommendations</Label>
                <Textarea
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  rows={4}
                  placeholder="Document specialist recommendations and clinical guidance..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Actions Taken</Label>
                  <div className="space-y-2">
                    {["Diagnosis confirmed", "Treatment adjusted", "Further tests ordered", "Referral made"].map((action) => (
                      <div key={action} className="flex items-center gap-2">
                        <Checkbox id={action} />
                        <Label htmlFor={action} className="text-sm">{action}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Outstanding Issues</Label>
                  <Textarea
                    rows={4}
                    placeholder="Any unresolved issues or pending items..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline">Save Draft</Button>
            <Button onClick={handleAdvanceToCompletion}>
              Complete Consultation
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}