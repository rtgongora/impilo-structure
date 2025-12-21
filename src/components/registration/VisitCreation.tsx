import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  FileText,
  AlertTriangle,
  Check,
  ChevronRight,
  Plus,
  Building,
  Phone,
  Fingerprint,
  UserCheck,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

type VisitStep = "search" | "verify" | "details" | "confirm";

interface PatientMatch {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  mrn: string;
  phone: string;
  lastVisit: string;
  matchScore: number;
  biometricVerified?: boolean;
}

const MOCK_PATIENTS: PatientMatch[] = [
  {
    id: "P001",
    name: "Sarah M. Johnson",
    dateOfBirth: "1985-03-15",
    gender: "Female",
    mrn: "MRN-2024-001847",
    phone: "+263 77 123 4567",
    lastVisit: "2024-11-15",
    matchScore: 98,
    biometricVerified: true
  },
  {
    id: "P002",
    name: "Sarah Johnson",
    dateOfBirth: "1987-08-22",
    gender: "Female",
    mrn: "MRN-2024-002156",
    phone: "+263 77 987 6543",
    lastVisit: "2024-10-20",
    matchScore: 75
  },
];

interface VisitData {
  patientId: string;
  visitType: string;
  department: string;
  location: string;
  provider: string;
  appointmentTime: string;
  chiefComplaint: string;
  priority: string;
  referralSource: string;
  insuranceVerified: boolean;
}

const VISIT_TYPES = [
  { id: "opd", label: "Outpatient Visit", icon: User },
  { id: "emergency", label: "Emergency Visit", icon: AlertTriangle },
  { id: "inpatient", label: "Inpatient Admission", icon: Building },
  { id: "followup", label: "Follow-up Visit", icon: Activity },
  { id: "procedure", label: "Procedure/Day Case", icon: Stethoscope },
];

const DEPARTMENTS = [
  "General Medicine",
  "Surgery",
  "Obstetrics & Gynaecology",
  "Paediatrics",
  "Orthopaedics",
  "Cardiology",
  "Neurology",
  "Oncology",
  "Psychiatry",
  "ENT",
  "Ophthalmology",
  "Dermatology",
];

interface VisitCreationProps {
  onComplete?: (visit: VisitData) => void;
  onNewRegistration?: () => void;
}

export function VisitCreation({ onComplete, onNewRegistration }: VisitCreationProps) {
  const [step, setStep] = useState<VisitStep>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"text" | "biometric">("text");
  const [searchResults, setSearchResults] = useState<PatientMatch[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientMatch | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [visitData, setVisitData] = useState<Partial<VisitData>>({
    visitType: "",
    department: "",
    location: "",
    provider: "",
    appointmentTime: new Date().toISOString().slice(0, 16),
    chiefComplaint: "",
    priority: "routine",
    referralSource: "",
    insuranceVerified: false
  });

  const handleSearch = () => {
    // Simulate search
    if (searchQuery.length > 2) {
      setSearchResults(MOCK_PATIENTS);
    } else {
      setSearchResults([]);
    }
  };

  const handleBiometricSearch = () => {
    setIsVerifying(true);
    // Simulate biometric search
    setTimeout(() => {
      setSearchResults(MOCK_PATIENTS.filter(p => p.biometricVerified));
      setIsVerifying(false);
    }, 2000);
  };

  const selectPatient = (patient: PatientMatch) => {
    setSelectedPatient(patient);
    setStep("verify");
  };

  const verifyAndProceed = () => {
    setStep("details");
    setVisitData(prev => ({ ...prev, patientId: selectedPatient?.id }));
  };

  const handleCreateVisit = () => {
    setStep("confirm");
    onComplete?.(visitData as VisitData);
  };

  const renderStep = () => {
    switch (step) {
      case "search":
        return (
          <div className="space-y-6">
            <Tabs value={searchType} onValueChange={(v) => setSearchType(v as "text" | "biometric")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Text Search
                </TabsTrigger>
                <TabsTrigger value="biometric" className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4" />
                  Biometric Lookup
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="Search by name, MRN, phone, or ID number..."
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={handleSearch}>Search</Button>
                </div>
                
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-1 bg-muted rounded">Name</span>
                  <span className="px-2 py-1 bg-muted rounded">MRN</span>
                  <span className="px-2 py-1 bg-muted rounded">Phone</span>
                  <span className="px-2 py-1 bg-muted rounded">National ID</span>
                </div>
              </TabsContent>

              <TabsContent value="biometric" className="mt-4">
                <Card className="text-center py-8">
                  <CardContent>
                    <motion.div
                      className={cn(
                        "w-32 h-32 mx-auto rounded-full border-4 flex items-center justify-center mb-4",
                        isVerifying 
                          ? "border-primary bg-primary/10 animate-pulse" 
                          : "border-muted bg-muted/10"
                      )}
                    >
                      <Fingerprint className={cn(
                        "w-16 h-16",
                        isVerifying ? "text-primary" : "text-muted-foreground"
                      )} />
                    </motion.div>
                    <h4 className="font-medium mb-2">
                      {isVerifying ? "Scanning..." : "Biometric Patient Lookup"}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Place patient's finger on the scanner to search
                    </p>
                    <Button onClick={handleBiometricSearch} disabled={isVerifying}>
                      {isVerifying ? "Searching..." : "Start Scan"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Found {searchResults.length} matching patient(s)
                </h4>
                {searchResults.map((patient) => (
                  <Card 
                    key={patient.id}
                    className={cn(
                      "cursor-pointer transition-all hover:ring-2 hover:ring-primary",
                      selectedPatient?.id === patient.id && "ring-2 ring-primary"
                    )}
                    onClick={() => selectPatient(patient)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{patient.name}</h4>
                              {patient.biometricVerified && (
                                <Badge variant="outline" className="bg-success/10 text-success border-success/50 text-xs">
                                  <Fingerprint className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <span>{patient.mrn}</span>
                              <span>DOB: {patient.dateOfBirth}</span>
                              <span>{patient.gender}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn(
                            "text-lg font-bold",
                            patient.matchScore >= 90 ? "text-success" : 
                            patient.matchScore >= 70 ? "text-warning" : "text-destructive"
                          )}>
                            {patient.matchScore}%
                          </div>
                          <div className="text-xs text-muted-foreground">Match Score</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* No results / New Registration */}
            {searchQuery.length > 2 && searchResults.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-medium mb-2">No matching patients found</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Would you like to register a new patient?
                  </p>
                  <Button onClick={onNewRegistration}>
                    <Plus className="w-4 h-4 mr-2" />
                    Register New Patient
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "verify":
        return (
          <div className="space-y-6">
            <Card className="bg-muted/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{selectedPatient?.name}</h3>
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">MRN:</span>
                        <span className="ml-2 font-medium">{selectedPatient?.mrn}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">DOB:</span>
                        <span className="ml-2 font-medium">{selectedPatient?.dateOfBirth}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gender:</span>
                        <span className="ml-2 font-medium">{selectedPatient?.gender}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="ml-2 font-medium">{selectedPatient?.phone}</span>
                      </div>
                    </div>
                  </div>
                  {selectedPatient?.biometricVerified && (
                    <Badge className="bg-success text-success-foreground">
                      <Check className="w-3 h-3 mr-1" />
                      Identity Verified
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {!selectedPatient?.biometricVerified && (
              <Card className="border-warning/50 bg-warning/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                    <div>
                      <h4 className="font-medium text-warning">Biometric Verification Recommended</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        This patient's identity has not been verified via biometrics in this session.
                        Consider performing a biometric verification for added security.
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        <Fingerprint className="w-4 h-4 mr-2" />
                        Verify Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("search")}>
                Back to Search
              </Button>
              <Button onClick={verifyAndProceed}>
                Confirm & Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        );

      case "details":
        return (
          <div className="space-y-6">
            {/* Visit Type Selection */}
            <div className="space-y-3">
              <Label>Visit Type *</Label>
              <div className="grid grid-cols-5 gap-2">
                {VISIT_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Card
                      key={type.id}
                      className={cn(
                        "cursor-pointer transition-all text-center p-4 hover:ring-2 hover:ring-primary",
                        visitData.visitType === type.id && "ring-2 ring-primary bg-primary/5"
                      )}
                      onClick={() => setVisitData(prev => ({ ...prev, visitType: type.id }))}
                    >
                      <Icon className={cn(
                        "w-8 h-8 mx-auto mb-2",
                        visitData.visitType === type.id ? "text-primary" : "text-muted-foreground"
                      )} />
                      <p className="text-xs font-medium">{type.label}</p>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department *</Label>
                <Select 
                  value={visitData.department} 
                  onValueChange={(v) => setVisitData(prev => ({ ...prev, department: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept.toLowerCase().replace(/\s+/g, "-")}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Select
                  value={visitData.location}
                  onValueChange={(v) => setVisitData(prev => ({ ...prev, location: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main-opd">Main OPD</SelectItem>
                    <SelectItem value="emergency">Emergency Department</SelectItem>
                    <SelectItem value="specialist-clinic">Specialist Clinic</SelectItem>
                    <SelectItem value="ward-4a">Ward 4A</SelectItem>
                    <SelectItem value="ward-4b">Ward 4B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Attending Provider</Label>
                <Select
                  value={visitData.provider}
                  onValueChange={(v) => setVisitData(prev => ({ ...prev, provider: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dr-mwangi">Dr. James Mwangi</SelectItem>
                    <SelectItem value="dr-moyo">Dr. Tendai Moyo</SelectItem>
                    <SelectItem value="dr-ndlovu">Dr. Sibongile Ndlovu</SelectItem>
                    <SelectItem value="dr-chikwava">Dr. Peter Chikwava</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Appointment Time *</Label>
                <Input
                  type="datetime-local"
                  value={visitData.appointmentTime}
                  onChange={(e) => setVisitData(prev => ({ ...prev, appointmentTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Chief Complaint / Reason for Visit *</Label>
              <Textarea
                value={visitData.chiefComplaint}
                onChange={(e) => setVisitData(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                placeholder="Describe the main reason for this visit..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <RadioGroup
                value={visitData.priority}
                onValueChange={(v) => setVisitData(prev => ({ ...prev, priority: v }))}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="routine" id="routine" />
                  <Label htmlFor="routine" className="cursor-pointer">Routine</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="urgent" id="urgent" />
                  <Label htmlFor="urgent" className="cursor-pointer text-warning">Urgent</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="emergency" id="emergency-priority" />
                  <Label htmlFor="emergency-priority" className="cursor-pointer text-destructive">Emergency</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("verify")}>
                Back
              </Button>
              <Button onClick={handleCreateVisit}>
                Create Visit
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        );

      case "confirm":
        return (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-10 h-10 text-success" />
            </motion.div>
            <h3 className="text-2xl font-bold mb-2">Visit Created Successfully</h3>
            <p className="text-muted-foreground mb-6">
              {selectedPatient?.name} has been checked in for a{" "}
              {VISIT_TYPES.find(t => t.id === visitData.visitType)?.label || "visit"}.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setStep("search")}>
                Create Another Visit
              </Button>
              <Button>
                <FileText className="w-4 h-4 mr-2" />
                Open Encounter
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step Indicator */}
      {step !== "confirm" && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {["search", "verify", "details"].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                step === s && "bg-primary text-primary-foreground",
                (["search", "verify", "details"].indexOf(step) > i) && "bg-success text-success-foreground",
                (["search", "verify", "details"].indexOf(step) < i) && "bg-muted text-muted-foreground"
              )}>
                {["search", "verify", "details"].indexOf(step) > i ? (
                  <Check className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && (
                <div className={cn(
                  "w-16 h-0.5 mx-2",
                  ["search", "verify", "details"].indexOf(step) > i ? "bg-success" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {step === "search" && "Find Patient"}
            {step === "verify" && "Verify Patient Identity"}
            {step === "details" && "Visit Details"}
            {step === "confirm" && "Confirmation"}
          </CardTitle>
          <CardDescription>
            {step === "search" && "Search for an existing patient or register a new one"}
            {step === "verify" && "Confirm patient identity before creating visit"}
            {step === "details" && "Enter visit type and clinical details"}
            {step === "confirm" && "Visit has been successfully created"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
