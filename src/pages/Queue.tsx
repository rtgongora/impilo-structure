import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, LayoutDashboard, QrCode, Settings, GitBranch } from "lucide-react";
import { 
  QueueWorkstation, 
  SupervisorDashboard, 
  AddToQueueDialog, 
  QueueConfigManager,
  QueuePathwayEditor 
} from "@/components/queue";
import { SelfCheckInKiosk } from "@/components/booking/SelfCheckInKiosk";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQueueManagement } from "@/hooks/useQueueManagement";

type TabValue = 'workstation' | 'supervisor' | 'check-in' | 'config' | 'pathways';

const Queue = () => {
  const [activeTab, setActiveTab] = useState<TabValue>('workstation');
  const [selectedQueueId, setSelectedQueueId] = useState<string | undefined>();
  const { queues, refetch } = useQueueManagement();

  return (
    <AppLayout title="Queue Management">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Queue Management</h1>
            <p className="text-muted-foreground">Manage patient queues across service points</p>
          </div>
          <AddToQueueDialog queues={queues} onSuccess={refetch} />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="workstation" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Workstation
            </TabsTrigger>
            <TabsTrigger value="supervisor" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Supervisor
            </TabsTrigger>
            <TabsTrigger value="check-in" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Self Check-In
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="pathways" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Pathways
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
          <TabsContent value="config" className="mt-4">
            <QueueConfigManager />
          </TabsContent>
          <TabsContent value="pathways" className="mt-4">
            <QueuePathwayEditor />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Queue;
