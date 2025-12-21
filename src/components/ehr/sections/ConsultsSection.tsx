import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Users, Send, Clock, CheckCircle, Video, Phone, MessageSquare, 
  FileText, Building2, Ambulance, AlertCircle, ArrowRight, Calendar,
  ExternalLink, RefreshCw, ThumbsUp, ThumbsDown, User
} from "lucide-react";

const MOCK_CONSULTS = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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

const MOCK_REFERRALS = [
  {
    id: 1,
    destination: "Kenyatta National Hospital - Diabetes Clinic",
    department: "Endocrinology",
    reason: "Outpatient diabetes management - insulin initiation counseling",
    status: "pending",
    urgency: "routine",
    createdDate: "2024-12-21",
    createdBy: "Dr. Mwangi",
    transportMode: "self",
    attachments: ["Lab results", "Previous notes"],
  },
  {
    id: 2,
    destination: "Nairobi Women's Hospital",
    department: "Urology",
    reason: "Recurrent UTI workup - consider cystoscopy",
    status: "accepted",
    urgency: "urgent",
    createdDate: "2024-12-20",
    createdBy: "Dr. Mwangi",
    expectedDate: "2024-12-23",
    transportMode: "self",
    attachments: ["Urine C&S", "USS KUB"],
  },
  {
    id: 3,
    destination: "Mater Hospital - Cardiology",
    department: "Cardiology",
    reason: "CRT device evaluation",
    status: "completed",
    urgency: "routine",
    createdDate: "2024-12-15",
    completedDate: "2024-12-19",
    createdBy: "Dr. Ochieng",
    outcome: "Patient scheduled for CRT-D implantation on 2024-12-28",
    transportMode: "self",
  },
];

const MOCK_TELECONSULTS = [
  {
    id: 1,
    specialty: "Dermatology",
    consultant: "Dr. Wanjiku",
    mode: "video",
    status: "scheduled",
    scheduledDate: "2024-12-21 14:00",
    duration: "30 min",
    reason: "Chronic skin lesion evaluation",
  },
  {
    id: 2,
    specialty: "Nephrology",
    consultant: "Dr. Kimani",
    mode: "audio",
    status: "completed",
    completedDate: "2024-12-20 10:00",
    duration: "25 min",
    reason: "CKD staging and management",
    summary: "Stage 3b CKD confirmed. Recommend dietary counseling, ACEi optimization, and 3-monthly monitoring.",
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

const getUrgencyBadge = (urgency: string) => {
  switch (urgency) {
    case "emergency": return <Badge variant="destructive">Emergency</Badge>;
    case "urgent": return <Badge className="bg-warning text-warning-foreground">Urgent</Badge>;
    case "routine": return <Badge variant="outline">Routine</Badge>;
    default: return <Badge variant="outline">{urgency}</Badge>;
  }
};

const getModeIcon = (mode: string) => {
  switch (mode) {
    case "video": return <Video className="w-4 h-4" />;
    case "audio": return <Phone className="w-4 h-4" />;
    case "chat": return <MessageSquare className="w-4 h-4" />;
    default: return <MessageSquare className="w-4 h-4" />;
  }
};

export function ConsultsSection() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="consults" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="consults" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Consultations
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Referrals
          </TabsTrigger>
          <TabsTrigger value="teleconsults" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Teleconsultations
          </TabsTrigger>
        </TabsList>

        {/* Consultation Requests */}
        <TabsContent value="consults" className="space-y-4">
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
                        <Badge variant={getStatusColor(consult.status)} className="capitalize ml-auto">
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
                        <Button size="sm">
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
        </TabsContent>

        {/* Referrals */}
        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Referral Tracking</CardTitle>
              <Button size="sm">
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
                          <Badge variant={getStatusColor(referral.status)} className="capitalize">
                            {referral.status}
                          </Badge>
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
                      {referral.status === "pending" && (
                        <Button variant="outline" size="sm" className="text-destructive">
                          Cancel Referral
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground hover:bg-muted/30 cursor-pointer transition-colors">
                <Plus className="w-5 h-5 mx-auto mb-2" />
                Create new referral
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teleconsultations */}
        <TabsContent value="teleconsults" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Teleconsultation Sessions</CardTitle>
              <Button size="sm">
                <Video className="w-4 h-4 mr-1" />
                Schedule Teleconsult
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Active/Upcoming Session Alert */}
              {MOCK_TELECONSULTS.some(t => t.status === "scheduled") && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 animate-pulse">
                      <Video className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Upcoming Teleconsultation</p>
                      <p className="text-sm text-muted-foreground">
                        Dermatology with Dr. Wanjiku at 14:00 today
                      </p>
                    </div>
                  </div>
                  <Button>
                    <Video className="w-4 h-4 mr-2" />
                    Join Now
                  </Button>
                </div>
              )}

              {MOCK_TELECONSULTS.map((teleconsult) => (
                <div
                  key={teleconsult.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          teleconsult.mode === "video" ? "bg-primary/10" : "bg-secondary"
                        }`}>
                          {getModeIcon(teleconsult.mode)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{teleconsult.specialty}</h4>
                          <p className="text-xs text-muted-foreground">
                            with {teleconsult.consultant}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {teleconsult.mode}
                          </Badge>
                          <Badge 
                            variant={teleconsult.status === "scheduled" ? "default" : "secondary"}
                            className="capitalize"
                          >
                            {teleconsult.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="pl-11 space-y-2">
                        <p className="text-sm">{teleconsult.reason}</p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {teleconsult.scheduledDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {teleconsult.scheduledDate}
                            </span>
                          )}
                          {teleconsult.completedDate && (
                            <span className="flex items-center gap-1 text-success">
                              <CheckCircle className="w-3 h-3" />
                              Completed: {teleconsult.completedDate}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Duration: {teleconsult.duration}
                          </span>
                        </div>

                        {teleconsult.summary && (
                          <div className="p-3 bg-muted/50 rounded-md mt-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Session Summary:</p>
                            <p className="text-sm">{teleconsult.summary}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {teleconsult.status === "scheduled" && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      <Button size="sm">
                        <Video className="w-3 h-3 mr-1" />
                        Join Session
                      </Button>
                      <Button variant="outline" size="sm">
                        <Calendar className="w-3 h-3 mr-1" />
                        Reschedule
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive">
                        Cancel
                      </Button>
                    </div>
                  )}

                  {teleconsult.status === "completed" && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      <Button variant="outline" size="sm">
                        <FileText className="w-3 h-3 mr-1" />
                        View Full Notes
                      </Button>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Schedule Follow-up
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Teleconsult Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Connect</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                  <Video className="w-6 h-6 text-primary" />
                  <span className="text-sm">Video Call</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                  <Phone className="w-6 h-6 text-primary" />
                  <span className="text-sm">Audio Call</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-primary" />
                  <span className="text-sm">Async Chat</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
