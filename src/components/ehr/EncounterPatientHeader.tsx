import { useEHR } from "@/contexts/EHRContext";
import { Badge } from "@/components/ui/badge";
import { User, Stethoscope, MapPin, Calendar } from "lucide-react";
import { format, differenceInYears, differenceInDays } from "date-fns";
import { MOCK_DIAGNOSES } from "@/data/mockClinicalData";

export function EncounterPatientHeader() {
  const { currentEncounter } = useEHR();

  if (!currentEncounter?.patient) return null;

  const { patient } = currentEncounter;
  const age = differenceInYears(new Date(), new Date(patient.dateOfBirth));
  const los = differenceInDays(new Date(), currentEncounter.admissionDate);
  const primaryDiagnosis = MOCK_DIAGNOSES.find((d) => d.isPrimary);

  return (
    <div className="bg-card border-b border-border px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">{patient.name}</h2>
              <Badge variant="outline" className="text-[10px] font-mono">{patient.mrn}</Badge>
              <Badge
                variant="outline"
                className={`text-[10px] ${
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
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                DOB: {format(new Date(patient.dateOfBirth), "dd MMM yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {patient.ward} • {patient.bed}
              </span>
              {primaryDiagnosis && (
                <span className="flex items-center gap-1">
                  <Stethoscope className="w-3 h-3 text-primary" />
                  {primaryDiagnosis.name}
                  <Badge variant="outline" className="text-[9px] h-4 px-1">{primaryDiagnosis.icdCode}</Badge>
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <Badge variant={currentEncounter.status === "active" ? "default" : "secondary"} className="text-[10px]">
            {currentEncounter.type.toUpperCase()}
          </Badge>
          <div className="text-[10px] text-muted-foreground mt-0.5">LOS: {los} days</div>
        </div>
      </div>
    </div>
  );
}
