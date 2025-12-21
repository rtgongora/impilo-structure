import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  FileText,
  User,
  Paperclip,
  Route,
  Shield,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Search,
  Building,
  Users,
  Calendar,
  Clock,
  Plus,
  X,
  Upload,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useEHR } from "@/contexts/EHRContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Stage 1 & 2: Building the Referral Package
type ReferralStep = "letter" | "patient-summary" | "visit-summary" | "attachments" | "routing" | "consent";

interface ReferralPackage {
  // Step 1: Referral Letter
  letterContent: string;
  presentingProblems: string[];
  clinicalQuestion: string;
  urgency: "routine" | "urgent" | "stat" | "emergency";
  
  // Step 2: Patient Summary (auto-generated)
  patientSummary: {
    demographics: boolean;
    allergies: boolean;
    medications: boolean;
    problems: boolean;
    vitals: boolean;
  };
  
  // Step 3: Visit Summary (auto-generated)
  visitSummary: {
    currentVisit: boolean;
    recentLabs: boolean;
    recentImaging: boolean;
    recentNotes: boolean;
  };
  
  // Step 4: Attachments
  attachments: { id: string; name: string; type: string; size: number }[];
  
  // Step 5: Routing
  routingType: "practitioner" | "workspace" | "on-call" | "unit" | "facility-service" | "pool";
  routingTarget: string;
  routingTargetName: string;
  
  // Step 6: Consent
  consentType: "digital" | "verbal" | "proxy" | "emergency";
  consentObtained: boolean;
  consentToken?: string;
}

const STEPS: { id: ReferralStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "letter", label: "Referral Letter", icon: FileText },
  { id: "patient-summary", label: "Patient Summary", icon: User },
  { id: "visit-summary", label: "Visit Summary", icon: Calendar },
  { id: "attachments", label: "Attachments", icon: Paperclip },
  { id: "routing", label: "Routing", icon: Route },
  { id: "consent", label: "Consent", icon: Shield },
];

const ROUTING_TARGETS = [
  { type: "practitioner", targets: [
    { id: "dr-moyo", name: "Dr. Tendai Moyo", specialty: "Cardiology", facility: "Parirenyatwa" },
    { id: "dr-ndlovu", name: "Dr. Sibongile Ndlovu", specialty: "Neurology", facility: "Parirenyatwa" },
    { id: "dr-chikwava", name: "Dr. Peter Chikwava", specialty: "Surgery", facility: "Harare Central" },
  ]},
  { type: "workspace", targets: [
    { id: "cardio-ws", name: "Cardiology Workspace", specialty: "Cardiology", facility: "Parirenyatwa" },
    { id: "neuro-ws", name: "Neurology Workspace", specialty: "Neurology", facility: "Parirenyatwa" },
  ]},
  { type: "on-call", targets: [
    { id: "med-oncall", name: "Medicine On-Call Team", specialty: "Internal Medicine", facility: "All" },
    { id: "surg-oncall", name: "Surgery On-Call Team", specialty: "Surgery", facility: "All" },
  ]},
  { type: "facility-service", targets: [
    { id: "pgh-cardio", name: "Cardiology Dept - Parirenyatwa", specialty: "Cardiology", facility: "Parirenyatwa" },
    { id: "hch-surg", name: "Surgery Dept - Harare Central", specialty: "Surgery", facility: "Harare Central" },
  ]},
  { type: "pool", targets: [
    { id: "cardio-pool", name: "Cardiology Pool (National)", specialty: "Cardiology", facility: "National" },
    { id: "onco-pool", name: "Oncology Pool (National)", specialty: "Oncology", facility: "National" },
  ]},
];

interface ReferralBuilderProps {
  onSubmit?: (pkg: ReferralPackage) => void;
  onCancel?: () => void;
}

export function ReferralBuilder({ onSubmit, onCancel }: ReferralBuilderProps) {
  const { currentEncounter } = useEHR();
  const [currentStep, setCurrentStep] = useState<ReferralStep>("letter");
  const [referralPackage, setReferralPackage] = useState<ReferralPackage>({
    letterContent: "",
    presentingProblems: [],
    clinicalQuestion: "",
    urgency: "routine",
    patientSummary: {
      demographics: true,
      allergies: true,
      medications: true,
      problems: true,
      vitals: true,
    },
    visitSummary: {
      currentVisit: true,
      recentLabs: true,
      recentImaging: true,
      recentNotes: true,
    },
    attachments: [],
    routingType: "practitioner",
    routingTarget: "",
    routingTargetName: "",
    consentType: "digital",
    consentObtained: false,
  });
  const [newProblem, setNewProblem] = useState("");
  const [routingSearch, setRoutingSearch] = useState("");

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const isStepComplete = (step: ReferralStep): boolean => {
    switch (step) {
      case "letter":
        return referralPackage.letterContent.length > 0 && referralPackage.presentingProblems.length > 0;
      case "patient-summary":
        return true; // Auto-generated
      case "visit-summary":
        return true; // Auto-generated
      case "attachments":
        return true; // Optional
      case "routing":
        return referralPackage.routingTarget.length > 0;
      case "consent":
        return referralPackage.consentObtained;
      default:
        return false;
    }
  };

  const canSubmit = STEPS.every(s => isStepComplete(s.id));

  const addProblem = () => {
    if (newProblem.trim()) {
      setReferralPackage(prev => ({
        ...prev,
        presentingProblems: [...prev.presentingProblems, newProblem.trim()]
      }));
      setNewProblem("");
    }
  };

  const removeProblem = (index: number) => {
    setReferralPackage(prev => ({
      ...prev,
      presentingProblems: prev.presentingProblems.filter((_, i) => i !== index)
    }));
  };

  const selectRoutingTarget = (type: string, target: { id: string; name: string }) => {
    setReferralPackage(prev => ({
      ...prev,
      routingType: type as ReferralPackage["routingType"],
      routingTarget: target.id,
      routingTargetName: target.name,
    }));
  };

  const obtainConsent = () => {
    // Simulate consent token generation
    setReferralPackage(prev => ({
      ...prev,
      consentObtained: true,
      consentToken: `CONSENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }));
    toast.success("Consent obtained and verified");
  };

  const handleSubmit = () => {
    if (canSubmit) {
      onSubmit?.(referralPackage);
      toast.success("Referral sent successfully");
    }
  };

  const goToStep = (step: ReferralStep) => {
    setCurrentStep(step);
  };

  const nextStep = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "letter":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Urgency Level *</Label>
              <RadioGroup
                value={referralPackage.urgency}
                onValueChange={(v) => setReferralPackage(prev => ({ ...prev, urgency: v as ReferralPackage["urgency"] }))}
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
                  <RadioGroupItem value="stat" id="stat" />
                  <Label htmlFor="stat" className="cursor-pointer text-destructive">STAT</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="emergency" id="emergency" />
                  <Label htmlFor="emergency" className="cursor-pointer text-destructive font-bold">EMERGENCY</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Presenting Problems *</Label>
              <div className="flex gap-2">
                <Input
                  value={newProblem}
                  onChange={(e) => setNewProblem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addProblem())}
                  placeholder="Add a presenting problem..."
                />
                <Button type="button" onClick={addProblem}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {referralPackage.presentingProblems.map((problem, index) => (
                  <Badge key={index} variant="secondary" className="pl-3 pr-1 py-1">
                    {problem}
                    <button onClick={() => removeProblem(index)} className="ml-2 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Clinical Question</Label>
              <Input
                value={referralPackage.clinicalQuestion}
                onChange={(e) => setReferralPackage(prev => ({ ...prev, clinicalQuestion: e.target.value }))}
                placeholder="What specific question do you need answered?"
              />
            </div>

            <div className="space-y-2">
              <Label>Referral Letter *</Label>
              <Textarea
                value={referralPackage.letterContent}
                onChange={(e) => setReferralPackage(prev => ({ ...prev, letterContent: e.target.value }))}
                placeholder="Write your clinical referral letter here. Include relevant history, examination findings, and your management so far..."
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                {referralPackage.letterContent.length} characters
              </p>
            </div>
          </div>
        );

      case "patient-summary":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-4">
                Select which patient information to include in the referral package. This will be auto-generated from the patient record.
              </p>
              
              <div className="space-y-3">
                {[
                  { key: "demographics", label: "Demographics", desc: "Name, age, sex, ID, contact" },
                  { key: "allergies", label: "Allergies", desc: "Known drug and other allergies" },
                  { key: "medications", label: "Current Medications", desc: "Active prescriptions" },
                  { key: "problems", label: "Problem List", desc: "Active diagnoses and conditions" },
                  { key: "vitals", label: "Latest Vitals", desc: "Most recent vital signs" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={referralPackage.patientSummary[item.key as keyof typeof referralPackage.patientSummary]}
                      onCheckedChange={(checked) => setReferralPackage(prev => ({
                        ...prev,
                        patientSummary: { ...prev.patientSummary, [item.key]: checked }
                      }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Patient Summary Preview</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div><strong>Name:</strong> {currentEncounter.patient.name}</div>
                <div><strong>DOB:</strong> {currentEncounter.patient.dateOfBirth}</div>
                <div><strong>MRN:</strong> {currentEncounter.patient.mrn}</div>
                {currentEncounter.patient.allergies.length > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <strong>Allergies:</strong> {currentEncounter.patient.allergies.join(", ")}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "visit-summary":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-4">
                Select which visit information to include in the referral package.
              </p>
              
              <div className="space-y-3">
                {[
                  { key: "currentVisit", label: "Current Visit Details", desc: "Admission date, location, attending" },
                  { key: "recentLabs", label: "Recent Lab Results", desc: "Labs from last 7 days" },
                  { key: "recentImaging", label: "Recent Imaging", desc: "Imaging from last 30 days" },
                  { key: "recentNotes", label: "Recent Clinical Notes", desc: "Notes from last 7 days" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={referralPackage.visitSummary[item.key as keyof typeof referralPackage.visitSummary]}
                      onCheckedChange={(checked) => setReferralPackage(prev => ({
                        ...prev,
                        visitSummary: { ...prev.visitSummary, [item.key]: checked }
                      }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "attachments":
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-medium mb-2">Upload Attachments</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop files here, or click to select. Supports images, PDFs, and documents.
              </p>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Select Files
              </Button>
            </div>

            {referralPackage.attachments.length > 0 && (
              <div className="space-y-2">
                <Label>Attached Files</Label>
                {referralPackage.attachments.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{file.type} • {file.size} KB</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "routing":
        return (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={routingSearch}
                onChange={(e) => setRoutingSearch(e.target.value)}
                placeholder="Search for a provider, team, or service..."
                className="pl-10"
              />
            </div>

            <div className="space-y-4">
              {ROUTING_TARGETS.map((category) => (
                <div key={category.type}>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2 capitalize flex items-center gap-2">
                    {category.type === "practitioner" && <User className="w-4 h-4" />}
                    {category.type === "workspace" && <Building className="w-4 h-4" />}
                    {category.type === "on-call" && <Clock className="w-4 h-4" />}
                    {category.type === "facility-service" && <Building className="w-4 h-4" />}
                    {category.type === "pool" && <Users className="w-4 h-4" />}
                    {category.type.replace("-", " ")}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {category.targets
                      .filter(t => 
                        !routingSearch || 
                        t.name.toLowerCase().includes(routingSearch.toLowerCase()) ||
                        t.specialty.toLowerCase().includes(routingSearch.toLowerCase())
                      )
                      .map((target) => (
                        <Card
                          key={target.id}
                          className={cn(
                            "cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all",
                            referralPackage.routingTarget === target.id && "ring-2 ring-primary bg-primary/5"
                          )}
                          onClick={() => selectRoutingTarget(category.type, target)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{target.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {target.specialty} • {target.facility}
                                </p>
                              </div>
                              {referralPackage.routingTarget === target.id && (
                                <CheckCircle className="w-5 h-5 text-primary" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            {referralPackage.routingTarget && (
              <div className="p-3 bg-primary/10 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Selected: {referralPackage.routingTargetName}</p>
                  <p className="text-xs text-muted-foreground">Type: {referralPackage.routingType}</p>
                </div>
              </div>
            )}
          </div>
        );

      case "consent":
        return (
          <div className="space-y-6">
            <div className="p-4 bg-warning/10 border border-warning/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-warning mt-0.5" />
                <div>
                  <h4 className="font-medium text-warning">Consent Required</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Before sending this referral, you must obtain patient consent for sharing their health information 
                    with the receiving provider or team.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Consent Method</Label>
              <RadioGroup
                value={referralPackage.consentType}
                onValueChange={(v) => setReferralPackage(prev => ({ 
                  ...prev, 
                  consentType: v as ReferralPackage["consentType"],
                  consentObtained: false,
                  consentToken: undefined
                }))}
                className="grid grid-cols-2 gap-4"
              >
                {[
                  { value: "digital", label: "Digital Consent", desc: "Patient confirms via device" },
                  { value: "verbal", label: "Verbal Consent", desc: "Patient verbally agrees" },
                  { value: "proxy", label: "Proxy Consent", desc: "Guardian/next of kin consents" },
                  { value: "emergency", label: "Emergency Override", desc: "Life-threatening situation" },
                ].map((option) => (
                  <div key={option.value} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                    <div>
                      <Label htmlFor={option.value} className="cursor-pointer font-medium">{option.label}</Label>
                      <p className="text-xs text-muted-foreground">{option.desc}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {!referralPackage.consentObtained ? (
              <Button onClick={obtainConsent} className="w-full" size="lg">
                <Shield className="w-5 h-5 mr-2" />
                Obtain Consent
              </Button>
            ) : (
              <div className="p-4 bg-success/10 border border-success/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-success" />
                  <div>
                    <h4 className="font-medium text-success">Consent Obtained</h4>
                    <p className="text-xs text-muted-foreground">
                      Token: {referralPackage.consentToken}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex">
      {/* Left Navigation */}
      <div className="w-64 border-r p-4 space-y-2">
        <h3 className="font-semibold mb-4">Build Referral Package</h3>
        <Progress value={progress} className="h-2 mb-4" />
        
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isComplete = isStepComplete(step.id);
          const isPast = currentStepIndex > index;
          
          return (
            <button
              key={step.id}
              onClick={() => goToStep(step.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                isActive && "bg-primary/10 text-primary",
                !isActive && "hover:bg-muted",
                isPast && isComplete && "text-success"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isComplete && isPast && "bg-success text-success-foreground",
                isActive && !isComplete && "bg-primary text-primary-foreground",
                !isActive && !isComplete && "bg-muted"
              )}>
                {isComplete && isPast ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm">{step.label}</p>
                <p className="text-xs text-muted-foreground">
                  Step {index + 1} of {STEPS.length}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-between">
          <div>
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {currentStepIndex > 0 && (
              <Button variant="outline" onClick={prevStep}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
            )}
            {currentStepIndex < STEPS.length - 1 ? (
              <Button onClick={nextStep}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={!canSubmit}
                className="bg-success hover:bg-success/90"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Referral
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
