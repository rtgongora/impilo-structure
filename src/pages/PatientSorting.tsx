import { useNavigate } from "react-router-dom";
import { PatientSortingDesk } from "@/components/sorting";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFacility } from "@/contexts/FacilityContext";

export default function PatientSorting() {
  const navigate = useNavigate();
  const { currentFacility } = useFacility();

  return (
    <AppLayout title="Patient Sorting">
      <div className="h-[calc(100vh-48px)]">
        <PatientSortingDesk 
          facilityId={currentFacility?.id} 
          onBack={() => navigate(-1)} 
        />
      </div>
    </AppLayout>
  );
}
