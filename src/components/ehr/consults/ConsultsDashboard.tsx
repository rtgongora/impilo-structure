import { useState } from "react";
import {
  Inbox,
  Send,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  TrendingUp,
  User,
  Building,
  Filter,
  Search,
  RefreshCw,
  ChevronRight,
  Phone,
  Video,
  FileText
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  useProviderContext, 
  WorklistItem, 
  getDepartmentLabel, 
  getStageLabel,
  getStageNumber 
} from "@/contexts/ProviderContext";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ConsultsDashboardProps {
  onOpenReferral?: (referral: WorklistItem) => void;
  onNewReferral?: () => void;
}

export function ConsultsDashboard({ onOpenReferral, onNewReferral }: ConsultsDashboardProps) {
  const { provider, worklist, stats } = useProviderContext();
  const [activeTab, setActiveTab] = useState("incoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredWorklist = worklist.filter(item => {
    // Tab filter
    if (activeTab === "incoming" && item.type !== "referral-received") return false;
    if (activeTab === "outgoing" && item.type !== "referral-sent" && item.type !== "pending-completion") return false;
    if (activeTab === "in-session" && item.stage !== "in-session" && item.stage !== "response-pending") return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !item.patientName.toLowerCase().includes(query) &&
        !item.mrn.toLowerCase().includes(query) &&
        !item.chiefComplaint.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Urgency filter
    if (urgencyFilter !== "all" && item.urgency !== urgencyFilter) return false;

    // Status filter
    if (statusFilter !== "all" && item.status !== statusFilter) return false;

    return true;
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "emergency": return "bg-destructive text-destructive-foreground";
      case "stat": return "bg-destructive/80 text-destructive-foreground";
      case "urgent": return "bg-warning text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/50">Pending</Badge>;
      case "accepted": return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/50">Accepted</Badge>;
      case "in-progress": return <Badge variant="outline" className="bg-info/10 text-info border-info/50">In Progress</Badge>;
      case "response-submitted": return <Badge variant="outline" className="bg-success/10 text-success border-success/50">Response Ready</Badge>;
      case "completed": return <Badge className="bg-success">Completed</Badge>;
      case "closed": return <Badge variant="secondary">Closed</Badge>;
      case "declined": return <Badge variant="destructive">Declined</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Provider Context Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{provider.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="w-4 h-4" />
                  <span>{getDepartmentLabel(provider.department)}</span>
                  <span>•</span>
                  <span>{provider.unit}</span>
                  <span>•</span>
                  <span>{provider.facility.name}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {provider.onCallStatus && (
                <Badge className="bg-success">On Call</Badge>
              )}
              <Button onClick={onNewReferral}>
                <Send className="w-4 h-4 mr-2" />
                New Referral
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-6 gap-3">
        <Card className={cn("cursor-pointer hover:ring-2 hover:ring-primary/50", stats.pendingIncoming > 0 && "bg-warning/5 border-warning/30")}>
          <CardContent className="p-3 text-center">
            <Inbox className={cn("w-5 h-5 mx-auto mb-1", stats.pendingIncoming > 0 ? "text-warning" : "text-muted-foreground")} />
            <div className={cn("text-2xl font-bold", stats.pendingIncoming > 0 && "text-warning")}>{stats.pendingIncoming}</div>
            <div className="text-xs text-muted-foreground">Incoming</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 hover:ring-primary/50">
          <CardContent className="p-3 text-center">
            <Send className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{stats.pendingOutgoing}</div>
            <div className="text-xs text-muted-foreground">Outgoing</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 hover:ring-primary/50 bg-primary/5 border-primary/30">
          <CardContent className="p-3 text-center">
            <MessageSquare className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold text-primary">{stats.inSession}</div>
            <div className="text-xs text-muted-foreground">In Session</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 hover:ring-primary/50">
          <CardContent className="p-3 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{stats.awaitingResponse}</div>
            <div className="text-xs text-muted-foreground">Awaiting Response</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 hover:ring-primary/50">
          <CardContent className="p-3 text-center">
            <CheckCircle className="w-5 h-5 mx-auto mb-1 text-success" />
            <div className="text-2xl font-bold text-success">{stats.completedToday}</div>
            <div className="text-xs text-muted-foreground">Completed Today</div>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer hover:ring-2 hover:ring-primary/50", stats.urgentCount > 0 && "bg-destructive/5 border-destructive/30")}>
          <CardContent className="p-3 text-center">
            <AlertTriangle className={cn("w-5 h-5 mx-auto mb-1", stats.urgentCount > 0 ? "text-destructive" : "text-muted-foreground")} />
            <div className={cn("text-2xl font-bold", stats.urgentCount > 0 && "text-destructive")}>{stats.urgentCount}</div>
            <div className="text-xs text-muted-foreground">Urgent</div>
          </CardContent>
        </Card>
      </div>

      {/* Worklist Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="incoming" className="flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              Incoming
              {stats.pendingIncoming > 0 && (
                <Badge variant="secondary" className="ml-1">{stats.pendingIncoming}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Sent by Me
            </TabsTrigger>
            <TabsTrigger value="in-session" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Active Sessions
              {stats.inSession > 0 && (
                <Badge variant="secondary" className="ml-1">{stats.inSession}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-9 w-60"
              />
            </div>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="stat">STAT</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="routine">Routine</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="incoming" className="m-0">
          <WorklistTable 
            items={filteredWorklist} 
            onItemClick={onOpenReferral}
            emptyMessage="No incoming referrals"
          />
        </TabsContent>

        <TabsContent value="outgoing" className="m-0">
          <WorklistTable 
            items={filteredWorklist} 
            onItemClick={onOpenReferral}
            emptyMessage="No sent referrals"
          />
        </TabsContent>

        <TabsContent value="in-session" className="m-0">
          <WorklistTable 
            items={filteredWorklist} 
            onItemClick={onOpenReferral}
            emptyMessage="No active sessions"
            showSessionActions
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface WorklistTableProps {
  items: WorklistItem[];
  onItemClick?: (item: WorklistItem) => void;
  emptyMessage: string;
  showSessionActions?: boolean;
}

function WorklistTable({ items, onItemClick, emptyMessage, showSessionActions }: WorklistTableProps) {
  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "emergency": 
        return <Badge variant="destructive" className="animate-pulse">EMERGENCY</Badge>;
      case "stat": 
        return <Badge variant="destructive">STAT</Badge>;
      case "urgent": 
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/50">Urgent</Badge>;
      default: 
        return <Badge variant="outline">Routine</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/50">Pending</Badge>;
      case "accepted": return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/50">Accepted</Badge>;
      case "in-progress": return <Badge variant="outline" className="bg-info/10 text-info border-info/50">In Session</Badge>;
      case "response-submitted": return <Badge variant="outline" className="bg-success/10 text-success border-success/50">Response Ready</Badge>;
      case "completed": return <Badge className="bg-success">Completed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Card 
          key={item.id}
          className={cn(
            "cursor-pointer hover:shadow-md transition-all hover:ring-1 hover:ring-primary/50",
            item.urgency === "emergency" && "border-destructive/50 bg-destructive/5",
            item.urgency === "stat" && "border-destructive/30",
            item.urgency === "urgent" && "border-warning/30"
          )}
          onClick={() => onItemClick?.(item)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {/* Stage Indicator */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                    item.stage === "in-session" || item.stage === "response-pending" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {getStageNumber(item.stage)}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 text-center max-w-16 truncate">
                    {getStageLabel(item.stage)}
                  </span>
                </div>

                {/* Patient Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{item.patientName}</h4>
                    <span className="text-sm text-muted-foreground">
                      {item.patientAge}y {item.patientSex}
                    </span>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{item.mrn}</code>
                    {getUrgencyBadge(item.urgency)}
                    {getStatusBadge(item.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{item.chiefComplaint}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>From: <span className="font-medium text-foreground">{item.fromClinician}</span> ({item.fromFacility})</span>
                    <span>To: <span className="font-medium text-foreground">{item.toTarget}</span></span>
                    <span>Specialty: <span className="font-medium text-foreground">{item.specialty}</span></span>
                  </div>
                </div>

                {/* Timing */}
                <div className="text-right">
                  <div className={cn(
                    "text-sm font-medium",
                    item.waitingTime > 60 && item.status === "pending" && "text-warning",
                    item.waitingTime > 120 && item.status === "pending" && "text-destructive"
                  )}>
                    {item.waitingTime > 0 ? `${Math.floor(item.waitingTime / 60)}h ${item.waitingTime % 60}m` : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {showSessionActions && (
                    <>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Video className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
