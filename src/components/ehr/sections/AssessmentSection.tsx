import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Ambulance,
  Activity,
  Stethoscope,
  FileText,
  Heart,
  Brain,
  Wind,
  User,
  Pill,
  Users,
  CheckCircle2,
  Plus,
  Thermometer,
  TestTube,
  Clock,
  ClipboardList,
} from "lucide-react";
import { format } from "date-fns";
import { MOCK_TRIAGE, MOCK_HISTORY, MOCK_VITALS } from "@/data/mockClinicalData";
import type { TriageCategory } from "@/types/clinical";
import { VitalsRecorder } from "@/components/clinical/VitalsRecorder";
import { LabResultsSystem } from "@/components/lab/LabResultsSystem";
import { PatientTimeline } from "@/components/timeline/PatientTimeline";
import { ClerkingTemplateSelector } from "@/components/ehr/clerking/ClerkingTemplateSelector";
import { ClerkingFormEditor } from "@/components/ehr/clerking/ClerkingFormEditor";
import { CLERKING_TEMPLATES, type CadreLevel, type ClerkingTemplate } from "@/data/clerkingTemplates";
import { useParams } from "react-router-dom";

const triageColors: Record<TriageCategory, { bg: string; border: string; text: string; label: string }> = {
  red: { bg: "bg-critical", border: "border-critical", text: "text-critical-foreground", label: "Immediate" },
  orange: { bg: "bg-warning", border: "border-warning", text: "text-warning-foreground", label: "Very Urgent" },
  yellow: { bg: "bg-yellow-500", border: "border-yellow-500", text: "text-black", label: "Urgent" },
  green: { bg: "bg-success", border: "border-success", text: "text-success-foreground", label: "Standard" },
};

function TriagePanel() {
  const triage = MOCK_TRIAGE;
  const color = triageColors[triage.category];
  
  return (
    <div className="space-y-4">
      {/* Triage Category Banner */}
      <Card className={`${color.border} border-2`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full ${color.bg} flex items-center justify-center`}>
                <AlertTriangle className={`w-6 h-6 ${color.text}`} />
              </div>
              <div>
                <div className="text-lg font-semibold">{color.label}</div>
                <div className="text-sm text-muted-foreground">
                  Triaged at {format(triage.triageTime, "HH:mm")} by {triage.triagedBy}
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-1">
                <Ambulance className="w-3 h-3 mr-1" />
                {triage.arrivalMode.replace("-", " ")}
              </Badge>
              <div className="text-xs text-muted-foreground">
                Arrived: {format(triage.arrivalTime, "HH:mm")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chief Complaint */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Chief Complaint</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">{triage.chiefComplaint}</p>
          {triage.notes && (
            <p className="text-sm text-muted-foreground mt-2">{triage.notes}</p>
          )}
        </CardContent>
      </Card>

      {/* Danger Signs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Danger Signs Screening</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {triage.dangerSigns.map(sign => (
              <div 
                key={sign.id} 
                className={`flex items-center gap-2 p-2 rounded-lg ${
                  sign.present ? 'bg-critical/10 border border-critical/30' : 'bg-muted/50'
                }`}
              >
                {sign.present ? (
                  <AlertTriangle className="w-4 h-4 text-critical" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                )}
                <span className="text-sm">{sign.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Triage Vitals */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Triage Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Heart className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
              <div className="text-xl font-semibold">{MOCK_VITALS.heartRate?.value}</div>
              <div className="text-xs text-muted-foreground">HR (bpm)</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Activity className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
              <div className="text-xl font-semibold">
                {MOCK_VITALS.bloodPressure?.systolic.value}/{MOCK_VITALS.bloodPressure?.diastolic.value}
              </div>
              <div className="text-xs text-muted-foreground">BP (mmHg)</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Wind className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
              <div className="text-xl font-semibold">{MOCK_VITALS.spo2?.value}%</div>
              <div className="text-xs text-muted-foreground">SpO₂</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HistoryPanel() {
  const history = MOCK_HISTORY;
  
  return (
    <div className="space-y-4">
      {/* Presenting Complaint */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Presenting Complaint
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{history.presentingComplaint}</p>
        </CardContent>
      </Card>

      {/* History of Present Illness */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">History of Present Illness</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{history.historyOfPresentIllness}</p>
        </CardContent>
      </Card>

      {/* Past Medical History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            Past Medical History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {history.pastMedicalHistory.map(condition => (
              <div key={condition.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant={condition.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {condition.status}
                  </Badge>
                  <span className="font-medium">{condition.condition}</span>
                </div>
                {condition.diagnosed && (
                  <span className="text-xs text-muted-foreground">
                    Since {format(condition.diagnosed, "MMM yyyy")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Past Surgical History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Past Surgical History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.pastSurgicalHistory.length > 0 ? (
            <div className="space-y-2">
              {history.pastSurgicalHistory.map(surgery => (
                <div key={surgery.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <span>{surgery.procedure}</span>
                  {surgery.date && (
                    <span className="text-xs text-muted-foreground">
                      {format(surgery.date, "MMM yyyy")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No previous surgeries</p>
          )}
        </CardContent>
      </Card>

      {/* Obs/Gyn History */}
      {history.obsGynHistory && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Obstetric & Gynaecological History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-2 bg-muted/50 rounded-lg">
                <div className="text-2xl font-semibold">{history.obsGynHistory.gravida}</div>
                <div className="text-xs text-muted-foreground">Gravida</div>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <div className="text-2xl font-semibold">{history.obsGynHistory.para}</div>
                <div className="text-xs text-muted-foreground">Para</div>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <div className="text-2xl font-semibold">{history.obsGynHistory.abortions || 0}</div>
                <div className="text-xs text-muted-foreground">Abortions</div>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <div className="text-2xl font-semibold">{history.obsGynHistory.livingChildren}</div>
                <div className="text-xs text-muted-foreground">Living</div>
              </div>
            </div>
            {history.obsGynHistory.lastMenstrualPeriod && (
              <div className="mt-3 text-sm">
                <span className="text-muted-foreground">LMP: </span>
                {format(history.obsGynHistory.lastMenstrualPeriod, "dd MMM yyyy")}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Drug History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Pill className="w-4 h-4" />
            Current Medications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {history.drugHistory.filter(d => d.isCurrentlyTaking).map(drug => (
              <div key={drug.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div>
                  <span className="font-medium">{drug.medication}</span>
                  <span className="text-muted-foreground ml-2">{drug.dose}</span>
                </div>
                <span className="text-sm text-muted-foreground">{drug.frequency}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Allergies */}
      <Card className="border-warning">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-warning">
            <AlertTriangle className="w-4 h-4" />
            Allergies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {history.allergies.map(allergy => (
              <div key={allergy.id} className={`p-3 rounded-lg ${
                allergy.severity === 'life_threatening' ? 'bg-critical/10 border border-critical/30' :
                allergy.severity === 'severe' ? 'bg-warning/10 border border-warning/30' :
                'bg-muted/50'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{allergy.allergen}</span>
                  <Badge variant={allergy.severity === 'life_threatening' ? 'destructive' : 'outline'}>
                    {allergy.severity.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{allergy.reaction}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social History */}
      {history.socialHistory && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Social History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-2 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Occupation</div>
                <div className="font-medium">{history.socialHistory.occupation || "—"}</div>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Smoking</div>
                <div className="font-medium capitalize">{history.socialHistory.smokingStatus}</div>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Alcohol</div>
                <div className="font-medium capitalize">{history.socialHistory.alcoholUse}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ExaminationPanel() {
  const [findings, setFindings] = useState({
    general: "Alert, comfortable, not in acute distress. Well-hydrated. No pallor, jaundice or cyanosis.",
    cvs: "S1 S2 normal, no murmurs. JVP not raised. Peripheral pulses palpable.",
    resp: "Chest clear bilaterally. Good air entry. No wheeze or crackles.",
    abdo: "Soft, tender in right upper quadrant. Positive Murphy's sign. No guarding or rigidity. Bowel sounds present.",
    neuro: "GCS 15/15. Pupils equal and reactive. No focal neurological deficit.",
  });

  const systems = [
    { key: "general", label: "General Appearance", icon: User },
    { key: "cvs", label: "Cardiovascular", icon: Heart },
    { key: "resp", label: "Respiratory", icon: Wind },
    { key: "abdo", label: "Abdominal", icon: Activity },
    { key: "neuro", label: "Neurological", icon: Brain },
  ];

  return (
    <div className="space-y-4">
      {systems.map(system => {
        const Icon = system.icon;
        return (
          <Card key={system.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {system.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={findings[system.key as keyof typeof findings]}
                onChange={(e) => setFindings(prev => ({ ...prev, [system.key]: e.target.value }))}
                className="min-h-[80px]"
                placeholder={`Enter ${system.label.toLowerCase()} findings...`}
              />
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-end gap-2">
        <Button variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add System
        </Button>
        <Button>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Save Examination
        </Button>
      </div>
    </div>
  );
}

function ClerkingPanel() {
  const { encounterId } = useParams<{ encounterId?: string }>();
  const [selectedTemplate, setSelectedTemplate] = useState<ClerkingTemplate | null>(null);
  const [selectedCadre, setSelectedCadre] = useState<CadreLevel>("intern");

  const handleTemplateSelect = (template: ClerkingTemplate, cadre: CadreLevel) => {
    setSelectedTemplate(template);
    setSelectedCadre(cadre);
  };

  const handleFormSave = (data: Record<string, string>) => {
    console.log("Saving clerking form:", data);
    // Save to database
  };

  const handleFormSign = (data: Record<string, string>) => {
    console.log("Signing clerking form:", data);
    // Sign and finalize
  };

  if (!selectedTemplate) {
    return <ClerkingTemplateSelector onSelect={handleTemplateSelect} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setSelectedTemplate(null)}>
          ← Back to Templates
        </Button>
      </div>
      <ClerkingFormEditor
        template={selectedTemplate}
        cadreLevel={selectedCadre}
        encounterId={encounterId}
        onSave={handleFormSave}
        onSign={handleFormSign}
      />
    </div>
  );
}

export function AssessmentSection() {
  const { encounterId } = useParams<{ encounterId?: string }>();

  return (
    <Tabs defaultValue="triage" className="space-y-4">
      <TabsList className="grid w-full grid-cols-7 h-12">
        <TabsTrigger value="triage" className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="w-5 h-5" />
          Triage
        </TabsTrigger>
        <TabsTrigger value="record-vitals" className="flex items-center gap-2 text-sm font-medium">
          <Thermometer className="w-5 h-5" />
          Vitals
        </TabsTrigger>
        <TabsTrigger value="clerking" className="flex items-center gap-2 text-sm font-medium">
          <ClipboardList className="w-5 h-5" />
          Clerking
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2 text-sm font-medium">
          <FileText className="w-5 h-5" />
          History
        </TabsTrigger>
        <TabsTrigger value="examination" className="flex items-center gap-2 text-sm font-medium">
          <Stethoscope className="w-5 h-5" />
          Exam
        </TabsTrigger>
        <TabsTrigger value="labs" className="flex items-center gap-2 text-sm font-medium">
          <TestTube className="w-5 h-5" />
          Labs
        </TabsTrigger>
        <TabsTrigger value="timeline" className="flex items-center gap-2 text-sm font-medium">
          <Clock className="w-5 h-5" />
          Timeline
        </TabsTrigger>
      </TabsList>

      <TabsContent value="triage">
        <TriagePanel />
      </TabsContent>

      <TabsContent value="record-vitals">
        {encounterId ? (
          <VitalsRecorder encounterId={encounterId} />
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Select a patient encounter to record vitals
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="clerking">
        <ClerkingPanel />
      </TabsContent>

      <TabsContent value="history">
        <HistoryPanel />
      </TabsContent>

      <TabsContent value="examination">
        <ExaminationPanel />
      </TabsContent>

      <TabsContent value="labs">
        <LabResultsSystem />
      </TabsContent>

      <TabsContent value="timeline">
        <PatientTimeline />
      </TabsContent>
    </Tabs>
  );
}
