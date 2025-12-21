import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Building2, Ambulance, ArrowRight, User, 
  FileText, Calendar, ExternalLink, RefreshCw, CheckCircle
} from "lucide-react";

interface ReferralsTabProps {
  onNewReferral: () => void;
  onCompleteReferral: (referralId: string) => void;
}

const MOCK_REFERRALS = [
  {
    id: "R1",
    destination: "Kenyatta National Hospital - Diabetes Clinic",
    department: "Endocrinology",
    reason: "Outpatient diabetes management - insulin initiation counseling",
    status: "pending",
    stage: 2,
    urgency: "routine",
    createdDate: "2024-12-21",
    createdBy: "Dr. Mwangi",
    transportMode: "self",
    attachments: ["Lab results", "Previous notes"],
  },
  {
    id: "R2",
    destination: "Nairobi Women's Hospital",
    department: "Urology",
    reason: "Recurrent UTI workup - consider cystoscopy",
    status: "accepted",
    stage: 5,
    urgency: "urgent",
    createdDate: "2024-12-20",
    createdBy: "Dr. Mwangi",
    expectedDate: "2024-12-23",
    transportMode: "self",
    attachments: ["Urine C&S", "USS KUB"],
  },
  {
    id: "R3",
    destination: "Mater Hospital - Cardiology",
    department: "Cardiology",
    reason: "CRT device evaluation",
    status: "completed",
    stage: 7,
    urgency: "routine",
    createdDate: "2024-12-15",
    completedDate: "2024-12-19",
    createdBy: "Dr. Ochieng",
    outcome: "Patient scheduled for CRT-D implantation on 2024-12-28",
    transportMode: "self",
  },
];

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

export function ReferralsTab({ onNewReferral, onCompleteReferral }: ReferralsTabProps) {
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
        {MOCK_REFERRALS.map((referral) => (
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
                    <h4 className="font-semibold">{referral.destination}</h4>
                    <p className="text-xs text-muted-foreground">{referral.department}</p>
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
                      {referral.stage}/7 - {getStageLabel(referral.stage)}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                      <div
                        key={s}
                        className={`h-1.5 flex-1 rounded-full ${
                          s <= referral.stage
                            ? s === referral.stage
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
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {referral.createdBy}
                    </span>
                    <span>Created: {referral.createdDate}</span>
                    <span className="flex items-center gap-1">
                      {referral.transportMode === "ambulance" ? (
                        <Ambulance className="w-3 h-3" />
                      ) : (
                        <ArrowRight className="w-3 h-3" />
                      )}
                      {referral.transportMode === "ambulance" ? "Ambulance" : "Self-transport"}
                    </span>
                  </div>

                  {referral.attachments && referral.attachments.length > 0 && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Attachments:</span>
                      {referral.attachments.map((att, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {att}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {referral.expectedDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-3 h-3 text-primary" />
                      <span className="text-primary">Expected appointment: {referral.expectedDate}</span>
                    </div>
                  )}

                  {referral.outcome && (
                    <div className="p-3 bg-success/5 border border-success/20 rounded-md">
                      <p className="text-xs font-medium text-success mb-1">Outcome:</p>
                      <p className="text-sm">{referral.outcome}</p>
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
                {referral.stage >= 6 && referral.status !== "completed" && (
                  <Button size="sm" onClick={() => onCompleteReferral(referral.id)}>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Complete Loop
                  </Button>
                )}
                {referral.status === "pending" && (
                  <Button variant="outline" size="sm" className="text-destructive">
                    Cancel Referral
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}

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
