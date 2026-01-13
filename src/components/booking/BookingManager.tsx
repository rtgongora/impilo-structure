import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { generateBookingReference } from "./BookingConfirmation";
import {
  CalendarDays,
  List,
  Plus,
  Clock,
  ChevronLeft,
  ChevronRight,
  Video,
  Search,
  Filter,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Phone,
  MapPin,
} from "lucide-react";
import {
  format,
  addDays,
  startOfWeek,
  isSameDay,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
} from "date-fns";
import { useQueueManagement } from "@/hooks/useQueueManagement";

interface Appointment {
  id: string;
  patient_id: string | null;
  provider_id: string | null;
  queue_id: string | null;
  appointment_type: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  department: string | null;
  location: string | null;
  room: string | null;
  reason: string | null;
  priority: string | null;
  booking_reference: string | null;
  checked_in_at: string | null;
  follow_up_needed: boolean | null;
  patient?: {
    first_name: string;
    last_name: string;
    mrn: string;
    phone_primary?: string;
  } | null;
  queue?: {
    id: string;
    name: string;
    service_type: string;
  } | null;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  mrn: string;
  phone_primary?: string;
}

const APPOINTMENT_TYPES = [
  { value: "new", label: "New Patient" },
  { value: "follow-up", label: "Follow-up" },
  { value: "procedure", label: "Procedure" },
  { value: "consultation", label: "Consultation" },
  { value: "teleconsult", label: "Teleconsult" },
  { value: "lab", label: "Lab Work" },
  { value: "imaging", label: "Imaging" },
  { value: "therapy", label: "Therapy" },
];

const TIME_SLOTS = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00",
];

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle }> = {
  scheduled: { color: "bg-primary/10 text-primary", icon: Clock },
  confirmed: { color: "bg-success/10 text-success", icon: CheckCircle },
  "checked-in": { color: "bg-secondary/10 text-secondary", icon: Users },
  "in-progress": { color: "bg-warning/10 text-warning", icon: AlertCircle },
  completed: { color: "bg-muted text-muted-foreground", icon: CheckCircle },
  cancelled: { color: "bg-critical/10 text-critical", icon: XCircle },
  "no-show": { color: "bg-critical/10 text-critical", icon: XCircle },
};

export function BookingManager() {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [queueFilter, setQueueFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  
  const { queues } = useQueueManagement();

  const [formData, setFormData] = useState({
    patient_id: "",
    queue_id: "",
    appointment_type: "consultation",
    scheduled_date: format(new Date(), "yyyy-MM-dd"),
    scheduled_time: "09:00",
    duration: "30",
    department: "",
    location: "",
    room: "",
    reason: "",
    priority: "normal",
  });

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, [currentMonth, statusFilter, queueFilter, departmentFilter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      let query = supabase
        .from("appointments")
        .select(`
          *,
          patient:patients(first_name, last_name, mrn, phone_primary),
          queue:queue_definitions(id, name, service_type)
        `)
        .gte("scheduled_start", monthStart.toISOString())
        .lte("scheduled_start", monthEnd.toISOString())
        .order("scheduled_start", { ascending: true });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (queueFilter !== "all") {
        query = query.eq("queue_id", queueFilter);
      }
      if (departmentFilter !== "all") {
        query = query.eq("department", departmentFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name, mrn, phone_primary")
        .eq("is_active", true)
        .order("last_name", { ascending: true })
        .limit(200);

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      console.error("Error fetching patients:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const scheduledStart = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);
      const scheduledEnd = new Date(scheduledStart.getTime() + parseInt(formData.duration) * 60000);
      const bookingReference = generateBookingReference();

      const { error } = await supabase.from("appointments").insert({
        patient_id: formData.patient_id || null,
        queue_id: formData.queue_id || null,
        appointment_type: formData.appointment_type,
        scheduled_start: scheduledStart.toISOString(),
        scheduled_end: scheduledEnd.toISOString(),
        department: formData.department || null,
        location: formData.location || null,
        room: formData.room || null,
        reason: formData.reason || null,
        priority: formData.priority,
        booking_reference: bookingReference,
        status: "scheduled",
      });

      if (error) throw error;

      toast.success("Appointment scheduled successfully", {
        description: `Reference: ${bookingReference}`,
      });
      
      setDialogOpen(false);
      fetchAppointments();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to schedule appointment");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: "",
      queue_id: "",
      appointment_type: "consultation",
      scheduled_date: format(new Date(), "yyyy-MM-dd"),
      scheduled_time: "09:00",
      duration: "30",
      department: "",
      location: "",
      room: "",
      reason: "",
      priority: "normal",
    });
    setSearchTerm("");
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Appointment ${status}`);
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.message || "Failed to update appointment");
    }
  };

  const getDayAppointments = (date: Date) => {
    return appointments.filter((apt) =>
      isSameDay(parseISO(apt.scheduled_start), date)
    );
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (!searchTerm) return true;
    const patientName = apt.patient
      ? `${apt.patient.first_name} ${apt.patient.last_name}`.toLowerCase()
      : "";
    const mrn = apt.patient?.mrn?.toLowerCase() || "";
    const reference = apt.booking_reference?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return patientName.includes(search) || mrn.includes(search) || reference.includes(search);
  });

  const filteredPatients = patients.filter(
    (p) =>
      searchTerm === "" ||
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.mrn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const uniqueDepartments = [...new Set(appointments.map((a) => a.department).filter(Boolean))];

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Booking Manager</h2>
          <p className="text-sm text-muted-foreground">
            Schedule and manage patient appointments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as "calendar" | "list")}>
            <TabsList>
              <TabsTrigger value="calendar">
                <CalendarDays className="h-4 w-4 mr-1" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="h-4 w-4 mr-1" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Schedule Appointment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Patient Search */}
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
                        {filteredPatients.map((patient) => (
                          <div
                            key={patient.id}
                            className={`p-2 cursor-pointer hover:bg-muted rounded ${
                              formData.patient_id === patient.id ? "bg-primary/10" : ""
                            }`}
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, patient_id: patient.id }));
                              setSearchTerm(`${patient.first_name} ${patient.last_name}`);
                            }}
                          >
                            <p className="text-sm font-medium">
                              {patient.first_name} {patient.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{patient.mrn}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                {/* Queue Assignment */}
                <div>
                  <Label>Assign to Queue</Label>
                  <Select
                    value={formData.queue_id}
                    onValueChange={(v) => setFormData((prev) => ({ ...prev, queue_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select queue..." />
                    </SelectTrigger>
                    <SelectContent>
                      {queues.map((queue) => (
                        <SelectItem key={queue.id} value={queue.id}>
                          {queue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={formData.appointment_type}
                      onValueChange={(v) =>
                        setFormData((prev) => ({ ...prev, appointment_type: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {APPOINTMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, priority: v }))}
                    >
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

                {/* Date, Time, Duration */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, scheduled_date: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Select
                      value={formData.scheduled_time}
                      onValueChange={(v) =>
                        setFormData((prev) => ({ ...prev, scheduled_time: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duration</Label>
                    <Select
                      value={formData.duration}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, duration: v }))}
                    >
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

                {/* Department and Room */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Department</Label>
                    <Input
                      value={formData.department}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, department: e.target.value }))
                      }
                      placeholder="e.g., Cardiology"
                    />
                  </div>
                  <div>
                    <Label>Room</Label>
                    <Input
                      value={formData.room}
                      onChange={(e) => setFormData((prev) => ({ ...prev, room: e.target.value }))}
                      placeholder="e.g., Room 101"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <Label>Reason</Label>
                  <Textarea
                    value={formData.reason}
                    onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                    placeholder="Reason for appointment..."
                    rows={2}
                  />
                </div>

                <DialogFooter>
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
                      "Schedule"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patient, MRN, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked-in">Checked In</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no-show">No Show</SelectItem>
              </SelectContent>
            </Select>
            <Select value={queueFilter} onValueChange={setQueueFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Queue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Queues</SelectItem>
                {queues.map((queue) => (
                  <SelectItem key={queue.id} value={queue.id}>
                    {queue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {uniqueDepartments.map((dept) => (
                  <SelectItem key={dept} value={dept!}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {view === "calendar" ? (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg">
                {format(currentMonth, "MMMM yyyy")}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-muted">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="bg-background p-2 text-center text-sm font-medium">
                  {day}
                </div>
              ))}
              {/* Empty cells for days before month starts */}
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-background p-2 min-h-[100px]" />
              ))}
              {/* Days of the month */}
              {daysInMonth.map((day) => {
                const dayAppointments = getDayAppointments(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);

                return (
                  <div
                    key={day.toISOString()}
                    className={`bg-background p-2 min-h-[100px] cursor-pointer hover:bg-muted/50 transition-colors ${
                      isToday ? "ring-2 ring-primary ring-inset" : ""
                    } ${isSelected ? "bg-primary/5" : ""}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary" : ""}`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map((apt) => {
                        const config = STATUS_CONFIG[apt.status] || STATUS_CONFIG.scheduled;
                        return (
                          <div
                            key={apt.id}
                            className={`text-xs p-1 rounded truncate ${config.color}`}
                            title={`${apt.patient?.first_name} ${apt.patient?.last_name} - ${format(parseISO(apt.scheduled_start), "HH:mm")}`}
                          >
                            {format(parseISO(apt.scheduled_start), "HH:mm")} {apt.patient?.last_name || "—"}
                          </div>
                        );
                      })}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Queue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No appointments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAppointments.map((apt) => {
                    const config = STATUS_CONFIG[apt.status] || STATUS_CONFIG.scheduled;
                    const StatusIcon = config.icon;
                    return (
                      <TableRow key={apt.id}>
                        <TableCell>
                          <div className="font-medium">
                            {format(parseISO(apt.scheduled_start), "MMM d, yyyy")}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(parseISO(apt.scheduled_start), "HH:mm")}
                          </div>
                        </TableCell>
                        <TableCell>
                          {apt.patient ? (
                            <div>
                              <div className="font-medium">
                                {apt.patient.first_name} {apt.patient.last_name}
                              </div>
                              <div className="text-sm text-muted-foreground">{apt.patient.mrn}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{apt.appointment_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {apt.queue ? (
                            <Badge variant="secondary">{apt.queue.name}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={config.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {apt.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {apt.booking_reference || "—"}
                          </code>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {apt.status === "scheduled" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateAppointmentStatus(apt.id, "confirmed")}
                                >
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-critical"
                                  onClick={() => updateAppointmentStatus(apt.id, "cancelled")}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            {apt.patient?.phone_primary && (
                              <Button size="sm" variant="ghost">
                                <Phone className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
