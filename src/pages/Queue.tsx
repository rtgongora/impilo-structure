import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, LayoutDashboard, QrCode, Settings, GitBranch, CalendarDays,
  UserPlus, Bed, Building2, Activity, AlertTriangle,
  Stethoscope, Globe, Home, Wifi, ChevronRight, ArrowLeft
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
import { AppLayout } from "@/components/layout/AppLayout";
import { useQueueManagement } from "@/hooks/useQueueManagement";
import { useFacility } from "@/contexts/FacilityContext";

// ── Care Point Types ──
type CarePoint = 'outpatient' | 'inpatient' | 'community' | 'virtual';
type TabValue = 'intake' | 'workstation' | 'supervisor' | 'wards' | 'bookings' | 'check-in' | 'config' | 'pathways';

const CARE_POINTS: { id: CarePoint; label: string; icon: React.ComponentType<{ className?: string }>; description: string; color: string }[] = [
  { id: 'outpatient', label: 'Outpatient', icon: Stethoscope, description: 'OPD, clinics, walk-ins & appointments', color: 'bg-blue-500' },
  { id: 'inpatient', label: 'Inpatient', icon: Bed, description: 'Wards, admissions & bed management', color: 'bg-amber-500' },
  { id: 'community', label: 'Community', icon: Home, description: 'Community health, outreach & home visits', color: 'bg-green-500' },
  { id: 'virtual', label: 'Virtual', icon: Wifi, description: 'Telemedicine, teleconsults & remote care', color: 'bg-purple-500' },
];

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

// Map care points to relevant default tabs
const CARE_POINT_DEFAULT_TAB: Record<CarePoint, TabValue> = {
  outpatient: 'intake',
  inpatient: 'wards',
  community: 'workstation',
  virtual: 'workstation',
};

// Filter tabs per care point
const CARE_POINT_TABS: Record<CarePoint, TabValue[]> = {
  outpatient: ['intake', 'workstation', 'supervisor', 'bookings', 'check-in', 'config', 'pathways'],
  inpatient: ['wards', 'workstation', 'supervisor', 'bookings', 'config'],
  community: ['workstation', 'supervisor', 'bookings', 'config'],
  virtual: ['workstation', 'supervisor', 'bookings', 'config'],
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

  // ── Care Point Selector (Landing) ──
  if (!selectedCarePoint) {
    return (
    <AppLayout title="Queues & Wards">
        <div className="flex-1 flex flex-col p-4 md:p-6">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              Select a care setting to manage patient flow, queues, wards and workspaces
            </p>
          </div>

          {/* Care Point Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {CARE_POINTS.map((cp) => {
              const Icon = cp.icon;
              // Count relevant queues
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
                  <CardContent className="pt-6 pb-4">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className={`h-14 w-14 rounded-xl ${cp.color} flex items-center justify-center text-white shadow-sm`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base">{cp.label}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{cp.description}</p>
                      </div>
                      {queueCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {queueCount} active queue{queueCount !== 1 ? 's' : ''}
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => handleSelectCarePoint('outpatient')}>
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <UserPlus className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium text-sm">New Patient Arrival</p>
                  <p className="text-xs text-muted-foreground">Register, triage & assign to queue</p>
                </div>
                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => handleSelectCarePoint('inpatient')}>
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <Bed className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium text-sm">Ward Management</p>
                  <p className="text-xs text-muted-foreground">Beds, admissions & discharges</p>
                </div>
                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => { setSelectedCarePoint('outpatient'); setActiveTab('bookings'); }}>
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-sm">Today's Bookings</p>
                  <p className="text-xs text-muted-foreground">Scheduled appointments & reviews</p>
                </div>
                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Active Care Point View ──
  const currentCarePoint = CARE_POINTS.find(c => c.id === selectedCarePoint)!;
  const CareIcon = currentCarePoint.icon;

  return (
    <AppLayout title="Queues & Wards">
      <div className="flex-1 flex flex-col p-4 min-h-0">
        {/* Care Point Header with back nav */}
        <div className="flex items-center justify-between mb-3 shrink-0">
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

          <div className="flex-1 overflow-auto mt-2">
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

// ── Wards Overview Panel ──
function WardsOverviewPanel() {
  const navigate = useNavigate();
  
  const wards = [
    { id: '1', name: "Medical Ward A", beds: 24, occupied: 18, discharges: 3, admissions: 2, acuity: "medium" },
    { id: '2', name: "Medical Ward B", beds: 20, occupied: 20, discharges: 1, admissions: 0, acuity: "high" },
    { id: '3', name: "Surgical Ward", beds: 16, occupied: 12, discharges: 2, admissions: 4, acuity: "medium" },
    { id: '4', name: "Maternity Ward", beds: 12, occupied: 8, discharges: 2, admissions: 1, acuity: "low" },
    { id: '5', name: "Paediatric Ward", beds: 10, occupied: 6, discharges: 1, admissions: 2, acuity: "medium" },
    { id: '6', name: "ICU", beds: 8, occupied: 7, discharges: 0, admissions: 1, acuity: "critical" },
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

      {/* Ward cards — clickable to navigate to bed management */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {wards.map((ward) => {
          const pct = Math.round((ward.occupied / ward.beds) * 100);
          const isFull = ward.occupied >= ward.beds;
          return (
            <Card 
              key={ward.id} 
              className={`cursor-pointer hover:shadow-md transition-all ${isFull ? 'border-red-200' : 'hover:border-primary/30'}`}
              onClick={() => navigate('/beds')}
            >
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
