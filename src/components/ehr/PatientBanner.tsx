import { motion } from "framer-motion";
import { useEHR } from "@/contexts/EHRContext";
import {
  AlertTriangle,
  User,
  Calendar,
  MapPin,
  Activity,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  Home,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { format, differenceInYears } from "date-fns";
import { VitalsMonitor } from "./VitalsMonitor";
import { DischargeWorkflow } from "./discharge/DischargeWorkflow";

interface Alert {
  id: string;
  type: "critical" | "warning" | "info";
  message: string;
  timestamp: Date;
}

interface ActiveEpisode {
  id: string;
  name: string;
  status: "active" | "monitoring" | "resolving";
  startDate: Date;
  primaryDiagnosis: string;
}

// Mock data for demonstration
const MOCK_ALERTS: Alert[] = [
  {
    id: "A1",
    type: "critical",
    message: "High Fall Risk - Mobility Impaired",
    timestamp: new Date(),
  },
  {
    id: "A2",
    type: "warning",
    message: "Pending Lab Results - Awaiting Blood Culture",
    timestamp: new Date(),
  },
  {
    id: "A3",
    type: "info",
    message: "DNR Order in Place",
    timestamp: new Date(),
  },
];

const MOCK_ACTIVE_EPISODES: ActiveEpisode[] = [
  {
    id: "EP1",
    name: "Pneumonia Management",
    status: "active",
    startDate: new Date("2024-12-19"),
    primaryDiagnosis: "Community-Acquired Pneumonia",
  },
  {
    id: "EP2",
    name: "Diabetes Control",
    status: "monitoring",
    startDate: new Date("2024-11-15"),
    primaryDiagnosis: "Type 2 Diabetes Mellitus",
  },
];

export function PatientBanner() {
  const { currentEncounter } = useEHR();
  const [isExpanded, setIsExpanded] = useState(false);

  // Guard: Don't render if no encounter is loaded
  if (!currentEncounter || !currentEncounter.patient) {
    return null;
  }

  const patient = currentEncounter.patient;
  const age = differenceInYears(new Date(), new Date(patient.dateOfBirth));
  const formattedDob = format(new Date(patient.dateOfBirth), "dd MMM yyyy");
  const admissionDate = format(currentEncounter.admissionDate, "dd MMM yyyy, HH:mm");

  const alertTypeStyles = {
    critical: "bg-critical/20 text-critical border-critical/50",
    warning: "bg-warning/20 text-warning border-warning/50",
    info: "bg-primary/20 text-primary border-primary/50",
  };

  const statusStyles = {
    active: "bg-critical/20 text-critical",
    monitoring: "bg-warning/20 text-warning",
    resolving: "bg-success/20 text-success",
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="bg-card border-b border-border">
        {/* Compact Banner - Always Visible */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between gap-6">
            {/* Patient Identity */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    {patient.name}
                  </h2>
                  <Badge variant="outline" className="text-xs font-mono">
                    {patient.mrn}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      patient.gender === "female"
                        ? "bg-pink-500/10 text-pink-600 border-pink-500/30"
                        : patient.gender === "male"
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                        : "bg-purple-500/10 text-purple-600 border-purple-500/30"
                    }`}
                  >
                    {patient.gender === "female" ? "F" : patient.gender === "male" ? "M" : "O"} • {age}y
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    DOB: {formattedDob}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {patient.ward} • {patient.bed}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Vitals with Real-time Monitoring */}
            <VitalsMonitor compact />

            {/* Allergies Alert */}
            {patient.allergies.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-critical/10 border border-critical/30 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-critical" />
                <div className="text-sm">
                  <span className="font-medium text-critical">Allergies:</span>
                  <span className="ml-1 text-foreground">
                    {patient.allergies.join(", ")}
                  </span>
                </div>
              </div>
            )}

            {/* Active Alerts Badge */}
            <div className="flex items-center gap-2">
              {MOCK_ALERTS.filter((a) => a.type === "critical").length > 0 && (
                <Badge className="bg-critical text-critical-foreground">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {MOCK_ALERTS.filter((a) => a.type === "critical").length} Critical
                </Badge>
              )}
              {MOCK_ACTIVE_EPISODES.length > 0 && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  <Activity className="w-3 h-3 mr-1" />
                  {MOCK_ACTIVE_EPISODES.length} Active Episodes
                </Badge>
              )}
              
              {/* Discharge Button */}
              <DischargeWorkflow
                encounterId={currentEncounter.id || "mock-encounter"}
                patientName={patient.name}
                mrn={patient.mrn}
                ward={patient.ward}
                bed={patient.bed}
              />
            </div>

            {/* Expand/Collapse Button */}
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    More
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* Expanded Section */}
        <CollapsibleContent>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border"
          >
            <div className="px-4 py-3 space-y-4">
              {/* Detailed Vitals with Charts */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Vital Signs Trends
                </h3>
                <VitalsMonitor compact={false} />
              </div>

              <div className="grid grid-cols-3 gap-6 pt-2 border-t border-border">
                {/* Demographics & Contact */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Demographics
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Encounter Type:</span>
                      <span className="font-medium capitalize">{currentEncounter.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Admission Date:</span>
                      <span className="font-medium">{admissionDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Attending:</span>
                      <span className="font-medium">{currentEncounter.attendingPhysician}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{currentEncounter.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          currentEncounter.status === "active"
                            ? "bg-success/20 text-success border-success/50"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {currentEncounter.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Alerts */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Active Alerts
                  </h3>
                  <div className="space-y-2">
                    {MOCK_ALERTS.map((alert) => (
                      <div
                        key={alert.id}
                        className={`px-3 py-2 rounded-md border text-sm ${alertTypeStyles[alert.type]}`}
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{alert.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Episodes */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Active Episodes
                  </h3>
                  <div className="space-y-2">
                    {MOCK_ACTIVE_EPISODES.map((episode) => (
                      <div
                        key={episode.id}
                        className="px-3 py-2 rounded-md border border-border bg-muted/30"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{episode.name}</span>
                          <Badge className={`text-xs ${statusStyles[episode.status]}`}>
                            {episode.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span>{episode.primaryDiagnosis}</span>
                          <span className="mx-2">•</span>
                          <span className="flex items-center gap-1 inline-flex">
                            <Clock className="w-3 h-3" />
                            Since {format(episode.startDate, "dd MMM")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
