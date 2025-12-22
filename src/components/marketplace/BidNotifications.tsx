import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Package,
  Award,
  XCircle,
  Gavel,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface BidNotification {
  id: string;
  vendor_id: string | null;
  user_id: string | null;
  fulfillment_request_id: string | null;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

const notificationIcons: Record<string, typeof Bell> = {
  new_request: Package,
  bid_placed: Gavel,
  bid_awarded: Award,
  bid_rejected: XCircle,
  request_cancelled: XCircle,
};

const notificationColors: Record<string, string> = {
  new_request: "text-blue-500 bg-blue-500/10",
  bid_placed: "text-yellow-500 bg-yellow-500/10",
  bid_awarded: "text-green-500 bg-green-500/10",
  bid_rejected: "text-red-500 bg-red-500/10",
  request_cancelled: "text-muted-foreground bg-muted",
};

interface BidNotificationsProps {
  vendorId?: string;
}

export function BidNotifications({ vendorId }: BidNotificationsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["bid-notifications", vendorId, user?.id],
    queryFn: async () => {
      let query = supabase
        .from("bid_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (vendorId) {
        query = query.eq("vendor_id", vendorId);
      } else if (user?.id) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BidNotification[];
    },
    enabled: !!user || !!vendorId,
    refetchInterval: 30000, // Refresh every 30s
  });

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("bid_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bid-notifications"] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from("bid_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", unreadIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bid-notifications"] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <>
              <BellRing className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            </>
          ) : (
            <Bell className="h-5 w-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              {markAllAsRead.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all read
                </>
              )}
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.notification_type] || Bell;
                const colorClass = notificationColors[notification.notification_type] || "text-muted-foreground bg-muted";

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                      !notification.is_read && "bg-primary/5"
                    )}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsRead.mutate(notification.id);
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      <div className={cn("p-2 rounded-full shrink-0", colorClass)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-sm font-medium", !notification.is_read && "font-semibold")}>
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// Helper function to create bid notification
export async function createBidNotification({
  vendorId,
  userId,
  fulfillmentRequestId,
  notificationType,
  title,
  message,
  metadata,
}: {
  vendorId?: string;
  userId?: string;
  fulfillmentRequestId?: string;
  notificationType: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  const insertData = {
    vendor_id: vendorId || null,
    user_id: userId || null,
    fulfillment_request_id: fulfillmentRequestId || null,
    notification_type: notificationType,
    title,
    message,
    metadata: metadata || null,
  };
  
  const { error } = await supabase.from("bid_notifications").insert(insertData as any);

  if (error) throw error;
}
