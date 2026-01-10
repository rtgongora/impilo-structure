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
    <div className="min-h-screen bg-background p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Patient Sorting Desk</h1>
            <p className="text-sm text-muted-foreground">
              Arrival, identification, triage, and queue assignment
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {activeSessions.length} Active
          </Badge>
          {metrics && metrics.pending_count > 0 && (
            <Badge variant="destructive" className="gap-1">
              <Clock className="h-3 w-3" />
              {metrics.pending_count} Pending
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="desk" className="gap-2">
            <UserPlus className="h-4 w-4" />
            New Arrival
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            <Activity className="h-4 w-4" />
            Active ({activeSessions.length})
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Metrics
          </TabsTrigger>
        </TabsList>

        {/* New Arrival Tab */}
        <TabsContent value="desk" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Register New Arrival
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                Select the arrival type to start the sorting process. The system will guide you through identification, triage, and routing.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ARRIVAL_BUTTONS.map(({ mode, label, icon, color }) => (
                  <Button
                    key={mode}
                    className={`h-24 flex-col gap-2 text-white ${color}`}
                    onClick={() => handleNewArrival(mode)}
                    disabled={loading}
                  >
                    {icon}
                    <span className="font-medium">{label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{metrics.total_arrivals}</div>
                  <p className="text-xs text-muted-foreground">Today's Arrivals</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{metrics.total_triaged}</div>
                  <p className="text-xs text-muted-foreground">Triaged</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-red-600">{metrics.immediate_care_count}</div>
                  <p className="text-xs text-muted-foreground">Immediate Care</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-blue-600">{metrics.queued_count}</div>
                  <p className="text-xs text-muted-foreground">Queued</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Active Sessions Tab */}
        <TabsContent value="active" className="space-y-4 mt-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : activeSessions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
                <h3 className="font-medium">No Active Sessions</h3>
                <p className="text-sm text-muted-foreground">
                  All patients have been processed. Use "New Arrival" to start.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Emergency & Very Urgent first */}
              {sessionsByUrgency.emergency.length > 0 && (
                <div>
                  <h3 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Emergency ({sessionsByUrgency.emergency.length})
                  </h3>
                  <div className="grid gap-3">
                    {sessionsByUrgency.emergency.map(session => (
                      <SortingSessionCard 
                        key={session.id} 
                        session={session} 
                        onClick={() => handleSelectSession(session)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {sessionsByUrgency.very_urgent.length > 0 && (
                <div>
                  <h3 className="font-medium text-orange-600 mb-2">
                    Very Urgent ({sessionsByUrgency.very_urgent.length})
                  </h3>
                  <div className="grid gap-3">
                    {sessionsByUrgency.very_urgent.map(session => (
                      <SortingSessionCard 
                        key={session.id} 
                        session={session} 
                        onClick={() => handleSelectSession(session)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {sessionsByUrgency.untriaged.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-600 mb-2">
                    Awaiting Triage ({sessionsByUrgency.untriaged.length})
                  </h3>
                  <div className="grid gap-3">
                    {sessionsByUrgency.untriaged.map(session => (
                      <SortingSessionCard 
                        key={session.id} 
                        session={session} 
                        onClick={() => handleSelectSession(session)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {sessionsByUrgency.urgent.length > 0 && (
                <div>
                  <h3 className="font-medium text-yellow-600 mb-2">
                    Urgent ({sessionsByUrgency.urgent.length})
                  </h3>
                  <div className="grid gap-3">
                    {sessionsByUrgency.urgent.map(session => (
                      <SortingSessionCard 
                        key={session.id} 
                        session={session} 
                        onClick={() => handleSelectSession(session)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {sessionsByUrgency.routine.length > 0 && (
                <div>
                  <h3 className="font-medium text-green-600 mb-2">
                    Routine ({sessionsByUrgency.routine.length})
                  </h3>
                  <div className="grid gap-3">
                    {sessionsByUrgency.routine.map(session => (
                      <SortingSessionCard 
                        key={session.id} 
                        session={session} 
                        onClick={() => handleSelectSession(session)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="mt-6">
          <SortingMetricsPanel metrics={metrics} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
