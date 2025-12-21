import { BedManagement } from "@/components/ehr/beds/BedManagement";
import { AppLayout } from "@/components/layout/AppLayout";

const Beds = () => {
  return (
    <AppLayout title="Bed Management">
      <BedManagement />
    </AppLayout>
  );
};

export default Beds;
