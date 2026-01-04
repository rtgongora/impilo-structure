import { ReportingDashboard } from "@/components/analytics/ReportingDashboard";
import { CustomReportBuilder } from "@/components/analytics/CustomReportBuilder";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Reports = () => {
  return (
    <AppLayout title="Reports & Analytics">
      <Tabs defaultValue="dashboard" className="h-full p-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="builder">Report Builder</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="mt-4">
          <ReportingDashboard />
        </TabsContent>
        <TabsContent value="builder" className="mt-4 h-[calc(100vh-200px)]">
          <CustomReportBuilder />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Reports;
