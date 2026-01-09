import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Heart,
  Zap,
  Phone,
  Ambulance,
  Activity,
  Baby,
  Flame,
  Skull,
  Shield,
  Stethoscope,
  Users,
  MapPin,
  Clock,
  ChevronRight,
  ArrowLeft,
  UserRound,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmergencySOS } from "@/components/portal/EmergencySOS";

// Clinical Emergency Protocol Types
interface ClinicalEmergencyProtocol {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  severity: "critical" | "high" | "medium";
  workspaceType: string;
  teamRequired: string[];
  typicalDuration: string;
}

const CLINICAL_EMERGENCY_PROTOCOLS: ClinicalEmergencyProtocol[] = [
  {
    id: "code-blue",
    name: "Code Blue",
    description: "Cardiac/Respiratory Arrest - Immediate resuscitation required",
    icon: Heart,
    severity: "critical",
    workspaceType: "resuscitation",
    teamRequired: ["Team Leader", "Airway", "Compressions", "IV/Meds", "Defibrillator", "Documentation"],
    typicalDuration: "30-60 min",
  },
  {
    id: "rapid-response",
    name: "Rapid Response",
    description: "Clinical deterioration - Urgent assessment and intervention",
    icon: Activity,
    severity: "critical",
    workspaceType: "rapid_response",
    teamRequired: ["Physician", "Nurse", "Respiratory Therapist"],
    typicalDuration: "15-30 min",
  },
  {
    id: "trauma",
    name: "Trauma Activation",
    description: "Major trauma - ATLS protocol activation",
    icon: Ambulance,
    severity: "critical",
    workspaceType: "trauma",
    teamRequired: ["Team Leader", "Airway", "Circulation", "Procedures", "Radiology", "Documentation"],
    typicalDuration: "60+ min",
  },
  {
    id: "neonatal-resus",
    name: "Neonatal Resuscitation",
    description: "Newborn requiring immediate resuscitation",
    icon: Baby,
    severity: "critical",
    workspaceType: "neonatal_resus",
    teamRequired: ["Neonatologist/Paediatrician", "Nurse", "Midwife"],
    typicalDuration: "15-30 min",
  },
  {
    id: "burns",
    name: "Burns Protocol",
    description: "Major burns - Fluid resuscitation and wound care",
    icon: Flame,
    severity: "high",
    workspaceType: "burns",
    teamRequired: ["Burns Surgeon", "Nurse", "Anaesthetist"],
    typicalDuration: "60+ min",
  },
  {
    id: "poisoning",
    name: "Poisoning/Overdose",
    description: "Toxicological emergency - Decontamination and antidotes",
    icon: Skull,
    severity: "critical",
    workspaceType: "poisoning",
    teamRequired: ["Physician", "Nurse", "Toxicology Consult"],
    typicalDuration: "Variable",
  },
  {
    id: "sexual-assault",
    name: "Sexual Assault Exam",
    description: "Trauma-informed examination and evidence collection",
    icon: Shield,
    severity: "high",
    workspaceType: "sexual_assault",
    teamRequired: ["Forensic Examiner", "Nurse", "Counsellor", "Police Liaison"],
    typicalDuration: "2-4 hours",
  },
  {
    id: "obstetric-emergency",
    name: "Obstetric Emergency",
    description: "Maternal or fetal emergency - Immediate intervention",
    icon: Baby,
    severity: "critical",
    workspaceType: "labour_delivery",
    teamRequired: ["Obstetrician", "Midwife", "Anaesthetist", "Neonatologist"],
    typicalDuration: "Variable",
  },
];

// Personal Emergency Types (for practitioner as patient)
const PERSONAL_EMERGENCY_TYPES = [
  { id: "chest-pain", label: "Chest Pain", icon: Heart, severity: "critical" },
  { id: "breathing", label: "Difficulty Breathing", icon: Activity, severity: "critical" },
  { id: "injury", label: "Severe Injury", icon: Ambulance, severity: "high" },
  { id: "allergic", label: "Allergic Reaction", icon: AlertTriangle, severity: "high" },
  { id: "poisoning", label: "Poisoning", icon: Skull, severity: "critical" },
  { id: "other", label: "Other Emergency", icon: Phone, severity: "medium" },
];

interface EmergencyHubProps {
  onClose?: () => void;
}

export function EmergencyHub({ onClose }: EmergencyHubProps) {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<"select" | "personal" | "clinical">("select");
  const [selectedProtocol, setSelectedProtocol] = useState<ClinicalEmergencyProtocol | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const handleActivateClinicalProtocol = (protocol: ClinicalEmergencyProtocol) => {
    setIsActivating(true);
    // Navigate to encounter with the workspace activated
    // In real implementation, this would create a critical event and navigate
    setTimeout(() => {
      navigate(`/encounter?workspace=${protocol.workspaceType}&critical=true`);
      onClose?.();
    }, 500);
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-destructive bg-destructive/10 hover:bg-destructive/20";
      case "high":
        return "border-warning bg-warning/10 hover:bg-warning/20";
      default:
        return "border-border hover:bg-muted";
    }
  };

  // Initial Selection Screen
  if (selectedTab === "select") {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold">Emergency Services</h2>
          <p className="text-muted-foreground">
            Select the type of emergency assistance you need
          </p>
        </div>

        <div className="grid gap-4">
          {/* Personal Emergency */}
          <Card 
            className="cursor-pointer border-2 border-pink-500/50 hover:border-pink-500 hover:bg-pink-500/10 transition-all group"
            onClick={() => setSelectedTab("personal")}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-pink-500 flex items-center justify-center shrink-0">
                  <UserRound className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    I Need Help
                    <Badge variant="outline" className="bg-pink-500/10 text-pink-500 border-pink-500/30">Personal</Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    I'm experiencing a medical emergency and need immediate assistance
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-pink-500 transition-colors" />
              </div>
            </CardContent>
          </Card>

          {/* Clinical Emergency */}
          <Card 
            className="cursor-pointer border-2 border-destructive/50 hover:border-destructive hover:bg-destructive/10 transition-all group"
            onClick={() => setSelectedTab("clinical")}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-destructive flex items-center justify-center shrink-0">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    Patient Emergency
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Clinical</Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Activate clinical emergency protocols for a patient (Code Blue, Trauma, etc.)
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Contacts Quick Access */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center mb-3">Quick Emergency Contacts</p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" size="sm" className="gap-2">
              <Phone className="h-4 w-4" />
              999 (Ambulance)
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Phone className="h-4 w-4" />
              Security
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Personal Emergency - Full EmergencySOS
  if (selectedTab === "personal") {
    return (
      <div className="h-full">
        <div className="p-4 border-b bg-pink-500/10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedTab("select")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-pink-500" />
              <h3 className="font-semibold">Personal Emergency</h3>
            </div>
            <Badge className="bg-pink-500 text-white ml-auto">For You</Badge>
          </div>
        </div>
        <div className="p-0">
          <EmergencySOS />
        </div>
      </div>
    );
  }

  // Clinical Emergency Protocols
  if (selectedTab === "clinical") {
    if (selectedProtocol) {
      return (
        <div className="h-full flex flex-col">
          {/* Protocol Header */}
          <div className="p-4 border-b bg-destructive/10">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setSelectedProtocol(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-destructive" />
                <h3 className="font-semibold">{selectedProtocol.name}</h3>
              </div>
              <Badge className={cn(
                "ml-auto",
                selectedProtocol.severity === "critical" && "bg-destructive text-white",
                selectedProtocol.severity === "high" && "bg-warning text-warning-foreground"
              )}>
                {selectedProtocol.severity.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Protocol Details */}
          <div className="flex-1 p-6 space-y-6 overflow-auto">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                <selectedProtocol.icon className="h-10 w-10 text-destructive" />
              </div>
              <h2 className="text-xl font-bold">{selectedProtocol.name}</h2>
              <p className="text-muted-foreground mt-1">{selectedProtocol.description}</p>
            </div>

            {/* Team Required */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedProtocol.teamRequired.map((role) => (
                    <Badge key={role} variant="outline">{role}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Duration */}
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Typical Duration</p>
                  <p className="text-sm text-muted-foreground">{selectedProtocol.typicalDuration}</p>
                </div>
              </CardContent>
            </Card>

            {/* Activation Warning */}
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Activation Warning</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Activating this protocol will page the emergency team, override normal workflow,
                    and begin time-critical documentation. Only activate for genuine emergencies.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activation Button */}
          <div className="p-4 border-t bg-muted/30">
            <Button
              className="w-full h-14 text-lg font-bold bg-destructive hover:bg-destructive/90"
              onClick={() => handleActivateClinicalProtocol(selectedProtocol)}
              disabled={isActivating}
            >
              {isActivating ? (
                <>
                  <Zap className="h-5 w-5 mr-2 animate-pulse" />
                  ACTIVATING...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  ACTIVATE {selectedProtocol.name.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    // Protocol Selection List
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-destructive/10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedTab("select")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-destructive" />
              <h3 className="font-semibold">Clinical Emergency Protocols</h3>
            </div>
            <Badge className="bg-destructive text-white ml-auto">Work</Badge>
          </div>
        </div>

        {/* Protocols List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {CLINICAL_EMERGENCY_PROTOCOLS.map((protocol) => {
              const Icon = protocol.icon;
              return (
                <Card
                  key={protocol.id}
                  className={cn(
                    "cursor-pointer border-2 transition-all",
                    getSeverityStyles(protocol.severity)
                  )}
                  onClick={() => setSelectedProtocol(protocol)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                        protocol.severity === "critical" && "bg-destructive",
                        protocol.severity === "high" && "bg-warning"
                      )}>
                        <Icon className={cn(
                          "h-6 w-6",
                          protocol.severity === "critical" && "text-white",
                          protocol.severity === "high" && "text-warning-foreground"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{protocol.name}</h4>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              protocol.severity === "critical" && "border-destructive text-destructive",
                              protocol.severity === "high" && "border-warning text-warning"
                            )}
                          >
                            {protocol.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {protocol.description}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="p-4 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center mb-3">Can't find what you need?</p>
          <Button variant="outline" className="w-full" onClick={() => navigate("/encounter")}>
            <Stethoscope className="h-4 w-4 mr-2" />
            Start Standard Encounter
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
