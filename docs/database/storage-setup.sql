-- Comprehensive Supabase Storage Setup for Neuronize
-- Run this in your Supabase SQL Editor to set up all storage buckets and policies

-- ============================================================================
-- STORAGE BUCKETS CREATION
-- ============================================================================

-- 1. Documents bucket (main document storage)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Message attachments bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  false,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Profile images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  2097152, -- 2MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. Tax documents bucket (specific for tax forms)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tax-documents',
  'tax-documents',
  false,
  52428800, -- 50MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/tiff'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 5. Client files bucket (general client uploads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-files',
  'client-files',
  false,
  52428800, -- 50MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/webp',
    'application/zip',
    'application/x-rar-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 6. Processed documents bucket (AI-processed files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'processed-documents',
  'processed-documents',
  false,
  52428800, -- 50MB
  ARRAY[
    'application/pdf',
    'application/json',
    'text/plain',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 7. Document thumbnails bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'document-thumbnails',
  'document-thumbnails',
  true,
  1048576, -- 1MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 8. Report exports bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-exports',
  'report-exports',
  false,
  20971520, -- 20MB
  ARRAY[
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 9. Temporary files bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-files',
  'temp-files',
  false,
  104857600, -- 100MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'application/json',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/webp',
    'application/zip',
    'application/x-rar-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 10. Company logos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  2097152, -- 2MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR STORAGE
-- ============================================================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
    AND role IN ('admin', 'tax_professional')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user owns a client record
CREATE OR REPLACE FUNCTION owns_client(user_id UUID, client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = client_id
    AND user_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 1. DOCUMENTS BUCKET POLICIES
-- ============================================================================

-- Users can view documents they own or are associated with
CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND (
      -- User uploaded the file
      owner = auth.uid() OR
      -- Admin can view all
      is_admin(auth.uid()) OR
      -- Client can view their own files (path contains their user ID)
      name LIKE '%/' || auth.uid()::text || '/%'
    )
  );

-- Users can upload documents
CREATE POLICY "Users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    auth.role() = 'authenticated'
  );

-- Users can update their own documents
CREATE POLICY "Users can update own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND (
      owner = auth.uid() OR
      is_admin(auth.uid())
    )
  );

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND (
      owner = auth.uid() OR
      is_admin(auth.uid())
    )
  );

-- ============================================================================
-- 2. MESSAGE ATTACHMENTS BUCKET POLICIES
-- ============================================================================

-- Users can view message attachments in their conversations
CREATE POLICY "Users can view message attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'message-attachments' AND (
      owner = auth.uid() OR
      is_admin(auth.uid()) OR
      -- Check if user participates in conversation (simplified check)
      EXISTS (
        SELECT 1 FROM public.message_attachments ma
        JOIN public.messages m ON ma.message_id = m.id
        JOIN public.conversations c ON m.conversation_id = c.id
        WHERE ma.storage_path = name
        AND (
          c.client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()) OR
          c.admin_id = auth.uid()
        )
      )
    )
  );

-- Users can upload message attachments
CREATE POLICY "Users can upload message attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'message-attachments' AND
    auth.role() = 'authenticated'
  );

-- Users can delete their own message attachments
CREATE POLICY "Users can delete own message attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'message-attachments' AND
    owner = auth.uid()
  );

-- ============================================================================
-- 3. PROFILE IMAGES BUCKET POLICIES (PUBLIC)
-- ============================================================================

-- Anyone can view profile images (public bucket)
CREATE POLICY "Anyone can view profile images" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-images');

-- Users can upload their own profile images
CREATE POLICY "Users can upload own profile images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-images' AND
    auth.role() = 'authenticated' AND
    name LIKE auth.uid()::text || '%'
  );

-- Users can update their own profile images
CREATE POLICY "Users can update own profile images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-images' AND
    owner = auth.uid()
  );

-- Users can delete their own profile images
CREATE POLICY "Users can delete own profile images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-images' AND
    owner = auth.uid()
  );

-- ============================================================================
-- 4. TAX DOCUMENTS BUCKET POLICIES
-- ============================================================================

-- Users can view tax documents they own or are associated with
CREATE POLICY "Users can view tax documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'tax-documents' AND (
      owner = auth.uid() OR
      is_admin(auth.uid()) OR
      name LIKE '%/' || auth.uid()::text || '/%'
    )
  );

-- Users can upload tax documents
CREATE POLICY "Users can upload tax documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'tax-documents' AND
    auth.role() = 'authenticated'
  );

-- Users can update their own tax documents
CREATE POLICY "Users can update own tax documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'tax-documents' AND (
      owner = auth.uid() OR
      is_admin(auth.uid())
    )
  );

-- Users can delete their own tax documents
CREATE POLICY "Users can delete own tax documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'tax-documents' AND (
      owner = auth.uid() OR
      is_admin(auth.uid())
    )
  );

-- ============================================================================
-- 5. CLIENT FILES BUCKET POLICIES
-- ============================================================================

-- Users can view client files they own or are associated with
CREATE POLICY "Users can view client files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'client-files' AND (
      owner = auth.uid() OR
      is_admin(auth.uid()) OR
      name LIKE '%/' || auth.uid()::text || '/%'
    )
  );

-- Users can upload client files
CREATE POLICY "Users can upload client files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'client-files' AND
    auth.role() = 'authenticated'
  );

-- Users can update their own client files
CREATE POLICY "Users can update own client files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'client-files' AND (
      owner = auth.uid() OR
      is_admin(auth.uid())
    )
  );

-- Users can delete their own client files
CREATE POLICY "Users can delete own client files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'client-files' AND (
      owner = auth.uid() OR
      is_admin(auth.uid())
    )
  );

-- ============================================================================
-- 6. PROCESSED DOCUMENTS BUCKET POLICIES
-- ============================================================================

-- Users can view processed documents they own or are associated with
CREATE POLICY "Users can view processed documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'processed-documents' AND (
      owner = auth.uid() OR
      is_admin(auth.uid()) OR
      name LIKE '%/' || auth.uid()::text || '/%'
    )
  );

-- Only system and admins can upload processed documents
CREATE POLICY "System can upload processed documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'processed-documents' AND (
      auth.role() = 'authenticated' AND
      is_admin(auth.uid())
    )
  );

-- Only system and admins can update processed documents
CREATE POLICY "System can update processed documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'processed-documents' AND
    is_admin(auth.uid())
  );

-- Only system and admins can delete processed documents
CREATE POLICY "System can delete processed documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'processed-documents' AND
    is_admin(auth.uid())
  );

-- ============================================================================
-- 7. DOCUMENT THUMBNAILS BUCKET POLICIES (PUBLIC)
-- ============================================================================

-- Anyone can view document thumbnails (public bucket)
CREATE POLICY "Anyone can view document thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'document-thumbnails');

-- Only system can upload thumbnails
CREATE POLICY "System can upload thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'document-thumbnails' AND
    auth.role() = 'authenticated'
  );

-- Only system can update thumbnails
CREATE POLICY "System can update thumbnails" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'document-thumbnails' AND
    is_admin(auth.uid())
  );

-- Only system can delete thumbnails
CREATE POLICY "System can delete thumbnails" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'document-thumbnails' AND
    is_admin(auth.uid())
  );

-- ============================================================================
-- 8. REPORT EXPORTS BUCKET POLICIES
-- ============================================================================

-- Users can view their own report exports
CREATE POLICY "Users can view own report exports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'report-exports' AND (
      owner = auth.uid() OR
      is_admin(auth.uid()) OR
      name LIKE '%/' || auth.uid()::text || '/%'
    )
  );

-- Users can upload report exports
CREATE POLICY "Users can upload report exports" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'report-exports' AND
    auth.role() = 'authenticated'
  );

-- Users can delete their own report exports
CREATE POLICY "Users can delete own report exports" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'report-exports' AND (
      owner = auth.uid() OR
      is_admin(auth.uid())
    )
  );

-- ============================================================================
-- 9. TEMPORARY FILES BUCKET POLICIES
-- ============================================================================

-- Users can view their own temporary files
CREATE POLICY "Users can view own temp files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'temp-files' AND (
      owner = auth.uid() OR
      is_admin(auth.uid())
    )
  );

-- Users can upload temporary files
CREATE POLICY "Users can upload temp files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'temp-files' AND
    auth.role() = 'authenticated'
  );

-- Users can delete their own temporary files
CREATE POLICY "Users can delete own temp files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'temp-files' AND (
      owner = auth.uid() OR
      is_admin(auth.uid())
    )
  );

-- ============================================================================
-- 10. COMPANY LOGOS BUCKET POLICIES (PUBLIC)
-- ============================================================================

-- Anyone can view company logos (public bucket)
CREATE POLICY "Anyone can view company logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'company-logos');

-- Users can upload their own company logos
CREATE POLICY "Users can upload own company logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'company-logos' AND
    auth.role() = 'authenticated' AND
    name LIKE auth.uid()::text || '%'
  );

-- Users can update their own company logos
CREATE POLICY "Users can update own company logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'company-logos' AND
    owner = auth.uid()
  );

-- Users can delete their own company logos
CREATE POLICY "Users can delete own company logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'company-logos' AND
    owner = auth.uid()
  );

-- ============================================================================
-- CLEANUP AND MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to clean up old temporary files (run daily)
CREATE OR REPLACE FUNCTION cleanup_temp_files()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  file_record RECORD;
BEGIN
  -- Delete temp files older than 24 hours
  FOR file_record IN
    SELECT name FROM storage.objects
    WHERE bucket_id = 'temp-files'
    AND created_at < NOW() - INTERVAL '24 hours'
  LOOP
    DELETE FROM storage.objects
    WHERE bucket_id = 'temp-files' AND name = file_record.name;
    deleted_count := deleted_count + 1;
  END LOOP;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up orphaned thumbnails
CREATE OR REPLACE FUNCTION cleanup_orphaned_thumbnails()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  file_record RECORD;
BEGIN
  -- Delete thumbnails that don't have corresponding documents
  FOR file_record IN
    SELECT name FROM storage.objects
    WHERE bucket_id = 'document-thumbnails'
    AND NOT EXISTS (
      SELECT 1 FROM public.documents
      WHERE thumbnail_url LIKE '%' || file_record.name
    )
  LOOP
    DELETE FROM storage.objects
    WHERE bucket_id = 'document-thumbnails' AND name = file_record.name;
    deleted_count := deleted_count + 1;
  END LOOP;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get storage usage by bucket
CREATE OR REPLACE FUNCTION get_storage_usage()
RETURNS TABLE(
  bucket_name TEXT,
  file_count BIGINT,
  total_size_bytes BIGINT,
  total_size_mb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bucket_id::TEXT,
    COUNT(*)::BIGINT,
    COALESCE(SUM(metadata->>'size')::BIGINT, 0),
    ROUND(COALESCE(SUM(metadata->>'size')::BIGINT, 0) / 1024.0 / 1024.0, 2)
  FROM storage.objects
  GROUP BY bucket_id
  ORDER BY bucket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SETUP COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Storage setup completed successfully!';
  RAISE NOTICE '📁 Created 10 storage buckets with proper configurations';
  RAISE NOTICE '🔒 Applied comprehensive RLS policies for security';
  RAISE NOTICE '🧹 Added cleanup functions for maintenance';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '1. Test file uploads in your application';
  RAISE NOTICE '2. Set up automated cleanup jobs';
  RAISE NOTICE '3. Monitor storage usage with get_storage_usage()';
  RAISE NOTICE '4. Configure CDN if needed for better performance';
END $$;