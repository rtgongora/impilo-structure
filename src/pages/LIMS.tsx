import { LIMSIntegration } from "@/components/lab/LIMSIntegration";
import { TopBar } from "@/components/layout/TopBar";
import { EHRProvider } from "@/contexts/EHRContext";

const LIMS = () => {
  return (
    <EHRProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto bg-background p-6">
          <LIMSIntegration />
        </div>
      </div>
    </EHRProvider>
  );
};

export default LIMS;
