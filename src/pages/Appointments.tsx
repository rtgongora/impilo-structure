import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { BookingConfirmation, generateBookingReference } from "@/components/booking/BookingConfirmation";
import { AdvancePayment } from "@/components/booking/AdvancePayment";
import { 
  CalendarDays, 
  Plus, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Video,
  Stethoscope,
  Loader2,
  Search,
  QrCode,
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [lastBooking, setLastBooking] = useState<any>(null);

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
        .select(`*, patients (first_name, last_name, mrn)`)
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
      const referenceNumber = generateBookingReference();

      const { data, error } = await supabase
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
        })
        .select()
        .single();

      if (error) throw error;
      
      // Get patient name
      const selectedPatient = patients.find(p => p.id === formData.patient_id);
      
      // Set booking data for confirmation
      setLastBooking({
        id: data.id,
        referenceNumber,
        patientName: selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : 'Guest',
        patientMrn: selectedPatient?.mrn || '',
        appointmentType: formData.appointment_type,
        department: formData.department || 'General',
        scheduledDate: scheduledStart,
        scheduledTime: formData.scheduled_time,
        room: formData.room,
        estimatedFee: 50, // Mock fee
        isPaid: false,
        qrData: JSON.stringify({ ref: referenceNumber, id: data.id }),
      });
      
      setDialogOpen(false);
      setShowConfirmation(true);
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
      setSearchTerm('');
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
    scheduled: 'bg-primary/10 text-primary border-primary/30',
    confirmed: 'bg-success/10 text-success border-success/30',
    'checked-in': 'bg-secondary/10 text-secondary border-secondary/30',
    'in-progress': 'bg-warning/10 text-warning border-warning/30',
    completed: 'bg-muted text-muted-foreground',
    cancelled: 'bg-critical/10 text-critical border-critical/30',
    'no-show': 'bg-critical/10 text-critical border-critical/30',
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
    <AppLayout title="Appointments">
      <div className="p-6">
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
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <Input type="date" value={formData.scheduled_date} onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Select value={formData.scheduled_time} onValueChange={(v) => setFormData(prev => ({ ...prev, scheduled_time: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Room</Label>
                    <Input value={formData.room} onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))} placeholder="e.g., Room 101" />
                  </div>
                </div>

                <div>
                  <Label>Reason</Label>
                  <Textarea value={formData.reason} onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))} placeholder="Reason for appointment..." rows={2} />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Scheduling...</> : 'Schedule'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous Week
          </Button>
          <h3 className="font-medium">
            {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </h3>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            Next Week <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-4">
          {getWeekDays().map((date) => {
            const dayAppointments = getDayAppointments(date);
            const isToday = isSameDay(date, new Date());
            
            return (
              <Card key={date.toISOString()} className={`${isToday ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className={`text-sm ${isToday ? 'text-primary' : ''}`}>
                    {format(date, 'EEE d')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {dayAppointments.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">No appointments</p>
                      ) : (
                        dayAppointments.map((apt) => {
                          const TypeIcon = typeIcons[apt.appointment_type] || typeIcons.default;
                          return (
                            <div
                              key={apt.id}
                              className={`p-2 rounded-lg border text-xs ${statusColors[apt.status] || ''}`}
                            >
                              <div className="flex items-center gap-1 mb-1">
                                <Clock className="h-3 w-3" />
                                <span className="font-medium">{format(parseISO(apt.scheduled_start), 'HH:mm')}</span>
                              </div>
                              {apt.patients && (
                                <p className="font-medium truncate">
                                  {apt.patients.first_name} {apt.patients.last_name}
                                </p>
                              )}
                              <div className="flex items-center gap-1 mt-1">
                                <TypeIcon className="h-3 w-3" />
                                <span className="capitalize">{apt.appointment_type}</span>
                              </div>
                              <Badge variant="outline" className="mt-1 text-[10px]">
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

        {/* Today's Sidebar */}
        <div className="mt-6 grid lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Quick View</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">
                Appointments for {format(selectedDate, 'MMMM d, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                {appointments.filter(apt => isSameDay(parseISO(apt.scheduled_start), selectedDate)).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No appointments for this date</p>
                ) : (
                  <div className="space-y-2">
                    {appointments.filter(apt => isSameDay(parseISO(apt.scheduled_start), selectedDate)).map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <p className="text-sm font-medium">{format(parseISO(apt.scheduled_start), 'HH:mm')}</p>
                            <p className="text-xs text-muted-foreground">{format(parseISO(apt.scheduled_end), 'HH:mm')}</p>
                          </div>
                          <div>
                            <p className="font-medium">
                              {apt.patients ? `${apt.patients.first_name} ${apt.patients.last_name}` : 'Walk-in'}
                            </p>
                            <p className="text-sm text-muted-foreground capitalize">{apt.appointment_type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[apt.status]}>{apt.status}</Badge>
                          {apt.status === 'scheduled' && (
                            <Button size="sm" variant="outline" onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}>
                              Confirm
                            </Button>
                          )}
                          {apt.status === 'confirmed' && (
                            <Button size="sm" onClick={() => updateAppointmentStatus(apt.id, 'checked-in')}>
                              Check In
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Booking Confirmation Dialog */}
        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogContent className="max-w-lg">
            {lastBooking && (
              <BookingConfirmation
                booking={lastBooking}
                onPayNow={() => {
                  setShowConfirmation(false);
                  setShowPayment(true);
                }}
                onClose={() => setShowConfirmation(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Advance Payment Dialog */}
        <Dialog open={showPayment} onOpenChange={setShowPayment}>
          <DialogContent className="max-w-md">
            {lastBooking && (
              <AdvancePayment
                bookingReference={lastBooking.referenceNumber}
                patientName={lastBooking.patientName}
                appointmentDate={format(lastBooking.scheduledDate, 'PPP')}
                items={[{ description: 'Consultation Fee', amount: 50, type: 'consultation' }]}
                onPaymentComplete={() => {
                  setShowPayment(false);
                  toast.success('Payment completed! Your booking is confirmed.');
                }}
                onCancel={() => setShowPayment(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Appointments;
