import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  UserPlus, 
  Clock, 
  Users, 
  AlertTriangle,
  Activity,
  CheckCircle2,
  Siren,
  Calendar,
  ArrowRightLeft,
  Footprints
} from "lucide-react";
import { usePatientSorting } from "@/hooks/usePatientSorting";
import { SortingSession, TRIAGE_URGENCY_CONFIG, ArrivalMode } from "@/types/sorting";
import { SortingWorkflow } from "./SortingWorkflow";
import { SortingSessionCard } from "./SortingSessionCard";
import { SortingMetricsPanel } from "./SortingMetricsPanel";

interface PatientSortingDeskProps {
  facilityId?: string;
  onBack?: () => void;
}

const ARRIVAL_BUTTONS: { mode: ArrivalMode; label: string; icon: React.ReactNode; color: string }[] = [
  { mode: 'walk_in', label: 'Walk-in', icon: <Footprints className="h-5 w-5" />, color: 'bg-blue-500 hover:bg-blue-600' },
  { mode: 'appointment', label: 'Appointment', icon: <Calendar className="h-5 w-5" />, color: 'bg-green-500 hover:bg-green-600' },
  { mode: 'referral', label: 'Referral', icon: <ArrowRightLeft className="h-5 w-5" />, color: 'bg-purple-500 hover:bg-purple-600' },
  { mode: 'emergency', label: 'Emergency', icon: <Siren className="h-5 w-5" />, color: 'bg-red-500 hover:bg-red-600' },
];

export function PatientSortingDesk({ facilityId, onBack }: PatientSortingDeskProps) {
  const { 
    activeSessions, 
    metrics, 
    loading, 
    createSession,
    searchPatients,
    confirmIdentity,
    createTempIdentity,
    performTriage,
    routeToImmediateCare,
    routeToQueue,
    cancelSession,
  } = usePatientSorting(facilityId);

  const [activeTab, setActiveTab] = useState<'desk' | 'active' | 'metrics'>('desk');
  const [currentSession, setCurrentSession] = useState<SortingSession | null>(null);

  const handleNewArrival = async (mode: ArrivalMode) => {
    const session = await createSession({ arrival_mode: mode, facility_id: facilityId });
    if (session) {
      setCurrentSession(session);
    }
  };

  const handleSessionComplete = () => {
    setCurrentSession(null);
  };

  const handleSelectSession = (session: SortingSession) => {
    setCurrentSession(session);
  };

  // Group active sessions by urgency
  const sessionsByUrgency = {
    emergency: activeSessions.filter(s => s.triage_category === 'emergency'),
    very_urgent: activeSessions.filter(s => s.triage_category === 'very_urgent'),
    urgent: activeSessions.filter(s => s.triage_category === 'urgent'),
    routine: activeSessions.filter(s => s.triage_category === 'routine'),
    untriaged: activeSessions.filter(s => !s.triage_category),
  };

  if (currentSession) {
    return (
      <SortingWorkflow
        session={currentSession}
        facilityId={facilityId}
        onComplete={handleSessionComplete}
        onCancel={() => setCurrentSession(null)}
        searchPatients={searchPatients}
        confirmIdentity={confirmIdentity}
        createTempIdentity={createTempIdentity}
        performTriage={performTriage}
        routeToImmediateCare={routeToImmediateCare}
        routeToQueue={routeToQueue}
        cancelSession={cancelSession}
      />
    );
  }

  return (
    <div className="h-full bg-background p-2 md:p-3 flex flex-col overflow-hidden">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-lg font-bold leading-tight">Patient Sorting Desk</h1>
            <p className="text-xs text-muted-foreground">Arrival, triage & queue</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="gap-1 py-1 px-2 text-xs">
            <Users className="h-3 w-3" />
            {activeSessions.length}
          </Badge>
          {metrics && metrics.pending_count > 0 && (
            <Badge variant="destructive" className="gap-1 py-1 px-2 text-xs">
              <Clock className="h-3 w-3" />
              {metrics.pending_count}
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full max-w-md grid-cols-3 h-10 flex-shrink-0">
          <TabsTrigger value="desk" className="gap-1.5 text-xs h-9">
            <UserPlus className="h-3.5 w-3.5" />
            New
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-1.5 text-xs h-9">
            <Activity className="h-3.5 w-3.5" />
            Active ({activeSessions.length})
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-1.5 text-xs h-9">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Metrics
          </TabsTrigger>
        </TabsList>

        {/* New Arrival Tab */}
        <TabsContent value="desk" className="flex-1 overflow-y-auto mt-2 space-y-3">
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserPlus className="h-4 w-4" />
                New Arrival
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="grid grid-cols-4 gap-2">
                {ARRIVAL_BUTTONS.map(({ mode, label, icon, color }) => (
                  <Button
                    key={mode}
                    className={`h-16 flex-col gap-1 text-white ${color} active:scale-[0.98]`}
                    onClick={() => handleNewArrival(mode)}
                    disabled={loading}
                  >
                    {icon}
                    <span className="font-medium text-xs">{label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Compact Stats */}
          {metrics && (
            <div className="grid grid-cols-4 gap-2">
              <Card className="p-2">
                <div className="text-xl font-bold">{metrics.total_arrivals}</div>
                <p className="text-[10px] text-muted-foreground leading-tight">Arrivals</p>
              </Card>
              <Card className="p-2">
                <div className="text-xl font-bold">{metrics.total_triaged}</div>
                <p className="text-[10px] text-muted-foreground leading-tight">Triaged</p>
              </Card>
              <Card className="p-2">
                <div className="text-xl font-bold text-red-600">{metrics.immediate_care_count}</div>
                <p className="text-[10px] text-muted-foreground leading-tight">Immediate</p>
              </Card>
              <Card className="p-2">
                <div className="text-xl font-bold text-blue-600">{metrics.queued_count}</div>
                <p className="text-[10px] text-muted-foreground leading-tight">Queued</p>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Active Sessions Tab */}
        <TabsContent value="active" className="flex-1 overflow-y-auto mt-2">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground text-sm">Loading...</div>
          ) : activeSessions.length === 0 ? (
            <Card className="p-4 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <h3 className="font-medium text-sm">No Active Sessions</h3>
              <p className="text-xs text-muted-foreground">All patients processed.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {sessionsByUrgency.emergency.length > 0 && (
                <div>
                  <h3 className="font-medium text-red-600 mb-1.5 flex items-center gap-1 text-sm">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Emergency ({sessionsByUrgency.emergency.length})
                  </h3>
                  <div className="grid gap-2">
                    {sessionsByUrgency.emergency.map(session => (
                      <SortingSessionCard key={session.id} session={session} onClick={() => handleSelectSession(session)} />
                    ))}
                  </div>
                </div>
              )}

              {sessionsByUrgency.very_urgent.length > 0 && (
                <div>
                  <h3 className="font-medium text-orange-600 mb-1.5 text-sm">Very Urgent ({sessionsByUrgency.very_urgent.length})</h3>
                  <div className="grid gap-2">
                    {sessionsByUrgency.very_urgent.map(session => (
                      <SortingSessionCard key={session.id} session={session} onClick={() => handleSelectSession(session)} />
                    ))}
                  </div>
                </div>
              )}

              {sessionsByUrgency.untriaged.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-600 mb-1.5 text-sm">Awaiting Triage ({sessionsByUrgency.untriaged.length})</h3>
                  <div className="grid gap-2">
                    {sessionsByUrgency.untriaged.map(session => (
                      <SortingSessionCard key={session.id} session={session} onClick={() => handleSelectSession(session)} />
                    ))}
                  </div>
                </div>
              )}

              {sessionsByUrgency.urgent.length > 0 && (
                <div>
                  <h3 className="font-medium text-yellow-600 mb-1.5 text-sm">Urgent ({sessionsByUrgency.urgent.length})</h3>
                  <div className="grid gap-2">
                    {sessionsByUrgency.urgent.map(session => (
                      <SortingSessionCard key={session.id} session={session} onClick={() => handleSelectSession(session)} />
                    ))}
                  </div>
                </div>
              )}

              {sessionsByUrgency.routine.length > 0 && (
                <div>
                  <h3 className="font-medium text-green-600 mb-1.5 text-sm">Routine ({sessionsByUrgency.routine.length})</h3>
                  <div className="grid gap-2">
                    {sessionsByUrgency.routine.map(session => (
                      <SortingSessionCard key={session.id} session={session} onClick={() => handleSelectSession(session)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="flex-1 overflow-y-auto mt-2">
          <SortingMetricsPanel metrics={metrics} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
