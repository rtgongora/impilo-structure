import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, LayoutDashboard, QrCode, Settings, GitBranch, CalendarDays,
  UserPlus, Bed, Building2, Activity, AlertTriangle,
  Stethoscope, Globe, Home, Wifi, ChevronRight, ArrowLeft,
  Package, DollarSign, Clock, BarChart3
} from "lucide-react";
import { 
  QueueWorkstation, 
  SupervisorDashboard, 
  AddToQueueDialog, 
  QueueConfigManager,
  QueuePathwayEditor 
} from "@/components/queue";
import { PatientSortingDesk } from "@/components/sorting";
import { WardManagementPanel } from "@/components/queue/WardManagementPanel";
import { SelfCheckInKiosk } from "@/components/booking/SelfCheckInKiosk";
import { BookingManager } from "@/components/booking/BookingManager";
import { WorkspaceDashboardPanel } from "@/components/workspace-ops/WorkspaceDashboardPanel";
import { StockManagementPanel } from "@/components/workspace-ops/StockManagementPanel";
import { HRShiftsPanel } from "@/components/workspace-ops/HRShiftsPanel";
import { BillingPanel } from "@/components/workspace-ops/BillingPanel";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQueueManagement } from "@/hooks/useQueueManagement";
import { useFacility } from "@/contexts/FacilityContext";

// ── Care Point Types ──
type CarePoint = 'outpatient' | 'inpatient' | 'community' | 'virtual';
type TabValue = 'dashboard' | 'intake' | 'workstation' | 'supervisor' | 'wards' | 'bookings' | 'check-in' | 'stock' | 'hr-shifts' | 'billing' | 'config' | 'pathways';

const CARE_POINTS: { id: CarePoint; label: string; icon: React.ComponentType<{ className?: string }>; description: string; color: string }[] = [
  { id: 'outpatient', label: 'Outpatient', icon: Stethoscope, description: 'OPD, clinics, walk-ins & appointments', color: 'bg-blue-500' },
  { id: 'inpatient', label: 'Inpatient', icon: Bed, description: 'Wards, admissions & bed management', color: 'bg-amber-500' },
  { id: 'community', label: 'Community', icon: Home, description: 'Community health, outreach & home visits', color: 'bg-green-500' },
  { id: 'virtual', label: 'Virtual', icon: Wifi, description: 'Telemedicine, teleconsults & remote care', color: 'bg-purple-500' },
];

// Role-based tab visibility — combined clinical + operational roles
const ROLE_TAB_ACCESS: Record<string, TabValue[]> = {
  receptionist: ['dashboard', 'intake', 'workstation', 'bookings', 'check-in'],
  nurse: ['dashboard', 'intake', 'workstation', 'supervisor', 'wards', 'bookings', 'stock'],
  doctor: ['dashboard', 'workstation', 'supervisor', 'wards', 'bookings'],
  specialist: ['dashboard', 'workstation', 'supervisor', 'wards'],
  admin: ['dashboard', 'intake', 'workstation', 'supervisor', 'wards', 'bookings', 'check-in', 'stock', 'hr-shifts', 'billing', 'config', 'pathways'],
  pharmacist: ['dashboard', 'workstation', 'stock'],
  lab_tech: ['dashboard', 'workstation', 'stock'],
  // Operational roles
  ward_manager: ['dashboard', 'wards', 'supervisor', 'hr-shifts', 'stock', 'billing', 'config'],
  stock_controller: ['dashboard', 'stock', 'config'],
  hr_officer: ['dashboard', 'hr-shifts'],
  finance_officer: ['dashboard', 'billing'],
  facility_manager: ['dashboard', 'intake', 'workstation', 'supervisor', 'wards', 'bookings', 'stock', 'hr-shifts', 'billing', 'config', 'pathways'],
};

function getVisibleTabs(role: string): TabValue[] {
  return ROLE_TAB_ACCESS[role] || ROLE_TAB_ACCESS.nurse;
}

const TAB_CONFIG: Record<TabValue, { label: string; icon: React.ComponentType<{ className?: string }>; description: string }> = {
  dashboard: { label: "Dashboard", icon: BarChart3, description: "Workspace overview & KPIs" },
  intake: { label: "Patient Intake", icon: UserPlus, description: "Arrival, registration & triage" },
  workstation: { label: "My Queue", icon: Users, description: "Active queue workstation" },
  supervisor: { label: "Supervisor", icon: LayoutDashboard, description: "All queues overview" },
  wards: { label: "Wards", icon: Bed, description: "Ward occupancy & flow" },
  bookings: { label: "Bookings", icon: CalendarDays, description: "Appointments & bookings" },
  'check-in': { label: "Self Check-In", icon: QrCode, description: "Kiosk mode" },
  stock: { label: "Stock", icon: Package, description: "Inventory, orders & receiving" },
  'hr-shifts': { label: "HR & Shifts", icon: Clock, description: "Staff roster, shifts & leave" },
  billing: { label: "Billing", icon: DollarSign, description: "Charges, invoices & claims" },
  config: { label: "Config", icon: Settings, description: "Queue configuration" },
  pathways: { label: "Pathways", icon: GitBranch, description: "Patient flow pathways" },
};

// Map care points to relevant default tabs
const CARE_POINT_DEFAULT_TAB: Record<CarePoint, TabValue> = {
  outpatient: 'dashboard',
  inpatient: 'dashboard',
  community: 'dashboard',
  virtual: 'dashboard',
};

// Filter tabs per care point — all care points get operational tabs
const CARE_POINT_TABS: Record<CarePoint, TabValue[]> = {
  outpatient: ['dashboard', 'intake', 'workstation', 'supervisor', 'bookings', 'check-in', 'stock', 'hr-shifts', 'billing', 'config', 'pathways'],
  inpatient: ['dashboard', 'wards', 'workstation', 'supervisor', 'bookings', 'stock', 'hr-shifts', 'billing', 'config'],
  community: ['dashboard', 'workstation', 'supervisor', 'bookings', 'stock', 'hr-shifts', 'billing', 'config'],
  virtual: ['dashboard', 'workstation', 'supervisor', 'bookings', 'billing', 'config'],
};

const Queue = () => {
  const [selectedCarePoint, setSelectedCarePoint] = useState<CarePoint | null>(null);
  const [selectedQueueId, setSelectedQueueId] = useState<string | undefined>();
  const { queues, refetch } = useQueueManagement();
  const { currentFacility } = useFacility();
  
  const userRole = 'admin'; // TODO: pull from useAuth
  const visibleTabs = getVisibleTabs(userRole);
  
  // Compute tabs for current care point
  const carePointTabs = selectedCarePoint 
    ? CARE_POINT_TABS[selectedCarePoint].filter(t => visibleTabs.includes(t))
    : [];
  
  const defaultTab = selectedCarePoint ? CARE_POINT_DEFAULT_TAB[selectedCarePoint] : 'intake';
  const [activeTab, setActiveTab] = useState<TabValue>(defaultTab);

  const handleSelectCarePoint = (cp: CarePoint) => {
    setSelectedCarePoint(cp);
    const newDefault = CARE_POINT_DEFAULT_TAB[cp];
    const allowed = CARE_POINT_TABS[cp].filter(t => visibleTabs.includes(t));
    setActiveTab(allowed.includes(newDefault) ? newDefault : allowed[0]);
  };

  const handleBackToCarePoints = () => {
    setSelectedCarePoint(null);
  };

  // ── Care Point Selector (Landing) — Dashboard + Wards tabs ──
  if (!selectedCarePoint) {
    return (
      <AppLayout title="Queues & Wards">
        <div className="flex-1 flex flex-col min-h-0 p-3 gap-2 overflow-auto">
          {/* Care Points — Compact Action Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 shrink-0">
            {CARE_POINTS.map((cp) => {
              const Icon = cp.icon;
              const queueCount = queues.filter(q => {
                if (cp.id === 'outpatient') return ['opd_triage', 'opd_consultation', 'specialist_clinic', 'anc_clinic', 'hiv_clinic', 'tb_clinic', 'ncd_clinic', 'child_welfare_clinic', 'pharmacy', 'lab_reception', 'lab_sample_collection', 'imaging', 'general_reception'].includes(q.service_type);
                if (cp.id === 'inpatient') return ['theatre_preop', 'theatre_recovery', 'procedure_room', 'dialysis'].includes(q.service_type);
                if (cp.id === 'virtual') return ['telecare'].includes(q.service_type);
                return ['specialist_pool'].includes(q.service_type);
              }).length;
              return (
                <Card
                  key={cp.id}
                  className="group cursor-pointer hover:shadow-md transition-all hover:border-primary/30 relative overflow-hidden"
                  onClick={() => handleSelectCarePoint(cp.id)}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 ${cp.color}`} />
                  <CardContent className="pt-3 pb-2 px-3 flex items-center gap-2">
                    <div className={`h-9 w-9 rounded-lg ${cp.color} flex items-center justify-center text-white shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm">{cp.label}</h3>
                      <p className="text-[11px] text-muted-foreground truncate">{cp.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Dashboard + Wards Tabs */}
          <Tabs defaultValue="dashboard" className="flex-1 flex flex-col min-h-0">
            <TabsList className="shrink-0 h-9 w-fit">
              <TabsTrigger value="dashboard" className="text-sm gap-1.5">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="wards" className="text-sm gap-1.5">
                <Bed className="h-4 w-4" />
                Wards
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="flex-1 overflow-auto mt-2">
              <WorkspaceDashboardPanel />
            </TabsContent>
            <TabsContent value="wards" className="flex-1 overflow-auto mt-2">
              <WardManagementPanel />
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    );
  }

  // ── Active Care Point View ──
  const currentCarePoint = CARE_POINTS.find(c => c.id === selectedCarePoint)!;
  const CareIcon = currentCarePoint.icon;

  return (
    <AppLayout title="Queues & Wards">
      <div className="flex-1 flex flex-col p-2 min-h-0">
        {/* Care Point Header with back nav */}
        <div className="flex items-center justify-between mb-1.5 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBackToCarePoints}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className={`h-8 w-8 rounded-lg ${currentCarePoint.color} flex items-center justify-center text-white`}>
              <CareIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold leading-tight">{currentCarePoint.label}</h2>
              <p className="text-xs text-muted-foreground">{currentCarePoint.description}</p>
            </div>
            {/* Care point quick-switch */}
            <div className="hidden md:flex items-center gap-1 ml-4 border-l pl-4">
              {CARE_POINTS.filter(c => c.id !== selectedCarePoint).map(cp => {
                const CpIcon = cp.icon;
                return (
                  <Button 
                    key={cp.id} 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={() => handleSelectCarePoint(cp.id)}
                  >
                    <CpIcon className="h-3.5 w-3.5" />
                    {cp.label}
                  </Button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AddToQueueDialog queues={queues} onSuccess={refetch} />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="shrink-0 h-10 flex-wrap justify-start">
            {carePointTabs.map((tabId) => {
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

          <div className="flex-1 overflow-auto mt-1">
            {/* Dashboard */}
            <TabsContent value="dashboard" className="h-full mt-0">
              <WorkspaceDashboardPanel carePoint={selectedCarePoint} />
            </TabsContent>

            {/* Patient Intake — Sorting Desk embedded */}
            <TabsContent value="intake" className="h-full mt-0">
              <PatientSortingDesk facilityId={currentFacility?.id} />
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
              <WardManagementPanel />
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

            {/* Stock Management */}
            <TabsContent value="stock" className="h-full mt-0">
              <StockManagementPanel />
            </TabsContent>

            {/* HR & Shifts */}
            <TabsContent value="hr-shifts" className="h-full mt-0">
              <HRShiftsPanel />
            </TabsContent>

            {/* Billing */}
            <TabsContent value="billing" className="h-full mt-0">
              <BillingPanel />
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

export default Queue;
