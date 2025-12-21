import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Baby, Heart, Clock, User, AlertTriangle, Activity, Plus, 
  ChevronRight, Droplets, Thermometer, TrendingUp, CheckCircle,
  Syringe, FileText, Stethoscope
} from "lucide-react";
import { useState } from "react";

interface PartographEntry {
  time: string;
  cervicalDilation: number;
  fetalHeartRate: number;
  contractionFreq: number;
  descent: string;
  liquor: string;
  maternalPulse: number;
  maternalBP: string;
}

const RISK_FACTORS = [
  "Previous C-Section", "Pre-eclampsia", "Gestational Diabetes", "Multiple Pregnancy",
  "Preterm (<37 weeks)", "Post-term (>42 weeks)", "Malpresentation", "PROM",
  "Antepartum Hemorrhage", "Fetal Growth Restriction", "Oligohydramnios", "Polyhydramnios",
];

const LIQUOR_OPTIONS = ["Clear", "Meconium (thin)", "Meconium (thick)", "Bloody", "Absent"];

const DELIVERY_MODES = [
  { id: "svd", label: "SVD", description: "Spontaneous Vaginal Delivery" },
  { id: "vacuum", label: "Vacuum", description: "Vacuum-Assisted Delivery" },
  { id: "forceps", label: "Forceps", description: "Forceps-Assisted Delivery" },
  { id: "emergency_cs", label: "Emergency C/S", description: "Emergency Caesarean Section" },
  { id: "elective_cs", label: "Elective C/S", description: "Elective Caesarean Section" },
];

export function LabourDeliveryWorkspace() {
  const [currentPhase, setCurrentPhase] = useState<"admission" | "partograph" | "delivery" | "outcome">("admission");
  const [selectedRiskFactors, setSelectedRiskFactors] = useState<string[]>([]);
  const [partographEntries, setPartographEntries] = useState<PartographEntry[]>([]);
  const [admissionData, setAdmissionData] = useState({
    gravida: "",
    para: "",
    gestationalAge: "",
    edd: "",
    membranesStatus: "intact",
    timeOfRupture: "",
  });

  const toggleRiskFactor = (factor: string) => {
    setSelectedRiskFactors(prev => 
      prev.includes(factor) ? prev.filter(f => f !== factor) : [...prev, factor]
    );
  };

  const addPartographEntry = () => {
    const newEntry: PartographEntry = {
      time: new Date().toLocaleTimeString(),
      cervicalDilation: 0,
      fetalHeartRate: 0,
      contractionFreq: 0,
      descent: "",
      liquor: "Clear",
      maternalPulse: 0,
      maternalBP: "",
    };
    setPartographEntries(prev => [...prev, newEntry]);
  };

  const phases = [
    { id: "admission", label: "Admission" },
    { id: "partograph", label: "Partograph" },
    { id: "delivery", label: "Delivery" },
    { id: "outcome", label: "Outcomes" },
  ];

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

      {/* Admission Phase */}
      {currentPhase === "admission" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Baby className="w-5 h-5 text-primary" />
                Obstetric History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">Gravida</Label>
                  <Input 
                    type="number" 
                    className="mt-1" 
                    placeholder="G"
                    value={admissionData.gravida}
                    onChange={(e) => setAdmissionData(prev => ({ ...prev, gravida: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Para</Label>
                  <Input 
                    type="number" 
                    className="mt-1" 
                    placeholder="P"
                    value={admissionData.para}
                    onChange={(e) => setAdmissionData(prev => ({ ...prev, para: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">GA (weeks)</Label>
                  <Input 
                    type="number" 
                    className="mt-1" 
                    placeholder="Weeks"
                    value={admissionData.gestationalAge}
                    onChange={(e) => setAdmissionData(prev => ({ ...prev, gestationalAge: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">EDD</Label>
                  <Input 
                    type="date" 
                    className="mt-1"
                    value={admissionData.edd}
                    onChange={(e) => setAdmissionData(prev => ({ ...prev, edd: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Membranes</Label>
                <div className="flex gap-2 mt-2">
                  {["Intact", "Ruptured"].map((status) => (
                    <Badge 
                      key={status} 
                      variant={admissionData.membranesStatus === status.toLowerCase() ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setAdmissionData(prev => ({ ...prev, membranesStatus: status.toLowerCase() }))}
                    >
                      {status}
                    </Badge>
                  ))}
                </div>
                {admissionData.membranesStatus === "ruptured" && (
                  <div className="mt-2">
                    <Label className="text-xs text-muted-foreground">Time of Rupture</Label>
                    <Input 
                      type="datetime-local" 
                      className="mt-1"
                      value={admissionData.timeOfRupture}
                      onChange={(e) => setAdmissionData(prev => ({ ...prev, timeOfRupture: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Previous Deliveries</Label>
                <Textarea className="mt-1" placeholder="Details of previous deliveries, complications, birth weights..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Risk Factors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {RISK_FACTORS.map((factor) => (
                  <Badge
                    key={factor}
                    variant={selectedRiskFactors.includes(factor) ? "destructive" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleRiskFactor(factor)}
                  >
                    {factor}
                  </Badge>
                ))}
              </div>
              {selectedRiskFactors.length > 0 && (
                <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                  <p className="text-sm font-medium text-warning">
                    {selectedRiskFactors.length} risk factor(s) identified
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Admission Vitals & Examination
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-4">
                <div>
                  <Label className="text-xs">BP (mmHg)</Label>
                  <Input placeholder="120/80" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Pulse (bpm)</Label>
                  <Input placeholder="80" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Temp (°C)</Label>
                  <Input placeholder="36.5" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">FHR (bpm)</Label>
                  <Input placeholder="140" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Cervix (cm)</Label>
                  <Input placeholder="4" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Station</Label>
                  <Input placeholder="-2" className="mt-1" />
                </div>
              </div>
              <Button className="mt-4" onClick={() => setCurrentPhase("partograph")}>
                Start Partograph
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Partograph Phase */}
      {currentPhase === "partograph" && (
        <div className="space-y-4">
          {/* Partograph Header */}
          <Card className="bg-primary/5">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">G{admissionData.gravida || "?"} P{admissionData.para || "?"}</Badge>
                  <Badge variant="outline">{admissionData.gestationalAge || "?"} weeks</Badge>
                  <Badge variant={admissionData.membranesStatus === "ruptured" ? "destructive" : "outline"}>
                    Membranes: {admissionData.membranesStatus}
                  </Badge>
                </div>
                <Button size="sm" onClick={addPartographEntry}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Entry
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Partograph Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Partograph Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              {partographEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No partograph entries yet</p>
                  <Button variant="outline" className="mt-2" onClick={addPartographEntry}>
                    Add First Entry
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Time</th>
                        <th className="text-center p-2">Cervix (cm)</th>
                        <th className="text-center p-2">FHR (bpm)</th>
                        <th className="text-center p-2">Contractions/10min</th>
                        <th className="text-center p-2">Descent</th>
                        <th className="text-center p-2">Liquor</th>
                        <th className="text-center p-2">Maternal Pulse</th>
                        <th className="text-center p-2">Maternal BP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partographEntries.map((entry, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="p-2">
                            <Badge variant="outline">{entry.time}</Badge>
                          </td>
                          <td className="p-2">
                            <Input type="number" className="w-16 h-8 text-center" placeholder="0" />
                          </td>
                          <td className="p-2">
                            <Input type="number" className="w-16 h-8 text-center" placeholder="140" />
                          </td>
                          <td className="p-2">
                            <Input type="number" className="w-16 h-8 text-center" placeholder="3" />
                          </td>
                          <td className="p-2">
                            <select className="w-20 h-8 border rounded text-xs">
                              <option>-3</option>
                              <option>-2</option>
                              <option>-1</option>
                              <option>0</option>
                              <option>+1</option>
                              <option>+2</option>
                              <option>+3</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <select className="w-24 h-8 border rounded text-xs">
                              {LIQUOR_OPTIONS.map(opt => (
                                <option key={opt}>{opt}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <Input type="number" className="w-16 h-8 text-center" placeholder="80" />
                          </td>
                          <td className="p-2">
                            <Input className="w-20 h-8 text-center" placeholder="120/80" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Alert Lines */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 border border-warning/50 rounded-lg bg-warning/5">
                  <div className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Alert Line</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cervical dilation crossing the alert line - increase monitoring frequency
                  </p>
                </div>
                <div className="p-3 border border-destructive/50 rounded-lg bg-destructive/5">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Action Line</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cervical dilation crossing the action line - urgent intervention required
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interventions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Syringe className="w-5 h-5 text-primary" />
                Labour Interventions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  "Oxytocin Augmentation", "ARM (Amniotomy)", "Epidural", "IV Fluids",
                  "Antibiotics", "Analgesia", "CTG Monitoring", "Scalp Electrode",
                ].map((int) => (
                  <Badge key={int} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                    <Plus className="w-3 h-3 mr-1" />
                    {int}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("admission")}>Back</Button>
            <Button onClick={() => setCurrentPhase("delivery")}>
              Record Delivery
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Delivery Phase */}
      {currentPhase === "delivery" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Baby className="w-5 h-5 text-primary" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Delivery Date</Label>
                  <Input type="date" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Delivery Time</Label>
                  <Input type="time" className="mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Mode of Delivery</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {DELIVERY_MODES.map((mode) => (
                    <div 
                      key={mode.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="font-medium text-sm">{mode.label}</div>
                      <div className="text-xs text-muted-foreground">{mode.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Presentation</Label>
                <div className="flex gap-2 mt-2">
                  {["Cephalic", "Breech", "Transverse", "Other"].map((pres) => (
                    <Badge key={pres} variant="outline" className="cursor-pointer hover:bg-secondary">
                      {pres}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Est. Blood Loss (ml)</Label>
                  <Input type="number" placeholder="500" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Perineum</Label>
                  <select className="w-full p-2 border rounded mt-1">
                    <option>Intact</option>
                    <option>1st Degree Tear</option>
                    <option>2nd Degree Tear</option>
                    <option>3rd Degree Tear</option>
                    <option>4th Degree Tear</option>
                    <option>Episiotomy</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Placenta</Label>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="cursor-pointer">Delivered Complete</Badge>
                  <Badge variant="outline" className="cursor-pointer">Manual Removal</Badge>
                  <Badge variant="outline" className="cursor-pointer">Retained</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Delivery Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {["Delivered By", "Assisting Midwife", "Paediatrician", "Anaesthetist"].map((role) => (
                <div key={role}>
                  <Label className="text-sm">{role}</Label>
                  <Input placeholder="Name" className="mt-1" />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("partograph")}>Back</Button>
            <Button onClick={() => setCurrentPhase("outcome")}>
              Record Outcomes
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Outcome Phase */}
      {currentPhase === "outcome" && (
        <div className="grid grid-cols-2 gap-6">
          {/* Maternal Outcome */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Maternal Outcome
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Condition</Label>
                <div className="flex gap-2 mt-2">
                  <Badge variant="default" className="cursor-pointer">Stable</Badge>
                  <Badge variant="destructive" className="cursor-pointer">Critical</Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Complications</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["None", "PPH", "Perineal Trauma", "Retained Placenta", "Uterine Atony", "Infection"].map((comp) => (
                    <Badge key={comp} variant="outline" className="cursor-pointer hover:bg-destructive/10">
                      {comp}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Post-Delivery Vitals</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Input placeholder="BP" />
                  <Input placeholder="Pulse" />
                  <Input placeholder="Temp" />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Post-Natal Care Plan</Label>
                <Textarea className="mt-1" placeholder="PNC instructions, follow-up schedule..." />
              </div>
            </CardContent>
          </Card>

          {/* Neonatal Outcome */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Baby className="w-5 h-5 text-primary" />
                Neonatal Outcome
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Birth Weight (g)</Label>
                  <Input type="number" placeholder="3200" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Sex</Label>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="cursor-pointer hover:bg-blue-500/20">Male</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-pink-500/20">Female</Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">APGAR Scores</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">1 minute</Label>
                    <Input type="number" placeholder="8" className="mt-1" max={10} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">5 minutes</Label>
                    <Input type="number" placeholder="9" className="mt-1" max={10} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">10 minutes</Label>
                    <Input type="number" placeholder="10" className="mt-1" max={10} />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Resuscitation Required?</Label>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="cursor-pointer">No</Badge>
                  <Badge variant="outline" className="cursor-pointer">Stimulation</Badge>
                  <Badge variant="outline" className="cursor-pointer">Suction</Badge>
                  <Badge variant="outline" className="cursor-pointer">BMV</Badge>
                  <Badge variant="outline" className="cursor-pointer">Intubation</Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Condition at Birth</Label>
                <div className="flex gap-2 mt-2">
                  <Badge variant="default" className="cursor-pointer">Well - With Mother</Badge>
                  <Badge className="bg-warning text-warning-foreground cursor-pointer">Requires NICU</Badge>
                  <Badge variant="destructive" className="cursor-pointer">Stillbirth</Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Abnormalities Noted</Label>
                <Textarea className="mt-1" placeholder="Any congenital abnormalities or findings..." />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                Immediate Post-Natal Care
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { id: "skin_to_skin", label: "Skin-to-skin contact initiated" },
                  { id: "breastfeeding", label: "Early breastfeeding initiated" },
                  { id: "vitamin_k", label: "Vitamin K administered" },
                  { id: "eye_care", label: "Eye prophylaxis given" },
                  { id: "cord_care", label: "Cord care provided" },
                  { id: "weight_taken", label: "Birth weight documented" },
                  { id: "exam_done", label: "Initial neonatal exam done" },
                  { id: "bcg", label: "BCG vaccination given" },
                ].map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <Checkbox id={item.id} />
                    <Label htmlFor={item.id} className="text-sm cursor-pointer">{item.label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("delivery")}>Back</Button>
            <Button>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Labour & Delivery Workspace
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
