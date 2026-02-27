import { and, db, eq, exercises, isNull } from '@repo/database/index';
import type { CreateCustomExerciseInput } from '@repo/shared/exercises';

import { ApiError } from '@/utils/api-error.js';

export async function listPresetExercises() {
  return db
    .select()
    .from(exercises)
    .where(and(eq(exercises.source, 'PRESET'), isNull(exercises.deletedAt)));
}

export async function createCustomExercise(
  ownerId: string,
  input: CreateCustomExerciseInput,
) {
  const [created] = await db
    .insert(exercises)
    .values({
      ownerId,
      name: input.name,
      description: input.description,
      source: 'CUSTOM',
    })
    .returning();

  return created!;
}

export async function getExerciseById(exerciseId: string) {
  const [exercise] = await db
    .select()
    .from(exercises)
    .where(and(eq(exercises.id, exerciseId), isNull(exercises.deletedAt)));

  if (!exercise) {
    throw new ApiError(404, 'Exercise not found');
  }

  return exercise;
}
