import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, LayoutDashboard, QrCode, Settings, GitBranch, CalendarDays,
  UserPlus, Siren, Footprints, Calendar, ArrowRightLeft, Activity,
  Bed, Building2, ClipboardCheck, AlertTriangle, Shield
} from "lucide-react";
import { 
  QueueWorkstation, 
  SupervisorDashboard, 
  AddToQueueDialog, 
  QueueConfigManager,
  QueuePathwayEditor 
} from "@/components/queue";
import { PatientSortingDesk } from "@/components/sorting";
import { SelfCheckInKiosk } from "@/components/booking/SelfCheckInKiosk";
import { BookingManager } from "@/components/booking/BookingManager";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQueueManagement } from "@/hooks/useQueueManagement";
import { useFacility } from "@/contexts/FacilityContext";

type TabValue = 'intake' | 'workstation' | 'supervisor' | 'wards' | 'bookings' | 'check-in' | 'config' | 'pathways';

// Role-based tab visibility
const ROLE_TAB_ACCESS: Record<string, TabValue[]> = {
  receptionist: ['intake', 'workstation', 'bookings', 'check-in'],
  nurse: ['intake', 'workstation', 'supervisor', 'wards', 'bookings'],
  doctor: ['workstation', 'supervisor', 'wards', 'bookings'],
  specialist: ['workstation', 'supervisor', 'wards'],
  admin: ['intake', 'workstation', 'supervisor', 'wards', 'bookings', 'check-in', 'config', 'pathways'],
  pharmacist: ['workstation'],
  lab_tech: ['workstation'],
};

function getVisibleTabs(role: string): TabValue[] {
  return ROLE_TAB_ACCESS[role] || ROLE_TAB_ACCESS.nurse;
}

const TAB_CONFIG: Record<TabValue, { label: string; icon: React.ComponentType<{ className?: string }>; description: string }> = {
  intake: { label: "Patient Intake", icon: UserPlus, description: "Arrival, registration & triage" },
  workstation: { label: "My Queue", icon: Users, description: "Active queue workstation" },
  supervisor: { label: "Supervisor", icon: LayoutDashboard, description: "All queues overview" },
  wards: { label: "Wards", icon: Bed, description: "Ward occupancy & flow" },
  bookings: { label: "Bookings", icon: CalendarDays, description: "Appointments & bookings" },
  'check-in': { label: "Self Check-In", icon: QrCode, description: "Kiosk mode" },
  config: { label: "Config", icon: Settings, description: "Queue configuration" },
  pathways: { label: "Pathways", icon: GitBranch, description: "Patient flow pathways" },
};

const Queue = () => {
  const [selectedQueueId, setSelectedQueueId] = useState<string | undefined>();
  const { queues, refetch } = useQueueManagement();
  const { currentFacility } = useFacility();
  
  // Simulated role - in production this comes from auth context
  const userRole = 'admin'; // TODO: pull from useAuth
  const visibleTabs = getVisibleTabs(userRole);
  const [activeTab, setActiveTab] = useState<TabValue>(visibleTabs[0]);

  return (
    <AppLayout title="Queues, Wards & Workspaces">
      <div className="flex-1 flex flex-col p-4 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div>
            <p className="text-sm text-muted-foreground">
              Patient flow orchestration — intake, triage, queue assignment & workspace management
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AddToQueueDialog queues={queues} onSuccess={refetch} />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="shrink-0 h-10 flex-wrap justify-start">
            {visibleTabs.map((tabId) => {
              const config = TAB_CONFIG[tabId];
              const Icon = config.icon;
              return (
                <TabsTrigger key={tabId} value={tabId} className="flex items-center gap-1.5 text-sm">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{config.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="flex-1 overflow-auto mt-2">
            {/* Patient Intake — Sorting Desk embedded */}
            <TabsContent value="intake" className="h-full mt-0">
              <PatientSortingDesk 
                facilityId={currentFacility?.id} 
              />
            </TabsContent>

            {/* Queue Workstation */}
            <TabsContent value="workstation" className="h-full mt-0">
              <QueueWorkstation initialQueueId={selectedQueueId} />
            </TabsContent>

            {/* Supervisor Dashboard */}
            <TabsContent value="supervisor" className="h-full mt-0">
              <SupervisorDashboard 
                onSelectQueue={(queueId) => {
                  setSelectedQueueId(queueId);
                  setActiveTab('workstation');
                }} 
              />
            </TabsContent>

            {/* Wards Overview */}
            <TabsContent value="wards" className="h-full mt-0">
              <WardsOverviewPanel />
            </TabsContent>

            {/* Bookings */}
            <TabsContent value="bookings" className="h-full mt-0">
              <BookingManager />
            </TabsContent>

            {/* Self Check-In Kiosk */}
            <TabsContent value="check-in" className="h-full mt-0">
              <div className="max-w-md mx-auto">
                <SelfCheckInKiosk facilityName="Impilo Health" />
              </div>
            </TabsContent>

            {/* Config */}
            <TabsContent value="config" className="h-full mt-0">
              <QueueConfigManager />
            </TabsContent>

            {/* Pathways */}
            <TabsContent value="pathways" className="h-full mt-0">
              <QueuePathwayEditor />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
};

// Wards Overview Panel — quick view of ward occupancy & patient distribution
function WardsOverviewPanel() {
  // Mock ward data - in production this queries beds/wards tables
  const wards = [
    { name: "Medical Ward A", beds: 24, occupied: 18, discharges: 3, admissions: 2, acuity: "medium" },
    { name: "Medical Ward B", beds: 20, occupied: 20, discharges: 1, admissions: 0, acuity: "high" },
    { name: "Surgical Ward", beds: 16, occupied: 12, discharges: 2, admissions: 4, acuity: "medium" },
    { name: "Maternity Ward", beds: 12, occupied: 8, discharges: 2, admissions: 1, acuity: "low" },
    { name: "Paediatric Ward", beds: 10, occupied: 6, discharges: 1, admissions: 2, acuity: "medium" },
    { name: "ICU", beds: 8, occupied: 7, discharges: 0, admissions: 1, acuity: "critical" },
  ];

  const totalBeds = wards.reduce((s, w) => s + w.beds, 0);
  const totalOccupied = wards.reduce((s, w) => s + w.occupied, 0);
  const occupancyRate = Math.round((totalOccupied / totalBeds) * 100);

  const getAcuityBadge = (acuity: string) => {
    const map: Record<string, { label: string; variant: "destructive" | "default" | "secondary" | "outline" }> = {
      critical: { label: "Critical", variant: "destructive" },
      high: { label: "High", variant: "default" },
      medium: { label: "Medium", variant: "secondary" },
      low: { label: "Low", variant: "outline" },
    };
    const config = map[acuity] || map.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Bed className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalBeds}</p>
                <p className="text-xs text-muted-foreground">Total Beds</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalOccupied}</p>
                <p className="text-xs text-muted-foreground">Occupied</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                occupancyRate > 90 ? 'bg-red-100' : 'bg-green-100'
              }`}>
                <Activity className={`h-5 w-5 ${
                  occupancyRate > 90 ? 'text-red-600' : 'text-green-600'
                }`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${occupancyRate > 90 ? 'text-red-600' : ''}`}>{occupancyRate}%</p>
                <p className="text-xs text-muted-foreground">Occupancy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{wards.length}</p>
                <p className="text-xs text-muted-foreground">Active Wards</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full ward alert */}
      {wards.some(w => w.occupied >= w.beds) && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {wards.filter(w => w.occupied >= w.beds).map(w => w.name).join(', ')} at full capacity
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ward cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {wards.map((ward) => {
          const pct = Math.round((ward.occupied / ward.beds) * 100);
          const isFull = ward.occupied >= ward.beds;
          return (
            <Card key={ward.name} className={isFull ? 'border-red-200' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{ward.name}</CardTitle>
                  {getAcuityBadge(ward.acuity)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{ward.occupied}/{ward.beds}</span>
                  <span className={`text-sm font-medium ${
                    pct >= 100 ? 'text-red-600' : pct >= 80 ? 'text-yellow-600' : 'text-green-600'
                  }`}>{pct}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-3">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    {ward.discharges} pending discharge
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    {ward.admissions} incoming
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default Queue;
