import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  ClipboardList,
  Clock,
  CheckCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface PendingHandoff {
  id: string;
  outgoing_user_id: string;
  shift_date: string;
  shift_time: string;
  general_notes: string | null;
  patient_ids: string[] | null;
  created_at: string;
  outgoing_name?: string;
}

export function HandoffNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingHandoffs, setPendingHandoffs] = useState<PendingHandoff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPendingHandoffs();
      subscribeToHandoffs();
    }
  }, [user]);

  const fetchPendingHandoffs = async () => {
    try {
      const { data: handoffs, error } = await supabase
        .from("shift_handoffs")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch outgoing user names
      if (handoffs && handoffs.length > 0) {
        const userIds = [...new Set(handoffs.map((h) => h.outgoing_user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);

        const profileMap: Record<string, string> = {};
        (profiles || []).forEach((p) => {
          profileMap[p.user_id] = p.display_name;
        });

        const enrichedHandoffs = handoffs.map((h) => ({
          ...h,
          outgoing_name: profileMap[h.outgoing_user_id] || "Unknown",
        }));

        setPendingHandoffs(enrichedHandoffs);
      } else {
        setPendingHandoffs([]);
      }
    } catch (error) {
      console.error("Error fetching handoffs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToHandoffs = () => {
    const channel = supabase
      .channel("handoff-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shift_handoffs",
        },
        (payload) => {
          console.log("Handoff change:", payload);
          fetchPendingHandoffs();

          if (payload.eventType === "INSERT" && payload.new.status === "pending") {
            toast.info("New shift handoff pending", {
              description: "A colleague has submitted a handoff for your review",
              action: {
                label: "View",
                onClick: () => navigate("/handoff"),
              },
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const acceptHandoff = async (handoffId: string) => {
    if (!user) return;

    setIsAccepting(handoffId);
    try {
      const { error } = await supabase
        .from("shift_handoffs")
        .update({
          incoming_user_id: user.id,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", handoffId);

      if (error) throw error;

      toast.success("Handoff accepted successfully");
      fetchPendingHandoffs();
    } catch (error) {
      console.error("Error accepting handoff:", error);
      toast.error("Failed to accept handoff");
    } finally {
      setIsAccepting(null);
    }
  };

  const unreadCount = pendingHandoffs.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Pending Handoffs</h4>
            <Badge variant="outline">{unreadCount} pending</Badge>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : pendingHandoffs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No pending handoffs</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {pendingHandoffs.map((handoff) => (
                  <div
                    key={handoff.id}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <ClipboardList className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {handoff.outgoing_name}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {handoff.shift_time}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {handoff.patient_ids?.length || 0} pts
                      </Badge>
                    </div>

                    {handoff.general_notes && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {handoff.general_notes}
                      </p>
                    )}

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate("/handoff")}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => acceptHandoff(handoff.id)}
                        disabled={isAccepting === handoff.id}
                      >
                        {isAccepting === handoff.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate("/handoff")}
          >
            View All Handoffs
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
