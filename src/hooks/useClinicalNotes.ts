/**
 * Clinical Notes Hook
 * CRUD operations for clinical documentation
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export type NoteType = 
  | 'progress_note' 
  | 'admission_note' 
  | 'consultation_note' 
  | 'procedure_note'
  | 'operative_note' 
  | 'discharge_note' 
  | 'nursing_note' 
  | 'soap_note'
  | 'history_physical' 
  | 'daily_note' 
  | 'handoff_note' 
  | 'telephone_note'
  | 'patient_education' 
  | 'care_coordination' 
  | 'other';

export type NoteStatus = 'draft' | 'pending_review' | 'pending_cosign' | 'final' | 'amended' | 'entered_in_error';

export interface ClinicalNote {
  id: string;
  patient_id?: string;
  encounter_id?: string;
  visit_id?: string;
  note_type: NoteType;
  template_id?: string;
  note_title?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  content?: string;
  narrative?: string;
  structured_data?: Json;
  author_id: string;
  author_name?: string;
  author_role?: string;
  requires_cosign: boolean;
  cosigner_id?: string;
  cosigned_at?: string;
  status: NoteStatus;
  is_signed: boolean;
  signed_at?: string;
  signed_by?: string;
  is_amendment: boolean;
  amends_note_id?: string;
  amendment_reason?: string;
  note_datetime: string;
  created_at: string;
  updated_at: string;
}

export interface NoteInput {
  patient_id?: string;
  encounter_id?: string;
  visit_id?: string;
  note_type: NoteType;
  note_title?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  content?: string;
  narrative?: string;
  structured_data?: Record<string, unknown>;
  author_id: string;
  author_name?: string;
  author_role?: string;
  requires_cosign?: boolean;
}

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  progress_note: 'Progress Note',
  admission_note: 'Admission Note',
  consultation_note: 'Consultation Note',
  procedure_note: 'Procedure Note',
  operative_note: 'Operative Note',
  discharge_note: 'Discharge Note',
  nursing_note: 'Nursing Note',
  soap_note: 'SOAP Note',
  history_physical: 'History & Physical',
  daily_note: 'Daily Note',
  handoff_note: 'Handoff Note',
  telephone_note: 'Telephone Note',
  patient_education: 'Patient Education',
  care_coordination: 'Care Coordination',
  other: 'Other',
};

export function useClinicalNotes(options?: { 
  encounterId?: string; 
  patientId?: string;
  noteType?: NoteType;
  status?: NoteStatus;
}) {
  const queryClient = useQueryClient();
  const queryKey = ['clinical-notes', options];

  const notesQuery = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase.from('clinical_notes').select('*');

      if (options?.encounterId) {
        query = query.eq('encounter_id', options.encounterId);
      }
      if (options?.patientId) {
        query = query.eq('patient_id', options.patientId);
      }
      if (options?.noteType) {
        query = query.eq('note_type', options.noteType);
      }
      if (options?.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query.order('note_datetime', { ascending: false });

      if (error) throw error;
      return data as ClinicalNote[];
    },
    enabled: !!(options?.encounterId || options?.patientId),
  });

  const draftNotes = notesQuery.data?.filter(n => n.status === 'draft') || [];
  const pendingCosignNotes = notesQuery.data?.filter(n => n.status === 'pending_cosign') || [];
  const finalNotes = notesQuery.data?.filter(n => n.status === 'final') || [];

  const createNote = useMutation({
    mutationFn: async (note: NoteInput) => {
      const insertData = {
        ...note,
        status: 'draft' as const,
        is_signed: false,
        is_amendment: false,
        requires_cosign: note.requires_cosign || false,
      };
      const { data, error } = await supabase
        .from('clinical_notes')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-notes'] });
      toast.success('Note created');
    },
    onError: (error) => {
      console.error('Failed to create note:', error);
      toast.error('Failed to create note');
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClinicalNote> & { id: string }) => {
      const { data, error } = await supabase
        .from('clinical_notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-notes'] });
      toast.success('Note updated');
    },
  });

  const signNote = useMutation({
    mutationFn: async ({ id, signed_by }: { id: string; signed_by: string }) => {
      const { data, error } = await supabase
        .from('clinical_notes')
        .update({
          is_signed: true,
          signed_at: new Date().toISOString(),
          signed_by,
          status: 'final',
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-notes'] });
      toast.success('Note signed and finalized');
    },
  });

  const cosignNote = useMutation({
    mutationFn: async ({ id, cosigner_id }: { id: string; cosigner_id: string }) => {
      const { data, error } = await supabase
        .from('clinical_notes')
        .update({
          cosigner_id,
          cosigned_at: new Date().toISOString(),
          status: 'final',
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-notes'] });
      toast.success('Note co-signed');
    },
  });

  const amendNote = useMutation({
    mutationFn: async ({ originalNoteId, amendment, author_id }: { 
      originalNoteId: string; 
      amendment: Partial<NoteInput>;
      author_id: string;
    }) => {
      // Get the original note
      const { data: original, error: fetchError } = await supabase
        .from('clinical_notes')
        .select('*')
        .eq('id', originalNoteId)
        .single();

      if (fetchError) throw fetchError;

      // Create amendment
      const insertData = {
        ...original,
        ...amendment,
        id: undefined,
        author_id,
        is_amendment: true,
        amends_note_id: originalNoteId,
        status: 'draft' as const,
        is_signed: false,
        created_at: undefined,
        updated_at: undefined,
      };
      const { data, error } = await supabase
        .from('clinical_notes')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-notes'] });
      toast.success('Amendment created');
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clinical_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-notes'] });
      toast.success('Note deleted');
    },
  });

  return {
    notes: notesQuery.data || [],
    draftNotes,
    pendingCosignNotes,
    finalNotes,
    isLoading: notesQuery.isLoading,
    error: notesQuery.error,
    createNote,
    updateNote,
    signNote,
    cosignNote,
    amendNote,
    deleteNote,
    refetch: notesQuery.refetch,
  };
}
