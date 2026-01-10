import { useState } from "react";
import { PACSViewer } from "@/components/imaging/PACSViewer";
import { RadiologistWorklist } from "@/components/imaging/RadiologistWorklist";
import { TeleradiologyHub } from "@/components/imaging/TeleradiologyHub";
import { CriticalFindingsManager } from "@/components/imaging/CriticalFindingsManager";
import { PACSAdminDashboard } from "@/components/imaging/PACSAdminDashboard";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Monitor, ListTodo, Globe, AlertTriangle, Settings 
} from "lucide-react";

const PACS = () => {
  const [activeTab, setActiveTab] = useState("worklist");

  return (
    <AppLayout title="PACS Imaging">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="border-b bg-background px-4">
          <TabsList className="h-12">
            <TabsTrigger value="worklist" className="flex items-center gap-2">
              <ListTodo className="w-4 h-4" />
              Worklist
            </TabsTrigger>
            <TabsTrigger value="viewer" className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Viewer
            </TabsTrigger>
            <TabsTrigger value="teleradiology" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Teleradiology
            </TabsTrigger>
            <TabsTrigger value="critical" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Critical Findings
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Admin
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <TabsContent value="worklist" className="h-full m-0 overflow-auto">
            <RadiologistWorklist />
          </TabsContent>
          <TabsContent value="viewer" className="h-full m-0">
            <PACSViewer />
          </TabsContent>
          <TabsContent value="teleradiology" className="h-full m-0 overflow-auto">
            <TeleradiologyHub />
          </TabsContent>
          <TabsContent value="critical" className="h-full m-0 overflow-auto">
            <CriticalFindingsManager />
          </TabsContent>
          <TabsContent value="admin" className="h-full m-0 overflow-auto">
            <PACSAdminDashboard />
          </TabsContent>
        </div>
      </Tabs>
    </AppLayout>
  );
};

export default PACS;
