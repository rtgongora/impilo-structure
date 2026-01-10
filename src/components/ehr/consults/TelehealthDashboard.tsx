import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Video,
  Phone,
  MessageSquare,
  Clock,
  Calendar,
  FileText,
  Users,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  User,
  Building,
  ChevronRight,
  Inbox,
  PhoneCall,
  Timer,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { TelehealthWorkItem, TelemedicineMode, ReferralUrgency } from "@/types/telehealth";

interface TelehealthDashboardProps {
  providerId?: string;
  facilityId?: string;
  onBack?: () => void;
  onAcceptCase?: (workItem: TelehealthWorkItem) => void;
  onViewCase?: (workItem: TelehealthWorkItem) => void;
  onOpenAsyncReview?: (referral: any) => void;
  onJoinSession?: (consultId: string) => void;
}

const MODE_ICONS: Record<TelemedicineMode, React.ComponentType<{ className?: string }>> = {
  async: FileText,
  chat: MessageSquare,
  audio: Phone,
  video: Video,
  scheduled: Calendar,
  board: Users,
};

const URGENCY_STYLES: Record<ReferralUrgency, { badge: string; text: string }> = {
  routine: { badge: "bg-muted text-muted-foreground", text: "Routine" },
  urgent: { badge: "bg-warning/20 text-warning", text: "Urgent" },
  stat: { badge: "bg-destructive/20 text-destructive", text: "STAT" },
  emergency: { badge: "bg-destructive text-destructive-foreground animate-pulse", text: "EMERGENCY" },
};

export function TelehealthDashboard({ 
  providerId, 
  facilityId, 
  onBack,
  onAcceptCase, 
  onViewCase,
  onOpenAsyncReview,
  onJoinSession,
}: TelehealthDashboardProps) {
  const [workItems, setWorkItems] = useState<TelehealthWorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("referrals");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadWorkItems();
  }, [providerId, facilityId]);

  const loadWorkItems = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration - in production, fetch from API
      const mockItems: TelehealthWorkItem[] = [
        {
          workItemId: "1",
          type: "referral",
          referralId: "REF-2025-001",
          patientName: "Nokuthula Dube",
          patientAge: 29,
          patientHID: "PHID-ZW-2025-123456",
          priority: "urgent",
          fromFacilityName: "Gokwe North District Hospital",
          fromProviderName: "Dr. Sibongile Moyo",
          timeWaitingMinutes: 37,
          requestedModes: ["video", "async"],
          status: "pending",
          specialty: "Cardiology",
          reason: "Chest pain with ECG changes, needs specialist review",
        },
        {
          workItemId: "2",
          type: "emergency",
          referralId: "REF-2025-002",
          patientName: "Tatenda Chirwa",
          patientAge: 45,
          patientHID: "PHID-ZW-2025-789012",
          priority: "emergency",
          fromFacilityName: "Mutare Provincial Hospital",
          fromProviderName: "Dr. Peter Chikwava",
          timeWaitingMinutes: 5,
          requestedModes: ["video", "audio"],
          status: "pending",
          specialty: "Neurology",
          reason: "Acute stroke - urgent teleconsult needed",
        },
        {
          workItemId: "3",
          type: "appointment",
          referralId: "REF-2025-003",
          patientName: "Rumbidzai Mhaka",
          patientAge: 34,
          patientHID: "PHID-ZW-2025-345678",
          priority: "routine",
          fromFacilityName: "Harare Central Hospital",
          fromProviderName: "Dr. Grace Mutasa",
          timeWaitingMinutes: 0,
          requestedModes: ["video"],
          status: "accepted",
          scheduledAt: new Date(Date.now() + 3600000).toISOString(),
          specialty: "Dermatology",
          reason: "Follow-up for chronic skin condition",
        },
        {
          workItemId: "4",
          type: "chat",
          referralId: "REF-2025-004",
          patientName: "Farai Ndlovu",
          patientAge: 52,
          patientHID: "PHID-ZW-2025-901234",
          priority: "routine",
          fromFacilityName: "Gweru Provincial Hospital",
          fromProviderName: "Dr. Tendai Ncube",
          timeWaitingMinutes: 15,
          requestedModes: ["chat"],
          status: "in_progress",
          specialty: "Internal Medicine",
          reason: "Query regarding medication adjustment",
        },
        {
          workItemId: "5",
          type: "case_review",
          referralId: "REF-2025-005",
          patientName: "Chipo Maposa",
          patientAge: 28,
          patientHID: "PHID-ZW-2025-567890",
          priority: "urgent",
          fromFacilityName: "Parirenyatwa Hospital",
          fromProviderName: "Dr. Sarah Moyo",
          timeWaitingMinutes: 0,
          requestedModes: ["board"],
          status: "accepted",
          scheduledAt: new Date(Date.now() + 7200000).toISOString(),
          specialty: "Oncology",
          reason: "MDT case review for newly diagnosed breast cancer",
        },
        {
          workItemId: "6",
          type: "referral",
          referralId: "REF-2025-006",
          patientName: "Kudakwashe Moyo",
          patientAge: 67,
          patientHID: "PHID-ZW-2025-234567",
          priority: "routine",
          fromFacilityName: "Chipinge District Hospital",
          fromProviderName: "Dr. James Makoni",
          timeWaitingMinutes: 120,
          requestedModes: ["async"],
          status: "pending",
          specialty: "Radiology",
          reason: "CT interpretation needed - possible abdominal mass",
        },
      ];
      
      setWorkItems(mockItems);
    } catch (error) {
      console.error("Error loading telehealth workitems:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterByTab = (items: TelehealthWorkItem[], tab: string) => {
    switch (tab) {
      case "referrals":
        return items.filter(i => i.type === "referral" && i.status === "pending");
      case "appointments":
        return items.filter(i => i.type === "appointment" || i.scheduledAt);
      case "instant":
        return items.filter(i => i.type === "emergency" || i.priority === "emergency");
      case "chats":
        return items.filter(i => i.type === "chat" || i.requestedModes.includes("chat"));
      case "boards":
        return items.filter(i => i.type === "case_review" || i.requestedModes.includes("board"));
      default:
        return items;
    }
  };

  const filteredItems = filterByTab(workItems, activeTab).filter(item =>
    searchQuery === "" ||
    item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.fromProviderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabCounts = {
    referrals: workItems.filter(i => i.type === "referral" && i.status === "pending").length,
    appointments: workItems.filter(i => i.type === "appointment" || i.scheduledAt).length,
    instant: workItems.filter(i => i.type === "emergency" || i.priority === "emergency").length,
    chats: workItems.filter(i => i.type === "chat" || i.requestedModes.includes("chat")).length,
    boards: workItems.filter(i => i.type === "case_review" || i.requestedModes.includes("board")).length,
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5 text-primary" />
                Telehealth Dashboard
              </CardTitle>
              <CardDescription>
                Manage incoming referrals and consultations
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadWorkItems} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients, providers, specialties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="referrals" className="relative">
              <FileText className="h-4 w-4 mr-1" />
              Referrals
              {tabCounts.referrals > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {tabCounts.referrals}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="appointments">
              <Calendar className="h-4 w-4 mr-1" />
              Appointments
              {tabCounts.appointments > 0 && (
                <Badge variant="outline" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {tabCounts.appointments}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="instant" className="relative">
              <PhoneCall className="h-4 w-4 mr-1" />
              Instant
              {tabCounts.instant > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] animate-pulse">
                  {tabCounts.instant}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="chats">
              <MessageSquare className="h-4 w-4 mr-1" />
              Chats
              {tabCounts.chats > 0 && (
                <Badge variant="outline" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {tabCounts.chats}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="boards">
              <Users className="h-4 w-4 mr-1" />
              Case Reviews
              {tabCounts.boards > 0 && (
                <Badge variant="outline" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {tabCounts.boards}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="flex-1 pt-4">
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="space-y-3">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Inbox className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No items in this category</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <WorkItemCard
                    key={item.workItemId}
                    item={item}
                    onAccept={() => onAcceptCase(item)}
                    onView={() => onViewCase(item)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Tabs>
    </Card>
  );
}

function WorkItemCard({ 
  item, 
  onAccept, 
  onView 
}: { 
  item: TelehealthWorkItem; 
  onAccept: () => void; 
  onView: () => void;
}) {
  const urgencyStyle = URGENCY_STYLES[item.priority];
  const isEmergency = item.priority === "emergency";

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all hover:shadow-md",
        isEmergency && "border-destructive bg-destructive/5 animate-pulse-slow"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Patient Avatar */}
        <Avatar className="h-12 w-12">
          <AvatarFallback className={cn(isEmergency && "bg-destructive text-destructive-foreground")}>
            {item.patientName.split(" ").map(n => n[0]).join("")}
          </AvatarFallback>
        </Avatar>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                {item.patientName}
                <span className="text-sm font-normal text-muted-foreground">
                  ({item.patientAge}y)
                </span>
                {isEmergency && <AlertTriangle className="h-4 w-4 text-destructive" />}
              </h4>
              <p className="text-sm text-muted-foreground">{item.patientHID}</p>
            </div>
            <Badge className={urgencyStyle.badge}>{urgencyStyle.text}</Badge>
          </div>

          <div className="mt-2 space-y-1">
            <p className="text-sm">{item.reason}</p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                {item.fromFacilityName}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {item.fromProviderName}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <Badge variant="outline" className="text-xs">
                {item.specialty}
              </Badge>
              
              <div className="flex items-center gap-1">
                {item.requestedModes.map((mode) => {
                  const Icon = MODE_ICONS[mode];
                  return (
                    <div key={mode} className="p-1 rounded bg-muted" title={mode}>
                      <Icon className="h-3 w-3" />
                    </div>
                  );
                })}
              </div>

              {item.timeWaitingMinutes > 0 && (
                <span className={cn(
                  "flex items-center gap-1",
                  item.timeWaitingMinutes > 60 && "text-warning",
                  item.timeWaitingMinutes > 120 && "text-destructive"
                )}>
                  <Timer className="h-3 w-3" />
                  {item.timeWaitingMinutes}m waiting
                </span>
              )}

              {item.scheduledAt && (
                <span className="flex items-center gap-1 text-primary">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(item.scheduledAt), "HH:mm")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {item.status === "pending" && (
            <Button size="sm" onClick={onAccept}>
              Accept
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {item.status === "accepted" && (
            <Button size="sm" onClick={onView}>
              {item.scheduledAt ? "Join" : "Open"}
            </Button>
          )}
          {item.status === "in_progress" && (
            <Button size="sm" variant="default" className="bg-success hover:bg-success/90" onClick={onView}>
              <Video className="h-4 w-4 mr-1" />
              Rejoin
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onView}>
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
