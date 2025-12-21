import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Bed, Stethoscope } from "lucide-react";
import { QueueManagementLive } from "@/components/ehr/queue/QueueManagementLive";
import { AppLayout } from "@/components/layout/AppLayout";

const Queue = () => {
  const [workspace, setWorkspace] = useState<'my-queue' | 'ward' | 'department'>('my-queue');

  return (
    <AppLayout title="Patient Queue">
      <div className="p-6">
        <Tabs value={workspace} onValueChange={(v) => setWorkspace(v as typeof workspace)}>
          <TabsList>
            <TabsTrigger value="my-queue" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              My Queue
            </TabsTrigger>
            <TabsTrigger value="ward" className="flex items-center gap-2">
              <Bed className="h-4 w-4" />
              Ward View
            </TabsTrigger>
            <TabsTrigger value="department" className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Department
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-queue" className="mt-4">
            <QueueManagementLive workspace="my-queue" />
          </TabsContent>
          <TabsContent value="ward" className="mt-4">
            <QueueManagementLive workspace="ward" wardFilter="Ward 3A" />
          </TabsContent>
          <TabsContent value="department" className="mt-4">
            <QueueManagementLive workspace="department" />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Queue;
