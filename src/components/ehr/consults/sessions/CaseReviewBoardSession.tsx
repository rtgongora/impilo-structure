/**
 * CaseReviewBoardSession - Multi-participant case review / M&M / Specialist board
 * For MDT discussions, tumor boards, morbidity & mortality reviews
 */
import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Video,
  Mic,
  MicOff,
  Hand,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle,
  Play,
  Pause,
  Save,
  ArrowLeft,
  Plus,
  UserPlus,
  Crown,
  AlertCircle,
  Clipboard,
  Vote,
  ThumbsUp,
  ThumbsDown,
  List,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTeleconsultSessionDraft, type SessionDraftData } from "@/hooks/useTeleconsultSessionDraft";
import type { ReferralPackage, ConsultationResponse, BoardSession } from "@/types/telehealth";
import { ReferralPackageViewer } from "../ReferralPackageViewer";

interface CaseReviewBoardSessionProps {
  referral: ReferralPackage;
  sessionId: string;
  boardSession?: BoardSession;
  onComplete: (response: ConsultationResponse) => void;
  onPause?: () => void;
  onBack: () => void;
}

interface BoardParticipant {
  id: string;
  name: string;
  role: string;
  specialty: string;
  isLead: boolean;
  isPresent: boolean;
  isMuted: boolean;
  hasHandRaised: boolean;
  vote?: 'agree' | 'disagree' | 'abstain';
}

interface AgendaItem {
  id: string;
  title: string;
  duration: number; // minutes
  status: 'pending' | 'current' | 'completed';
  notes?: string;
}

interface BoardDecision {
  topic: string;
  decision: string;
  votes: { agree: number; disagree: number; abstain: number };
  rationale: string;
}

export function CaseReviewBoardSession({
  referral,
  sessionId,
  boardSession,
  onComplete,
  onPause,
  onBack,
}: CaseReviewBoardSessionProps) {
  // Session state
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState("board");

  // Board management
  const [participants, setParticipants] = useState<BoardParticipant[]>([
    { id: "1", name: "Dr. Tendai Moyo", role: "Lead Reviewer", specialty: "Oncology", isLead: true, isPresent: true, isMuted: false, hasHandRaised: false },
    { id: "2", name: "Dr. Grace Mutasa", role: "Specialist", specialty: "Surgery", isLead: false, isPresent: true, isMuted: true, hasHandRaised: false },
    { id: "3", name: "Dr. Sarah Ncube", role: "Pathologist", specialty: "Pathology", isLead: false, isPresent: true, isMuted: true, hasHandRaised: true },
    { id: referral.context.referringProviderId, name: referral.context.referringProviderName, role: "Referring Clinician", specialty: referral.context.specialty, isLead: false, isPresent: true, isMuted: true, hasHandRaised: false },
    { id: "current", name: "You", role: "Consultant", specialty: referral.context.specialty, isLead: false, isPresent: true, isMuted: false, hasHandRaised: false },
  ]);

  const [agenda, setAgenda] = useState<AgendaItem[]>([
    { id: "1", title: "Case Presentation", duration: 10, status: 'pending' },
    { id: "2", title: "Imaging Review", duration: 15, status: 'pending' },
    { id: "3", title: "Treatment Discussion", duration: 20, status: 'pending' },
    { id: "4", title: "Final Recommendations", duration: 10, status: 'pending' },
  ]);

  const [decisions, setDecisions] = useState<BoardDecision[]>([]);
  const [currentDiscussionNotes, setCurrentDiscussionNotes] = useState("");
  const [showVoteDialog, setShowVoteDialog] = useState(false);
  const [voteQuestion, setVoteQuestion] = useState("");
  const [showAddParticipantDialog, setShowAddParticipantDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  // Draft management
  const {
    draftData,
    isDirty,
    lastSavedAt,
    isSaving,
    updateDraftData,
    saveDraft,
    pauseSession,
    completeSession,
  } = useTeleconsultSessionDraft({
    sessionId,
    referralId: referral.id,
    patientId: referral.patientId,
    autoSaveInterval: 60000, // Auto-save every minute
  });

  // Duration timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSessionStarted && !isPaused) {
      timer = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isSessionStarted, isPaused]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartSession = () => {
    setIsSessionStarted(true);
    setAgenda((prev) => prev.map((item, idx) => 
      idx === 0 ? { ...item, status: 'current' } : item
    ));
    toast.success("Case review board session started");
  };

  const handlePauseSession = async () => {
    setIsPaused(true);
    await pauseSession("Board session paused");
    toast.info("Session paused - you can resume later");
    if (onPause) onPause();
  };

  const handleResumeSession = () => {
    setIsPaused(false);
    toast.success("Session resumed");
  };

  const handleNextAgendaItem = () => {
    const currentIdx = agenda.findIndex((a) => a.status === 'current');
    if (currentIdx >= 0 && currentIdx < agenda.length - 1) {
      setAgenda((prev) => prev.map((item, idx) => {
        if (idx === currentIdx) return { ...item, status: 'completed', notes: currentDiscussionNotes };
        if (idx === currentIdx + 1) return { ...item, status: 'current' };
        return item;
      }));
      setCurrentDiscussionNotes("");
      toast.info(`Moving to: ${agenda[currentIdx + 1].title}`);
    } else if (currentIdx === agenda.length - 1) {
      setAgenda((prev) => prev.map((item, idx) => 
        idx === currentIdx ? { ...item, status: 'completed', notes: currentDiscussionNotes } : item
      ));
      toast.success("All agenda items completed");
    }
  };

  const handleRaiseHand = () => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === "current" ? { ...p, hasHandRaised: !p.hasHandRaised } : p
      )
    );
  };

  const handleCallVote = () => {
    if (!voteQuestion.trim()) {
      toast.error("Please enter a question for the vote");
      return;
    }
    
    // Simulate voting
    const votes = {
      agree: Math.floor(Math.random() * participants.length),
      disagree: Math.floor(Math.random() * 2),
      abstain: 1,
    };
    
    setDecisions((prev) => [...prev, {
      topic: voteQuestion,
      decision: votes.agree > votes.disagree ? "Approved" : "Not approved",
      votes,
      rationale: currentDiscussionNotes,
    }]);
    
    setShowVoteDialog(false);
    setVoteQuestion("");
    toast.success("Vote recorded");
  };

  const handleCompleteReview = async () => {
    const success = await completeSession();
    if (success) {
      const response: ConsultationResponse = {
        referralId: referral.id,
        consultationId: sessionId,
        consultantProviderId: "current-user",
        consultantFacilityId: "",
        modeUsed: "board",
        responseNote: {
          assessment: draftData?.responseNote?.assessment || "",
          clinicalInterpretation: draftData?.responseNote?.clinicalInterpretation || "",
          workingDiagnosis: draftData?.responseNote?.workingDiagnosis || "",
          diagnosisCodes: [],
          responseToQuestions: draftData?.responseNote?.responseToQuestions || "",
          keyFindings: agenda.filter((a) => a.notes).map((a) => `${a.title}: ${a.notes}`).join("\n"),
          impressions: decisions.map((d) => `${d.topic}: ${d.decision}`).join("\n"),
        },
        plan: {
          treatmentPlan: draftData?.plan?.treatmentPlan || "",
          medications: [],
          investigations: [],
          procedures: [],
          monitoringRequirements: "",
        },
        disposition: {
          type: "continue_at_referring",
          instructions: "",
        },
        followUp: {
          type: "tele_follow_up",
          when: "",
          instructions: "",
          responsibleFacility: "",
        },
        orders: { medications: [], labs: [], imaging: [], procedures: [] },
        documentation: {
          communicationLogRef: sessionId,
          sessionDuration: duration,
          attachmentsUsed: [],
          boardParticipants: participants.map((p) => p.id),
        },
        status: "submitted",
        timestamps: {
          startedAt: new Date(Date.now() - duration * 1000).toISOString(),
          completedAt: new Date().toISOString(),
        },
      };
      
      setShowCompleteDialog(false);
      onComplete(response);
    }
  };

  const completedItems = agenda.filter((a) => a.status === 'completed').length;
  const progress = (completedItems / agenda.length) * 100;

  // Pre-session view
  if (!isSessionStarted) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Case Review Board
              </h3>
              <p className="text-xs text-muted-foreground">
                {referral.patientHID} • {referral.context.specialty}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Board Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Multidisciplinary Case Review</CardTitle>
                <CardDescription>
                  {referral.clinicalNarrative.reasonForReferral}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Participants */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Board Participants ({participants.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {participants.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {p.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate flex items-center gap-1">
                            {p.name}
                            {p.isLead && <Crown className="h-3 w-3 text-warning" />}
                          </p>
                          <p className="text-xs text-muted-foreground">{p.specialty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowAddParticipantDialog(true)}>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add Participant
                  </Button>
                </div>

                <Separator />

                {/* Agenda */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <List className="h-4 w-4" />
                    Session Agenda
                  </h4>
                  <div className="space-y-2">
                    {agenda.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium">
                          {idx + 1}
                        </span>
                        <span className="flex-1">{item.title}</span>
                        <Badge variant="outline">{item.duration} min</Badge>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Total estimated duration: {agenda.reduce((sum, a) => sum + a.duration, 0)} minutes
                  </p>
                </div>

                <Button className="w-full" size="lg" onClick={handleStartSession}>
                  <Play className="h-5 w-5 mr-2" />
                  Start Case Review Session
                </Button>
              </CardContent>
            </Card>

            {/* Case Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Case Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <ReferralPackageViewer referral={referral} readOnly />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Active session view
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Case Review Board
              {isPaused && <Badge variant="outline" className="text-warning">Paused</Badge>}
            </h3>
            <p className="text-xs text-muted-foreground">
              {referral.patientHID} • {participants.length} participants
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            {formatDuration(duration)}
          </Badge>
          
          {isDirty && (
            <Badge variant="outline" className="text-warning">Unsaved</Badge>
          )}
          
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          
          <Button variant="outline" size="sm" onClick={() => saveDraft()}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          
          {isPaused ? (
            <Button size="sm" onClick={handleResumeSession}>
              <Play className="h-4 w-4 mr-1" />
              Resume
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handlePauseSession}>
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          )}
          
          <Button size="sm" onClick={() => setShowCompleteDialog(true)}>
            <CheckCircle className="h-4 w-4 mr-1" />
            Complete
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 py-2 border-b bg-muted/20">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Progress</span>
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-sm text-muted-foreground">{completedItems}/{agenda.length} items</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Case & Discussion */}
        <div className="flex-1 flex flex-col border-r">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-4 pt-2">
              <TabsList>
                <TabsTrigger value="board">
                  <Users className="h-4 w-4 mr-1" />
                  Board
                </TabsTrigger>
                <TabsTrigger value="case">
                  <FileText className="h-4 w-4 mr-1" />
                  Case
                </TabsTrigger>
                <TabsTrigger value="decisions">
                  <Clipboard className="h-4 w-4 mr-1" />
                  Decisions ({decisions.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="board" className="flex-1 p-4 overflow-auto">
              {/* Current Agenda Item */}
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Current: {agenda.find((a) => a.status === 'current')?.title || "Session Complete"}
                    </CardTitle>
                    <Button size="sm" onClick={handleNextAgendaItem}>
                      Next Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={currentDiscussionNotes}
                    onChange={(e) => setCurrentDiscussionNotes(e.target.value)}
                    placeholder="Capture key discussion points, findings, and recommendations..."
                    className="min-h-[150px]"
                  />
                  
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={() => setShowVoteDialog(true)}>
                      <Vote className="h-4 w-4 mr-1" />
                      Call Vote
                    </Button>
                    <Button
                      variant={participants.find((p) => p.id === "current")?.hasHandRaised ? "secondary" : "outline"}
                      size="sm"
                      onClick={handleRaiseHand}
                    >
                      <Hand className="h-4 w-4 mr-1" />
                      {participants.find((p) => p.id === "current")?.hasHandRaised ? "Lower Hand" : "Raise Hand"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Agenda Progress */}
              <div className="space-y-2">
                <h4 className="font-medium">Agenda</h4>
                {agenda.map((item, idx) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg",
                      item.status === 'current' && "bg-primary/10 border border-primary",
                      item.status === 'completed' && "bg-success/10",
                      item.status === 'pending' && "bg-muted/50"
                    )}
                  >
                    {item.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <span className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium",
                        item.status === 'current' ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        {idx + 1}
                      </span>
                    )}
                    <span className="flex-1">{item.title}</span>
                    <Badge variant="outline" className="text-xs">{item.duration}m</Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="case" className="flex-1 p-4 overflow-auto">
              <ReferralPackageViewer referral={referral} readOnly />
            </TabsContent>

            <TabsContent value="decisions" className="flex-1 p-4 overflow-auto">
              {decisions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Vote className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No decisions recorded yet</p>
                  <p className="text-sm">Use "Call Vote" to record board decisions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {decisions.map((d, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">{d.topic}</h4>
                        <Badge variant={d.decision === "Approved" ? "default" : "secondary"}>
                          {d.decision}
                        </Badge>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1 text-success">
                            <ThumbsUp className="h-3 w-3" /> {d.votes.agree}
                          </span>
                          <span className="flex items-center gap-1 text-destructive">
                            <ThumbsDown className="h-3 w-3" /> {d.votes.disagree}
                          </span>
                          <span className="text-muted-foreground">{d.votes.abstain} abstain</span>
                        </div>
                        {d.rationale && (
                          <p className="text-sm text-muted-foreground mt-2">{d.rationale}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Participants */}
        <div className="w-64 flex flex-col">
          <div className="p-3 border-b font-medium flex items-center justify-between">
            <span>Participants</span>
            <Button variant="ghost" size="icon" onClick={() => setShowAddParticipantDialog(true)}>
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-2">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "p-2 rounded-lg flex items-center gap-2",
                    p.hasHandRaised && "bg-warning/10 border border-warning"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {p.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    {p.isPresent && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate flex items-center gap-1">
                      {p.id === "current" ? "You" : p.name}
                      {p.isLead && <Crown className="h-3 w-3 text-warning" />}
                      {p.hasHandRaised && <Hand className="h-3 w-3 text-warning" />}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{p.specialty}</p>
                  </div>
                  {p.isMuted && <MicOff className="h-3 w-3 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Vote Dialog */}
      <Dialog open={showVoteDialog} onOpenChange={setShowVoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Call for Vote</DialogTitle>
            <DialogDescription>
              Record a formal decision from the board
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Question / Decision Topic</Label>
              <Input
                value={voteQuestion}
                onChange={(e) => setVoteQuestion(e.target.value)}
                placeholder="e.g., Proceed with surgical intervention?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVoteDialog(false)}>Cancel</Button>
            <Button onClick={handleCallVote}>Record Vote</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Case Review</DialogTitle>
            <DialogDescription>
              Finalize the board session and submit the consultation response
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>{completedItems} of {agenda.length} agenda items completed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Vote className="h-4 w-4 text-primary" />
              <span>{decisions.length} decisions recorded</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Session duration: {formatDuration(duration)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>Continue Session</Button>
            <Button onClick={handleCompleteReview}>Complete & Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Participant Dialog */}
      <Dialog open={showAddParticipantDialog} onOpenChange={setShowAddParticipantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Participant</DialogTitle>
            <DialogDescription>
              Invite another clinician to join the case review
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search Provider</Label>
              <Input placeholder="Search by name or specialty..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddParticipantDialog(false)}>Cancel</Button>
            <Button onClick={() => { setShowAddParticipantDialog(false); toast.info("Invitation sent"); }}>
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
