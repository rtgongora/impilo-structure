import { useState, useCallback, useRef, useEffect } from "react";
import { WebRTCManager, getSessionByReferralId } from "@/utils/WebRTCManager";
import { toast } from "sonner";

export type CallState = "idle" | "connecting" | "connected" | "failed" | "ended";

interface UseWebRTCOptions {
  participantId: string;
  referralId: string;
}

export function useWebRTC({ participantId, referralId }: UseWebRTCOptions) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteParticipant, setRemoteParticipant] = useState<string | null>(null);
  
  const managerRef = useRef<WebRTCManager | null>(null);

  const initializeManager = useCallback(() => {
    if (managerRef.current) return managerRef.current;

    const manager = new WebRTCManager(participantId, {
      onRemoteStream: (stream) => {
        console.log("[useWebRTC] Remote stream received");
        setRemoteStream(stream);
        setCallState("connected");
        toast.success("Connected to remote participant");
      },
      onConnectionStateChange: (state) => {
        console.log("[useWebRTC] Connection state:", state);
        switch (state) {
          case "connecting":
            setCallState("connecting");
            break;
          case "connected":
            setCallState("connected");
            break;
          case "failed":
          case "disconnected":
            setCallState("failed");
            toast.error("Connection lost");
            break;
          case "closed":
            setCallState("ended");
            break;
        }
      },
      onError: (error) => {
        console.error("[useWebRTC] Error:", error);
        toast.error(`Call error: ${error.message}`);
        setCallState("failed");
      },
      onParticipantJoined: (participantId) => {
        console.log("[useWebRTC] Participant joined:", participantId);
        setRemoteParticipant(participantId);
        toast.info("Participant joined the call");
      },
      onParticipantLeft: (participantId) => {
        console.log("[useWebRTC] Participant left:", participantId);
        setRemoteParticipant(null);
        setRemoteStream(null);
        toast.info("Participant left the call");
      },
    });

    managerRef.current = manager;
    return manager;
  }, [participantId]);

  const startCall = useCallback(async (audio: boolean = true, video: boolean = true) => {
    try {
      setCallState("connecting");
      const manager = initializeManager();

      // Check if there's an existing session for this referral
      const existingSession = await getSessionByReferralId(referralId);

      if (existingSession) {
        // Join existing session
        console.log("[useWebRTC] Joining existing session:", existingSession.id);
        await manager.joinSession(existingSession.id);
      } else {
        // Create new session
        console.log("[useWebRTC] Creating new session for referral:", referralId);
        await manager.createSession(referralId);
      }

      // Start the call
      const stream = await manager.startCall(audio, video);
      setLocalStream(stream);
      
      toast.success("Call started - waiting for participant");
    } catch (error) {
      console.error("[useWebRTC] Error starting call:", error);
      setCallState("failed");
      toast.error("Failed to start call. Please check camera/microphone permissions.");
    }
  }, [referralId, initializeManager]);

  const endCall = useCallback(async () => {
    if (managerRef.current) {
      await managerRef.current.endCall();
      managerRef.current = null;
    }
    
    setLocalStream(null);
    setRemoteStream(null);
    setCallState("ended");
    setRemoteParticipant(null);
    setIsMuted(false);
    setIsVideoOff(false);
    
    toast.info("Call ended");
  }, []);

  const toggleMute = useCallback(() => {
    if (managerRef.current) {
      const newMuted = !isMuted;
      managerRef.current.toggleAudio(!newMuted);
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  const toggleVideo = useCallback(() => {
    if (managerRef.current) {
      const newVideoOff = !isVideoOff;
      managerRef.current.toggleVideo(!newVideoOff);
      setIsVideoOff(newVideoOff);
    }
  }, [isVideoOff]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.endCall();
      }
    };
  }, []);

  return {
    callState,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    remoteParticipant,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
}
