import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Heart,
  Bell,
  Home,
  Shield,
  Calendar,
  Pill,
  FileHeart,
  Wallet,
  Users,
  Clock,
  AlertTriangle,
  Video,
  MessageSquare,
  ShoppingCart,
  Activity,
  FileText,
  Phone,
  QrCode,
  ChevronRight,
  Bluetooth
} from "lucide-react";
import { EmergencySOS } from "./EmergencySOS";
import { PortalQueueStatus } from "./PortalQueueStatus";
import { HealthIdManager } from "./HealthIdManager";
import { ServiceDiscovery } from "./ServiceDiscovery";
import { PortalConsentDashboard } from "./modules/PortalConsentDashboard";
import { PortalHealthTimeline } from "./modules/PortalHealthTimeline";
import { PortalMedications } from "./modules/PortalMedications";
import { PortalAppointments } from "./modules/PortalAppointments";
import { PortalWallet } from "./modules/PortalWallet";
import { PortalCommunities } from "./modules/PortalCommunities";
import { PortalRemoteMonitoring } from "./modules/PortalRemoteMonitoring";
import { PortalSecureMessaging } from "./modules/PortalSecureMessaging";
import { PortalMarketplace } from "./modules/PortalMarketplace";
import { PortalWellness } from "./modules/PortalWellness";
import { PortalPHRHub } from "./modules/phr";
import { PortalHealthReporting } from "./modules/PortalHealthReporting";
const MOCK_PATIENT = {
  name: "John Doe",
  healthId: "HID-0000000001-AB12-3",
  phone: "+263 77 123 4567",
  walletBalance: 1250.00,
  unreadMessages: 3,
  upcomingAppointments: 2,
  pendingRefills: 1
};

export function PatientPortal() {
  const [activeTab, setActiveTab] = useState("home");
  const navigate = useNavigate();
  const unreadCount = MOCK_PATIENT.unreadMessages;

  const quickActions = [
    { id: "appointment", label: "Book Visit", icon: Calendar, color: "bg-primary" },
    { id: "telehealth", label: "Video Call", icon: Video, color: "bg-success" },
    { id: "prescriptions", label: "Refill Rx", icon: Pill, color: "bg-warning" },
    { id: "messages", label: "Messages", icon: MessageSquare, color: "bg-info", badge: unreadCount },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <Home className="h-4 w-4 mr-1" />
              Home
            </Button>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <span className="font-semibold">Impilo Connect</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto mb-4">
            <TabsList className="inline-flex w-max min-w-full">
              <TabsTrigger value="home">Home</TabsTrigger>
              <TabsTrigger value="health-id">
                <QrCode className="h-4 w-4 mr-1" />
                Health ID
              </TabsTrigger>
              <TabsTrigger value="appointments">
                <Calendar className="h-4 w-4 mr-1" />
                Appointments
              </TabsTrigger>
              <TabsTrigger value="records">
                <FileHeart className="h-4 w-4 mr-1" />
                My Records
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <Clock className="h-4 w-4 mr-1" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="medications">
                <Pill className="h-4 w-4 mr-1" />
                Medications
              </TabsTrigger>
              <TabsTrigger value="wallet">
                <Wallet className="h-4 w-4 mr-1" />
                Wallet
              </TabsTrigger>
              <TabsTrigger value="privacy">
                <Shield className="h-4 w-4 mr-1" />
                Privacy
              </TabsTrigger>
              <TabsTrigger value="communities">
                <Users className="h-4 w-4 mr-1" />
                Communities
              </TabsTrigger>
              <TabsTrigger value="monitoring">
                <Bluetooth className="h-4 w-4 mr-1" />
                Monitoring
              </TabsTrigger>
              <TabsTrigger value="messages">
                <MessageSquare className="h-4 w-4 mr-1" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="marketplace">
                <ShoppingCart className="h-4 w-4 mr-1" />
                Marketplace
              </TabsTrigger>
              <TabsTrigger value="wellness">
                <Activity className="h-4 w-4 mr-1" />
                Wellness
              </TabsTrigger>
              <TabsTrigger value="report">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Report
              </TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="queue">Queue</TabsTrigger>
              <TabsTrigger value="emergency" className="text-destructive">
                <AlertTriangle className="h-4 w-4 mr-1" />
                SOS
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Home Dashboard */}
          <TabsContent value="home">
            <div className="space-y-4">
              {/* Welcome + Quick Actions */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="md:col-span-2">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback className="text-lg">JD</AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-xl font-bold">{MOCK_PATIENT.name}</h2>
                        <p className="text-sm text-muted-foreground">{MOCK_PATIENT.healthId}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {quickActions.map(action => (
                        <Button
                          key={action.id}
                          variant="outline"
                          className="h-16 flex flex-col items-center justify-center gap-1 relative"
                          onClick={() => setActiveTab(action.id === "messages" ? "home" : action.id === "appointment" ? "appointments" : action.id)}
                        >
                          <div className={`p-1.5 rounded-md ${action.color}`}>
                            <action.icon className="h-4 w-4 text-primary-foreground" />
                          </div>
                          <span className="text-xs">{action.label}</span>
                          {action.badge && action.badge > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive">
                              {action.badge}
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="h-5 w-5 text-primary" />
                      <span className="font-medium">Health Wallet</span>
                    </div>
                    <p className="text-3xl font-bold">${MOCK_PATIENT.walletBalance.toFixed(2)}</p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" className="flex-1" onClick={() => setActiveTab("wallet")}>
                        Add Funds
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Pay
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:bg-accent/50" onClick={() => setActiveTab("appointments")}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Calendar className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{MOCK_PATIENT.upcomingAppointments}</p>
                      <p className="text-xs text-muted-foreground">Upcoming visits</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-accent/50" onClick={() => setActiveTab("medications")}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Pill className="h-8 w-8 text-warning" />
                    <div>
                      <p className="text-2xl font-bold">{MOCK_PATIENT.pendingRefills}</p>
                      <p className="text-xs text-muted-foreground">Refills needed</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-accent/50" onClick={() => setActiveTab("records")}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <FileText className="h-8 w-8 text-info" />
                    <div>
                      <p className="text-2xl font-bold">3</p>
                      <p className="text-xs text-muted-foreground">New results</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Telehealth Quick Access */}
              <Card className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Video className="h-4 w-4 text-primary" />
                    Need Care Now?
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex gap-3">
                  <Button className="flex-1">
                    <Video className="h-4 w-4 mr-2" />
                    Start Video Visit
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Provider
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="health-id">
            <HealthIdManager hasHealthId={true} />
          </TabsContent>

          <TabsContent value="appointments">
            <PortalAppointments />
          </TabsContent>

          <TabsContent value="records">
            <PortalPHRHub />
          </TabsContent>

          <TabsContent value="timeline">
            <PortalHealthTimeline />
          </TabsContent>

          <TabsContent value="medications">
            <PortalMedications />
          </TabsContent>

          <TabsContent value="wallet">
            <PortalWallet />
          </TabsContent>

          <TabsContent value="privacy">
            <PortalConsentDashboard />
          </TabsContent>

          <TabsContent value="communities">
            <PortalCommunities />
          </TabsContent>

          <TabsContent value="monitoring">
            <PortalRemoteMonitoring />
          </TabsContent>

          <TabsContent value="messages">
            <PortalSecureMessaging />
          </TabsContent>

          <TabsContent value="marketplace">
            <PortalMarketplace />
          </TabsContent>

          <TabsContent value="wellness">
            <PortalWellness />
          </TabsContent>

          <TabsContent value="report">
            <PortalHealthReporting />
          </TabsContent>

          <TabsContent value="services">
            <ServiceDiscovery />
          </TabsContent>

          <TabsContent value="queue">
            <PortalQueueStatus patientId="mock-patient-id" />
          </TabsContent>

          <TabsContent value="emergency">
            <EmergencySOS />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
