import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Users,
  DoorOpen,
  Phone,
  Briefcase,
  Sun,
  Moon,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isToday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface StaffShift {
  id: string;
  staff_id: string;
  staff_name: string;
  department: string | null;
  shift_date: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  location: string | null;
  role: string | null;
  status: string;
}

interface RoomBooking {
  id: string;
  room_name: string;
  purpose: string;
  booked_by_name: string | null;
  start_time: string;
  end_time: string;
  status: string;
}

interface LeaveRequest {
  id: string;
  staff_id: string;
  staff_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
}

interface OnCallSchedule {
  id: string;
  staff_name: string;
  department: string;
  specialty: string | null;
  schedule_date: string;
  contact_number: string | null;
}

const shiftTypeColors: Record<string, string> = {
  day: "bg-yellow-500",
  night: "bg-indigo-600",
  morning: "bg-orange-500",
  afternoon: "bg-blue-500",
  on_call: "bg-purple-500",
};

const leaveStatusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
  cancelled: "bg-gray-500",
};

export default function ResourceCalendar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("shifts");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newShiftOpen, setNewShiftOpen] = useState(false);
  const [newRoomBookingOpen, setNewRoomBookingOpen] = useState(false);
  const [newLeaveOpen, setNewLeaveOpen] = useState(false);

  // Shift form
  const [shiftForm, setShiftForm] = useState({
    staffName: "",
    department: "",
    shiftType: "day",
    date: new Date(),
    startTime: "08:00",
    endTime: "16:00",
    location: "",
    role: "",
  });

  // Room booking form
  const [roomForm, setRoomForm] = useState({
    roomName: "",
    purpose: "",
    date: new Date(),
    startTime: "09:00",
    endTime: "10:00",
  });

  // Leave form
  const [leaveForm, setLeaveForm] = useState({
    staffName: "",
    leaveType: "annual",
    startDate: new Date(),
    endDate: new Date(),
    reason: "",
  });

  const weekStart = startOfWeek(selectedDate);
  const weekEnd = endOfWeek(selectedDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Fetch shifts
  const { data: shifts = [], isLoading: loadingShifts } = useQuery({
    queryKey: ["staff-shifts", selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_shifts")
        .select("*")
        .gte("shift_date", weekStart.toISOString().split("T")[0])
        .lte("shift_date", weekEnd.toISOString().split("T")[0])
        .order("shift_date")
        .order("start_time");
      if (error) throw error;
      return data as StaffShift[];
    },
  });

  // Fetch room bookings
  const { data: roomBookings = [] } = useQuery({
    queryKey: ["room-bookings", selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_bookings")
        .select("*")
        .gte("start_time", weekStart.toISOString())
        .lte("start_time", weekEnd.toISOString())
        .order("start_time");
      if (error) throw error;
      return data as RoomBooking[];
    },
  });

  // Fetch leave requests
  const { data: leaveRequests = [] } = useQuery({
    queryKey: ["leave-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_requests")
        .select("*")
        .order("start_date", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as LeaveRequest[];
    },
  });

  // Fetch on-call schedules
  const { data: onCallSchedules = [] } = useQuery({
    queryKey: ["on-call-schedules", selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("on_call_schedules")
        .select("*")
        .gte("schedule_date", weekStart.toISOString().split("T")[0])
        .lte("schedule_date", weekEnd.toISOString().split("T")[0])
        .order("schedule_date");
      if (error) throw error;
      return data as OnCallSchedule[];
    },
  });

  // Create shift
  const createShift = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("staff_shifts").insert({
        staff_id: user?.id || crypto.randomUUID(),
        staff_name: shiftForm.staffName,
        department: shiftForm.department || null,
        shift_date: format(shiftForm.date, "yyyy-MM-dd"),
        shift_type: shiftForm.shiftType,
        start_time: shiftForm.startTime,
        end_time: shiftForm.endTime,
        location: shiftForm.location || null,
        role: shiftForm.role || null,
        status: "scheduled",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-shifts"] });
      setNewShiftOpen(false);
      toast({ title: "Shift created" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Create room booking
  const createRoomBooking = useMutation({
    mutationFn: async () => {
      const startDateTime = new Date(roomForm.date);
      const [startH, startM] = roomForm.startTime.split(":");
      startDateTime.setHours(parseInt(startH), parseInt(startM));

      const endDateTime = new Date(roomForm.date);
      const [endH, endM] = roomForm.endTime.split(":");
      endDateTime.setHours(parseInt(endH), parseInt(endM));

      const { error } = await supabase.from("room_bookings").insert({
        room_name: roomForm.roomName,
        purpose: roomForm.purpose,
        booked_by: user?.id,
        booked_by_name: user?.email?.split("@")[0] || "Unknown",
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: "confirmed",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-bookings"] });
      setNewRoomBookingOpen(false);
      toast({ title: "Room booked" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Create leave request
  const createLeave = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("leave_requests").insert({
        staff_id: user?.id || crypto.randomUUID(),
        staff_name: leaveForm.staffName,
        leave_type: leaveForm.leaveType,
        start_date: format(leaveForm.startDate, "yyyy-MM-dd"),
        end_date: format(leaveForm.endDate, "yyyy-MM-dd"),
        reason: leaveForm.reason || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      setNewLeaveOpen(false);
      toast({ title: "Leave request submitted" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getShiftsForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return shifts.filter((s) => s.shift_date === dateStr);
  };

  const getOnCallForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return onCallSchedules.filter((s) => s.schedule_date === dateStr);
  };

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
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">Resource Calendar</h1>
                  <p className="text-xs text-muted-foreground">Shifts, rooms, & leave management</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Week of {format(weekStart, "MMM d")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="shifts">
                <Users className="h-4 w-4 mr-1" />
                Staff Shifts
              </TabsTrigger>
              <TabsTrigger value="rooms">
                <DoorOpen className="h-4 w-4 mr-1" />
                Room Bookings
              </TabsTrigger>
              <TabsTrigger value="leave">
                <Briefcase className="h-4 w-4 mr-1" />
                Leave Requests
              </TabsTrigger>
              <TabsTrigger value="oncall">
                <Phone className="h-4 w-4 mr-1" />
                On-Call
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              {activeTab === "shifts" && (
                <Button size="sm" onClick={() => setNewShiftOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Shift
                </Button>
              )}
              {activeTab === "rooms" && (
                <Button size="sm" onClick={() => setNewRoomBookingOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Book Room
                </Button>
              )}
              {activeTab === "leave" && (
                <Button size="sm" onClick={() => setNewLeaveOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Request Leave
                </Button>
              )}
            </div>
          </div>

          {/* Staff Shifts Tab */}
          <TabsContent value="shifts">
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const dayShifts = getShiftsForDay(day);
                return (
                  <Card key={day.toISOString()} className={cn(isToday(day) && "border-primary")}>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>{format(day, "EEE")}</span>
                        <span className={cn("text-lg", isToday(day) && "text-primary font-bold")}>
                          {format(day, "d")}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                      <ScrollArea className="h-[200px]">
                        {dayShifts.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">No shifts</p>
                        ) : (
                          <div className="space-y-1">
                            {dayShifts.map((shift) => (
                              <div
                                key={shift.id}
                                className="p-2 rounded-lg bg-muted/50 text-xs"
                              >
                                <div className="flex items-center gap-1 mb-1">
                                  <Badge className={cn("text-white text-xs", shiftTypeColors[shift.shift_type])}>
                                    {shift.shift_type === "day" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
                                  </Badge>
                                  <span className="font-medium truncate">{shift.staff_name}</span>
                                </div>
                                <p className="text-muted-foreground">
                                  {shift.start_time} - {shift.end_time}
                                </p>
                                {shift.department && (
                                  <p className="text-muted-foreground truncate">{shift.department}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Room Bookings Tab */}
          <TabsContent value="rooms">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roomBookings.length === 0 ? (
                <Card className="col-span-full p-12 text-center">
                  <DoorOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No room bookings</h3>
                  <p className="text-muted-foreground">Book a room for meetings or procedures</p>
                </Card>
              ) : (
                roomBookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{booking.room_name}</h3>
                        <Badge variant="secondary">{booking.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{booking.purpose}</p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(parseISO(booking.start_time), "PPP")}
                        </p>
                        <p className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(booking.start_time), "HH:mm")} - {format(parseISO(booking.end_time), "HH:mm")}
                        </p>
                        {booking.booked_by_name && <p>Booked by: {booking.booked_by_name}</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Leave Requests Tab */}
          <TabsContent value="leave">
            <div className="space-y-4">
              {leaveRequests.length === 0 ? (
                <Card className="p-12 text-center">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No leave requests</h3>
                  <p className="text-muted-foreground">Submit a leave request to get started</p>
                </Card>
              ) : (
                leaveRequests.map((leave) => (
                  <Card key={leave.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{leave.staff_name}</h3>
                            <Badge className={cn("text-white", leaveStatusColors[leave.status])}>
                              {leave.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground capitalize">
                            {leave.leave_type} Leave
                          </p>
                          <p className="text-sm">
                            {format(parseISO(leave.start_date), "MMM d, yyyy")} -{" "}
                            {format(parseISO(leave.end_date), "MMM d, yyyy")}
                          </p>
                          {leave.reason && (
                            <p className="text-sm text-muted-foreground mt-1">{leave.reason}</p>
                          )}
                        </div>
                        {leave.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline">
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* On-Call Tab */}
          <TabsContent value="oncall">
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const dayOnCall = getOnCallForDay(day);
                return (
                  <Card key={day.toISOString()} className={cn(isToday(day) && "border-primary")}>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>{format(day, "EEE")}</span>
                        <span className={cn("text-lg", isToday(day) && "text-primary font-bold")}>
                          {format(day, "d")}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                      {dayOnCall.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">No on-call</p>
                      ) : (
                        <div className="space-y-2">
                          {dayOnCall.map((oc) => (
                            <div key={oc.id} className="p-2 rounded-lg bg-purple-500/10 text-xs">
                              <p className="font-medium">{oc.staff_name}</p>
                              <p className="text-muted-foreground">{oc.department}</p>
                              {oc.specialty && <p className="text-muted-foreground">{oc.specialty}</p>}
                              {oc.contact_number && (
                                <p className="flex items-center gap-1 mt-1">
                                  <Phone className="h-3 w-3" />
                                  {oc.contact_number}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* New Shift Dialog */}
      <Dialog open={newShiftOpen} onOpenChange={setNewShiftOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Staff Name *</Label>
                <Input
                  value={shiftForm.staffName}
                  onChange={(e) => setShiftForm((p) => ({ ...p, staffName: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  value={shiftForm.department}
                  onChange={(e) => setShiftForm((p) => ({ ...p, department: e.target.value }))}
                  placeholder="Emergency"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Shift Type</Label>
                <Select
                  value={shiftForm.shiftType}
                  onValueChange={(v) => setShiftForm((p) => ({ ...p, shiftType: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(shiftForm.date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={shiftForm.date}
                      onSelect={(d) => d && setShiftForm((p) => ({ ...p, date: d }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={shiftForm.startTime}
                  onChange={(e) => setShiftForm((p) => ({ ...p, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={shiftForm.endTime}
                  onChange={(e) => setShiftForm((p) => ({ ...p, endTime: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewShiftOpen(false)}>Cancel</Button>
            <Button onClick={() => createShift.mutate()} disabled={!shiftForm.staffName || createShift.isPending}>
              {createShift.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Room Booking Dialog */}
      <Dialog open={newRoomBookingOpen} onOpenChange={setNewRoomBookingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book a Room</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Room Name *</Label>
              <Input
                value={roomForm.roomName}
                onChange={(e) => setRoomForm((p) => ({ ...p, roomName: e.target.value }))}
                placeholder="Conference Room A"
              />
            </div>
            <div className="space-y-2">
              <Label>Purpose *</Label>
              <Input
                value={roomForm.purpose}
                onChange={(e) => setRoomForm((p) => ({ ...p, purpose: e.target.value }))}
                placeholder="Team Meeting"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-xs">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {format(roomForm.date, "MMM d")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={roomForm.date}
                      onSelect={(d) => d && setRoomForm((p) => ({ ...p, date: d }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Start</Label>
                <Input
                  type="time"
                  value={roomForm.startTime}
                  onChange={(e) => setRoomForm((p) => ({ ...p, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Input
                  type="time"
                  value={roomForm.endTime}
                  onChange={(e) => setRoomForm((p) => ({ ...p, endTime: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewRoomBookingOpen(false)}>Cancel</Button>
            <Button onClick={() => createRoomBooking.mutate()} disabled={!roomForm.roomName || !roomForm.purpose || createRoomBooking.isPending}>
              {createRoomBooking.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Book Room"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Leave Request Dialog */}
      <Dialog open={newLeaveOpen} onOpenChange={setNewLeaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Staff Name *</Label>
                <Input
                  value={leaveForm.staffName}
                  onChange={(e) => setLeaveForm((p) => ({ ...p, staffName: e.target.value }))}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label>Leave Type</Label>
                <Select
                  value={leaveForm.leaveType}
                  onValueChange={(v) => setLeaveForm((p) => ({ ...p, leaveType: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="sick">Sick</SelectItem>
                    <SelectItem value="maternity">Maternity</SelectItem>
                    <SelectItem value="paternity">Paternity</SelectItem>
                    <SelectItem value="study">Study</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(leaveForm.startDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={leaveForm.startDate}
                      onSelect={(d) => d && setLeaveForm((p) => ({ ...p, startDate: d }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(leaveForm.endDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={leaveForm.endDate}
                      onSelect={(d) => d && setLeaveForm((p) => ({ ...p, endDate: d }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Optional reason..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewLeaveOpen(false)}>Cancel</Button>
            <Button onClick={() => createLeave.mutate()} disabled={!leaveForm.staffName || createLeave.isPending}>
              {createLeave.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
