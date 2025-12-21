import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Flame, Droplets, Clock, User, AlertTriangle, Activity,
  Plus, ChevronRight, Syringe, FileText, Heart, Thermometer,
  CheckCircle, Wind
} from "lucide-react";
import { useState } from "react";

interface FluidOrder {
  id: string;
  time: string;
  type: string;
  volume: number;
  rate: string;
}

const BURN_MECHANISMS = [
  "Flame", "Scald", "Contact", "Chemical", "Electrical", "Radiation", "Friction"
];

const BODY_REGIONS = [
  { region: "Head", adult: 9, child: 18 },
  { region: "Neck", adult: 1, child: 1 },
  { region: "Anterior Trunk", adult: 18, child: 18 },
  { region: "Posterior Trunk", adult: 18, child: 18 },
  { region: "Right Arm", adult: 9, child: 9 },
  { region: "Left Arm", adult: 9, child: 9 },
  { region: "Genitalia", adult: 1, child: 1 },
  { region: "Right Leg", adult: 18, child: 13.5 },
  { region: "Left Leg", adult: 18, child: 13.5 },
];

const BURN_DEPTHS = [
  { depth: "Superficial (1st)", description: "Erythema only, painful", color: "bg-red-200" },
  { depth: "Partial Thickness (2nd)", description: "Blisters, very painful", color: "bg-orange-300" },
  { depth: "Full Thickness (3rd)", description: "White/charred, painless", color: "bg-gray-500" },
];

export function BurnsWorkspace() {
  const [currentPhase, setCurrentPhase] = useState<"assessment" | "resuscitation" | "wound" | "plan">("assessment");
  const [burnAreas, setBurnAreas] = useState<Record<string, number>>({});
  const [fluidOrders, setFluidOrders] = useState<FluidOrder[]>([]);
  const [patientWeight, setPatientWeight] = useState<number>(70);
  const [isChild, setIsChild] = useState(false);

  const calculateTBSA = () => {
    return Object.values(burnAreas).reduce((sum, val) => sum + val, 0);
  };

  const calculateParklandFormula = () => {
    const tbsa = calculateTBSA();
    const totalVolume = 4 * patientWeight * tbsa;
    return {
      total: totalVolume,
      first8Hours: totalVolume / 2,
      next16Hours: totalVolume / 2,
      hourlyFirst8: Math.round((totalVolume / 2) / 8),
      hourlyNext16: Math.round((totalVolume / 2) / 16),
    };
  };

  const addFluidOrder = () => {
    const newOrder: FluidOrder = {
      id: `FLUID-${Date.now()}`,
      time: new Date().toLocaleTimeString(),
      type: "Hartmann's",
      volume: 0,
      rate: "",
    };
    setFluidOrders(prev => [...prev, newOrder]);
  };

  const parkland = calculateParklandFormula();
  const tbsa = calculateTBSA();

  const phases = [
    { id: "assessment", label: "Initial Assessment" },
    { id: "resuscitation", label: "Fluid Resuscitation" },
    { id: "wound", label: "Wound Care" },
    { id: "plan", label: "Management Plan" },
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
              className={`whitespace-nowrap ${currentPhase === phase.id ? "bg-orange-500 hover:bg-orange-600" : ""}`}
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

      {/* Assessment Phase */}
      {currentPhase === "assessment" && (
        <div className="space-y-6">
          {/* Primary Survey Alert */}
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
                <div className="flex-1">
                  <h4 className="font-medium text-destructive">Primary Survey First!</h4>
                  <p className="text-sm text-muted-foreground">
                    Complete ABCDE assessment. Check for inhalation injury, circumferential burns, and associated trauma.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="cursor-pointer hover:bg-destructive/10">
                    <Wind className="w-3 h-3 mr-1" />
                    Airway Risk
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-destructive/10">
                    <Activity className="w-3 h-3 mr-1" />
                    Inhalation Injury
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Burn Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Mechanism</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {BURN_MECHANISMS.map((mech) => (
                      <Badge key={mech} variant="outline" className="cursor-pointer hover:bg-orange-500/20">
                        {mech}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Time of Injury</Label>
                    <Input type="datetime-local" className="mt-2" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Time Since Injury</Label>
                    <Input className="mt-2" placeholder="Hours" />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Circumstance</Label>
                  <Textarea className="mt-2" placeholder="How did the burn occur..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Patient Weight (kg)</Label>
                    <Input 
                      type="number" 
                      className="mt-2"
                      value={patientWeight}
                      onChange={(e) => setPatientWeight(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Age Group</Label>
                    <div className="flex gap-2 mt-2">
                      <Badge 
                        variant={!isChild ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setIsChild(false)}
                      >
                        Adult
                      </Badge>
                      <Badge 
                        variant={isChild ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setIsChild(true)}
                      >
                        Child (&lt;10yr)
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-primary" />
                  TBSA Calculation (Rule of Nines)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {BODY_REGIONS.map((region) => (
                    <div key={region.region} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{region.region}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Max: {isChild ? region.child : region.adult}%
                        </span>
                        <Input
                          type="number"
                          className="w-16 h-8 text-center"
                          placeholder="0"
                          max={isChild ? region.child : region.adult}
                          value={burnAreas[region.region] || ""}
                          onChange={(e) => setBurnAreas(prev => ({
                            ...prev,
                            [region.region]: Math.min(
                              parseInt(e.target.value) || 0,
                              isChild ? region.child : region.adult
                            )
                          }))}
                        />
                        <span className="text-sm">%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total TBSA:</span>
                    <span className="text-2xl font-bold text-orange-600">{tbsa}%</span>
                  </div>
                  {tbsa >= 15 && (
                    <div className="mt-2 text-sm text-orange-600">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      Major burn - requires fluid resuscitation
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Burn Depth Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {BURN_DEPTHS.map((depth) => (
                    <div key={depth.depth} className={`p-4 rounded-lg ${depth.color}`}>
                      <h4 className="font-medium text-sm text-gray-800">{depth.depth}</h4>
                      <p className="text-xs text-gray-700 mt-1">{depth.description}</p>
                    </div>
                  ))}
                </div>
                <Textarea className="mt-4" placeholder="Describe burn depth distribution across affected areas..." />
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setCurrentPhase("resuscitation")}>
              Continue to Resuscitation
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Resuscitation Phase */}
      {currentPhase === "resuscitation" && (
        <div className="space-y-6">
          {/* Parkland Formula Calculator */}
          <Card className="border-blue-500 bg-blue-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-blue-600">
                <Droplets className="w-5 h-5" />
                Parkland Formula - Fluid Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">Weight</div>
                  <div className="text-xl font-bold">{patientWeight} kg</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">TBSA</div>
                  <div className="text-xl font-bold">{tbsa}%</div>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <div className="text-xs text-blue-600">Total 24hr Volume</div>
                  <div className="text-xl font-bold text-blue-600">{parkland.total} ml</div>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <div className="text-xs text-orange-600">First 8 Hours</div>
                  <div className="text-xl font-bold text-orange-600">{parkland.first8Hours} ml</div>
                  <div className="text-xs text-orange-600">({parkland.hourlyFirst8} ml/hr)</div>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <div className="text-xs text-green-600">Next 16 Hours</div>
                  <div className="text-xl font-bold text-green-600">{parkland.next16Hours} ml</div>
                  <div className="text-xs text-green-600">({parkland.hourlyNext16} ml/hr)</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Formula: 4 × Weight (kg) × TBSA (%) = Total crystalloid volume over 24 hours (from time of burn).
                Give half in first 8 hours, remainder over next 16 hours.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Syringe className="w-5 h-5 text-primary" />
                  IV Access & Fluids
                </CardTitle>
                <Button size="sm" variant="outline" onClick={addFluidOrder}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Fluid
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">IV Access Sites</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["Peripheral IV", "Central Line", "IO Access", "Through Burn"].map((site) => (
                      <Badge key={site} variant="outline" className="cursor-pointer hover:bg-secondary">
                        {site}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {fluidOrders.map((order, idx) => (
                    <div key={order.id} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{order.time}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <select className="p-2 border rounded text-sm">
                          <option>Hartmann's</option>
                          <option>Normal Saline</option>
                          <option>Albumin 5%</option>
                          <option>Packed RBCs</option>
                        </select>
                        <Input placeholder="Volume (ml)" type="number" />
                        <Input placeholder="Rate (ml/hr)" />
                      </div>
                    </div>
                  ))}
                  {fluidOrders.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No fluid orders recorded
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Monitoring Targets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <Label className="text-xs text-muted-foreground">Urine Output Target</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg font-bold">0.5-1.0</span>
                      <span className="text-sm text-muted-foreground">ml/kg/hr</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: {Math.round(patientWeight * 0.5)} - {Math.round(patientWeight * 1)} ml/hr
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <Label className="text-xs text-muted-foreground">Current Urine Output</Label>
                    <Input type="number" placeholder="ml/hr" className="mt-1" />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Hourly Urine Output Log</Label>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Log Output
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Additional Monitoring</Label>
                  <div className="space-y-2 mt-2">
                    {["Arterial line", "CVP monitoring", "Hourly vitals", "Lactate trending"].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <Checkbox id={item} />
                        <Label htmlFor={item} className="text-sm cursor-pointer">{item}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("assessment")}>Back</Button>
            <Button onClick={() => setCurrentPhase("wound")}>
              Continue to Wound Care
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Wound Care Phase */}
      {currentPhase === "wound" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Initial Wound Care</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Cooling</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox id="cooling" />
                  <Label htmlFor="cooling" className="text-sm">
                    Cool running water applied for 20 minutes (within 3 hours of injury)
                  </Label>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Decontamination</Label>
                <div className="space-y-2 mt-2">
                  {["Chemical neutralization", "Irrigation", "Debridement of loose tissue"].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Checkbox id={item} />
                      <Label htmlFor={item} className="text-sm cursor-pointer">{item}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Dressing Applied</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Cling film", "Saline gauze", "Silver dressing", "Paraffin gauze", "Hydrogel"].map((dressing) => (
                    <Badge key={dressing} variant="outline" className="cursor-pointer hover:bg-secondary">
                      {dressing}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Escharotomy Required?</Label>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="cursor-pointer hover:bg-destructive/10">
                    Not Required
                  </Badge>
                  <Badge variant="destructive" className="cursor-pointer">
                    Yes - Circumferential Burn
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Infection Prevention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Tetanus Status</Label>
                <div className="flex gap-2 mt-2">
                  {["Up to date", "Tetanus given", "Tetanus + Ig given", "Declined"].map((status) => (
                    <Badge key={status} variant="outline" className="cursor-pointer hover:bg-secondary text-xs">
                      {status}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Prophylactic Antibiotics</Label>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="cursor-pointer">Not Indicated</Badge>
                  <Badge variant="outline" className="cursor-pointer">Started</Badge>
                </div>
                <Input className="mt-2" placeholder="If started, specify antibiotic..." />
              </div>

              <div>
                <Label className="text-sm font-medium">Topical Antimicrobials</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Silver sulfadiazine", "Mupirocin", "Chlorhexidine", "None"].map((med) => (
                    <Badge key={med} variant="outline" className="cursor-pointer hover:bg-secondary text-xs">
                      {med}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pain Management & Other Care</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Analgesia</Label>
                  <div className="space-y-2 mt-2">
                    {["Paracetamol", "NSAIDs", "Morphine/Opioids", "Ketamine"].map((drug) => (
                      <div key={drug} className="flex items-center gap-2">
                        <Checkbox id={drug} />
                        <Label htmlFor={drug} className="text-sm cursor-pointer">{drug}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Nutrition</Label>
                  <div className="space-y-2 mt-2">
                    {["NBM", "Oral allowed", "NG feeding", "TPN considered"].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <Checkbox id={item} />
                        <Label htmlFor={item} className="text-sm cursor-pointer">{item}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">VTE Prophylaxis</Label>
                  <div className="space-y-2 mt-2">
                    {["TED stockings", "Pneumatic compression", "LMWH", "Not yet - bleeding risk"].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <Checkbox id={item} />
                        <Label htmlFor={item} className="text-sm cursor-pointer">{item}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("resuscitation")}>Back</Button>
            <Button onClick={() => setCurrentPhase("plan")}>
              Continue to Management Plan
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Management Plan Phase */}
      {currentPhase === "plan" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Disposition & Referral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Disposition</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Burns Unit", "ICU", "Ward Admission", "Outpatient", "Transfer"].map((disp) => (
                    <Badge key={disp} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      {disp}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Referral Criteria Met?</Label>
                <div className="space-y-2 mt-2 text-sm">
                  {[
                    ">10% TBSA (adult) or >5% (child/elderly)",
                    "Full thickness burns",
                    "Burns to face, hands, feet, genitalia, major joints",
                    "Circumferential burns",
                    "Inhalation injury",
                    "Chemical or electrical burns",
                    "Associated trauma",
                  ].map((criteria) => (
                    <div key={criteria} className="flex items-center gap-2 p-2 border rounded">
                      <Checkbox id={criteria} />
                      <Label htmlFor={criteria} className="text-xs cursor-pointer">{criteria}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Follow-up Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Surgical Planning</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Conservative management", "Debridement needed", "Skin grafting likely", "Escharotomy done"].map((plan) => (
                    <Badge key={plan} variant="outline" className="cursor-pointer hover:bg-secondary text-xs">
                      {plan}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Rehabilitation Needs</Label>
                <div className="space-y-2 mt-2">
                  {["Physiotherapy", "Occupational therapy", "Pressure garments", "Scar management", "Psychological support"].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Checkbox id={item} />
                      <Label htmlFor={item} className="text-sm cursor-pointer">{item}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Follow-up Appointment</Label>
                <Input type="date" className="mt-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Burns Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{tbsa}%</div>
                  <div className="text-xs text-muted-foreground">TBSA</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{patientWeight} kg</div>
                  <div className="text-xs text-muted-foreground">Weight</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{parkland.total} ml</div>
                  <div className="text-xs text-muted-foreground">24hr Fluid Target</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{fluidOrders.length}</div>
                  <div className="text-xs text-muted-foreground">Fluid Orders</div>
                </div>
              </div>

              <Textarea placeholder="Additional summary notes..." className="min-h-[100px]" />

              <Button className="w-full mt-4">
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Burns Workspace
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
