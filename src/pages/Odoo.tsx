import { OdooIntegration } from "@/components/integrations/OdooIntegration";
import { TopBar } from "@/components/layout/TopBar";
import { EHRProvider } from "@/contexts/EHRContext";

const Odoo = () => {
  return (
    <EHRProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-hidden">
          <OdooIntegration />
        </div>
      </div>
    </EHRProvider>
  );
};

export default Odoo;
