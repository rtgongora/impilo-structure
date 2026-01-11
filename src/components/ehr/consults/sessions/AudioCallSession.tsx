/**
 * AudioCallSession - VOIP audio-only consultation
 * For voice consultations without video overhead
 */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  Clock,
  User,
  Pause,
  Play,
  ArrowLeft,
  MessageSquare,
  FileText,
  AlertCircle,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ReferralPackage } from "@/types/telehealth";

interface AudioCallSessionProps {
  referral: ReferralPackage;
  sessionId: string;
  onEscalateToVideo?: () => void;
  onComplete: () => void;
  onBack: () => void;
}

type CallState = 'connecting' | 'ringing' | 'connected' | 'on_hold' | 'ended';

export function AudioCallSession({
  referral,
  sessionId,
  onEscalateToVideo,
  onComplete,
  onBack,
}: AudioCallSessionProps) {
  const [callState, setCallState] = useState<CallState>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [volume, setVolume] = useState([80]);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioLevelRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate connection
  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setCallState('ringing');
    }, 1500);

    const ringTimer = setTimeout(() => {
      setCallState('connected');
      toast.success("Call connected");
    }, 4000);

    return () => {
      clearTimeout(connectTimer);
      clearTimeout(ringTimer);
    };
  }, []);

  // Call duration timer
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Simulate audio level
  useEffect(() => {
    if (callState === 'connected' && !isMuted) {
      audioLevelRef.current = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
    } else {
      setAudioLevel(0);
    }
    return () => {
      if (audioLevelRef.current) clearInterval(audioLevelRef.current);
    };
  }, [callState, isMuted]);

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
    setCallState('ended');
    toast.info(`Call ended. Duration: ${formatDuration(duration)}`);
    setTimeout(onComplete, 1500);
  }, [duration, onComplete]);

  const handleHold = () => {
    if (callState === 'connected') {
      setCallState('on_hold');
      toast.info("Call on hold");
    } else if (callState === 'on_hold') {
      setCallState('connected');
      toast.info("Call resumed");
    }
  };

  const getCallStateUI = () => {
    switch (callState) {
      case 'connecting':
        return (
          <div className="text-center">
            <div className="w-32 h-32 rounded-full border-4 border-primary/30 mx-auto mb-6 flex items-center justify-center animate-pulse">
              <Phone className="h-16 w-16 text-primary animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Connecting...</h2>
            <p className="text-muted-foreground">Establishing secure audio connection</p>
          </div>
        );

      case 'ringing':
        return (
          <div className="text-center">
            <div className="w-32 h-32 rounded-full border-4 border-primary mx-auto mb-6 flex items-center justify-center animate-[ring_0.5s_ease-in-out_infinite]">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {referral.context.referringProviderName.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
            </div>
            <h2 className="text-xl font-semibold mb-2">Ringing...</h2>
            <p className="text-muted-foreground">{referral.context.referringProviderName}</p>
            <p className="text-sm text-muted-foreground">{referral.context.referringFacilityName}</p>
          </div>
        );

      case 'connected':
      case 'on_hold':
        return (
          <div className="text-center">
            <div className={cn(
              "w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center relative",
              callState === 'on_hold' ? "border-4 border-warning bg-warning/10" : "border-4 border-success bg-success/10"
            )}>
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-3xl">
                  {referral.context.referringProviderName.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              {callState === 'on_hold' && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
                  <Pause className="h-12 w-12 text-warning" />
                </div>
              )}
            </div>
            
            <h2 className="text-xl font-semibold mb-1">
              {referral.context.referringProviderName}
            </h2>
            <p className="text-muted-foreground mb-4">{referral.context.referringFacilityName}</p>
            
            <Badge variant={callState === 'on_hold' ? 'outline' : 'default'} className="text-lg px-4 py-1">
              <Clock className="h-4 w-4 mr-2" />
              {formatDuration(duration)}
            </Badge>

            {callState === 'on_hold' && (
              <Badge variant="outline" className="ml-2 text-warning border-warning">
                On Hold
              </Badge>
            )}

            {/* Audio level indicator */}
            <div className="mt-6 max-w-xs mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <Radio className={cn("h-4 w-4", isMuted ? "text-muted-foreground" : "text-success")} />
                <span className="text-sm text-muted-foreground">Audio Level</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-100 rounded-full",
                    isMuted ? "bg-muted-foreground" : "bg-success"
                  )}
                  style={{ width: `${isMuted ? 0 : audioLevel}%` }}
                />
              </div>
            </div>
          </div>
        );

      case 'ended':
        return (
          <div className="text-center">
            <div className="w-32 h-32 rounded-full border-4 border-muted mx-auto mb-6 flex items-center justify-center">
              <PhoneOff className="h-16 w-16 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Call Ended</h2>
            <p className="text-muted-foreground">Duration: {formatDuration(duration)}</p>
            <p className="text-sm text-muted-foreground mt-2">Proceeding to documentation...</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              Audio Consultation
            </h3>
            <p className="text-xs text-muted-foreground">
              {referral.context.specialty} • {referral.patientHID}
            </p>
          </div>
        </div>

        {callState === 'connected' && onEscalateToVideo && (
          <Button variant="outline" onClick={onEscalateToVideo}>
            <Video className="h-4 w-4 mr-2" />
            Switch to Video
          </Button>
        )}
      </div>

      {/* Main Call Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        {getCallStateUI()}
      </div>

      {/* Controls */}
      {(callState === 'connected' || callState === 'on_hold' || callState === 'ringing') && (
        <div className="p-6 border-t bg-background">
          <div className="max-w-md mx-auto">
            {/* Volume Control */}
            {callState !== 'ringing' && (
              <div className="flex items-center gap-4 mb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
                >
                  {isSpeakerMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <Slider
                  value={isSpeakerMuted ? [0] : volume}
                  onValueChange={setVolume}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-8">
                  {isSpeakerMuted ? 0 : volume[0]}%
                </span>
              </div>
            )}

            {/* Call Controls */}
            <div className="flex items-center justify-center gap-4">
              {callState !== 'ringing' && (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "h-16 w-16 rounded-full",
                      isMuted && "bg-destructive/20 border-destructive"
                    )}
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? (
                      <MicOff className="h-6 w-6" />
                    ) : (
                      <Mic className="h-6 w-6" />
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "h-16 w-16 rounded-full",
                      callState === 'on_hold' && "bg-warning/20 border-warning"
                    )}
                    onClick={handleHold}
                  >
                    {callState === 'on_hold' ? (
                      <Play className="h-6 w-6" />
                    ) : (
                      <Pause className="h-6 w-6" />
                    )}
                  </Button>
                </>
              )}

              <Button
                variant="destructive"
                size="lg"
                className="h-16 w-16 rounded-full"
                onClick={handleEndCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>

            {/* Quick Actions */}
            {callState === 'connected' && (
              <div className="flex justify-center gap-2 mt-6">
                <Button variant="ghost" size="sm">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Send Message
                </Button>
                <Button variant="ghost" size="sm">
                  <FileText className="h-4 w-4 mr-1" />
                  Quick Note
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Patient Context Footer */}
      <div className="p-2 border-t bg-muted/30 text-center text-xs text-muted-foreground">
        <span className="font-medium">{referral.patientHID}</span>
        {" • "}
        <span>{referral.clinicalNarrative.chiefComplaint}</span>
        {" • "}
        <span>Call is encrypted and recorded for clinical documentation</span>
      </div>
    </div>
  );
}
