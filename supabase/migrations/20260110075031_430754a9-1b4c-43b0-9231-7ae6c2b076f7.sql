-- =====================================================
-- PHASE 4-5-6: Voice Calling, Extended Teleconsult, PACS
-- Only creating tables that don't exist yet
-- =====================================================

-- =====================================================
-- 1. VOICE CALLING TABLES
-- =====================================================

-- Call sessions for audio calls
CREATE TABLE IF NOT EXISTS public.call_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    caller_id UUID NOT NULL REFERENCES auth.users(id),
    callee_id UUID NOT NULL REFERENCES auth.users(id),
    call_type TEXT NOT NULL DEFAULT 'audio' CHECK (call_type IN ('audio', 'video')),
    status TEXT NOT NULL DEFAULT 'initiating' CHECK (status IN ('initiating', 'ringing', 'connected', 'on_hold', 'ended', 'missed', 'declined', 'failed')),
    sdp_offer TEXT,
    sdp_answer TEXT,
    started_at TIMESTAMPTZ,
    connected_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    end_reason TEXT,
    is_recorded BOOLEAN DEFAULT false,
    recording_consent_given BOOLEAN DEFAULT false,
    recording_path TEXT,
    duration_seconds INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ICE candidates for WebRTC connection
CREATE TABLE IF NOT EXISTS public.call_ice_candidates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    candidate_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Call recordings
CREATE TABLE IF NOT EXISTS public.call_recordings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.call_sessions(id),
    storage_bucket TEXT NOT NULL DEFAULT 'call-recordings',
    storage_path TEXT NOT NULL,
    duration_seconds INTEGER,
    file_size_bytes BIGINT,
    consent_timestamp TIMESTAMPTZ NOT NULL,
    consented_by UUID[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 2. EXTEND TELECONSULT_SESSIONS WITH NEW COLUMNS
-- =====================================================

-- Add missing columns to teleconsult_sessions if they don't exist
DO $$
BEGIN
    -- Add workflow_stage if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teleconsult_sessions' AND column_name = 'workflow_stage') THEN
        ALTER TABLE public.teleconsult_sessions ADD COLUMN workflow_stage INTEGER DEFAULT 1;
    END IF;
    
    -- Add stage_status if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teleconsult_sessions' AND column_name = 'stage_status') THEN
        ALTER TABLE public.teleconsult_sessions ADD COLUMN stage_status TEXT DEFAULT 'pending';
    END IF;
    
    -- Add consent_obtained if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teleconsult_sessions' AND column_name = 'consent_obtained') THEN
        ALTER TABLE public.teleconsult_sessions ADD COLUMN consent_obtained BOOLEAN DEFAULT false;
    END IF;
    
    -- Add consent_timestamp if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teleconsult_sessions' AND column_name = 'consent_timestamp') THEN
        ALTER TABLE public.teleconsult_sessions ADD COLUMN consent_timestamp TIMESTAMPTZ;
    END IF;
    
    -- Add waiting_room_joined_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teleconsult_sessions' AND column_name = 'waiting_room_joined_at') THEN
        ALTER TABLE public.teleconsult_sessions ADD COLUMN waiting_room_joined_at TIMESTAMPTZ;
    END IF;
    
    -- Add call_quality_rating if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teleconsult_sessions' AND column_name = 'call_quality_rating') THEN
        ALTER TABLE public.teleconsult_sessions ADD COLUMN call_quality_rating INTEGER;
    END IF;
    
    -- Add outcome if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teleconsult_sessions' AND column_name = 'outcome') THEN
        ALTER TABLE public.teleconsult_sessions ADD COLUMN outcome TEXT;
    END IF;
    
    -- Add follow_up_required if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teleconsult_sessions' AND column_name = 'follow_up_required') THEN
        ALTER TABLE public.teleconsult_sessions ADD COLUMN follow_up_required BOOLEAN DEFAULT false;
    END IF;
    
    -- Add follow_up_date if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teleconsult_sessions' AND column_name = 'follow_up_date') THEN
        ALTER TABLE public.teleconsult_sessions ADD COLUMN follow_up_date DATE;
    END IF;
END $$;

-- Teleconsult notes (if not exists)
CREATE TABLE IF NOT EXISTS public.teleconsult_notes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL,
    author_id UUID NOT NULL REFERENCES auth.users(id),
    note_type TEXT NOT NULL DEFAULT 'general',
    content TEXT NOT NULL,
    is_shared_with_patient BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Teleconsult documents (if not exists)
CREATE TABLE IF NOT EXISTS public.teleconsult_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    document_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    shared_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 3. PACS / IMAGING TABLES
-- =====================================================

-- Imaging studies
CREATE TABLE IF NOT EXISTS public.imaging_studies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id),
    order_id UUID REFERENCES public.clinical_orders(id),
    encounter_id UUID REFERENCES public.encounters(id),
    study_instance_uid TEXT UNIQUE NOT NULL,
    accession_number TEXT,
    modality TEXT NOT NULL,
    study_description TEXT,
    study_date DATE NOT NULL,
    study_time TIME,
    body_part TEXT,
    institution_name TEXT,
    station_name TEXT,
    performing_physician TEXT,
    referring_physician TEXT,
    number_of_series INTEGER DEFAULT 0,
    number_of_instances INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'received',
    priority TEXT DEFAULT 'routine',
    storage_location TEXT,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Imaging series
CREATE TABLE IF NOT EXISTS public.imaging_series (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    study_id UUID NOT NULL REFERENCES public.imaging_studies(id) ON DELETE CASCADE,
    series_instance_uid TEXT UNIQUE NOT NULL,
    series_number INTEGER,
    series_description TEXT,
    modality TEXT NOT NULL,
    body_part_examined TEXT,
    protocol_name TEXT,
    slice_thickness DECIMAL,
    spacing_between_slices DECIMAL,
    number_of_instances INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Imaging instances
CREATE TABLE IF NOT EXISTS public.imaging_instances (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    series_id UUID NOT NULL REFERENCES public.imaging_series(id) ON DELETE CASCADE,
    sop_instance_uid TEXT UNIQUE NOT NULL,
    sop_class_uid TEXT,
    instance_number INTEGER,
    rows INTEGER,
    columns INTEGER,
    bits_allocated INTEGER,
    pixel_spacing DECIMAL[],
    window_center DECIMAL,
    window_width DECIMAL,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    transfer_syntax_uid TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Imaging reports
CREATE TABLE IF NOT EXISTS public.imaging_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    study_id UUID NOT NULL REFERENCES public.imaging_studies(id),
    findings TEXT,
    impression TEXT,
    recommendations TEXT,
    clinical_history TEXT,
    comparison_studies TEXT,
    technique TEXT,
    has_critical_finding BOOLEAN DEFAULT false,
    critical_finding_details TEXT,
    critical_finding_notified_at TIMESTAMPTZ,
    critical_finding_notified_to TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    reported_by UUID REFERENCES auth.users(id),
    reported_at TIMESTAMPTZ,
    signed_by UUID REFERENCES auth.users(id),
    signed_at TIMESTAMPTZ,
    amendment_reason TEXT,
    previous_report_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Imaging annotations
CREATE TABLE IF NOT EXISTS public.imaging_annotations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    instance_id UUID NOT NULL REFERENCES public.imaging_instances(id) ON DELETE CASCADE,
    study_id UUID NOT NULL REFERENCES public.imaging_studies(id),
    annotation_type TEXT NOT NULL,
    annotation_data JSONB NOT NULL,
    label TEXT,
    is_key_image BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES (only create if not exists)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_call_sessions_caller ON public.call_sessions(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_callee ON public.call_sessions(callee_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON public.call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_call_ice_session ON public.call_ice_candidates(session_id);

CREATE INDEX IF NOT EXISTS idx_imaging_studies_patient ON public.imaging_studies(patient_id);
CREATE INDEX IF NOT EXISTS idx_imaging_studies_uid ON public.imaging_studies(study_instance_uid);
CREATE INDEX IF NOT EXISTS idx_imaging_studies_date ON public.imaging_studies(study_date DESC);
CREATE INDEX IF NOT EXISTS idx_imaging_series_study ON public.imaging_series(study_id);
CREATE INDEX IF NOT EXISTS idx_imaging_instances_series ON public.imaging_instances(series_id);
CREATE INDEX IF NOT EXISTS idx_imaging_reports_study ON public.imaging_reports(study_id);

-- =====================================================
-- ENABLE REALTIME FOR SIGNALING
-- =====================================================

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.call_ice_candidates;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_ice_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teleconsult_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teleconsult_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_annotations ENABLE ROW LEVEL SECURITY;

-- Call sessions policies
DROP POLICY IF EXISTS "Call participants can view their calls" ON public.call_sessions;
CREATE POLICY "Call participants can view their calls"
    ON public.call_sessions FOR SELECT
    USING (auth.uid() = caller_id OR auth.uid() = callee_id);

DROP POLICY IF EXISTS "Users can create calls" ON public.call_sessions;
CREATE POLICY "Users can create calls"
    ON public.call_sessions FOR INSERT
    WITH CHECK (auth.uid() = caller_id);

DROP POLICY IF EXISTS "Call participants can update calls" ON public.call_sessions;
CREATE POLICY "Call participants can update calls"
    ON public.call_sessions FOR UPDATE
    USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- ICE candidates policies
DROP POLICY IF EXISTS "Call participants can view ICE candidates" ON public.call_ice_candidates;
CREATE POLICY "Call participants can view ICE candidates"
    ON public.call_ice_candidates FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.call_sessions cs
        WHERE cs.id = session_id AND (cs.caller_id = auth.uid() OR cs.callee_id = auth.uid())
    ));

DROP POLICY IF EXISTS "Call participants can add ICE candidates" ON public.call_ice_candidates;
CREATE POLICY "Call participants can add ICE candidates"
    ON public.call_ice_candidates FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Call recordings policies
DROP POLICY IF EXISTS "Call participants can view recordings" ON public.call_recordings;
CREATE POLICY "Call participants can view recordings"
    ON public.call_recordings FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.call_sessions cs
        WHERE cs.id = session_id AND (cs.caller_id = auth.uid() OR cs.callee_id = auth.uid())
    ));

-- Teleconsult notes policies
DROP POLICY IF EXISTS "Teleconsult providers can view notes" ON public.teleconsult_notes;
CREATE POLICY "Teleconsult providers can view notes"
    ON public.teleconsult_notes FOR SELECT
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Providers can create teleconsult notes" ON public.teleconsult_notes;
CREATE POLICY "Providers can create teleconsult notes"
    ON public.teleconsult_notes FOR INSERT
    WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update their notes" ON public.teleconsult_notes;
CREATE POLICY "Authors can update their notes"
    ON public.teleconsult_notes FOR UPDATE
    USING (auth.uid() = author_id);

-- Teleconsult documents policies
DROP POLICY IF EXISTS "Teleconsult providers can view documents" ON public.teleconsult_documents;
CREATE POLICY "Teleconsult providers can view documents"
    ON public.teleconsult_documents FOR SELECT
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Providers can upload teleconsult documents" ON public.teleconsult_documents;
CREATE POLICY "Providers can upload teleconsult documents"
    ON public.teleconsult_documents FOR INSERT
    WITH CHECK (auth.uid() = uploaded_by);

-- Imaging policies
DROP POLICY IF EXISTS "Authenticated users can view imaging studies" ON public.imaging_studies;
CREATE POLICY "Authenticated users can view imaging studies"
    ON public.imaging_studies FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can create imaging studies" ON public.imaging_studies;
CREATE POLICY "Authenticated users can create imaging studies"
    ON public.imaging_studies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update imaging studies" ON public.imaging_studies;
CREATE POLICY "Authenticated users can update imaging studies"
    ON public.imaging_studies FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view imaging series" ON public.imaging_series;
CREATE POLICY "Authenticated users can view imaging series"
    ON public.imaging_series FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can create imaging series" ON public.imaging_series;
CREATE POLICY "Authenticated users can create imaging series"
    ON public.imaging_series FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view imaging instances" ON public.imaging_instances;
CREATE POLICY "Authenticated users can view imaging instances"
    ON public.imaging_instances FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can create imaging instances" ON public.imaging_instances;
CREATE POLICY "Authenticated users can create imaging instances"
    ON public.imaging_instances FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view imaging reports" ON public.imaging_reports;
CREATE POLICY "Authenticated users can view imaging reports"
    ON public.imaging_reports FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can create imaging reports" ON public.imaging_reports;
CREATE POLICY "Authenticated users can create imaging reports"
    ON public.imaging_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Report authors can update reports" ON public.imaging_reports;
CREATE POLICY "Report authors can update reports"
    ON public.imaging_reports FOR UPDATE USING (auth.uid() = reported_by OR auth.uid() = signed_by);

DROP POLICY IF EXISTS "Authenticated users can view annotations" ON public.imaging_annotations;
CREATE POLICY "Authenticated users can view annotations"
    ON public.imaging_annotations FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can create annotations" ON public.imaging_annotations;
CREATE POLICY "Authenticated users can create annotations"
    ON public.imaging_annotations FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Annotation creators can update" ON public.imaging_annotations;
CREATE POLICY "Annotation creators can update"
    ON public.imaging_annotations FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Annotation creators can delete" ON public.imaging_annotations;
CREATE POLICY "Annotation creators can delete"
    ON public.imaging_annotations FOR DELETE USING (auth.uid() = created_by);

-- =====================================================
-- TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_call_sessions_updated_at ON public.call_sessions;
CREATE TRIGGER update_call_sessions_updated_at
    BEFORE UPDATE ON public.call_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_teleconsult_notes_updated_at ON public.teleconsult_notes;
CREATE TRIGGER update_teleconsult_notes_updated_at
    BEFORE UPDATE ON public.teleconsult_notes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_imaging_studies_updated_at ON public.imaging_studies;
CREATE TRIGGER update_imaging_studies_updated_at
    BEFORE UPDATE ON public.imaging_studies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_imaging_reports_updated_at ON public.imaging_reports;
CREATE TRIGGER update_imaging_reports_updated_at
    BEFORE UPDATE ON public.imaging_reports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_imaging_annotations_updated_at ON public.imaging_annotations;
CREATE TRIGGER update_imaging_annotations_updated_at
    BEFORE UPDATE ON public.imaging_annotations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('call-recordings', 'call-recordings', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('teleconsult-documents', 'teleconsult-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('dicom-images', 'dicom-images', false)
ON CONFLICT (id) DO NOTHING;