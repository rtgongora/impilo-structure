import { useNavigate } from "react-router-dom";
import { PatientSortingDesk } from "@/components/sorting";
import { AppLayout } from "@/components/layout/AppLayout";

export default function PatientSorting() {
  const navigate = useNavigate();

  return (
    <AppLayout title="Patient Sorting">
      <div className="h-[calc(100vh-48px)]">
        <PatientSortingDesk onBack={() => navigate(-1)} />
      </div>
    </AppLayout>
  );
}
