import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Scissors, CheckCircle, Clock, User, AlertTriangle, Package,
  Plus, ChevronRight, Syringe, FileText, Stethoscope, ShieldCheck
} from "lucide-react";
import { useState } from "react";

interface Consumable {
  id: string;
  item: string;
  quantity: number;
  unit: string;
}

const PROCEDURE_TEMPLATES = [
  { id: "spc", name: "Suprapubic Catheter Insertion", category: "Urological" },
  { id: "chest_drain", name: "Chest Drain Insertion", category: "Thoracic" },
  { id: "central_line", name: "Central Line Insertion", category: "Vascular Access" },
  { id: "lumbar_puncture", name: "Lumbar Puncture", category: "Neurological" },
  { id: "paracentesis", name: "Paracentesis / Ascitic Tap", category: "Abdominal" },
  { id: "thoracentesis", name: "Thoracentesis / Pleural Tap", category: "Thoracic" },
  { id: "wound_debridement", name: "Wound Debridement", category: "Wound Care" },
  { id: "incision_drainage", name: "Incision & Drainage", category: "Surgical" },
  { id: "skin_biopsy", name: "Skin Biopsy", category: "Dermatology" },
  { id: "joint_aspiration", name: "Joint Aspiration", category: "Orthopaedic" },
  { id: "ng_tube", name: "NG Tube Insertion", category: "GI" },
  { id: "foley", name: "Urinary Catheter Insertion", category: "Urological" },
];

const PRE_PROCEDURE_CHECKLIST = [
  { id: "consent", label: "Informed consent obtained", critical: true },
  { id: "identity", label: "Patient identity verified", critical: true },
  { id: "site", label: "Procedure site confirmed/marked", critical: true },
  { id: "allergies", label: "Allergies checked", critical: true },
  { id: "coagulation", label: "Coagulation status reviewed", critical: false },
  { id: "equipment", label: "Equipment prepared", critical: false },
  { id: "timeout", label: "Time-out performed", critical: true },
  { id: "aseptic", label: "Aseptic technique ready", critical: true },
];

const COMMON_SUPPLIES: Record<string, Consumable[]> = {
  spc: [
    { id: "1", item: "SPC Kit", quantity: 1, unit: "kit" },
    { id: "2", item: "Foley Catheter 16F", quantity: 1, unit: "piece" },
    { id: "3", item: "Lignocaine 2%", quantity: 10, unit: "ml" },
    { id: "4", item: "Sterile Gloves", quantity: 2, unit: "pairs" },
    { id: "5", item: "Chlorhexidine", quantity: 1, unit: "bottle" },
    { id: "6", item: "Sterile Drape", quantity: 1, unit: "piece" },
  ],
  lumbar_puncture: [
    { id: "1", item: "LP Kit", quantity: 1, unit: "kit" },
    { id: "2", item: "Spinal Needle 22G", quantity: 1, unit: "piece" },
    { id: "3", item: "Lignocaine 2%", quantity: 5, unit: "ml" },
    { id: "4", item: "Sterile Gloves", quantity: 2, unit: "pairs" },
    { id: "5", item: "CSF Bottles", quantity: 4, unit: "pieces" },
    { id: "6", item: "Manometer", quantity: 1, unit: "piece" },
  ],
};

export function MinorProcedureWorkspace() {
  const [currentPhase, setCurrentPhase] = useState<"select" | "prepare" | "execute" | "complete">("select");
  const [selectedProcedure, setSelectedProcedure] = useState<string>("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [consumables, setConsumables] = useState<Consumable[]>([]);

  const toggleCheckItem = (id: string) => {
    setChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectProcedure = (id: string) => {
    setSelectedProcedure(id);
    if (COMMON_SUPPLIES[id]) {
      setConsumables(COMMON_SUPPLIES[id]);
    } else {
      setConsumables([]);
    }
  };

  const addConsumable = () => {
    const newItem: Consumable = {
      id: `CONS-${Date.now()}`,
      item: "",
      quantity: 1,
      unit: "piece",
    };
    setConsumables(prev => [...prev, newItem]);
  };

  const allCriticalChecked = PRE_PROCEDURE_CHECKLIST
    .filter(item => item.critical)
    .every(item => checklist[item.id]);

  const phases = [
    { id: "select", label: "Select Procedure" },
    { id: "prepare", label: "Preparation" },
    { id: "execute", label: "Execution" },
    { id: "complete", label: "Documentation" },
  ];

  const selectedProcedureData = PROCEDURE_TEMPLATES.find(p => p.id === selectedProcedure);

  return (
    <div className="space-y-6">
      {/* Phase Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {phases.map((phase, idx) => (
          <div key={phase.id} className="flex items-center">
            <Button
              variant={currentPhase === phase.id ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPhase(phase.id as typeof currentPhase)}
              className="whitespace-nowrap"
            >
              <span className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-xs mr-2">
                {idx + 1}
              </span>
              {phase.label}
            </Button>
            {idx < phases.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />}
          </div>
        ))}
      </div>

      {/* Select Procedure Phase */}
      {currentPhase === "select" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Scissors className="w-5 h-5 text-primary" />
              Select Procedure Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {PROCEDURE_TEMPLATES.map((proc) => (
                <div
                  key={proc.id}
                  onClick={() => selectProcedure(proc.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedProcedure === proc.id 
                      ? "border-primary bg-primary/5" 
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="font-medium text-sm">{proc.name}</div>
                  <Badge variant="outline" className="mt-2 text-xs">{proc.category}</Badge>
                </div>
              ))}
            </div>

            {selectedProcedure && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Selected: {selectedProcedureData?.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Category: {selectedProcedureData?.category}
                    </p>
                  </div>
                  <Button onClick={() => setCurrentPhase("prepare")}>
                    Continue to Preparation
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-4">
              <Label className="text-sm font-medium">Or enter custom procedure:</Label>
              <Input className="mt-2" placeholder="Custom procedure name..." />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preparation Phase */}
      {currentPhase === "prepare" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Pre-Procedure Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {PRE_PROCEDURE_CHECKLIST.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleCheckItem(item.id)}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      checklist[item.id] ? "bg-success/5 border-success/30" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox checked={checklist[item.id] || false} />
                      <span className={`text-sm ${checklist[item.id] ? "line-through text-muted-foreground" : ""}`}>
                        {item.label}
                      </span>
                    </div>
                    {item.critical && !checklist[item.id] && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </div>
                ))}
              </div>

              {!allCriticalChecked && (
                <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                  <div className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Complete all required items before proceeding</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                Procedure Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Indication</Label>
                <Textarea className="mt-2" placeholder="Clinical indication for the procedure..." />
              </div>
              <div>
                <Label className="text-sm font-medium">Site / Location</Label>
                <Input className="mt-2" placeholder="e.g., Right subclavian, L4-L5 interspace" />
              </div>
              <div>
                <Label className="text-sm font-medium">Anaesthesia</Label>
                <div className="flex gap-2 mt-2">
                  {["Local (Lignocaine)", "Topical", "Sedation", "None Required"].map((type) => (
                    <Badge key={type} variant="outline" className="cursor-pointer hover:bg-secondary text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Performing Clinician</Label>
                <Input className="mt-2" placeholder="Name and designation" />
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("select")}>Back</Button>
            <Button 
              onClick={() => setCurrentPhase("execute")}
              disabled={!allCriticalChecked}
            >
              Begin Procedure
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Execution Phase */}
      {currentPhase === "execute" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Scissors className="w-5 h-5 text-primary" />
                Procedure Steps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Procedure Start Time</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg font-mono">
                  {new Date().toLocaleTimeString()}
                  <Button variant="outline" size="sm" className="ml-4">Record Time</Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Procedure Steps & Notes</Label>
                <Textarea 
                  className="mt-2 min-h-[150px]" 
                  placeholder="Document the procedure steps, technique used, and any findings..."
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Immediate Complications</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["None", "Bleeding", "Pain", "Failed Attempt", "Haematoma", "Other"].map((comp) => (
                    <Badge 
                      key={comp} 
                      variant={comp === "None" ? "secondary" : "outline"}
                      className="cursor-pointer hover:bg-destructive/10"
                    >
                      {comp}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Samples/Specimens Collected</Label>
                <div className="mt-2 space-y-2">
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Specimen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Supplies Used
              </CardTitle>
              <Button size="sm" variant="outline" onClick={addConsumable}>
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {consumables.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
                    <Input 
                      value={item.item} 
                      placeholder="Item name"
                      className="flex-1 h-8 text-sm"
                      onChange={(e) => {
                        const updated = [...consumables];
                        updated[idx].item = e.target.value;
                        setConsumables(updated);
                      }}
                    />
                    <Input 
                      type="number" 
                      value={item.quantity}
                      className="w-16 h-8 text-sm text-center"
                      onChange={(e) => {
                        const updated = [...consumables];
                        updated[idx].quantity = parseInt(e.target.value) || 0;
                        setConsumables(updated);
                      }}
                    />
                    <select 
                      className="h-8 border rounded px-2 text-sm"
                      value={item.unit}
                      onChange={(e) => {
                        const updated = [...consumables];
                        updated[idx].unit = e.target.value;
                        setConsumables(updated);
                      }}
                    >
                      <option value="piece">piece</option>
                      <option value="ml">ml</option>
                      <option value="pairs">pairs</option>
                      <option value="kit">kit</option>
                      <option value="pack">pack</option>
                    </select>
                  </div>
                ))}
                {consumables.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No supplies recorded yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("prepare")}>Back</Button>
            <Button onClick={() => setCurrentPhase("complete")}>
              Complete Procedure
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Documentation Phase */}
      {currentPhase === "complete" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Procedure Note
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Procedure</Label>
                  <Input className="mt-1" value={selectedProcedureData?.name || ""} readOnly />
                </div>
                <div>
                  <Label className="text-sm font-medium">Outcome</Label>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="default" className="cursor-pointer">Successful</Badge>
                    <Badge variant="outline" className="cursor-pointer">Partial</Badge>
                    <Badge variant="destructive" className="cursor-pointer">Failed</Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Procedure Summary</Label>
                <Textarea 
                  className="mt-2 min-h-[100px]" 
                  placeholder="Brief summary of the procedure performed..."
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Findings</Label>
                <Textarea className="mt-2" placeholder="Any significant findings..." />
              </div>

              <div>
                <Label className="text-sm font-medium">Complications</Label>
                <Input className="mt-2" placeholder="None / describe if any" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Post-Procedure Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Monitoring Required</Label>
                <div className="space-y-2 mt-2">
                  {["Vital signs monitoring", "Site inspection", "Pain assessment", "Neuro observations"].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Checkbox id={item} />
                      <Label htmlFor={item} className="text-sm cursor-pointer">{item}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Medications Ordered</Label>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Medication
                </Button>
              </div>

              <div>
                <Label className="text-sm font-medium">Patient Instructions</Label>
                <Textarea className="mt-2" placeholder="Post-procedure care instructions for patient..." />
              </div>

              <div>
                <Label className="text-sm font-medium">Follow-up</Label>
                <Input className="mt-2" placeholder="When to review / follow-up appointment" />
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2">
            <Button className="w-full">
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete & Sign Procedure Note
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
