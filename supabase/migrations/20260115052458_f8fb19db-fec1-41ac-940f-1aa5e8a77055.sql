
-- Create storage bucket for Landela documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'landela-documents', 
  'landela-documents', 
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/tiff', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage RLS Policies for landela-documents bucket

-- Users can upload documents
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'landela-documents');

-- Users can view documents they uploaded or have share access to
CREATE POLICY "Users can view accessible documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'landela-documents' 
  AND (
    -- Owner can view
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Has document share access
    EXISTS (
      SELECT 1 FROM public.landela_documents ld
      JOIN public.landela_document_shares lds ON ld.id = lds.document_id
      WHERE ld.storage_path = name
        AND lds.shared_with_user_id = auth.uid()
        AND (lds.expires_at IS NULL OR lds.expires_at > now())
        AND lds.revoked_at IS NULL
    )
    OR
    -- Uploaded the document
    EXISTS (
      SELECT 1 FROM public.landela_documents ld
      WHERE ld.storage_path = name
        AND ld.captured_by = auth.uid()
    )
  )
);

-- Users can update their own documents
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'landela-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own documents (before verification)
CREATE POLICY "Users can delete own unverified documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'landela-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.landela_documents ld
    WHERE ld.storage_path = name
      AND ld.captured_by = auth.uid()
      AND ld.status IN ('uploading', 'processing', 'indexing_required')
  )
);
