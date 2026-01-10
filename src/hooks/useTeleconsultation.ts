import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface TeleconsultSession {
  id: string;
  referral_id: string | null;
  patient_id: string;
  requesting_provider_id: string | null;
  consulting_provider_id: string | null;
  session_number: string | null;
  workflow_stage: number;
  stage_status: string;
  referral_summary: string | null;
  clinical_question: string | null;
  attachments: any[] | null;
  urgency: 'routine' | 'urgent' | 'emergent';
  consent_obtained: boolean;
  consent_timestamp: string | null;
  scheduled_at: string | null;
  waiting_room_joined_at: string | null;
  session_started_at: string | null;
  session_ended_at: string | null;
  sdp_offer: string | null;
  sdp_answer: string | null;
  call_quality_rating: number | null;
  consultation_notes: string | null;
  recommendations: string | null;
  follow_up_required: boolean;
  follow_up_date: string | null;
  outcome: string | null;
  is_recorded: boolean;
  recording_path: string | null;
  status: 'draft' | 'submitted' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface TeleconsultNote {
  id: string;
  session_id: string;
  author_id: string;
  note_type: 'general' | 'subjective' | 'objective' | 'assessment' | 'plan' | 'recommendation';
  content: string;
  is_shared_with_patient: boolean;
  created_at: string;
}

export const WORKFLOW_STAGES = [
  { stage: 1, name: 'Referral Package', description: 'Build referral letter and patient summary' },
  { stage: 2, name: 'Routing & Consent', description: 'Route to specialist and capture consent' },
  { stage: 3, name: 'Scheduling', description: 'Schedule teleconsult appointment' },
  { stage: 4, name: 'Waiting Room', description: 'Join virtual waiting room' },
  { stage: 5, name: 'Live Teleconsult', description: 'Video/audio consultation session' },
  { stage: 6, name: 'Documentation', description: 'Record consultation notes and recommendations' },
  { stage: 7, name: 'Completion', description: 'Finalize outcome and follow-up' },
];

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useTeleconsultation(sessionId?: string) {
  const { user } = useAuth();
  const [session, setSession] = useState<TeleconsultSession | null>(null);
  const [notes, setNotes] = useState<TeleconsultNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);

  // Load session
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId]);

  const loadSession = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teleconsult_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setSession(data as unknown as TeleconsultSession);

      // Load notes
      const { data: notesData } = await supabase
        .from('teleconsult_notes')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: true });

      if (notesData) setNotes(notesData as unknown as TeleconsultNote[]);
    } catch (error) {
      console.error('[Teleconsult] Error loading session:', error);
      toast.error('Failed to load teleconsult session');
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (patientId: string, referralId?: string) => {
    if (!user?.id) {
      toast.error('Not authenticated');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('teleconsult_sessions')
        .insert({
          patient_id: patientId,
          referral_id: referralId || null,
          requesting_provider_id: user.id,
          workflow_stage: 1,
          stage_status: 'in_progress',
          status: 'draft',
          created_by: user.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      setSession(data as unknown as TeleconsultSession);
      toast.success('Teleconsult session created');
      return data;
    } catch (error) {
      console.error('[Teleconsult] Error creating session:', error);
      toast.error('Failed to create session');
      return null;
    }
  };

  const updateSession = async (updates: Partial<TeleconsultSession>) => {
    if (!session?.id) return;

    try {
      const { data, error } = await supabase
        .from('teleconsult_sessions')
        .update(updates as any)
        .eq('id', session.id)
        .select()
        .single();

      if (error) throw error;
      setSession(data as unknown as TeleconsultSession);
      return data;
    } catch (error) {
      console.error('[Teleconsult] Error updating session:', error);
      toast.error('Failed to update session');
      return null;
    }
  };

  const advanceStage = async () => {
    if (!session) return;
    
    const nextStage = Math.min(session.workflow_stage + 1, 7);
    await updateSession({
      workflow_stage: nextStage,
      stage_status: 'in_progress',
    });
    toast.success(`Advanced to Stage ${nextStage}: ${WORKFLOW_STAGES[nextStage - 1].name}`);
  };

  const captureConsent = async () => {
    await updateSession({
      consent_obtained: true,
      consent_timestamp: new Date().toISOString(),
    });
    toast.success('Consent captured');
  };

  const joinWaitingRoom = async () => {
    await updateSession({
      waiting_room_joined_at: new Date().toISOString(),
      workflow_stage: 4,
      stage_status: 'in_progress',
    });
    toast.success('Joined waiting room');
  };

  const addNote = async (noteType: TeleconsultNote['note_type'], content: string) => {
    if (!session?.id || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from('teleconsult_notes')
        .insert({
          session_id: session.id,
          author_id: user.id,
          note_type: noteType,
          content,
        } as any)
        .select()
        .single();

      if (error) throw error;
      setNotes((prev) => [...prev, data as unknown as TeleconsultNote]);
      return data;
    } catch (error) {
      console.error('[Teleconsult] Error adding note:', error);
      toast.error('Failed to add note');
      return null;
    }
  };

  // WebRTC functions for Stage 5
  const startVideoCall = async (isInitiator: boolean) => {
    if (!session?.id) return;

    try {
      // Get media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });
      setLocalStream(stream);

      // Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // Add tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        if (event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      // Handle connection state
      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
        if (pc.connectionState === 'connected') {
          updateSession({
            session_started_at: new Date().toISOString(),
            workflow_stage: 5,
            stage_status: 'in_progress',
            status: 'in_progress',
          });
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate && user?.id) {
          await (supabase.from('teleconsult_ice_candidates') as any).insert({
            session_id: session.id,
            sender_id: user.id,
            candidate_data: event.candidate.toJSON(),
          });
        }
      };

      // Subscribe to session updates for signaling
      channelRef.current = supabase
        .channel(`teleconsult-${session.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'teleconsult_sessions',
            filter: `id=eq.${session.id}`,
          },
          async (payload) => {
            const updated = payload.new as unknown as TeleconsultSession;
            setSession(updated);

            // Handle incoming answer
            if (isInitiator && updated.sdp_answer && !pc.currentRemoteDescription) {
              await pc.setRemoteDescription({
                type: 'answer',
                sdp: updated.sdp_answer,
              });
              for (const candidate of pendingCandidatesRef.current) {
                await pc.addIceCandidate(candidate);
              }
              pendingCandidatesRef.current = [];
            }

            // Handle incoming offer (for non-initiator)
            if (!isInitiator && updated.sdp_offer && !pc.currentRemoteDescription) {
              await pc.setRemoteDescription({
                type: 'offer',
                sdp: updated.sdp_offer,
              });
              for (const candidate of pendingCandidatesRef.current) {
                await pc.addIceCandidate(candidate);
              }
              pendingCandidatesRef.current = [];

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await (supabase.from('teleconsult_sessions') as any)
                .update({ sdp_answer: answer.sdp })
                .eq('id', session.id);
            }
          }
        )
        .subscribe();

      // Create offer if initiator
      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await (supabase.from('teleconsult_sessions') as any)
          .update({ sdp_offer: offer.sdp })
          .eq('id', session.id);
      }

      return stream;
    } catch (error) {
      console.error('[Teleconsult] Error starting video call:', error);
      toast.error('Failed to start video call');
      return null;
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const endVideoCall = async () => {
    // Stop tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Unsubscribe
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setRemoteStream(null);
    setConnectionState('closed');

    // Update session
    await updateSession({
      session_ended_at: new Date().toISOString(),
      workflow_stage: 6,
      stage_status: 'in_progress',
    });
  };

  const completeSession = async (outcome: string, followUpRequired: boolean, followUpDate?: string) => {
    await updateSession({
      outcome,
      follow_up_required: followUpRequired,
      follow_up_date: followUpDate || null,
      workflow_stage: 7,
      stage_status: 'completed',
      status: 'completed',
    });
    toast.success('Teleconsult session completed');
  };

  return {
    // State
    session,
    notes,
    loading,
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    connectionState,
    
    // Session management
    createSession,
    updateSession,
    advanceStage,
    captureConsent,
    joinWaitingRoom,
    addNote,
    completeSession,
    
    // Video call
    startVideoCall,
    toggleVideo,
    toggleAudio,
    endVideoCall,
  };
}
