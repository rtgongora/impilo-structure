import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Video, Phone, MessageSquare, Clock, Calendar, 
  ExternalLink, Plus, User
} from "lucide-react";

interface TeleconsultsTabProps {
  onJoinTeleconsult: (consultId: string) => void;
  onNewReferral: () => void;
}

const MOCK_TELECONSULTS = [
  {
    id: "T1",
    specialty: "Dermatology",
    consultant: "Dr. Wanjiku",
    mode: "video",
    status: "scheduled",
    scheduledDate: "2024-12-21 14:00",
    duration: "30 min",
    reason: "Chronic skin lesion evaluation",
    referralId: "R-001",
  },
  {
    id: "T2",
    specialty: "Nephrology",
    consultant: "Dr. Kimani",
    mode: "audio",
    status: "completed",
    completedDate: "2024-12-20 10:00",
    duration: "25 min",
    reason: "CKD staging and management",
    summary: "Stage 3b CKD confirmed. Recommend dietary counseling, ACEi optimization, and 3-monthly monitoring.",
    referralId: "R-002",
  },
  {
    id: "T3",
    specialty: "Psychiatry",
    consultant: "Dr. Omondi",
    mode: "video",
    status: "in-progress",
    startedAt: "2024-12-21 11:30",
    duration: "45 min",
    reason: "Depression follow-up and medication review",
    referralId: "R-003",
  },
];

const getModeIcon = (mode: string) => {
  switch (mode) {
    case "video": return <Video className="w-4 h-4" />;
    case "audio": return <Phone className="w-4 h-4" />;
    case "chat": return <MessageSquare className="w-4 h-4" />;
    default: return <MessageSquare className="w-4 h-4" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "scheduled": return <Badge variant="default">Scheduled</Badge>;
    case "in-progress": return <Badge className="bg-success text-success-foreground animate-pulse">In Progress</Badge>;
    case "completed": return <Badge variant="outline">Completed</Badge>;
    case "cancelled": return <Badge variant="destructive">Cancelled</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
};

export function TeleconsultsTab({ onJoinTeleconsult, onNewReferral }: TeleconsultsTabProps) {
  const activeSession = MOCK_TELECONSULTS.find(t => t.status === "in-progress");
  const upcomingSessions = MOCK_TELECONSULTS.filter(t => t.status === "scheduled");

  return (
    <div className="space-y-4">
      {/* Active Session Alert */}
      {activeSession && (
        <Card className="border-success bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-success/20 animate-pulse">
                  {getModeIcon(activeSession.mode)}
                </div>
                <div>
                  <p className="font-semibold text-success">Active Teleconsultation</p>
                  <p className="text-sm text-muted-foreground">
                    {activeSession.specialty} with {activeSession.consultant}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Started at {activeSession.startedAt}
                  </p>
                </div>
              </div>
              <Button onClick={() => onJoinTeleconsult(activeSession.id)}>
                <Video className="w-4 h-4 mr-2" />
                Rejoin Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingSessions.map((session) => (
              <div 
                key={session.id} 
                className="flex items-center justify-between p-3 bg-background rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    {getModeIcon(session.mode)}
                  </div>
                  <div>
                    <p className="font-medium">{session.specialty}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.consultant} • {session.scheduledDate}
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={() => onJoinTeleconsult(session.id)}>
                  Join
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* All Teleconsultations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Teleconsultation Sessions</CardTitle>
          <Button size="sm" onClick={onNewReferral}>
            <Video className="w-4 h-4 mr-1" />
            Schedule Teleconsult
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {MOCK_TELECONSULTS.map((teleconsult) => (
            <div
              key={teleconsult.id}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      teleconsult.status === "in-progress" ? "bg-success/10" : 
                      teleconsult.status === "scheduled" ? "bg-primary/10" : "bg-muted"
                    }`}>
                      {getModeIcon(teleconsult.mode)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{teleconsult.specialty}</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {teleconsult.consultant}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {teleconsult.mode}
                      </Badge>
                      {getStatusBadge(teleconsult.status)}
                    </div>
                  </div>

                  <div className="pl-11 space-y-2">
                    <p className="text-sm text-muted-foreground">{teleconsult.reason}</p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {teleconsult.duration}
                      </span>
                      {teleconsult.scheduledDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {teleconsult.scheduledDate}
                        </span>
                      )}
                      {teleconsult.completedDate && (
                        <span className="text-success">
                          Completed: {teleconsult.completedDate}
                        </span>
                      )}
                    </div>

                    {teleconsult.summary && (
                      <div className="p-3 bg-success/5 border border-success/20 rounded-md">
                        <p className="text-xs font-medium text-success mb-1">Session Summary:</p>
                        <p className="text-sm">{teleconsult.summary}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {teleconsult.status !== "completed" && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  {teleconsult.status === "scheduled" && (
                    <Button size="sm" onClick={() => onJoinTeleconsult(teleconsult.id)}>
                      <Video className="w-3 h-3 mr-1" />
                      Join Session
                    </Button>
                  )}
                  {teleconsult.status === "in-progress" && (
                    <Button size="sm" onClick={() => onJoinTeleconsult(teleconsult.id)}>
                      <Video className="w-3 h-3 mr-1" />
                      Rejoin Session
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Referral
                  </Button>
                </div>
              )}
            </div>
          ))}

          {/* Quick Connect Section */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3">Quick Connect</p>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="flex flex-col h-auto py-3" onClick={onNewReferral}>
                <Video className="w-5 h-5 mb-1" />
                <span className="text-xs">Video Call</span>
              </Button>
              <Button variant="outline" className="flex flex-col h-auto py-3" onClick={onNewReferral}>
                <Phone className="w-5 h-5 mb-1" />
                <span className="text-xs">Audio Call</span>
              </Button>
              <Button variant="outline" className="flex flex-col h-auto py-3" onClick={onNewReferral}>
                <MessageSquare className="w-5 h-5 mb-1" />
                <span className="text-xs">Chat</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
