import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import type { Json } from "@/integrations/supabase/types";

export interface WebRTCCallbacks {
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  onError: (error: Error) => void;
  onParticipantJoined: (participantId: string) => void;
  onParticipantLeft: (participantId: string) => void;
}

export interface TeleconsultSession {
  id: string;
  referral_id: string;
  created_by: string;
  status: string;
  created_at: string;
  ended_at: string | null;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private channel: RealtimeChannel | null = null;
  private sessionId: string | null = null;
  private participantId: string;
  private callbacks: WebRTCCallbacks;
  private pendingCandidates: RTCIceCandidate[] = [];
  private isInitiator: boolean = false;

  constructor(participantId: string, callbacks: WebRTCCallbacks) {
    this.participantId = participantId;
    this.callbacks = callbacks;
  }

  async createSession(referralId: string): Promise<string> {
    console.log("[WebRTC] Creating new session for referral:", referralId);
    
    const { data, error } = await supabase
      .from("teleconsult_sessions")
      .insert({
        referral_id: referralId,
        created_by: this.participantId,
        status: "waiting",
      })
      .select()
      .single();

    if (error) {
      console.error("[WebRTC] Error creating session:", error);
      throw error;
    }

    this.sessionId = data.id;
    this.isInitiator = true;
    await this.setupSignaling();
    
    console.log("[WebRTC] Session created:", this.sessionId);
    return this.sessionId;
  }

  async joinSession(sessionId: string): Promise<void> {
    console.log("[WebRTC] Joining session:", sessionId);
    this.sessionId = sessionId;
    this.isInitiator = false;
    
    await this.setupSignaling();
    
    // Notify that we joined
    await this.sendSignal("join", { participantId: this.participantId });
    
    console.log("[WebRTC] Joined session:", sessionId);
  }

  private async setupSignaling(): Promise<void> {
    if (!this.sessionId) return;

    console.log("[WebRTC] Setting up signaling for session:", this.sessionId);

    // Subscribe to signals for this session
    this.channel = supabase
      .channel(`teleconsult-${this.sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "teleconsult_signals",
          filter: `session_id=eq.${this.sessionId}`,
        },
        (payload) => {
          const signal = payload.new as {
            sender_id: string;
            signal_type: string;
            signal_data: unknown;
          };
          
          // Ignore our own signals
          if (signal.sender_id === this.participantId) return;
          
          console.log("[WebRTC] Received signal:", signal.signal_type);
          this.handleSignal(signal.signal_type, signal.signal_data);
        }
      )
      .subscribe((status) => {
        console.log("[WebRTC] Channel subscription status:", status);
      });
  }

  private async handleSignal(type: string, data: unknown): Promise<void> {
    console.log("[WebRTC] Handling signal:", type);

    try {
      switch (type) {
        case "join":
          const joinData = data as { participantId: string };
          this.callbacks.onParticipantJoined(joinData.participantId);
          
          // If we're the initiator and someone joined, create and send offer
          if (this.isInitiator && this.peerConnection) {
            await this.createAndSendOffer();
          }
          break;

        case "offer":
          const offerData = data as { sdp: string };
          await this.handleOffer(offerData.sdp);
          break;

        case "answer":
          const answerData = data as { sdp: string };
          await this.handleAnswer(answerData.sdp);
          break;

        case "ice-candidate":
          const candidateData = data as RTCIceCandidateInit;
          await this.handleIceCandidate(candidateData);
          break;

        case "leave":
          const leaveData = data as { participantId: string };
          this.callbacks.onParticipantLeft(leaveData.participantId);
          break;
      }
    } catch (error) {
      console.error("[WebRTC] Error handling signal:", error);
      this.callbacks.onError(error as Error);
    }
  }

  async startCall(audio: boolean = true, video: boolean = true): Promise<MediaStream> {
    console.log("[WebRTC] Starting call with audio:", audio, "video:", video);

    // Get local media stream
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: audio ? {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      } : false,
      video: video ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user",
      } : false,
    });

    // Create peer connection
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to peer connection
    this.localStream.getTracks().forEach((track) => {
      console.log("[WebRTC] Adding local track:", track.kind);
      this.peerConnection!.addTrack(track, this.localStream!);
    });

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log("[WebRTC] Received remote track:", event.track.kind);
      if (event.streams[0]) {
        this.callbacks.onRemoteStream(event.streams[0]);
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("[WebRTC] New ICE candidate");
        this.sendSignal("ice-candidate", event.candidate.toJSON());
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state:", this.peerConnection?.connectionState);
      if (this.peerConnection) {
        this.callbacks.onConnectionStateChange(this.peerConnection.connectionState);
      }
    };

    // Update session status
    if (this.sessionId) {
      await supabase
        .from("teleconsult_sessions")
        .update({ status: "connecting" })
        .eq("id", this.sessionId);
    }

    // If we're the initiator, wait for someone to join before sending offer
    // Otherwise, the joiner will trigger the offer creation

    return this.localStream;
  }

  private async createAndSendOffer(): Promise<void> {
    if (!this.peerConnection) return;

    console.log("[WebRTC] Creating offer");
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    
    await this.sendSignal("offer", { sdp: offer.sdp });
  }

  private async handleOffer(sdp: string): Promise<void> {
    if (!this.peerConnection) {
      console.log("[WebRTC] No peer connection, starting call first");
      await this.startCall(true, true);
    }

    console.log("[WebRTC] Setting remote description (offer)");
    await this.peerConnection!.setRemoteDescription({
      type: "offer",
      sdp,
    });

    // Process any pending ICE candidates
    for (const candidate of this.pendingCandidates) {
      await this.peerConnection!.addIceCandidate(candidate);
    }
    this.pendingCandidates = [];

    // Create and send answer
    console.log("[WebRTC] Creating answer");
    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);
    
    await this.sendSignal("answer", { sdp: answer.sdp });
  }

  private async handleAnswer(sdp: string): Promise<void> {
    if (!this.peerConnection) return;

    console.log("[WebRTC] Setting remote description (answer)");
    await this.peerConnection.setRemoteDescription({
      type: "answer",
      sdp,
    });

    // Process any pending ICE candidates
    for (const candidate of this.pendingCandidates) {
      await this.peerConnection.addIceCandidate(candidate);
    }
    this.pendingCandidates = [];

    // Update session status to active
    if (this.sessionId) {
      await supabase
        .from("teleconsult_sessions")
        .update({ status: "active" })
        .eq("id", this.sessionId);
    }
  }

  private async handleIceCandidate(candidateInit: RTCIceCandidateInit): Promise<void> {
    const candidate = new RTCIceCandidate(candidateInit);

    if (this.peerConnection?.remoteDescription) {
      console.log("[WebRTC] Adding ICE candidate");
      await this.peerConnection.addIceCandidate(candidate);
    } else {
      console.log("[WebRTC] Queueing ICE candidate");
      this.pendingCandidates.push(candidate);
    }
  }

  private async sendSignal(type: string, data: Record<string, unknown> | RTCIceCandidateInit): Promise<void> {
    if (!this.sessionId) return;

    console.log("[WebRTC] Sending signal:", type);
    
    const insertData = {
      session_id: this.sessionId,
      sender_id: this.participantId,
      signal_type: type,
      signal_data: data as Json,
    };

    const { error } = await supabase
      .from("teleconsult_signals")
      .insert(insertData);

    if (error) {
      console.error("[WebRTC] Error sending signal:", error);
      throw error;
    }
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
      console.log("[WebRTC] Audio toggled:", enabled);
    }
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
      console.log("[WebRTC] Video toggled:", enabled);
    }
  }

  async endCall(): Promise<void> {
    console.log("[WebRTC] Ending call");

    // Send leave signal
    if (this.sessionId) {
      await this.sendSignal("leave", { participantId: this.participantId });

      // Update session status
      await supabase
        .from("teleconsult_sessions")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", this.sessionId);
    }

    // Cleanup
    this.cleanup();
  }

  private cleanup(): void {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Unsubscribe from channel
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }

    this.sessionId = null;
    this.pendingCandidates = [];
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }
}

// Utility to check if a session exists and get its status
export async function getSessionByReferralId(referralId: string): Promise<TeleconsultSession | null> {
  const { data, error } = await supabase
    .from("teleconsult_sessions")
    .select("*")
    .eq("referral_id", referralId)
    .eq("status", "waiting")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[WebRTC] Error fetching session:", error);
    return null;
  }

  return data;
}
