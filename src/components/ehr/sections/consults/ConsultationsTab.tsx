import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Clock, CheckCircle, Video, MessageSquare, 
  RefreshCw, ThumbsUp, ThumbsDown, User, Calendar, Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface ConsultationsTabProps {
  patientId?: string;
  encounterId?: string;
  onJoinTeleconsult: (consultId: string) => void;
}

interface Consultation {
  id: string;
  specialty: string;
  reason: string;
  status: string;
  priority: string;
  requestedDate: string;
  requestedBy: string;
  preferredMode: string;
  keyQuestion?: string;
  scheduledDate?: string;
  completedDate?: string;
  response?: string;
  implementedStatus?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending": return "secondary";
    case "scheduled": return "default";
    case "accepted": return "default";
    case "completed": return "outline";
    case "rejected": return "destructive";
    default: return "secondary";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "emergency": return "text-destructive";
    case "urgent": return "text-warning";
    case "routine": return "text-muted-foreground";
    default: return "text-muted-foreground";
  }
};

export function ConsultationsTab({ patientId, encounterId, onJoinTeleconsult }: ConsultationsTabProps) {
  const [consults, setConsults] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConsults = async () => {
      if (!patientId) {
        setConsults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch consultation-type referrals for this patient
        const { data, error } = await supabase
          .from("referrals")
          .select("*")
          .eq("patient_id", patientId)
          .eq("referral_type", "consultation")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const mapped: Consultation[] = (data || []).map((ref) => ({
          id: ref.id,
          specialty: ref.to_department,
          reason: ref.reason,
          status: ref.status,
          priority: ref.urgency,
          requestedDate: ref.requested_at,
          requestedBy: ref.requested_by || "Unknown",
          preferredMode: "teleconsult",
          keyQuestion: ref.clinical_summary,
          scheduledDate: ref.accepted_at || undefined,
          completedDate: ref.completed_at || undefined,
          response: ref.completion_notes || undefined,
        }));

        setConsults(mapped);
      } catch (err) {
        console.error("Error fetching consultations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConsults();
  }, [patientId]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Consultation Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Consultation Requests</CardTitle>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Request Consult
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {consults.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No consultations for this patient</p>
            <Button variant="outline" size="sm" className="mt-4">
              <Plus className="w-4 h-4 mr-1" />
              Request first consultation
            </Button>
          </div>
        ) : (
          consults.map((consult) => (
            <div
              key={consult.id}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      consult.status === "pending" ? "bg-warning/10" : 
                      consult.status === "completed" ? "bg-success/10" : "bg-primary/10"
                    }`}>
                      {consult.status === "pending" ? (
                        <Clock className="w-4 h-4 text-warning" />
                      ) : consult.status === "completed" ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <Calendar className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">{consult.specialty}</h4>
                      <p className={`text-xs ${getPriorityColor(consult.priority)} capitalize`}>
                        {consult.priority} priority
                      </p>
                    </div>
                    <Badge variant={getStatusColor(consult.status) as any} className="capitalize ml-auto">
                      {consult.status}
                    </Badge>
                  </div>

                  <div className="pl-11 space-y-2">
                    <p className="text-sm text-muted-foreground">{consult.reason}</p>
                    
                    {consult.keyQuestion && (
                      <div className="p-3 bg-muted/50 rounded-md">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Clinical Summary:</p>
                        <p className="text-sm italic">"{consult.keyQuestion}"</p>
                      </div>
                    )}

                    {consult.response && (
                      <div className="p-3 bg-success/5 border border-success/20 rounded-md">
                        <p className="text-xs font-medium text-success mb-1">Consultant Response:</p>
                        <p className="text-sm">{consult.response}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {consult.requestedBy}
                      </span>
                      <span>Requested: {new Date(consult.requestedDate).toLocaleDateString()}</span>
                      {consult.scheduledDate && (
                        <span className="text-primary">Scheduled: {new Date(consult.scheduledDate).toLocaleDateString()}</span>
                      )}
                      {consult.completedDate && (
                        <span className="text-success">Completed: {new Date(consult.completedDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {consult.status !== "completed" && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <Button variant="outline" size="sm">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Add Note
                  </Button>
                  {consult.status === "pending" && (
                    <Button variant="outline" size="sm">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Follow Up
                    </Button>
                  )}
                  {(consult.status === "scheduled" || consult.status === "accepted") && (
                    <Button size="sm" onClick={() => onJoinTeleconsult(consult.id)}>
                      <Video className="w-3 h-3 mr-1" />
                      Join Teleconsult
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
