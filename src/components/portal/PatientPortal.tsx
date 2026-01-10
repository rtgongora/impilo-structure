import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  User,
  Calendar,
  FileText,
  Pill,
  Bell,
  Heart,
  Activity,
  Video,
  Download,
  Clock,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Wallet,
  MessageSquare,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Home,
  ArrowLeft,
  AlertTriangle,
  Users
} from "lucide-react";
import { EmergencySOS } from "./EmergencySOS";
import { PortalQueueStatus } from "./PortalQueueStatus";
import { RemoteQueueRequestDialog } from "./RemoteQueueRequestDialog";
import { HealthIdManager } from "./HealthIdManager";
import { ServiceDiscovery } from "./ServiceDiscovery";
import { Shield, Search as SearchIcon } from "lucide-react";

interface Appointment {
  id: string;
  type: "in-person" | "telehealth";
  department: string;
  provider: string;
  date: string;
  time: string;
  status: "upcoming" | "confirmed" | "completed" | "cancelled";
  location?: string;
  meetingLink?: string;
}

interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  prescribedDate: string;
  refillsRemaining: number;
  status: "active" | "expired" | "pending-refill";
}

interface LabResult {
  id: string;
  testName: string;
  date: string;
  status: "normal" | "abnormal" | "critical";
  value?: string;
  range?: string;
}

interface Notification {
  id: string;
  type: "appointment" | "result" | "refill" | "message" | "billing";
  title: string;
  message: string;
  date: string;
  read: boolean;
}

const MOCK_PATIENT = {
  name: "John Doe",
  mrn: "MRN-2024-000001",
  dob: "1985-03-15",
  phone: "+263 77 123 4567",
  email: "john.doe@email.com",
  insurance: "PSMAS",
  policyNumber: "PSM-2024-123456",
  healthWalletBalance: 1250.00,
  nextAppointment: "Tomorrow at 10:00 AM"
};

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "1",
    type: "in-person",
    department: "General Medicine",
    provider: "Dr. Smith",
    date: "2024-01-20",
    time: "10:00 AM",
    status: "confirmed",
    location: "Main Hospital, Room 204"
  },
  {
    id: "2",
    type: "telehealth",
    department: "Cardiology",
    provider: "Dr. Johnson",
    date: "2024-01-25",
    time: "2:30 PM",
    status: "upcoming",
    meetingLink: "https://meet.impilo.health/abc123"
  },
  {
    id: "3",
    type: "in-person",
    department: "Laboratory",
    provider: "Lab Services",
    date: "2024-01-10",
    time: "8:00 AM",
    status: "completed",
    location: "Lab Building, Ground Floor"
  }
];

const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: "1",
    medication: "Metformin 500mg",
    dosage: "500mg",
    frequency: "Twice daily with meals",
    prescribedBy: "Dr. Smith",
    prescribedDate: "2024-01-01",
    refillsRemaining: 2,
    status: "active"
  },
  {
    id: "2",
    medication: "Lisinopril 10mg",
    dosage: "10mg",
    frequency: "Once daily in the morning",
    prescribedBy: "Dr. Johnson",
    prescribedDate: "2024-01-01",
    refillsRemaining: 0,
    status: "pending-refill"
  },
  {
    id: "3",
    medication: "Atorvastatin 20mg",
    dosage: "20mg",
    frequency: "Once daily at bedtime",
    prescribedBy: "Dr. Johnson",
    prescribedDate: "2023-12-01",
    refillsRemaining: 1,
    status: "active"
  }
];

const MOCK_LAB_RESULTS: LabResult[] = [
  { id: "1", testName: "Fasting Blood Sugar", date: "2024-01-10", status: "normal", value: "95 mg/dL", range: "70-100 mg/dL" },
  { id: "2", testName: "HbA1c", date: "2024-01-10", status: "abnormal", value: "7.2%", range: "<6.5%" },
  { id: "3", testName: "Total Cholesterol", date: "2024-01-10", status: "normal", value: "185 mg/dL", range: "<200 mg/dL" },
  { id: "4", testName: "Blood Pressure", date: "2024-01-10", status: "normal", value: "128/82 mmHg", range: "<130/80 mmHg" }
];

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "appointment",
    title: "Appointment Reminder",
    message: "Your appointment with Dr. Smith is tomorrow at 10:00 AM",
    date: "2024-01-19",
    read: false
  },
  {
    id: "2",
    type: "result",
    title: "Lab Results Available",
    message: "Your recent blood work results are now available for review",
    date: "2024-01-15",
    read: false
  },
  {
    id: "3",
    type: "refill",
    title: "Prescription Refill Due",
    message: "Your Lisinopril prescription needs to be refilled",
    date: "2024-01-14",
    read: true
  },
  {
    id: "4",
    type: "billing",
    title: "Payment Received",
    message: "Your payment of $150.00 has been received. Thank you!",
    date: "2024-01-12",
    read: true
  }
];

const HEALTH_METRICS = [
  { label: "Steps Today", value: "6,234", target: 10000, icon: Activity },
  { label: "Heart Rate", value: "72 bpm", target: null, icon: Heart },
  { label: "Blood Pressure", value: "128/82", target: null, icon: Activity },
  { label: "Weight", value: "75 kg", target: null, icon: User }
];

export function PatientPortal() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": 
      case "active":
      case "normal":
        return "bg-success text-success-foreground";
      case "abnormal":
      case "pending-refill":
        return "bg-warning text-warning-foreground";
      case "critical":
      case "expired":
      case "cancelled":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment": return Calendar;
      case "result": return FileText;
      case "refill": return Pill;
      case "message": return MessageSquare;
      case "billing": return CreditCard;
      default: return Bell;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Home/Back Navigation */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Home className="h-4 w-4 mr-1" />
              Home
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Impilo Connect</h1>
              <p className="text-sm text-muted-foreground">Patient Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="health-id" className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              Health ID
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-1">
              <SearchIcon className="w-4 h-4" />
              Find Services
            </TabsTrigger>
            <TabsTrigger value="queue" className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              Queue Status
            </TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="records">Health Records</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="wallet">Health Wallet</TabsTrigger>
            <TabsTrigger value="emergency" className="text-destructive">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Emergency
            </TabsTrigger>
            <TabsTrigger value="notifications">
              Notifications
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-destructive">{unreadCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Health ID Tab */}
          <TabsContent value="health-id">
            <HealthIdManager hasHealthId={true} />
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <ServiceDiscovery />
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-xl">JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-semibold">{MOCK_PATIENT.name}</h2>
                      <p className="text-sm text-muted-foreground">{MOCK_PATIENT.mrn}</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>DOB: {MOCK_PATIENT.dob}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{MOCK_PATIENT.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{MOCK_PATIENT.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span>{MOCK_PATIENT.insurance} - {MOCK_PATIENT.policyNumber}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("queue")}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View Queue Status
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Appointment
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Video className="h-4 w-4 mr-2" />
                    Start Telehealth Visit
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Request Prescription Refill
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message Provider
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Button>
                </CardContent>
              </Card>

              {/* Health Wallet */}
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Health Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-4">
                    ${MOCK_PATIENT.healthWalletBalance.toFixed(2)}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">Add Funds</Button>
                    <Button size="sm" variant="outline" className="flex-1">History</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Appointment */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Next Appointment</CardTitle>
                </CardHeader>
                <CardContent>
                  {MOCK_APPOINTMENTS.filter(a => a.status !== "completed")[0] && (
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          {MOCK_APPOINTMENTS[0].type === "telehealth" ? (
                            <Video className="h-6 w-6 text-primary" />
                          ) : (
                            <Calendar className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{MOCK_APPOINTMENTS[0].department}</p>
                          <p className="text-sm text-muted-foreground">{MOCK_APPOINTMENTS[0].provider}</p>
                          <p className="text-sm text-muted-foreground">
                            {MOCK_APPOINTMENTS[0].date} at {MOCK_APPOINTMENTS[0].time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(MOCK_APPOINTMENTS[0].status)}>
                          {MOCK_APPOINTMENTS[0].status}
                        </Badge>
                        {MOCK_APPOINTMENTS[0].type === "telehealth" && (
                          <Button size="sm">Join Call</Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Health Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Health Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {HEALTH_METRICS.map((metric, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <metric.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{metric.label}</span>
                        </div>
                        <span className="font-medium">{metric.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Lab Results */}
              <Card className="md:col-span-3">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Recent Lab Results</CardTitle>
                  <Button variant="outline" size="sm">View All</Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {MOCK_LAB_RESULTS.map(result => (
                      <Card key={result.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{result.testName}</span>
                            <Badge className={getStatusColor(result.status)} variant="secondary">
                              {result.status}
                            </Badge>
                          </div>
                          <p className="text-2xl font-bold">{result.value}</p>
                          <p className="text-xs text-muted-foreground">Range: {result.range}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Queue Status Tab */}
          <TabsContent value="queue">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">My Queue Status</h2>
              <RemoteQueueRequestDialog 
                patientId="mock-patient-id" 
                trigger={
                  <Button>
                    <Users className="h-4 w-4 mr-2" />
                    Request Queue Entry
                  </Button>
                }
              />
            </div>
            <PortalQueueStatus patientId="mock-patient-id" />
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">My Appointments</h2>
              <Button>
                <Calendar className="h-4 w-4 mr-2" />
                Book New Appointment
              </Button>
            </div>
            <div className="space-y-4">
              {MOCK_APPOINTMENTS.map(apt => (
                <Card key={apt.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          apt.type === "telehealth" ? "bg-primary/10" : "bg-secondary"
                        }`}>
                          {apt.type === "telehealth" ? (
                            <Video className="h-6 w-6 text-primary" />
                          ) : (
                            <MapPin className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{apt.department}</p>
                          <p className="text-sm text-muted-foreground">{apt.provider}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            <span>{apt.date} at {apt.time}</span>
                          </div>
                          {apt.location && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{apt.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(apt.status)}>{apt.status}</Badge>
                        {apt.status !== "completed" && apt.status !== "cancelled" && (
                          <div className="flex gap-2">
                            {apt.type === "telehealth" && apt.meetingLink && (
                              <Button size="sm">Join Call</Button>
                            )}
                            <Button size="sm" variant="outline">Reschedule</Button>
                            <Button size="sm" variant="ghost" className="text-destructive">Cancel</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Health Records Tab */}
          <TabsContent value="records">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lab Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {MOCK_LAB_RESULTS.map(result => (
                        <div key={result.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{result.testName}</p>
                            <p className="text-sm text-muted-foreground">{result.date}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-bold">{result.value}</p>
                              <p className="text-xs text-muted-foreground">{result.range}</p>
                            </div>
                            <Badge className={getStatusColor(result.status)}>{result.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Discharge Summary</p>
                          <p className="text-sm text-muted-foreground">Jan 5, 2024</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">X-Ray Report</p>
                          <p className="text-sm text-muted-foreground">Dec 28, 2023</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">My Prescriptions</h2>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Request Refill
              </Button>
            </div>
            <div className="space-y-4">
              {MOCK_PRESCRIPTIONS.map(rx => (
                <Card key={rx.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Pill className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{rx.medication}</p>
                          <p className="text-sm text-muted-foreground">{rx.frequency}</p>
                          <p className="text-sm text-muted-foreground">
                            Prescribed by {rx.prescribedBy} on {rx.prescribedDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge className={getStatusColor(rx.status)}>{rx.status}</Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {rx.refillsRemaining} refills remaining
                          </p>
                        </div>
                        {rx.status === "pending-refill" ? (
                          <Button size="sm">Order Refill</Button>
                        ) : (
                          <Button size="sm" variant="outline">Request Refill</Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Emergency SOS Tab */}
          <TabsContent value="emergency">
            <EmergencySOS />
          </TabsContent>

          {/* Health Wallet Tab */}
          <TabsContent value="wallet">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
                      <Wallet className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Available Balance</p>
                      <p className="text-4xl font-bold">${MOCK_PATIENT.healthWalletBalance.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button className="flex-1">Add Funds</Button>
                    <Button variant="outline" className="flex-1">Transfer</Button>
                    <Button variant="outline" className="flex-1">Pay Bill</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Pay</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-between">
                    Consultation Fee
                    <span>$50.00</span>
                  </Button>
                  <Button variant="outline" className="w-full justify-between">
                    Lab Tests
                    <span>$120.00</span>
                  </Button>
                  <Button variant="outline" className="w-full justify-between">
                    Pharmacy
                    <span>$85.00</span>
                  </Button>
                </CardContent>
              </Card>

              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle className="text-base">Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <p className="font-medium">Deposit - Mobile Money</p>
                          <p className="text-sm text-muted-foreground">Jan 15, 2024</p>
                        </div>
                      </div>
                      <span className="font-bold text-success">+$500.00</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <p className="font-medium">Consultation - Dr. Smith</p>
                          <p className="text-sm text-muted-foreground">Jan 10, 2024</p>
                        </div>
                      </div>
                      <span className="font-bold text-destructive">-$50.00</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                          <Pill className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <p className="font-medium">Pharmacy - Medication</p>
                          <p className="text-sm text-muted-foreground">Jan 8, 2024</p>
                        </div>
                      </div>
                      <span className="font-bold text-destructive">-$85.00</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="space-y-4">
              {notifications.map(notif => {
                const Icon = getNotificationIcon(notif.type);
                return (
                  <Card 
                    key={notif.id}
                    className={`cursor-pointer transition-colors ${!notif.read ? "border-primary" : ""}`}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          !notif.read ? "bg-primary/10" : "bg-muted"
                        }`}>
                          <Icon className={`h-5 w-5 ${!notif.read ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className={`font-medium ${!notif.read ? "" : "text-muted-foreground"}`}>
                              {notif.title}
                            </p>
                            <span className="text-sm text-muted-foreground">{notif.date}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                        </div>
                        {!notif.read && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
