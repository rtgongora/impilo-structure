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
import { Calendar } from "@/components/ui/calendar";
import { 
  Calendar as CalendarIcon,
  Clock,
  User,
  Plus,
  Search,
  Scissors,
  Building2,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2
} from "lucide-react";
import { format, addDays, startOfWeek, addHours, setHours, setMinutes } from "date-fns";
import { toast } from "sonner";

interface Booking {
  id: string;
  patientName: string;
  patientMrn: string;
  procedureName: string;
  procedureCode: string;
  surgeon: string;
  anaesthetist?: string;
  theatre: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  status: "scheduled" | "confirmed" | "in-progress" | "completed" | "cancelled";
  priority: "elective" | "urgent" | "emergency";
  preOpChecklist: {
    consent: boolean;
    npo: boolean;
    labsReviewed: boolean;
    bloodAvailable: boolean;
    anaesthesiaReview: boolean;
  };
  notes?: string;
}

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

const MOCK_BOOKINGS: Booking[] = [
  {
    id: "1",
    patientName: "John Doe",
    patientMrn: "MRN-2024-000001",
    procedureName: "Laparoscopic Cholecystectomy",
    procedureCode: "47562",
    surgeon: "Dr. Smith",
    anaesthetist: "Dr. Brown",
    theatre: "Theatre 1",
    date: new Date(),
    startTime: "08:00",
    endTime: "10:00",
    duration: 120,
    status: "confirmed",
    priority: "elective",
    preOpChecklist: {
      consent: true,
      npo: true,
      labsReviewed: true,
      bloodAvailable: true,
      anaesthesiaReview: true
    }
  },
  {
    id: "2",
    patientName: "Jane Smith",
    patientMrn: "MRN-2024-000002",
    procedureName: "Total Knee Replacement",
    procedureCode: "27447",
    surgeon: "Dr. Johnson",
    anaesthetist: "Dr. Williams",
    theatre: "Theatre 2",
    date: new Date(),
    startTime: "10:30",
    endTime: "14:30",
    duration: 240,
    status: "scheduled",
    priority: "elective",
    preOpChecklist: {
      consent: true,
      npo: true,
      labsReviewed: false,
      bloodAvailable: true,
      anaesthesiaReview: false
    }
  },
  {
    id: "3",
    patientName: "Robert Brown",
    patientMrn: "MRN-2024-000003",
    procedureName: "Emergency Appendectomy",
    procedureCode: "44970",
    surgeon: "Dr. Davis",
    theatre: "Theatre 1",
    date: new Date(),
    startTime: "14:00",
    endTime: "15:30",
    duration: 90,
    status: "scheduled",
    priority: "emergency",
    preOpChecklist: {
      consent: true,
      npo: false,
      labsReviewed: true,
      bloodAvailable: false,
      anaesthesiaReview: false
    },
    notes: "Patient presenting with acute appendicitis. NPO since admission 2 hours ago."
  }
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

export function TheatreBookingSystem() {
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTheatre, setSelectedTheatre] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const [newBooking, setNewBooking] = useState({
    patientName: "",
    patientMrn: "",
    procedureName: "",
    procedureCode: "",
    surgeon: "",
    anaesthetist: "",
    theatre: "",
    date: new Date(),
    startTime: "08:00",
    duration: 60,
    priority: "elective",
    notes: ""
  });

  const filteredBookings = bookings.filter(b => {
    const matchesTheatre = selectedTheatre === "all" || b.theatre === selectedTheatre;
    const matchesDate = format(b.date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
    const matchesSearch = 
      b.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.procedureName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.surgeon.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTheatre && matchesDate && matchesSearch;
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
      case "in-progress": return "bg-primary text-primary-foreground";
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

  const handleCreateBooking = () => {
    const endTime = format(
      addHours(setMinutes(setHours(new Date(), parseInt(newBooking.startTime.split(':')[0])), parseInt(newBooking.startTime.split(':')[1])), 
      newBooking.duration / 60),
      "HH:mm"
    );

    const booking: Booking = {
      id: Date.now().toString(),
      patientName: newBooking.patientName,
      patientMrn: newBooking.patientMrn,
      procedureName: newBooking.procedureName,
      procedureCode: newBooking.procedureCode,
      surgeon: newBooking.surgeon,
      anaesthetist: newBooking.anaesthetist,
      theatre: newBooking.theatre,
      date: newBooking.date,
      startTime: newBooking.startTime,
      endTime,
      duration: newBooking.duration,
      status: "scheduled",
      priority: newBooking.priority as "elective" | "urgent" | "emergency",
      preOpChecklist: {
        consent: false,
        npo: false,
        labsReviewed: false,
        bloodAvailable: false,
        anaesthesiaReview: false
      },
      notes: newBooking.notes
    };

    setBookings(prev => [...prev, booking]);
    setIsNewBookingOpen(false);
    toast.success("Booking created successfully");
    
    // Reset form
    setNewBooking({
      patientName: "",
      patientMrn: "",
      procedureName: "",
      procedureCode: "",
      surgeon: "",
      anaesthetist: "",
      theatre: "",
      date: new Date(),
      startTime: "08:00",
      duration: 60,
      priority: "elective",
      notes: ""
    });
  };

  const handleCancelBooking = (id: string) => {
    setBookings(prev => prev.map(b => 
      b.id === id ? { ...b, status: "cancelled" as const } : b
    ));
    toast.success("Booking cancelled");
  };

  const handleConfirmBooking = (id: string) => {
    setBookings(prev => prev.map(b => 
      b.id === id ? { ...b, status: "confirmed" as const } : b
    ));
    toast.success("Booking confirmed");
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(selectedDate), i));

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
                <Label>Patient Name</Label>
                <Input
                  value={newBooking.patientName}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, patientName: e.target.value }))}
                  placeholder="Enter patient name"
                />
              </div>
              <div className="space-y-2">
                <Label>Patient MRN</Label>
                <Input
                  value={newBooking.patientMrn}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, patientMrn: e.target.value }))}
                  placeholder="Enter MRN"
                />
              </div>
              <div className="space-y-2">
                <Label>Procedure Name</Label>
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
                <Label>Surgeon</Label>
                <Input
                  value={newBooking.surgeon}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, surgeon: e.target.value }))}
                  placeholder="Select surgeon"
                />
              </div>
              <div className="space-y-2">
                <Label>Anaesthetist</Label>
                <Input
                  value={newBooking.anaesthetist}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, anaesthetist: e.target.value }))}
                  placeholder="Select anaesthetist"
                />
              </div>
              <div className="space-y-2">
                <Label>Theatre</Label>
                <Select 
                  value={newBooking.theatre} 
                  onValueChange={(v) => setNewBooking(prev => ({ ...prev, theatre: v }))}
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
                <Label>Start Time</Label>
                <Select 
                  value={newBooking.startTime} 
                  onValueChange={(v) => setNewBooking(prev => ({ ...prev, startTime: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Select 
                  value={newBooking.duration.toString()} 
                  onValueChange={(v) => setNewBooking(prev => ({ ...prev, duration: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                    <SelectItem value="300">5 hours</SelectItem>
                    <SelectItem value="360">6 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={newBooking.notes}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, notes: e.target.value }))}
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
            <ScrollArea className="h-[calc(100vh-350px)]">
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
          <Tabs defaultValue="schedule" className="h-full flex flex-col">
            <TabsList>
              <TabsTrigger value="schedule">Schedule View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="flex-1 overflow-auto mt-4">
              {/* Week navigation */}
              <div className="flex gap-1 mb-4">
                {weekDays.map(day => (
                  <Button
                    key={day.toISOString()}
                    variant={format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd") ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="text-center">
                      <div className="text-xs">{format(day, "EEE")}</div>
                      <div className="font-bold">{format(day, "d")}</div>
                    </div>
                  </Button>
                ))}
              </div>

              {/* Bookings for selected date */}
              <div className="space-y-3">
                {filteredBookings.length > 0 ? (
                  filteredBookings.map(booking => (
                    <Card 
                      key={booking.id} 
                      className={`cursor-pointer transition-colors hover:bg-accent ${
                        booking.status === "cancelled" ? "opacity-50" : ""
                      }`}
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Scissors className="h-4 w-4 text-primary" />
                              <h4 className="font-semibold">{booking.procedureName}</h4>
                              <Badge className={getPriorityColor(booking.priority)} variant="secondary">
                                {booking.priority}
                              </Badge>
                              <Badge className={getStatusColor(booking.status)} variant="secondary">
                                {booking.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span>{booking.patientName}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span>{booking.startTime} - {booking.endTime}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                <span>{booking.theatre}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>{booking.surgeon}</span>
                              {booking.anaesthetist && (
                                <>
                                  <span>•</span>
                                  <span>{booking.anaesthetist}</span>
                                </>
                              )}
                            </div>
                            
                            {/* Pre-op checklist status */}
                            <div className="flex items-center gap-3 mt-3">
                              {Object.entries(booking.preOpChecklist).map(([key, value]) => (
                                <div 
                                  key={key} 
                                  className={`flex items-center gap-1 text-xs ${
                                    value ? "text-success" : "text-destructive"
                                  }`}
                                >
                                  {value ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {booking.status === "scheduled" && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); handleConfirmBooking(booking.id); }}
                              >
                                Confirm
                              </Button>
                            )}
                            {booking.status !== "cancelled" && booking.status !== "completed" && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); handleCancelBooking(booking.id); }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Scissors className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No bookings for this date</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="list" className="flex-1 overflow-auto mt-4">
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-left p-3 font-medium">Time</th>
                        <th className="text-left p-3 font-medium">Patient</th>
                        <th className="text-left p-3 font-medium">Procedure</th>
                        <th className="text-left p-3 font-medium">Theatre</th>
                        <th className="text-left p-3 font-medium">Surgeon</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">{format(b.date, "MMM d, yyyy")}</td>
                          <td className="p-3">{b.startTime} - {b.endTime}</td>
                          <td className="p-3">{b.patientName}</td>
                          <td className="p-3">{b.procedureName}</td>
                          <td className="p-3">{b.theatre}</td>
                          <td className="p-3">{b.surgeon}</td>
                          <td className="p-3">
                            <Badge className={getStatusColor(b.status)} variant="secondary">
                              {b.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar" className="flex-1 overflow-auto mt-4">
              <Card>
                <CardContent className="p-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
