import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, LayoutDashboard, QrCode, Settings, GitBranch, CalendarDays } from "lucide-react";
import { 
  QueueWorkstation, 
  SupervisorDashboard, 
  AddToQueueDialog, 
  QueueConfigManager,
  QueuePathwayEditor 
} from "@/components/queue";
import { SelfCheckInKiosk } from "@/components/booking/SelfCheckInKiosk";
import { BookingManager } from "@/components/booking/BookingManager";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQueueManagement } from "@/hooks/useQueueManagement";

type TabValue = 'workstation' | 'supervisor' | 'bookings' | 'check-in' | 'config' | 'pathways';

const Queue = () => {
  const [activeTab, setActiveTab] = useState<TabValue>('workstation');
  const [selectedQueueId, setSelectedQueueId] = useState<string | undefined>();
  const { queues, refetch } = useQueueManagement();

  return (
    <AppLayout title="Queue Management">
      <div className="h-[calc(100vh-48px)] flex flex-col p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div>
            <h1 className="text-sm font-bold">Queue Management</h1>
            <p className="text-[10px] text-muted-foreground">Manage patient queues across service points</p>
          </div>
          <AddToQueueDialog queues={queues} onSuccess={refetch} />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="shrink-0">
            <TabsTrigger value="workstation" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span className="hidden sm:inline">Workstation</span>
            </TabsTrigger>
            <TabsTrigger value="supervisor" className="flex items-center gap-1">
              <LayoutDashboard className="h-3 w-3" />
              <span className="hidden sm:inline">Supervisor</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              <span className="hidden sm:inline">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="check-in" className="flex items-center gap-1">
              <QrCode className="h-3 w-3" />
              <span className="hidden sm:inline">Check-In</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-1">
              <Settings className="h-3 w-3" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
            <TabsTrigger value="pathways" className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              <span className="hidden sm:inline">Pathways</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-2">
            <TabsContent value="workstation" className="h-full mt-0">
              <QueueWorkstation initialQueueId={selectedQueueId} />
            </TabsContent>
            <TabsContent value="supervisor" className="h-full mt-0">
              <SupervisorDashboard 
                onSelectQueue={(queueId) => {
                  setSelectedQueueId(queueId);
                  setActiveTab('workstation');
                }} 
              />
            </TabsContent>
            <TabsContent value="bookings" className="h-full mt-0">
              <BookingManager />
            </TabsContent>
            <TabsContent value="check-in" className="h-full mt-0">
              <div className="max-w-md mx-auto">
                <SelfCheckInKiosk facilityName="Impilo Health" />
              </div>
            </TabsContent>
            <TabsContent value="config" className="h-full mt-0">
              <QueueConfigManager />
            </TabsContent>
            <TabsContent value="pathways" className="h-full mt-0">
              <QueuePathwayEditor />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Queue;
