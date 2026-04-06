import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShiftControlPanel } from "@/components/shift/ShiftControlPanel";
import { ShiftIndicator } from "@/components/shift/ShiftIndicator";
import { RosterDashboard } from "@/components/roster/RosterDashboard";
import { OnDutyView } from "@/components/roster/OnDutyView";
import { CoverRequestWorkflow } from "@/components/roster/CoverRequestWorkflow";
import { FacilityControlTower } from "@/components/operations/FacilityControlTower";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { 
  Clock, 
  Calendar, 
  Users, 
  ClipboardList, 
  ArrowRightLeft,
  Building2,
  Gauge
} from "lucide-react";

export default function Operations() {
  const { setPageContext } = useWorkspace();
  const { profile, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || "shift");

  useEffect(() => {
    setPageContext("operations");
  }, [setPageContext]);

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const facilityId = profile?.facility_id || "default-facility";
  const facilityName = profile?.department || "Main Facility";
  const providerId = user?.id || "";

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col min-h-0 p-6 overflow-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Operations & Workforce</h1>
            <p className="text-muted-foreground">
              Manage shifts, rosters, and staff coverage
            </p>
          </div>
          <ShiftIndicator />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="control-tower" className="flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              <span className="hidden sm:inline">Control Tower</span>
            </TabsTrigger>
            <TabsTrigger value="shift" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">My Shift</span>
            </TabsTrigger>
            <TabsTrigger value="on-duty" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">On Duty</span>
            </TabsTrigger>
            <TabsTrigger value="roster" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Roster</span>
            </TabsTrigger>
            <TabsTrigger value="cover" className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Cover Requests</span>
            </TabsTrigger>
            <TabsTrigger value="workspaces" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Workspaces</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="control-tower" className="mt-6">
            <FacilityControlTower facilityId={facilityId} facilityName={facilityName} />
          </TabsContent>

          <TabsContent value="shift" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Shift Control
                  </CardTitle>
                  <CardDescription>
                    Start, end, or transfer your current shift
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ShiftControlPanel />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Shift Summary
                  </CardTitle>
                  <CardDescription>
                    Current shift status and workspace history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Use the Shift Control panel to start your shift, 
                        transfer between workspaces, and end your shift with 
                        handover notes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="on-duty" className="mt-6">
            <OnDutyView facilityId={facilityId} facilityName={facilityName} />
          </TabsContent>

          <TabsContent value="roster" className="mt-6">
            <RosterDashboard facilityId={facilityId} facilityName={facilityName} />
          </TabsContent>

          <TabsContent value="cover" className="mt-6">
            <CoverRequestWorkflow facilityId={facilityId} providerId={providerId} />
          </TabsContent>

          <TabsContent value="workspaces" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Workspace Management
                </CardTitle>
                <CardDescription>
                  View and manage facility workspaces and memberships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 text-center text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Workspace administration coming soon.</p>
                  <p className="text-sm mt-2">
                    Configure departments, wards, and service points.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
