/**
 * NotificationsCommsHub — Unified notifications & communications popover
 * for the Utility Strip. Shows general notifications, workspace-scoped
 * alerts, handoff requests, announcements, and quick-reply messaging.
 */
import { useEffect, useState, useCallback } from "react";
import {
  Bell,
  BellOff,
  MessageSquare,
  ClipboardList,
  Megaphone,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Loader2,
  Send,
  X,
  Filter,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// --- Types ---

type NotificationCategory = "system" | "handoff" | "announcement" | "message" | "alert";

interface UnifiedNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  priority: "low" | "normal" | "high" | "critical";
  workspaceScoped: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
}

interface QuickMessage {
  id: string;
  channelName: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

// --- Component ---

export function NotificationsCommsHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isSupported, permission, requestPermission } = usePushNotifications();

  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [messages, setMessages] = useState<QuickMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [filterWorkspace, setFilterWorkspace] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Get workspace context
  const getWorkspaceContext = useCallback(() => {
    try {
      const stored = sessionStorage.getItem("activeWorkspace");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  // Fetch notifications from multiple sources
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const items: UnifiedNotification[] = [];

      // 1. Shift handoffs (pending)
      const { data: handoffs } = await supabase
        .from("shift_handoffs")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(20);

      if (handoffs) {
        // Get names for handoff users
        const userIds = [...new Set(handoffs.map((h) => h.outgoing_user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);
        const nameMap: Record<string, string> = {};
        (profiles || []).forEach((p) => {
          nameMap[p.user_id] = p.display_name || "Unknown";
        });

        handoffs.forEach((h) => {
          items.push({
            id: `handoff-${h.id}`,
            category: "handoff",
            title: "Shift Handoff",
            body: `${nameMap[h.outgoing_user_id] || "A colleague"} submitted a handoff (${h.patient_ids?.length || 0} patients)`,
            timestamp: h.created_at,
            isRead: false,
            priority: "high",
            workspaceScoped: true,
            actionUrl: "/handoff",
            actionLabel: "Review",
          });
        });
      }

      // 2. Announcements (active, not expired)
      const { data: announcements } = await supabase
        .from("announcements")
        .select("*")
        .not("published_at", "is", null)
        .order("published_at", { ascending: false })
        .limit(10);

      if (announcements) {
        // Check which ones user has acknowledged
        const { data: acks } = await supabase
          .from("announcement_acknowledgments")
          .select("announcement_id")
          .eq("user_id", user.id);
        const ackedIds = new Set((acks || []).map((a) => a.announcement_id));

        announcements.forEach((a) => {
          const isExpired = a.expires_at && new Date(a.expires_at) < new Date();
          if (isExpired) return;

          items.push({
            id: `announce-${a.id}`,
            category: "announcement",
            title: a.title,
            body: a.content.substring(0, 120) + (a.content.length > 120 ? "…" : ""),
            timestamp: a.published_at!,
            isRead: ackedIds.has(a.id),
            priority: a.priority === "urgent" ? "critical" : a.priority === "high" ? "high" : "normal",
            workspaceScoped: false,
            metadata: {
              isPinned: a.is_pinned,
              requiresAck: a.requires_acknowledgment,
              announcementId: a.id,
            },
          });
        });
      }

      // 3. Bid/system notifications
      const { data: bidNotifs } = await supabase
        .from("bid_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(15);

      if (bidNotifs) {
        bidNotifs.forEach((n) => {
          items.push({
            id: `bid-${n.id}`,
            category: "system",
            title: n.title,
            body: n.message,
            timestamp: n.created_at,
            isRead: n.is_read || false,
            priority: "normal",
            workspaceScoped: false,
          });
        });
      }

      // Sort by timestamp descending, then by priority
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      items.sort((a, b) => {
        if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
        const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (pDiff !== 0) return pDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      setNotifications(items);

      // 4. Recent messages (quick view)
      const { data: channelMembers } = await supabase
        .from("channel_members")
        .select("channel_id")
        .eq("user_id", user.id)
        .limit(10);

      if (channelMembers && channelMembers.length > 0) {
        const channelIds = channelMembers.map((cm) => cm.channel_id);
        const { data: recentMsgs } = await supabase
          .from("messages")
          .select("id, content, created_at, sender_id, channel_id")
          .in("channel_id", channelIds)
          .neq("sender_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (recentMsgs && recentMsgs.length > 0) {
          const senderIds = [...new Set(recentMsgs.map((m) => m.sender_id))];
          const { data: senderProfiles } = await supabase
            .from("profiles")
            .select("user_id, display_name")
            .in("user_id", senderIds);
          const senderMap: Record<string, string> = {};
          (senderProfiles || []).forEach((p) => {
            senderMap[p.user_id] = p.display_name || "Unknown";
          });

          const { data: channels } = await supabase
            .from("message_channels")
            .select("id, name")
            .in("id", channelIds);
          const channelMap: Record<string, string> = {};
          (channels || []).forEach((c) => {
            channelMap[c.id] = c.name || "Direct";
          });

          const msgItems: QuickMessage[] = recentMsgs.map((m) => ({
            id: m.id,
            channelName: channelMap[m.channel_id] || "Channel",
            senderName: senderMap[m.sender_id] || "Unknown",
            content: m.content?.substring(0, 80) || "",
            timestamp: m.created_at,
            isRead: false,
          }));

          setMessages(msgItems);
        }
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && isOpen) {
      fetchNotifications();
    }
  }, [user, isOpen, fetchNotifications]);

  // Realtime subscription for new handoffs
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("utility-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "shift_handoffs" },
        () => {
          if (isOpen) fetchNotifications();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "announcements" },
        () => {
          if (isOpen) fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isOpen, fetchNotifications]);

  // Acknowledge announcement
  const acknowledgeAnnouncement = async (announcementId: string) => {
    if (!user) return;
    try {
      await supabase.from("announcement_acknowledgments").insert({
        announcement_id: announcementId,
        user_id: user.id,
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === `announce-${announcementId}` ? { ...n, isRead: true } : n
        )
      );
      toast.success("Announcement acknowledged");
    } catch {
      // Might already be acknowledged
    }
  };

  // Mark bid notification read
  const markRead = async (notif: UnifiedNotification) => {
    if (notif.category === "system" && notif.id.startsWith("bid-")) {
      const realId = notif.id.replace("bid-", "");
      await supabase
        .from("bid_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", realId);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
  };

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filterWorkspace && !n.workspaceScoped) return false;
    if (activeTab === "all") return true;
    return n.category === activeTab;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const unreadMessages = messages.filter((m) => !m.isRead).length;
  const totalUnread = unreadCount + unreadMessages;
  const hasCritical = notifications.some(
    (n) => !n.isRead && (n.priority === "critical" || n.priority === "high")
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 w-7 p-0 relative",
            hasCritical && !isMuted && "text-destructive"
          )}
        >
          <Bell className="h-3.5 w-3.5" />
          {totalUnread > 0 && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 h-4 min-w-[1rem] px-0.5 flex items-center justify-center rounded-full text-[9px] font-bold",
                hasCritical
                  ? "bg-destructive text-destructive-foreground animate-pulse"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[400px] p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">Notifications & Comms</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-7 w-7", filterWorkspace && "bg-accent")}
                  onClick={() => setFilterWorkspace(!filterWorkspace)}
                >
                  <Filter className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {filterWorkspace ? "Show all" : "Workspace only"}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? (
                    <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isMuted ? "Unmute" : "Mute sounds"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-9 px-2">
            <TabsTrigger value="all" className="text-xs h-7 data-[state=active]:shadow-none">
              All
            </TabsTrigger>
            <TabsTrigger value="handoff" className="text-xs h-7 data-[state=active]:shadow-none gap-1">
              <ClipboardList className="h-3 w-3" />
              Handoffs
            </TabsTrigger>
            <TabsTrigger value="announcement" className="text-xs h-7 data-[state=active]:shadow-none gap-1">
              <Megaphone className="h-3 w-3" />
              Notices
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-xs h-7 data-[state=active]:shadow-none gap-1">
              <MessageSquare className="h-3 w-3" />
              Messages
              {unreadMessages > 0 && (
                <span className="ml-0.5 h-4 min-w-[1rem] px-0.5 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Notification List */}
          <TabsContent value="all" className="mt-0">
            <NotificationList
              notifications={filteredNotifications}
              isLoading={isLoading}
              onAcknowledge={acknowledgeAnnouncement}
              onMarkRead={markRead}
              onNavigate={(url) => {
                navigate(url);
                setIsOpen(false);
              }}
            />
          </TabsContent>

          <TabsContent value="handoff" className="mt-0">
            <NotificationList
              notifications={filteredNotifications.filter((n) => n.category === "handoff")}
              isLoading={isLoading}
              onAcknowledge={acknowledgeAnnouncement}
              onMarkRead={markRead}
              onNavigate={(url) => {
                navigate(url);
                setIsOpen(false);
              }}
            />
          </TabsContent>

          <TabsContent value="announcement" className="mt-0">
            <NotificationList
              notifications={filteredNotifications.filter((n) => n.category === "announcement")}
              isLoading={isLoading}
              onAcknowledge={acknowledgeAnnouncement}
              onMarkRead={markRead}
              onNavigate={(url) => {
                navigate(url);
                setIsOpen(false);
              }}
            />
          </TabsContent>

          <TabsContent value="messages" className="mt-0">
            <MessageList
              messages={messages}
              isLoading={isLoading}
              onOpenMessaging={() => {
                navigate("/communication");
                setIsOpen(false);
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="border-t border-border px-3 py-2 flex items-center justify-between">
          {isSupported && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 gap-1"
              onClick={async () => {
                if (permission !== "granted") {
                  const granted = await requestPermission();
                  if (granted) toast.success("Push notifications enabled");
                }
              }}
            >
              {permission === "granted" ? (
                <Bell className="h-3 w-3 text-emerald-500" />
              ) : (
                <BellOff className="h-3 w-3" />
              )}
              {permission === "granted" ? "Push on" : "Enable push"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 gap-1 ml-auto"
            onClick={() => {
              navigate("/communication");
              setIsOpen(false);
            }}
          >
            Open Comms Hub
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// --- Sub-Components ---

function NotificationList({
  notifications,
  isLoading,
  onAcknowledge,
  onMarkRead,
  onNavigate,
}: {
  notifications: UnifiedNotification[];
  isLoading: boolean;
  onAcknowledge: (id: string) => void;
  onMarkRead: (n: UnifiedNotification) => void;
  onNavigate: (url: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
        <CheckCircle className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">All caught up</p>
        <p className="text-xs">No new notifications</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[320px]">
      <div className="divide-y divide-border">
        {notifications.map((n) => (
          <NotificationItem
            key={n.id}
            notification={n}
            onAcknowledge={onAcknowledge}
            onMarkRead={onMarkRead}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

function NotificationItem({
  notification: n,
  onAcknowledge,
  onMarkRead,
  onNavigate,
}: {
  notification: UnifiedNotification;
  onAcknowledge: (id: string) => void;
  onMarkRead: (n: UnifiedNotification) => void;
  onNavigate: (url: string) => void;
}) {
  const categoryIcons: Record<NotificationCategory, React.ReactNode> = {
    system: <Bell className="h-3.5 w-3.5" />,
    handoff: <ClipboardList className="h-3.5 w-3.5" />,
    announcement: <Megaphone className="h-3.5 w-3.5" />,
    message: <MessageSquare className="h-3.5 w-3.5" />,
    alert: <AlertTriangle className="h-3.5 w-3.5" />,
  };

  const priorityColors: Record<string, string> = {
    critical: "bg-destructive/10 text-destructive",
    high: "bg-orange-500/10 text-orange-600",
    normal: "bg-primary/10 text-primary",
    low: "bg-muted text-muted-foreground",
  };

  return (
    <div
      className={cn(
        "px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer",
        !n.isRead && "bg-accent/30"
      )}
      onClick={() => {
        if (!n.isRead) onMarkRead(n);
        if (n.actionUrl) onNavigate(n.actionUrl);
      }}
    >
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div
          className={cn(
            "h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
            priorityColors[n.priority]
          )}
        >
          {categoryIcons[n.category]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn("text-sm truncate", !n.isRead && "font-semibold")}>
              {n.title}
            </p>
            {n.workspaceScoped && (
              <Badge variant="outline" className="text-[9px] h-4 shrink-0">
                Workspace
              </Badge>
            )}
            {!n.isRead && (
              <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {n.body}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
            </span>

            {/* Acknowledge button for announcements */}
            {n.category === "announcement" &&
              n.metadata?.requiresAck &&
              !n.isRead && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-5 text-[10px] px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAcknowledge(n.metadata!.announcementId as string);
                  }}
                >
                  Acknowledge
                </Button>
              )}

            {n.actionUrl && n.actionLabel && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-[10px] px-2 text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(n.actionUrl!);
                }}
              >
                {n.actionLabel}
                <ArrowRight className="h-2.5 w-2.5 ml-0.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageList({
  messages,
  isLoading,
  onOpenMessaging,
}: {
  messages: QuickMessage[];
  isLoading: boolean;
  onOpenMessaging: () => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
        <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">No recent messages</p>
        <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={onOpenMessaging}>
          Open Messaging
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[320px]">
      <div className="divide-y divide-border">
        {messages.map((m) => (
          <div
            key={m.id}
            className="px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={onOpenMessaging}
          >
            <div className="flex items-start gap-3">
              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <MessageSquare className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{m.senderName}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(m.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">{m.channelName}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {m.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
