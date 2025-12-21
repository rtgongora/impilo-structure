import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Pill,
  FlaskConical,
  ClipboardList,
  ChevronRight,
  X,
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  Shield,
  Zap,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Types
type AlertSeverity = "critical" | "high" | "moderate" | "low" | "info";
type AlertStatus = "active" | "acknowledged" | "dismissed" | "resolved";
type AlertCategory = "drug-interaction" | "lab-value" | "care-protocol";

interface CDSAlert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  details?: string;
  recommendation?: string;
  source?: string;
  timestamp: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  relatedItems?: string[];
}

interface DrugInteraction {
  id: string;
  drug1: string;
  drug2: string;
  severity: AlertSeverity;
  effect: string;
  mechanism: string;
  recommendation: string;
  evidence: string;
}

interface LabAlert {
  id: string;
  testName: string;
  value: number;
  unit: string;
  normalRange: { min: number; max: number };
  criticalRange: { min: number; max: number };
  trend: "rising" | "falling" | "stable";
  previousValue?: number;
  timestamp: Date;
}

interface CareProtocol {
  id: string;
  name: string;
  condition: string;
  status: "due" | "overdue" | "upcoming" | "completed";
  dueDate?: Date;
  lastCompleted?: Date;
  frequency: string;
  tasks: { id: string; name: string; completed: boolean }[];
}

// Mock Data
const MOCK_DRUG_INTERACTIONS: DrugInteraction[] = [
  {
    id: "DI1",
    drug1: "Warfarin",
    drug2: "Aspirin",
    severity: "high",
    effect: "Increased bleeding risk",
    mechanism: "Both drugs affect platelet function and coagulation",
    recommendation: "Monitor INR closely. Consider alternative antiplatelet if possible.",
    evidence: "Level A - Multiple RCTs",
  },
  {
    id: "DI2",
    drug1: "Metformin",
    drug2: "IV Contrast",
    severity: "critical",
    effect: "Risk of lactic acidosis",
    mechanism: "Contrast-induced nephropathy can impair metformin clearance",
    recommendation: "Hold metformin 48h before and after contrast. Check renal function.",
    evidence: "Level B - Limited RCTs",
  },
  {
    id: "DI3",
    drug1: "Amiodarone",
    drug2: "Simvastatin",
    severity: "moderate",
    effect: "Increased risk of myopathy/rhabdomyolysis",
    mechanism: "Amiodarone inhibits CYP3A4, increasing statin levels",
    recommendation: "Limit simvastatin to 20mg daily or switch to pravastatin",
    evidence: "Level A - Multiple RCTs",
  },
];

const MOCK_LAB_ALERTS: LabAlert[] = [
  {
    id: "LA1",
    testName: "Potassium",
    value: 5.8,
    unit: "mmol/L",
    normalRange: { min: 3.5, max: 5.0 },
    criticalRange: { min: 2.5, max: 6.5 },
    trend: "rising",
    previousValue: 5.2,
    timestamp: new Date(),
  },
  {
    id: "LA2",
    testName: "Creatinine",
    value: 2.1,
    unit: "mg/dL",
    normalRange: { min: 0.7, max: 1.3 },
    criticalRange: { min: 0.3, max: 4.0 },
    trend: "rising",
    previousValue: 1.8,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "LA3",
    testName: "Hemoglobin",
    value: 7.2,
    unit: "g/dL",
    normalRange: { min: 12.0, max: 16.0 },
    criticalRange: { min: 7.0, max: 20.0 },
    trend: "falling",
    previousValue: 8.5,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: "LA4",
    testName: "Blood Glucose",
    value: 245,
    unit: "mg/dL",
    normalRange: { min: 70, max: 140 },
    criticalRange: { min: 40, max: 400 },
    trend: "stable",
    previousValue: 238,
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
];

const MOCK_CARE_PROTOCOLS: CareProtocol[] = [
  {
    id: "CP1",
    name: "Sepsis Bundle - 3 Hour",
    condition: "Suspected Sepsis",
    status: "overdue",
    dueDate: new Date(Date.now() - 30 * 60 * 1000),
    frequency: "One-time",
    tasks: [
      { id: "t1", name: "Obtain blood cultures before antibiotics", completed: true },
      { id: "t2", name: "Measure lactate level", completed: true },
      { id: "t3", name: "Administer broad-spectrum antibiotics", completed: false },
      { id: "t4", name: "Begin fluid resuscitation (30ml/kg)", completed: false },
    ],
  },
  {
    id: "CP2",
    name: "DVT Prophylaxis Assessment",
    condition: "Immobile Patient",
    status: "due",
    dueDate: new Date(),
    lastCompleted: new Date(Date.now() - 24 * 60 * 60 * 1000),
    frequency: "Daily",
    tasks: [
      { id: "t1", name: "Assess bleeding risk", completed: false },
      { id: "t2", name: "Review current anticoagulation", completed: false },
      { id: "t3", name: "Order prophylaxis if indicated", completed: false },
    ],
  },
  {
    id: "CP3",
    name: "Pneumonia Care Bundle",
    condition: "Community-Acquired Pneumonia",
    status: "upcoming",
    dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
    frequency: "Q4H",
    tasks: [
      { id: "t1", name: "Assess respiratory status", completed: false },
      { id: "t2", name: "Evaluate oxygen requirements", completed: false },
      { id: "t3", name: "Review antibiotic timing", completed: false },
      { id: "t4", name: "Encourage mobility if stable", completed: false },
    ],
  },
];

// Utility functions
const getSeverityStyles = (severity: AlertSeverity) => {
  const styles = {
    critical: {
      bg: "bg-critical/10",
      border: "border-critical/50",
      text: "text-critical",
      badge: "bg-critical text-critical-foreground",
    },
    high: {
      bg: "bg-destructive/10",
      border: "border-destructive/50",
      text: "text-destructive",
      badge: "bg-destructive text-destructive-foreground",
    },
    moderate: {
      bg: "bg-warning/10",
      border: "border-warning/50",
      text: "text-warning",
      badge: "bg-warning text-warning-foreground",
    },
    low: {
      bg: "bg-primary/10",
      border: "border-primary/50",
      text: "text-primary",
      badge: "bg-primary text-primary-foreground",
    },
    info: {
      bg: "bg-muted",
      border: "border-border",
      text: "text-muted-foreground",
      badge: "bg-muted text-muted-foreground",
    },
  };
  return styles[severity];
};

const getLabSeverity = (lab: LabAlert): AlertSeverity => {
  if (lab.value <= lab.criticalRange.min || lab.value >= lab.criticalRange.max) {
    return "critical";
  }
  const deviation = lab.value < lab.normalRange.min
    ? (lab.normalRange.min - lab.value) / (lab.normalRange.min - lab.criticalRange.min)
    : (lab.value - lab.normalRange.max) / (lab.criticalRange.max - lab.normalRange.max);
  
  if (deviation > 0.7) return "high";
  if (deviation > 0.3) return "moderate";
  return "low";
};

// Components
function DrugInteractionCard({ interaction, onAcknowledge }: { interaction: DrugInteraction; onAcknowledge: () => void }) {
  const styles = getSeverityStyles(interaction.severity);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("p-4 rounded-lg border", styles.bg, styles.border)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg", styles.bg)}>
            <Pill className={cn("w-5 h-5", styles.text)} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                {interaction.drug1} + {interaction.drug2}
              </span>
              <Badge className={styles.badge}>
                {interaction.severity}
              </Badge>
            </div>
            <p className={cn("text-sm font-medium", styles.text)}>
              {interaction.effect}
            </p>
            <p className="text-sm text-muted-foreground">
              {interaction.mechanism}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onAcknowledge}>
          <CheckCircle2 className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-primary mt-0.5" />
          <div className="text-sm">
            <span className="font-medium text-foreground">Recommendation: </span>
            <span className="text-muted-foreground">{interaction.recommendation}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="w-3 h-3" />
          <span>Evidence: {interaction.evidence}</span>
        </div>
      </div>
    </motion.div>
  );
}

function LabAlertCard({ lab, onAcknowledge }: { lab: LabAlert; onAcknowledge: () => void }) {
  const severity = getLabSeverity(lab);
  const styles = getSeverityStyles(severity);
  const isHigh = lab.value > lab.normalRange.max;
  const isLow = lab.value < lab.normalRange.min;
  
  const TrendIcon = lab.trend === "rising" ? TrendingUp : lab.trend === "falling" ? TrendingDown : null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("p-4 rounded-lg border", styles.bg, styles.border)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg", styles.bg)}>
            <FlaskConical className={cn("w-5 h-5", styles.text)} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{lab.testName}</span>
              <Badge className={styles.badge}>
                {isHigh ? "HIGH" : isLow ? "LOW" : "ABNORMAL"}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn("text-2xl font-mono font-bold", styles.text)}>
                {lab.value}
              </span>
              <span className="text-sm text-muted-foreground">{lab.unit}</span>
              {TrendIcon && (
                <div className={cn(
                  "flex items-center gap-1 text-xs px-2 py-0.5 rounded",
                  lab.trend === "rising" ? "bg-critical/10 text-critical" : "bg-success/10 text-success"
                )}>
                  <TrendIcon className="w-3 h-3" />
                  {lab.previousValue && (
                    <span>from {lab.previousValue}</span>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Normal: {lab.normalRange.min}-{lab.normalRange.max} {lab.unit} | 
              Critical: {"<"}{lab.criticalRange.min} or {">"}{lab.criticalRange.max}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button variant="ghost" size="sm" onClick={onAcknowledge}>
            <CheckCircle2 className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {format(lab.timestamp, "HH:mm")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function CareProtocolCard({ protocol, onComplete }: { protocol: CareProtocol; onComplete: (taskId: string) => void }) {
  const statusStyles = {
    overdue: { bg: "bg-critical/10", border: "border-critical/50", text: "text-critical", badge: "bg-critical" },
    due: { bg: "bg-warning/10", border: "border-warning/50", text: "text-warning", badge: "bg-warning" },
    upcoming: { bg: "bg-primary/10", border: "border-primary/50", text: "text-primary", badge: "bg-primary" },
    completed: { bg: "bg-success/10", border: "border-success/50", text: "text-success", badge: "bg-success" },
  };
  const styles = statusStyles[protocol.status];
  const completedTasks = protocol.tasks.filter(t => t.completed).length;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("p-4 rounded-lg border", styles.bg, styles.border)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg", styles.bg)}>
            <ClipboardList className={cn("w-5 h-5", styles.text)} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{protocol.name}</span>
              <Badge className={cn("text-white", styles.badge)}>
                {protocol.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{protocol.condition}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {protocol.dueDate && (protocol.status === "overdue" 
                  ? `${Math.round((Date.now() - protocol.dueDate.getTime()) / 60000)}min overdue`
                  : format(protocol.dueDate, "HH:mm")
                )}
              </span>
              <span>{protocol.frequency}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className={cn("text-sm font-medium", styles.text)}>
            {completedTasks}/{protocol.tasks.length}
          </span>
          <p className="text-xs text-muted-foreground">tasks</p>
        </div>
      </div>
      
      <div className="space-y-2 mt-3 pt-3 border-t border-border/50">
        {protocol.tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "flex items-center gap-2 text-sm p-2 rounded cursor-pointer transition-colors",
              task.completed 
                ? "bg-success/10 text-muted-foreground line-through" 
                : "hover:bg-muted"
            )}
            onClick={() => !task.completed && onComplete(task.id)}
          >
            <div className={cn(
              "w-4 h-4 rounded border flex items-center justify-center",
              task.completed 
                ? "bg-success border-success" 
                : "border-border"
            )}>
              {task.completed && <CheckCircle2 className="w-3 h-3 text-success-foreground" />}
            </div>
            <span>{task.name}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Alert Badge for Topbar
export function CDSAlertBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const [drugInteractions] = useState(MOCK_DRUG_INTERACTIONS);
  const [labAlerts] = useState(MOCK_LAB_ALERTS);
  const [careProtocols] = useState(MOCK_CARE_PROTOCOLS);
  
  const criticalCount = 
    drugInteractions.filter(d => d.severity === "critical" || d.severity === "high").length +
    labAlerts.filter(l => getLabSeverity(l) === "critical" || getLabSeverity(l) === "high").length +
    careProtocols.filter(p => p.status === "overdue").length;
  
  const totalAlerts = drugInteractions.length + labAlerts.length + careProtocols.filter(p => p.status !== "completed").length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "relative gap-2",
            criticalCount > 0 && "text-critical hover:text-critical"
          )}
        >
          <Zap className="w-4 h-4" />
          <span className="hidden sm:inline">CDS</span>
          {totalAlerts > 0 && (
            <Badge
              className={cn(
                "absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs",
                criticalCount > 0 ? "bg-critical" : "bg-warning"
              )}
            >
              {totalAlerts}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Clinical Decision Support
          </SheetTitle>
        </SheetHeader>
        <ClinicalDecisionSupport />
      </SheetContent>
    </Sheet>
  );
}

// Main Component
export function ClinicalDecisionSupport() {
  const [drugInteractions, setDrugInteractions] = useState(MOCK_DRUG_INTERACTIONS);
  const [labAlerts, setLabAlerts] = useState(MOCK_LAB_ALERTS);
  const [careProtocols, setCareProtocols] = useState(MOCK_CARE_PROTOCOLS);
  const [activeTab, setActiveTab] = useState("all");

  const handleAcknowledgeDrug = (id: string) => {
    setDrugInteractions(prev => prev.filter(d => d.id !== id));
  };

  const handleAcknowledgeLab = (id: string) => {
    setLabAlerts(prev => prev.filter(l => l.id !== id));
  };

  const handleCompleteTask = (protocolId: string, taskId: string) => {
    setCareProtocols(prev => prev.map(p => {
      if (p.id === protocolId) {
        const updatedTasks = p.tasks.map(t => 
          t.id === taskId ? { ...t, completed: true } : t
        );
        const allCompleted = updatedTasks.every(t => t.completed);
        return {
          ...p,
          tasks: updatedTasks,
          status: allCompleted ? "completed" as const : p.status,
        };
      }
      return p;
    }));
  };

  const criticalCount = 
    drugInteractions.filter(d => d.severity === "critical" || d.severity === "high").length +
    labAlerts.filter(l => getLabSeverity(l) === "critical" || getLabSeverity(l) === "high").length +
    careProtocols.filter(p => p.status === "overdue").length;

  return (
    <div className="h-full flex flex-col">
      {/* Summary Header */}
      <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          {criticalCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-critical/10 border border-critical/50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-critical" />
              <span className="text-sm font-medium text-critical">
                {criticalCount} Critical Alert{criticalCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Pill className="w-4 h-4" />
              {drugInteractions.length} Interactions
            </span>
            <span className="flex items-center gap-1">
              <FlaskConical className="w-4 h-4" />
              {labAlerts.length} Lab Alerts
            </span>
            <span className="flex items-center gap-1">
              <ClipboardList className="w-4 h-4" />
              {careProtocols.filter(p => p.status !== "completed").length} Protocols
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
          <TabsTrigger
            value="all"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            All Alerts
          </TabsTrigger>
          <TabsTrigger
            value="drugs"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            Drug Interactions
            {drugInteractions.length > 0 && (
              <Badge variant="secondary" className="ml-2">{drugInteractions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="labs"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            Lab Values
            {labAlerts.length > 0 && (
              <Badge variant="secondary" className="ml-2">{labAlerts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="protocols"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            Care Protocols
            {careProtocols.filter(p => p.status !== "completed").length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {careProtocols.filter(p => p.status !== "completed").length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="all" className="p-4 space-y-4 m-0">
            <AnimatePresence mode="popLayout">
              {/* Critical alerts first */}
              {careProtocols.filter(p => p.status === "overdue").map(protocol => (
                <CareProtocolCard
                  key={protocol.id}
                  protocol={protocol}
                  onComplete={(taskId) => handleCompleteTask(protocol.id, taskId)}
                />
              ))}
              {drugInteractions.filter(d => d.severity === "critical" || d.severity === "high").map(interaction => (
                <DrugInteractionCard
                  key={interaction.id}
                  interaction={interaction}
                  onAcknowledge={() => handleAcknowledgeDrug(interaction.id)}
                />
              ))}
              {labAlerts.filter(l => getLabSeverity(l) === "critical" || getLabSeverity(l) === "high").map(lab => (
                <LabAlertCard
                  key={lab.id}
                  lab={lab}
                  onAcknowledge={() => handleAcknowledgeLab(lab.id)}
                />
              ))}
              
              {/* Then other alerts */}
              {drugInteractions.filter(d => d.severity !== "critical" && d.severity !== "high").map(interaction => (
                <DrugInteractionCard
                  key={interaction.id}
                  interaction={interaction}
                  onAcknowledge={() => handleAcknowledgeDrug(interaction.id)}
                />
              ))}
              {labAlerts.filter(l => getLabSeverity(l) !== "critical" && getLabSeverity(l) !== "high").map(lab => (
                <LabAlertCard
                  key={lab.id}
                  lab={lab}
                  onAcknowledge={() => handleAcknowledgeLab(lab.id)}
                />
              ))}
              {careProtocols.filter(p => p.status !== "overdue" && p.status !== "completed").map(protocol => (
                <CareProtocolCard
                  key={protocol.id}
                  protocol={protocol}
                  onComplete={(taskId) => handleCompleteTask(protocol.id, taskId)}
                />
              ))}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="drugs" className="p-4 space-y-4 m-0">
            <AnimatePresence mode="popLayout">
              {drugInteractions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No drug interactions detected</p>
                </div>
              ) : (
                drugInteractions.map(interaction => (
                  <DrugInteractionCard
                    key={interaction.id}
                    interaction={interaction}
                    onAcknowledge={() => handleAcknowledgeDrug(interaction.id)}
                  />
                ))
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="labs" className="p-4 space-y-4 m-0">
            <AnimatePresence mode="popLayout">
              {labAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No abnormal lab values</p>
                </div>
              ) : (
                labAlerts.map(lab => (
                  <LabAlertCard
                    key={lab.id}
                    lab={lab}
                    onAcknowledge={() => handleAcknowledgeLab(lab.id)}
                  />
                ))
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="protocols" className="p-4 space-y-4 m-0">
            <AnimatePresence mode="popLayout">
              {careProtocols.filter(p => p.status !== "completed").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>All care protocols completed</p>
                </div>
              ) : (
                careProtocols.filter(p => p.status !== "completed").map(protocol => (
                  <CareProtocolCard
                    key={protocol.id}
                    protocol={protocol}
                    onComplete={(taskId) => handleCompleteTask(protocol.id, taskId)}
                  />
                ))
              )}
            </AnimatePresence>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
