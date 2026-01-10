import { useSearchParams } from "react-router-dom";
import { FullCircleTelemedicineHub } from "@/components/ehr/consults";

export default function Telemedicine() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");

  return (
    <div className="min-h-screen bg-background">
      <FullCircleTelemedicineHub 
        onBack={() => window.history.back()}
      />
    </div>
  );
}
