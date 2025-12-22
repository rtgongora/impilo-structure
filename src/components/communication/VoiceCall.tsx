import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX,
  UserCircle, Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface VoiceCallProps {
  recipientId?: string;
  recipientName?: string;
  recipientAvatar?: string;
  onEnd?: () => void;
  incoming?: boolean;
  callId?: string;
}

export function VoiceCall({
  recipientId,
  recipientName = "Unknown",
  recipientAvatar,
  onEnd,
  incoming = false,
  callId,
}: VoiceCallProps) {
  const { user } = useAuth();
  const [callState, setCallState] = useState<"idle" | "ringing" | "connected" | "ended">(
    incoming ? "ringing" : "idle"
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [duration, setDuration] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Start duration timer when connected
  useEffect(() => {
    if (callState !== "connected") return;
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callState]);

  // Request audio when initiating call
  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      setCallState("ringing");

      // Log call initiation
      if (user && recipientId) {
        await supabase.from("voice_calls").insert({
          caller_id: user.id,
          recipient_id: recipientId,
          call_type: "audio",
          status: "ringing",
          started_at: new Date().toISOString(),
        });
      }

      // Simulate connection after 2 seconds (in production, use WebRTC signaling)
      setTimeout(() => {
        setCallState("connected");
        toast.success("Call connected");
      }, 2000);
    } catch (error) {
      console.error("Error starting call:", error);
      toast.error("Failed to access microphone");
    }
  };

  const answerCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      setCallState("connected");

      if (callId) {
        await supabase
          .from("voice_calls")
          .update({
            status: "connected",
            answered_at: new Date().toISOString(),
          })
          .eq("id", callId);
      }

      toast.success("Call connected");
    } catch (error) {
      console.error("Error answering call:", error);
      toast.error("Failed to access microphone");
    }
  };

  const endCall = async () => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    setCallState("ended");

    // Update call record
    if (callId && user) {
      await supabase
        .from("voice_calls")
        .update({
          status: "ended",
          ended_at: new Date().toISOString(),
          duration_seconds: duration,
        })
        .eq("id", callId);
    }

    onEnd?.();
  };

  const declineCall = async () => {
    if (callId) {
      await supabase
        .from("voice_calls")
        .update({
          status: "declined",
          ended_at: new Date().toISOString(),
        })
        .eq("id", callId);
    }
    onEnd?.();
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
              <div className="flex items-center justify-center gap-2 text-success">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatDuration(duration)}</span>
              </div>
            )}
            {callState === "ended" && (
              <Badge variant="secondary">Call ended</Badge>
            )}
          </div>
        </div>

        {/* Audio visualization placeholder */}
        {callState === "connected" && (
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
              className="rounded-full w-16 h-16 bg-success hover:bg-success/90"
              onClick={startCall}
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
                onClick={declineCall}
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
              <Button
                size="lg"
                className="rounded-full w-16 h-16 bg-success hover:bg-success/90"
                onClick={answerCall}
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
              onClick={endCall}
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
                variant="destructive"
                className="rounded-full w-16 h-16"
                onClick={endCall}
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
