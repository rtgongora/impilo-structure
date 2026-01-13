import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Bluetooth,
  Trophy,
  Building2,
  Megaphone,
  ScanLine,
  Store
} from "lucide-react";

// Portal components
import { EmergencySOS } from "@/components/portal/EmergencySOS";
import { PortalQueueStatus } from "@/components/portal/PortalQueueStatus";
import { HealthIdManager } from "@/components/portal/HealthIdManager";
import { ServiceDiscovery } from "@/components/portal/ServiceDiscovery";
import { PortalConsentDashboard } from "@/components/portal/modules/PortalConsentDashboard";
import { PortalHealthTimeline } from "@/components/portal/modules/PortalHealthTimeline";
import { PortalMedications } from "@/components/portal/modules/PortalMedications";
import { PortalAppointments } from "@/components/portal/modules/PortalAppointments";
import { PortalWallet } from "@/components/portal/modules/PortalWallet";
import { PortalCommunities } from "@/components/portal/modules/PortalCommunities";
import { PortalRemoteMonitoring } from "@/components/portal/modules/PortalRemoteMonitoring";
import { PortalSecureMessaging } from "@/components/portal/modules/PortalSecureMessaging";
import { PortalMarketplace } from "@/components/portal/modules/PortalMarketplace";
import { PortalWellness } from "@/components/portal/modules/PortalWellness";

// Social components
import { TimelineFeed } from "@/components/social/TimelineFeed";
import { CommunitiesList } from "@/components/social/CommunitiesList";
import { ClubsList } from "@/components/social/ClubsList";
import { ProfessionalPages } from "@/components/social/ProfessionalPages";
import { CrowdfundingCampaigns } from "@/components/social/CrowdfundingCampaigns";
import { NewsFeedWidget } from "@/components/social/NewsFeedWidget";
import { HealthDocumentScanner } from "@/components/documents/HealthDocumentScanner";

const MOCK_PATIENT = {
  name: "John Doe",
  healthId: "HID-0000000001-AB12-3",
  phone: "+263 77 123 4567",
  walletBalance: 1250.00,
  unreadMessages: 3,
  upcomingAppointments: 2,
  pendingRefills: 1
};

type PersonalSection = 'health' | 'social';

export function PersonalHub() {
  const [activeSection, setActiveSection] = useState<PersonalSection>('health');
  const [activeHealthTab, setActiveHealthTab] = useState("home");
  const [activeSocialTab, setActiveSocialTab] = useState<'timeline' | 'communities' | 'clubs' | 'pages' | 'crowdfunding'>('timeline');
  const navigate = useNavigate();
  const unreadCount = MOCK_PATIENT.unreadMessages;

  const quickActions = [
    { id: "appointment", label: "Book Visit", icon: Calendar, color: "bg-primary" },
    { id: "telehealth", label: "Video Call", icon: Video, color: "bg-success" },
    { id: "prescriptions", label: "Refill Rx", icon: Pill, color: "bg-warning" },
    { id: "messages", label: "Messages", icon: MessageSquare, color: "bg-info", badge: unreadCount },
  ];

  const socialNavItems = [
    { id: 'timeline' as const, label: 'Timeline', icon: MessageSquare, description: 'Your health feed' },
    { id: 'communities' as const, label: 'Communities', icon: Users, description: 'Support groups' },
    { id: 'clubs' as const, label: 'Clubs', icon: Trophy, description: 'Wellness & fitness' },
    { id: 'pages' as const, label: 'Pages', icon: Building2, description: 'Professionals' },
    { id: 'crowdfunding' as const, label: 'Fundraising', icon: Megaphone, description: 'Support causes' },
  ];

  const renderSocialContent = () => {
    switch (activeSocialTab) {
      case 'timeline':
        return <TimelineFeed />;
      case 'communities':
        return <CommunitiesList onSelectCommunity={() => {}} />;
      case 'clubs':
        return <ClubsList onSelectClub={() => {}} />;
      case 'pages':
        return <ProfessionalPages onSelectPage={() => {}} />;
      case 'crowdfunding':
        return <CrowdfundingCampaigns />;
      default:
        return <TimelineFeed />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Section Toggle - Health vs Social */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={activeSection === 'health' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSection('health')}
          className={activeSection === 'health' ? 'bg-pink-500 hover:bg-pink-600' : ''}
        >
          <Heart className="h-4 w-4 mr-2" />
          My Health
        </Button>
        <Button
          variant={activeSection === 'social' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSection('social')}
          className={activeSection === 'social' ? 'bg-purple-500 hover:bg-purple-600' : ''}
        >
          <Users className="h-4 w-4 mr-2" />
          Social Hub
        </Button>
        <div className="flex-1" />
        <HealthDocumentScanner variant="button" className="h-9" />
      </div>

      {/* Health Section */}
      {activeSection === 'health' && (
        <div className="flex-1 overflow-auto">
          <Tabs value={activeHealthTab} onValueChange={setActiveHealthTab}>
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
                            onClick={() => setActiveHealthTab(action.id === "messages" ? "home" : action.id === "appointment" ? "appointments" : action.id)}
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
                      <p className="text-2xl font-bold">${MOCK_PATIENT.walletBalance.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mb-3">Available balance</p>
                      <Button size="sm" className="w-full" onClick={() => setActiveHealthTab("wallet")}>
                        Add Funds
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveHealthTab("appointments")}>
                    <CardContent className="p-4 text-center">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{MOCK_PATIENT.upcomingAppointments}</p>
                      <p className="text-xs text-muted-foreground">Upcoming Visits</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveHealthTab("medications")}>
                    <CardContent className="p-4 text-center">
                      <Pill className="h-8 w-8 mx-auto mb-2 text-warning" />
                      <p className="text-2xl font-bold">{MOCK_PATIENT.pendingRefills}</p>
                      <p className="text-xs text-muted-foreground">Pending Refills</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveHealthTab("messages")}>
                    <CardContent className="p-4 text-center">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-info" />
                      <p className="text-2xl font-bold">{unreadCount}</p>
                      <p className="text-xs text-muted-foreground">Unread Messages</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveSection('social')}>
                    <CardContent className="p-4 text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                      <p className="text-2xl font-bold">5</p>
                      <p className="text-xs text-muted-foreground">Communities</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Social Hub Quick Access */}
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-200/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Social Hub</h3>
                          <p className="text-xs text-muted-foreground">Communities, timeline & more</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setActiveSection('social')}
                        className="border-purple-500/30 hover:bg-purple-500 hover:text-white"
                      >
                        View All
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {socialNavItems.slice(0, 4).map(item => (
                        <Button
                          key={item.id}
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={() => {
                            setActiveSection('social');
                            setActiveSocialTab(item.id);
                          }}
                        >
                          <item.icon className="h-4 w-4 mr-1" />
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Health ID Tab */}
            <TabsContent value="health-id">
              <HealthIdManager />
            </TabsContent>

            {/* Appointments Tab */}
            <TabsContent value="appointments">
              <PortalAppointments />
            </TabsContent>

            {/* Records/Timeline Tab */}
            <TabsContent value="records">
              <PortalHealthTimeline />
            </TabsContent>

            {/* Medications Tab */}
            <TabsContent value="medications">
              <PortalMedications />
            </TabsContent>

            {/* Wallet Tab */}
            <TabsContent value="wallet">
              <PortalWallet />
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy">
              <PortalConsentDashboard />
            </TabsContent>

            {/* Remote Monitoring Tab */}
            <TabsContent value="monitoring">
              <PortalRemoteMonitoring />
            </TabsContent>

            {/* Secure Messaging Tab */}
            <TabsContent value="messages">
              <PortalSecureMessaging />
            </TabsContent>

            {/* Marketplace Tab */}
            <TabsContent value="marketplace">
              <PortalMarketplace />
            </TabsContent>

            {/* Wellness Tab */}
            <TabsContent value="wellness">
              <PortalWellness />
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services">
              <ServiceDiscovery />
            </TabsContent>

            {/* Queue Tab */}
            <TabsContent value="queue">
              <PortalQueueStatus />
            </TabsContent>

            {/* Emergency Tab */}
            <TabsContent value="emergency">
              <EmergencySOS />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Social Section */}
      {activeSection === 'social' && (
        <div className="flex-1 overflow-auto">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left Sidebar Navigation */}
            <div className="hidden lg:block w-64 shrink-0">
              <Card className="sticky top-4">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Social Hub</CardTitle>
                      <CardDescription className="text-xs">Connect & share</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-2">
                  <nav className="space-y-1">
                    {socialNavItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveSocialTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                          activeSocialTab === item.id
                            ? 'bg-purple-500/10 text-purple-600 font-medium'
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <item.icon className={`h-5 w-5 ${activeSocialTab === item.id ? 'text-purple-500' : ''}`} />
                        <div>
                          <p className="text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>

              {/* Marketplace Quick Access */}
              <Card className="mt-4 bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-200/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <Store className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Marketplace</p>
                      <p className="text-xs text-muted-foreground">Shop health products</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full border-green-500/30 hover:bg-green-500 hover:text-white"
                    onClick={() => {
                      setActiveSection('health');
                      setActiveHealthTab('marketplace');
                    }}
                  >
                    Browse Products
                  </Button>
                </CardContent>
              </Card>

              {/* Back to Health */}
              <Card className="mt-4 bg-gradient-to-br from-pink-500/5 to-rose-500/5 border-pink-200/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                      <Heart className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Health Portal</p>
                      <p className="text-xs text-muted-foreground">Records & appointments</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full border-pink-500/30 hover:bg-pink-500 hover:text-white"
                    onClick={() => setActiveSection('health')}
                  >
                    View Health
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              {/* Mobile Navigation */}
              <div className="lg:hidden mb-3">
                <ScrollArea className="w-full">
                  <div className="flex gap-1.5 pb-2">
                    {socialNavItems.map((item) => (
                      <Button
                        key={item.id}
                        variant={activeSocialTab === item.id ? "default" : "outline"}
                        size="sm"
                        className={`text-xs h-8 px-2.5 ${activeSocialTab === item.id ? "bg-purple-500 hover:bg-purple-600" : ""}`}
                        onClick={() => setActiveSocialTab(item.id)}
                      >
                        <item.icon className="h-3.5 w-3.5 mr-1" />
                        {item.label}
                      </Button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>

              {/* Section Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {(() => {
                    const currentItem = socialNavItems.find(item => item.id === activeSocialTab);
                    const Icon = currentItem?.icon || MessageSquare;
                    return (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{currentItem?.label}</h3>
                          <p className="text-sm text-muted-foreground">{currentItem?.description}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Content */}
              {renderSocialContent()}
            </div>

            {/* Right Sidebar */}
            <div className="hidden xl:block w-80 shrink-0">
              <div className="sticky top-4 space-y-4">
                <NewsFeedWidget />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}