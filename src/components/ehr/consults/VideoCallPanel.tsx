import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  Maximize2, Users, Phone
} from "lucide-react";
import { CallState } from "@/hooks/useWebRTC";
import { cn } from "@/lib/utils";

interface VideoCallPanelProps {
  callState: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  remoteParticipant: string | null;
  onStartCall: (audio: boolean, video: boolean) => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}

export function VideoCallPanel({
  callState,
  localStream,
  remoteStream,
  isMuted,
  isVideoOff,
  remoteParticipant,
  onStartCall,
  onEndCall,
  onToggleMute,
  onToggleVideo,
}: VideoCallPanelProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const getStateLabel = () => {
    switch (callState) {
      case "idle":
        return "Ready to call";
      case "connecting":
        return "Connecting...";
      case "connected":
        return "Connected";
      case "failed":
        return "Connection failed";
      case "ended":
        return "Call ended";
    }
  };

  const getStateBadgeVariant = () => {
    switch (callState) {
      case "connected":
        return "bg-success text-success-foreground";
      case "connecting":
        return "bg-warning text-warning-foreground animate-pulse";
      case "failed":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (callState === "idle" || callState === "ended") {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 space-y-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Video className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Start Teleconsultation</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Connect with the consulting physician via real-time video or audio call.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => onStartCall(true, true)}
            className="flex items-center gap-2"
          >
            <Video className="w-4 h-4" />
            Video Call
          </Button>
          <Button
            variant="outline"
            onClick={() => onStartCall(true, false)}
            className="flex items-center gap-2"
          >
            <Phone className="w-4 h-4" />
            Audio Only
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      <div className="flex items-center justify-between p-2 border-b">
        <Badge className={getStateBadgeVariant()}>
          {getStateLabel()}
        </Badge>
        {remoteParticipant && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{remoteParticipant}</span>
          </div>
        )}
      </div>

      {/* Video area */}
      <div className="flex-1 relative bg-muted/20 min-h-[300px]">
        {/* Remote video (large) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={cn(
            "w-full h-full object-cover",
            !remoteStream && "hidden"
          )}
        />
        
        {/* Placeholder when no remote stream */}
        {!remoteStream && callState === "connecting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Waiting for participant to join...
            </p>
          </div>
        )}

        {!remoteStream && callState === "connected" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
              <Phone className="w-8 h-8 text-success" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Audio call active
            </p>
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-background shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              "w-full h-full object-cover",
              isVideoOff && "hidden"
            )}
          />
          {isVideoOff && (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <VideoOff className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t bg-background">
        <div className="flex items-center justify-center gap-3">
          <Button
            variant={isMuted ? "destructive" : "outline"}
            size="icon"
            className="rounded-full w-12 h-12"
            onClick={onToggleMute}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          
          <Button
            variant={isVideoOff ? "destructive" : "outline"}
            size="icon"
            className="rounded-full w-12 h-12"
            onClick={onToggleVideo}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </Button>
          
          <Button
            variant="destructive"
            size="icon"
            className="rounded-full w-14 h-14"
            onClick={onEndCall}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-12 h-12"
          >
            <Maximize2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
