import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, LayoutDashboard, QrCode } from "lucide-react";
import { QueueWorkstation, SupervisorDashboard, AddToQueueDialog } from "@/components/queue";
import { SelfCheckInKiosk } from "@/components/booking/SelfCheckInKiosk";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQueueManagement } from "@/hooks/useQueueManagement";

const Queue = () => {
  const [activeTab, setActiveTab] = useState<'workstation' | 'supervisor' | 'check-in'>('workstation');
  const [selectedQueueId, setSelectedQueueId] = useState<string | undefined>();
  const { queues } = useQueueManagement();

  return (
    <AppLayout title="Queue Management">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Queue Management</h1>
            <p className="text-muted-foreground">Manage patient queues across service points</p>
          </div>
          <AddToQueueDialog queues={queues} onSuccess={() => {}} />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="workstation" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Queue Workstation
            </TabsTrigger>
            <TabsTrigger value="supervisor" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Supervisor View
            </TabsTrigger>
            <TabsTrigger value="check-in" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Self Check-In
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workstation" className="mt-4">
            <QueueWorkstation initialQueueId={selectedQueueId} />
          </TabsContent>
          <TabsContent value="supervisor" className="mt-4">
            <SupervisorDashboard 
              onSelectQueue={(queueId) => {
                setSelectedQueueId(queueId);
                setActiveTab('workstation');
              }} 
            />
          </TabsContent>
          <TabsContent value="check-in" className="mt-4">
            <div className="max-w-lg mx-auto">
              <SelfCheckInKiosk facilityName="Impilo Health" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Queue;
