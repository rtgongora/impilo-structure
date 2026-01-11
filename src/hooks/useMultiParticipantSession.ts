/**
 * useMultiParticipantSession - Manages multi-participant telemedicine sessions
 * Supports adding participants, group calls, multidisciplinary consultations
 */
import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface SessionParticipant {
  id: string;
  name: string;
  role: string;
  specialty?: string;
  facility?: string;
  joinedAt?: string;
  leftAt?: string;
  isHost: boolean;
  isActive: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  connectionStatus: 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
}

export interface ParticipantInvite {
  targetType: 'provider' | 'specialty' | 'facility' | 'on_call';
  targetId?: string;
  targetName: string;
  reason: string;
  urgent: boolean;
}

interface UseMultiParticipantSessionOptions {
  sessionId: string;
  hostId: string;
  hostName: string;
  initialParticipants?: SessionParticipant[];
  maxParticipants?: number;
}

export function useMultiParticipantSession({
  sessionId,
  hostId,
  hostName,
  initialParticipants = [],
  maxParticipants = 25,
}: UseMultiParticipantSessionOptions) {
  const [participants, setParticipants] = useState<SessionParticipant[]>([
    {
      id: hostId,
      name: hostName,
      role: 'Host',
      isHost: true,
      isActive: true,
      isMuted: false,
      isVideoOff: false,
      connectionStatus: 'connected',
      joinedAt: new Date().toISOString(),
    },
    ...initialParticipants,
  ]);

  const [pendingInvites, setPendingInvites] = useState<ParticipantInvite[]>([]);
  const [isInviting, setIsInviting] = useState(false);

  // Add a participant to the session
  const addParticipant = useCallback(async (invite: ParticipantInvite) => {
    if (participants.length >= maxParticipants) {
      toast.error(`Maximum ${maxParticipants} participants allowed`);
      return false;
    }

    setIsInviting(true);
    setPendingInvites(prev => [...prev, invite]);

    // Simulate invitation process
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newParticipant: SessionParticipant = {
      id: `participant-${Date.now()}`,
      name: invite.targetName,
      role: invite.targetType === 'provider' ? 'Consultant' : 'Invited Specialist',
      specialty: invite.targetType === 'specialty' ? invite.targetName : undefined,
      isHost: false,
      isActive: true,
      isMuted: true,
      isVideoOff: true,
      connectionStatus: 'connecting',
      joinedAt: new Date().toISOString(),
    };

    setParticipants(prev => [...prev, newParticipant]);
    setPendingInvites(prev => prev.filter(i => i.targetName !== invite.targetName));
    setIsInviting(false);

    // Simulate connection
    setTimeout(() => {
      setParticipants(prev => prev.map(p => 
        p.id === newParticipant.id 
          ? { ...p, connectionStatus: 'connected', isMuted: false, isVideoOff: false }
          : p
      ));
    }, 2000);

    toast.success(`${invite.targetName} has joined the session`);
    return true;
  }, [participants.length, maxParticipants]);

  // Remove a participant
  const removeParticipant = useCallback((participantId: string) => {
    setParticipants(prev => prev.map(p =>
      p.id === participantId
        ? { ...p, isActive: false, leftAt: new Date().toISOString(), connectionStatus: 'disconnected' }
        : p
    ));
    toast.info("Participant removed from session");
  }, []);

  // Promote participant to host
  const promoteToHost = useCallback((participantId: string) => {
    setParticipants(prev => prev.map(p => ({
      ...p,
      isHost: p.id === participantId,
    })));
    toast.success("Host role transferred");
  }, []);

  // Mute/unmute participant (host only)
  const toggleParticipantMute = useCallback((participantId: string) => {
    setParticipants(prev => prev.map(p =>
      p.id === participantId ? { ...p, isMuted: !p.isMuted } : p
    ));
  }, []);

  // Get active participants count
  const activeCount = participants.filter(p => p.isActive && p.connectionStatus === 'connected').length;

  // Get host
  const host = participants.find(p => p.isHost);

  // Convert to group call
  const convertToGroupCall = useCallback(async (invites: ParticipantInvite[]) => {
    toast.info("Converting to group call...");
    for (const invite of invites) {
      await addParticipant(invite);
    }
    toast.success("Group call established");
  }, [addParticipant]);

  return {
    participants,
    pendingInvites,
    isInviting,
    activeCount,
    host,
    maxParticipants,
    canAddMore: participants.length < maxParticipants,
    addParticipant,
    removeParticipant,
    promoteToHost,
    toggleParticipantMute,
    convertToGroupCall,
  };
}
