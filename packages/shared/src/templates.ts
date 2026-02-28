import { z } from 'zod';

export const templateIdParamsSchema = z.object({
  templateId: z.uuid({ error: 'Invalid template ID' }),
});

export const templateItemIdParamsSchema = z.object({
  templateId: z.uuid({ error: 'Invalid template ID' }),
  itemId: z.uuid({ error: 'Invalid item ID' }),
});

export const createTemplateSchema = z.object({
  name: z
    .string()
    .min(1, { error: 'Template name is required' })
    .max(255, { error: 'Template name must be at most 255 characters' }),
  description: z
    .string()
    .max(1000, { error: 'Description must be at most 1000 characters' })
    .optional(),
});

export const updateTemplateSchema = z.object({
  name: z
    .string()
    .min(1, { error: 'Template name is required' })
    .max(255, { error: 'Template name must be at most 255 characters' })
    .optional(),
  description: z
    .string()
    .max(1000, { error: 'Description must be at most 1000 characters' })
    .optional(),
});

export const addTemplateItemSchema = z.object({
  exerciseId: z.uuid({ error: 'Invalid exercise ID' }),
  sortOrder: z.int({ error: 'Sort order must be an integer' }).min(0, {
    error: 'Sort order must be non-negative',
  }),
  note: z
    .string()
    .max(500, { error: 'Note must be at most 500 characters' })
    .optional(),
});

export const updateTemplateItemSchema = z.object({
  sortOrder: z.int({ error: 'Sort order must be an integer' }).min(0, {
    error: 'Sort order must be non-negative',
  }).optional(),
  note: z
    .string()
    .max(500, { error: 'Note must be at most 500 characters' })
    .optional(),
});

export type TemplateIdParams = z.infer<typeof templateIdParamsSchema>;
export type TemplateItemIdParams = z.infer<typeof templateItemIdParamsSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type AddTemplateItemInput = z.infer<typeof addTemplateItemSchema>;
export type UpdateTemplateItemInput = z.infer<typeof updateTemplateItemSchema>;
