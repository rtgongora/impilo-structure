import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, Bed, Users, Video, Globe, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEHR } from "@/contexts/EHRContext";
import { supabase } from "@/integrations/supabase/client";
import { useFacility } from "@/contexts/FacilityContext";

export function PatientLocationBadge() {
  const ehrContext = useEHRSafe();
  
  if (!ehrContext) return null;

  return <PatientLocationContent />;
}

/** Safe hook that returns null outside EHR context */
function useEHRSafe() {
  try {
    return useEHR();
  } catch {
    return null;
  }
}

function PatientLocationContent() {
  const { currentEncounter, hasActivePatient, patientContext } = useEHR();
  const [searchParams] = useSearchParams();
  const [queueName, setQueueName] = useState<string | null>(null);
  const { currentFacility } = useFacility();

  const queueId = searchParams.get("queueId");

  // Fetch queue name if source is queue
  useEffect(() => {
    if (!queueId) return;
    supabase
      .from("queue_definitions")
      .select("name")
      .eq("id", queueId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setQueueName(data.name);
      });
  }, [queueId]);

  if (!hasActivePatient || !currentEncounter) return null;

  const encounterType = currentEncounter.type;
  const source = patientContext.source;
  const patient = currentEncounter.patient;

  // Determine location display
  const getLocationInfo = () => {
    // Telemedicine / remote
    if (encounterType === "outpatient" && source === "referral") {
      return {
        icon: <Video className="h-3 w-3" />,
        label: "Remote Consult",
        detail: currentFacility?.name || "Remote",
        variant: "secondary" as const,
      };
    }

    // Inpatient with ward/bed
    if (encounterType === "inpatient" && patient.ward) {
      return {
        icon: <Bed className="h-3 w-3" />,
        label: patient.ward,
        detail: patient.bed ? `${patient.bed}` : undefined,
        variant: "default" as const,
      };
    }

    // From queue
    if (source === "queue" && queueName) {
      return {
        icon: <Users className="h-3 w-3" />,
        label: queueName,
        detail: currentFacility?.name,
        variant: "default" as const,
      };
    }

    // Emergency
    if (encounterType === "emergency") {
      return {
        icon: <MapPin className="h-3 w-3" />,
        label: "Emergency Dept",
        detail: currentFacility?.name,
        variant: "destructive" as const,
      };
    }

    // Outpatient at facility
    if (currentFacility) {
      return {
        icon: <Building2 className="h-3 w-3" />,
        label: "Outpatient",
        detail: currentFacility.name,
        variant: "default" as const,
      };
    }

    // Fallback - remote/no facility
    return {
      icon: <Globe className="h-3 w-3" />,
      label: "Remote Consult",
      detail: "No facility assigned",
      variant: "outline" as const,
    };
  };

  const location = getLocationInfo();

  return (
    <div className="flex items-center gap-2">
      <div className="h-4 w-px bg-border" />
      <Badge
        variant={location.variant}
        className="gap-1.5 text-[10px] font-medium py-0.5 px-2"
      >
        {location.icon}
        <span>{location.label}</span>
        {location.detail && (
          <>
            <span className="opacity-50">·</span>
            <span className="opacity-75 truncate max-w-[140px]">{location.detail}</span>
          </>
        )}
      </Badge>
      <div className="h-4 w-px bg-border" />
    </div>
  );
}
