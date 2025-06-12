import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { supabase } from "@/lib/supabase";
import { DocumentProcessor } from "@/lib/ai-processing/DocumentProcessor";
import { TaxFormAutoFillService } from "@/lib/ai-processing/TaxFormAutoFillService";

// Document schemas
const DocumentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  client_id: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  size: z.number(),
  category: z.string(),
  status: z.string(),
  ai_analysis_status: z.string(),
  ai_analysis_result: z.any().optional(),
  file_url: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  is_sensitive: z.boolean().optional(),
  uploaded_by: z.string().uuid().optional(),
  reviewed_by: z.string().uuid().optional(),
  reviewed_at: z.date().optional(),
  version: z.number().optional(),
  parent_document_id: z.string().uuid().optional(),
  metadata: z.any().optional(),
  processing_status: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
});

const DocumentCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string(),
  is_required: z.boolean(),
  sort_order: z.number(),
  parent_category_id: z.string().uuid().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

const DocumentCollectionSessionSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: z.string(),
  progress_percentage: z.number(),
  total_required_documents: z.number(),
  completed_documents: z.number(),
  last_activity: z.date().optional(),
  deadline: z.date().optional(),
  notes: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

const DocumentChecklistSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  user_id: z.string().uuid(),
  document_type: z.string(),
  document_category: z.string(),
  is_required: z.boolean(),
  is_completed: z.boolean(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  due_date: z.date().optional(),
  completed_at: z.date().optional(),
  priority: z.string(),
  reminder_sent_at: z.date().optional(),
  reminder_count: z.number(),
  document_id: z.string().uuid().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const documentsRouter = createTRPCRouter({
  // Get all documents for a client
  getByClient: protectedProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', input.clientId)
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data;
    }),

  // Get documents by category
  getByCategory: protectedProcedure
    .input(z.object({
      clientId: z.string().uuid(),
      category: z.string()
    }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', input.clientId)
        .eq('category', input.category)
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data;
    }),

  // Get document categories
  getCategories: protectedProcedure
    .query(async () => {
      const { data, error } = await supabase
        .from('document_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw new Error(error.message);
      return data;
    }),

  // Get document collection session for a client
  getCollectionSession: protectedProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await supabase
        .from('document_collection_sessions')
        .select('*')
        .eq('client_id', input.clientId)
        .eq('user_id', ctx.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return data;
    }),

  // Get document checklist for a client
  getChecklist: protectedProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await supabase
        .from('document_checklists')
        .select('*')
        .eq('client_id', input.clientId)
        .eq('user_id', ctx.user.id)
        .order('priority', { ascending: false })
        .order('due_date', { ascending: true });

      if (error) throw new Error(error.message);
      return data;
    }),

  // Create a new document
  create: protectedProcedure
    .input(z.object({
      client_id: z.string().uuid(),
      name: z.string(),
      type: z.string(),
      size: z.number(),
      category: z.string(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      is_sensitive: z.boolean().optional(),
      file_url: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          ...input,
          user_id: ctx.user.id,
          uploaded_by: ctx.user.id,
          status: 'uploaded',
          ai_analysis_status: 'pending',
          processing_status: 'pending',
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  // Update document
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().optional(),
      category: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      is_sensitive: z.boolean().optional(),
      processing_status: z.string().optional(),
      ai_analysis_status: z.string().optional(),
      ai_analysis_result: z.any().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;

      const { data, error } = await supabase
        .from('documents')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', ctx.user.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  // Delete document
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', input.id)
        .eq('user_id', ctx.user.id);

      if (error) throw new Error(error.message);
      return { success: true };
    }),

  // Update checklist item
  updateChecklistItem: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      is_completed: z.boolean(),
      document_id: z.string().uuid().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;

      const { data, error } = await supabase
        .from('document_checklists')
        .update({
          ...updateData,
          completed_at: input.is_completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', ctx.user.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  // Get document statistics
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      // Get total documents
      const { count: totalDocuments } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', ctx.user.id);

      // Get documents by status
      const { data: statusData } = await supabase
        .from('documents')
        .select('processing_status')
        .eq('user_id', ctx.user.id);

      // Get documents by category
      const { data: categoryData } = await supabase
        .from('documents')
        .select('category')
        .eq('user_id', ctx.user.id);

      const statusCounts = statusData?.reduce((acc, doc) => {
        acc[doc.processing_status] = (acc[doc.processing_status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const categoryCounts = categoryData?.reduce((acc, doc) => {
        acc[doc.category] = (acc[doc.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalDocuments: totalDocuments || 0,
        statusCounts,
        categoryCounts,
      };
    }),

  // Process document through AI pipeline
  processDocument: protectedProcedure
    .input(z.object({
      documentId: z.string().uuid(),
      clientId: z.string().uuid().optional(),
      skipOCR: z.boolean().optional(),
      skipAnalysis: z.boolean().optional(),
      skipAutoFill: z.boolean().optional(),
      priority: z.enum(['low', 'normal', 'high']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const processor = new DocumentProcessor();

      // Get document file data
      const { data: document, error } = await supabase
        .from('documents')
        .select('file_url, type, client_id')
        .eq('id', input.documentId)
        .eq('user_id', ctx.user.id)
        .single();

      if (error || !document) {
        throw new Error('Document not found');
      }

      // Download file from storage
      const fileUrl = document.file_url;
      if (!fileUrl) {
        throw new Error('Document file not found');
      }

      // Extract storage path from URL
      const urlParts = fileUrl.split('/storage/v1/object/public/documents/');
      const storagePath = urlParts[1];

      if (!storagePath) {
        throw new Error('Invalid file URL');
      }

      // Download from Supabase storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(storagePath);

      if (downloadError || !fileData) {
        throw new Error('Failed to download document file');
      }

      const fileBuffer = Buffer.from(await fileData.arrayBuffer());

      // Process document
      const result = await processor.processDocument(
        input.documentId,
        fileBuffer,
        document.type,
        {
          clientId: input.clientId || document.client_id,
          skipOCR: input.skipOCR,
          skipAnalysis: input.skipAnalysis,
          skipAutoFill: input.skipAutoFill,
          priority: input.priority || 'normal',
        }
      );

      return result;
    }),

  // Get processing status for a document
  getProcessingStatus: protectedProcedure
    .input(z.object({ documentId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const processor = new DocumentProcessor();

      // Check real-time status first
      const realtimeStatus = processor.getProcessingStatus(input.documentId);
      if (realtimeStatus) {
        return realtimeStatus;
      }

      // Fall back to database status
      const { data, error } = await supabase
        .from('documents')
        .select('processing_status, ai_analysis_status, processing_started_at, processing_completed_at, processing_error')
        .eq('id', input.documentId)
        .eq('user_id', ctx.user.id)
        .single();

      if (error || !data) {
        return {
          documentId: input.documentId,
          status: 'unknown',
          currentStage: 'unknown',
          progress: 0,
          message: 'Document not found'
        };
      }

      // Map database status to processing status
      const progressMap: Record<string, number> = {
        'pending': 0,
        'processing': 25,
        'completed': 100,
        'failed': 0
      };

      return {
        documentId: input.documentId,
        status: data.processing_status,
        currentStage: data.ai_analysis_status || 'pending',
        progress: progressMap[data.processing_status] || 0,
        message: data.processing_error || 'Processing...',
        startedAt: data.processing_started_at ? new Date(data.processing_started_at) : undefined,
        completedAt: data.processing_completed_at ? new Date(data.processing_completed_at) : undefined
      };
    }),

  // Get processing results for a document
  getProcessingResults: protectedProcedure
    .input(z.object({ documentId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await supabase
        .from('document_processing_results')
        .select('*')
        .eq('document_id', input.documentId)
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data;
    }),

  // Reprocess a failed document
  reprocessDocument: protectedProcedure
    .input(z.object({
      documentId: z.string().uuid(),
      skipOCR: z.boolean().optional(),
      skipAnalysis: z.boolean().optional(),
      skipAutoFill: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const processor = new DocumentProcessor();

      const result = await processor.reprocessDocument(input.documentId, {
        skipOCR: input.skipOCR,
        skipAnalysis: input.skipAnalysis,
        skipAutoFill: input.skipAutoFill,
      });

      return result;
    }),
});
