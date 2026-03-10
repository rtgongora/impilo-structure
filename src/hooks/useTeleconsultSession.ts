import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TelemedicineMode, ReferralUrgency } from "@/types/telehealth";

export type TeleconsultStatus = 
  | "pending"          // Waiting for consultant to accept
  | "ringing"          // Instant call - actively ringing
  | "accepted"         // Consultant accepted, session ready
  | "in_progress"      // Active session underway
  | "completed"        // Session finished with response
  | "declined"         // Consultant declined
  | "missed"           // Ringing timed out
  | "cancelled";       // Referrer cancelled

export interface TeleconsultSessionData {
  id: string;
  referralId: string;
  status: TeleconsultStatus;
  mode: TelemedicineMode;
  urgency: ReferralUrgency;
  
  // Participants
  patientId: string;
  patientHid?: string;
  referringProviderId: string;
  referringFacilityId: string;
  consultingProviderId?: string;
  consultingFacilityId?: string;
  
  // Routing
  targetType: "facility" | "specialty" | "provider" | "pool" | "on_call";
  targetId: string;
  targetName: string;
  specialty?: string;
  
  // Clinical
  reasonForConsult: string;
  clinicalQuestions?: string[];
  
  // Timing
  createdAt: string;
  scheduledAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  endedAt?: string;
  
  // For instant calls
  ringingStartedAt?: string;
  ringingExpiresAt?: string;
}

interface UseTeleconsultSessionOptions {
  sessionId?: string;
  onStatusChange?: (status: TeleconsultStatus, session: TeleconsultSessionData) => void;
  onCallAnswered?: (session: TeleconsultSessionData) => void;
  onCallDeclined?: (session: TeleconsultSessionData) => void;
  onCallMissed?: (session: TeleconsultSessionData) => void;
}

export function useTeleconsultSession(options: UseTeleconsultSessionOptions = {}) {
  const { sessionId, onStatusChange, onCallAnswered, onCallDeclined, onCallMissed } = options;
  
  const [session, setSession] = useState<TeleconsultSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [ringingTimeLeft, setRingingTimeLeft] = useState(0);
  
  const ringingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subscriptionRef = useRef<any>(null);
  
  const RINGING_TIMEOUT = 60; // seconds

  // Load session by ID
  const loadSession = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("teleconsult_sessions")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      
      const sessionData: TeleconsultSessionData = {
        id: data.id,
        referralId: data.referral_id,
        status: data.status as TeleconsultStatus,
        mode: data.mode as TelemedicineMode,
        urgency: (data.urgency || "routine") as ReferralUrgency,
        patientId: data.patient_id,
        patientHid: data.patient_hid,
        referringProviderId: data.referring_provider_id,
        referringFacilityId: data.referring_facility_id,
        consultingProviderId: data.consulting_provider_id,
        consultingFacilityId: data.consulting_facility_id,
        targetType: "provider",
        targetId: data.consulting_provider_id || data.routed_to_provider_id || "",
        targetName: "",
        specialty: data.specialty,
        reasonForConsult: data.reason_for_consult || "",
        clinicalQuestions: Array.isArray(data.clinical_questions) ? data.clinical_questions as string[] : [],
        createdAt: data.created_at,
        scheduledAt: data.scheduled_at,
        acceptedAt: data.accepted_at,
        startedAt: data.started_at,
        endedAt: data.ended_at,
      };
      
      setSession(sessionData);
      
      // Check if ringing
      if (sessionData.status === "ringing") {
        startRingingTimer(sessionData);
      }
      
      return sessionData;
    } catch (error) {
      console.error("Failed to load session:", error);
      toast.error("Failed to load teleconsult session");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new session (for referrer initiating)
  const createSession = useCallback(async (params: {
    patientId: string;
    patientHid?: string;
    mode: TelemedicineMode;
    urgency: ReferralUrgency;
    targetType: "facility" | "specialty" | "provider" | "pool" | "on_call";
    targetId: string;
    targetName: string;
    specialty?: string;
    reasonForConsult: string;
    clinicalQuestions?: string[];
    isInstant?: boolean;
    scheduledAt?: string;
  }) => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      
      const referralId = `${params.isInstant ? "INST" : "REF"}-${Date.now()}`;
      const initialStatus: TeleconsultStatus = params.isInstant ? "ringing" : "pending";
      
      const { data, error } = await supabase
        .from("teleconsult_sessions")
        .insert({
          referral_id: referralId,
          created_by: user.user.id,
          patient_id: params.patientId,
          patient_hid: params.patientHid,
          referring_provider_id: user.user.id,
          mode: params.mode,
          urgency: params.urgency,
          specialty: params.specialty,
          reason_for_consult: params.reasonForConsult,
          clinical_questions: params.clinicalQuestions,
          status: initialStatus,
          scheduled_at: params.scheduledAt,
          workflow_stage: 1,
          stage_status: "initiated",
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const sessionData: TeleconsultSessionData = {
        id: data.id,
        referralId: data.referral_id,
        status: data.status as TeleconsultStatus,
        mode: params.mode,
        urgency: params.urgency,
        patientId: params.patientId,
        patientHid: params.patientHid,
        referringProviderId: user.user.id,
        referringFacilityId: "",
        targetType: params.targetType,
        targetId: params.targetId,
        targetName: params.targetName,
        specialty: params.specialty,
        reasonForConsult: params.reasonForConsult,
        clinicalQuestions: params.clinicalQuestions,
        createdAt: data.created_at,
        scheduledAt: params.scheduledAt,
      };
      
      setSession(sessionData);
      
      // Start ringing for instant calls
      if (params.isInstant) {
        startRingingTimer(sessionData);
        toast.info(`Calling ${params.targetName}...`);
      } else {
        toast.success("Teleconsult request sent");
      }
      
      // Subscribe to updates
      subscribeToSession(data.id);
      
      return sessionData;
    } catch (error) {
      console.error("Failed to create session:", error);
      toast.error("Failed to create teleconsult session");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Accept an incoming session (for consultant)
  const acceptSession = useCallback(async (id: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("teleconsult_sessions")
        .update({
          status: "accepted",
          consulting_provider_id: user.user.id,
          accepted_at: new Date().toISOString(),
          workflow_stage: 4,
          stage_status: "accepted",
        })
        .eq("id", id);
      
      if (error) throw error;
      
      setSession(prev => prev ? { ...prev, status: "accepted", acceptedAt: new Date().toISOString() } : null);
      toast.success("Teleconsult accepted");
      
      return true;
    } catch (error) {
      console.error("Failed to accept session:", error);
      toast.error("Failed to accept teleconsult");
      return false;
    }
  }, []);

  // Decline an incoming session (for consultant)
  const declineSession = useCallback(async (id: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from("teleconsult_sessions")
        .update({
          status: "declined",
          declined_at: new Date().toISOString(),
          decline_reason: reason || "Declined by consultant",
        })
        .eq("id", id);
      
      if (error) throw error;
      
      setSession(prev => prev ? { ...prev, status: "declined" } : null);
      toast.info("Teleconsult declined");
      
      return true;
    } catch (error) {
      console.error("Failed to decline session:", error);
      toast.error("Failed to decline teleconsult");
      return false;
    }
  }, []);

  // Start the session (move to in_progress)
  const startSession = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("teleconsult_sessions")
        .update({
          status: "in_progress",
          started_at: new Date().toISOString(),
          workflow_stage: 5,
          stage_status: "live",
        })
        .eq("id", id);
      
      if (error) throw error;
      
      setSession(prev => prev ? { ...prev, status: "in_progress", startedAt: new Date().toISOString() } : null);
      
      return true;
    } catch (error) {
      console.error("Failed to start session:", error);
      return false;
    }
  }, []);

  // Cancel the session (for referrer)
  const cancelSession = useCallback(async (id: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from("teleconsult_sessions")
        .update({
          status: "cancelled",
          ended_at: new Date().toISOString(),
          outcome: reason || "Cancelled by referrer",
        })
        .eq("id", id);
      
      if (error) throw error;
      
      stopRingingTimer();
      setSession(prev => prev ? { ...prev, status: "cancelled" } : null);
      toast.info("Teleconsult cancelled");
      
      return true;
    } catch (error) {
      console.error("Failed to cancel session:", error);
      toast.error("Failed to cancel teleconsult");
      return false;
    }
  }, []);

  // Complete the session
  const completeSession = useCallback(async (id: string, outcome?: string) => {
    try {
      const { error } = await supabase
        .from("teleconsult_sessions")
        .update({
          status: "completed",
          ended_at: new Date().toISOString(),
          outcome: outcome || "Completed",
          workflow_stage: 7,
          stage_status: "completed",
        })
        .eq("id", id);
      
      if (error) throw error;
      
      setSession(prev => prev ? { ...prev, status: "completed", endedAt: new Date().toISOString() } : null);
      toast.success("Teleconsult completed");
      
      return true;
    } catch (error) {
      console.error("Failed to complete session:", error);
      return false;
    }
  }, []);

  // Ringing timer management
  const startRingingTimer = useCallback((sessionData: TeleconsultSessionData) => {
    setIsRinging(true);
    setRingingTimeLeft(RINGING_TIMEOUT);
    
    ringingTimerRef.current = setInterval(() => {
      setRingingTimeLeft(prev => {
        if (prev <= 1) {
          handleRingingTimeout(sessionData.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopRingingTimer = useCallback(() => {
    if (ringingTimerRef.current) {
      clearInterval(ringingTimerRef.current);
      ringingTimerRef.current = null;
    }
    setIsRinging(false);
    setRingingTimeLeft(0);
  }, []);

  const handleRingingTimeout = useCallback(async (id: string) => {
    stopRingingTimer();
    
    try {
      await supabase
        .from("teleconsult_sessions")
        .update({
          status: "missed",
          ended_at: new Date().toISOString(),
          outcome: "No answer",
        })
        .eq("id", id)
        .eq("status", "ringing");
      
      setSession(prev => prev ? { ...prev, status: "missed" } : null);
      onCallMissed?.(session!);
      toast.warning("Call not answered");
    } catch (error) {
      console.error("Failed to mark call as missed:", error);
    }
  }, [session, onCallMissed, stopRingingTimer]);

  // Subscribe to realtime updates
  const subscribeToSession = useCallback((id: string) => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }
    
    subscriptionRef.current = supabase
      .channel(`teleconsult:${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "teleconsult_sessions",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const newData = payload.new as any;
          const newStatus = newData.status as TeleconsultStatus;
          
          setSession(prev => {
            if (!prev) return prev;
            
            const updated: TeleconsultSessionData = {
              ...prev,
              status: newStatus,
              acceptedAt: newData.accepted_at,
              startedAt: newData.started_at,
              endedAt: newData.ended_at,
              consultingProviderId: newData.consulting_provider_id,
            };
            
            // Handle status transitions
            if (prev.status === "ringing" && newStatus === "accepted") {
              stopRingingTimer();
              onCallAnswered?.(updated);
              toast.success("Call answered!");
            } else if (prev.status === "ringing" && newStatus === "declined") {
              stopRingingTimer();
              onCallDeclined?.(updated);
              toast.error("Call declined");
            }
            
            onStatusChange?.(newStatus, updated);
            
            return updated;
          });
        }
      )
      .subscribe();
  }, [onStatusChange, onCallAnswered, onCallDeclined, stopRingingTimer]);

  // Load session on mount if sessionId provided
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
      subscribeToSession(sessionId);
    }
    
    return () => {
      stopRingingTimer();
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [sessionId]);

  return {
    session,
    isLoading,
    isRinging,
    ringingTimeLeft,
    
    // Actions
    loadSession,
    createSession,
    acceptSession,
    declineSession,
    startSession,
    cancelSession,
    completeSession,
  };
}
