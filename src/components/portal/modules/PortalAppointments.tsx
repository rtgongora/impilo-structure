import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { DictatableTextarea } from "@/components/ui/dictatable-textarea";
import { 
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  User,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Search,
  Filter,
  Plus,
  FileText,
  Upload,
  QrCode
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Appointment {
  id: string;
  type: "in-person" | "telehealth" | "phone";
  service: string;
  provider: string;
  facility: string;
  date: string;
  time: string;
  status: "scheduled" | "confirmed" | "checked-in" | "in-progress" | "completed" | "cancelled" | "no-show";
  location?: string;
  room?: string;
  notes?: string;
  preVisitComplete?: boolean;
}

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "1",
    type: "in-person",
    service: "Cardiology Follow-up",
    provider: "Dr. Johnson",
    facility: "City General Hospital",
    date: "2024-01-22",
    time: "10:00 AM",
    status: "confirmed",
    location: "Cardiology Wing, 2nd Floor",
    room: "Room 204",
    preVisitComplete: false
  },
  {
    id: "2",
    type: "telehealth",
    service: "Diabetes Management",
    provider: "Dr. Smith",
    facility: "Virtual Clinic",
    date: "2024-01-25",
    time: "2:30 PM",
    status: "scheduled",
    preVisitComplete: true
  },
  {
    id: "3",
    type: "in-person",
    service: "Blood Draw",
    provider: "Lab Services",
    facility: "PathLab Services",
    date: "2024-01-28",
    time: "8:00 AM",
    status: "scheduled",
    location: "Ground Floor",
    preVisitComplete: false
  },
  {
    id: "4",
    type: "in-person",
    service: "General Checkup",
    provider: "Dr. Smith",
    facility: "City General Hospital",
    date: "2024-01-10",
    time: "9:00 AM",
    status: "completed"
  },
  {
    id: "5",
    type: "telehealth",
    service: "Mental Health Counseling",
    provider: "Dr. Moyo",
    facility: "Virtual Clinic",
    date: "2024-01-05",
    time: "3:00 PM",
    status: "completed"
  }
];

const SERVICES = [
  { id: "1", name: "General Consultation", category: "Primary Care" },
  { id: "2", name: "Cardiology", category: "Specialty" },
  { id: "3", name: "Laboratory", category: "Diagnostics" },
  { id: "4", name: "Radiology", category: "Diagnostics" },
  { id: "5", name: "Mental Health", category: "Wellness" },
  { id: "6", name: "Maternal Health", category: "Women's Health" },
];

export function PortalAppointments() {
  const [showBooking, setShowBooking] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [preVisitNotes, setPreVisitNotes] = useState("");

  const upcomingAppointments = MOCK_APPOINTMENTS.filter(a => 
    ["scheduled", "confirmed"].includes(a.status)
  );
  const pastAppointments = MOCK_APPOINTMENTS.filter(a => 
    ["completed", "cancelled", "no-show"].includes(a.status)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-success">Confirmed</Badge>;
      case "scheduled":
        return <Badge variant="secondary">Scheduled</Badge>;
      case "checked-in":
        return <Badge className="bg-info">Checked In</Badge>;
      case "in-progress":
        return <Badge className="bg-primary">In Progress</Badge>;
      case "completed":
        return <Badge variant="outline">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "no-show":
        return <Badge variant="destructive">No Show</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "telehealth": return Video;
      case "phone": return Phone;
      default: return MapPin;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            My Appointments
          </h2>
          <p className="text-sm text-muted-foreground">
            Book, manage, and prepare for your visits
          </p>
        </div>
        <Dialog open={showBooking} onOpenChange={setShowBooking}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Book Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Book New Appointment</DialogTitle>
              <DialogDescription>
                Choose a service to begin booking
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search services..." className="pl-9" />
              </div>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {SERVICES.map(service => (
                    <div 
                      key={service.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                        selectedService === service.id ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => setSelectedService(service.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">{service.category}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Button className="w-full" disabled={!selectedService}>
                Continue to Select Provider
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">Past Visits</TabsTrigger>
        </TabsList>

        {/* Upcoming Appointments */}
        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium">No upcoming appointments</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Book an appointment to get started
                </p>
                <Button onClick={() => setShowBooking(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Book Appointment
                </Button>
              </CardContent>
            </Card>
          ) : (
            upcomingAppointments.map(apt => {
              const TypeIcon = getTypeIcon(apt.type);
              return (
                <Card key={apt.id} className={!apt.preVisitComplete ? "border-warning/50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${
                          apt.type === "telehealth" ? "bg-primary/10" : "bg-secondary/10"
                        }`}>
                          <TypeIcon className={`h-6 w-6 ${
                            apt.type === "telehealth" ? "text-primary" : "text-secondary-foreground"
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{apt.service}</p>
                            {getStatusBadge(apt.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            with {apt.provider}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(apt.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric"
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {apt.time}
                            </span>
                          </div>
                          {apt.location && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {apt.location} {apt.room && `• ${apt.room}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {apt.type === "telehealth" ? (
                          <Button size="sm">
                            <Video className="h-4 w-4 mr-2" />
                            Join Call
                          </Button>
                        ) : (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <QrCode className="h-4 w-4 mr-2" />
                                Check In
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Check In</DialogTitle>
                                <DialogDescription>
                                  Scan this QR code at the facility or tap "I'm Here"
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex flex-col items-center py-6">
                                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mb-4">
                                  <QrCode className="h-32 w-32 text-muted-foreground" />
                                </div>
                                <Button className="w-full">I'm Here</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">Reschedule</Button>
                          <Button size="sm" variant="ghost" className="text-destructive">Cancel</Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Pre-visit preparation */}
                    {!apt.preVisitComplete && (
                      <div className="mt-4 p-3 bg-warning/10 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-warning" />
                            <span className="text-sm font-medium">Pre-visit preparation incomplete</span>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">Complete Now</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Pre-Visit Questionnaire</DialogTitle>
                                <DialogDescription>
                                  Help your provider prepare for your visit
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <div>
                                  <label className="text-sm font-medium">Reason for visit</label>
                                  <DictatableTextarea 
                                    placeholder="Describe your main concern..."
                                    value={preVisitNotes}
                                    onChange={(e) => setPreVisitNotes(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Upload documents</label>
                                  <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center">
                                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                      Drop files here or click to upload
                                    </p>
                                  </div>
                                </div>
                                <Button className="w-full">
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Submit Pre-Visit Form
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Past Appointments */}
        <TabsContent value="past" className="space-y-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {pastAppointments.map(apt => {
                const TypeIcon = getTypeIcon(apt.type);
                return (
                  <Card key={apt.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-muted">
                            <TypeIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{apt.service}</p>
                              {getStatusBadge(apt.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {apt.provider} • {apt.facility}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(apt.date).toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                                year: "numeric"
                              })}
                            </p>
                          </div>
                        </div>
                        {apt.status === "completed" && (
                          <Button size="sm" variant="outline">
                            <FileText className="h-4 w-4 mr-2" />
                            View Summary
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
