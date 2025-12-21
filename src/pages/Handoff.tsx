import { ShiftHandoffReport } from "@/components/handoff/ShiftHandoffReport";
import { HandoffHistory } from "@/components/handoff/HandoffHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, History } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

const Handoff = () => {
  return (
    <AppLayout title="Shift Handoff">
      <div className="p-6">
        <Tabs defaultValue="new" className="space-y-6">
          <TabsList>
            <TabsTrigger value="new" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              New Handoff
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            <ShiftHandoffReport />
          </TabsContent>

          <TabsContent value="history">
            <HandoffHistory />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Handoff;
