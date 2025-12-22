import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const DRUG_UNITS = [
  // Mass units
  { value: "mg", label: "mg", category: "Mass" },
  { value: "g", label: "g", category: "Mass" },
  { value: "mcg", label: "mcg (μg)", category: "Mass" },
  { value: "kg", label: "kg", category: "Mass" },
  
  // Volume units
  { value: "mL", label: "mL", category: "Volume" },
  { value: "L", label: "L", category: "Volume" },
  { value: "drops", label: "drops", category: "Volume" },
  
  // Dose forms
  { value: "tablets", label: "tablet(s)", category: "Form" },
  { value: "capsules", label: "capsule(s)", category: "Form" },
  { value: "puffs", label: "puff(s)", category: "Form" },
  { value: "patches", label: "patch(es)", category: "Form" },
  { value: "suppositories", label: "suppository(ies)", category: "Form" },
  { value: "sachets", label: "sachet(s)", category: "Form" },
  { value: "vials", label: "vial(s)", category: "Form" },
  { value: "ampoules", label: "ampoule(s)", category: "Form" },
  
  // Activity units
  { value: "units", label: "unit(s)", category: "Activity" },
  { value: "IU", label: "IU", category: "Activity" },
  { value: "mmol", label: "mmol", category: "Activity" },
  { value: "mEq", label: "mEq", category: "Activity" },
  
  // Concentration units
  { value: "mg/mL", label: "mg/mL", category: "Concentration" },
  { value: "mg/kg", label: "mg/kg", category: "Concentration" },
  { value: "mcg/kg", label: "mcg/kg", category: "Concentration" },
  { value: "units/kg", label: "units/kg", category: "Concentration" },
  { value: "mg/m2", label: "mg/m²", category: "Concentration" },
  
  // Rate units
  { value: "mg/hr", label: "mg/hr", category: "Rate" },
  { value: "mL/hr", label: "mL/hr", category: "Rate" },
  { value: "mcg/min", label: "mcg/min", category: "Rate" },
  { value: "units/hr", label: "units/hr", category: "Rate" },
  
  // Percentage
  { value: "%", label: "%", category: "Percentage" },
] as const;

export type DrugUnit = typeof DRUG_UNITS[number]["value"];

interface DrugUnitsSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DrugUnitsSelect({
  value,
  onValueChange,
  placeholder = "Unit",
  className,
  disabled,
}: DrugUnitsSelectProps) {
  // Group units by category
  const groupedUnits = DRUG_UNITS.reduce((acc, unit) => {
    if (!acc[unit.category]) {
      acc[unit.category] = [];
    }
    acc[unit.category].push(unit);
    return acc;
  }, {} as Record<string, typeof DRUG_UNITS[number][]>);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {Object.entries(groupedUnits).map(([category, units]) => (
          <div key={category}>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
              {category}
            </div>
            {units.map((unit) => (
              <SelectItem key={unit.value} value={unit.value}>
                {unit.label}
              </SelectItem>
            ))}
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}
