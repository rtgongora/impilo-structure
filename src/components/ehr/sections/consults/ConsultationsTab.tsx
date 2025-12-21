import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Clock, CheckCircle, Video, MessageSquare, 
  RefreshCw, ThumbsUp, ThumbsDown, User, Calendar
} from "lucide-react";

interface ConsultationsTabProps {
  onJoinTeleconsult: (consultId: string) => void;
}

const MOCK_CONSULTS = [
  {
    id: "C1",
    specialty: "Endocrinology",
    reason: "Diabetes management review - HbA1c 9.2%, recurrent hypoglycemia episodes",
    status: "pending",
    priority: "routine",
    requestedDate: "2024-12-21 09:00",
    requestedBy: "Dr. Mwangi",
    preferredMode: "async",
    keyQuestion: "Should we consider switching from sulfonylurea to DPP-4 inhibitor given hypoglycemia risk?",
  },
  {
    id: "C2",
    specialty: "Infectious Disease",
    reason: "Recurrent UTI evaluation - 4 episodes in 6 months, resistant E. coli",
    status: "scheduled",
    priority: "urgent",
    requestedDate: "2024-12-20 14:00",
    scheduledDate: "2024-12-22 10:00",
    requestedBy: "Dr. Mwangi",
    preferredMode: "teleconsult",
    keyQuestion: "Recommend prophylaxis regimen and need for urological workup?",
  },
  {
    id: "C3",
    specialty: "Cardiology",
    reason: "New heart failure management - EF 35%, NYHA Class III",
    status: "completed",
    priority: "urgent",
    requestedDate: "2024-12-19 11:00",
    completedDate: "2024-12-20 09:00",
    requestedBy: "Dr. Ochieng",
    preferredMode: "in-person",
    response: "Initiate sacubitril/valsartan after ACEi washout. Target HR <70 with beta-blocker uptitration. Consider CRT evaluation.",
    implementedStatus: "accepted",
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

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "emergency": return "text-destructive";
    case "urgent": return "text-warning";
    case "routine": return "text-muted-foreground";
    default: return "text-muted-foreground";
  }
};

export function ConsultationsTab({ onJoinTeleconsult }: ConsultationsTabProps) {
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
        {MOCK_CONSULTS.map((consult) => (
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
                  
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Key Question:</p>
                    <p className="text-sm italic">"{consult.keyQuestion}"</p>
                  </div>

                  {consult.response && (
                    <div className="p-3 bg-success/5 border border-success/20 rounded-md">
                      <p className="text-xs font-medium text-success mb-1">Consultant Response:</p>
                      <p className="text-sm">{consult.response}</p>
                      {consult.implementedStatus && (
                        <div className="flex items-center gap-2 mt-2">
                          {consult.implementedStatus === "accepted" ? (
                            <Badge variant="outline" className="text-success border-success">
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              Recommendations Accepted
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-destructive border-destructive">
                              <ThumbsDown className="w-3 h-3 mr-1" />
                              Not Implemented
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {consult.requestedBy}
                    </span>
                    <span>Requested: {consult.requestedDate}</span>
                    {consult.scheduledDate && (
                      <span className="text-primary">Scheduled: {consult.scheduledDate}</span>
                    )}
                    {consult.completedDate && (
                      <span className="text-success">Completed: {consult.completedDate}</span>
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
                {consult.status === "scheduled" && (
                  <Button size="sm" onClick={() => onJoinTeleconsult(consult.id)}>
                    <Video className="w-3 h-3 mr-1" />
                    Join Teleconsult
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
