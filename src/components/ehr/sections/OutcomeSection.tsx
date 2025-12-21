import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, Home, Building, Ambulance, Calendar, Send, AlertTriangle,
  Pill, FileText, User, Clock, MapPin, Phone, Stethoscope, Heart,
  ClipboardList, AlertCircle, UserX, Plus, ChevronRight
} from "lucide-react";
import { useState } from "react";

type DispositionType = "discharge" | "admit" | "transfer" | "refer" | "death" | "lama" | "";

const DISPOSITION_OPTIONS = [
  { id: "discharge", label: "Discharge", icon: Home, description: "Patient ready for discharge home", color: "text-success" },
  { id: "admit", label: "Admit", icon: Building, description: "Admit to inpatient ward", color: "text-primary" },
  { id: "transfer", label: "Transfer", icon: Ambulance, description: "Transfer to another facility", color: "text-warning" },
  { id: "refer", label: "Refer", icon: Send, description: "Refer for specialist care", color: "text-blue-500" },
  { id: "death", label: "Death", icon: Heart, description: "Record patient death", color: "text-destructive" },
  { id: "lama", label: "LAMA/Absconded", icon: UserX, description: "Left against medical advice", color: "text-muted-foreground" },
];

const DISCHARGE_DIAGNOSES = [
  { code: "N39.0", name: "Urinary tract infection, site not specified", type: "Primary" },
  { code: "E11.9", name: "Type 2 diabetes mellitus without complications", type: "Secondary" },
  { code: "I10", name: "Essential (primary) hypertension", type: "Secondary" },
];

const DISCHARGE_MEDICATIONS = [
  { name: "Metformin 500mg", dosage: "1 tablet BD", duration: "Ongoing", instructions: "Take with meals" },
  { name: "Amlodipine 5mg", dosage: "1 tablet OD", duration: "Ongoing", instructions: "Take in the morning" },
  { name: "Ciprofloxacin 500mg", dosage: "1 tablet BD", duration: "5 days", instructions: "Complete the course" },
];

const WARDS = [
  "Medical Ward 1",
  "Medical Ward 2", 
  "Surgical Ward",
  "ICU",
  "HDU",
  "Maternity Ward",
  "Paediatric Ward",
];

const FACILITIES = [
  "Kenyatta National Hospital",
  "Mater Hospital",
  "Nairobi Hospital",
  "Aga Khan University Hospital",
  "MP Shah Hospital",
];

export function OutcomeSection() {
  const [disposition, setDisposition] = useState<DispositionType>("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheckItem = (item: string) => {
    setCheckedItems(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const renderDispositionForm = () => {
    switch (disposition) {
      case "discharge":
        return <DischargeForm checkedItems={checkedItems} toggleCheckItem={toggleCheckItem} />;
      case "admit":
        return <AdmitForm />;
      case "transfer":
        return <TransferForm />;
      case "refer":
        return <ReferForm />;
      case "death":
        return <DeathForm />;
      case "lama":
        return <LAMAForm />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Visit Disposition Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Visit Outcome
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={disposition} 
            onValueChange={(value) => setDisposition(value as DispositionType)} 
            className="grid grid-cols-3 gap-3"
          >
            {DISPOSITION_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = disposition === option.id;
              return (
                <div key={option.id}>
                  <RadioGroupItem value={option.id} id={option.id} className="peer sr-only" />
                  <Label
                    htmlFor={option.id}
                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-all ${
                      isSelected ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isSelected ? "bg-primary/10" : "bg-muted"
                    }`}>
                      <Icon className={`w-6 h-6 ${option.color}`} />
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Disposition-specific Forms */}
      {disposition && renderDispositionForm()}

      {/* Actions */}
      {disposition && (
        <div className="flex justify-end gap-3">
          <Button variant="outline">Save Draft</Button>
          <Button variant="outline">Preview Summary</Button>
          <Button>
            <CheckCircle className="w-4 h-4 mr-2" />
            Complete Encounter
          </Button>
        </div>
      )}
    </div>
  );
}

function DischargeForm({ checkedItems, toggleCheckItem }: { 
  checkedItems: Record<string, boolean>; 
  toggleCheckItem: (item: string) => void;
}) {
  return (
    <>
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="followup">Follow-up</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Discharge Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Discharge Diagnoses */}
              <div>
                <Label className="text-sm font-medium">Discharge Diagnoses</Label>
                <div className="mt-2 space-y-2">
                  {DISCHARGE_DIAGNOSES.map((dx, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={dx.type === "Primary" ? "default" : "outline"}>
                          {dx.type}
                        </Badge>
                        <div>
                          <span className="font-medium text-sm">{dx.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">({dx.code})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Diagnosis
                  </Button>
                </div>
              </div>

              {/* Hospital Course */}
              <div>
                <Label htmlFor="course" className="text-sm font-medium">Hospital Course Summary</Label>
                <Textarea
                  id="course"
                  placeholder="Summarize the patient's hospital stay, treatments provided, and response to therapy..."
                  className="mt-2 min-h-[120px]"
                  defaultValue="65-year-old female admitted with complicated UTI (pyelonephritis). Treated with IV Ceftriaxone for 3 days with good clinical response. Blood glucose levels optimized. Blood pressure controlled. Afebrile for 48 hours. Repeat urinalysis clear."
                />
              </div>

              {/* Condition at Discharge */}
              <div>
                <Label className="text-sm font-medium">Condition at Discharge</Label>
                <div className="flex gap-2 mt-2">
                  {["Improved", "Stable", "Unchanged", "Deteriorated"].map((status) => (
                    <Badge 
                      key={status} 
                      variant={status === "Improved" ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    >
                      {status}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary" />
                Discharge Medications
              </CardTitle>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Medication
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DISCHARGE_MEDICATIONS.map((med, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{med.name}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{med.dosage}</span>
                          <span>•</span>
                          <span>{med.duration}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 italic">{med.instructions}</p>
                      </div>
                      <Badge variant="outline">Prescribed</Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-warning/10 border border-warning/30 rounded-lg">
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Medication Reconciliation Required</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Please verify all medications with the patient before discharge.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followup" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Follow-up Planning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Follow-up Appointments */}
              <div>
                <Label className="text-sm font-medium">Follow-up Appointments</Label>
                <div className="mt-2 space-y-2">
                  <div className="p-3 border rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-primary" />
                      <div>
                        <span className="font-medium text-sm">Diabetes Clinic</span>
                        <p className="text-xs text-muted-foreground">In 2 weeks</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Schedule</Button>
                  </div>
                  <div className="p-3 border rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-primary" />
                      <div>
                        <span className="font-medium text-sm">General OPD</span>
                        <p className="text-xs text-muted-foreground">Review in 1 week</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Schedule</Button>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Follow-up
                  </Button>
                </div>
              </div>

              {/* CHW Tasks */}
              <div>
                <Label className="text-sm font-medium">CHW Follow-up Tasks</Label>
                <div className="mt-2 space-y-2">
                  <div className="p-3 border rounded-lg flex items-center gap-3">
                    <Checkbox id="chw1" />
                    <Label htmlFor="chw1" className="text-sm cursor-pointer">
                      Home visit within 48 hours to check medication adherence
                    </Label>
                  </div>
                  <div className="p-3 border rounded-lg flex items-center gap-3">
                    <Checkbox id="chw2" />
                    <Label htmlFor="chw2" className="text-sm cursor-pointer">
                      Blood glucose monitoring education
                    </Label>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="w-4 h-4 mr-1" />
                    Add CHW Task
                  </Button>
                </div>
              </div>

              {/* Patient Instructions */}
              <div>
                <Label className="text-sm font-medium">Discharge Instructions</Label>
                <Textarea
                  className="mt-2 min-h-[100px]"
                  placeholder="Enter specific instructions for the patient..."
                  defaultValue="1. Take all medications as prescribed&#10;2. Complete the antibiotic course&#10;3. Monitor blood glucose twice daily&#10;4. Return immediately if fever, dysuria, or flank pain recurs&#10;5. Maintain adequate hydration"
                />
              </div>

              {/* Counseling Provided */}
              <div>
                <Label className="text-sm font-medium">Counseling Provided</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["Diabetes education", "Medication adherence", "Diet & lifestyle", "Warning signs", "Follow-up importance"].map((item) => (
                    <Badge 
                      key={item} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                Discharge Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { id: "meds", label: "Medication reconciliation complete", critical: true },
                  { id: "rx", label: "Discharge medications ordered/dispensed", critical: true },
                  { id: "edu", label: "Patient/family education provided", critical: false },
                  { id: "appt", label: "Follow-up appointments scheduled", critical: false },
                  { id: "docs", label: "Discharge documents prepared", critical: false },
                  { id: "sign", label: "Patient signed discharge papers", critical: true },
                  { id: "transport", label: "Transport arrangements confirmed", critical: false },
                  { id: "chw", label: "CHW notified for follow-up", critical: false },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleCheckItem(item.id)}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      checkedItems[item.id] ? "bg-success/5 border-success/30" : "hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox checked={checkedItems[item.id] || false} />
                    <span className={`text-sm flex-1 ${checkedItems[item.id] ? "line-through text-muted-foreground" : ""}`}>
                      {item.label}
                    </span>
                    {item.critical && !checkedItems[item.id] && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span>Checklist Progress</span>
                  <span className="font-medium">
                    {Object.values(checkedItems).filter(Boolean).length} / 8 completed
                  </span>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(Object.values(checkedItems).filter(Boolean).length / 8) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function AdmitForm() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building className="w-5 h-5 text-primary" />
          Admission Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Admitting Ward</Label>
            <select className="mt-2 w-full p-2 border rounded-lg bg-background">
              <option value="">Select ward...</option>
              {WARDS.map((ward) => (
                <option key={ward} value={ward}>{ward}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-sm font-medium">Bed Assignment</Label>
            <Input className="mt-2" placeholder="Bed number (if known)" />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Admission Diagnosis</Label>
          <Input className="mt-2" placeholder="Primary reason for admission" />
        </div>

        <div>
          <Label className="text-sm font-medium">Admitting Team/Consultant</Label>
          <Input className="mt-2" placeholder="Select or type..." />
        </div>

        <div>
          <Label className="text-sm font-medium">Priority Level</Label>
          <div className="flex gap-2 mt-2">
            {["Routine", "Urgent", "Emergency"].map((level) => (
              <Badge 
                key={level} 
                variant={level === "Urgent" ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
              >
                {level}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Special Requirements</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {["Isolation", "Monitoring", "IV Access", "Oxygen", "NPO", "Fall precautions"].map((req) => (
              <Badge key={req} variant="outline" className="cursor-pointer hover:bg-secondary">
                {req}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Admission Notes</Label>
          <Textarea className="mt-2 min-h-[100px]" placeholder="Brief summary and initial orders..." />
        </div>
      </CardContent>
    </Card>
  );
}

function TransferForm() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Ambulance className="w-5 h-5 text-warning" />
          Transfer Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
          <div className="flex items-center gap-2 text-warning">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Ensure receiving facility has confirmed acceptance</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Receiving Facility</Label>
            <select className="mt-2 w-full p-2 border rounded-lg bg-background">
              <option value="">Select facility...</option>
              {FACILITIES.map((facility) => (
                <option key={facility} value={facility}>{facility}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-sm font-medium">Receiving Department</Label>
            <Input className="mt-2" placeholder="e.g., ICU, Surgery" />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Reason for Transfer</Label>
          <Textarea className="mt-2" placeholder="Why is the patient being transferred?" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Transfer Urgency</Label>
            <div className="flex gap-2 mt-2">
              {["Routine", "Urgent", "Emergency"].map((level) => (
                <Badge 
                  key={level} 
                  variant={level === "Emergency" ? "destructive" : level === "Urgent" ? "default" : "outline"}
                  className="cursor-pointer"
                >
                  {level}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Mode of Transport</Label>
            <div className="flex gap-2 mt-2">
              {["Ambulance", "Private Vehicle", "Air Ambulance"].map((mode) => (
                <Badge key={mode} variant="outline" className="cursor-pointer hover:bg-secondary">
                  {mode}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Accepting Clinician</Label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <Input placeholder="Name" />
            <Input placeholder="Contact number" />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Documents to Send</Label>
          <div className="mt-2 space-y-2">
            {["Transfer summary", "Lab results", "Imaging", "Medication list", "Nursing notes"].map((doc) => (
              <div key={doc} className="flex items-center gap-2">
                <Checkbox id={doc} defaultChecked />
                <Label htmlFor={doc} className="text-sm cursor-pointer">{doc}</Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReferForm() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-500" />
          Outpatient Referral
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Referral Destination</Label>
            <select className="mt-2 w-full p-2 border rounded-lg bg-background">
              <option value="">Select clinic/facility...</option>
              <option value="diabetes">Diabetes Clinic</option>
              <option value="cardiology">Cardiology Clinic</option>
              <option value="surgery">Surgical Outpatient</option>
              <option value="physio">Physiotherapy</option>
              <option value="nutrition">Nutrition Clinic</option>
            </select>
          </div>
          <div>
            <Label className="text-sm font-medium">Urgency</Label>
            <div className="flex gap-2 mt-2">
              {["Routine", "Soon", "Urgent"].map((level) => (
                <Badge 
                  key={level} 
                  variant={level === "Routine" ? "outline" : level === "Soon" ? "secondary" : "default"}
                  className="cursor-pointer"
                >
                  {level}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Reason for Referral</Label>
          <Textarea className="mt-2" placeholder="Clinical indication for referral..." />
        </div>

        <div>
          <Label className="text-sm font-medium">Key Clinical Information</Label>
          <Textarea className="mt-2 min-h-[100px]" placeholder="Relevant history, findings, and current management..." />
        </div>

        <div>
          <Label className="text-sm font-medium">Specific Questions for Specialist</Label>
          <Textarea className="mt-2" placeholder="What do you need the specialist to address?" />
        </div>
      </CardContent>
    </Card>
  );
}

function DeathForm() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-destructive">
          <Heart className="w-5 h-5" />
          Death Documentation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">This action records a patient death and cannot be undone</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Date of Death</Label>
            <Input type="date" className="mt-2" />
          </div>
          <div>
            <Label className="text-sm font-medium">Time of Death</Label>
            <Input type="time" className="mt-2" />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Primary Cause of Death</Label>
          <Input className="mt-2" placeholder="Immediate cause..." />
        </div>

        <div>
          <Label className="text-sm font-medium">Contributing Factors</Label>
          <Textarea className="mt-2" placeholder="Other conditions contributing to death..." />
        </div>

        <div>
          <Label className="text-sm font-medium">Certifying Clinician</Label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <Input placeholder="Name" />
            <Input placeholder="Registration number" />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Death Certificate Status</Label>
          <div className="flex gap-2 mt-2">
            {["Pending", "Issued", "Not Required"].map((status) => (
              <Badge key={status} variant="outline" className="cursor-pointer hover:bg-secondary">
                {status}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Post-mortem</Label>
          <div className="flex gap-2 mt-2">
            {["Not indicated", "Requested", "Declined by family", "Ordered"].map((status) => (
              <Badge key={status} variant="outline" className="cursor-pointer hover:bg-secondary">
                {status}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LAMAForm() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UserX className="w-5 h-5 text-muted-foreground" />
          Left Against Medical Advice / Absconded
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
          <div className="flex items-center gap-2 text-warning">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Document all attempts to counsel the patient</span>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Type</Label>
          <div className="flex gap-2 mt-2">
            {["Left Against Medical Advice", "Absconded", "Self-Discharged"].map((type) => (
              <Badge key={type} variant="outline" className="cursor-pointer hover:bg-secondary">
                {type}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Date</Label>
            <Input type="date" className="mt-2" />
          </div>
          <div>
            <Label className="text-sm font-medium">Time (if known)</Label>
            <Input type="time" className="mt-2" />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Circumstances</Label>
          <Textarea className="mt-2" placeholder="Describe the circumstances..." />
        </div>

        <div>
          <Label className="text-sm font-medium">Counseling Provided</Label>
          <div className="mt-2 space-y-2">
            {[
              "Risks of leaving explained",
              "Recommended treatment discussed",
              "Family/next of kin informed",
              "Patient signed LAMA form",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Checkbox id={item} />
                <Label htmlFor={item} className="text-sm cursor-pointer">{item}</Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Witness</Label>
          <Input className="mt-2" placeholder="Witness name and designation" />
        </div>

        <div>
          <Label className="text-sm font-medium">Follow-up Actions</Label>
          <div className="mt-2 space-y-2">
            {[
              "CHW to attempt home visit",
              "Phone follow-up scheduled",
              "Case reported to administration",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Checkbox id={item} />
                <Label htmlFor={item} className="text-sm cursor-pointer">{item}</Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
