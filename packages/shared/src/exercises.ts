import { z } from 'zod';

export const createCustomExerciseSchema = z.object({
  name: z
    .string()
    .min(1, { error: 'Exercise name is required' })
    .max(255, { error: 'Exercise name must be at most 255 characters' }),
  description: z
    .string()
    .max(1000, { error: 'Description must be at most 1000 characters' })
    .optional(),
});

export const exerciseIdParamsSchema = z.object({
  exerciseId: z.uuid({ error: 'Invalid exercise ID' }),
});

export type CreateCustomExerciseInput = z.infer<
  typeof createCustomExerciseSchema
>;
export type ExerciseIdParams = z.infer<typeof exerciseIdParamsSchema>;
