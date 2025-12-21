import { MedicationDispensing } from "@/components/pharmacy/MedicationDispensing";
import { AppLayout } from "@/components/layout/AppLayout";

const Pharmacy = () => {
  return (
    <AppLayout title="Pharmacy">
      <MedicationDispensing />
    </AppLayout>
  );
};

export default Pharmacy;
