import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/utils/api-error.js';

type TemplateRecord = {
  [key: string]: unknown;
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  createdAt: Date;
  deletedAt: Date | null;
};

type TemplateItemRecord = {
  [key: string]: unknown;
  id: string;
  templateId: string;
  exerciseId: string;
  sortOrder: number;
  note: string | null;
};

type ExerciseRecord = {
  [key: string]: unknown;
  id: string;
  ownerId: string | null;
  source: 'PRESET' | 'CUSTOM';
  deletedAt: Date | null;
};

type Condition =
  | { type: 'eq'; column: string; value: unknown }
  | { type: 'and'; conditions: Condition[] }
  | { type: 'is-null'; column: string };

type Order = { type: 'asc'; column: string };

type TableName = 'templates' | 'template_items' | 'exercises';
type MockDbClient = {
  select: () => {
    from: (table: { _name?: string }) => {
      where: (condition?: Condition) => Array<Record<string, unknown>> & {
        orderBy: (order: Order) => Array<Record<string, unknown>>;
      };
    };
  };
  insert: (table: { _name?: string }) => {
    values: (values: Record<string, unknown> | Record<string, unknown>[]) => {
      returning: () => Array<Record<string, unknown>>;
    };
  };
  update: (table: { _name?: string }) => {
    set: (value: Record<string, unknown>) => {
      where: (condition?: Condition) => {
        returning: () => Array<Record<string, unknown>>;
      };
    };
  };
  delete: (table: { _name?: string }) => {
    where: (condition?: Condition) => {
      returning: (
        selection?: Record<string, unknown>,
      ) => Array<Record<string, unknown>>;
    };
  };
  transaction: <T>(callback: (tx: MockDbClient) => T | Promise<T>) => Promise<T>;
};

const mockState = vi.hoisted(() => ({
  templates: [] as TemplateRecord[],
  templateItems: [] as TemplateItemRecord[],
  exercises: [] as ExerciseRecord[],
  templateIdSequence: 0,
  templateItemIdSequence: 0,
  transactionCalls: 0,
}));

function createUniqueViolationError() {
  return Object.assign(new Error('duplicate key value violates unique constraint'), {
    code: '23505',
  });
}

function cloneRows<T>(rows: T[]): T[] {
  return structuredClone(rows);
}

function getFieldName(column: string) {
  return column.split('.').at(-1)!;
}

function matchesCondition(
  row: Record<string, unknown>,
  condition?: Condition,
): boolean {
  if (!condition) {
    return true;
  }

  if (condition.type === 'and') {
    return condition.conditions.every((entry) => matchesCondition(row, entry));
  }

  if (condition.type === 'eq') {
    return row[getFieldName(condition.column)] === condition.value;
  }

  return row[getFieldName(condition.column)] === null;
}

function sortRows<T extends Record<string, unknown>>(rows: T[], order: Order) {
  const fieldName = getFieldName(order.column);

  return cloneRows(rows).sort((left, right) => {
    const leftValue = left[fieldName];
    const rightValue = right[fieldName];

    if (leftValue === rightValue) {
      return 0;
    }

    return leftValue! < rightValue! ? -1 : 1;
  });
}

function createWhereResult<T extends Record<string, unknown>>(
  rows: T[],
): T[] & { orderBy: (order: Order) => T[] } {
  const filteredRows = cloneRows(rows) as T[] & {
    orderBy: (order: Order) => T[];
  };

  filteredRows.orderBy = (order: Order) => sortRows(rows, order);

  return filteredRows;
}

function getTableRows(table: { _name?: string }) {
  if (table._name === 'templates') {
    return mockState.templates;
  }

  if (table._name === 'template_items') {
    return mockState.templateItems;
  }

  if (table._name === 'exercises') {
    return mockState.exercises;
  }

  throw new Error(`Unsupported table: ${String(table._name)}`);
}

function ensureTemplateItemOrderingUnique() {
  const seenKeys = new Set<string>();

  for (const item of mockState.templateItems) {
    const key = `${item.templateId}:${item.sortOrder}`;

    if (seenKeys.has(key)) {
      throw createUniqueViolationError();
    }

    seenKeys.add(key);
  }
}

function createDbClient(): MockDbClient {
  return {
    select: () => ({
      from: (table: { _name?: string }) => ({
        where: (condition?: Condition) =>
          createWhereResult(
            getTableRows(table).filter((row) =>
              matchesCondition(row as Record<string, unknown>, condition),
            ),
          ),
      }),
    }),
    insert: (table: { _name?: string }) => ({
      values: (values: Record<string, unknown> | Record<string, unknown>[]) => {
        const valueList = Array.isArray(values) ? values : [values];
        const insertedRows = valueList.map((value) => {
          if (table._name === 'templates') {
            const template: TemplateRecord = {
              id:
                (value.id as string | undefined) ??
                `tpl-generated-${++mockState.templateIdSequence}`,
              ownerId: value.ownerId as string,
              name: value.name as string,
              description: value.description as string | undefined,
              createdAt: new Date(),
              deletedAt: null,
            };

            mockState.templates.push(template);

            return template;
          }

          if (table._name === 'template_items') {
            const templateItem: TemplateItemRecord = {
              id:
                (value.id as string | undefined) ??
                `item-generated-${++mockState.templateItemIdSequence}`,
              templateId: value.templateId as string,
              exerciseId: value.exerciseId as string,
              sortOrder: value.sortOrder as number,
              note: (value.note as string | undefined) ?? null,
            };

            mockState.templateItems.push(templateItem);
            ensureTemplateItemOrderingUnique();

            return templateItem;
          }

          throw new Error(`Unsupported insert table: ${String(table._name)}`);
        });

        return {
          returning: () => cloneRows(insertedRows),
        };
      },
    }),
    update: (table: { _name?: string }) => ({
      set: (value: Record<string, unknown>) => ({
        where: (condition?: Condition) => {
          const rows = getTableRows(table).filter((row) =>
            matchesCondition(row as Record<string, unknown>, condition),
          );

          rows.forEach((row) => {
            Object.assign(row, value);
          });

          if (table._name === 'template_items') {
            ensureTemplateItemOrderingUnique();
          }

          return {
            returning: () => cloneRows(rows),
          };
        },
      }),
    }),
    delete: (table: { _name?: string }) => ({
      where: (condition?: Condition) => {
        const rows = getTableRows(table);
        const deletedRows = rows.filter((row) =>
          matchesCondition(row as Record<string, unknown>, condition),
        );

        const remainingRows = rows.filter(
          (row) => !matchesCondition(row as Record<string, unknown>, condition),
        );

        if (table._name === 'templates') {
          mockState.templates = remainingRows as TemplateRecord[];
        } else if (table._name === 'template_items') {
          mockState.templateItems = remainingRows as TemplateItemRecord[];
        } else if (table._name === 'exercises') {
          mockState.exercises = remainingRows as ExerciseRecord[];
        }

        return {
          returning: (selection?: Record<string, unknown>) => {
            if (selection) {
              return cloneRows(deletedRows.map((row) => ({ id: row.id })));
            }

            return cloneRows(deletedRows);
          },
        };
      },
    }),
    transaction: async <T>(callback: (tx: MockDbClient) => T | Promise<T>) => {
      mockState.transactionCalls += 1;
      const snapshot = {
        templates: cloneRows(mockState.templates),
        templateItems: cloneRows(mockState.templateItems),
        exercises: cloneRows(mockState.exercises),
        templateIdSequence: mockState.templateIdSequence,
        templateItemIdSequence: mockState.templateItemIdSequence,
      };

      try {
        return await callback(createDbClient());
      } catch (error) {
        mockState.templates = snapshot.templates;
        mockState.templateItems = snapshot.templateItems;
        mockState.exercises = snapshot.exercises;
        mockState.templateIdSequence = snapshot.templateIdSequence;
        mockState.templateItemIdSequence = snapshot.templateItemIdSequence;

        throw error;
      }
    },
  };
}

vi.mock('@repo/database/index', () => ({
  db: createDbClient(),
  eq: (column: string, value: unknown): Condition => ({
    type: 'eq',
    column,
    value,
  }),
  and: (...conditions: Condition[]): Condition => ({
    type: 'and',
    conditions,
  }),
  isNull: (column: string): Condition => ({
    type: 'is-null',
    column,
  }),
  asc: (column: string): Order => ({
    type: 'asc',
    column,
  }),
  templates: {
    id: 'templates.id',
    ownerId: 'templates.ownerId',
    name: 'templates.name',
    description: 'templates.description',
    deletedAt: 'templates.deletedAt',
    _name: 'templates' satisfies TableName,
  },
  templateItems: {
    id: 'templateItems.id',
    templateId: 'templateItems.templateId',
    exerciseId: 'templateItems.exerciseId',
    sortOrder: 'templateItems.sortOrder',
    note: 'templateItems.note',
    _name: 'template_items' satisfies TableName,
  },
  exercises: {
    id: 'exercises.id',
    ownerId: 'exercises.ownerId',
    source: 'exercises.source',
    deletedAt: 'exercises.deletedAt',
    _name: 'exercises' satisfies TableName,
  },
}));

const {
  addTemplateItem,
  createTemplate,
  deleteTemplate,
  deleteTemplateItem,
  getTemplateById,
  listOwnTemplates,
  updateTemplate,
  updateTemplateItem,
} = await import('./template.service.js');
const { db } = await import('@repo/database/index');

function resetMockState() {
  mockState.templates = [];
  mockState.templateItems = [];
  mockState.exercises = [];
  mockState.templateIdSequence = 0;
  mockState.templateItemIdSequence = 0;
  mockState.transactionCalls = 0;
}

function seedTemplate(overrides: Partial<TemplateRecord> = {}) {
  const template: TemplateRecord = {
    id: overrides.id ?? `tpl-${mockState.templates.length + 1}`,
    ownerId: overrides.ownerId ?? 'user-1',
    name: overrides.name ?? 'Push Day',
    description: overrides.description,
    createdAt: overrides.createdAt ?? new Date('2026-03-11T00:00:00.000Z'),
    deletedAt: overrides.deletedAt ?? null,
  };

  mockState.templates.push(template);

  return template;
}

function seedTemplateItem(overrides: Partial<TemplateItemRecord> = {}) {
  const templateItem: TemplateItemRecord = {
    id: overrides.id ?? `item-${mockState.templateItems.length + 1}`,
    templateId: overrides.templateId ?? 'tpl-1',
    exerciseId: overrides.exerciseId ?? 'ex-1',
    sortOrder: overrides.sortOrder ?? 0,
    note: overrides.note ?? null,
  };

  mockState.templateItems.push(templateItem);

  return templateItem;
}

function seedExercise(overrides: Partial<ExerciseRecord> = {}) {
  const exercise: ExerciseRecord = {
    id: overrides.id ?? `ex-${mockState.exercises.length + 1}`,
    ownerId: overrides.ownerId ?? null,
    source: overrides.source ?? 'PRESET',
    deletedAt: overrides.deletedAt ?? null,
  };

  mockState.exercises.push(exercise);

  return exercise;
}

function listTemplateItems(templateId: string) {
  return cloneRows(
    mockState.templateItems
      .filter((item) => item.templateId === templateId)
      .sort((left, right) => left.sortOrder - right.sortOrder),
  );
}

beforeEach(() => {
  resetMockState();
});

describe('createTemplate', () => {
  it('creates a template with its owner metadata', async () => {
    const created = await createTemplate('user-1', {
      name: 'Push Day',
      description: 'Chest and triceps',
    });

    expect(created.ownerId).toBe('user-1');
    expect(created.name).toBe('Push Day');
    expect(created.description).toBe('Chest and triceps');
  });
});

describe('listOwnTemplates', () => {
  it('returns only active templates for the current owner', async () => {
    seedTemplate({ id: 'tpl-1', ownerId: 'user-1', deletedAt: null });
    seedTemplate({ id: 'tpl-2', ownerId: 'user-1', deletedAt: new Date() });
    seedTemplate({ id: 'tpl-3', ownerId: 'user-2', deletedAt: null });

    const templates = await listOwnTemplates('user-1');

    expect(templates.map((template) => template.id)).toEqual(['tpl-1']);
  });
});

describe('getTemplateById', () => {
  it('returns items sorted by sortOrder', async () => {
    const template = seedTemplate({ id: 'tpl-1', ownerId: 'user-1' });

    seedTemplateItem({
      id: 'item-2',
      templateId: template.id,
      exerciseId: 'ex-2',
      sortOrder: 2,
    });
    seedTemplateItem({
      id: 'item-1',
      templateId: template.id,
      exerciseId: 'ex-1',
      sortOrder: 0,
    });
    seedTemplateItem({
      id: 'item-3',
      templateId: template.id,
      exerciseId: 'ex-3',
      sortOrder: 1,
    });

    const result = await getTemplateById(template.id, 'user-1');

    expect(result.items.map((item) => item.id)).toEqual([
      'item-1',
      'item-3',
      'item-2',
    ]);
  });
});

describe('updateTemplate', () => {
  it('updates template metadata for the owner', async () => {
    const template = seedTemplate({ id: 'tpl-1', ownerId: 'user-1' });

    const updated = await updateTemplate(template.id, 'user-1', {
      name: 'Pull Day',
      description: 'Back and biceps',
    });

    expect(updated.name).toBe('Pull Day');
    expect(updated.description).toBe('Back and biceps');
  });
});

describe('deleteTemplate', () => {
  it('soft deletes a template', async () => {
    const template = seedTemplate({ id: 'tpl-1', ownerId: 'user-1' });

    await deleteTemplate(template.id, 'user-1');

    expect(mockState.templates[0]?.deletedAt).toBeInstanceOf(Date);
  });
});

describe('addTemplateItem', () => {
  it('creates the first item in an empty template at sortOrder 0', async () => {
    const template = seedTemplate({ id: 'tpl-1', ownerId: 'user-1' });
    seedExercise({ id: 'ex-1', source: 'PRESET' });

    const created = await addTemplateItem(template.id, 'user-1', {
      exerciseId: 'ex-1',
    });

    expect(created.sortOrder).toBe(0);
    expect(listTemplateItems(template.id).map((item) => item.sortOrder)).toEqual([
      0,
    ]);
    expect(mockState.transactionCalls).toBe(1);
  });

  it('appends to the end when position is omitted', async () => {
    const template = seedTemplate({ id: 'tpl-1', ownerId: 'user-1' });
    seedExercise({ id: 'ex-2', source: 'PRESET' });
    seedTemplateItem({ id: 'item-1', templateId: template.id, sortOrder: 0 });
    seedTemplateItem({ id: 'item-2', templateId: template.id, sortOrder: 1 });

    const created = await addTemplateItem(template.id, 'user-1', {
      exerciseId: 'ex-2',
    });

    expect(created.sortOrder).toBe(2);
    expect(listTemplateItems(template.id).map((item) => item.id)).toEqual([
      'item-1',
      'item-2',
      created.id,
    ]);
    expect(mockState.transactionCalls).toBe(1);
  });

  it('inserts at the requested position and shifts trailing items', async () => {
    const template = seedTemplate({ id: 'tpl-1', ownerId: 'user-1' });
    seedExercise({ id: 'ex-3', source: 'PRESET' });
    seedTemplateItem({ id: 'item-1', templateId: template.id, sortOrder: 0 });
    seedTemplateItem({ id: 'item-2', templateId: template.id, sortOrder: 1 });

    const created = await addTemplateItem(template.id, 'user-1', {
      exerciseId: 'ex-3',
      position: 1,
      note: 'Superset',
    });

    expect(created.sortOrder).toBe(1);
    expect(created.note).toBe('Superset');
    expect(listTemplateItems(template.id)).toEqual([
      expect.objectContaining({ id: 'item-1', sortOrder: 0 }),
      expect.objectContaining({ id: created.id, sortOrder: 1, note: 'Superset' }),
      expect.objectContaining({ id: 'item-2', sortOrder: 2 }),
    ]);
    expect(mockState.transactionCalls).toBe(1);
  });

  it('rejects an out-of-range insert position', async () => {
    const template = seedTemplate({ id: 'tpl-1', ownerId: 'user-1' });
    seedExercise({ id: 'ex-4', source: 'PRESET' });
    seedTemplateItem({ templateId: template.id, sortOrder: 0 });

    await expect(
      addTemplateItem(template.id, 'user-1', {
        exerciseId: 'ex-4',
        position: 2,
      }),
    ).rejects.toThrow(new ApiError(400, 'Position out of range'));
  });

  it('rejects exercises that are not accessible to the owner', async () => {
    const template = seedTemplate({ id: 'tpl-1', ownerId: 'user-1' });
    seedExercise({
      id: 'ex-5',
      source: 'CUSTOM',
      ownerId: 'user-2',
    });

    await expect(
      addTemplateItem(template.id, 'user-1', {
        exerciseId: 'ex-5',
      }),
    ).rejects.toThrow(new ApiError(400, 'Exercise not accessible'));
  });

  it('rejects non-owners', async () => {
    const template = seedTemplate({ id: 'tpl-1', ownerId: 'user-2' });

    await expect(
      addTemplateItem(template.id, 'user-1', {
        exerciseId: 'ex-6',
      }),
    ).rejects.toThrow(new ApiError(403, 'Forbidden'));
  });

  it('maps unique constraint races to a 409 conflict', async () => {
    const template = seedTemplate({ id: 'tpl-1', ownerId: 'user-1' });
    seedExercise({ id: 'ex-7', source: 'PRESET' });
    const transactionSpy = vi
      .spyOn(db, 'transaction')
      .mockRejectedValueOnce(createUniqueViolationError());

    await expect(
      addTemplateItem(template.id, 'user-1', {
        exerciseId: 'ex-7',
      }),
    ).rejects.toThrow(new ApiError(409, 'Template item ordering conflict'));

    transactionSpy.mockRestore();
  });
});

describe('updateTemplateItem', () => {
  it('updates note without reordering', async () => {
    const template = seedTemplate({ id: 'tpl-1', ownerId: 'user-1' });
    seedTemplateItem({
      id: 'item-1',
      templateId: template.id,
      sortOrder: 0,
      note: null,
    });

    const updated = await updateTemplateItem(template.id, 'item-1', 'user-1', {
      note: 'Pause reps',
    });

    expect(updated.note).toBe('Pause reps');
    expect(listTemplateItems(template.id)).toEqual([
      expect.objectContaining({ id: 'item-1', sortOrder: 0, note: 'Pause reps' }),
    ]);
  });

  it('moves an item to a new position and keeps sortOrder contiguous', async () => {
    const template = seedTemplate({ id: 'tpl-1', ownerId: 'user-1' });
    seedTemplateItem({
      id: 'item-1',
      templateId: template.id,
      sortOrder: 0,
      note: null,
    });
    seedTemplateItem({
      id: 'item-2',
      templateId: template.id,
      sortOrder: 1,
      note: null,
    });
    seedTemplateItem({
      id: 'item-3',
      templateId: template.id,
      sortOrder: 2,
      note: null,
    });

    const updated = await updateTemplateItem(template.id, 'item-1', 'user-1', {
      position: 2,
      note: 'Drop set finisher',
    });

    expect(updated).toEqual(
      expect.objectContaining({
        id: 'item-1',
        sortOrder: 2,
        note: 'Drop set finisher',
      }),
    );
    expect(listTemplateItems(template.id)).toEqual([
      expect.objectContaining({ id: 'item-2', sortOrder: 0 }),
      expect.objectContaining({ id: 'item-3', sortOrder: 1 }),
      expect.objectContaining({
        id: 'item-1',
        sortOrder: 2,
        note: 'Drop set finisher',
      }),
    ]);
    expect(mockState.transactionCalls).toBe(1);
  });

  it('returns the current item when moved to the same position', async () => {
    const template = seedTemplate({ id: 'tpl-1', ownerId: 'user-1' });
    seedTemplateItem({
      id: 'item-1',
      templateId: template.id,
      sortOrder: 1,
      note: 'Keep tempo',
    });
    seedTemplateItem({
      id: 'item-2',
      templateId: template.id,
      sortOrder: 0,
      note: null,
    });

    const updated = await updateTemplateItem(template.id, 'item-1', 'user-1', {
      position: 1,
    });

    expect(updated).toEqual(
      expect.objectContaining({
        id: 'item-1',
        sortOrder: 1,
        note: 'Keep tempo',
      }),
    );
  });

  it('rejects an out-of-range move position', async () => {
    const template = seedTemplate({ id: 'tpl-1', ownerId: 'user-1' });
    seedTemplateItem({ id: 'item-1', templateId: template.id, sortOrder: 0 });

    await expect(
      updateTemplateItem(template.id, 'item-1', 'user-1', {
        position: 1,
      }),
    ).rejects.toThrow(new ApiError(400, 'Position out of range'));
  });

  it('throws 404 when the item does not exist', async () => {
    const template = seedTemplate({ id: 'tpl-1', ownerId: 'user-1' });

    await expect(
      updateTemplateItem(template.id, 'missing-item', 'user-1', {
        position: 0,
      }),
    ).rejects.toThrow(new ApiError(404, 'Template item not found'));
  });

  it('rejects non-owners', async () => {
    const template = seedTemplate({ id: 'tpl-1', ownerId: 'user-2' });

    await expect(
      updateTemplateItem(template.id, 'item-1', 'user-1', {
        position: 0,
      }),
    ).rejects.toThrow(new ApiError(403, 'Forbidden'));
  });
});

describe('deleteTemplateItem', () => {
  it('deletes an item and compacts remaining sortOrder values', async () => {
    const template = seedTemplate({ id: 'tpl-1', ownerId: 'user-1' });
    seedTemplateItem({ id: 'item-1', templateId: template.id, sortOrder: 0 });
    seedTemplateItem({ id: 'item-2', templateId: template.id, sortOrder: 1 });
    seedTemplateItem({ id: 'item-3', templateId: template.id, sortOrder: 2 });

    await deleteTemplateItem(template.id, 'item-2', 'user-1');

    expect(listTemplateItems(template.id)).toEqual([
      expect.objectContaining({ id: 'item-1', sortOrder: 0 }),
      expect.objectContaining({ id: 'item-3', sortOrder: 1 }),
    ]);
    expect(mockState.transactionCalls).toBe(1);
  });

  it('throws 404 when the item does not exist', async () => {
    const template = seedTemplate({ id: 'tpl-1', ownerId: 'user-1' });

    await expect(
      deleteTemplateItem(template.id, 'missing-item', 'user-1'),
    ).rejects.toThrow(new ApiError(404, 'Template item not found'));
  });

  it('throws 404 when the template does not exist', async () => {
    await expect(
      deleteTemplateItem('missing-template', 'item-1', 'user-1'),
    ).rejects.toThrow(new ApiError(404, 'Template not found'));
  });

  it('rejects non-owners', async () => {
    const template = seedTemplate({ id: 'tpl-1', ownerId: 'user-2' });

    await expect(
      deleteTemplateItem(template.id, 'item-1', 'user-1'),
    ).rejects.toThrow(new ApiError(403, 'Forbidden'));
  });
});
