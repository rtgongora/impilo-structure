import { ShiftHandoffReport } from "@/components/handoff/ShiftHandoffReport";
import { HandoffHistory } from "@/components/handoff/HandoffHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, History } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

const Handoff = () => {
  return (
    <AppLayout title="Shift Handoff">
      <div className="flex-1 flex flex-col min-h-0 p-6">
        <Tabs defaultValue="new" className="flex-1 flex flex-col min-h-0">
          <TabsList className="shrink-0">
            <TabsTrigger value="new" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              New Handoff
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="flex-1 min-h-0 overflow-auto">
            <ShiftHandoffReport />
          </TabsContent>

          <TabsContent value="history" className="flex-1 min-h-0 overflow-auto">
            <HandoffHistory />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Handoff;
