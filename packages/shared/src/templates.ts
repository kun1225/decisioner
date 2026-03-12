import { z } from 'zod';

const requireAtLeastOneField = <T extends Record<string, unknown>>(value: T) =>
  Object.values(value).some((field) => field !== undefined);

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

export const updateTemplateSchema = z
  .object({
    name: z
      .string()
      .min(1, { error: 'Template name is required' })
      .max(255, { error: 'Template name must be at most 255 characters' })
      .optional(),
    description: z
      .string()
      .max(1000, { error: 'Description must be at most 1000 characters' })
      .optional(),
  })
  .refine(requireAtLeastOneField, {
    error: 'At least one field must be provided',
  });

export const addTemplateItemSchema = z.object({
  exerciseId: z.uuid({ error: 'Invalid exercise ID' }),
  position: z
    .int({ error: 'Position must be an integer' })
    .min(0, {
      error: 'Position must be non-negative',
    })
    .optional(),
  note: z
    .string()
    .max(500, { error: 'Note must be at most 500 characters' })
    .optional(),
}).strict();

export const updateTemplateItemSchema = z
  .object({
    position: z
      .int({ error: 'Position must be an integer' })
      .min(0, {
        error: 'Position must be non-negative',
      })
      .optional(),
    note: z
      .string()
      .max(500, { error: 'Note must be at most 500 characters' })
      .optional(),
  })
  .strict()
  .refine(requireAtLeastOneField, {
    error: 'At least one field must be provided',
  });

export type TemplateIdParams = z.infer<typeof templateIdParamsSchema>;
export type TemplateItemIdParams = z.infer<typeof templateItemIdParamsSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type AddTemplateItemInput = z.infer<typeof addTemplateItemSchema>;
export type UpdateTemplateItemInput = z.infer<typeof updateTemplateItemSchema>;
