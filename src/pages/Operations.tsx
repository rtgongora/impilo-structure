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
import { StockManagementPanel } from "@/components/workspace-ops/StockManagementPanel";
import { HRShiftsPanel } from "@/components/workspace-ops/HRShiftsPanel";
import { BillingPanel } from "@/components/workspace-ops/BillingPanel";
import { WorkspaceDashboardPanel } from "@/components/workspace-ops/WorkspaceDashboardPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { 
  Clock, 
  Calendar, 
  Users, 
  ClipboardList, 
  ArrowRightLeft,
  Building2,
  Gauge,
  Package,
  DollarSign,
  BarChart3
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
          <TabsList className="flex-wrap justify-start h-auto gap-1">
            <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="control-tower" className="flex items-center gap-1.5 text-xs">
              <Gauge className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Control Tower</span>
            </TabsTrigger>
            <TabsTrigger value="shift" className="flex items-center gap-1.5 text-xs">
              <Clock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">My Shift</span>
            </TabsTrigger>
            <TabsTrigger value="on-duty" className="flex items-center gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">On Duty</span>
            </TabsTrigger>
            <TabsTrigger value="roster" className="flex items-center gap-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Roster</span>
            </TabsTrigger>
            <TabsTrigger value="cover" className="flex items-center gap-1.5 text-xs">
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cover Requests</span>
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex items-center gap-1.5 text-xs">
              <Package className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Stock</span>
            </TabsTrigger>
            <TabsTrigger value="hr-shifts" className="flex items-center gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">HR & Shifts</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-1.5 text-xs">
              <DollarSign className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="workspaces" className="flex items-center gap-1.5 text-xs">
              <Building2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Workspaces</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <WorkspaceDashboardPanel />
          </TabsContent>

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

          <TabsContent value="stock" className="mt-6">
            <StockManagementPanel />
          </TabsContent>

          <TabsContent value="hr-shifts" className="mt-6">
            <HRShiftsPanel />
          </TabsContent>

          <TabsContent value="billing" className="mt-6">
            <BillingPanel />
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
                  <p>Navigate to Workspace Management for full workspace administration.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
