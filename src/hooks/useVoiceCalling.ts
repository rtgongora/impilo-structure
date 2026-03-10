import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface CallSession {
  id: string;
  caller_id: string;
  callee_id: string;
  call_type: 'audio' | 'video';
  status: 'initiating' | 'ringing' | 'connected' | 'on_hold' | 'ended' | 'missed' | 'declined' | 'failed';
  sdp_offer: string | null;
  sdp_answer: string | null;
  started_at: string | null;
  connected_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  created_at: string;
}

interface ICECandidate {
  id: string;
  session_id: string;
  sender_id: string;
  candidate_data: RTCIceCandidateInit;
  created_at: string;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ],
};

export function useVoiceCalling() {
  const { user } = useAuth();
  const [currentCall, setCurrentCall] = useState<CallSession | null>(null);
  const [callState, setCallState] = useState<'idle' | 'initiating' | 'ringing' | 'connecting' | 'connected' | 'ended'>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const sessionChannelRef = useRef<RealtimeChannel | null>(null);
  const iceChannelRef = useRef<RealtimeChannel | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  // Listen for incoming calls
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('incoming-calls')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_sessions',
          filter: `callee_id=eq.${user.id}`,
        },
        (payload) => {
          const call = payload.new as CallSession;
          if (call.status === 'initiating' || call.status === 'ringing') {
            setIncomingCall(call);
            toast.info(`Incoming call...`, { duration: 30000 });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Duration timer
  useEffect(() => {
    if (callState === 'connected') {
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callState]);

  const cleanup = useCallback(() => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Remove channels
    if (sessionChannelRef.current) {
      supabase.removeChannel(sessionChannelRef.current);
      sessionChannelRef.current = null;
    }
    if (iceChannelRef.current) {
      supabase.removeChannel(iceChannelRef.current);
      iceChannelRef.current = null;
    }
    
    pendingCandidatesRef.current = [];
    setRemoteStream(null);
    setCallState('idle');
    setCurrentCall(null);
    setDuration(0);
  }, [localStream]);

  const setupPeerConnection = useCallback(async (sessionId: string, isInitiator: boolean) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('[VoiceCall] Received remote track:', event.track.kind);
      if (event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate && user?.id) {
        console.log('[VoiceCall] Sending ICE candidate');
        await (supabase.from('call_ice_candidates') as any).insert({
          session_id: sessionId,
          sender_id: user.id,
          candidate_data: event.candidate.toJSON(),
        });
      }
    };

    // Handle connection state
    pc.onconnectionstatechange = () => {
      console.log('[VoiceCall] Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallState('connected');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        toast.error('Call connection lost');
        cleanup();
      }
    };

    // Subscribe to ICE candidates
    iceChannelRef.current = supabase
      .channel(`call-ice-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_ice_candidates',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          const candidate = payload.new as ICECandidate;
          if (candidate.sender_id !== user?.id) {
            const iceCandidate = new RTCIceCandidate(candidate.candidate_data);
            if (pc.remoteDescription) {
              await pc.addIceCandidate(iceCandidate);
            } else {
              pendingCandidatesRef.current.push(iceCandidate);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to session updates (for SDP exchange)
    sessionChannelRef.current = supabase
      .channel(`call-session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_sessions',
          filter: `id=eq.${sessionId}`,
        },
        async (payload) => {
          const session = payload.new as CallSession;
          setCurrentCall(session);

          // Handle incoming answer (for caller)
          if (isInitiator && session.sdp_answer && !pc.currentRemoteDescription) {
            console.log('[VoiceCall] Received answer');
            await pc.setRemoteDescription({
              type: 'answer',
              sdp: session.sdp_answer,
            });
            
            // Process pending ICE candidates
            for (const candidate of pendingCandidatesRef.current) {
              await pc.addIceCandidate(candidate);
            }
            pendingCandidatesRef.current = [];
          }

          // Handle call ended
          if (session.status === 'ended' || session.status === 'declined') {
            toast.info('Call ended');
            cleanup();
          }
        }
      )
      .subscribe();

    return pc;
  }, [user?.id, cleanup]);

  const initiateCall = useCallback(async (calleeId: string, callType: 'audio' | 'video' = 'audio') => {
    if (!user?.id) {
      toast.error('Not authenticated');
      return;
    }

    try {
      setCallState('initiating');

      // Get media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: callType === 'video',
      });
      setLocalStream(stream);

      // Create call session
      const { data: session, error } = await supabase
        .from('call_sessions')
        .insert({
          caller_id: user.id,
          callee_id: calleeId,
          call_type: callType,
          status: 'initiating',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      setCurrentCall(session as unknown as CallSession);
      setCallState('ringing');

      // Setup peer connection
      const pc = await setupPeerConnection(session.id, true);

      // Add tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Create and set offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Update session with offer
      await supabase
        .from('call_sessions')
        .update({
          sdp_offer: offer.sdp,
          status: 'ringing',
        })
        .eq('id', session.id);

      console.log('[VoiceCall] Call initiated, waiting for answer...');
    } catch (error) {
      console.error('[VoiceCall] Error initiating call:', error);
      toast.error('Failed to start call');
      cleanup();
    }
  }, [user?.id, setupPeerConnection, cleanup]);

  const answerCall = useCallback(async (session: CallSession) => {
    if (!user?.id) {
      toast.error('Not authenticated');
      return;
    }

    try {
      setCallState('connecting');
      setIncomingCall(null);
      setCurrentCall(session);

      // Get media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: session.call_type === 'video',
      });
      setLocalStream(stream);

      // Setup peer connection
      const pc = await setupPeerConnection(session.id, false);

      // Add tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Set remote description (offer)
      if (session.sdp_offer) {
        await pc.setRemoteDescription({
          type: 'offer',
          sdp: session.sdp_offer,
        });

        // Process pending ICE candidates
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(candidate);
        }
        pendingCandidatesRef.current = [];

        // Create and set answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // Update session with answer
        await supabase
          .from('call_sessions')
          .update({
            sdp_answer: answer.sdp,
            status: 'connected',
            connected_at: new Date().toISOString(),
          })
          .eq('id', session.id);

        setCallState('connected');
        console.log('[VoiceCall] Call answered');
      }
    } catch (error) {
      console.error('[VoiceCall] Error answering call:', error);
      toast.error('Failed to answer call');
      cleanup();
    }
  }, [user?.id, setupPeerConnection, cleanup]);

  const declineCall = useCallback(async (session: CallSession) => {
    setIncomingCall(null);
    await supabase
      .from('call_sessions')
      .update({
        status: 'declined',
        ended_at: new Date().toISOString(),
      })
      .eq('id', session.id);
  }, []);

  const endCall = useCallback(async () => {
    if (currentCall) {
      await supabase
        .from('call_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          duration_seconds: duration,
        })
        .eq('id', currentCall.id);
    }
    cleanup();
  }, [currentCall, duration, cleanup]);

  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  }, [localStream, isMuted]);

  const holdCall = useCallback(async () => {
    if (currentCall) {
      await supabase
        .from('call_sessions')
        .update({ status: 'on_hold' })
        .eq('id', currentCall.id);
    }
  }, [currentCall]);

  const resumeCall = useCallback(async () => {
    if (currentCall) {
      await supabase
        .from('call_sessions')
        .update({ status: 'connected' })
        .eq('id', currentCall.id);
    }
  }, [currentCall]);

  return {
    // State
    currentCall,
    callState,
    localStream,
    remoteStream,
    isMuted,
    duration,
    incomingCall,
    
    // Actions
    initiateCall,
    answerCall,
    declineCall,
    endCall,
    toggleMute,
    holdCall,
    resumeCall,
  };
}

// Format duration helper
export function formatCallDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
