import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/utils/api-error.js';
import {
  createDatabaseModuleMock,
  makeExercise,
  makeTemplate,
  makeTemplateItem,
  queueDeleteResults as pushDeleteResults,
  queueInsertResults as pushInsertResults,
  queueSelectResults as pushSelectResults,
  queueUpdateResults as pushUpdateResults,
  resetMockDbState as clearMockDbState,
} from './template-service-test-helpers.js';
import type { MockDbState } from './template-service-test-helpers.js';

const mockDbState: MockDbState = vi.hoisted(() => ({
  deleteCalls: [],
  deleteResults: [] as Record<string, unknown>[][],
  insertCalls: [],
  insertResults: [] as Record<string, unknown>[][],
  orderByCalls: [],
  selectCalls: [],
  selectResults: [] as Record<string, unknown>[][],
  transactionCalls: 0,
  updateCalls: [],
  updateResults: [] as Record<string, unknown>[][],
}));

const resetMockDbState = () => {
  clearMockDbState(mockDbState);
};

const queueSelectResults = (...results: Record<string, unknown>[][]) => {
  pushSelectResults(mockDbState, ...results);
};

const queueInsertResults = (...results: Record<string, unknown>[][]) => {
  pushInsertResults(mockDbState, ...results);
};

const queueUpdateResults = (...results: Record<string, unknown>[][]) => {
  pushUpdateResults(mockDbState, ...results);
};

const queueDeleteResults = (...results: Record<string, unknown>[][]) => {
  pushDeleteResults(mockDbState, ...results);
};

vi.mock('@repo/database/index', () => createDatabaseModuleMock(mockDbState));

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

function expectAndCondition(
  condition: unknown,
  expectedConditions: Array<Record<string, unknown>>,
) {
  expect(condition).toEqual(
    expect.objectContaining({
      conditions: expect.arrayContaining(expectedConditions),
      type: 'and',
    }),
  );
}

function expectTemplateItemSelect(templateId: string) {
  expect(mockDbState.selectCalls).toContainEqual({
    condition: {
      column: 'templateItems.templateId',
      type: 'eq',
      value: templateId,
    },
    table: 'template_items',
  });
}

beforeEach(() => {
  resetMockDbState();
});

describe('createTemplate', () => {
  it('creates a template with owner metadata', async () => {
    const createdRow = makeTemplate({ description: 'Chest and triceps' });
    queueInsertResults([createdRow]);

    const created = await createTemplate('user-1', {
      description: 'Chest and triceps',
      name: 'Push Day',
    });

    expect(created).toEqual(createdRow);
    expect(mockDbState.insertCalls).toEqual([
      expect.objectContaining({
        table: 'templates',
        values: expect.objectContaining({
          description: 'Chest and triceps',
          name: 'Push Day',
          ownerId: 'user-1',
        }),
      }),
    ]);
  });
});

describe('listOwnTemplates', () => {
  it('returns the selected active templates for the owner query', async () => {
    const rows = [
      makeTemplate({ id: 'tpl-1', ownerId: 'user-1' }),
      makeTemplate({
        deletedAt: new Date('2026-03-11T02:00:00.000Z'),
        id: 'tpl-2',
        ownerId: 'user-1',
      }),
      makeTemplate({ id: 'tpl-3', ownerId: 'user-2' }),
    ];
    queueSelectResults(rows);

    const templates = await listOwnTemplates('user-1');

    expect([...templates].map((template) => template.id)).toEqual(['tpl-1']);
    expect(mockDbState.selectCalls[0]?.table).toBe('templates');
    expectAndCondition(mockDbState.selectCalls[0]?.condition, [
      {
        column: 'templates.ownerId',
        type: 'eq',
        value: 'user-1',
      },
      {
        column: 'templates.deletedAt',
        type: 'is-null',
      },
    ]);
  });
});

describe('getTemplateById', () => {
  it('returns template detail with item rows from the ordered query', async () => {
    const template = makeTemplate();
    const items = [
      makeTemplateItem({ id: 'item-2', sortOrder: 1, exerciseId: 'ex-2' }),
      makeTemplateItem({ id: 'item-1', sortOrder: 0 }),
    ];
    queueSelectResults([template], items);

    const result = await getTemplateById(template.id, template.ownerId);

    expect(result).toEqual({
      ...template,
      items: [
        makeTemplateItem({ id: 'item-1', sortOrder: 0 }),
        makeTemplateItem({ id: 'item-2', sortOrder: 1, exerciseId: 'ex-2' }),
      ],
    });
    expect(mockDbState.orderByCalls).toEqual([
      {
        order: { column: 'templateItems.sortOrder', type: 'asc' },
        table: 'template_items',
      },
    ]);
    expectTemplateItemSelect(template.id);
  });

  it('rejects non-owners before loading item detail', async () => {
    queueSelectResults([makeTemplate({ ownerId: 'user-2' })]);

    await expect(getTemplateById('tpl-1', 'user-1')).rejects.toThrow(
      new ApiError(403, 'Forbidden'),
    );
    expect(mockDbState.orderByCalls).toHaveLength(0);
  });
});

describe('updateTemplate', () => {
  it('updates template metadata for the owner', async () => {
    const template = makeTemplate();
    const updatedRow = makeTemplate({
      description: 'Back and biceps',
      name: 'Pull Day',
    });
    queueSelectResults([template]);
    queueUpdateResults([updatedRow]);

    const updated = await updateTemplate(template.id, template.ownerId, {
      description: 'Back and biceps',
      name: 'Pull Day',
    });

    expect(updated).toEqual(updatedRow);
    expect(mockDbState.updateCalls).toEqual([
      {
        condition: {
          column: 'templates.id',
          type: 'eq',
          value: template.id,
        },
        table: 'templates',
        values: {
          description: 'Back and biceps',
          name: 'Pull Day',
        },
      },
    ]);
  });
});

describe('deleteTemplate', () => {
  it('soft deletes a template', async () => {
    const template = makeTemplate();
    queueSelectResults([template]);
    queueUpdateResults([makeTemplate({ deletedAt: new Date('2026-03-11T01:00:00.000Z') })]);

    await deleteTemplate(template.id, template.ownerId);

    expect(mockDbState.updateCalls).toEqual([
      {
        condition: {
          column: 'templates.id',
          type: 'eq',
          value: template.id,
        },
        table: 'templates',
        values: expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      },
    ]);
  });
});

describe('addTemplateItem', () => {
  it('creates the first item at position 0 inside a transaction', async () => {
    const template = makeTemplate();
    const exercise = makeExercise();
    const createdRow = makeTemplateItem({ sortOrder: -1 });
    const finalizedRow = makeTemplateItem({ sortOrder: 0 });
    queueSelectResults([template], [exercise], []);
    queueInsertResults([createdRow]);
    queueUpdateResults([createdRow], [finalizedRow]);

    const created = await addTemplateItem(template.id, template.ownerId, {
      exerciseId: exercise.id,
    });

    expect(created).toEqual(finalizedRow);
    expect(mockDbState.transactionCalls).toBe(1);
    expect(mockDbState.insertCalls).toEqual([
      expect.objectContaining({
        table: 'template_items',
        values: expect.objectContaining({
          exerciseId: exercise.id,
          sortOrder: -1,
          templateId: template.id,
        }),
      }),
    ]);
  });

  it('inserts into the middle and renumbers the sequence in order', async () => {
    const template = makeTemplate();
    const exercise = makeExercise({ id: 'ex-3' });
    const existingItems = [
      makeTemplateItem({ id: 'item-1', sortOrder: 0, templateId: template.id }),
      makeTemplateItem({
        exerciseId: 'ex-2',
        id: 'item-2',
        sortOrder: 1,
        templateId: template.id,
      }),
    ];
    const createdRow = makeTemplateItem({
      exerciseId: exercise.id,
      id: 'item-3',
      note: 'Superset',
      sortOrder: -3,
      templateId: template.id,
    });
    queueSelectResults([template], [exercise], existingItems);
    queueInsertResults([createdRow]);
    queueUpdateResults(
      [makeTemplateItem({ id: 'item-1', sortOrder: -1, templateId: template.id })],
      [makeTemplateItem({ ...createdRow, sortOrder: -2 })],
      [
        makeTemplateItem({
          exerciseId: 'ex-2',
          id: 'item-2',
          sortOrder: -3,
          templateId: template.id,
        }),
      ],
      [makeTemplateItem({ id: 'item-1', sortOrder: 0, templateId: template.id })],
      [makeTemplateItem({ ...createdRow, sortOrder: 1 })],
      [
        makeTemplateItem({
          exerciseId: 'ex-2',
          id: 'item-2',
          sortOrder: 2,
          templateId: template.id,
        }),
      ],
    );

    const created = await addTemplateItem(template.id, template.ownerId, {
      exerciseId: exercise.id,
      note: 'Superset',
      position: 1,
    });

    expect(created).toEqual(
      makeTemplateItem({
        exerciseId: exercise.id,
        id: 'item-3',
        note: 'Superset',
        sortOrder: 1,
        templateId: template.id,
      }),
    );
    expectTemplateItemSelect(template.id);
    expect(
      mockDbState.updateCalls.map((call) => [
        call.condition,
        call.values.sortOrder,
      ]),
    ).toEqual([
      [{ column: 'templateItems.id', type: 'eq', value: 'item-1' }, -1],
      [{ column: 'templateItems.id', type: 'eq', value: 'item-3' }, -2],
      [{ column: 'templateItems.id', type: 'eq', value: 'item-2' }, -3],
      [{ column: 'templateItems.id', type: 'eq', value: 'item-1' }, 0],
      [{ column: 'templateItems.id', type: 'eq', value: 'item-3' }, 1],
      [{ column: 'templateItems.id', type: 'eq', value: 'item-2' }, 2],
    ]);
  });

  it('rejects an out-of-range insert position before writing', async () => {
    const template = makeTemplate();
    const exercise = makeExercise();
    queueSelectResults(
      [template],
      [exercise],
      [makeTemplateItem({ sortOrder: 0, templateId: template.id })],
    );

    await expect(
      addTemplateItem(template.id, template.ownerId, {
        exerciseId: exercise.id,
        position: 2,
      }),
    ).rejects.toThrow(new ApiError(400, 'Position out of range'));

    expect(mockDbState.insertCalls).toHaveLength(0);
    expect(mockDbState.updateCalls).toHaveLength(0);
  });

  it('rejects exercises that are not accessible to the owner', async () => {
    const template = makeTemplate();
    queueSelectResults([template], []);

    await expect(
      addTemplateItem(template.id, template.ownerId, {
        exerciseId: 'missing-exercise',
      }),
    ).rejects.toThrow(new ApiError(400, 'Exercise not accessible'));

    expect(mockDbState.transactionCalls).toBe(0);
  });

  it('maps unique constraint races to a 409 conflict', async () => {
    const template = makeTemplate();
    const exercise = makeExercise();
    queueSelectResults([template], [exercise]);
    const transactionSpy = vi
      .spyOn(db, 'transaction')
      .mockRejectedValueOnce(
        Object.assign(new Error('duplicate key value violates unique constraint'), {
          code: '23505',
        }),
      );

    await expect(
      addTemplateItem(template.id, template.ownerId, {
        exerciseId: exercise.id,
      }),
    ).rejects.toThrow(new ApiError(409, 'Template item ordering conflict'));

    transactionSpy.mockRestore();
  });
});

describe('updateTemplateItem', () => {
  it('updates note without reordering when position is omitted', async () => {
    const template = makeTemplate();
    const currentItem = makeTemplateItem({ note: null, templateId: template.id });
    const updatedRow = makeTemplateItem({
      note: 'Pause reps',
      templateId: template.id,
    });
    queueSelectResults([template], [currentItem]);
    queueUpdateResults([updatedRow]);

    const updated = await updateTemplateItem(
      template.id,
      currentItem.id,
      template.ownerId,
      {
        note: 'Pause reps',
      },
    );

    expect(updated).toEqual(updatedRow);
    expect(mockDbState.transactionCalls).toBe(1);
    expect(mockDbState.updateCalls[0]?.table).toBe('template_items');
    expect(mockDbState.updateCalls[0]?.values).toEqual({ note: 'Pause reps' });
    expectAndCondition(mockDbState.updateCalls[0]?.condition, [
      {
        column: 'templateItems.id',
        type: 'eq',
        value: currentItem.id,
      },
      {
        column: 'templateItems.templateId',
        type: 'eq',
        value: template.id,
      },
    ]);
  });

  it('moves an item to a new position and renumbers the full sequence', async () => {
    const template = makeTemplate();
    const existingItems = [
      makeTemplateItem({ id: 'item-1', sortOrder: 0, templateId: template.id }),
      makeTemplateItem({
        exerciseId: 'ex-2',
        id: 'item-2',
        sortOrder: 1,
        templateId: template.id,
      }),
      makeTemplateItem({
        exerciseId: 'ex-3',
        id: 'item-3',
        sortOrder: 2,
        templateId: template.id,
      }),
    ];
    queueSelectResults([template], existingItems);
    queueUpdateResults(
      [
        makeTemplateItem({
          exerciseId: 'ex-2',
          id: 'item-2',
          sortOrder: -1,
          templateId: template.id,
        }),
      ],
      [
        makeTemplateItem({
          exerciseId: 'ex-3',
          id: 'item-3',
          sortOrder: -2,
          templateId: template.id,
        }),
      ],
      [
        makeTemplateItem({
          id: 'item-1',
          note: 'Drop set finisher',
          sortOrder: -3,
          templateId: template.id,
        }),
      ],
      [
        makeTemplateItem({
          exerciseId: 'ex-2',
          id: 'item-2',
          sortOrder: 0,
          templateId: template.id,
        }),
      ],
      [
        makeTemplateItem({
          exerciseId: 'ex-3',
          id: 'item-3',
          sortOrder: 1,
          templateId: template.id,
        }),
      ],
      [
        makeTemplateItem({
          id: 'item-1',
          note: 'Drop set finisher',
          sortOrder: 2,
          templateId: template.id,
        }),
      ],
    );

    const updated = await updateTemplateItem(
      template.id,
      'item-1',
      template.ownerId,
      {
        note: 'Drop set finisher',
        position: 2,
      },
    );

    expect(updated).toEqual(
      makeTemplateItem({
        id: 'item-1',
        note: 'Drop set finisher',
        sortOrder: 2,
        templateId: template.id,
      }),
    );
    expectTemplateItemSelect(template.id);
    expect(
      mockDbState.updateCalls.map((call) => [
        call.condition,
        call.values.sortOrder,
      ]),
    ).toEqual([
      [{ column: 'templateItems.id', type: 'eq', value: 'item-2' }, -1],
      [{ column: 'templateItems.id', type: 'eq', value: 'item-3' }, -2],
      [{ column: 'templateItems.id', type: 'eq', value: 'item-1' }, -3],
      [{ column: 'templateItems.id', type: 'eq', value: 'item-2' }, 0],
      [{ column: 'templateItems.id', type: 'eq', value: 'item-3' }, 1],
      [{ column: 'templateItems.id', type: 'eq', value: 'item-1' }, 2],
    ]);
  });

  it('rejects an out-of-range move position', async () => {
    const template = makeTemplate();
    const currentItem = makeTemplateItem({ templateId: template.id });
    queueSelectResults([template], [currentItem]);

    await expect(
      updateTemplateItem(template.id, currentItem.id, template.ownerId, {
        position: 1,
      }),
    ).rejects.toThrow(new ApiError(400, 'Position out of range'));

    expect(mockDbState.updateCalls).toHaveLength(0);
  });

  it('throws 404 when the item does not exist in the template sequence', async () => {
    const template = makeTemplate();
    queueSelectResults([template], [makeTemplateItem({ id: 'other-item' })]);

    await expect(
      updateTemplateItem(template.id, 'missing-item', template.ownerId, {
        position: 0,
      }),
    ).rejects.toThrow(new ApiError(404, 'Template item not found'));
  });
});

describe('deleteTemplateItem', () => {
  it('deletes an item in the middle and compacts remaining sort orders', async () => {
    const template = makeTemplate();
    queueSelectResults([
      template,
    ], [
      makeTemplateItem({ id: 'item-1', sortOrder: 0, templateId: template.id }),
      makeTemplateItem({
        exerciseId: 'ex-2',
        id: 'item-2',
        sortOrder: 1,
        templateId: template.id,
      }),
      makeTemplateItem({
        exerciseId: 'ex-3',
        id: 'item-3',
        sortOrder: 2,
        templateId: template.id,
      }),
    ]);
    queueDeleteResults([{ id: 'item-2' }]);
    queueUpdateResults(
      [makeTemplateItem({ id: 'item-1', sortOrder: -1, templateId: template.id })],
      [
        makeTemplateItem({
          exerciseId: 'ex-3',
          id: 'item-3',
          sortOrder: -2,
          templateId: template.id,
        }),
      ],
      [makeTemplateItem({ id: 'item-1', sortOrder: 0, templateId: template.id })],
      [
        makeTemplateItem({
          exerciseId: 'ex-3',
          id: 'item-3',
          sortOrder: 1,
          templateId: template.id,
        }),
      ],
    );

    await deleteTemplateItem(template.id, 'item-2', template.ownerId);

    expectTemplateItemSelect(template.id);
    expect(mockDbState.deleteCalls[0]?.table).toBe('template_items');
    expectAndCondition(mockDbState.deleteCalls[0]?.condition, [
      {
        column: 'templateItems.id',
        type: 'eq',
        value: 'item-2',
      },
      {
        column: 'templateItems.templateId',
        type: 'eq',
        value: template.id,
      },
    ]);
    expect(
      mockDbState.updateCalls.map((call) => [
        call.condition,
        call.values.sortOrder,
      ]),
    ).toEqual([
      [{ column: 'templateItems.id', type: 'eq', value: 'item-1' }, -1],
      [{ column: 'templateItems.id', type: 'eq', value: 'item-3' }, -2],
      [{ column: 'templateItems.id', type: 'eq', value: 'item-1' }, 0],
      [{ column: 'templateItems.id', type: 'eq', value: 'item-3' }, 1],
    ]);
  });

  it('deletes the last item without triggering a reorder pass', async () => {
    const template = makeTemplate();
    const currentItem = makeTemplateItem({ templateId: template.id });
    queueSelectResults([template], [currentItem]);
    queueDeleteResults([{ id: currentItem.id }]);

    await deleteTemplateItem(template.id, currentItem.id, template.ownerId);

    expect(mockDbState.transactionCalls).toBe(1);
    expectTemplateItemSelect(template.id);
    expect(mockDbState.deleteCalls[0]?.table).toBe('template_items');
    expectAndCondition(mockDbState.deleteCalls[0]?.condition, [
      {
        column: 'templateItems.id',
        type: 'eq',
        value: currentItem.id,
      },
      {
        column: 'templateItems.templateId',
        type: 'eq',
        value: template.id,
      },
    ]);
    expect(mockDbState.updateCalls).toHaveLength(0);
  });

  it('throws 404 when the item does not exist', async () => {
    const template = makeTemplate();
    queueSelectResults([template], [makeTemplateItem({ id: 'other-item' })]);

    await expect(
      deleteTemplateItem(template.id, 'missing-item', template.ownerId),
    ).rejects.toThrow(new ApiError(404, 'Template item not found'));
  });
});
