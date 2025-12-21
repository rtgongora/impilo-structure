import { MedicationDispensing } from "@/components/pharmacy/MedicationDispensing";
import { TopBar } from "@/components/layout/TopBar";
import { EHRProvider } from "@/contexts/EHRContext";

const Pharmacy = () => {
  return (
    <EHRProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto bg-background p-6">
          <MedicationDispensing />
        </div>
      </div>
    </EHRProvider>
  );
};

export default Pharmacy;
