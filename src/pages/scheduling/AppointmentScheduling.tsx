import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Search,
  User,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  CalendarDays,
  CalendarCheck,
  ListFilter,
} from "lucide-react";
import { format, addDays, startOfWeek, addMinutes, parseISO, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  patient_id: string;
  provider_id: string | null;
  scheduled_start: string;
  scheduled_end: string;
  appointment_type: string;
  status: string;
  priority: string;
  location: string | null;
  room: string | null;
  reason: string | null;
  notes: string | null;
  patient?: { first_name: string; last_name: string; mrn: string } | null;
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500",
  confirmed: "bg-green-500",
  arrived: "bg-yellow-500",
  in_progress: "bg-purple-500",
  completed: "bg-gray-500",
  cancelled: "bg-red-500",
  no_show: "bg-orange-500",
};

const appointmentTypes = [
  "consultation",
  "follow_up",
  "procedure",
  "lab_visit",
  "imaging",
  "vaccination",
  "therapy",
  "checkup",
];

export default function AppointmentScheduling() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [searchTerm, setSearchTerm] = useState("");
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Form state
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: "",
    appointmentType: "consultation",
    date: new Date(),
    time: "09:00",
    duration: "30",
    location: "",
    room: "",
    reason: "",
    notes: "",
  });

  // Fetch appointments for selected date range
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", selectedDate, viewMode],
    queryFn: async () => {
      const startDate = viewMode === "week" ? startOfWeek(selectedDate) : selectedDate;
      const endDate = viewMode === "week" ? addDays(startDate, 7) : addDays(selectedDate, 1);

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          patient:patients(first_name, last_name, mrn)
        `)
        .gte("scheduled_start", startDate.toISOString())
        .lt("scheduled_start", endDate.toISOString())
        .order("scheduled_start");

      if (error) throw error;
      return data as Appointment[];
    },
  });

  // Fetch patients for dropdown
  const { data: patients = [] } = useQuery({
    queryKey: ["patients-search", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("patients")
        .select("id, first_name, last_name, mrn")
        .eq("is_active", true)
        .limit(20);

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,mrn.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Create appointment mutation
  const createAppointment = useMutation({
    mutationFn: async () => {
      const scheduledStart = new Date(appointmentForm.date);
      const [hours, minutes] = appointmentForm.time.split(":");
      scheduledStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const scheduledEnd = addMinutes(scheduledStart, parseInt(appointmentForm.duration));

      const { error } = await supabase.from("appointments").insert({
        patient_id: appointmentForm.patientId,
        scheduled_start: scheduledStart.toISOString(),
        scheduled_end: scheduledEnd.toISOString(),
        appointment_type: appointmentForm.appointmentType,
        status: "scheduled",
        priority: "normal",
        location: appointmentForm.location || null,
        room: appointmentForm.room || null,
        reason: appointmentForm.reason || null,
        notes: appointmentForm.notes || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setNewAppointmentOpen(false);
      resetForm();
      toast({ title: "Appointment scheduled successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update appointment status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setSelectedAppointment(null);
      toast({ title: "Status updated" });
    },
  });

  const resetForm = () => {
    setAppointmentForm({
      patientId: "",
      appointmentType: "consultation",
      date: new Date(),
      time: "09:00",
      duration: "30",
      location: "",
      room: "",
      reason: "",
      notes: "",
    });
  };

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const minute = (i % 2) * 30;
    if (hour > 17) return null;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  }).filter(Boolean) as string[];

  const filteredAppointments = appointments.filter((apt) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      apt.patient?.first_name?.toLowerCase().includes(search) ||
      apt.patient?.last_name?.toLowerCase().includes(search) ||
      apt.patient?.mrn?.toLowerCase().includes(search)
    );
  });

  const getAppointmentsByTime = (time: string) => {
    return filteredAppointments.filter((apt) => {
      const aptTime = format(parseISO(apt.scheduled_start), "HH:mm");
      return aptTime === time;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CalendarCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">Bookings & Appointments</h1>
                  <p className="text-xs text-muted-foreground">Scheduling, theatre & resource management</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => setNewAppointmentOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sub-navigation bar */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-14 overflow-x-auto">
            <Button variant="default" size="lg" className="rounded-xl shrink-0 h-11 px-6 text-base">
              <CalendarDays className="h-5 w-5 mr-2" /> Appointments
            </Button>
            <Button variant="ghost" size="lg" className="rounded-xl shrink-0 h-11 px-6 text-base" onClick={() => navigate("/theatre")}>
              <MapPin className="h-5 w-5 mr-2" /> Theatre Booking
            </Button>
            <Button variant="ghost" size="lg" className="rounded-xl shrink-0 h-11 px-6 text-base" onClick={() => navigate("/scheduling/resources")}>
              <ListFilter className="h-5 w-5 mr-2" /> Resource Calendar
            </Button>
            <Button variant="ghost" size="lg" className="rounded-xl shrink-0 h-11 px-6 text-base" onClick={() => navigate("/scheduling/noticeboard")}>
              <AlertCircle className="h-5 w-5 mr-2" /> Noticeboard
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-start">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <div className="flex rounded-lg border overflow-hidden">
              <Button
                variant={viewMode === "day" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode("day")}
              >
                Day
              </Button>
              <Button
                variant={viewMode === "week" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode("week")}
              >
                Week
              </Button>
            </div>
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            >
              Next
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <CalendarDays className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{appointments.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {appointments.filter((a) => a.status === "confirmed").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Confirmed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {appointments.filter((a) => a.status === "arrived").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Waiting</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-500/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {appointments.filter((a) => a.status === "completed").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {isToday(selectedDate) ? "Today" : isTomorrow(selectedDate) ? "Tomorrow" : format(selectedDate, "EEEE, MMMM d")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-1">
                  {timeSlots.map((time) => {
                    const slotAppointments = getAppointmentsByTime(time);
                    return (
                      <div key={time} className="flex gap-4 py-2 border-b border-muted">
                        <div className="w-16 text-sm text-muted-foreground font-medium shrink-0">
                          {time}
                        </div>
                        <div className="flex-1 min-h-[40px]">
                          {slotAppointments.length === 0 ? (
                            <div className="h-10 border-2 border-dashed border-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                              onClick={() => {
                                setAppointmentForm((prev) => ({ ...prev, time }));
                                setNewAppointmentOpen(true);
                              }}
                            >
                              + Add appointment
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {slotAppointments.map((apt) => (
                                <Card
                                  key={apt.id}
                                  className={cn(
                                    "cursor-pointer hover:shadow-md transition-all flex-1 min-w-[200px]",
                                    apt.status === "cancelled" && "opacity-50"
                                  )}
                                  onClick={() => setSelectedAppointment(apt)}
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <p className="font-medium text-sm">
                                          {apt.patient?.first_name} {apt.patient?.last_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {apt.patient?.mrn}
                                        </p>
                                      </div>
                                      <Badge className={cn("text-white text-xs", statusColors[apt.status])}>
                                        {apt.status}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                      <Badge variant="outline" className="capitalize">
                                        {apt.appointment_type.replace("_", " ")}
                                      </Badge>
                                      {apt.room && (
                                        <span className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          {apt.room}
                                        </span>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </main>

      {/* New Appointment Dialog */}
      <Dialog open={newAppointmentOpen} onOpenChange={setNewAppointmentOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule New Appointment</DialogTitle>
            <DialogDescription>Book a new appointment for a patient</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Patient *</Label>
              <Select
                value={appointmentForm.patientId}
                onValueChange={(value) => setAppointmentForm((prev) => ({ ...prev, patientId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name} ({patient.mrn})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(appointmentForm.date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={appointmentForm.date}
                      onSelect={(date) => date && setAppointmentForm((prev) => ({ ...prev, date }))}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Time *</Label>
                <Select
                  value={appointmentForm.time}
                  onValueChange={(value) => setAppointmentForm((prev) => ({ ...prev, time: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={appointmentForm.appointmentType}
                  onValueChange={(value) => setAppointmentForm((prev) => ({ ...prev, appointmentType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map((type) => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {type.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <Select
                  value={appointmentForm.duration}
                  onValueChange={(value) => setAppointmentForm((prev) => ({ ...prev, duration: value }))}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={appointmentForm.location}
                  onChange={(e) => setAppointmentForm((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Clinic A"
                />
              </div>
              <div className="space-y-2">
                <Label>Room</Label>
                <Input
                  value={appointmentForm.room}
                  onChange={(e) => setAppointmentForm((prev) => ({ ...prev, room: e.target.value }))}
                  placeholder="Room 101"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={appointmentForm.reason}
                onChange={(e) => setAppointmentForm((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Reason for visit"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={appointmentForm.notes}
                onChange={(e) => setAppointmentForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewAppointmentOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createAppointment.mutate()}
              disabled={!appointmentForm.patientId || createAppointment.isPending}
            >
              {createAppointment.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                "Schedule Appointment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Details Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">
                    {selectedAppointment.patient?.first_name} {selectedAppointment.patient?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    MRN: {selectedAppointment.patient?.mrn}
                  </p>
                </div>
                <Badge className={cn("ml-auto text-white", statusColors[selectedAppointment.status])}>
                  {selectedAppointment.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date & Time</p>
                  <p className="font-medium">
                    {format(parseISO(selectedAppointment.scheduled_start), "PPP")}
                  </p>
                  <p className="font-medium">
                    {format(parseISO(selectedAppointment.scheduled_start), "h:mm a")} -{" "}
                    {format(parseISO(selectedAppointment.scheduled_end), "h:mm a")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">
                    {selectedAppointment.appointment_type.replace("_", " ")}
                  </p>
                </div>
                {selectedAppointment.location && (
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium">{selectedAppointment.location}</p>
                  </div>
                )}
                {selectedAppointment.room && (
                  <div>
                    <p className="text-muted-foreground">Room</p>
                    <p className="font-medium">{selectedAppointment.room}</p>
                  </div>
                )}
              </div>

              {selectedAppointment.reason && (
                <div>
                  <p className="text-muted-foreground text-sm">Reason</p>
                  <p>{selectedAppointment.reason}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {selectedAppointment.status === "scheduled" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => updateStatus.mutate({ id: selectedAppointment.id, status: "confirmed" })}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Confirm
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => updateStatus.mutate({ id: selectedAppointment.id, status: "cancelled" })}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </>
                )}
                {selectedAppointment.status === "confirmed" && (
                  <Button
                    size="sm"
                    onClick={() => updateStatus.mutate({ id: selectedAppointment.id, status: "arrived" })}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Check In
                  </Button>
                )}
                {selectedAppointment.status === "arrived" && (
                  <Button
                    size="sm"
                    onClick={() => updateStatus.mutate({ id: selectedAppointment.id, status: "in_progress" })}
                  >
                    Start Visit
                  </Button>
                )}
                {selectedAppointment.status === "in_progress" && (
                  <Button
                    size="sm"
                    onClick={() => updateStatus.mutate({ id: selectedAppointment.id, status: "completed" })}
                  >
                    Complete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
