import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { supabase } from "@/lib/supabase";
import { TaxFormAutoFillService } from "@/lib/ai-processing/TaxFormAutoFillService";

// Tax Form schemas
const TaxFormSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  user_id: z.string().uuid(),
  form_type: z.string(),
  tax_year: z.number(),
  status: z.enum(['draft', 'in_progress', 'completed', 'filed', 'amended']),
  fields: z.record(z.any()),
  source_documents: z.array(z.string().uuid()),
  confidence: z.number().min(0).max(1),
  requires_review: z.boolean(),
  validation_status: z.enum(['valid', 'invalid', 'warning', 'pending']),
  validation_errors: z.array(z.string()),
  auto_fill_summary: z.string().optional(),
  last_auto_fill: z.date().optional(),
  reviewed_by: z.string().uuid().optional(),
  reviewed_at: z.date().optional(),
  filed_at: z.date().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

const CreateTaxFormSchema = z.object({
  client_id: z.string().uuid(),
  form_type: z.string(),
  tax_year: z.number(),
  fields: z.record(z.any()).optional(),
});

const UpdateTaxFormSchema = z.object({
  id: z.string().uuid(),
  fields: z.record(z.any()).optional(),
  status: z.enum(['draft', 'in_progress', 'completed', 'filed', 'amended']).optional(),
  requires_review: z.boolean().optional(),
  validation_status: z.enum(['valid', 'invalid', 'warning', 'pending']).optional(),
  validation_errors: z.array(z.string()).optional(),
});

export const taxFormsRouter = createTRPCRouter({
  // Get all tax forms for a client
  getByClient: protectedProcedure
    .input(z.object({ 
      clientId: z.string().uuid(),
      taxYear: z.number().optional()
    }))
    .query(async ({ input, ctx }) => {
      let query = supabase
        .from('tax_forms')
        .select('*')
        .eq('client_id', input.clientId)
        .eq('user_id', ctx.user.id);

      if (input.taxYear) {
        query = query.eq('tax_year', input.taxYear);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data;
    }),

  // Get tax forms by type
  getByType: protectedProcedure
    .input(z.object({ 
      formType: z.string(),
      taxYear: z.number().optional()
    }))
    .query(async ({ input, ctx }) => {
      let query = supabase
        .from('tax_forms')
        .select('*')
        .eq('form_type', input.formType)
        .eq('user_id', ctx.user.id);

      if (input.taxYear) {
        query = query.eq('tax_year', input.taxYear);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data;
    }),

  // Get a specific tax form
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await supabase
        .from('tax_forms')
        .select('*')
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  // Create a new tax form
  create: protectedProcedure
    .input(CreateTaxFormSchema)
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await supabase
        .from('tax_forms')
        .insert({
          ...input,
          user_id: ctx.user.id,
          status: 'draft',
          confidence: 0,
          requires_review: true,
          validation_status: 'pending',
          validation_errors: [],
          source_documents: [],
          fields: input.fields || {},
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  // Update tax form
  update: protectedProcedure
    .input(UpdateTaxFormSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;
      
      const { data, error } = await supabase
        .from('tax_forms')
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

  // Update specific form field
  updateField: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      fieldPath: z.string(),
      value: z.any(),
      confidence: z.number().min(0).max(1).optional(),
      requiresReview: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Get current form
      const { data: currentForm, error: fetchError } = await supabase
        .from('tax_forms')
        .select('fields')
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .single();

      if (fetchError || !currentForm) {
        throw new Error('Tax form not found');
      }

      // Update the specific field
      const updatedFields = { ...currentForm.fields };
      const fieldParts = input.fieldPath.split('.');
      
      let current = updatedFields;
      for (let i = 0; i < fieldParts.length - 1; i++) {
        if (!current[fieldParts[i]]) {
          current[fieldParts[i]] = {};
        }
        current = current[fieldParts[i]];
      }
      
      current[fieldParts[fieldParts.length - 1]] = {
        value: input.value,
        confidence: input.confidence || 1.0,
        requiresReview: input.requiresReview || false,
        validationStatus: 'pending',
        lastUpdated: new Date(),
        updatedBy: 'user'
      };

      // Update in database
      const { data, error } = await supabase
        .from('tax_forms')
        .update({
          fields: updatedFields,
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  // Mark form as reviewed
  markReviewed: protectedProcedure
    .input(z.object({ 
      id: z.string().uuid(),
      approved: z.boolean(),
      notes: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await supabase
        .from('tax_forms')
        .update({
          requires_review: false,
          reviewed_by: ctx.user.id,
          reviewed_at: new Date().toISOString(),
          status: input.approved ? 'completed' : 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  // Delete tax form
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { error } = await supabase
        .from('tax_forms')
        .delete()
        .eq('id', input.id)
        .eq('user_id', ctx.user.id);

      if (error) throw new Error(error.message);
      return { success: true };
    }),

  // Get tax form statistics
  getStats: protectedProcedure
    .input(z.object({ taxYear: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      let query = supabase
        .from('tax_forms')
        .select('status, form_type, confidence, requires_review')
        .eq('user_id', ctx.user.id);

      if (input.taxYear) {
        query = query.eq('tax_year', input.taxYear);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);

      const stats = {
        totalForms: data.length,
        byStatus: {} as Record<string, number>,
        byType: {} as Record<string, number>,
        averageConfidence: 0,
        formsRequiringReview: 0,
      };

      if (data.length > 0) {
        stats.byStatus = data.reduce((acc, form) => {
          acc[form.status] = (acc[form.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        stats.byType = data.reduce((acc, form) => {
          acc[form.form_type] = (acc[form.form_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        stats.averageConfidence = data.reduce((sum, form) => sum + form.confidence, 0) / data.length;
        stats.formsRequiringReview = data.filter(form => form.requires_review).length;
      }

      return stats;
    }),

  // Auto-fill form from document
  autoFillFromDocument: protectedProcedure
    .input(z.object({
      clientId: z.string().uuid(),
      documentId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Get document analysis result
      const { data: document, error } = await supabase
        .from('documents')
        .select('ai_analysis_result')
        .eq('id', input.documentId)
        .eq('user_id', ctx.user.id)
        .single();

      if (error || !document || !document.ai_analysis_result) {
        throw new Error('Document analysis not found or incomplete');
      }

      const autoFillService = new TaxFormAutoFillService();
      const result = await autoFillService.autoFillFromDocument(
        input.clientId,
        input.documentId,
        document.ai_analysis_result
      );

      return result;
    }),
});
