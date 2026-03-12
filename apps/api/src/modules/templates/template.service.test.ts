import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/utils/api-error.js';

import {
  makeExercise,
  makeTemplate,
  makeTemplateItem,
} from './template-service-test-helpers.js';

const mockDb = vi.hoisted(() => ({
  delete: vi.fn(),
  execute: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  transaction: vi.fn(),
  update: vi.fn(),
}));

const mockSql = vi.hoisted(() => {
  const tag = (strings: TemplateStringsArray, ...values: unknown[]) => ({
    strings,
    values,
  });

  return Object.assign(tag, {
    join: vi.fn(),
    raw: vi.fn((value: string) => ({ raw: value })),
  });
});

vi.mock('@repo/database/index', () => ({
  and: (...conditions: unknown[]) => ({
    conditions,
    type: 'and',
  }),
  asc: (column: string) => ({
    column,
    type: 'asc',
  }),
  db: mockDb,
  eq: (column: string, value: unknown) => ({
    column,
    type: 'eq',
    value,
  }),
  exercises: {
    deletedAt: 'exercises.deletedAt',
    id: 'exercises.id',
    ownerId: 'exercises.ownerId',
    source: 'exercises.source',
  },
  isNull: (column: string) => ({
    column,
    type: 'is-null',
  }),
  sql: mockSql,
  templateItems: {
    exerciseId: 'templateItems.exerciseId',
    id: 'templateItems.id',
    note: 'templateItems.note',
    sortOrder: 'templateItems.sortOrder',
    templateId: 'templateItems.templateId',
  },
  templates: {
    deletedAt: 'templates.deletedAt',
    description: 'templates.description',
    id: 'templates.id',
    name: 'templates.name',
    ownerId: 'templates.ownerId',
  },
}));

const {
  addTemplateItem,
  deleteTemplateItem,
  getTemplateById,
  updateTemplateItem,
} = await import('./template.service.js');

function mockPlainSelectOnce(rows: unknown[]) {
  const where = vi.fn().mockReturnValue(rows);
  const from = vi.fn().mockReturnValue({ where });

  mockDb.select.mockImplementationOnce(() => ({ from }));

  return { from, where };
}

function mockOrderedSelectOnce(rows: unknown[]) {
  const orderBy = vi.fn().mockReturnValue(rows);
  const where = vi.fn().mockReturnValue({ orderBy });
  const from = vi.fn().mockReturnValue({ where });

  mockDb.select.mockImplementationOnce(() => ({ from }));

  return { from, orderBy, where };
}

beforeEach(() => {
  mockDb.delete.mockReset();
  mockDb.execute.mockReset();
  mockDb.insert.mockReset();
  mockDb.select.mockReset();
  mockDb.transaction.mockReset();
  mockDb.update.mockReset();
  mockSql.join.mockReset();
  mockSql.raw.mockReset();

  mockDb.transaction.mockImplementation(
    async (callback: (tx: typeof mockDb) => Promise<unknown>) =>
      callback(mockDb),
  );
});

describe('getTemplateById', () => {
  it('rejects non-owners before loading item detail', async () => {
    mockPlainSelectOnce([makeTemplate({ ownerId: 'user-2' })]);

    await expect(getTemplateById('tpl-1', 'user-1')).rejects.toThrow(
      new ApiError(403, 'Forbidden'),
    );

    expect(mockDb.select).toHaveBeenCalledTimes(1);
  });
});

describe('addTemplateItem', () => {
  it('rejects an out-of-range insert position before writing', async () => {
    const template = makeTemplate();
    const exercise = makeExercise();

    mockPlainSelectOnce([template]);
    mockPlainSelectOnce([exercise]);
    mockOrderedSelectOnce([makeTemplateItem({ templateId: template.id })]);

    await expect(
      addTemplateItem(template.id, template.ownerId, {
        exerciseId: exercise.id,
        position: 2,
      }),
    ).rejects.toThrow(new ApiError(400, 'Position out of range'));

    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(mockDb.execute).not.toHaveBeenCalled();
  });

  it('rejects exercises that are not accessible to the owner', async () => {
    const template = makeTemplate();

    mockPlainSelectOnce([template]);
    mockPlainSelectOnce([]);

    await expect(
      addTemplateItem(template.id, template.ownerId, {
        exerciseId: 'missing-exercise',
      }),
    ).rejects.toThrow(new ApiError(400, 'Exercise not accessible'));

    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it('maps template item ordering conflicts to a 409 response', async () => {
    const template = makeTemplate();
    const exercise = makeExercise();

    mockPlainSelectOnce([template]);
    mockPlainSelectOnce([exercise]);
    mockDb.transaction.mockRejectedValueOnce(
      Object.assign(
        new Error('duplicate key value violates unique constraint'),
        {
          constraint: 'template_items_template_id_sort_order_unique',
        },
      ),
    );

    await expect(
      addTemplateItem(template.id, template.ownerId, {
        exerciseId: exercise.id,
      }),
    ).rejects.toThrow(new ApiError(409, 'Template item ordering conflict'));
  });

  it('maps wrapped ordering conflicts to a 409 response', async () => {
    const template = makeTemplate();
    const exercise = makeExercise();

    mockPlainSelectOnce([template]);
    mockPlainSelectOnce([exercise]);
    mockDb.transaction.mockRejectedValueOnce(
      Object.assign(new Error('Failed query'), {
        cause: {
          constraint: 'template_items_template_id_sort_order_unique',
        },
      }),
    );

    await expect(
      addTemplateItem(template.id, template.ownerId, {
        exerciseId: exercise.id,
      }),
    ).rejects.toThrow(new ApiError(409, 'Template item ordering conflict'));
  });

  it('does not relabel unrelated unique violations as ordering conflicts', async () => {
    const template = makeTemplate();
    const exercise = makeExercise();
    const unrelatedError = Object.assign(new Error('duplicate key'), {
      constraint: 'users_email_unique',
    });

    mockPlainSelectOnce([template]);
    mockPlainSelectOnce([exercise]);
    mockDb.transaction.mockRejectedValueOnce(unrelatedError);

    await expect(
      addTemplateItem(template.id, template.ownerId, {
        exerciseId: exercise.id,
      }),
    ).rejects.toBe(unrelatedError);
  });
});

describe('updateTemplateItem', () => {
  it('rejects an out-of-range move position', async () => {
    const template = makeTemplate();
    const currentItem = makeTemplateItem({ templateId: template.id });

    mockPlainSelectOnce([template]);
    mockOrderedSelectOnce([currentItem]);

    await expect(
      updateTemplateItem(template.id, currentItem.id, template.ownerId, {
        position: 1,
      }),
    ).rejects.toThrow(new ApiError(400, 'Position out of range'));

    expect(mockDb.update).not.toHaveBeenCalled();
    expect(mockDb.execute).not.toHaveBeenCalled();
  });

  it('throws 404 when the item does not exist in the template sequence', async () => {
    const template = makeTemplate();

    mockPlainSelectOnce([template]);
    mockOrderedSelectOnce([makeTemplateItem({ id: 'other-item' })]);

    await expect(
      updateTemplateItem(template.id, 'missing-item', template.ownerId, {
        position: 0,
      }),
    ).rejects.toThrow(new ApiError(404, 'Template item not found'));
  });
});

describe('deleteTemplateItem', () => {
  it('throws 404 when the item does not exist', async () => {
    const template = makeTemplate();

    mockPlainSelectOnce([template]);
    mockOrderedSelectOnce([makeTemplateItem({ id: 'other-item' })]);

    await expect(
      deleteTemplateItem(template.id, 'missing-item', template.ownerId),
    ).rejects.toThrow(new ApiError(404, 'Template item not found'));

    expect(mockDb.delete).not.toHaveBeenCalled();
  });
});
