import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Plus,
  Search,
  Scissors,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Building,
  Stethoscope,
} from "lucide-react";
import { format, addDays, parseISO, differenceInMinutes } from "date-fns";
import { cn } from "@/lib/utils";

interface OperatingRoom {
  id: string;
  name: string;
  room_number: string;
  location: string | null;
  room_type: string;
  is_active: boolean;
}

interface TheatreBooking {
  id: string;
  booking_number: string;
  operating_room_id: string;
  patient_id: string | null;
  procedure_name: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  priority: string;
  pre_op_completed: boolean;
  consent_signed: boolean;
  surgeon_id: string | null;
  notes: string | null;
  patient?: { first_name: string; last_name: string; mrn: string } | null;
  operating_room?: { name: string; room_number: string } | null;
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500",
  confirmed: "bg-green-500",
  in_progress: "bg-purple-500",
  completed: "bg-gray-500",
  cancelled: "bg-red-500",
  postponed: "bg-yellow-500",
};

const priorityColors: Record<string, string> = {
  emergency: "bg-red-600",
  urgent: "bg-orange-500",
  elective: "bg-blue-500",
};

export default function TheatreScheduling() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<TheatreBooking | null>(null);

  // Form state
  const [bookingForm, setBookingForm] = useState({
    patientId: "",
    operatingRoomId: "",
    procedureName: "",
    priority: "elective",
    date: new Date(),
    startTime: "08:00",
    duration: "120",
    notes: "",
  });

  // Fetch operating rooms
  const { data: operatingRooms = [] } = useQuery({
    queryKey: ["operating-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operating_rooms")
        .select("*")
        .eq("is_active", true)
        .order("room_number");
      if (error) throw error;
      return data as OperatingRoom[];
    },
  });

  // Fetch theatre bookings
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["theatre-bookings", selectedDate],
    queryFn: async () => {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = addDays(startOfDay, 1);

      const { data, error } = await supabase
        .from("theatre_bookings")
        .select(`
          *,
          patient:patients(first_name, last_name, mrn)
        `)
        .gte("scheduled_start", startOfDay.toISOString())
        .lt("scheduled_start", endOfDay.toISOString())
        .order("scheduled_start");
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Fetch patients
  const { data: patients = [] } = useQuery({
    queryKey: ["patients-for-theatre"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name, mrn")
        .eq("is_active", true)
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Create booking mutation
  const createBooking = useMutation({
    mutationFn: async () => {
      const scheduledStart = new Date(bookingForm.date);
      const [hours, minutes] = bookingForm.startTime.split(":");
      scheduledStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const scheduledEnd = new Date(scheduledStart.getTime() + parseInt(bookingForm.duration) * 60000);

      const bookingNumber = `OR-${format(new Date(), "yyyyMMdd")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const insertData = {
        booking_number: bookingNumber,
        operating_room_id: bookingForm.operatingRoomId,
        patient_id: bookingForm.patientId || null,
        procedure_name: bookingForm.procedureName,
        scheduled_start: scheduledStart.toISOString(),
        scheduled_end: scheduledEnd.toISOString(),
        priority: bookingForm.priority,
        status: "scheduled",
        notes: bookingForm.notes || null,
      };

      const { error } = await supabase.from("theatre_bookings").insert(insertData as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theatre-bookings"] });
      setNewBookingOpen(false);
      resetForm();
      toast({ title: "Theatre booking created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === "in_progress") {
        updates.actual_start = new Date().toISOString();
      } else if (status === "completed") {
        updates.actual_end = new Date().toISOString();
      }

      const { error } = await supabase
        .from("theatre_bookings")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theatre-bookings"] });
      setSelectedBooking(null);
      toast({ title: "Status updated" });
    },
  });

  const resetForm = () => {
    setBookingForm({
      patientId: "",
      operatingRoomId: "",
      procedureName: "",
      priority: "elective",
      date: new Date(),
      startTime: "08:00",
      duration: "120",
      notes: "",
    });
  };

  const getBookingsByRoom = (roomId: string) => {
    return bookings.filter((b) => b.operating_room_id === roomId);
  };

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 7;
    return `${hour.toString().padStart(2, "0")}:00`;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Scissors className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">Theatre Scheduling</h1>
                  <p className="text-xs text-muted-foreground">Operating room bookings</p>
                </div>
              </div>
            </div>

            <Button onClick={() => setNewBookingOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search procedures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Scissors className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                  <p className="text-xs text-muted-foreground">Total Surgeries</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {bookings.filter((b) => b.priority === "emergency").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Emergency</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {bookings.filter((b) => b.status === "in_progress").length}
                  </p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
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
                    {bookings.filter((b) => b.status === "completed").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Operating Rooms Grid */}
        <div className="space-y-6">
          {operatingRooms.length === 0 ? (
            <Card className="p-12 text-center">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Operating Rooms</h3>
              <p className="text-muted-foreground">Configure operating rooms to start scheduling</p>
            </Card>
          ) : (
            operatingRooms.map((room) => {
              const roomBookings = getBookingsByRoom(room.id);
              return (
                <Card key={room.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building className="h-4 w-4" />
                      {room.name} ({room.room_number})
                      <Badge variant="outline" className="capitalize ml-2">
                        {room.room_type}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="w-full">
                      <div className="flex gap-2 pb-2" style={{ minWidth: "800px" }}>
                        {timeSlots.map((time) => {
                          const slotBooking = roomBookings.find((b) => {
                            const start = format(parseISO(b.scheduled_start), "HH:00");
                            return start === time;
                          });

                          if (slotBooking) {
                            const duration = differenceInMinutes(
                              parseISO(slotBooking.scheduled_end),
                              parseISO(slotBooking.scheduled_start)
                            );
                            const widthMultiplier = Math.ceil(duration / 60);

                            return (
                              <Card
                                key={slotBooking.id}
                                className={cn(
                                  "shrink-0 cursor-pointer hover:shadow-md transition-all",
                                  slotBooking.status === "cancelled" && "opacity-50"
                                )}
                                style={{ width: `${widthMultiplier * 80 - 8}px` }}
                                onClick={() => setSelectedBooking(slotBooking)}
                              >
                                <CardContent className="p-2">
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <Badge className={cn("text-xs text-white", priorityColors[slotBooking.priority])}>
                                      {slotBooking.priority}
                                    </Badge>
                                    <Badge className={cn("text-xs text-white", statusColors[slotBooking.status])}>
                                      {slotBooking.status}
                                    </Badge>
                                  </div>
                                  <p className="text-xs font-medium truncate">{slotBooking.procedure_name}</p>
                                  {slotBooking.patient && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {slotBooking.patient.first_name} {slotBooking.patient.last_name}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    {format(parseISO(slotBooking.scheduled_start), "HH:mm")} -{" "}
                                    {format(parseISO(slotBooking.scheduled_end), "HH:mm")}
                                  </p>
                                </CardContent>
                              </Card>
                            );
                          }

                          return (
                            <div
                              key={time}
                              className="w-[72px] h-16 shrink-0 border-2 border-dashed border-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                              onClick={() => {
                                setBookingForm((prev) => ({
                                  ...prev,
                                  operatingRoomId: room.id,
                                  startTime: time,
                                }));
                                setNewBookingOpen(true);
                              }}
                            >
                              {time}
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>

      {/* New Booking Dialog */}
      <Dialog open={newBookingOpen} onOpenChange={setNewBookingOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Theatre Booking</DialogTitle>
            <DialogDescription>Book an operating room for a procedure</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Operating Room *</Label>
              <Select
                value={bookingForm.operatingRoomId}
                onValueChange={(value) => setBookingForm((prev) => ({ ...prev, operatingRoomId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select room..." />
                </SelectTrigger>
                <SelectContent>
                  {operatingRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} ({room.room_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Patient</Label>
              <Select
                value={bookingForm.patientId}
                onValueChange={(value) => setBookingForm((prev) => ({ ...prev, patientId: value }))}
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

            <div className="space-y-2">
              <Label>Procedure Name *</Label>
              <Input
                value={bookingForm.procedureName}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, procedureName: e.target.value }))}
                placeholder="e.g., Appendectomy"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority *</Label>
                <Select
                  value={bookingForm.priority}
                  onValueChange={(value) => setBookingForm((prev) => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elective">Elective</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <Select
                  value={bookingForm.duration}
                  onValueChange={(value) => setBookingForm((prev) => ({ ...prev, duration: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                    <SelectItem value="360">6 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(bookingForm.date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={bookingForm.date}
                      onSelect={(date) => date && setBookingForm((prev) => ({ ...prev, date }))}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Select
                  value={bookingForm.startTime}
                  onValueChange={(value) => setBookingForm((prev) => ({ ...prev, startTime: value }))}
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

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={bookingForm.notes}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Special requirements, equipment needed..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewBookingOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createBooking.mutate()}
              disabled={!bookingForm.operatingRoomId || !bookingForm.procedureName || createBooking.isPending}
            >
              {createBooking.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Theatre Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge className={cn("text-white", priorityColors[selectedBooking.priority])}>
                  {selectedBooking.priority}
                </Badge>
                <Badge className={cn("text-white", statusColors[selectedBooking.status])}>
                  {selectedBooking.status}
                </Badge>
                <span className="text-sm text-muted-foreground ml-auto">
                  {selectedBooking.booking_number}
                </span>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Procedure</p>
                <p className="text-lg font-semibold">{selectedBooking.procedure_name}</p>
              </div>

              {selectedBooking.patient && (
                <div>
                  <p className="text-sm text-muted-foreground">Patient</p>
                  <p className="font-medium">
                    {selectedBooking.patient.first_name} {selectedBooking.patient.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">MRN: {selectedBooking.patient.mrn}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">
                    {format(parseISO(selectedBooking.scheduled_start), "PPP")}
                  </p>
                  <p className="text-sm">
                    {format(parseISO(selectedBooking.scheduled_start), "HH:mm")} -{" "}
                    {format(parseISO(selectedBooking.scheduled_end), "HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Checklist</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      {selectedBooking.pre_op_completed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      Pre-op Complete
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {selectedBooking.consent_signed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      Consent Signed
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {selectedBooking.status === "scheduled" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => updateStatus.mutate({ id: selectedBooking.id, status: "confirmed" })}
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => updateStatus.mutate({ id: selectedBooking.id, status: "cancelled" })}
                    >
                      Cancel
                    </Button>
                  </>
                )}
                {selectedBooking.status === "confirmed" && (
                  <Button
                    size="sm"
                    onClick={() => updateStatus.mutate({ id: selectedBooking.id, status: "in_progress" })}
                  >
                    Start Surgery
                  </Button>
                )}
                {selectedBooking.status === "in_progress" && (
                  <Button
                    size="sm"
                    onClick={() => updateStatus.mutate({ id: selectedBooking.id, status: "completed" })}
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
