import { ReportingDashboard } from "@/components/analytics/ReportingDashboard";
import { CustomReportBuilder } from "@/components/analytics/CustomReportBuilder";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Reports = () => {
  return (
    <AppLayout title="Reports & Analytics">
      <Tabs defaultValue="dashboard" className="flex-1 flex flex-col min-h-0 p-4">
        <TabsList className="shrink-0">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="builder">Report Builder</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="flex-1 min-h-0 mt-4 overflow-auto">
          <ReportingDashboard />
        </TabsContent>
        <TabsContent value="builder" className="flex-1 min-h-0 mt-4 overflow-auto">
          <CustomReportBuilder />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Reports;
