import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProviderContext, ProviderRole } from "@/contexts/ProviderContext";
import {
  BookOpen,
  FileText,
  ClipboardList,
  Stethoscope,
  Pill,
  Baby,
  Heart,
  Shield,
  ExternalLink,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface ReferenceItem {
  icon: typeof BookOpen;
  label: string;
  description: string;
  category: "guide" | "sop" | "protocol" | "formulary" | "checklist";
  roles: ProviderRole[];
}

const clinicalReferences: ReferenceItem[] = [
  // Doctor references
  { icon: Stethoscope, label: "Clinical Assessment Guidelines", description: "History, examination & differential diagnosis", category: "guide", roles: ["physician", "specialist", "registrar", "consultant"] },
  { icon: FileText, label: "Prescribing Protocols", description: "Standard treatment guidelines & dosing", category: "protocol", roles: ["physician", "specialist", "registrar", "consultant", "pharmacist"] },
  { icon: ClipboardList, label: "Surgical Safety Checklist", description: "WHO surgical safety checklist", category: "checklist", roles: ["physician", "specialist", "consultant"] },
  { icon: Heart, label: "Emergency Protocols", description: "Code Blue, ACLS, trauma activation", category: "protocol", roles: ["physician", "specialist", "registrar", "consultant", "nurse"] },
  { icon: FileText, label: "Discharge Planning SOP", description: "Step-by-step discharge procedures", category: "sop", roles: ["physician", "specialist", "registrar", "consultant", "nurse"] },

  // Nurse references
  { icon: ClipboardList, label: "Nursing Assessment Tools", description: "Vital signs, GCS, pain scales, falls risk", category: "guide", roles: ["nurse", "midwife"] },
  { icon: Shield, label: "Infection Control SOPs", description: "Hand hygiene, PPE, isolation protocols", category: "sop", roles: ["nurse", "midwife", "physician"] },
  { icon: Pill, label: "Medication Administration Guide", description: "Routes, timing, double-check procedures", category: "guide", roles: ["nurse", "midwife"] },
  { icon: ClipboardList, label: "Wound Care Protocols", description: "Assessment, dressing selection, documentation", category: "protocol", roles: ["nurse"] },
  { icon: FileText, label: "Handover Checklist (ISBAR)", description: "Standardised clinical handover format", category: "checklist", roles: ["nurse", "midwife", "physician"] },

  // Midwife references
  { icon: Baby, label: "Antenatal Care Guidelines", description: "ANC visit schedule & assessments", category: "guide", roles: ["midwife"] },
  { icon: Baby, label: "Labour & Delivery Protocols", description: "Partograph, active management of 3rd stage", category: "protocol", roles: ["midwife"] },
  { icon: Shield, label: "Obstetric Emergency SOPs", description: "PPH, eclampsia, shoulder dystocia", category: "sop", roles: ["midwife", "physician"] },

  // CHW references
  { icon: ClipboardList, label: "Community Screening Checklists", description: "Danger signs, referral criteria", category: "checklist", roles: ["chw"] },
  { icon: BookOpen, label: "Health Education Materials", description: "Patient counselling guides & pamphlets", category: "guide", roles: ["chw"] },
  { icon: FileText, label: "Referral Procedures", description: "When and how to refer to facility", category: "sop", roles: ["chw"] },

  // Pharmacist references
  { icon: Pill, label: "Essential Medicines List", description: "National EML with dosing & interactions", category: "formulary", roles: ["pharmacist", "physician"] },
  { icon: FileText, label: "Dispensing SOPs", description: "Verification, labelling, patient counselling", category: "sop", roles: ["pharmacist"] },
  { icon: Shield, label: "Cold Chain Management", description: "Vaccine & thermolabile medicine storage", category: "sop", roles: ["pharmacist"] },

  // Universal
  { icon: Shield, label: "Patient Safety Incident Reporting", description: "How to report adverse events", category: "sop", roles: ["physician", "specialist", "registrar", "consultant", "nurse", "midwife", "chw", "pharmacist", "radiologist", "pathologist"] },
];

const categoryConfig: Record<string, { label: string; color: string }> = {
  guide: { label: "Guide", color: "bg-blue-500/10 text-blue-700" },
  sop: { label: "SOP", color: "bg-amber-500/10 text-amber-700" },
  protocol: { label: "Protocol", color: "bg-emerald-500/10 text-emerald-700" },
  formulary: { label: "Formulary", color: "bg-purple-500/10 text-purple-700" },
  checklist: { label: "Checklist", color: "bg-rose-500/10 text-rose-700" },
};

export function ClinicalReferences() {
  const { provider } = useProviderContext();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const roleReferences = clinicalReferences.filter((ref) =>
    ref.roles.includes(provider.role)
  );

  const filtered = roleReferences.filter(
    (ref) =>
      ref.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = {
    protocol: filtered.filter((r) => r.category === "protocol"),
    sop: filtered.filter((r) => r.category === "sop"),
    guide: filtered.filter((r) => r.category === "guide"),
    checklist: filtered.filter((r) => r.category === "checklist"),
    formulary: filtered.filter((r) => r.category === "formulary"),
  };

  const getRoleLabel = (role: ProviderRole): string => {
    const labels: Record<ProviderRole, string> = {
      physician: "Doctor",
      specialist: "Specialist",
      registrar: "Registrar",
      consultant: "Consultant",
      nurse: "Nurse",
      midwife: "Midwife",
      chw: "CHW",
      pharmacist: "Pharmacist",
      radiologist: "Radiologist",
      pathologist: "Pathologist",
    };
    return labels[role] || role;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 gap-1.5 text-xs ${open ? "bg-primary/10 text-primary" : ""}`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          References & SOPs
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0" sideOffset={8}>
        <div className="p-3 pb-2">
          <h3 className="font-semibold text-sm">Clinical References</h3>
          <p className="text-xs text-muted-foreground">
            {getRoleLabel(provider.role)} resources · {roleReferences.length} items
          </p>
        </div>

        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search references..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        <Separator />

        <ScrollArea className="max-h-[350px]">
          {Object.entries(grouped).map(([category, items]) => {
            if (items.length === 0) return null;
            const config = categoryConfig[category];
            return (
              <div key={category} className="p-2">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">
                  {config.label}s
                </p>
                {items.map((ref) => (
                  <button
                    key={ref.label}
                    onClick={() => {
                      setOpen(false);
                      navigate("/help?tab=docs");
                    }}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/80 transition-colors text-left"
                  >
                    <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <ref.icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium leading-tight">{ref.label}</p>
                      <p className="text-[11px] text-muted-foreground leading-snug">{ref.description}</p>
                    </div>
                    <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 shrink-0 ${config.color}`}>
                      {config.label}
                    </Badge>
                  </button>
                ))}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No references found</p>
            </div>
          )}
        </ScrollArea>

        <Separator />
        <div className="p-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              setOpen(false);
              navigate("/help?tab=docs");
            }}
          >
            Browse All Resources
            <ExternalLink className="h-3 w-3 ml-1.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
