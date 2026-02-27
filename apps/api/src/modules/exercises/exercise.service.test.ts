import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/utils/api-error.js';

let selectResult: unknown[] = [];
let insertResult: unknown[] = [];

vi.mock('@repo/database/index', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => selectResult,
      }),
    }),
    insert: () => ({
      values: (vals: unknown) => {
        insertResult.push(vals);
        return {
          returning: () => insertResult,
        };
      },
    }),
  },
  eq: vi.fn((_col, val) => val),
  and: vi.fn((...conditions: unknown[]) => conditions),
  isNull: vi.fn((_col) => 'IS_NULL'),
  exercises: {
    id: 'exercises.id',
    ownerId: 'exercises.ownerId',
    name: 'exercises.name',
    source: 'exercises.source',
    deletedAt: 'exercises.deletedAt',
  },
}));

const { listPresetExercises, createCustomExercise, getExerciseById } =
  await import('./exercise.service.js');

beforeEach(() => {
  selectResult = [];
  insertResult = [];
});

describe('listPresetExercises', () => {
  it('should return preset exercises', async () => {
    const mockExercises = [
      { id: 'ex-1', name: 'Bench Press', source: 'PRESET' },
      { id: 'ex-2', name: 'Squat', source: 'PRESET' },
    ];
    selectResult = mockExercises;

    const result = await listPresetExercises();

    expect(result).toEqual(mockExercises);
  });

  it('should return empty array when no preset exercises exist', async () => {
    selectResult = [];

    const result = await listPresetExercises();

    expect(result).toEqual([]);
  });
});

describe('createCustomExercise', () => {
  const input = { name: 'My Custom Exercise', description: 'A description' };

  it('should create a custom exercise with ownerId', async () => {
    const created = {
      id: 'ex-new',
      ownerId: 'user-1',
      name: input.name,
      description: input.description,
      source: 'CUSTOM',
    };
    insertResult = [created];

    const result = await createCustomExercise('user-1', input);

    expect(result).toEqual(created);
  });

  it('should create exercise without description', async () => {
    const created = {
      id: 'ex-new',
      ownerId: 'user-1',
      name: 'Push Ups',
      source: 'CUSTOM',
    };
    insertResult = [created];

    const result = await createCustomExercise('user-1', { name: 'Push Ups' });

    expect(result).toEqual(created);
  });
});

describe('getExerciseById', () => {
  it('should return exercise when found', async () => {
    const mockExercise = {
      id: 'ex-1',
      name: 'Bench Press',
      source: 'PRESET',
      deletedAt: null,
    };
    selectResult = [mockExercise];

    const result = await getExerciseById('ex-1');

    expect(result).toEqual(mockExercise);
  });

  it('should throw 404 when exercise not found', async () => {
    selectResult = [];

    await expect(getExerciseById('non-existent')).rejects.toThrow(
      new ApiError(404, 'Exercise not found'),
    );
  });
});
