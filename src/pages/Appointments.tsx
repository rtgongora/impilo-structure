import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { 
  CalendarDays, 
  Plus, 
  Clock, 
  User, 
  Building2, 
  ChevronLeft, 
  ChevronRight,
  Video,
  Stethoscope,
  Activity,
  Settings,
  LogOut,
  Loader2,
  Search,
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";

interface Appointment {
  id: string;
  patient_id: string | null;
  provider_id: string | null;
  appointment_type: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  department: string | null;
  location: string | null;
  room: string | null;
  reason: string | null;
  priority: string;
  patients?: {
    first_name: string;
    last_name: string;
    mrn: string;
  } | null;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  mrn: string;
}

const APPOINTMENT_TYPES = [
  { value: 'new', label: 'New Patient' },
  { value: 'follow-up', label: 'Follow-up' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'teleconsult', label: 'Teleconsult' },
  { value: 'lab', label: 'Lab Work' },
  { value: 'imaging', label: 'Imaging' },
  { value: 'therapy', label: 'Therapy' },
];

const DEPARTMENTS = [
  'General Medicine',
  'Cardiology',
  'Orthopedics',
  'Pediatrics',
  'Gynecology',
  'Surgery',
  'Dermatology',
  'Neurology',
  'Psychiatry',
  'Emergency',
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
];

const Appointments = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_type: 'new',
    scheduled_date: format(new Date(), 'yyyy-MM-dd'),
    scheduled_time: '09:00',
    duration: '30',
    department: '',
    location: '',
    room: '',
    reason: '',
    priority: 'normal',
  });

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, [weekStart]);

  const fetchAppointments = async () => {
    try {
      const weekEnd = addDays(weekStart, 7);
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (
            first_name,
            last_name,
            mrn
          )
        `)
        .gte('scheduled_start', weekStart.toISOString())
        .lt('scheduled_start', weekEnd.toISOString())
        .order('scheduled_start', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, mrn')
        .eq('is_active', true)
        .order('last_name', { ascending: true })
        .limit(100);

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const scheduledStart = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);
      const scheduledEnd = new Date(scheduledStart.getTime() + parseInt(formData.duration) * 60000);

      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: formData.patient_id || null,
          appointment_type: formData.appointment_type,
          scheduled_start: scheduledStart.toISOString(),
          scheduled_end: scheduledEnd.toISOString(),
          department: formData.department || null,
          location: formData.location || null,
          room: formData.room || null,
          reason: formData.reason || null,
          priority: formData.priority,
          status: 'scheduled',
        });

      if (error) throw error;
      toast.success('Appointment scheduled successfully');
      setDialogOpen(false);
      fetchAppointments();
      setFormData({
        patient_id: '',
        appointment_type: 'new',
        scheduled_date: format(new Date(), 'yyyy-MM-dd'),
        scheduled_time: '09:00',
        duration: '30',
        department: '',
        location: '',
        room: '',
        reason: '',
        priority: 'normal',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule appointment');
    } finally {
      setSaving(false);
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Appointment ${status}`);
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update appointment');
    }
  };

  const getWeekDays = () => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  };

  const getDayAppointments = (date: Date) => {
    return appointments.filter(apt => 
      isSameDay(parseISO(apt.scheduled_start), date)
    );
  };

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-500/10 text-blue-700 border-blue-300',
    confirmed: 'bg-green-500/10 text-green-700 border-green-300',
    'checked-in': 'bg-purple-500/10 text-purple-700 border-purple-300',
    'in-progress': 'bg-orange-500/10 text-orange-700 border-orange-300',
    completed: 'bg-gray-500/10 text-gray-700 border-gray-300',
    cancelled: 'bg-red-500/10 text-red-700 border-red-300',
    'no-show': 'bg-red-500/10 text-red-700 border-red-300',
  };

  const typeIcons: Record<string, typeof CalendarDays> = {
    teleconsult: Video,
    consultation: Stethoscope,
    default: CalendarDays,
  };

  const filteredPatients = patients.filter(p => 
    searchTerm === '' ||
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mrn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-primary">Impilo EHR</h1>
                <p className="text-xs text-muted-foreground">Electronic Health Records</p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>Central Hospital</span>
            <span className="mx-2">•</span>
            <span className="text-foreground font-medium">Appointments</span>
          </div>

          <div className="flex items-center gap-4">
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {profile?.display_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "U"}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Appointments</h2>
            <p className="text-muted-foreground">Schedule and manage patient appointments</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Schedule Appointment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Patient</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search patients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {searchTerm && (
                    <ScrollArea className="h-32 border rounded-md mt-1">
                      <div className="p-1">
                        {filteredPatients.map(patient => (
                          <div
                            key={patient.id}
                            className={`p-2 cursor-pointer hover:bg-muted rounded ${
                              formData.patient_id === patient.id ? 'bg-primary/10' : ''
                            }`}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, patient_id: patient.id }));
                              setSearchTerm(`${patient.first_name} ${patient.last_name}`);
                            }}
                          >
                            <p className="text-sm font-medium">{patient.first_name} {patient.last_name}</p>
                            <p className="text-xs text-muted-foreground">{patient.mrn}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={formData.appointment_type} onValueChange={(v) => setFormData(prev => ({ ...prev, appointment_type: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {APPOINTMENT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={formData.priority} onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Select value={formData.scheduled_time} onValueChange={(v) => setFormData(prev => ({ ...prev, scheduled_time: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duration</Label>
                    <Select value={formData.duration} onValueChange={(v) => setFormData(prev => ({ ...prev, duration: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Department</Label>
                    <Select value={formData.department} onValueChange={(v) => setFormData(prev => ({ ...prev, department: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Room</Label>
                    <Input
                      value={formData.room}
                      onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                      placeholder="e.g., Room 101"
                    />
                  </div>
                </div>

                <div>
                  <Label>Reason</Label>
                  <Textarea
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Reason for appointment..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      'Schedule'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous Week
          </Button>
          <span className="font-medium">
            {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </span>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            Next Week
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Week View */}
        <div className="grid grid-cols-7 gap-2">
          {getWeekDays().map((day) => {
            const dayAppointments = getDayAppointments(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <Card key={day.toISOString()} className={isToday ? 'border-primary' : ''}>
                <CardHeader className="pb-2">
                  <div className={`text-center ${isToday ? 'text-primary font-bold' : ''}`}>
                    <p className="text-xs text-muted-foreground">{format(day, 'EEE')}</p>
                    <p className="text-lg">{format(day, 'd')}</p>
                  </div>
                </CardHeader>
                <CardContent className="p-2">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-1">
                      {dayAppointments.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">No appointments</p>
                      ) : (
                        dayAppointments.map((apt) => {
                          const IconComponent = typeIcons[apt.appointment_type] || typeIcons.default;
                          return (
                            <div
                              key={apt.id}
                              className="p-2 border rounded text-xs cursor-pointer hover:bg-muted/50"
                              onClick={() => setSelectedDate(parseISO(apt.scheduled_start))}
                            >
                              <div className="flex items-center gap-1 mb-1">
                                <Clock className="h-3 w-3" />
                                <span className="font-medium">
                                  {format(parseISO(apt.scheduled_start), 'HH:mm')}
                                </span>
                              </div>
                              {apt.patients && (
                                <p className="font-medium truncate">
                                  {apt.patients.first_name} {apt.patients.last_name}
                                </p>
                              )}
                              <div className="flex items-center gap-1 mt-1">
                                <IconComponent className="h-3 w-3" />
                                <span className="truncate">{apt.appointment_type}</span>
                              </div>
                              <Badge className={`${statusColors[apt.status]} mt-1 text-[10px]`}>
                                {apt.status}
                              </Badge>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Today's Schedule Detail */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getDayAppointments(new Date()).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No appointments scheduled for today</p>
              ) : (
                getDayAppointments(new Date()).map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold">{format(parseISO(apt.scheduled_start), 'HH:mm')}</p>
                        <p className="text-xs text-muted-foreground">{format(parseISO(apt.scheduled_end), 'HH:mm')}</p>
                      </div>
                      <div>
                        {apt.patients ? (
                          <p className="font-medium">{apt.patients.first_name} {apt.patients.last_name}</p>
                        ) : (
                          <p className="font-medium text-muted-foreground">Walk-in</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {apt.appointment_type} • {apt.department || 'General'}
                        </p>
                        {apt.reason && (
                          <p className="text-sm text-muted-foreground">{apt.reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[apt.status]}>{apt.status}</Badge>
                      {apt.status === 'scheduled' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => updateAppointmentStatus(apt.id, 'checked-in')}>
                            Check In
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600" onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}>
                            Cancel
                          </Button>
                        </>
                      )}
                      {apt.status === 'checked-in' && (
                        <Button size="sm" onClick={() => updateAppointmentStatus(apt.id, 'in-progress')}>
                          Start
                        </Button>
                      )}
                      {apt.status === 'in-progress' && (
                        <Button size="sm" onClick={() => updateAppointmentStatus(apt.id, 'completed')}>
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Appointments;
