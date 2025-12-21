import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Building2, Ambulance, ArrowRight, User, 
  FileText, Calendar, ExternalLink, RefreshCw, CheckCircle, Loader2
} from "lucide-react";
import { useReferrals } from "@/hooks/useReferralData";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface ReferralsTabProps {
  patientId?: string;
  encounterId?: string;
  onNewReferral: () => void;
  onCompleteReferral: (referralId: string) => void;
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

const getUrgencyBadge = (urgency: string) => {
  switch (urgency) {
    case "emergency": return <Badge variant="destructive">Emergency</Badge>;
    case "urgent": return <Badge className="bg-warning text-warning-foreground">Urgent</Badge>;
    case "routine": return <Badge variant="outline">Routine</Badge>;
    default: return <Badge variant="outline">{urgency}</Badge>;
  }
};

const getStageFromStatus = (status: string): number => {
  switch (status) {
    case "pending": return 2;
    case "accepted": return 4;
    case "in_progress": return 5;
    case "completed": return 7;
    case "rejected": return 0;
    default: return 1;
  }
};

const getStageLabel = (stage: number) => {
  const stages: Record<number, string> = {
    1: "Building Package",
    2: "Consent & Submit",
    3: "Received by Specialist",
    4: "Under Review",
    5: "Teleconsult Scheduled",
    6: "Actions Documented",
    7: "Loop Closed",
  };
  return stages[stage] || `Stage ${stage}`;
};

export function ReferralsTab({ patientId, encounterId, onNewReferral, onCompleteReferral }: ReferralsTabProps) {
  const { referrals, loading, updateReferralStatus } = useReferrals(patientId, encounterId);
  const [completing, setCompleting] = useState<string | null>(null);

  const handleComplete = async (referralId: string) => {
    setCompleting(referralId);
    await updateReferralStatus(referralId, "completed");
    onCompleteReferral(referralId);
    setCompleting(null);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Referral Tracking</CardTitle>
          <Button size="sm" disabled>
            <Plus className="w-4 h-4 mr-1" />
            New Referral
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Referral Tracking</CardTitle>
        <Button size="sm" onClick={onNewReferral}>
          <Plus className="w-4 h-4 mr-1" />
          New Referral
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {referrals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No referrals found</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={onNewReferral}>
              Create first referral
            </Button>
          </div>
        ) : (
          referrals.map((referral) => {
            const stage = getStageFromStatus(referral.status);
            
            return (
              <div
                key={referral.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{referral.to_department}</h4>
                        <p className="text-xs text-muted-foreground">
                          {referral.to_provider_name || "Pending assignment"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getUrgencyBadge(referral.urgency)}
                        <Badge variant={getStatusColor(referral.status) as any} className="capitalize">
                          {referral.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Workflow Stage Indicator */}
                    <div className="pl-11">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Workflow Stage:</span>
                        <Badge variant="outline" className="text-xs">
                          {stage}/7 - {getStageLabel(stage)}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                          <div
                            key={s}
                            className={`h-1.5 flex-1 rounded-full ${
                              s <= stage
                                ? s === stage
                                  ? "bg-primary"
                                  : "bg-success"
                                : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="pl-11 space-y-2">
                      <p className="text-sm">{referral.reason}</p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span>Ref: {referral.referral_number}</span>
                        <span>Created: {format(new Date(referral.requested_at), "dd MMM yyyy")}</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {referral.referral_type}
                        </Badge>
                      </div>

                      {referral.accepted_at && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-3 h-3 text-primary" />
                          <span className="text-primary">
                            Accepted: {format(new Date(referral.accepted_at), "dd MMM yyyy")}
                          </span>
                        </div>
                      )}

                      {referral.completion_notes && (
                        <div className="p-3 bg-success/5 border border-success/20 rounded-md">
                          <p className="text-xs font-medium text-success mb-1">Outcome:</p>
                          <p className="text-sm">{referral.completion_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {referral.status !== "completed" && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Check Status
                    </Button>
                    {stage >= 6 && referral.status !== "completed" && (
                      <Button 
                        size="sm" 
                        onClick={() => handleComplete(referral.id)}
                        disabled={completing === referral.id}
                      >
                        {completing === referral.id ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        )}
                        Complete Loop
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        <div 
          className="p-4 border border-dashed rounded-lg text-center text-muted-foreground hover:bg-muted/30 cursor-pointer transition-colors"
          onClick={onNewReferral}
        >
          <Plus className="w-5 h-5 mx-auto mb-2" />
          Create new referral
        </div>
      </CardContent>
    </Card>
  );
}
