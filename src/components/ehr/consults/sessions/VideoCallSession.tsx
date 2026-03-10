/**
 * VideoCallSession - Full audio/video consultation
 * Enhanced with: recording, multi-participant MDT support, screen sharing, modern call tools
 */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Monitor,
  MonitorOff,
  Maximize2,
  Minimize2,
  Settings,
  MessageSquare,
  Users,
  Grid,
  Clock,
  ArrowLeft,
  MoreVertical,
  PictureInPicture,
  FileText,
  Loader2,
  UserPlus,
  Link,
  Hand,
  Crown,
  CircleDot,
  Layout,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTelemedicineRecording } from "@/hooks/useTelemedicineRecording";
import { useMultiParticipantSession, type ParticipantInvite } from "@/hooks/useMultiParticipantSession";
import { RecordingIndicator } from "../RecordingIndicator";
import { AddParticipantDialog } from "../AddParticipantDialog";
import { ReferralPackageBuilderDialog } from "../ReferralPackageBuilderDialog";
import type { ReferralPackage, ChatMessage } from "@/types/telehealth";

interface VideoCallSessionProps {
  referral: ReferralPackage;
  sessionId: string;
  participants?: { id: string; name: string; role: string }[];
  onComplete: () => void;
  onBack: () => void;
}

type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'ended';
type LayoutMode = 'speaker' | 'grid' | 'presentation' | 'sidebar';

export function VideoCallSession({
  referral,
  sessionId,
  participants: initialParticipants,
  onComplete,
  onBack,
}: VideoCallSessionProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('speaker');
  const [duration, setDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [showReferralBuilder, setShowReferralBuilder] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [handRaised, setHandRaised] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Recording hook
  const recording = useTelemedicineRecording({
    sessionId,
    patientId: referral.patientId,
    referralId: referral.id,
    mode: 'video',
  });

  // Multi-participant hook
  const {
    participants,
    activeCount,
    host,
    canAddMore,
    addParticipant,
    removeParticipant,
    promoteToHost,
    toggleParticipantMute,
  } = useMultiParticipantSession({
    sessionId,
    hostId: 'current-user',
    hostName: 'You',
    initialParticipants: [{
      id: referral.context.referringProviderId,
      name: referral.context.referringProviderName,
      role: 'Referring Clinician',
      facility: referral.context.referringFacilityName,
      isHost: false,
      isActive: true,
      isMuted: false,
      isVideoOff: false,
      connectionStatus: 'connected',
    }],
  });

  // Simulate connection
  useEffect(() => {
    const timer = setTimeout(async () => {
      setConnectionState('connected');
      toast.success("Video call connected");
      // Auto-start recording with initial participants
      const initialParticipants = [
        { id: 'current-user', name: 'You', role: 'Consultant' },
        { id: referral.context.referringProviderId, name: referral.context.referringProviderName, role: 'Referring Clinician' },
      ];
      await recording.obtainConsent();
      await recording.startRecording(initialParticipants);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Duration timer
  useEffect(() => {
    if (connectionState === 'connected') {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [connectionState]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndCall = useCallback(async () => {
    setConnectionState('ended');
    await recording.stopRecording();
    toast.info(`Video call ended. Duration: ${formatDuration(duration)}`);
    setTimeout(onComplete, 1500);
  }, [duration, onComplete, recording]);

  const handleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    if (!isScreenSharing) {
      setLayoutMode('presentation');
      toast.success("Screen sharing started");
    } else {
      setLayoutMode('speaker');
      toast.info("Screen sharing stopped");
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleRaiseHand = () => {
    setHandRaised(!handRaised);
    if (!handRaised) {
      toast.info("Hand raised - other participants have been notified");
    }
  };

  const sendChatMessage = () => {
    if (!newMessage.trim()) return;
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: "local",
      senderName: "You",
      senderRole: "Consultant",
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: "text",
    };
    setChatMessages((prev) => [...prev, message]);
    setNewMessage("");
  };

  const handleAddParticipant = async (invite: ParticipantInvite) => {
    await addParticipant(invite);
    setShowAddParticipant(false);
  };

  const handleReferralCreated = (referralId: string) => {
    toast.success("Referral package created and linked to this session");
    setShowReferralBuilder(false);
  };

  const renderVideoGrid = () => {
    if (connectionState === 'connecting') {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connecting...</h2>
            <p className="text-muted-foreground">Establishing secure video connection</p>
          </div>
        </div>
      );
    }

    if (connectionState === 'ended') {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <VideoOff className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Call Ended</h2>
            <p className="text-muted-foreground">Duration: {formatDuration(duration)}</p>
          </div>
        </div>
      );
    }

    const activeParticipants = participants.filter((p) => p.isActive);
    const localParticipant = activeParticipants.find((p) => p.isHost);
    const remoteParticipants = activeParticipants.filter((p) => !p.isHost);

    // Presentation mode (screen sharing)
    if (layoutMode === 'presentation' && isScreenSharing) {
      return (
        <div className="h-full flex">
          <div className="flex-1 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Monitor className="h-24 w-24 text-primary mx-auto mb-4" />
              <p className="text-lg font-medium">You are sharing your screen</p>
            </div>
          </div>
          <div className="w-48 ml-2 flex flex-col gap-2">
            {activeParticipants.map((p) => (
              <ParticipantVideo key={p.id} participant={p} size="small" />
            ))}
          </div>
        </div>
      );
    }

    // Grid mode for multiple participants
    if (layoutMode === 'grid' || activeParticipants.length > 3) {
      const gridCols = activeParticipants.length <= 4 ? 2 : 3;
      return (
        <div className={cn(
          "h-full grid gap-2 p-2",
          gridCols === 2 && "grid-cols-2",
          gridCols === 3 && "grid-cols-3"
        )}>
          {activeParticipants.map((p) => (
            <ParticipantVideo key={p.id} participant={p} size="medium" />
          ))}
        </div>
      );
    }

    // Sidebar mode
    if (layoutMode === 'sidebar') {
      return (
        <div className="h-full flex">
          <div className="flex-1 p-2">
            {remoteParticipants[0] && (
              <ParticipantVideo participant={remoteParticipants[0]} size="large" />
            )}
          </div>
          <div className="w-64 flex flex-col gap-2 p-2">
            {localParticipant && (
              <ParticipantVideo participant={localParticipant} size="small" />
            )}
            {remoteParticipants.slice(1).map((p) => (
              <ParticipantVideo key={p.id} participant={p} size="small" />
            ))}
          </div>
        </div>
      );
    }

    // Speaker view (default)
    return (
      <div className="h-full relative p-2">
        {/* Main video (first remote participant) */}
        <div className="absolute inset-2 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          {remoteParticipants[0] ? (
            <>
              {remoteParticipants[0].isVideoOff ? (
                <Avatar className="h-32 w-32">
                  <AvatarFallback className="text-4xl">
                    {remoteParticipants[0].name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg" />
              )}
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="text-sm bg-background/80 px-2 py-1 rounded font-medium">
                  {remoteParticipants[0].name}
                </span>
                {remoteParticipants[0].isMuted && (
                  <Badge variant="destructive" className="h-6">
                    <MicOff className="h-3 w-3" />
                  </Badge>
                )}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Waiting for participants...</p>
          )}
        </div>

        {/* PiP local video */}
        <div className="absolute bottom-4 right-4 w-48 aspect-video bg-muted rounded-lg border-2 border-background shadow-lg flex items-center justify-center overflow-hidden">
          {isVideoOff ? (
            <Avatar>
              <AvatarFallback>You</AvatarFallback>
            </Avatar>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-secondary/10" />
          )}
          {isMuted && (
            <MicOff className="absolute bottom-1 right-1 h-4 w-4 text-destructive" />
          )}
          {handRaised && (
            <Hand className="absolute top-1 right-1 h-5 w-5 text-warning" />
          )}
        </div>

        {/* Other participants strip */}
        {remoteParticipants.length > 1 && (
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            {remoteParticipants.slice(1, 4).map((p) => (
              <ParticipantVideo key={p.id} participant={p} size="thumbnail" />
            ))}
            {remoteParticipants.length > 4 && (
              <div className="w-24 h-16 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-sm font-medium">+{remoteParticipants.length - 4}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              {activeCount > 2 ? 'Group Video Call' : 'Video Consultation'}
              <RecordingIndicator recording={recording} compact />
              {connectionState === 'connected' && (
                <Badge variant="outline" className="ml-2">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDuration(duration)}
                </Badge>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              {referral.context.specialty} • {referral.patientHID}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <Users className="h-3 w-3 mr-1" />
            {activeCount}
          </Badge>
          
          {canAddMore && connectionState === 'connected' && (
            <Button variant="outline" size="sm" onClick={() => setShowAddParticipant(true)}>
              <UserPlus className="h-4 w-4" />
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => setShowReferralBuilder(true)}>
            <Link className="h-4 w-4" />
          </Button>
          
          <Button
            variant={showChat ? "secondary" : "ghost"}
            size="sm"
            onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          
          <Button
            variant={showParticipants ? "secondary" : "ghost"}
            size="sm"
            onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
          >
            <Users className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLayoutMode('speaker')}>
                <PictureInPicture className="h-4 w-4 mr-2" />
                Speaker View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLayoutMode('grid')}>
                <Grid className="h-4 w-4 mr-2" />
                Grid View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLayoutMode('sidebar')}>
                <Layout className="h-4 w-4 mr-2" />
                Sidebar View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleFullscreen}>
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4 mr-2" />
                ) : (
                  <Maximize2 className="h-4 w-4 mr-2" />
                )}
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1">
          {renderVideoGrid()}
        </div>

        {/* Side Panel */}
        {(showChat || showParticipants) && (
          <div className="w-80 border-l flex flex-col">
            {showChat && (
              <>
                <div className="p-3 border-b font-medium">In-call Chat</div>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {chatMessages.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No messages yet
                      </p>
                    ) : (
                      chatMessages.map((msg) => (
                        <div key={msg.id} className="text-sm">
                          <span className="font-medium">{msg.senderName}: </span>
                          <span>{msg.content}</span>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
                <div className="p-3 border-t flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button size="icon" onClick={sendChatMessage}>
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {showParticipants && (
              <>
                <div className="p-3 border-b font-medium">
                  Participants ({activeCount})
                </div>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-2">
                    {participants.filter(p => p.isActive).map((p) => (
                      <div key={p.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted group">
                        <Avatar>
                          <AvatarFallback>
                            {p.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate flex items-center gap-1">
                            {p.name}
                            {p.isHost && <Crown className="h-3 w-3 text-warning" />}
                          </p>
                          <p className="text-xs text-muted-foreground">{p.role}</p>
                        </div>
                        <div className="flex gap-1 items-center">
                          {p.isMuted && <MicOff className="h-4 w-4 text-muted-foreground" />}
                          {p.isVideoOff && <VideoOff className="h-4 w-4 text-muted-foreground" />}
                          {!p.isHost && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => toggleParticipantMute(p.id)}>
                                  {p.isMuted ? 'Unmute' : 'Mute'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => promoteToHost(p.id)}>
                                  Make Host
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => removeParticipant(p.id)}
                                >
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {canAddMore && (
                  <div className="p-3 border-t">
                    <Button variant="outline" className="w-full" onClick={() => setShowAddParticipant(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Participant
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {connectionState === 'connected' && (
        <div className="p-4 border-t bg-background">
          <div className="flex items-center justify-center gap-3">
            {/* Mute */}
            <Button
              variant="outline"
              size="lg"
              className={cn("h-14 w-14 rounded-full", isMuted && "bg-destructive/20 border-destructive")}
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>

            {/* Video */}
            <Button
              variant="outline"
              size="lg"
              className={cn("h-14 w-14 rounded-full", isVideoOff && "bg-destructive/20 border-destructive")}
              onClick={() => setIsVideoOff(!isVideoOff)}
            >
              {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
            </Button>

            {/* Screen Share */}
            <Button
              variant="outline"
              size="lg"
              className={cn("h-14 w-14 rounded-full", isScreenSharing && "bg-primary/20 border-primary")}
              onClick={handleScreenShare}
            >
              {isScreenSharing ? <MonitorOff className="h-6 w-6" /> : <Monitor className="h-6 w-6" />}
            </Button>

            {/* Raise Hand */}
            <Button
              variant="outline"
              size="lg"
              className={cn("h-14 w-14 rounded-full", handRaised && "bg-warning/20 border-warning")}
              onClick={handleRaiseHand}
            >
              <Hand className={cn("h-6 w-6", handRaised && "text-warning")} />
            </Button>

            {/* End Call */}
            <Button
              variant="destructive"
              size="lg"
              className="h-14 w-14 rounded-full"
              onClick={handleEndCall}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>

          {/* Recording status footer */}
          {recording.isRecording && (
            <div className="text-center mt-3">
              <Badge variant="destructive" className="animate-pulse">
                <CircleDot className="h-3 w-3 mr-1" />
                Recording • {formatDuration(recording.duration)}
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <AddParticipantDialog
        open={showAddParticipant}
        onOpenChange={setShowAddParticipant}
        onInvite={handleAddParticipant}
        currentParticipantCount={activeCount}
        maxParticipants={25}
      />

      <ReferralPackageBuilderDialog
        open={showReferralBuilder}
        onOpenChange={setShowReferralBuilder}
        patientId={referral.patientId}
        patientHID={referral.patientHID}
        linkedSessionId={sessionId}
        onReferralCreated={handleReferralCreated}
      />
    </div>
  );
}

// Participant video component
interface ParticipantVideoProps {
  participant: {
    id: string;
    name: string;
    role: string;
    isMuted: boolean;
    isVideoOff: boolean;
    isHost?: boolean;
  };
  size: 'thumbnail' | 'small' | 'medium' | 'large';
}

function ParticipantVideo({ participant, size }: ParticipantVideoProps) {
  const sizeClasses = {
    thumbnail: 'w-24 h-16',
    small: 'w-full aspect-video',
    medium: 'w-full h-full',
    large: 'w-full h-full',
  };

  return (
    <div className={cn(
      "bg-muted rounded-lg flex items-center justify-center relative overflow-hidden",
      sizeClasses[size]
    )}>
      {participant.isVideoOff ? (
        <Avatar className={size === 'large' ? 'h-20 w-20' : 'h-10 w-10'}>
          <AvatarFallback className={size === 'large' ? 'text-2xl' : 'text-sm'}>
            {participant.name.split(" ").map((n) => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10" />
      )}
      <div className="absolute bottom-1 left-1 flex items-center gap-1">
        <span className="text-xs bg-background/80 px-1 rounded truncate max-w-[80px]">
          {participant.name}
        </span>
        {participant.isHost && <Crown className="h-3 w-3 text-warning" />}
      </div>
      {participant.isMuted && (
        <MicOff className="absolute bottom-1 right-1 h-3 w-3 text-destructive" />
      )}
    </div>
  );
}
