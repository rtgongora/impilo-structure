import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, AlertTriangle, Clock, User, Activity, Plus, 
  ChevronRight, Target, CheckCircle, FileText, Calendar,
  BarChart3, CircleAlert, Shield, Eye
} from "lucide-react";
import { useState } from "react";

interface FractionLog {
  fractionNumber: number;
  date: string;
  deliveredDose: number;
  cumulativeDose: number;
  status: "completed" | "missed" | "rescheduled" | "pending";
  notes?: string;
  verifiedBy?: string;
}

interface ToxicityEntry {
  site: string;
  grade: 0 | 1 | 2 | 3 | 4;
  description: string;
  date: string;
}

const TREATMENT_SITES = [
  "Brain", "Head & Neck", "Breast", "Lung", "Esophagus", 
  "Liver", "Pancreas", "Prostate", "Cervix", "Rectum", "Spine"
];

const TREATMENT_INTENTS = [
  { id: "radical", label: "Radical/Curative", description: "Intent to cure" },
  { id: "adjuvant", label: "Adjuvant", description: "Post-operative" },
  { id: "neoadjuvant", label: "Neoadjuvant", description: "Pre-operative" },
  { id: "palliative", label: "Palliative", description: "Symptom control" },
];

const TOXICITY_SITES_RT = [
  "Skin", "Mucositis", "Dysphagia", "Nausea", "Fatigue", 
  "Diarrhea", "Cystitis", "Proctitis", "Pneumonitis", "Xerostomia"
];

const DAILY_CHECKS = [
  { id: "identity", label: "Patient identity verified" },
  { id: "consent", label: "Consent confirmed" },
  { id: "positioning", label: "Positioning verified" },
  { id: "immobilization", label: "Immobilization devices checked" },
  { id: "imaging", label: "Pre-treatment imaging reviewed" },
  { id: "tattoos", label: "Tattoos/marks aligned" },
  { id: "accessories", label: "No jewelry/accessories in field" },
];

export function RadiotherapyWorkspace() {
  const [currentPhase, setCurrentPhase] = useState<"planning" | "simulation" | "treatment" | "review">("planning");
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [selectedIntent, setSelectedIntent] = useState<string>("");
  const [totalFractions, setTotalFractions] = useState(30);
  const [fractionLogs, setFractionLogs] = useState<FractionLog[]>([]);
  const [dailyChecks, setDailyChecks] = useState<string[]>([]);
  const [toxicities, setToxicities] = useState<ToxicityEntry[]>([]);

  const completedFractions = fractionLogs.filter(f => f.status === "completed").length;
  const totalDose = 60; // Gy
  const dosePerFraction = totalDose / totalFractions;
  const deliveredDose = completedFractions * dosePerFraction;

  const toggleDailyCheck = (id: string) => {
    setDailyChecks(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const recordFraction = () => {
    const newFraction: FractionLog = {
      fractionNumber: completedFractions + 1,
      date: new Date().toISOString().split('T')[0],
      deliveredDose: dosePerFraction,
      cumulativeDose: deliveredDose + dosePerFraction,
      status: "completed",
      verifiedBy: "RT Tech"
    };
    setFractionLogs(prev => [...prev, newFraction]);
    setDailyChecks([]);
  };

  const phases = [
    { id: "planning", label: "Planning" },
    { id: "simulation", label: "Simulation" },
    { id: "treatment", label: "Daily Treatment" },
    { id: "review", label: "On-Treatment Review" },
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

      {/* Treatment Progress Banner */}
      {completedFractions > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="default" className="text-sm">
                  <Zap className="w-3 h-3 mr-1" />
                  {selectedSite || "Treatment Site"}
                </Badge>
                <Badge variant="outline">
                  Fraction {completedFractions} of {totalFractions}
                </Badge>
                <Badge variant="secondary">
                  {deliveredDose.toFixed(1)} / {totalDose} Gy
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Progress:</span>
                <Progress value={(completedFractions / totalFractions) * 100} className="w-32 h-2" />
                <span className="text-sm font-medium">{Math.round((completedFractions / totalFractions) * 100)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Planning Phase */}
      {currentPhase === "planning" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Treatment Site
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {TREATMENT_SITES.map((site) => (
                  <Badge
                    key={site}
                    variant={selectedSite === site ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedSite(site)}
                  >
                    {site}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Treatment Intent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {TREATMENT_INTENTS.map((intent) => (
                  <div
                    key={intent.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedIntent === intent.id 
                        ? "border-primary bg-primary/5" 
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedIntent(intent.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{intent.label}</span>
                      <span className="text-sm text-muted-foreground">{intent.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Prescription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm">Total Dose (Gy)</Label>
                  <Input type="number" value={totalDose} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Fractions</Label>
                  <Input 
                    type="number" 
                    value={totalFractions} 
                    onChange={(e) => setTotalFractions(parseInt(e.target.value) || 30)}
                    className="mt-1" 
                  />
                </div>
                <div>
                  <Label className="text-sm">Dose/Fraction (Gy)</Label>
                  <Input value={dosePerFraction.toFixed(2)} readOnly className="mt-1 bg-muted" />
                </div>
                <div>
                  <Label className="text-sm">Schedule</Label>
                  <Input value="Daily (Mon-Fri)" readOnly className="mt-1 bg-muted" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Technique</Label>
                  <select className="w-full mt-1 border rounded-lg p-2">
                    <option>3D Conformal</option>
                    <option>IMRT</option>
                    <option>VMAT</option>
                    <option>SBRT</option>
                    <option>SRS</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm">Energy (MV)</Label>
                  <select className="w-full mt-1 border rounded-lg p-2">
                    <option>6 MV</option>
                    <option>10 MV</option>
                    <option>15 MV</option>
                    <option>Electrons</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-sm">Clinical Notes</Label>
                <Textarea placeholder="Tumor stage, critical structures, dose constraints..." className="mt-1" />
              </div>

              <Button className="w-full" onClick={() => setCurrentPhase("simulation")}>
                Proceed to Simulation
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Simulation Phase */}
      {currentPhase === "simulation" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                CT Simulation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Simulation Date</Label>
                  <Input type="date" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Performed By</Label>
                  <Input placeholder="RT Therapist" className="mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-sm">Patient Position</Label>
                <select className="w-full mt-1 border rounded-lg p-2">
                  <option>Supine, Arms Up</option>
                  <option>Supine, Arms Down</option>
                  <option>Prone</option>
                  <option>Lateral</option>
                </select>
              </div>

              <div>
                <Label className="text-sm">Immobilization Devices</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Thermoplastic Mask", "Breast Board", "Knee Support", "Arm Rest", "Belly Board", "Vac-Lok"].map((device) => (
                    <Badge key={device} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      {device}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm">IV Contrast</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="contrast" /> Yes
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="contrast" defaultChecked /> No
                  </label>
                </div>
              </div>

              <div>
                <Label className="text-sm">Tattoos Placed</Label>
                <Input type="number" placeholder="3" className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Plan Approval
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { id: "contours", label: "Target volumes contoured" },
                  { id: "oar", label: "OARs delineated" },
                  { id: "plan", label: "Treatment plan generated" },
                  { id: "dvh", label: "DVH constraints met" },
                  { id: "physics", label: "Physics QA approved" },
                  { id: "physician", label: "Physician approval" },
                ].map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <Checkbox id={item.id} />
                    <Label htmlFor={item.id} className="text-sm cursor-pointer">
                      {item.label}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Estimated Treatment Start</p>
                <Input type="date" className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("planning")}>Back</Button>
            <Button onClick={() => setCurrentPhase("treatment")}>
              Begin Treatment Course
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Treatment Phase */}
      {currentPhase === "treatment" && (
        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Daily Treatment - Fraction {completedFractions + 1}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Pre-Treatment Checks</p>
                  {DAILY_CHECKS.map((check) => (
                    <div key={check.id} className="flex items-center gap-3">
                      <Checkbox
                        id={check.id}
                        checked={dailyChecks.includes(check.id)}
                        onCheckedChange={() => toggleDailyCheck(check.id)}
                      />
                      <Label htmlFor={check.id} className="text-sm cursor-pointer">
                        {check.label}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Today's Dose</p>
                    <p className="text-2xl font-bold">{dosePerFraction.toFixed(2)} Gy</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Cumulative Dose</p>
                    <p className="text-2xl font-bold">{(deliveredDose + dosePerFraction).toFixed(1)} Gy</p>
                  </div>
                  <div>
                    <Label className="text-sm">Image Guidance</Label>
                    <select className="w-full mt-1 border rounded-lg p-2">
                      <option>CBCT</option>
                      <option>kV Imaging</option>
                      <option>MV Imaging</option>
                      <option>None Today</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm">Treatment Notes</Label>
                <Textarea placeholder="Any observations, patient concerns, positioning adjustments..." className="mt-1" />
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  onClick={recordFraction}
                  disabled={dailyChecks.length < DAILY_CHECKS.length}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Record Fraction Complete
                </Button>
                <Button variant="outline">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Mark Missed
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Fraction Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {fractionLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No fractions recorded yet
                    </p>
                  ) : (
                    fractionLogs.map((log) => (
                      <div key={log.fractionNumber} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div>
                          <span className="text-sm font-medium">Fx {log.fractionNumber}</span>
                          <p className="text-xs text-muted-foreground">{log.date}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={log.status === "completed" ? "default" : "destructive"} className="text-xs">
                            {log.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground">{log.cumulativeDose.toFixed(1)} Gy</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CircleAlert className="w-5 h-5 text-warning" />
                  Quick Toxicity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {TOXICITY_SITES_RT.slice(0, 6).map((site) => (
                    <Badge key={site} variant="outline" className="cursor-pointer text-xs hover:bg-warning hover:text-warning-foreground">
                      {site}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-3 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("simulation")}>Back</Button>
            <Button onClick={() => setCurrentPhase("review")}>
              On-Treatment Review
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Review Phase */}
      {currentPhase === "review" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Toxicity Assessment (CTCAE)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {TOXICITY_SITES_RT.map((site) => (
                  <div key={site} className="p-2 border rounded-lg">
                    <p className="text-xs font-medium mb-2">{site}</p>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((grade) => (
                        <Button
                          key={grade}
                          size="sm"
                          variant={grade === 0 ? "outline" : grade <= 2 ? "secondary" : "destructive"}
                          className="w-6 h-6 p-0 text-xs"
                          onClick={() => setToxicities(prev => [...prev, { site, grade: grade as 0|1|2|3|4, description: "", date: new Date().toISOString().split('T')[0] }])}
                        >
                          {grade}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Weekly Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Weight (kg)</Label>
                  <Input type="number" placeholder="70" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">ECOG Status</Label>
                  <select className="w-full mt-1 border rounded-lg p-2">
                    <option>0 - Fully active</option>
                    <option>1 - Restricted</option>
                    <option>2 - Ambulatory</option>
                    <option>3 - Limited self-care</option>
                    <option>4 - Completely disabled</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  "Pain assessment completed",
                  "Nutrition reviewed",
                  "Skin assessment done",
                  "Treatment continuing as planned",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Checkbox />
                    <Label className="text-sm">{item}</Label>
                  </div>
                ))}
              </div>

              <div>
                <Label className="text-sm">Physician Notes</Label>
                <Textarea placeholder="Weekly review notes, plan changes, supportive care..." className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Treatment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4 text-center">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{completedFractions}</p>
                  <p className="text-xs text-muted-foreground">Fractions Done</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{totalFractions - completedFractions}</p>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{deliveredDose.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Gy Delivered</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{fractionLogs.filter(f => f.status === "missed").length}</p>
                  <p className="text-xs text-muted-foreground">Missed</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{toxicities.filter(t => t.grade >= 3).length}</p>
                  <p className="text-xs text-muted-foreground">Grade 3+ Toxicity</p>
                </div>
              </div>

              <div className="flex justify-end mt-4 gap-2">
                <Button variant="outline">Print Summary</Button>
                <Button>Complete Treatment Course</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
