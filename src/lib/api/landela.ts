import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

type LandelaDocumentStatus = "uploading" | "processing" | "indexing_required" | "pending_review" | "verified" | "final" | "archived" | "rejected";
type LandelaCaptureSource = "scanner" | "mobile_camera" | "file_upload" | "email_ingestion" | "watch_folder" | "system_generated" | "bulk_import" | "external_system";

export interface LandelaDocument {
  id: string;
  document_type_code: string;
  document_type_id: string | null;
  title: string;
  description: string | null;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  page_count: number;
  source: string;
  status: string;
  sensitivity_level: string;
  captured_at: string;
  captured_by: string | null;
  capture_facility_id: string | null;
  ocr_processed: boolean;
  ocr_text: string | null;
  ocr_confidence: number | null;
  ai_classified: boolean;
  ai_classification_confidence: number | null;
  ai_suggested_type_id: string | null;
  ai_extracted_entities: Record<string, unknown>;
  ai_quality_score: number | null;
  ai_quality_issues: string[] | null;
  batch_id: string | null;
  verified_at: string | null;
  verified_by: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  landela_document_types?: {
    id: string;
    code: string;
    name: string;
    category: string;
  };
}

export interface DocumentType {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
  requires_patient: boolean;
  requires_approval: boolean;
  is_active: boolean;
}

export interface BatchSession {
  id: string;
  session_name: string;
  separation_method: string | null;
  status: string;
  total_pages: number;
  documents_created: number;
  documents_indexed: number;
  target_patient_id: string | null;
  facility_id: string | null;
  started_at: string;
  completed_at: string | null;
}

export const landelaApi = {
  // Document Types
  async getDocumentTypes(): Promise<DocumentType[]> {
    const { data, error } = await supabase
      .from("landela_document_types")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Documents
  async getDocuments(options?: {
    status?: string;
    category?: string;
    patientId?: string;
    facilityId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<LandelaDocument[]> {
    let query = supabase
      .from("landela_documents")
      .select("*, landela_document_types(id, code, name, category)")
      .eq("is_current_version", true)
      .order("captured_at", { ascending: false });

    if (options?.status) {
      query = query.eq("status", options.status as LandelaDocumentStatus);
    }
    if (options?.search) {
      query = query.or(`title.ilike.%${options.search}%,ocr_text.ilike.%${options.search}%`);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as LandelaDocument[];
  },

  async getDocument(id: string): Promise<LandelaDocument | null> {
    const { data, error } = await supabase
      .from("landela_documents")
      .select("*, landela_document_types(id, code, name, category)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as unknown as LandelaDocument;
  },

  // Get document download URL
  async getDocumentUrl(doc: LandelaDocument): Promise<string | null> {
    const { data } = await supabase.storage
      .from(doc.storage_bucket)
      .createSignedUrl(doc.storage_path, 3600); // 1 hour expiry

    return data?.signedUrl || null;
  },

  // Upload document
  async uploadDocument(
    file: File,
    metadata: {
      title: string;
      documentTypeCode: string;
      source: string;
      facilityId?: string;
      patientId?: string;
      encounterId?: string;
      visitId?: string;
      batchId?: string;
      batchSequence?: number;
    }
  ): Promise<LandelaDocument> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Generate storage path
    const timestamp = Date.now();
    const storagePath = `${user.id}/${timestamp}_${file.name}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("landela-documents")
      .upload(storagePath, file);

    if (uploadError) throw uploadError;

    // Get document type
    const { data: docType } = await supabase
      .from("landela_document_types")
      .select("id")
      .eq("code", metadata.documentTypeCode)
      .single();

    // Create document record
    const { data: doc, error: docError } = await supabase
      .from("landela_documents")
      .insert({
        title: metadata.title,
        document_type_code: metadata.documentTypeCode,
        document_type_id: docType?.id,
        storage_bucket: "landela-documents",
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
        source: metadata.source as LandelaCaptureSource,
        captured_by: user.id,
        capture_facility_id: metadata.facilityId,
        batch_id: metadata.batchId,
        batch_sequence: metadata.batchSequence,
        status: "processing" as LandelaDocumentStatus,
      })
      .select()
      .single();

    if (docError) throw docError;

    // Create clinical index if patient provided
    if (metadata.patientId) {
      await supabase.from("landela_clinical_index").insert({
        document_id: doc.id,
        patient_id: metadata.patientId,
        encounter_id: metadata.encounterId,
        visit_id: metadata.visitId,
      });
    }

    // Log upload
    await landelaApi.logAction("upload", doc.id, { fileName: file.name, fileSize: file.size });

    return doc as unknown as LandelaDocument;
  },

  // Update document metadata
  async updateDocument(
    id: string,
    updates: {
      title?: string;
      description?: string;
      document_type_code?: string;
      document_type_id?: string;
      tags?: string[];
      custom_metadata?: Json;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from("landela_documents")
      .update(updates)
      .eq("id", id);

    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await landelaApi.logAction("update_metadata", id, updates as Record<string, unknown>);
    }
  },

  // Process document with AI
  async processDocument(
    documentId: string,
    processingType: "ocr" | "classify" | "extract" | "quality" | "full" = "full"
  ): Promise<{ success: boolean; results?: Record<string, unknown>; error?: string }> {
    const { data, error } = await supabase.functions.invoke("landela-process-document", {
      body: { documentId, processingType },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  // Verify document
  async verifyDocument(id: string, notes?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("landela_documents")
      .update({
        status: "verified" as LandelaDocumentStatus,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
        verification_notes: notes,
      })
      .eq("id", id);

    if (error) throw error;

    await landelaApi.logAction("verify", id, { notes });
  },

  // Batch Sessions
  async createBatchSession(data: {
    sessionName: string;
    separationMethod: string;
    targetPatientId?: string;
    facilityId?: string;
    targetDocumentTypeId?: string;
  }): Promise<BatchSession> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: session, error } = await supabase
      .from("landela_batch_sessions")
      .insert({
        session_name: data.sessionName,
        separation_method: data.separationMethod,
        target_patient_id: data.targetPatientId,
        facility_id: data.facilityId,
        target_document_type_id: data.targetDocumentTypeId,
        created_by: user.id,
        status: "active",
      })
      .select()
      .single();

    if (error) throw error;
    return session as unknown as BatchSession;
  },

  async getBatchSessions(): Promise<BatchSession[]> {
    const { data, error } = await supabase
      .from("landela_batch_sessions")
      .select("*")
      .order("started_at", { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as BatchSession[];
  },

  async completeBatchSession(id: string): Promise<void> {
    const { error } = await supabase
      .from("landela_batch_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  },

  // Clinical Index
  async linkToPatient(
    documentId: string,
    patientId: string,
    options?: {
      encounterId?: string;
      visitId?: string;
      programCode?: string;
      eventDate?: string;
    }
  ): Promise<void> {
    const { error } = await supabase.from("landela_clinical_index").insert({
      document_id: documentId,
      patient_id: patientId,
      encounter_id: options?.encounterId,
      visit_id: options?.visitId,
      program_code: options?.programCode,
      event_date: options?.eventDate,
    });

    if (error) throw error;
  },

  // Get documents for patient
  async getPatientDocuments(patientId: string): Promise<LandelaDocument[]> {
    const { data, error } = await supabase
      .from("landela_clinical_index")
      .select("document_id, landela_documents(*, landela_document_types(id, code, name, category))")
      .eq("patient_id", patientId);

    if (error) throw error;
    return (data || []).map((d: any) => d.landela_documents).filter(Boolean);
  },

  // Audit log
  async logAction(
    action: string,
    documentId: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("landela_audit_log").insert({
      action,
      document_id: documentId,
      user_id: user.id,
      details: details as Json,
    });
  },
};
