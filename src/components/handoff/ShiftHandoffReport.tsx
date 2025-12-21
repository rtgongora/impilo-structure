import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  ArrowRight,
  Send,
  FileText,
  Stethoscope,
  Pill,
  Activity,
} from "lucide-react";

interface HandoffPatient {
  id: string;
  name: string;
  mrn: string;
  bed: string;
  ward: string;
  diagnosis: string;
  acuity: "critical" | "high" | "moderate" | "stable";
  keyEvents: string[];
  pendingTasks: string[];
  medications: string[];
  vitalsStatus: "stable" | "concerning" | "critical";
  lastVitals: string;
}

const MOCK_HANDOFF_PATIENTS: HandoffPatient[] = [
  {
    id: "1",
    name: "Tendai Moyo",
    mrn: "MRN-2024-001234",
    bed: "ICU-04",
    ward: "ICU",
    diagnosis: "Sepsis, Pneumonia",
    acuity: "critical",
    keyEvents: [
      "Started on vasopressors at 14:00",
      "Blood cultures drawn - pending",
      "Family meeting scheduled for tomorrow",
    ],
    pendingTasks: [
      "Repeat lactate at 18:00",
      "Chest X-ray review",
      "Nephrology consult follow-up",
    ],
    medications: ["Norepinephrine 0.1 mcg/kg/min", "Piperacillin-Tazobactam 4.5g q8h", "Hydrocortisone 50mg q6h"],
    vitalsStatus: "concerning",
    lastVitals: "BP 90/60, HR 110, SpO2 94%",
  },
  {
    id: "2",
    name: "Grace Chikondi",
    mrn: "MRN-2024-001890",
    bed: "B-12",
    ward: "Medical",
    diagnosis: "DKA - resolving",
    acuity: "moderate",
    keyEvents: [
      "Anion gap closed at 10:00",
      "Transitioned to SC insulin",
      "Tolerating oral intake",
    ],
    pendingTasks: [
      "Endocrine follow-up appointment",
      "Diabetes education",
      "Discharge planning",
    ],
    medications: ["Lantus 20 units bedtime", "Humalog sliding scale"],
    vitalsStatus: "stable",
    lastVitals: "BP 125/78, HR 82, Glucose 156",
  },
  {
    id: "3",
    name: "Farai Dube",
    mrn: "MRN-2024-002456",
    bed: "C-08",
    ward: "Surgical",
    diagnosis: "Post appendectomy Day 1",
    acuity: "stable",
    keyEvents: [
      "Surgery uneventful",
      "Ambulated twice",
      "Diet advanced to full liquids",
    ],
    pendingTasks: [
      "Check surgical site",
      "Advance diet if tolerating",
      "Pain management assessment",
    ],
    medications: ["Paracetamol 1g q6h", "Tramadol 50mg PRN"],
    vitalsStatus: "stable",
    lastVitals: "BP 118/72, HR 76, Temp 37.1°C",
  },
];

const acuityConfig = {
  critical: { color: "bg-destructive text-destructive-foreground", label: "Critical" },
  high: { color: "bg-amber-500 text-white", label: "High" },
  moderate: { color: "bg-blue-500 text-white", label: "Moderate" },
  stable: { color: "bg-emerald-500 text-white", label: "Stable" },
};

const vitalsConfig = {
  stable: { color: "text-emerald-500", icon: CheckCircle },
  concerning: { color: "text-amber-500", icon: AlertTriangle },
  critical: { color: "text-destructive", icon: AlertTriangle },
};

export function ShiftHandoffReport() {
  const [generalNotes, setGeneralNotes] = useState("");
  const [selectedPatients, setSelectedPatients] = useState<string[]>(
    MOCK_HANDOFF_PATIENTS.map((p) => p.id)
  );

  const currentShift = {
    from: "Dr. Sarah Moyo",
    to: "Dr. James Ncube",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    date: new Date().toLocaleDateString(),
  };

  const togglePatient = (id: string) => {
    setSelectedPatients((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Shift Handoff Report</h2>
                <p className="text-sm text-muted-foreground">
                  {currentShift.date} • {currentShift.time}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Outgoing</p>
                <p className="font-medium">{currentShift.from}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Incoming</p>
                <p className="font-medium">{currentShift.to}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{MOCK_HANDOFF_PATIENTS.length}</p>
            <p className="text-sm text-muted-foreground">Total Patients</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">
              {MOCK_HANDOFF_PATIENTS.filter((p) => p.acuity === "critical").length}
            </p>
            <p className="text-sm text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">
              {MOCK_HANDOFF_PATIENTS.reduce((acc, p) => acc + p.pendingTasks.length, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Pending Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-500">
              {MOCK_HANDOFF_PATIENTS.filter((p) => p.vitalsStatus === "stable").length}
            </p>
            <p className="text-sm text-muted-foreground">Stable Vitals</p>
          </CardContent>
        </Card>
      </div>

      {/* Patient List */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-4">
          {MOCK_HANDOFF_PATIENTS.map((patient) => {
            const VitalsIcon = vitalsConfig[patient.vitalsStatus].icon;

            return (
              <Card
                key={patient.id}
                className={`transition-all ${
                  selectedPatients.includes(patient.id)
                    ? "ring-2 ring-primary"
                    : "opacity-75"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{patient.name}</h4>
                          <Badge className={acuityConfig[patient.acuity].color}>
                            {acuityConfig[patient.acuity].label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {patient.mrn} • {patient.bed} ({patient.ward})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <VitalsIcon className={`h-5 w-5 ${vitalsConfig[patient.vitalsStatus].color}`} />
                      <span className="text-sm">{patient.lastVitals}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-2">
                        <Stethoscope className="h-4 w-4" />
                        <span className="font-medium">Key Events</span>
                      </div>
                      <ul className="space-y-1">
                        {patient.keyEvents.map((event, i) => (
                          <li key={i} className="text-xs">• {event}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Pending Tasks</span>
                      </div>
                      <ul className="space-y-1">
                        {patient.pendingTasks.map((task, i) => (
                          <li key={i} className="text-xs text-amber-600 dark:text-amber-400">
                            □ {task}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-2">
                        <Pill className="h-4 w-4" />
                        <span className="font-medium">Key Medications</span>
                      </div>
                      <ul className="space-y-1">
                        {patient.medications.map((med, i) => (
                          <li key={i} className="text-xs">• {med}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="text-xs text-muted-foreground">
                    <strong>Diagnosis:</strong> {patient.diagnosis}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* General Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            General Handoff Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any general notes for the incoming shift..."
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Save Draft
        </Button>
        <Button>
          <Send className="h-4 w-4 mr-2" />
          Complete Handoff
        </Button>
      </div>
    </div>
  );
}
