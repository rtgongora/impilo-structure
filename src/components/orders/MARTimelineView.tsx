import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Search,
  ChevronLeft,
  ChevronRight,
  Pill,
  User
} from "lucide-react";
import { format, addDays, subDays, parseISO, isToday, isBefore } from "date-fns";
import { toast } from "sonner";

interface ScheduledDose {
  id: string;
  medication_order_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  administered_at: string | null;
  notes: string | null;
  medication_order?: {
    medication_name: string;
    dosage: string;
    dosage_unit: string;
    route: string;
    frequency: string;
    patient_id: string;
    patient?: {
      id: string;
      first_name: string;
      last_name: string;
      mrn: string;
    };
  };
}

interface PatientGroup {
  patientId: string;
  patientName: string;
  mrn: string;
  doses: ScheduledDose[];
}

export function MARTimelineView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [doses, setDoses] = useState<ScheduledDose[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"timeline" | "patient">("timeline");

  const fetchDoses = async () => {
    setLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    try {
      const { data, error } = await supabase
        .from('medication_schedule_times')
        .select(`
          id,
          medication_order_id,
          scheduled_date,
          scheduled_time,
          status,
          administered_at,
          notes,
          medication_orders!medication_schedule_times_medication_order_id_fkey (
            medication_name,
            dosage,
            dosage_unit,
            route,
            frequency,
            patient_id,
            patients!medication_orders_patient_id_fkey (
              id,
              first_name,
              last_name,
              mrn
            )
          )
        `)
        .eq('scheduled_date', dateStr)
        .order('scheduled_time', { ascending: true });

      if (error) throw error;

      const formattedDoses = (data || []).map((d: any) => ({
        ...d,
        medication_order: d.medication_orders ? {
          ...d.medication_orders,
          patient: d.medication_orders.patients,
        } : undefined,
      }));

      setDoses(formattedDoses);
    } catch (error) {
      console.error('Failed to fetch doses:', error);
      toast.error('Failed to load medication schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoses();
  }, [selectedDate]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('mar-timeline')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medication_schedule_times',
        },
        () => {
          fetchDoses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate]);

  const filteredDoses = doses.filter((dose) => {
    const matchesSearch = searchTerm === "" || 
      dose.medication_order?.medication_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dose.medication_order?.patient?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dose.medication_order?.patient?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dose.medication_order?.patient?.mrn.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || dose.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Group by patient for patient view
  const patientGroups: PatientGroup[] = [];
  filteredDoses.forEach((dose) => {
    const patientId = dose.medication_order?.patient_id || 'unknown';
    const existingGroup = patientGroups.find(g => g.patientId === patientId);
    
    if (existingGroup) {
      existingGroup.doses.push(dose);
    } else {
      patientGroups.push({
        patientId,
        patientName: dose.medication_order?.patient 
          ? `${dose.medication_order.patient.first_name} ${dose.medication_order.patient.last_name}`
          : 'Unknown Patient',
        mrn: dose.medication_order?.patient?.mrn || '',
        doses: [dose],
      });
    }
  });

  // Group by time slot for timeline view
  const timeSlots: Record<string, ScheduledDose[]> = {};
  filteredDoses.forEach((dose) => {
    const hour = dose.scheduled_time.substring(0, 2);
    const slot = `${hour}:00`;
    if (!timeSlots[slot]) {
      timeSlots[slot] = [];
    }
    timeSlots[slot].push(dose);
  });

  const markAsAdministered = async (doseId: string) => {
    try {
      const { error } = await supabase
        .from('medication_schedule_times')
        .update({
          status: 'given',
          administered_at: new Date().toISOString(),
        })
        .eq('id', doseId);

      if (error) throw error;
      toast.success('Medication marked as given');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    }
  };

  const markAsMissed = async (doseId: string) => {
    try {
      const { error } = await supabase
        .from('medication_schedule_times')
        .update({
          status: 'missed',
        })
        .eq('id', doseId);

      if (error) throw error;
      toast.success('Medication marked as missed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    }
  };

  const getStatusBadge = (status: string, scheduledTime: string) => {
    const now = new Date();
    const currentTime = format(now, 'HH:mm');
    const isOverdue = isToday(selectedDate) && status === 'scheduled' && scheduledTime < currentTime;

    if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    }

    switch (status) {
      case 'given':
        return <Badge className="bg-green-500/10 text-green-700 border-green-300">Given</Badge>;
      case 'missed':
        return <Badge variant="destructive">Missed</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'held':
        return <Badge variant="outline">Held</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    total: filteredDoses.length,
    given: filteredDoses.filter(d => d.status === 'given').length,
    scheduled: filteredDoses.filter(d => d.status === 'scheduled').length,
    missed: filteredDoses.filter(d => d.status === 'missed').length,
    overdue: filteredDoses.filter(d => {
      const currentTime = format(new Date(), 'HH:mm');
      return isToday(selectedDate) && d.status === 'scheduled' && d.scheduled_time < currentTime;
    }).length,
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-3 py-2 border rounded-md min-w-[180px] justify-center">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d, yyyy')}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              {!isToday(selectedDate) && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date())}>
                  Today
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patient or medication..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="given">Given</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
                <SelectItem value="held">Held</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
              <TabsList>
                <TabsTrigger value="timeline">
                  <Clock className="h-4 w-4 mr-1" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="patient">
                  <User className="h-4 w-4 mr-1" />
                  By Patient
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.given}</p>
            <p className="text-xs text-muted-foreground">Given</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.overdue}</p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.missed}</p>
            <p className="text-xs text-muted-foreground">Missed</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Medication Administration Record
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Loading schedule...
            </div>
          ) : filteredDoses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Pill className="h-12 w-12 mb-4 opacity-30" />
              <p>No medications scheduled for this date</p>
            </div>
          ) : viewMode === "timeline" ? (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {Object.keys(timeSlots).sort().map((slot) => (
                  <div key={slot} className="border-l-2 border-primary/20 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-primary -ml-[22px]" />
                      <span className="font-semibold text-lg">{slot}</span>
                      <Badge variant="outline">{timeSlots[slot].length} doses</Badge>
                    </div>
                    <div className="space-y-2">
                      {timeSlots[slot].map((dose) => (
                        <DoseCard
                          key={dose.id}
                          dose={dose}
                          onAdminister={() => markAsAdministered(dose.id)}
                          onMiss={() => markAsMissed(dose.id)}
                          getStatusBadge={getStatusBadge}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-6">
                {patientGroups.map((group) => (
                  <div key={group.patientId} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">{group.patientName}</p>
                        <p className="text-sm text-muted-foreground">{group.mrn}</p>
                      </div>
                      <Badge variant="secondary" className="ml-auto">
                        {group.doses.length} medications
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {group.doses.map((dose) => (
                        <DoseCard
                          key={dose.id}
                          dose={dose}
                          onAdminister={() => markAsAdministered(dose.id)}
                          onMiss={() => markAsMissed(dose.id)}
                          getStatusBadge={getStatusBadge}
                          showPatient={false}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface DoseCardProps {
  dose: ScheduledDose;
  onAdminister: () => void;
  onMiss: () => void;
  getStatusBadge: (status: string, time: string) => React.ReactNode;
  showPatient?: boolean;
}

function DoseCard({ dose, onAdminister, onMiss, getStatusBadge, showPatient = true }: DoseCardProps) {
  const isActionable = dose.status === 'scheduled';

  return (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className="text-center min-w-[50px]">
          <Clock className="h-4 w-4 mx-auto text-muted-foreground" />
          <span className="text-sm font-mono">{dose.scheduled_time}</span>
        </div>
        <div>
          <p className="font-medium">{dose.medication_order?.medication_name || 'Unknown'}</p>
          <p className="text-sm text-muted-foreground">
            {dose.medication_order?.dosage} {dose.medication_order?.dosage_unit} • {dose.medication_order?.route}
          </p>
          {showPatient && dose.medication_order?.patient && (
            <p className="text-xs text-muted-foreground mt-1">
              {dose.medication_order.patient.first_name} {dose.medication_order.patient.last_name} ({dose.medication_order.patient.mrn})
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {getStatusBadge(dose.status, dose.scheduled_time)}
        {isActionable && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
              onClick={onAdminister}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
              onClick={onMiss}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </>
        )}
        {dose.status === 'given' && dose.administered_at && (
          <span className="text-xs text-muted-foreground">
            {format(parseISO(dose.administered_at), 'HH:mm')}
          </span>
        )}
      </div>
    </div>
  );
}
