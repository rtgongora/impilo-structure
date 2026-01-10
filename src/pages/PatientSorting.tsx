import { useNavigate } from "react-router-dom";
import { PatientSortingDesk } from "@/components/sorting";

export default function PatientSorting() {
  const navigate = useNavigate();

  return (
    <PatientSortingDesk 
      onBack={() => navigate(-1)}
    />
  );
}
