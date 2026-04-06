import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  X,
  Lightbulb,
  Pill,
  FlaskConical,
  Activity,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useKernelRequest } from "@/hooks/useKernelRequest";
import { useEHR } from "@/contexts/EHRContext";

interface CDSGuidanceItem {
  id: string;
  type: "alert" | "recommendation" | "reminder" | "ai-insight";
  severity: "critical" | "high" | "moderate" | "info";
  title: string;
  message: string;
  source: string;
  timestamp: Date;
  dismissed: boolean;
  actionLabel?: string;
}

// Mock patient-context-based guidance that would come from CDS rules engine + AI
const generateContextualGuidance = (): CDSGuidanceItem[] => [
  {
    id: "cds-1",
    type: "alert",
    severity: "critical",
    title: "Sepsis Screening Due",
    message: "Patient has fever (38.2°C), tachycardia (103 bpm), and elevated WBC. qSOFA score ≥2 — initiate Sepsis Bundle within 1 hour.",

    source: "Clinical Decision Support Rules Engine",
    timestamp: new Date(),
    dismissed: false,
    actionLabel: "Start Sepsis Bundle",
  },
  {
    id: "cds-2",
    type: "recommendation",
    severity: "high",
    title: "Renal Dose Adjustment Needed",
    message: "Creatinine rising (1.8 → 2.1 mg/dL). Metformin 500mg requires dose review — hold or reduce per eGFR calculation.",
    source: "Pharmacy CDS",
    timestamp: new Date(Date.now() - 5 * 60000),
    dismissed: false,
    actionLabel: "Review Medications",
  },
  {
    id: "cds-3",
    type: "ai-insight",
    severity: "moderate",
    title: "AI Clinical Insight",
    message: "Based on presenting symptoms (acute cholecystitis K81.0), vitals pattern, and diabetes history — consider early surgical consultation. Evidence suggests better outcomes with cholecystectomy within 72h of admission.",
    source: "AI Diagnostic Assistant",
    timestamp: new Date(Date.now() - 10 * 60000),
    dismissed: false,
    actionLabel: "Request Consult",
  },
  {
    id: "cds-4",
    type: "reminder",
    severity: "info",
    title: "DVT Prophylaxis",
    message: "Patient is post-operative day 1. VTE risk assessment indicates enoxaparin 40mg SC daily. Next dose due at 18:00.",
    source: "Care Protocol Engine",
    timestamp: new Date(Date.now() - 15 * 60000),
    dismissed: false,
  },
];

const severityConfig = {
  critical: {
    bg: "bg-critical/10",
    border: "border-critical/30",
    text: "text-critical",
    icon: AlertTriangle,
    pulse: true,
  },
  high: {
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    text: "text-destructive",
    icon: Pill,
    pulse: false,
  },
  moderate: {
    bg: "bg-warning/10",
    border: "border-warning/30",
    text: "text-warning",
    icon: Sparkles,
    pulse: false,
  },
  info: {
    bg: "bg-primary/10",
    border: "border-primary/30",
    text: "text-primary",
    icon: Lightbulb,
    pulse: false,
  },
};

const typeIcons = {
  alert: AlertTriangle,
  recommendation: Activity,
  reminder: Clock,
  "ai-insight": Sparkles,
};

export function ActiveCDSBanner() {
  const { hasActivePatient } = useEHR();
  const { invoke, startCorrelation } = useKernelRequest();
  const [guidance, setGuidance] = useState<CDSGuidanceItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // Load contextual guidance when patient is active
  useEffect(() => {
    if (hasActivePatient) {
      const items = generateContextualGuidance();
      setGuidance(items);
      setCurrentIndex(0);
      
      // Fetch AI insight
      fetchAIGuidance();
    }
  }, [hasActivePatient]);

  // Auto-rotate through non-dismissed items
  useEffect(() => {
    if (!expanded && activeItems.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % activeItems.length);
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [expanded, guidance]);

  const activeItems = guidance.filter((g) => !g.dismissed);

  const fetchAIGuidance = useCallback(async () => {
    setIsLoadingAI(true);
    try {
      startCorrelation();
      const { data, error } = await invoke<{ data?: { result?: { redFlags?: string[]; clinicalPearls?: string[] } } }>("ai-diagnostic", {
        type: "cds-guidance",
        patientData: {
          symptoms: ["acute cholecystitis", "fever", "right upper quadrant pain"],
          vitalSigns: {
            temperature: 38.2,
            bloodPressure: { systolic: 142, diastolic: 88 },
            heartRate: 103,
            respiratoryRate: 18,
            oxygenSaturation: 94,
          },
          labResults: [
            { name: "WBC", value: 14.2, unit: "x10^9/L" },
            { name: "CRP", value: 85, unit: "mg/L" },
            { name: "Creatinine", value: 2.1, unit: "mg/dL" },
            { name: "Potassium", value: 5.8, unit: "mmol/L" },
            { name: "Blood Glucose", value: 245, unit: "mg/dL" },
          ],
          medications: ["Metformin 500mg BD", "Lisinopril 10mg OD", "Insulin Glargine 20U"],
          allergies: ["Penicillin"],
          conditions: ["Type 2 Diabetes Mellitus", "Hypertension", "Acute Cholecystitis"],
          age: 33,
          gender: "Female",
        },
      });

      if (data?.data?.result) {
        const result = data.data.result;
        if (result.redFlags?.length) {
          setGuidance((prev) => [
            ...prev,
            {
              id: `ai-live-${Date.now()}`,
              type: "ai-insight" as const,
              severity: "high" as const,
              title: "AI Red Flag Detection",
              message: result.redFlags!.join(". "),
              source: "AI Diagnostic Engine (Live)",
              timestamp: new Date(),
              dismissed: false,
            },
          ]);
        }
        if (result.clinicalPearls?.length) {
          setAiInsight(result.clinicalPearls!.join(" • "));
        }
      }
    } catch (err) {
      console.warn("Clinical Decision Support AI guidance unavailable:", err);
    } finally {
      setIsLoadingAI(false);
    }
  }, []);

  const dismissItem = (id: string) => {
    setGuidance((prev) =>
      prev.map((g) => (g.id === id ? { ...g, dismissed: true } : g))
    );
  };

  const dismissAll = () => {
    setGuidance((prev) => prev.map((g) => ({ ...g, dismissed: true })));
  };

  if (!hasActivePatient || activeItems.length === 0) return null;

  const current = activeItems[currentIndex % activeItems.length];
  if (!current) return null;

  const config = severityConfig[current.severity];
  const TypeIcon = typeIcons[current.type];

  return (
    <div className={cn("border-t", config.bg)}>
      {/* Compact banner - single line with rotation */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={cn("flex items-center gap-1.5 shrink-0", config.text)}>
          {config.pulse ? (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-critical opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-critical" />
            </span>
          ) : (
            <TypeIcon className="h-3.5 w-3.5" />
          )}
        </div>

        <Badge
          variant="secondary"
          className={cn("text-[9px] px-1.5 py-0 shrink-0", config.bg, config.text)}
        >
          {current.type === "ai-insight" ? "AI" : current.severity.toUpperCase()}
        </Badge>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex-1 min-w-0 flex items-center gap-2"
          >
            <span className="text-xs font-semibold shrink-0">{current.title}</span>
            <span className="text-xs text-muted-foreground truncate">{current.message}</span>
          </motion.div>
        </AnimatePresence>

        {current.actionLabel && (
          <Button
            size="sm"
            variant="ghost"
            className={cn("h-6 text-[10px] px-2 shrink-0", config.text)}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {current.actionLabel}
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        )}

        <div className="flex items-center gap-1 shrink-0">
          {isLoadingAI && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          
          {activeItems.length > 1 && (
            <span className="text-[10px] text-muted-foreground">
              {(currentIndex % activeItems.length) + 1}/{activeItems.length}
            </span>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={(e) => {
              e.stopPropagation();
              dismissItem(current.id);
            }}
          >
            <X className="h-3 w-3" />
          </Button>

          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform",
              expanded && "rotate-180"
            )}
          />
        </div>
      </div>

      {/* Expanded view - all items */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2 space-y-1.5 border-t border-border/30">
              {/* AI insight banner */}
              {aiInsight && (
                <div className="flex items-start gap-2 px-2 py-1.5 mt-1.5 rounded bg-primary/5 border border-primary/10">
                  <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">AI Clinical Pearls: </span>
                    {aiInsight}
                  </p>
                </div>
              )}

              {activeItems.map((item) => {
                const itemConfig = severityConfig[item.severity];
                const ItemIcon = typeIcons[item.type];
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-start gap-2 px-2 py-1.5 rounded border",
                      itemConfig.bg,
                      itemConfig.border
                    )}
                  >
                    <ItemIcon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", itemConfig.text)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{item.title}</span>
                        <span className="text-[9px] text-muted-foreground">{item.source}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                        {item.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.actionLabel && (
                        <Button size="sm" variant="ghost" className={cn("h-5 text-[10px] px-1.5", itemConfig.text)}>
                          {item.actionLabel}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => dismissItem(item.id)}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] text-muted-foreground"
                  onClick={dismissAll}
                >
                  Dismiss All
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
