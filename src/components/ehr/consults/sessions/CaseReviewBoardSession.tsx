/**
 * CaseReviewBoardSession - Multi-participant case review / M&M / Specialist board
 * Enhanced with: recording, multi-participant MDT, instant comms, save/resume
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
  UserPlus,
  Crown,
  Clipboard,
  ThumbsUp,
  ThumbsDown,
  List,
  Loader2,
  Phone,
  Link,
  CircleDot,
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
import { useTeleconsultSessionDraft } from "@/hooks/useTeleconsultSessionDraft";
import { useTelemedicineRecording } from "@/hooks/useTelemedicineRecording";
import { useMultiParticipantSession, type ParticipantInvite } from "@/hooks/useMultiParticipantSession";
import { RecordingIndicator } from "../RecordingIndicator";
import { AddParticipantDialog } from "../AddParticipantDialog";
import { ReferralPackageBuilderDialog } from "../ReferralPackageBuilderDialog";
import type { ReferralPackage, ConsultationResponse, BoardSession } from "@/types/telehealth";
import { ReferralPackageViewer } from "../ReferralPackageViewer";

interface CaseReviewBoardSessionProps {
  referral: ReferralPackage;
  sessionId: string;
  boardSession?: BoardSession;
  onComplete: (response: ConsultationResponse) => void;
  onPause?: () => void;
  onBack: () => void;
  onStartCall?: (mode: 'audio' | 'video') => void;
}

interface AgendaItem {
  id: string;
  title: string;
  duration: number;
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
  onStartCall,
}: CaseReviewBoardSessionProps) {
  // Session state
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState("board");
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [showReferralBuilder, setShowReferralBuilder] = useState(false);

  // Board management
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
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  // Recording hook
  const recording = useTelemedicineRecording({
    sessionId,
    patientId: referral.patientId,
    referralId: referral.id,
    mode: 'board',
  });

  // Multi-participant hook
  const {
    participants,
    activeCount,
    canAddMore,
    addParticipant,
    removeParticipant,
    promoteToHost,
    toggleParticipantMute,
  } = useMultiParticipantSession({
    sessionId,
    hostId: 'current-user',
    hostName: 'You',
    initialParticipants: [
      {
        id: "1",
        name: "Dr. Tendai Moyo",
        role: "Lead Reviewer",
        specialty: "Oncology",
        isHost: false,
        isActive: true,
        isMuted: true,
        isVideoOff: true,
        connectionStatus: 'connected',
      },
      {
        id: "2",
        name: "Dr. Grace Mutasa",
        role: "Specialist",
        specialty: "Surgery",
        isHost: false,
        isActive: true,
        isMuted: true,
        isVideoOff: true,
        connectionStatus: 'connected',
      },
      {
        id: referral.context.referringProviderId,
        name: referral.context.referringProviderName,
        role: "Referring Clinician",
        specialty: referral.context.specialty,
        isHost: false,
        isActive: true,
        isMuted: true,
        isVideoOff: true,
        connectionStatus: 'connected',
      },
    ],
  });

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
    autoSaveInterval: 60000,
  });

  // Duration timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
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

  const handleStartSession = async () => {
    setIsSessionStarted(true);
    setAgenda((prev) => prev.map((item, idx) => 
      idx === 0 ? { ...item, status: 'current' } : item
    ));
    // Start recording with participants
    const boardParticipants = participants.filter(p => p.isActive).map(p => ({
      id: p.id,
      name: p.name,
      role: p.role || 'Participant',
    }));
    await recording.obtainConsent();
    await recording.startRecording(boardParticipants);
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

  const handleCallVote = () => {
    if (!voteQuestion.trim()) {
      toast.error("Please enter a question for the vote");
      return;
    }
    
    const votes = {
      agree: Math.floor(Math.random() * activeCount),
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

  const handleAddParticipant = async (invite: ParticipantInvite) => {
    await addParticipant(invite);
    setShowAddParticipant(false);
  };

  const handleInstantCall = (mode: 'audio' | 'video') => {
    if (onStartCall) {
      onStartCall(mode);
    } else {
      toast.info(`${mode === 'video' ? 'Video' : 'Audio'} call initiated`);
    }
  };

  const handleCompleteReview = async () => {
    await recording.stopRecording();
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
          boardParticipants: participants.filter(p => p.isActive).map((p) => p.id),
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
                    Board Participants ({activeCount})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {participants.filter(p => p.isActive).map((p) => (
                      <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {p.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate flex items-center gap-1">
                            {p.name}
                            {p.isHost && <Crown className="h-3 w-3 text-warning" />}
                          </p>
                          <p className="text-xs text-muted-foreground">{p.specialty || p.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {canAddMore && (
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowAddParticipant(true)}>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Participant
                    </Button>
                  )}
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

        <AddParticipantDialog
          open={showAddParticipant}
          onOpenChange={setShowAddParticipant}
          onInvite={handleAddParticipant}
          currentParticipantCount={activeCount}
          maxParticipants={25}
        />
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
              <RecordingIndicator recording={recording} compact />
              {isPaused && <Badge variant="outline" className="text-warning">Paused</Badge>}
            </h3>
            <p className="text-xs text-muted-foreground">
              {referral.patientHID} • {activeCount} participants
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

          {/* Instant comms */}
          <div className="flex gap-1 border-l pl-3">
            <Button variant="outline" size="icon" onClick={() => handleInstantCall('audio')}>
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleInstantCall('video')}>
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setShowReferralBuilder(true)}>
              <Link className="h-4 w-4" />
            </Button>
          </div>
          
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
              <div className="grid grid-cols-2 gap-6">
                {/* Participants */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Participants ({activeCount})</span>
                      {canAddMore && (
                        <Button variant="ghost" size="sm" onClick={() => setShowAddParticipant(true)}>
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {participants.filter(p => p.isActive).map((p) => (
                        <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {p.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate flex items-center gap-1">
                              {p.name}
                              {p.isHost && <Crown className="h-3 w-3 text-warning" />}
                            </p>
                            <p className="text-xs text-muted-foreground">{p.specialty || p.role}</p>
                          </div>
                          {p.isMuted && <MicOff className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Agenda */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Agenda</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {agenda.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg border",
                            item.status === 'current' && "border-primary bg-primary/5",
                            item.status === 'completed' && "border-success bg-success/5",
                            item.status === 'pending' && "border-muted"
                          )}
                        >
                          {item.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : item.status === 'current' ? (
                            <CircleDot className="h-4 w-4 text-primary animate-pulse" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2" />
                          )}
                          <span className="flex-1 text-sm">{item.title}</span>
                          <Badge variant="outline" className="text-xs">{item.duration}m</Badge>
                        </div>
                      ))}
                    </div>
                    {agenda.some(a => a.status === 'current') && (
                      <Button className="w-full mt-4" onClick={handleNextAgendaItem}>
                        Next Item
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Discussion Notes */}
              <Card className="mt-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Current Discussion: {agenda.find(a => a.status === 'current')?.title || 'None'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={currentDiscussionNotes}
                    onChange={(e) => setCurrentDiscussionNotes(e.target.value)}
                    placeholder="Capture key discussion points..."
                    className="min-h-[120px]"
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowVoteDialog(true)}>
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Call Vote
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="case" className="flex-1 p-4 overflow-auto">
              <ReferralPackageViewer referral={referral} readOnly />
            </TabsContent>

            <TabsContent value="decisions" className="flex-1 p-4 overflow-auto">
              {decisions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clipboard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No decisions recorded yet</p>
                  <p className="text-sm">Use "Call Vote" during discussions to record decisions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {decisions.map((d, idx) => (
                    <Card key={idx}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                          {d.topic}
                          <Badge variant={d.decision === 'Approved' ? 'default' : 'secondary'}>
                            {d.decision}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4 text-success" /> {d.votes.agree}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsDown className="h-4 w-4 text-destructive" /> {d.votes.disagree}
                          </span>
                          <span>Abstain: {d.votes.abstain}</span>
                        </div>
                        {d.rationale && (
                          <p className="text-sm">{d.rationale}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Vote Dialog */}
      <Dialog open={showVoteDialog} onOpenChange={setShowVoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Call Vote</DialogTitle>
            <DialogDescription>
              Record a decision from the board discussion
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Question / Topic</Label>
              <Input
                value={voteQuestion}
                onChange={(e) => setVoteQuestion(e.target.value)}
                placeholder="e.g., Proceed with surgical intervention?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCallVote}>
              Record Vote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Board Session</DialogTitle>
            <DialogDescription>
              This will finalize the case review and submit recommendations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span>Agenda completed</span>
              <Badge>{completedItems}/{agenda.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Decisions recorded</span>
              <Badge>{decisions.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Duration</span>
              <Badge variant="outline">{formatDuration(duration)}</Badge>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteReview}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Participant Dialog */}
      <AddParticipantDialog
        open={showAddParticipant}
        onOpenChange={setShowAddParticipant}
        onInvite={handleAddParticipant}
        currentParticipantCount={activeCount}
        maxParticipants={25}
      />

      {/* Referral Builder */}
      <ReferralPackageBuilderDialog
        open={showReferralBuilder}
        onOpenChange={setShowReferralBuilder}
        patientId={referral.patientId}
        patientHID={referral.patientHID}
        linkedSessionId={sessionId}
        onReferralCreated={() => {
          toast.success("Referral linked to board session");
          setShowReferralBuilder(false);
        }}
      />
    </div>
  );
}
