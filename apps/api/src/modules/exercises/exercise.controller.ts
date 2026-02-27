import type { RequestHandler } from 'express';

import {
  createCustomExerciseSchema,
  exerciseIdParamsSchema,
} from '@repo/shared/exercises';

import {
  createCustomExercise,
  getExerciseById,
  listPresetExercises,
} from './exercise.service.js';

// GET /api/exercises/preset
export const listPreset: RequestHandler = async (_req, res) => {
  const exercises = await listPresetExercises();
  res.json(exercises);
};

// POST /api/exercises/custom
export const createCustom: RequestHandler = async (req, res) => {
  const input = createCustomExerciseSchema.parse(req.body);
  const exercise = await createCustomExercise(req.user!.userId, input);
  res.status(201).json(exercise);
};

// GET /api/exercises/:exerciseId
export const getDetail: RequestHandler = async (req, res) => {
  const { exerciseId } = exerciseIdParamsSchema.parse(req.params);
  const exercise = await getExerciseById(exerciseId);
  res.json(exercise);
};
