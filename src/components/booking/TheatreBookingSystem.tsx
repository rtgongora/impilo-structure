import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheatreBookings } from "@/hooks/useTheatreData";
import { 
  Clock,
  Plus,
  Search,
  Building2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Theatre {
  id: string;
  name: string;
  type: "general" | "ortho" | "cardiac" | "neuro" | "ent" | "obs-gyn";
  status: "available" | "in-use" | "cleaning" | "maintenance";
  equipment: string[];
}

const THEATRES: Theatre[] = [
  { id: "1", name: "Theatre 1", type: "general", status: "available", equipment: ["Laparoscopy", "Electrosurgery"] },
  { id: "2", name: "Theatre 2", type: "ortho", status: "in-use", equipment: ["C-Arm", "Power Tools", "Traction"] },
  { id: "3", name: "Theatre 3", type: "cardiac", status: "available", equipment: ["Bypass Machine", "IABP", "Echo"] },
  { id: "4", name: "Theatre 4", type: "neuro", status: "cleaning", equipment: ["Microscope", "Navigation", "Drill"] },
  { id: "5", name: "Minor Procedures", type: "general", status: "available", equipment: ["Basic Set"] },
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

export function TheatreBookingSystem() {
  const { bookings, loading, createBooking, updateBookingStatus, refetch } = useTheatreBookings();
  const [selectedTheatre, setSelectedTheatre] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);

  // Calculate stats from bookings
  const stats = {
    scheduled: bookings.filter(b => b.status === "scheduled").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    inProgress: bookings.filter(b => b.status === "in_progress").length,
    completed: bookings.filter(b => b.status === "completed").length
  };

  const [newBooking, setNewBooking] = useState({
    patientId: "",
    procedureName: "",
    procedureCode: "",
    surgeonId: "",
    anaesthetistId: "",
    theatreRoom: "",
    scheduledDate: new Date(),
    startTime: "08:00",
    duration: 60,
    priority: "elective",
    preOpNotes: ""
  });

  const filteredBookings = bookings.filter(b => {
    const matchesTheatre = selectedTheatre === "all" || b.theatre_room === selectedTheatre;
    const matchesSearch = 
      b.procedure_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.patient?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.patient?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTheatre && matchesSearch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "emergency": return "bg-destructive text-destructive-foreground";
      case "urgent": return "bg-warning text-warning-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-success text-success-foreground";
      case "in_progress": return "bg-primary text-primary-foreground";
      case "completed": return "bg-muted text-muted-foreground";
      case "cancelled": return "bg-destructive text-destructive-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getTheatreStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-success";
      case "in-use": return "bg-destructive";
      case "cleaning": return "bg-warning";
      default: return "bg-muted";
    }
  };

  const handleCreateBooking = async () => {
    if (!newBooking.patientId || !newBooking.procedureName || !newBooking.theatreRoom || !newBooking.startTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    await createBooking({
      patient_id: newBooking.patientId,
      procedure_name: newBooking.procedureName,
      procedure_code: newBooking.procedureCode || undefined,
      surgeon_id: newBooking.surgeonId || undefined,
      anaesthetist_id: newBooking.anaesthetistId || undefined,
      theatre_room: newBooking.theatreRoom,
      scheduled_date: newBooking.scheduledDate,
      start_time: newBooking.startTime,
      duration: newBooking.duration,
      priority: newBooking.priority,
      pre_op_notes: newBooking.preOpNotes || undefined
    });

    setIsNewBookingOpen(false);
    setNewBooking({
      patientId: "",
      procedureName: "",
      procedureCode: "",
      surgeonId: "",
      anaesthetistId: "",
      theatreRoom: "",
      scheduledDate: new Date(),
      startTime: "08:00",
      duration: 60,
      priority: "elective",
      preOpNotes: ""
    });
  };

  const handleCancelBooking = async (id: string) => {
    await updateBookingStatus(id, "cancelled");
  };

  const handleConfirmBooking = async (id: string) => {
    await updateBookingStatus(id, "confirmed");
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Select value={selectedTheatre} onValueChange={setSelectedTheatre}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by theatre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Theatres</SelectItem>
              {THEATRES.map(t => (
                <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <Dialog open={isNewBookingOpen} onOpenChange={setIsNewBookingOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Theatre Booking</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Patient ID *</Label>
                <Input
                  value={newBooking.patientId}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, patientId: e.target.value }))}
                  placeholder="Enter patient ID"
                />
              </div>
              <div className="space-y-2">
                <Label>Procedure Name *</Label>
                <Input
                  value={newBooking.procedureName}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, procedureName: e.target.value }))}
                  placeholder="Enter procedure"
                />
              </div>
              <div className="space-y-2">
                <Label>Procedure Code</Label>
                <Input
                  value={newBooking.procedureCode}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, procedureCode: e.target.value }))}
                  placeholder="CPT code"
                />
              </div>
              <div className="space-y-2">
                <Label>Theatre *</Label>
                <Select 
                  value={newBooking.theatreRoom} 
                  onValueChange={(v) => setNewBooking(prev => ({ ...prev, theatreRoom: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theatre" />
                  </SelectTrigger>
                  <SelectContent>
                    {THEATRES.map(t => (
                      <SelectItem key={t.id} value={t.name}>{t.name} ({t.type})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={newBooking.priority} 
                  onValueChange={(v) => setNewBooking(prev => ({ ...prev, priority: v }))}
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
                <Label>Scheduled Date *</Label>
                <Input
                  type="date"
                  value={newBooking.scheduledDate.toISOString().split('T')[0]}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, scheduledDate: new Date(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input
                  type="time"
                  value={newBooking.startTime}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={newBooking.duration}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                  min={15}
                  step={15}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Pre-Op Notes</Label>
                <Textarea
                  value={newBooking.preOpNotes}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, preOpNotes: e.target.value }))}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNewBookingOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateBooking}>Create Booking</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              {loading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{stats.scheduled}</p>}
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              {loading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{stats.confirmed}</p>}
              <p className="text-xs text-muted-foreground">Confirmed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              {loading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{stats.inProgress}</p>}
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              {loading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{stats.completed}</p>}
              <p className="text-xs text-muted-foreground">Completed Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Theatre Status Panel */}
        <Card className="w-64 shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Theatre Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-450px)]">
              <div className="space-y-2 p-4 pt-0">
                {THEATRES.map(theatre => (
                  <Card key={theatre.id} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{theatre.name}</span>
                      <div className={`h-3 w-3 rounded-full ${getTheatreStatusColor(theatre.status)}`} />
                    </div>
                    <Badge variant="outline" className="text-xs mb-2">{theatre.type}</Badge>
                    <p className="text-xs text-muted-foreground capitalize">{theatre.status}</p>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="list" className="h-full flex flex-col">
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="schedule">Schedule View</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="flex-1 overflow-hidden mt-4">
              <Card className="h-full">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-3">
                    {loading ? (
                      [1, 2, 3].map((i) => (
                        <Card key={i} className="p-4">
                          <Skeleton className="h-20 w-full" />
                        </Card>
                      ))
                    ) : filteredBookings.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No bookings found</p>
                      </div>
                    ) : (
                      filteredBookings.map((booking) => (
                        <Card key={booking.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{booking.procedure_name}</h4>
                                <Badge className={getPriorityColor(booking.priority)}>
                                  {booking.priority}
                                </Badge>
                                <Badge className={getStatusColor(booking.status)}>
                                  {booking.status.replace("_", " ")}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {booking.patient?.first_name} {booking.patient?.last_name} • {booking.patient?.mrn}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {booking.theatre_room}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(booking.scheduled_start), "dd MMM HH:mm")} - {format(new Date(booking.scheduled_end), "HH:mm")}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {booking.status === "scheduled" && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => handleConfirmBooking(booking.id)}>
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Confirm
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleCancelBooking(booking.id)}>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="flex-1 overflow-hidden mt-4">
              <Card className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">Schedule view - Coming soon</p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
