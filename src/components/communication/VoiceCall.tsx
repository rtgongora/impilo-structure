import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX,
  UserCircle, Clock, Pause, Play
} from "lucide-react";
import { useVoiceCalling, formatCallDuration, CallSession } from "@/hooks/useVoiceCalling";
import { toast } from "sonner";

interface VoiceCallProps {
  recipientId: string;
  recipientName?: string;
  recipientAvatar?: string;
  onEnd?: () => void;
  incoming?: boolean;
  session?: CallSession;
}

export function VoiceCall({
  recipientId,
  recipientName = "Unknown",
  recipientAvatar,
  onEnd,
  incoming = false,
  session,
}: VoiceCallProps) {
  const {
    currentCall,
    callState,
    isMuted,
    duration,
    initiateCall,
    answerCall,
    declineCall,
    endCall,
    toggleMute,
    holdCall,
    resumeCall,
  } = useVoiceCalling();

  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const isOnHold = currentCall?.status === 'on_hold';

  const handleStartCall = async () => {
    try {
      await initiateCall(recipientId);
    } catch (error) {
      toast.error("Failed to start call");
    }
  };

  const handleAnswerCall = async () => {
    if (!session) return;
    try {
      await answerCall(session);
    } catch (error) {
      toast.error("Failed to answer call");
    }
  };

  const handleDeclineCall = async () => {
    if (!session) return;
    await declineCall(session);
    onEnd?.();
  };

  const handleEndCall = async () => {
    await endCall();
    onEnd?.();
  };

  const handleToggleHold = async () => {
    if (isOnHold) {
      await resumeCall();
    } else {
      await holdCall();
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="max-w-sm w-full mx-4 text-center">
        {/* Avatar */}
        <div className="mb-6">
          <Avatar className="w-32 h-32 mx-auto mb-4 ring-4 ring-primary/20">
            {recipientAvatar ? (
              <AvatarImage src={recipientAvatar} />
            ) : (
              <AvatarFallback className="text-4xl">
                <UserCircle className="w-16 h-16" />
              </AvatarFallback>
            )}
          </Avatar>
          <h2 className="text-2xl font-semibold">{recipientName}</h2>

          {/* Status */}
          <div className="mt-2">
            {callState === "ringing" && (
              <Badge variant="outline" className="animate-pulse">
                {incoming ? "Incoming call..." : "Calling..."}
              </Badge>
            )}
            {callState === "connected" && (
              <div className="flex items-center justify-center gap-2 text-green-500">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatCallDuration(duration)}</span>
                {isOnHold && <Badge variant="secondary">On Hold</Badge>}
              </div>
            )}
            {callState === "ended" && (
              <Badge variant="secondary">Call ended</Badge>
            )}
          </div>
        </div>

        {/* Audio visualization placeholder */}
        {callState === "connected" && !isOnHold && (
          <div className="flex items-center justify-center gap-1 h-12 mb-6">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-2 bg-primary rounded-full animate-pulse"
                style={{
                  height: `${20 + Math.random() * 20}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {callState === "idle" && (
            <Button
              size="lg"
              className="rounded-full w-16 h-16 bg-green-600 hover:bg-green-700"
              onClick={handleStartCall}
            >
              <Phone className="w-6 h-6" />
            </Button>
          )}

          {callState === "ringing" && incoming && (
            <>
              <Button
                size="lg"
                variant="destructive"
                className="rounded-full w-16 h-16"
                onClick={handleDeclineCall}
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
              <Button
                size="lg"
                className="rounded-full w-16 h-16 bg-green-600 hover:bg-green-700"
                onClick={handleAnswerCall}
              >
                <Phone className="w-6 h-6" />
              </Button>
            </>
          )}

          {callState === "ringing" && !incoming && (
            <Button
              size="lg"
              variant="destructive"
              className="rounded-full w-16 h-16"
              onClick={handleEndCall}
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
          )}

          {callState === "connected" && (
            <>
              <Button
                size="lg"
                variant={isMuted ? "destructive" : "outline"}
                className="rounded-full w-14 h-14"
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>

              <Button
                size="lg"
                variant={isOnHold ? "secondary" : "outline"}
                className="rounded-full w-14 h-14"
                onClick={handleToggleHold}
              >
                {isOnHold ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </Button>

              <Button
                size="lg"
                variant="destructive"
                className="rounded-full w-16 h-16"
                onClick={handleEndCall}
              >
                <PhoneOff className="w-6 h-6" />
              </Button>

              <Button
                size="lg"
                variant={isSpeakerOn ? "default" : "outline"}
                className="rounded-full w-14 h-14"
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
            </>
          )}

          {callState === "ended" && (
            <Button variant="outline" onClick={onEnd}>
              Close
            </Button>
          )}
        </div>
      </div>

      <audio ref={audioRef} autoPlay />
    </div>
  );
}
