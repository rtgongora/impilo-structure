import React, { useState, useEffect } from "react";
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
  ArrowRight,
  Send,
  FileText,
  Stethoscope,
  Pill,
  Loader2,
  Save,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
  const { user, profile } = useAuth();
  const [generalNotes, setGeneralNotes] = useState("");
  const [patients, setPatients] = useState<HandoffPatient[]>([]);
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchActivePatients();
  }, []);

  const fetchActivePatients = async () => {
    try {
      // Fetch active encounters with patient and bed data
      const { data: encounters, error } = await supabase
        .from("encounters")
        .select(`
          id,
          patient_id,
          ward,
          bed,
          chief_complaint,
          primary_diagnosis,
          triage_category,
          patients!inner(id, first_name, last_name, mrn)
        `)
        .eq("status", "active")
        .limit(20);

      if (error) throw error;

      // Transform to HandoffPatient format
      const handoffPatients: HandoffPatient[] = (encounters || []).map((enc) => {
        const patient = enc.patients as { id: string; first_name: string; last_name: string; mrn: string };
        const acuity = mapTriageToAcuity(enc.triage_category);
        
        return {
          id: patient.id,
          name: `${patient.first_name} ${patient.last_name}`,
          mrn: patient.mrn,
          bed: enc.bed || "Unassigned",
          ward: enc.ward || "General",
          diagnosis: enc.primary_diagnosis || enc.chief_complaint || "Pending assessment",
          acuity,
          keyEvents: [],
          pendingTasks: [],
          medications: [],
          vitalsStatus: "stable" as const,
          lastVitals: "No recent vitals",
        };
      });

      setPatients(handoffPatients);
      setSelectedPatients(handoffPatients.map((p) => p.id));
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Failed to load patients");
    } finally {
      setIsLoading(false);
    }
  };

  const mapTriageToAcuity = (triage: string | null): "critical" | "high" | "moderate" | "stable" => {
    switch (triage?.toLowerCase()) {
      case "red":
      case "immediate":
        return "critical";
      case "orange":
      case "emergent":
        return "high";
      case "yellow":
      case "urgent":
        return "moderate";
      default:
        return "stable";
    }
  };

  const currentShift = {
    from: profile?.display_name || "Current User",
    to: "Incoming Staff",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    date: new Date().toLocaleDateString(),
  };

  const togglePatient = (id: string) => {
    setSelectedPatients((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const saveHandoff = async (status: "draft" | "pending") => {
    if (!user) {
      toast.error("You must be logged in to save a handoff");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("shift_handoffs").insert({
        outgoing_user_id: user.id,
        shift_date: new Date().toISOString().split("T")[0],
        shift_time: currentShift.time,
        general_notes: generalNotes,
        status,
        patient_ids: selectedPatients,
      });

      if (error) throw error;

      toast.success(status === "draft" ? "Draft saved" : "Handoff submitted successfully");
      
      if (status === "pending") {
        setGeneralNotes("");
      }
    } catch (error) {
      console.error("Error saving handoff:", error);
      toast.error("Failed to save handoff");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
            <p className="text-2xl font-bold">{patients.length}</p>
            <p className="text-sm text-muted-foreground">Total Patients</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">
              {patients.filter((p) => p.acuity === "critical").length}
            </p>
            <p className="text-sm text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">
              {patients.filter((p) => p.acuity === "high").length}
            </p>
            <p className="text-sm text-muted-foreground">High Acuity</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-500">
              {patients.filter((p) => p.acuity === "stable").length}
            </p>
            <p className="text-sm text-muted-foreground">Stable</p>
          </CardContent>
        </Card>
      </div>

      {/* Patient List */}
      {patients.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No active patients found</p>
            <p className="text-sm">Patients with active encounters will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {patients.map((patient) => {
              const VitalsIcon = vitalsConfig[patient.vitalsStatus].icon;

              return (
                <Card
                  key={patient.id}
                  className={`transition-all cursor-pointer ${
                    selectedPatients.includes(patient.id)
                      ? "ring-2 ring-primary"
                      : "opacity-75"
                  }`}
                  onClick={() => togglePatient(patient.id)}
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
                          <span className="font-medium">Diagnosis</span>
                        </div>
                        <p className="text-xs">{patient.diagnosis}</p>
                      </div>

                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-2">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Pending Tasks</span>
                        </div>
                        {patient.pendingTasks.length > 0 ? (
                          <ul className="space-y-1">
                            {patient.pendingTasks.map((task, i) => (
                              <li key={i} className="text-xs text-amber-600 dark:text-amber-400">
                                □ {task}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-muted-foreground">No pending tasks</p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-2">
                          <Pill className="h-4 w-4" />
                          <span className="font-medium">Key Medications</span>
                        </div>
                        {patient.medications.length > 0 ? (
                          <ul className="space-y-1">
                            {patient.medications.map((med, i) => (
                              <li key={i} className="text-xs">• {med}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-muted-foreground">No active medications</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}

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
        <Button variant="outline" onClick={() => saveHandoff("draft")} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Draft
        </Button>
        <Button onClick={() => saveHandoff("pending")} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          Complete Handoff
        </Button>
      </div>
    </div>
  );
}
