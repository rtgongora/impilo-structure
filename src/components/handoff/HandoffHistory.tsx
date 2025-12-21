import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  Clock,
  User,
  Calendar,
  ArrowRight,
  FileText,
  Users,
  Loader2,
  Eye,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShiftHandoff {
  id: string;
  outgoing_user_id: string;
  incoming_user_id: string | null;
  shift_date: string;
  shift_time: string;
  general_notes: string | null;
  status: string;
  patient_ids: string[] | null;
  created_at: string;
  completed_at: string | null;
}

interface UserProfile {
  user_id: string;
  display_name: string;
}

const statusConfig: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  draft: { color: "bg-muted text-muted-foreground", icon: FileText, label: "Draft" },
  pending: { color: "bg-amber-500/10 text-amber-500", icon: Clock, label: "Pending" },
  completed: { color: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle, label: "Completed" },
};

export function HandoffHistory() {
  const [handoffs, setHandoffs] = useState<ShiftHandoff[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHandoff, setSelectedHandoff] = useState<ShiftHandoff | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    fetchHandoffs();
  }, []);

  const fetchHandoffs = async () => {
    setIsLoading(true);
    try {
      const { data: handoffsData, error: handoffsError } = await supabase
        .from("shift_handoffs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (handoffsError) throw handoffsError;

      // Get unique user IDs to fetch profiles
      const userIds = new Set<string>();
      (handoffsData || []).forEach((h) => {
        userIds.add(h.outgoing_user_id);
        if (h.incoming_user_id) userIds.add(h.incoming_user_id);
      });

      if (userIds.size > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", Array.from(userIds));

        if (profilesError) throw profilesError;

        const profileMap: Record<string, string> = {};
        (profilesData || []).forEach((p: UserProfile) => {
          profileMap[p.user_id] = p.display_name;
        });
        setProfiles(profileMap);
      }

      setHandoffs(handoffsData || []);
    } catch (error) {
      console.error("Error fetching handoffs:", error);
      toast.error("Failed to load handoff history");
    } finally {
      setIsLoading(false);
    }
  };

  const openDetail = (handoff: ShiftHandoff) => {
    setSelectedHandoff(handoff);
    setShowDetailDialog(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Handoff History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {handoffs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No handoff records found</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {handoffs.map((handoff) => {
                  const statusInfo = statusConfig[handoff.status] || statusConfig.pending;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div
                      key={handoff.id}
                      className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => openDetail(handoff)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ClipboardList className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {profiles[handoff.outgoing_user_id] || "Unknown"}
                              </span>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {handoff.incoming_user_id
                                  ? profiles[handoff.incoming_user_id] || "Unknown"
                                  : "Pending"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(handoff.shift_date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {handoff.shift_time}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {handoff.patient_ids?.length || 0} patients
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {handoff.general_notes && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2 pl-13">
                          {handoff.general_notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Handoff Details
            </DialogTitle>
          </DialogHeader>

          {selectedHandoff && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex justify-center">
                <Badge
                  variant="outline"
                  className={`${statusConfig[selectedHandoff.status]?.color} text-sm px-4 py-1`}
                >
                  {statusConfig[selectedHandoff.status]?.label || selectedHandoff.status}
                </Badge>
              </div>

              {/* Shift Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <User className="h-4 w-4" />
                    Outgoing
                  </div>
                  <p className="font-medium">{profiles[selectedHandoff.outgoing_user_id] || "Unknown"}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <User className="h-4 w-4" />
                    Incoming
                  </div>
                  <p className="font-medium">
                    {selectedHandoff.incoming_user_id
                      ? profiles[selectedHandoff.incoming_user_id] || "Unknown"
                      : "Pending acceptance"}
                  </p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {new Date(selectedHandoff.shift_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {selectedHandoff.shift_time}
                </div>
              </div>

              {/* Patients Count */}
              <div className="p-3 rounded-lg border text-center">
                <div className="flex items-center justify-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{selectedHandoff.patient_ids?.length || 0}</span>
                </div>
                <p className="text-sm text-muted-foreground">Patients Included</p>
              </div>

              {/* General Notes */}
              {selectedHandoff.general_notes && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4" />
                    General Notes
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-sm">
                    {selectedHandoff.general_notes}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Created: {new Date(selectedHandoff.created_at).toLocaleString()}</p>
                {selectedHandoff.completed_at && (
                  <p>Completed: {new Date(selectedHandoff.completed_at).toLocaleString()}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
