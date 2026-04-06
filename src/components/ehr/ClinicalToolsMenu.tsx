import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Pill,
  Stethoscope,
  ArrowLeftRight,
  Calculator,
  ClipboardList,
  Search,
  ChevronRight,
  ExternalLink,
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClinicalTool {
  id: string;
  icon: typeof Pill;
  label: string;
  description: string;
  category: "drugs" | "conditions" | "interactions" | "calculators" | "formulary";
}

const clinicalTools: ClinicalTool[] = [
  // Drugs
  { id: "drug-search", icon: Pill, label: "Drug Database", description: "Search medications, dosing, indications & contraindications", category: "drugs" },
  { id: "drug-monograph", icon: Pill, label: "Drug Monographs", description: "Detailed pharmacology, PK/PD, adverse effects", category: "drugs" },
  { id: "otc-rx", icon: Pill, label: "OTC & Rx Lookup", description: "Over-the-counter and prescription drug information", category: "drugs" },

  // Conditions
  { id: "disease-lookup", icon: Stethoscope, label: "Diseases & Conditions", description: "Clinical presentations, differential diagnosis, management", category: "conditions" },
  { id: "icd-browser", icon: Stethoscope, label: "ICD-10 Browser", description: "Search and browse diagnostic codes", category: "conditions" },
  { id: "clinical-images", icon: Stethoscope, label: "Clinical Images Library", description: "Dermatology, radiology, pathology image references", category: "conditions" },

  // Interaction Checker
  { id: "drug-interaction", icon: ArrowLeftRight, label: "Drug Interaction Checker", description: "Check multi-drug interactions and severity", category: "interactions" },
  { id: "drug-allergy", icon: ArrowLeftRight, label: "Drug-Allergy Cross-Check", description: "Cross-reactivity and allergy verification", category: "interactions" },
  { id: "food-drug", icon: ArrowLeftRight, label: "Food-Drug Interactions", description: "Dietary considerations affecting drug efficacy", category: "interactions" },

  // Calculators
  { id: "calc-egfr", icon: Calculator, label: "eGFR Calculator", description: "CKD-EPI, Cockcroft-Gault renal function", category: "calculators" },
  { id: "calc-bmi", icon: Calculator, label: "BMI Calculator", description: "Body mass index with classification", category: "calculators" },
  { id: "calc-wells", icon: Calculator, label: "Wells Score (DVT/PE)", description: "Deep vein thrombosis & pulmonary embolism risk", category: "calculators" },
  { id: "calc-chadsvasc", icon: Calculator, label: "CHA₂DS₂-VASc", description: "Atrial fibrillation stroke risk stratification", category: "calculators" },
  { id: "calc-sofa", icon: Calculator, label: "SOFA / qSOFA Score", description: "Sepsis-related organ failure assessment", category: "calculators" },
  { id: "calc-apgar", icon: Calculator, label: "APGAR Score", description: "Neonatal assessment at birth", category: "calculators" },
  { id: "calc-paed-dose", icon: Calculator, label: "Paediatric Dosing", description: "Weight-based dose calculations", category: "calculators" },

  // Formulary
  { id: "formulary-national", icon: ClipboardList, label: "National Essential Medicines", description: "EML with standard treatment regimens", category: "formulary" },
  { id: "formulary-facility", icon: ClipboardList, label: "Facility Formulary", description: "Locally available medicines and stock status", category: "formulary" },
  { id: "formulary-restricted", icon: ClipboardList, label: "Restricted Medicines List", description: "Medicines requiring special authorisation", category: "formulary" },
];

const categoryConfig: Record<string, { label: string; color: string; icon: typeof Pill }> = {
  drugs: { label: "Drugs", color: "bg-blue-500/10 text-blue-700", icon: Pill },
  conditions: { label: "Diseases & Conditions", color: "bg-emerald-500/10 text-emerald-700", icon: Stethoscope },
  interactions: { label: "Interaction Checker", color: "bg-amber-500/10 text-amber-700", icon: ArrowLeftRight },
  calculators: { label: "Calculators", color: "bg-purple-500/10 text-purple-700", icon: Calculator },
  formulary: { label: "Formulary", color: "bg-rose-500/10 text-rose-700", icon: ClipboardList },
};

export function ClinicalToolsMenu() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  const filtered = clinicalTools.filter(
    (tool) =>
      tool.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = Object.keys(categoryConfig).reduce((acc, cat) => {
    acc[cat] = filtered.filter((t) => t.category === cat);
    return acc;
  }, {} as Record<string, ClinicalTool[]>);

  const openTool = (toolId: string) => {
    setOpen(false);
    setActiveSheet(toolId);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 gap-1.5 text-xs ${open ? "bg-primary/10 text-primary" : ""}`}
          >
            <Pill className="w-3.5 h-3.5" />
            Drugs
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-0" sideOffset={8}>
          <div className="p-3 pb-2">
            <h3 className="font-semibold text-sm">Clinical Tools</h3>
            <p className="text-xs text-muted-foreground">
              Drug references, calculators & formulary
            </p>
          </div>

          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>

          <Separator />

          <ScrollArea className="max-h-[400px]">
            {Object.entries(grouped).map(([category, items]) => {
              if (items.length === 0) return null;
              const config = categoryConfig[category];
              return (
                <div key={category} className="p-2">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">
                    {config.label}
                  </p>
                  {items.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => openTool(tool.id)}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/80 transition-colors text-left"
                    >
                      <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <tool.icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium leading-tight">{tool.label}</p>
                        <p className="text-[11px] text-muted-foreground leading-snug">{tool.description}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground">No tools found</p>
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Tool Sheet */}
      <Sheet open={!!activeSheet} onOpenChange={(o) => !o && setActiveSheet(null)}>
        <SheetContent side="right" className="w-[600px] sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-base">
              {activeSheet && (() => {
                const tool = clinicalTools.find((t) => t.id === activeSheet);
                if (!tool) return "Clinical Tool";
                const Icon = tool.icon;
                return (
                  <>
                    <div className="p-1.5 bg-primary/10 rounded-md">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    {tool.label}
                  </>
                );
              })()}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <ClinicalToolContent toolId={activeSheet} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function ClinicalToolContent({ toolId }: { toolId: string | null }) {
  if (!toolId) return null;

  const tool = clinicalTools.find((t) => t.id === toolId);
  if (!tool) return null;

  // Shared placeholder for tools — each would have its own full implementation
  if (tool.category === "calculators") {
    return <CalculatorPlaceholder tool={tool} />;
  }

  if (tool.category === "interactions") {
    return <InteractionCheckerPlaceholder tool={tool} />;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={`Search ${tool.label.toLowerCase()}...`} className="pl-9" />
      </div>
      <div className="border rounded-lg p-6 text-center">
        <tool.icon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-semibold mb-1">{tool.label}</h3>
        <p className="text-sm text-muted-foreground mb-4">{tool.description}</p>
        <Badge variant="secondary">Coming Soon — Use search above to query</Badge>
      </div>
    </div>
  );
}

function CalculatorPlaceholder({ tool }: { tool: ClinicalTool }) {
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const calculatorFields: Record<string, { label: string; unit: string }[]> = {
    "calc-egfr": [
      { label: "Serum Creatinine", unit: "mg/dL" },
      { label: "Age", unit: "years" },
      { label: "Weight", unit: "kg" },
    ],
    "calc-bmi": [
      { label: "Weight", unit: "kg" },
      { label: "Height", unit: "cm" },
    ],
    "calc-sofa": [
      { label: "PaO2/FiO2", unit: "mmHg" },
      { label: "Platelets", unit: "×10³/µL" },
      { label: "Bilirubin", unit: "mg/dL" },
      { label: "MAP", unit: "mmHg" },
      { label: "GCS", unit: "" },
      { label: "Creatinine", unit: "mg/dL" },
    ],
  };

  const fields = calculatorFields[tool.id] || [
    { label: "Value 1", unit: "" },
    { label: "Value 2", unit: "" },
  ];

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 space-y-3">
        {fields.map((field) => (
          <div key={field.label} className="flex items-center gap-3">
            <label className="text-sm font-medium w-36 shrink-0">{field.label}</label>
            <Input
              type="number"
              placeholder="0"
              className="flex-1"
              value={inputs[field.label] || ""}
              onChange={(e) => setInputs((p) => ({ ...p, [field.label]: e.target.value }))}
            />
            {field.unit && (
              <span className="text-xs text-muted-foreground w-16 shrink-0">{field.unit}</span>
            )}
          </div>
        ))}
        <Button className="w-full mt-2">Calculate</Button>
      </div>
      <div className="border rounded-lg p-4 bg-muted/30 text-center">
        <p className="text-sm text-muted-foreground">Enter values above and press Calculate</p>
      </div>
    </div>
  );
}

function InteractionCheckerPlaceholder({ tool }: { tool: ClinicalTool }) {
  const [drugs, setDrugs] = useState<string[]>([""]);

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 space-y-3">
        <p className="text-sm font-medium">Enter medications to check:</p>
        {drugs.map((drug, i) => (
          <Input
            key={i}
            placeholder={`Medication ${i + 1}`}
            value={drug}
            onChange={(e) => {
              const next = [...drugs];
              next[i] = e.target.value;
              setDrugs(next);
            }}
          />
        ))}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setDrugs((d) => [...d, ""])}>
            + Add Medication
          </Button>
          <Button size="sm" className="flex-1">Check Interactions</Button>
        </div>
      </div>
      <div className="border rounded-lg p-4 bg-muted/30 text-center">
        <ArrowLeftRight className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Add medications above to check for interactions</p>
      </div>
    </div>
  );
}

// Standalone toolbar buttons for individual tools
export function ConditionsButton() {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={`h-8 gap-1.5 text-xs ${open ? "bg-primary/10 text-primary" : ""}`}>
          <Stethoscope className="w-3.5 h-3.5" />
          Conditions
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0" sideOffset={8}>
        <div className="p-3 pb-2">
          <h3 className="font-semibold text-sm">Diseases & Conditions</h3>
          <p className="text-xs text-muted-foreground">Browse clinical conditions and diagnoses</p>
        </div>
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search conditions..." className="h-8 pl-8 text-sm" />
          </div>
        </div>
        <Separator />
        <ScrollArea className="max-h-[300px]">
          {["Cardiovascular", "Respiratory", "Endocrine", "Infectious Disease", "Neurology", "Gastroenterology", "Oncology", "Musculoskeletal"].map((cat) => (
            <button key={cat} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/80 text-left">
              <span className="text-xs font-medium">{cat}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export function InteractionCheckerButton() {
  return (
    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
      <ArrowLeftRight className="w-3.5 h-3.5" />
      Interactions
    </Button>
  );
}

export function CalculatorsButton() {
  return (
    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
      <Calculator className="w-3.5 h-3.5" />
      Calculators
    </Button>
  );
}

export function FormularyButton() {
  return (
    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
      <ClipboardList className="w-3.5 h-3.5" />
      Formulary
    </Button>
  );
}
