import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, AlertTriangle, Clock, User, Heart, 
  ChevronRight, CheckCircle, FileText, Lock, Eye,
  Phone, Users, Clipboard, Package, AlertCircle
} from "lucide-react";
import { useState } from "react";

// Note: This workspace handles sensitive medico-legal documentation
// All data is restricted access and follows trauma-informed care principles

interface ConsentItem {
  id: string;
  label: string;
  granted: boolean | null;
}

interface EvidenceItem {
  id: string;
  type: string;
  collected: boolean;
  sealNumber?: string;
  collectedBy?: string;
  time?: string;
}

const CONSENT_ITEMS: ConsentItem[] = [
  { id: "exam", label: "Physical examination", granted: null },
  { id: "evidence", label: "Evidence collection", granted: null },
  { id: "photos", label: "Photo documentation", granted: null },
  { id: "police", label: "Release to law enforcement", granted: null },
  { id: "counselor", label: "Counselor/advocate present", granted: null },
  { id: "storeEvidence", label: "Anonymous evidence storage", granted: null },
];

const EVIDENCE_TYPES = [
  "Oral swabs", "Genital swabs", "Anal swabs", "Fingernail scrapings",
  "Foreign material", "Clothing", "Hair samples", "Blood samples",
  "Urine sample", "Buccal swab (reference DNA)"
];

const PROPHYLAXIS_OPTIONS = [
  { id: "hiv", label: "HIV PEP (Post-Exposure Prophylaxis)", description: "28-day course" },
  { id: "hepb", label: "Hepatitis B Vaccination", description: "If not immunized" },
  { id: "sti", label: "STI Prophylaxis", description: "Ceftriaxone, Azithromycin, Metronidazole" },
  { id: "ec", label: "Emergency Contraception", description: "If indicated" },
  { id: "tetanus", label: "Tetanus Prophylaxis", description: "If wounds present" },
];

const SAFETY_ASSESSMENT = [
  "Safe to return home",
  "Perpetrator is household member",
  "Access to safe shelter",
  "Children at risk",
  "History of domestic violence",
  "Weapons involved",
  "Threats to life made",
];

export function SexualAssaultWorkspace() {
  const [currentPhase, setCurrentPhase] = useState<"safety" | "consent" | "history" | "exam" | "evidence" | "care" | "referrals">("safety");
  const [consents, setConsents] = useState<ConsentItem[]>(CONSENT_ITEMS);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>(
    EVIDENCE_TYPES.map(type => ({ id: type, type, collected: false }))
  );
  const [safetyChecks, setSafetyChecks] = useState<string[]>([]);
  const [selectedProphylaxis, setSelectedProphylaxis] = useState<string[]>([]);

  const updateConsent = (id: string, granted: boolean) => {
    setConsents(prev => prev.map(c => c.id === id ? { ...c, granted } : c));
  };

  const toggleEvidence = (id: string) => {
    setEvidenceItems(prev => prev.map(e => 
      e.id === id ? { ...e, collected: !e.collected, time: !e.collected ? new Date().toLocaleTimeString() : undefined } : e
    ));
  };

  const toggleSafetyCheck = (check: string) => {
    setSafetyChecks(prev => 
      prev.includes(check) ? prev.filter(c => c !== check) : [...prev, check]
    );
  };

  const phases = [
    { id: "safety", label: "Safety" },
    { id: "consent", label: "Consent" },
    { id: "history", label: "History" },
    { id: "exam", label: "Examination" },
    { id: "evidence", label: "Evidence" },
    { id: "care", label: "Clinical Care" },
    { id: "referrals", label: "Referrals" },
  ];

  return (
    <div className="space-y-6">
      {/* Restricted Access Banner */}
      <Card className="border-2 border-primary bg-primary/5">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-primary" />
              <span className="font-medium">RESTRICTED ACCESS - Medico-Legal Documentation</span>
            </div>
            <Badge variant="outline" className="border-primary text-primary">
              <Eye className="w-3 h-3 mr-1" />
              Trauma-Informed Care
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Phase Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
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

      {/* Safety Phase */}
      {currentPhase === "safety" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-5 h-5 text-destructive" />
                Immediate Medical Stabilization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  "Airway/Breathing/Circulation stable",
                  "Life-threatening injuries addressed",
                  "Acute pain management",
                  "Privacy ensured",
                  "Support person/advocate offered",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Checkbox />
                    <Label className="text-sm">{item}</Label>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div>
                  <Label className="text-xs">BP</Label>
                  <Input placeholder="120/80" className="mt-1 h-8" />
                </div>
                <div>
                  <Label className="text-xs">HR</Label>
                  <Input placeholder="78" className="mt-1 h-8" />
                </div>
                <div>
                  <Label className="text-xs">Temp</Label>
                  <Input placeholder="36.8" className="mt-1 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Safety Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {SAFETY_ASSESSMENT.map((item) => (
                <div 
                  key={item} 
                  className={`flex items-center gap-3 p-2 rounded ${
                    safetyChecks.includes(item) ? "bg-warning/10 border border-warning/30" : ""
                  }`}
                >
                  <Checkbox
                    checked={safetyChecks.includes(item)}
                    onCheckedChange={() => toggleSafetyCheck(item)}
                  />
                  <Label className="text-sm cursor-pointer">{item}</Label>
                </div>
              ))}

              {safetyChecks.length > 2 && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg mt-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">High-Risk Safety Concerns Identified</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Support Services Notified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "SANE Nurse", status: "pending" },
                  { label: "Social Worker", status: "pending" },
                  { label: "Victim Advocate", status: "pending" },
                  { label: "Police (if consented)", status: "pending" },
                ].map((service) => (
                  <div key={service.label} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{service.label}</span>
                      <Checkbox />
                    </div>
                    <Input placeholder="Time notified" className="mt-2 h-7 text-xs" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-end">
            <Button onClick={() => setCurrentPhase("consent")}>
              Proceed to Consent
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Consent Phase */}
      {currentPhase === "consent" && (
        <div className="grid grid-cols-2 gap-6">
          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clipboard className="w-5 h-5 text-primary" />
                Informed Consent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/50 rounded-lg mb-4">
                <p className="text-sm">
                  Patient has been informed of all procedures in trauma-sensitive manner. 
                  Each component is optional and can be withdrawn at any time.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {consents.map((consent) => (
                  <div key={consent.id} className="p-4 border rounded-lg">
                    <p className="font-medium text-sm mb-3">{consent.label}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={consent.granted === true ? "default" : "outline"}
                        onClick={() => updateConsent(consent.id, true)}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Consent
                      </Button>
                      <Button
                        size="sm"
                        variant={consent.granted === false ? "destructive" : "outline"}
                        onClick={() => updateConsent(consent.id, false)}
                        className="flex-1"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <Label className="text-sm">Witness Name</Label>
                  <Input placeholder="Staff member present" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Consent Documented At</Label>
                  <Input type="datetime-local" className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("safety")}>Back</Button>
            <Button onClick={() => setCurrentPhase("history")}>
              Proceed to History
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* History Phase */}
      {currentPhase === "history" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                High-Level History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <p className="text-xs text-warning">
                  Document only essential medical information. Avoid detailed narrative 
                  that could be re-traumatizing. Use patient's own words when possible.
                </p>
              </div>

              <div>
                <Label className="text-sm">Date/Time of Assault (if known)</Label>
                <Input type="datetime-local" className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">Time Elapsed Since Assault</Label>
                <select className="w-full mt-1 border rounded-lg p-2">
                  <option>&lt; 24 hours</option>
                  <option>24-72 hours</option>
                  <option>72 hours - 7 days</option>
                  <option>&gt; 7 days</option>
                </select>
              </div>

              <div>
                <Label className="text-sm">Activities Since Assault (affects evidence)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["Bathed/Showered", "Changed clothes", "Urinated", "Defecated", 
                    "Oral hygiene", "Ate/Drank", "Douched", "Used tampon"].map((activity) => (
                    <div key={activity} className="flex items-center gap-2">
                      <Checkbox />
                      <Label className="text-xs">{activity}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Relevant Medical History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Allergies</Label>
                <Input placeholder="Drug allergies" className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">Current Medications</Label>
                <Textarea placeholder="List medications" className="mt-1 h-20" />
              </div>

              <div>
                <Label className="text-sm">Tetanus Status</Label>
                <select className="w-full mt-1 border rounded-lg p-2">
                  <option>Up to date (&lt;5 years)</option>
                  <option>Needs update (&gt;5 years)</option>
                  <option>Unknown</option>
                </select>
              </div>

              <div>
                <Label className="text-sm">Hepatitis B Vaccination Status</Label>
                <select className="w-full mt-1 border rounded-lg p-2">
                  <option>Fully vaccinated</option>
                  <option>Partially vaccinated</option>
                  <option>Not vaccinated</option>
                  <option>Unknown</option>
                </select>
              </div>

              <div>
                <Label className="text-sm">HIV Status (if known)</Label>
                <select className="w-full mt-1 border rounded-lg p-2">
                  <option>Unknown</option>
                  <option>Negative (recent test)</option>
                  <option>Positive (on treatment)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("consent")}>Back</Button>
            <Button onClick={() => setCurrentPhase("exam")}>
              Proceed to Examination
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Examination Phase */}
      {currentPhase === "exam" && (
        <div className="grid grid-cols-2 gap-6">
          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Physical Examination
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-primary/5 rounded-lg">
                <p className="text-sm">
                  Document findings objectively. Note location, size, color, and type of injuries.
                  Use body diagrams for injury mapping if available.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="font-medium text-sm">General Examination</p>
                  {["Head/Face", "Neck", "Chest", "Abdomen", "Back", "Arms", "Legs"].map((area) => (
                    <div key={area} className="p-3 border rounded-lg">
                      <Label className="text-sm font-medium">{area}</Label>
                      <Textarea placeholder="Findings or 'No visible injury'" className="mt-1 h-16" />
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <p className="font-medium text-sm">Ano-Genital Examination</p>
                  <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Performed only with explicit consent. Use colposcope if available.
                    </p>
                  </div>
                  
                  {["External genitalia", "Vaginal/Penile", "Cervix (if applicable)", "Anal/Perianal"].map((area) => (
                    <div key={area} className="p-3 border rounded-lg">
                      <Label className="text-sm font-medium">{area}</Label>
                      <Textarea placeholder="Findings or 'Normal/Not examined'" className="mt-1 h-16" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("history")}>Back</Button>
            <Button onClick={() => setCurrentPhase("evidence")}>
              Proceed to Evidence
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Evidence Phase */}
      {currentPhase === "evidence" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Evidence Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {evidenceItems.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-3 border rounded-lg ${item.collected ? "bg-primary/5 border-primary/30" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={item.collected}
                          onCheckedChange={() => toggleEvidence(item.id)}
                        />
                        <span className="text-sm">{item.type}</span>
                      </div>
                      {item.collected && (
                        <Badge variant="outline" className="text-xs">
                          {item.time}
                        </Badge>
                      )}
                    </div>
                    {item.collected && (
                      <Input 
                        placeholder="Seal number" 
                        className="mt-2 h-7 text-xs"
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Chain of Custody
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Kit Number</Label>
                <Input placeholder="SANE Kit #" className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">Collected By</Label>
                <Input placeholder="Examiner name & credentials" className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">Collection Start Time</Label>
                <Input type="datetime-local" className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">Collection End Time</Label>
                <Input type="datetime-local" className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">Kit Sealed & Stored</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Checkbox />
                  <span className="text-sm">Evidence kit sealed with tamper-evident seal</span>
                </div>
              </div>

              <div>
                <Label className="text-sm">Storage Location</Label>
                <Input placeholder="Secure evidence locker" className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("exam")}>Back</Button>
            <Button onClick={() => setCurrentPhase("care")}>
              Proceed to Clinical Care
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Clinical Care Phase */}
      {currentPhase === "care" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Prophylaxis & Treatment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {PROPHYLAXIS_OPTIONS.map((option) => (
                <div 
                  key={option.id} 
                  className={`p-3 border rounded-lg cursor-pointer ${
                    selectedProphylaxis.includes(option.id) ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setSelectedProphylaxis(prev => 
                    prev.includes(option.id) ? prev.filter(p => p !== option.id) : [...prev, option.id]
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox checked={selectedProphylaxis.includes(option.id)} />
                    <div>
                      <span className="font-medium text-sm">{option.label}</span>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Labs & Investigations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Pregnancy test",
                "HIV baseline",
                "Hepatitis B surface antibody",
                "Hepatitis C antibody",
                "Syphilis serology",
                "Gonorrhea/Chlamydia NAAT",
                "CBC",
                "Liver function (if PEP)",
                "Renal function (if PEP)",
              ].map((lab) => (
                <div key={lab} className="flex items-center gap-3">
                  <Checkbox />
                  <Label className="text-sm">{lab}</Label>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                Wound Care & Other Treatment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Document any wound care, sutures, medications given, pain management..." 
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          <div className="col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPhase("evidence")}>Back</Button>
            <Button onClick={() => setCurrentPhase("referrals")}>
              Proceed to Referrals
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Referrals Phase */}
      {currentPhase === "referrals" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Safeguarding & Referrals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { service: "Crisis Counseling", urgency: "Immediate" },
                { service: "Victim Advocacy Services", urgency: "Within 24h" },
                { service: "Social Work", urgency: "If safety concerns" },
                { service: "Child Protection", urgency: "If minor or children at risk" },
                { service: "Mental Health Follow-up", urgency: "Within 1 week" },
                { service: "Infectious Disease (PEP)", urgency: "Within 72h" },
                { service: "GYN/Urology Follow-up", urgency: "As needed" },
              ].map((referral) => (
                <div key={referral.service} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Checkbox />
                    <span className="text-sm">{referral.service}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{referral.urgency}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Follow-Up Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">PEP Follow-up (if started)</Label>
                <Input type="date" className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">STI Testing Repeat (3 months)</Label>
                <Input type="date" className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">Pregnancy Test (if applicable)</Label>
                <Input type="date" className="mt-1" />
              </div>

              <div>
                <Label className="text-sm">Patient Given Written Information</Label>
                <div className="space-y-2 mt-2">
                  {["PEP instructions", "STI information", "Crisis hotline numbers", 
                    "Follow-up appointment details", "Victim rights information"].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Checkbox />
                      <Label className="text-xs">{item}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm">Safe Contact Method</Label>
                <Input placeholder="Phone/email - confirm safe to contact" className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 border-2 border-primary">
            <CardHeader className="pb-3 bg-primary/5">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Restricted Summary (for authorized access only)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Textarea 
                placeholder="Brief clinical summary for restricted-access medical record..."
                className="min-h-[100px]"
              />
              <div className="flex justify-end mt-4 gap-2">
                <Button variant="outline">Print Patient Copy</Button>
                <Button>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete & Lock Record
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
