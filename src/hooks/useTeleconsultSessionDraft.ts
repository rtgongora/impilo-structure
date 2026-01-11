/**
 * useTeleconsultSessionDraft - Manages save/resume functionality for teleconsult sessions
 * Allows practitioners to pause mid-review, save progress, and resume later
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ConsultationResponse } from '@/types/telehealth';

export interface SessionDraftData {
  responseNote: {
    assessment: string;
    clinicalInterpretation: string;
    workingDiagnosis: string;
    diagnosisCodes: { code: string; description: string }[];
    responseToQuestions: string;
    keyFindings: string;
    impressions: string;
  };
  plan: {
    treatmentPlan: string;
    medications: { name: string; dose: string; frequency: string; duration: string }[];
    investigations: { type: string; name: string; instructions: string }[];
    procedures: { name: string; urgency: string; instructions: string }[];
    monitoringRequirements: string;
  };
  disposition: {
    type: string;
    instructions: string;
  };
  followUp: {
    type: string;
    when: string;
    instructions: string;
    responsibleFacility: string;
    responsibleProvider: string;
  };
  orders: {
    medications: any[];
    labs: any[];
    imaging: any[];
    procedures: any[];
  };
  documentation: {
    communicationLogRef: string;
    sessionDuration: number;
    attachmentsUsed: string[];
    boardParticipants: string[];
  };
  chatMessages?: any[];
  ehrActionsLog?: any[];
}

export interface SessionDraft {
  id: string;
  sessionId: string;
  referralId: string;
  patientId: string;
  providerId: string;
  status: 'in_progress' | 'paused' | 'completed' | 'abandoned';
  mode: string;
  draftData: SessionDraftData;
  lastActiveAt: string;
  savedAt: string;
  createdAt: string;
  completedAt?: string;
  pauseReason?: string;
  resumeCount: number;
}

interface SaveDraftOptions {
  pauseReason?: string;
  isAutoSave?: boolean;
}

interface UseTeleconsultSessionDraftOptions {
  sessionId: string;
  referralId: string;
  patientId: string;
  autoSaveInterval?: number; // in milliseconds
}

const createEmptyDraftData = (): SessionDraftData => ({
  responseNote: {
    assessment: '',
    clinicalInterpretation: '',
    workingDiagnosis: '',
    diagnosisCodes: [],
    responseToQuestions: '',
    keyFindings: '',
    impressions: '',
  },
  plan: {
    treatmentPlan: '',
    medications: [],
    investigations: [],
    procedures: [],
    monitoringRequirements: '',
  },
  disposition: {
    type: 'continue_at_referring',
    instructions: '',
  },
  followUp: {
    type: 'none',
    when: '',
    instructions: '',
    responsibleFacility: '',
    responsibleProvider: '',
  },
  orders: {
    medications: [],
    labs: [],
    imaging: [],
    procedures: [],
  },
  documentation: {
    communicationLogRef: '',
    sessionDuration: 0,
    attachmentsUsed: [],
    boardParticipants: [],
  },
  chatMessages: [],
  ehrActionsLog: [],
});

export function useTeleconsultSessionDraft({
  sessionId,
  referralId,
  patientId,
  autoSaveInterval = 30000, // Default: 30 seconds
}: UseTeleconsultSessionDraftOptions) {
  const [draft, setDraft] = useState<SessionDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const draftDataRef = useRef<SessionDraftData | null>(null);

  // Initialize or load existing draft
  useEffect(() => {
    async function loadOrCreateDraft() {
      setIsLoading(true);
      try {
        // Check for existing draft
        const { data: existingDraft, error: fetchError } = await supabase
          .from('teleconsult_responses')
          .select('*')
          .eq('session_id', sessionId)
          .single();

        if (existingDraft && !fetchError) {
          // Parse existing draft
          const parsedDraft: SessionDraft = {
            id: existingDraft.id,
            sessionId: existingDraft.session_id,
            referralId,
            patientId,
            providerId: (existingDraft as any).consultant_id || 'unknown',
            status: (existingDraft as any).is_finalized ? 'completed' : 'in_progress',
            mode: 'async',
            draftData: {
              responseNote: {
                assessment: (existingDraft as any).clinical_interpretation || '',
                clinicalInterpretation: (existingDraft as any).clinical_interpretation || '',
                workingDiagnosis: (existingDraft as any).working_diagnosis || '',
                diagnosisCodes: (existingDraft as any).diagnosis_code 
                  ? [{ code: (existingDraft as any).diagnosis_code, description: '' }] 
                  : [],
                responseToQuestions: '',
                keyFindings: '',
                impressions: '',
              },
              plan: {
                treatmentPlan: (existingDraft as any).management_plan || '',
                medications: [],
                investigations: [],
                procedures: [],
                monitoringRequirements: '',
              },
              disposition: {
                type: 'continue_at_referring',
                instructions: (existingDraft as any).recommendations || '',
              },
              followUp: {
                type: 'none',
                when: '',
                instructions: (existingDraft as any).follow_up_instructions || '',
                responsibleFacility: '',
                responsibleProvider: '',
              },
              orders: {
                medications: [],
                labs: [],
                imaging: [],
                procedures: [],
              },
              documentation: {
                communicationLogRef: '',
                sessionDuration: 0,
                attachmentsUsed: [],
                boardParticipants: [],
              },
              chatMessages: [],
              ehrActionsLog: [],
            },
            lastActiveAt: existingDraft.updated_at || existingDraft.created_at,
            savedAt: existingDraft.updated_at || existingDraft.created_at,
            createdAt: existingDraft.created_at,
            completedAt: (existingDraft as any).is_finalized ? existingDraft.updated_at : undefined,
            resumeCount: 0,
          };
          setDraft(parsedDraft);
          draftDataRef.current = parsedDraft.draftData;
          setLastSavedAt(new Date(existingDraft.updated_at || existingDraft.created_at));
        } else {
          // Create new draft entry
          const { data: user } = await supabase.auth.getUser();
          const newDraftData = createEmptyDraftData();

          const { data: newDraft, error: insertError } = await supabase
            .from('teleconsult_responses')
            .insert({
              session_id: sessionId,
            } as any)
            .select()
            .single();

          if (!insertError && newDraft) {
            const parsedNewDraft: SessionDraft = {
              id: newDraft.id,
              sessionId: newDraft.session_id,
              referralId,
              patientId,
              providerId: user?.user?.id || 'unknown',
              status: 'in_progress',
              mode: 'async',
              draftData: newDraftData,
              lastActiveAt: newDraft.created_at,
              savedAt: newDraft.created_at,
              createdAt: newDraft.created_at,
              resumeCount: 0,
            };
            setDraft(parsedNewDraft);
            draftDataRef.current = newDraftData;
          }
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (sessionId) {
      loadOrCreateDraft();
    }
  }, [sessionId, referralId, patientId]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveInterval > 0 && draft && !draft.completedAt) {
      autoSaveTimerRef.current = setInterval(() => {
        if (isDirty && draftDataRef.current) {
          saveDraft({ isAutoSave: true });
        }
      }, autoSaveInterval);

      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
        }
      };
    }
  }, [autoSaveInterval, draft, isDirty]);

  // Update draft data (triggers dirty flag)
  const updateDraftData = useCallback((updates: Partial<SessionDraftData>) => {
    setDraft(prev => {
      if (!prev) return prev;
      const newDraftData = {
        ...prev.draftData,
        ...updates,
      };
      draftDataRef.current = newDraftData;
      return {
        ...prev,
        draftData: newDraftData,
        lastActiveAt: new Date().toISOString(),
      };
    });
    setIsDirty(true);
  }, []);

  // Save draft to database
  const saveDraft = useCallback(async (options: SaveDraftOptions = {}) => {
    if (!draft || !draftDataRef.current) return false;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('teleconsult_responses')
        .update({
          clinical_interpretation: draftDataRef.current.responseNote.clinicalInterpretation || null,
          working_diagnosis: draftDataRef.current.responseNote.workingDiagnosis || null,
          diagnosis_code: draftDataRef.current.responseNote.diagnosisCodes[0]?.code || null,
          management_plan: draftDataRef.current.plan.treatmentPlan || null,
          recommendations: draftDataRef.current.disposition.instructions || null,
          follow_up_instructions: draftDataRef.current.followUp.instructions || null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', draft.id);

      if (error) throw error;

      // Update session status to paused if reason provided
      if (options.pauseReason) {
        await supabase
          .from('teleconsult_sessions')
          .update({
            status: 'paused',
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId);

        setDraft(prev => prev ? { ...prev, status: 'paused', pauseReason: options.pauseReason } : prev);
      }

      setLastSavedAt(new Date());
      setIsDirty(false);

      if (!options.isAutoSave) {
        toast.success(options.pauseReason ? 'Session paused - Progress saved' : 'Draft saved');
      }

      return true;
    } catch (error) {
      console.error('Error saving draft:', error);
      if (!options.isAutoSave) {
        toast.error('Failed to save draft');
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [draft, sessionId]);

  // Pause session with reason
  const pauseSession = useCallback(async (reason: string) => {
    return saveDraft({ pauseReason: reason });
  }, [saveDraft]);

  // Resume session
  const resumeSession = useCallback(async () => {
    if (!draft) return false;

    try {
      await supabase
        .from('teleconsult_sessions')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      setDraft(prev => prev ? {
        ...prev,
        status: 'in_progress',
        pauseReason: undefined,
        resumeCount: prev.resumeCount + 1,
      } : prev);

      toast.success('Session resumed');
      return true;
    } catch (error) {
      console.error('Error resuming session:', error);
      toast.error('Failed to resume session');
      return false;
    }
  }, [draft, sessionId]);

  // Mark session as complete
  const completeSession = useCallback(async () => {
    if (!draft) return false;

    setIsSaving(true);
    try {
      // Finalize the response
      await supabase
        .from('teleconsult_responses')
        .update({
          is_finalized: true,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', draft.id);

      // Update session status
      await supabase
        .from('teleconsult_sessions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      setDraft(prev => prev ? {
        ...prev,
        status: 'completed',
        completedAt: new Date().toISOString(),
      } : prev);

      toast.success('Review completed - Ready to submit');
      return true;
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error('Failed to complete session');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [draft, sessionId]);

  // Abandon session
  const abandonSession = useCallback(async (reason: string) => {
    if (!draft) return false;

    try {
      await supabase
        .from('teleconsult_sessions')
        .update({
          status: 'abandoned',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      setDraft(prev => prev ? { ...prev, status: 'abandoned' } : prev);
      toast.warning('Session abandoned');
      return true;
    } catch (error) {
      console.error('Error abandoning session:', error);
      return false;
    }
  }, [draft, sessionId]);

  return {
    draft,
    draftData: draft?.draftData || null,
    isLoading,
    isSaving,
    isDirty,
    lastSavedAt,
    updateDraftData,
    saveDraft,
    pauseSession,
    resumeSession,
    completeSession,
    abandonSession,
    canResume: draft?.status === 'paused',
    isCompleted: draft?.status === 'completed',
    isPaused: draft?.status === 'paused',
  };
}
