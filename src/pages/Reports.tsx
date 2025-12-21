import { ReportingDashboard } from "@/components/analytics/ReportingDashboard";
import { TopBar } from "@/components/layout/TopBar";
import { EHRProvider } from "@/contexts/EHRContext";

const Reports = () => {
  return (
    <EHRProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-hidden">
          <ReportingDashboard />
        </div>
      </div>
    </EHRProvider>
  );
};

export default Reports;
