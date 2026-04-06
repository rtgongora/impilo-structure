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
  User,
  Clock,
  CheckCircle2,
  Heart,
  Thermometer,
  Activity,
  Pill,
  Stethoscope,
  Camera,
  Settings,
  ClipboardList,
  Send,
  Calendar,
} from "lucide-react";

interface VitalSigns {
  bloodPressure?: string;
  heartRate?: string;
  temperature?: string;
  respiratoryRate?: string;
  oxygenSaturation?: string;
  weight?: string;
}

export function VirtualCareWorkspace() {
  const [activeTab, setActiveTab] = useState("waitingroom");
  const [callStatus, setCallStatus] = useState<"idle" | "connecting" | "connected" | "ended">("idle");
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [vitals, setVitals] = useState<VitalSigns>({});
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");

  const waitingPatients = [
    { id: "1", name: "John Smith", time: "09:00", reason: "Follow-up", status: "checked-in", wait: "5 min" },
    { id: "2", name: "Mary Johnson", time: "09:15", reason: "Medication review", status: "ready", wait: "12 min" },
    { id: "3", name: "Robert Davis", time: "09:30", reason: "New symptoms", status: "pending", wait: "0 min" },
  ];

  const handleStartCall = () => {
    setCallStatus("connecting");
    setTimeout(() => {
      setCallStatus("connected");
      setActiveTab("consultation");
    }, 2000);
  };

  const handleEndCall = () => {
    setCallStatus("ended");
    setActiveTab("documentation");
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="waitingroom">Waiting Room</TabsTrigger>
          <TabsTrigger value="previsit">Pre-Visit</TabsTrigger>
          <TabsTrigger value="consultation">Consultation</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        {/* WAITING ROOM TAB */}
        <TabsContent value="waitingroom" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Virtual Waiting Room
                </div>
                <Badge variant="outline">3 patients waiting</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {waitingPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-primary transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {patient.time} • {patient.reason}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge
                          variant={
                            patient.status === "ready"
                              ? "default"
                              : patient.status === "checked-in"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {patient.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">Wait: {patient.wait}</p>
                      </div>
                      <Button
                        size="sm"
                        disabled={patient.status === "pending"}
                        onClick={() => {
                          setActiveTab("previsit");
                        }}
                      >
                        <Video className="h-4 w-4 mr-1" />
                        Start Visit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="text-2xl font-bold text-primary">12</p>
                  <p className="text-sm text-muted-foreground">Total Visits</p>
                </div>
                <div className="p-3 bg-green-500/5 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">5</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <div className="p-3 bg-amber-500/5 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">3</p>
                  <p className="text-sm text-muted-foreground">Waiting</p>
                </div>
                <div className="p-3 bg-slate-500/5 rounded-lg">
                  <p className="text-2xl font-bold text-slate-600">4</p>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRE-VISIT TAB */}
        <TabsContent value="previsit" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">Mary Johnson</p>
                    <p className="text-sm text-muted-foreground">DOB: 15 Mar 1965 (59 years)</p>
                    <p className="text-sm text-muted-foreground">MRN: PAT-2024-001234</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recent Diagnoses</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Type 2 Diabetes</Badge>
                    <Badge variant="outline">Hypertension</Badge>
                    <Badge variant="outline">Hyperlipidemia</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Current Medications</p>
                  <div className="text-sm space-y-1">
                    <p>• Metformin 500mg BD</p>
                    <p>• Amlodipine 5mg OD</p>
                    <p>• Atorvastatin 20mg ON</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Patient-Reported Vitals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ask patient to report vitals if available
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Blood Pressure</Label>
                    <Input
                      placeholder="e.g., 120/80"
                      value={vitals.bloodPressure || ""}
                      onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Heart Rate</Label>
                    <Input
                      placeholder="bpm"
                      value={vitals.heartRate || ""}
                      onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Temperature</Label>
                    <Input
                      placeholder="°C"
                      value={vitals.temperature || ""}
                      onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight</Label>
                    <Input
                      placeholder="kg"
                      value={vitals.weight || ""}
                      onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Pre-Visit Questionnaire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Chief Complaint / Reason for Visit</Label>
                <Textarea
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="What is the main reason for today's visit?"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="tech-check" defaultChecked />
                <Label htmlFor="tech-check" className="text-sm">
                  Audio/video connection tested and working
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleStartCall}>
              <Video className="h-4 w-4 mr-2" />
              Connect to Patient
            </Button>
          </div>
        </TabsContent>

        {/* CONSULTATION TAB */}
        <TabsContent value="consultation" className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Video Area */}
            <div className="col-span-2">
              <Card className="overflow-hidden">
                <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                  {callStatus === "connecting" && (
                    <div className="text-center text-white animate-pulse">
                      <Phone className="h-16 w-16 mx-auto mb-4" />
                      <p className="text-lg">Connecting to patient...</p>
                    </div>
                  )}
                  {callStatus === "connected" && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                      <div className="text-center text-white">
                        <User className="h-24 w-24 mx-auto mb-2 p-4 bg-white/10 rounded-full" />
                        <p className="text-lg font-medium">Mary Johnson</p>
                        <p className="text-sm text-slate-300">Patient</p>
                      </div>
                      {/* Self-view */}
                      <div className="absolute bottom-4 right-4 w-32 h-24 bg-slate-800 rounded-lg border-2 border-white/20">
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="h-6 w-6 text-white/50" />
                        </div>
                      </div>
                      {/* Call timer */}
                      <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-white text-sm font-mono">08:45</span>
                      </div>
                    </>
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
                  <Button variant="destructive" onClick={handleEndCall}>
                    <PhoneOff className="h-5 w-5 mr-2" />
                    End Visit
                  </Button>
                  <Button variant="secondary" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Quick Reference</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-medium text-amber-800">Allergies</p>
                    <p className="text-sm text-amber-700">Penicillin (rash)</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground">Last Visit</p>
                    <p className="text-sm">3 months ago - DM follow-up</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground">Last HbA1c</p>
                    <p className="text-sm">7.2% (2 months ago)</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Live Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    className="resize-none"
                    rows={6}
                    placeholder="Document consultation..."
                    value={assessment}
                    onChange={(e) => setAssessment(e.target.value)}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* DOCUMENTATION TAB */}
        <TabsContent value="documentation" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Visit Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Patient</p>
                  <p className="font-medium">Mary Johnson</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Visit Duration</p>
                  <p className="font-medium">12 minutes</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Visit Type</p>
                  <p className="font-medium">Follow-up / Medication Review</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subjective</Label>
                <Textarea
                  defaultValue={chiefComplaint}
                  rows={2}
                  placeholder="Patient's reported symptoms and history..."
                />
              </div>

              <div className="space-y-2">
                <Label>Objective</Label>
                <Textarea
                  defaultValue={vitals.bloodPressure ? `BP: ${vitals.bloodPressure}` : ""}
                  rows={2}
                  placeholder="Vital signs and observations..."
                />
              </div>

              <div className="space-y-2">
                <Label>Assessment</Label>
                <Textarea
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  rows={3}
                  placeholder="Clinical assessment and diagnosis..."
                />
              </div>

              <div className="space-y-2">
                <Label>Plan</Label>
                <Textarea
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  rows={3}
                  placeholder="Treatment plan, orders, and follow-up..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Follow-up</Label>
                  <Select defaultValue="3months">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1week">1 Week</SelectItem>
                      <SelectItem value="2weeks">2 Weeks</SelectItem>
                      <SelectItem value="1month">1 Month</SelectItem>
                      <SelectItem value="3months">3 Months</SelectItem>
                      <SelectItem value="prn">As Needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Visit Mode</Label>
                  <Select defaultValue="virtual">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="virtual">Virtual Visit</SelectItem>
                      <SelectItem value="inperson">In-Person</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attached Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Visit Documents
                </span>
                <ClinicalDocumentScanner
                  variant="button"
                  context="teleconsult"
                  onDocumentScanned={() => {}}
                  buttonLabel="Scan"
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PatientDocumentsPanel patientId="virtual-patient" compact={true} />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline">
              <Pill className="h-4 w-4 mr-1" />
              New Prescription
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-1" />
              Order Labs
            </Button>
            <Button>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Sign & Complete
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}