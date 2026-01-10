/**
 * FullCircleTelemedicineHub - Main entry point for the complete telemedicine system
 * Manages both outgoing (Facility A) and incoming (Facility B/C) workflows
 */
import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Send,
  Inbox,
  Plus,
  RefreshCw,
  Video,
  MessageSquare,
  Phone,
  FileText,
  Users,
  Calendar,
  Clock,
  AlertTriangle,
  Activity,
  TrendingUp,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { 
  ReferralPackage, 
  TelehealthWorkItem,
  TelemedicineMode,
  ReferralUrgency,
} from "@/types/telehealth";

// Sub-components
import { OutgoingReferralWorkflow } from "./OutgoingReferralWorkflow";
import { IncomingConsultWorkflow } from "./IncomingConsultWorkflow";
import { TelehealthDashboard } from "./TelehealthDashboard";

type HubView = 
  | "overview"
  | "outgoing-list"
  | "incoming-list"
  | "new-outgoing"
  | "outgoing-workflow"
  | "incoming-workflow";

interface FullCircleTelemedicineHubProps {
  patientId?: string;
  patientName?: string;
  patientHID?: string;
  encounterId?: string;
  onBack?: () => void;
}

// Mock data for demonstration
const MOCK_OUTGOING_REFERRALS: ReferralPackage[] = [
  {
    id: "OUT-001",
    referralNumber: "REF-2025-ABC123",
    patientId: "pt-001",
    patientHID: "PHID-ZW-2025-001234",
    clinicalNarrative: {
      chiefComplaint: "Persistent chest pain on exertion",
      historyOfPresentIllness: "3-week history of exertional chest discomfort",
      pastMedicalHistory: "Hypertension, Type 2 DM",
      provisionalDiagnosis: "Unstable angina vs ACS",
      interventionsDone: "ECG done - ST changes noted",
      reasonForReferral: "Specialist cardiology opinion needed",
      specificQuestions: ["Is this ACS?", "Recommend catheterization?"],
    },
    supportingData: { problemList: [], currentMedications: [], allergies: [], vitals: [], labResults: [], imaging: [], attachments: [] },
    context: {
      referringFacilityId: "fac-001",
      referringFacilityName: "Chitungwiza Central Hospital",
      referringProviderId: "prov-001",
      referringProviderName: "Dr. S. Mwangi",
      targetType: "specialty",
      targetId: "cardiology-pool",
      targetName: "Cardiology Pool - Parirenyatwa",
      specialty: "Cardiology",
    },
    urgency: "urgent",
    requestedModes: ["video", "async"],
    preferredMode: "video",
    consent: { status: "obtained", type: "verbal", timestamp: new Date().toISOString(), obtainedBy: "Dr. S. Mwangi" },
    status: "accepted",
    timestamps: { createdAt: new Date(Date.now() - 3600000).toISOString(), sentAt: new Date(Date.now() - 3500000).toISOString(), acceptedAt: new Date(Date.now() - 3000000).toISOString() },
  },
];

const MOCK_INCOMING_WORKLIST: TelehealthWorkItem[] = [
  {
    workItemId: "IN-001",
    type: "referral",
    referralId: "REF-2025-XYZ789",
    patientName: "Nokuthula Dube",
    patientAge: 29,
    patientHID: "PHID-ZW-2025-123456",
    priority: "urgent",
    fromFacilityName: "Gokwe North District Hospital",
    fromProviderName: "Dr. Sibongile Moyo",
    timeWaitingMinutes: 37,
    requestedModes: ["video", "async"],
    status: "pending",
    specialty: "Cardiology",
    reason: "Chest pain with ECG changes, needs specialist review",
  },
  {
    workItemId: "IN-002",
    type: "emergency",
    referralId: "REF-2025-EMG001",
    patientName: "Tatenda Chirwa",
    patientAge: 45,
    patientHID: "PHID-ZW-2025-789012",
    priority: "emergency",
    fromFacilityName: "Mutare Provincial Hospital",
    fromProviderName: "Dr. Peter Chikwava",
    timeWaitingMinutes: 5,
    requestedModes: ["video", "audio"],
    status: "pending",
    specialty: "Neurology",
    reason: "Acute stroke - urgent teleconsult needed",
  },
];

export function FullCircleTelemedicineHub({
  patientId,
  patientName,
  patientHID,
  encounterId,
  onBack,
}: FullCircleTelemedicineHubProps) {
  const [currentView, setCurrentView] = useState<HubView>("overview");
  const [selectedOutgoing, setSelectedOutgoing] = useState<ReferralPackage | null>(null);
  const [selectedIncoming, setSelectedIncoming] = useState<TelehealthWorkItem | null>(null);
  const [outgoingReferrals, setOutgoingReferrals] = useState<ReferralPackage[]>(MOCK_OUTGOING_REFERRALS);
  const [incomingWorkItems, setIncomingWorkItems] = useState<TelehealthWorkItem[]>(MOCK_INCOMING_WORKLIST);

  const handleBack = useCallback(() => {
    if (currentView === "overview") {
      onBack?.();
    } else {
      setCurrentView("overview");
      setSelectedOutgoing(null);
      setSelectedIncoming(null);
    }
  }, [currentView, onBack]);

  const handleStartNewReferral = () => {
    setCurrentView("new-outgoing");
  };

  const handleOpenOutgoing = (referral: ReferralPackage) => {
    setSelectedOutgoing(referral);
    setCurrentView("outgoing-workflow");
  };

  const handleAcceptIncoming = (workItem: TelehealthWorkItem) => {
    // Convert workItem to ReferralPackage for the workflow
    const referralPackage: ReferralPackage = {
      id: workItem.referralId,
      referralNumber: workItem.referralId,
      patientId: workItem.patientHID,
      patientHID: workItem.patientHID,
      clinicalNarrative: {
        chiefComplaint: workItem.reason,
        historyOfPresentIllness: "",
        pastMedicalHistory: "",
        provisionalDiagnosis: "",
        interventionsDone: "",
        reasonForReferral: workItem.reason,
        specificQuestions: [],
      },
      supportingData: { problemList: [], currentMedications: [], allergies: [], vitals: [], labResults: [], imaging: [], attachments: [] },
      context: {
        referringFacilityId: "external",
        referringFacilityName: workItem.fromFacilityName,
        referringProviderId: "external",
        referringProviderName: workItem.fromProviderName,
        targetType: "specialty",
        targetId: "current-facility",
        targetName: "Current Facility",
        specialty: workItem.specialty,
      },
      urgency: workItem.priority,
      requestedModes: workItem.requestedModes,
      preferredMode: workItem.requestedModes[0] || "async",
      consent: { status: "obtained", type: "verbal", timestamp: new Date().toISOString(), obtainedBy: workItem.fromProviderName },
      status: "pending",
      timestamps: { createdAt: new Date(Date.now() - workItem.timeWaitingMinutes * 60000).toISOString() },
    };
    setSelectedIncoming(workItem);
    setSelectedOutgoing(referralPackage);
    setCurrentView("incoming-workflow");
  };

  // Render sub-views
  if (currentView === "new-outgoing") {
    return (
      <OutgoingReferralWorkflow
        patientId={patientId}
        patientName={patientName}
        patientHID={patientHID}
        encounterId={encounterId}
        onComplete={() => setCurrentView("overview")}
        onBack={handleBack}
      />
    );
  }

  if (currentView === "outgoing-workflow" && selectedOutgoing) {
    return (
      <OutgoingReferralWorkflow
        patientId={patientId}
        patientName={patientName}
        patientHID={patientHID}
        encounterId={encounterId}
        existingReferral={selectedOutgoing}
        onComplete={() => setCurrentView("overview")}
        onBack={handleBack}
      />
    );
  }

  if (currentView === "incoming-workflow" && selectedIncoming && selectedOutgoing) {
    return (
      <IncomingConsultWorkflow
        workItem={selectedIncoming}
        referralPackage={selectedOutgoing}
        onComplete={() => setCurrentView("overview")}
        onBack={handleBack}
      />
    );
  }

  if (currentView === "incoming-list") {
    return (
      <TelehealthDashboard
        onBack={handleBack}
        onAcceptCase={handleAcceptIncoming}
        onViewCase={handleAcceptIncoming}
      />
    );
  }

  // Overview Dashboard
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" />
                Telemedicine Hub
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage outgoing referrals and incoming consultations
              </p>
            </div>
          </div>
          <Button onClick={handleStartNewReferral}>
            <Plus className="h-4 w-4 mr-2" />
            New Referral
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Outgoing Active</p>
                    <p className="text-2xl font-bold">{outgoingReferrals.filter(r => r.status !== "completed").length}</p>
                  </div>
                  <Send className="h-8 w-8 text-primary/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Incoming Pending</p>
                    <p className="text-2xl font-bold text-warning">{incomingWorkItems.filter(w => w.status === "pending").length}</p>
                  </div>
                  <Inbox className="h-8 w-8 text-warning/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Emergency</p>
                    <p className="text-2xl font-bold text-destructive">{incomingWorkItems.filter(w => w.priority === "emergency").length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-destructive/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed Today</p>
                    <p className="text-2xl font-bold text-success">3</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-success/30" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Outgoing Referrals */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary" />
                    Outgoing Referrals
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentView("outgoing-list")}>
                    View All
                  </Button>
                </div>
                <CardDescription>Referrals you've sent to other facilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {outgoingReferrals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Send className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>No active outgoing referrals</p>
                    </div>
                  ) : (
                    outgoingReferrals.map((referral) => (
                      <div
                        key={referral.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleOpenOutgoing(referral)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{referral.patientHID}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {referral.clinicalNarrative.reasonForReferral}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              To: {referral.context.targetName}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={referral.status === "completed" ? "default" : "secondary"}
                              className={cn(
                                referral.urgency === "emergency" && "bg-destructive",
                                referral.urgency === "urgent" && "bg-warning text-warning-foreground"
                              )}
                            >
                              {referral.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(referral.timestamps.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Incoming Consultations */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Inbox className="h-5 w-5 text-warning" />
                    Incoming Consultations
                    {incomingWorkItems.filter(w => w.priority === "emergency").length > 0 && (
                      <Badge variant="destructive" className="animate-pulse">
                        {incomingWorkItems.filter(w => w.priority === "emergency").length} Emergency
                      </Badge>
                    )}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentView("incoming-list")}>
                    View All
                  </Button>
                </div>
                <CardDescription>Cases referred to you for consultation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {incomingWorkItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Inbox className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>No pending consultations</p>
                    </div>
                  ) : (
                    incomingWorkItems.map((item) => (
                      <div
                        key={item.workItemId}
                        className={cn(
                          "p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors",
                          item.priority === "emergency" && "border-destructive bg-destructive/5 animate-pulse-slow"
                        )}
                        onClick={() => handleAcceptIncoming(item)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {item.patientName}
                              {item.priority === "emergency" && (
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {item.reason}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              From: {item.fromFacilityName}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={item.priority === "emergency" ? "destructive" : "outline"}
                            >
                              {item.priority}
                            </Badge>
                            <p className={cn(
                              "text-xs mt-1",
                              item.timeWaitingMinutes > 60 ? "text-destructive" : "text-muted-foreground"
                            )}>
                              <Clock className="h-3 w-3 inline mr-1" />
                              {item.timeWaitingMinutes}m waiting
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 mt-2">
                          {item.requestedModes.map((mode) => (
                            <Badge key={mode} variant="outline" className="text-xs">
                              {mode}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={handleStartNewReferral}>
                  <Send className="h-6 w-6" />
                  <span>New Referral</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setCurrentView("incoming-list")}>
                  <Inbox className="h-6 w-6" />
                  <span>View Worklist</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Calendar className="h-6 w-6" />
                  <span>Scheduled</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Users className="h-6 w-6" />
                  <span>Case Boards</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
