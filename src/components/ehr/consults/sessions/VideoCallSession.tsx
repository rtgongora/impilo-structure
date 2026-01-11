/**
 * VideoCallSession - Full audio/video consultation
 * For comprehensive visual examinations and live consultations
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
  Camera,
  ArrowLeft,
  MoreVertical,
  PictureInPicture,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ReferralPackage, ChatMessage } from "@/types/telehealth";

interface VideoCallSessionProps {
  referral: ReferralPackage;
  sessionId: string;
  participants?: { id: string; name: string; role: string }[];
  onComplete: () => void;
  onBack: () => void;
}

type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'ended';
type LayoutMode = 'speaker' | 'grid' | 'presentation';

interface Participant {
  id: string;
  name: string;
  role: string;
  isLocal: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isPresenting?: boolean;
}

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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: "local",
      name: "You",
      role: "Consultant",
      isLocal: true,
      isMuted: false,
      isVideoOff: false,
    },
    {
      id: referral.context.referringProviderId,
      name: referral.context.referringProviderName,
      role: "Referring Clinician",
      isLocal: false,
      isMuted: false,
      isVideoOff: false,
    },
  ]);

  // Simulate connection
  useEffect(() => {
    const timer = setTimeout(() => {
      setConnectionState('connected');
      toast.success("Video call connected");
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

  // Update local participant state
  useEffect(() => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.isLocal ? { ...p, isMuted, isVideoOff, isPresenting: isScreenSharing } : p
      )
    );
  }, [isMuted, isVideoOff, isScreenSharing]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndCall = useCallback(() => {
    setConnectionState('ended');
    toast.info(`Video call ended. Duration: ${formatDuration(duration)}`);
    setTimeout(onComplete, 1500);
  }, [duration, onComplete]);

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

    const remoteParticipants = participants.filter((p) => !p.isLocal);
    const localParticipant = participants.find((p) => p.isLocal);

    if (layoutMode === 'presentation' && isScreenSharing) {
      return (
        <div className="h-full flex">
          {/* Main presentation area */}
          <div className="flex-1 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Monitor className="h-24 w-24 text-primary mx-auto mb-4" />
              <p className="text-lg font-medium">You are sharing your screen</p>
            </div>
          </div>
          
          {/* Participant strip */}
          <div className="w-48 ml-2 flex flex-col gap-2">
            {participants.map((p) => (
              <div
                key={p.id}
                className="aspect-video bg-muted rounded-lg flex items-center justify-center relative"
              >
                {p.isVideoOff ? (
                  <Avatar>
                    <AvatarFallback>{p.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg" />
                )}
                <span className="absolute bottom-1 left-1 text-xs bg-background/80 px-1 rounded">
                  {p.name}
                </span>
                {p.isMuted && (
                  <MicOff className="absolute bottom-1 right-1 h-3 w-3 text-destructive" />
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (layoutMode === 'grid' || remoteParticipants.length > 1) {
      return (
        <div className={cn(
          "h-full grid gap-2 p-2",
          participants.length === 2 && "grid-cols-2",
          participants.length > 2 && participants.length <= 4 && "grid-cols-2 grid-rows-2",
          participants.length > 4 && "grid-cols-3 grid-rows-2"
        )}>
          {participants.map((p) => (
            <div
              key={p.id}
              className="bg-muted rounded-lg flex items-center justify-center relative overflow-hidden"
            >
              {p.isVideoOff ? (
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-2xl">
                    {p.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10" />
              )}
              <div className="absolute bottom-2 left-2 flex items-center gap-2">
                <span className="text-sm bg-background/80 px-2 py-0.5 rounded">
                  {p.isLocal ? "You" : p.name}
                </span>
                {p.isMuted && <MicOff className="h-4 w-4 text-destructive" />}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Speaker view (default)
    return (
      <div className="h-full relative">
        {/* Main video (remote) */}
        <div className="absolute inset-0 bg-muted rounded-lg flex items-center justify-center">
          {remoteParticipants[0]?.isVideoOff ? (
            <Avatar className="h-32 w-32">
              <AvatarFallback className="text-4xl">
                {remoteParticipants[0]?.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg" />
          )}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <span className="text-sm bg-background/80 px-2 py-1 rounded font-medium">
              {remoteParticipants[0]?.name}
            </span>
            {remoteParticipants[0]?.isMuted && (
              <Badge variant="destructive" className="h-6">
                <MicOff className="h-3 w-3" />
              </Badge>
            )}
          </div>
        </div>

        {/* PiP local video */}
        <div className="absolute bottom-4 right-4 w-48 aspect-video bg-muted rounded-lg border-2 border-background shadow-lg flex items-center justify-center overflow-hidden">
          {localParticipant?.isVideoOff ? (
            <Avatar>
              <AvatarFallback>You</AvatarFallback>
            </Avatar>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-secondary/10" />
          )}
          {localParticipant?.isMuted && (
            <MicOff className="absolute bottom-1 right-1 h-4 w-4 text-destructive" />
          )}
        </div>
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
              Video Consultation
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
            {participants.length}
          </Badge>
          
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
        <div className="flex-1 p-2">
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
                  Participants ({participants.length})
                </div>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-2">
                    {participants.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted">
                        <Avatar>
                          <AvatarFallback>
                            {p.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {p.name} {p.isLocal && "(You)"}
                          </p>
                          <p className="text-xs text-muted-foreground">{p.role}</p>
                        </div>
                        <div className="flex gap-1">
                          {p.isMuted && <MicOff className="h-4 w-4 text-muted-foreground" />}
                          {p.isVideoOff && <VideoOff className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {connectionState === 'connected' && (
        <div className="p-4 border-t bg-background">
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="lg"
              className={cn("h-14 w-14 rounded-full", isMuted && "bg-destructive/20 border-destructive")}
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>

            <Button
              variant="outline"
              size="lg"
              className={cn("h-14 w-14 rounded-full", isVideoOff && "bg-destructive/20 border-destructive")}
              onClick={() => setIsVideoOff(!isVideoOff)}
            >
              {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
            </Button>

            <Button
              variant="outline"
              size="lg"
              className={cn("h-14 w-14 rounded-full", isScreenSharing && "bg-primary/20 border-primary")}
              onClick={handleScreenShare}
            >
              {isScreenSharing ? <MonitorOff className="h-6 w-6" /> : <Monitor className="h-6 w-6" />}
            </Button>

            <Button
              variant="destructive"
              size="lg"
              className="h-14 w-14 rounded-full"
              onClick={handleEndCall}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>

            <Separator orientation="vertical" className="h-8 mx-2" />

            <Button variant="ghost" size="lg" className="h-14 w-14 rounded-full" onClick={handleFullscreen}>
              {isFullscreen ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
