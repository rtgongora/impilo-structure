import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Clock,
  Users,
  Bell,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  X,
  MapPin,
  Calendar,
  ChevronRight,
  Ticket,
  RefreshCw,
  MessageSquare,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  useClientQueue,
  ClientQueueItem,
  ClientQueueNotification,
  ClientQueueRequest,
} from "@/hooks/useClientQueue";

interface PortalQueueStatusProps {
  patientId?: string;
}

export function PortalQueueStatus({ patientId }: PortalQueueStatusProps) {
  const {
    queueItems,
    notifications,
    requests,
    loading,
    unreadCount,
    refetch,
    markNotificationRead,
    acknowledgeNotification,
    stepOutOfQueue,
    cancelQueueEntry,
    resumeInQueue,
    cancelRequest,
  } = useClientQueue(patientId);

  const [activeTab, setActiveTab] = useState("status");
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: "step_out" | "cancel" | null;
    itemId: string | null;
  }>({ open: false, type: null, itemId: null });
  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const getPositionBadge = (band: string) => {
    switch (band) {
      case "next":
        return <Badge className="bg-success text-success-foreground">Next</Badge>;
      case "soon":
        return <Badge className="bg-primary text-primary-foreground">Soon</Badge>;
      case "later":
        return <Badge variant="secondary">Later</Badge>;
      default:
        return <Badge variant="outline">--</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return <Badge variant="outline" className="text-blue-600">Waiting</Badge>;
      case "called":
        return <Badge className="bg-purple-600 animate-pulse">Called - Please Proceed</Badge>;
      case "in_service":
        return <Badge className="bg-success text-success-foreground">Being Served</Badge>;
      case "paused":
        return <Badge variant="secondary">Stepped Out</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAction = async () => {
    if (!actionDialog.itemId || !actionDialog.type) return;

    setActionLoading(true);
    try {
      if (actionDialog.type === "step_out") {
        await stepOutOfQueue(actionDialog.itemId, actionReason);
      } else if (actionDialog.type === "cancel") {
        await cancelQueueEntry(actionDialog.itemId, actionReason);
      }
      setActionDialog({ open: false, type: null, itemId: null });
      setActionReason("");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeItems = queueItems.filter((q) => q.status !== "completed");
  const calledItem = activeItems.find((q) => q.status === "called");

  return (
    <div className="space-y-6">
      {/* Called Alert */}
      {calledItem && (
        <Alert className="border-purple-500 bg-purple-50 dark:bg-purple-950/30">
          <Bell className="h-4 w-4 text-purple-600" />
          <AlertTitle className="text-purple-700 dark:text-purple-400">
            You've Been Called!
          </AlertTitle>
          <AlertDescription className="text-purple-600 dark:text-purple-300">
            Please proceed to <strong>{calledItem.queue_name}</strong> at{" "}
            <strong>{calledItem.facility_name}</strong>. Ticket:{" "}
            <strong>{calledItem.ticket_number}</strong>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Queue Status</h2>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Current Queue
            {activeItems.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeItems.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-destructive ml-1">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            My Requests
          </TabsTrigger>
        </TabsList>

        {/* Current Queue Tab */}
        <TabsContent value="status" className="mt-4">
          {activeItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">No Active Queue Entries</h3>
                <p className="text-muted-foreground mb-4">
                  You're not currently in any queues.
                </p>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Check Appointments
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeItems.map((item) => (
                <QueueItemCard
                  key={item.id}
                  item={item}
                  onStepOut={() =>
                    setActionDialog({ open: true, type: "step_out", itemId: item.id })
                  }
                  onCancel={() =>
                    setActionDialog({ open: true, type: "cancel", itemId: item.id })
                  }
                  onResume={() => resumeInQueue(item.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-4">
          <NotificationsList
            notifications={notifications}
            onRead={markNotificationRead}
            onAcknowledge={acknowledgeNotification}
          />
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="mt-4">
          <RequestsList requests={requests} onCancel={cancelRequest} />
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog({ open: false, type: null, itemId: null });
            setActionReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "step_out" ? "Step Out of Queue" : "Cancel Queue Entry"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "step_out"
                ? "Your position will be held temporarily. Please return within 15 minutes."
                : "This will remove you from the queue. You may need to re-register."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Let us know why..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, type: null, itemId: null })}
            >
              Keep My Place
            </Button>
            <Button
              variant={actionDialog.type === "cancel" ? "destructive" : "default"}
              onClick={handleAction}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionDialog.type === "step_out" ? "Step Out" : "Cancel Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Queue Item Card Component
function QueueItemCard({
  item,
  onStepOut,
  onCancel,
  onResume,
}: {
  item: ClientQueueItem;
  onStepOut: () => void;
  onCancel: () => void;
  onResume: () => void;
}) {
  const getPositionBadge = (band: string) => {
    switch (band) {
      case "next":
        return <Badge className="bg-success text-success-foreground">Next</Badge>;
      case "soon":
        return <Badge className="bg-primary text-primary-foreground">Soon</Badge>;
      case "later":
        return <Badge variant="secondary">Later</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Waiting</Badge>;
      case "called":
        return (
          <Badge className="bg-purple-600 text-white animate-pulse">
            Called - Please Proceed!
          </Badge>
        );
      case "in_service":
        return <Badge className="bg-success text-success-foreground">Being Served</Badge>;
      case "paused":
        return <Badge variant="secondary">Stepped Out</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className={item.status === "called" ? "border-purple-500 shadow-lg" : ""}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Queue Token */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">{item.ticket_number}</span>
            </div>
            <div>
              <h3 className="font-semibold">{item.queue_name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {item.facility_name}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(item.status)}
                {item.status === "waiting" && getPositionBadge(item.position_band)}
              </div>
            </div>
          </div>

          {/* Wait Info */}
          {item.status === "waiting" && (
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Position</p>
                <p className="text-2xl font-bold">#{item.position}</p>
              </div>
              {item.estimated_wait_minutes && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Est. Wait</p>
                  <p className="text-2xl font-bold">~{item.estimated_wait_minutes}m</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {item.status === "waiting" && (
              <>
                <Button variant="outline" size="sm" onClick={onStepOut}>
                  <Pause className="h-4 w-4 mr-1" />
                  Step Out
                </Button>
                <Button variant="ghost" size="sm" onClick={onCancel}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </>
            )}
            {item.status === "paused" && (
              <Button size="sm" onClick={onResume}>
                <Play className="h-4 w-4 mr-1" />
                I'm Back
              </Button>
            )}
            {item.status === "called" && (
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                <ArrowRight className="h-4 w-4 mr-1" />
                Navigate
              </Button>
            )}
          </div>
        </div>

        {/* Called notice */}
        {item.status === "called" && (
          <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-center">
            <p className="text-purple-700 dark:text-purple-300 font-medium">
              🔔 Please proceed to the service point now
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Notifications List Component
function NotificationsList({
  notifications,
  onRead,
  onAcknowledge,
}: {
  notifications: ClientQueueNotification[];
  onRead: (id: string) => void;
  onAcknowledge: (id: string) => void;
}) {
  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg mb-2">No Notifications</h3>
          <p className="text-muted-foreground">
            You'll receive updates about your queue status here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "proceed_to_service":
        return <ArrowRight className="h-5 w-5 text-purple-600" />;
      case "queue_confirmation":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "delay_notice":
        return <Clock className="h-5 w-5 text-warning" />;
      case "service_complete":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3">
        {notifications.map((notif) => (
          <Card
            key={notif.id}
            className={!notif.read_at ? "bg-muted/50" : ""}
            onClick={() => !notif.read_at && onRead(notif.id)}
          >
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="mt-1">{getNotificationIcon(notif.notification_type)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium">{notif.title}</h4>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notif.sent_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                  {notif.requires_action && !notif.acknowledged_at && (
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcknowledge(notif.id);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Acknowledge
                    </Button>
                  )}
                </div>
                {!notif.read_at && <div className="h-2 w-2 rounded-full bg-primary" />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

// Requests List Component
function RequestsList({
  requests,
  onCancel,
}: {
  requests: ClientQueueRequest[];
  onCancel: (id: string) => void;
}) {
  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg mb-2">No Queue Requests</h3>
          <p className="text-muted-foreground">
            Submit a request to join a queue remotely before your visit.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600">Pending Review</Badge>;
      case "approved":
        return <Badge className="bg-success text-success-foreground">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "checked_in":
        return <Badge className="bg-primary text-primary-foreground">Checked In</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <Card key={req.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{req.service_type}</h4>
                  {getStatusBadge(req.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {req.facility_name} • {format(new Date(req.requested_date), "PPP")}
                </p>
                {req.rejection_reason && (
                  <p className="text-sm text-destructive mt-1">
                    Reason: {req.rejection_reason}
                  </p>
                )}
              </div>
              {req.status === "pending" && (
                <Button variant="ghost" size="sm" onClick={() => onCancel(req.id)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
