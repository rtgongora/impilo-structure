import { useState } from "react";
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
} from "lucide-react";

interface ConsultRequest {
  id: string;
  specialty: string;
  urgency: "routine" | "urgent" | "stat";
  reason: string;
  clinicalQuestion: string;
  attachments: string[];
}

export function TeleconsultationWorkspace() {
  const [activeTab, setActiveTab] = useState("preparation");
  const [callStatus, setCallStatus] = useState<"idle" | "connecting" | "connected" | "ended">("idle");
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [consultRequest, setConsultRequest] = useState<Partial<ConsultRequest>>({
    urgency: "routine",
    attachments: [],
  });
  const [consultNotes, setConsultNotes] = useState("");
  const [recommendations, setRecommendations] = useState("");

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

  const handleStartCall = () => {
    setCallStatus("connecting");
    setTimeout(() => setCallStatus("connected"), 2000);
  };

  const handleEndCall = () => {
    setCallStatus("ended");
    setActiveTab("completion");
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="preparation">1. Preparation</TabsTrigger>
          <TabsTrigger value="referral">2. Referral Package</TabsTrigger>
          <TabsTrigger value="session">3. Live Session</TabsTrigger>
          <TabsTrigger value="completion">4. Completion</TabsTrigger>
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
            <Button onClick={() => setActiveTab("referral")}>
              Continue to Referral Package
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
                <Checkbox id="consent" />
                <Label htmlFor="consent" className="text-sm">
                  Patient has consented to teleconsultation and data sharing with the specialist
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab("preparation")}>
              Back
            </Button>
            <Button onClick={() => setActiveTab("session")}>
              <Send className="h-4 w-4 mr-1" />
              Submit & Request Session
            </Button>
          </div>
        </TabsContent>

        {/* LIVE SESSION TAB */}
        <TabsContent value="session" className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Video Area */}
            <div className="col-span-2 space-y-4">
              <Card className="overflow-hidden">
                <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                  {callStatus === "idle" && (
                    <div className="text-center text-white">
                      <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Ready to connect</p>
                      <p className="text-sm text-slate-400">Click Start Call to begin</p>
                    </div>
                  )}
                  {callStatus === "connecting" && (
                    <div className="text-center text-white">
                      <div className="animate-pulse">
                        <Phone className="h-16 w-16 mx-auto mb-4" />
                        <p className="text-lg">Connecting...</p>
                      </div>
                    </div>
                  )}
                  {callStatus === "connected" && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                      <div className="text-center text-white">
                        <User className="h-24 w-24 mx-auto mb-2 p-4 bg-white/10 rounded-full" />
                        <p className="text-lg font-medium">Dr. Sarah Chen</p>
                        <p className="text-sm text-slate-300">Cardiology Consultant</p>
                      </div>
                      {/* Self-view */}
                      <div className="absolute bottom-4 right-4 w-32 h-24 bg-slate-800 rounded-lg border-2 border-white/20">
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="h-6 w-6 text-white/50" />
                        </div>
                      </div>
                      {/* Call timer */}
                      <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-white text-sm font-mono">12:34</span>
                      </div>
                    </>
                  )}
                  {callStatus === "ended" && (
                    <div className="text-center text-white">
                      <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-400" />
                      <p className="text-lg">Call Ended</p>
                      <p className="text-sm text-slate-400">Duration: 15:42</p>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-slate-800 flex items-center justify-center gap-4">
                  <Button
                    variant={audioEnabled ? "secondary" : "destructive"}
                    size="icon"
                    onClick={() => setAudioEnabled(!audioEnabled)}
                  >
                    {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant={videoEnabled ? "secondary" : "destructive"}
                    size="icon"
                    onClick={() => setVideoEnabled(!videoEnabled)}
                  >
                    {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>
                  <Button variant="secondary" size="icon">
                    <Monitor className="h-5 w-5" />
                  </Button>
                  {callStatus === "idle" || callStatus === "ended" ? (
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
        </TabsContent>
      </Tabs>
    </div>
  );
}