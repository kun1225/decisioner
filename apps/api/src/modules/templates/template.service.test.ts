import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/utils/api-error.js';

let selectResult: unknown[] = [];
let insertResult: unknown[] = [];
let updateResult: unknown[] = [];

vi.mock('@repo/database/index', () => ({
  db: {
    select: () => ({
      from: (table: { _name?: string }) => ({
        where: () => selectResult,
        orderBy: () => selectResult,
        ...(table?._name === 'template_items'
          ? { orderBy: () => selectResult }
          : {}),
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: () => insertResult,
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => updateResult,
        }),
      }),
    }),
    delete: () => ({
      where: () => ({}),
    }),
  },
  eq: vi.fn((_col, val) => val),
  and: vi.fn((...conditions: unknown[]) => conditions),
  isNull: vi.fn(() => 'IS_NULL'),
  asc: vi.fn(() => 'ASC'),
  templates: {
    id: 'templates.id',
    ownerId: 'templates.ownerId',
    name: 'templates.name',
    description: 'templates.description',
    deletedAt: 'templates.deletedAt',
    _name: 'templates',
  },
  templateItems: {
    id: 'templateItems.id',
    templateId: 'templateItems.templateId',
    exerciseId: 'templateItems.exerciseId',
    sortOrder: 'templateItems.sortOrder',
    note: 'templateItems.note',
    _name: 'template_items',
  },
  exercises: {
    id: 'exercises.id',
    ownerId: 'exercises.ownerId',
    source: 'exercises.source',
    deletedAt: 'exercises.deletedAt',
  },
}));

const {
  createTemplate,
  listOwnTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  addTemplateItem,
  updateTemplateItem,
  deleteTemplateItem,
} = await import('./template.service.js');

beforeEach(() => {
  selectResult = [];
  insertResult = [];
  updateResult = [];
});

// ============================================================
// createTemplate
// ============================================================
describe('createTemplate', () => {
  it('should create a template with name and description', async () => {
    const created = {
      id: 'tpl-1',
      ownerId: 'user-1',
      name: 'Push Day',
      description: 'Chest and triceps',
      createdAt: new Date(),
      deletedAt: null,
    };
    insertResult = [created];

    const result = await createTemplate('user-1', {
      name: 'Push Day',
      description: 'Chest and triceps',
    });

    expect(result).toEqual(created);
  });

  it('should create a template without description', async () => {
    const created = {
      id: 'tpl-2',
      ownerId: 'user-1',
      name: 'Leg Day',
      createdAt: new Date(),
      deletedAt: null,
    };
    insertResult = [created];

    const result = await createTemplate('user-1', { name: 'Leg Day' });

    expect(result).toEqual(created);
  });
});

// ============================================================
// listOwnTemplates
// ============================================================
describe('listOwnTemplates', () => {
  it('should return own templates', async () => {
    const mockTemplates = [
      { id: 'tpl-1', ownerId: 'user-1', name: 'Push Day' },
      { id: 'tpl-2', ownerId: 'user-1', name: 'Pull Day' },
    ];
    selectResult = mockTemplates;

    const result = await listOwnTemplates('user-1');

    expect(result).toEqual(mockTemplates);
  });

  it('should return empty array when no templates', async () => {
    selectResult = [];

    const result = await listOwnTemplates('user-1');

    expect(result).toEqual([]);
  });
});

// ============================================================
// getTemplateById
// ============================================================
describe('getTemplateById', () => {
  it('should return template with items sorted by sortOrder', async () => {
    const template = {
      id: 'tpl-1',
      ownerId: 'user-1',
      name: 'Push Day',
      deletedAt: null,
    };
    const items = [
      { id: 'item-1', sortOrder: 0, exerciseId: 'ex-1' },
      { id: 'item-2', sortOrder: 1, exerciseId: 'ex-2' },
    ];

    const dbMock = await import('@repo/database/index');
    let selectCallCount = 0;
    vi.spyOn(dbMock.db, 'select').mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return {
          from: () => ({
            where: () => [template],
          }),
        } as never;
      }
      return {
        from: () => ({
          where: () => ({
            orderBy: () => items,
          }),
        }),
      } as never;
    });

    const result = await getTemplateById('tpl-1', 'user-1');

    expect(result).toEqual({ ...template, items });

    vi.mocked(dbMock.db.select).mockRestore();
  });

  it('should throw 404 when template not found', async () => {
    selectResult = [];

    await expect(getTemplateById('non-existent', 'user-1')).rejects.toThrow(
      new ApiError(404, 'Template not found'),
    );
  });

  it('should throw 403 when user is not the owner', async () => {
    const template = {
      id: 'tpl-1',
      ownerId: 'user-2',
      name: 'Push Day',
      deletedAt: null,
    };
    selectResult = [template];

    await expect(getTemplateById('tpl-1', 'user-1')).rejects.toThrow(
      new ApiError(403, 'Forbidden'),
    );
  });
});

// ============================================================
// updateTemplate
// ============================================================
describe('updateTemplate', () => {
  it('should update template name', async () => {
    const template = {
      id: 'tpl-1',
      ownerId: 'user-1',
      name: 'Push Day',
      deletedAt: null,
    };
    const updated = { ...template, name: 'Push Day v2' };
    selectResult = [template];
    updateResult = [updated];

    const result = await updateTemplate('tpl-1', 'user-1', {
      name: 'Push Day v2',
    });

    expect(result).toEqual(updated);
  });

  it('should throw 404 when template not found', async () => {
    selectResult = [];

    await expect(
      updateTemplate('non-existent', 'user-1', { name: 'New Name' }),
    ).rejects.toThrow(new ApiError(404, 'Template not found'));
  });
});

// ============================================================
// deleteTemplate
// ============================================================
describe('deleteTemplate', () => {
  it('should soft delete a template', async () => {
    const template = {
      id: 'tpl-1',
      ownerId: 'user-1',
      name: 'Push Day',
      deletedAt: null,
    };
    selectResult = [template];
    updateResult = [{ ...template, deletedAt: new Date() }];

    await expect(
      deleteTemplate('tpl-1', 'user-1'),
    ).resolves.toBeUndefined();
  });

  it('should throw 404 when template not found', async () => {
    selectResult = [];

    await expect(deleteTemplate('non-existent', 'user-1')).rejects.toThrow(
      new ApiError(404, 'Template not found'),
    );
  });

  it('should throw 403 when user is not the owner', async () => {
    const template = {
      id: 'tpl-1',
      ownerId: 'user-2',
      name: 'Push Day',
      deletedAt: null,
    };
    selectResult = [template];

    await expect(deleteTemplate('tpl-1', 'user-1')).rejects.toThrow(
      new ApiError(403, 'Forbidden'),
    );
  });
});

// ============================================================
// addTemplateItem
// ============================================================
describe('addTemplateItem', () => {
  it('should add an item to template', async () => {
    const template = {
      id: 'tpl-1',
      ownerId: 'user-1',
      name: 'Push Day',
      deletedAt: null,
    };
    const exercise = {
      id: 'ex-1',
      source: 'PRESET',
      ownerId: null,
      deletedAt: null,
    };
    const createdItem = {
      id: 'item-1',
      templateId: 'tpl-1',
      exerciseId: 'ex-1',
      sortOrder: 0,
      note: null,
    };

    const dbMock = await import('@repo/database/index');
    let selectCallCount = 0;
    vi.spyOn(dbMock.db, 'select').mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return {
          from: () => ({
            where: () => [template],
          }),
        } as never;
      }
      return {
        from: () => ({
          where: () => [exercise],
        }),
      } as never;
    });
    insertResult = [createdItem];

    const result = await addTemplateItem('tpl-1', 'user-1', {
      exerciseId: 'ex-1',
      sortOrder: 0,
    });

    expect(result).toEqual(createdItem);

    vi.mocked(dbMock.db.select).mockRestore();
  });

  it('should add an item with note', async () => {
    const template = {
      id: 'tpl-1',
      ownerId: 'user-1',
      name: 'Push Day',
      deletedAt: null,
    };
    const exercise = {
      id: 'ex-1',
      source: 'CUSTOM',
      ownerId: 'user-1',
      deletedAt: null,
    };
    const createdItem = {
      id: 'item-2',
      templateId: 'tpl-1',
      exerciseId: 'ex-1',
      sortOrder: 1,
      note: 'Go heavy',
    };

    const dbMock = await import('@repo/database/index');
    let selectCallCount = 0;
    vi.spyOn(dbMock.db, 'select').mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return {
          from: () => ({
            where: () => [template],
          }),
        } as never;
      }
      return {
        from: () => ({
          where: () => [exercise],
        }),
      } as never;
    });
    insertResult = [createdItem];

    const result = await addTemplateItem('tpl-1', 'user-1', {
      exerciseId: 'ex-1',
      sortOrder: 1,
      note: 'Go heavy',
    });

    expect(result).toEqual(createdItem);

    vi.mocked(dbMock.db.select).mockRestore();
  });

  it('should throw 404 when template not found', async () => {
    selectResult = [];

    await expect(
      addTemplateItem('non-existent', 'user-1', {
        exerciseId: 'ex-1',
        sortOrder: 0,
      }),
    ).rejects.toThrow(new ApiError(404, 'Template not found'));
  });

  it('should throw 400 when exercise is not accessible', async () => {
    const template = {
      id: 'tpl-1',
      ownerId: 'user-1',
      name: 'Push Day',
      deletedAt: null,
    };

    const dbMock = await import('@repo/database/index');
    let selectCallCount = 0;
    vi.spyOn(dbMock.db, 'select').mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return {
          from: () => ({
            where: () => [template],
          }),
        } as never;
      }
      // Exercise not found
      return {
        from: () => ({
          where: () => [],
        }),
      } as never;
    });

    await expect(
      addTemplateItem('tpl-1', 'user-1', {
        exerciseId: 'ex-999',
        sortOrder: 0,
      }),
    ).rejects.toThrow(new ApiError(400, 'Exercise not accessible'));

    vi.mocked(dbMock.db.select).mockRestore();
  });
});

// ============================================================
// updateTemplateItem
// ============================================================
describe('updateTemplateItem', () => {
  it('should update an item sortOrder', async () => {
    const template = {
      id: 'tpl-1',
      ownerId: 'user-1',
      name: 'Push Day',
      deletedAt: null,
    };
    const updatedItem = {
      id: 'item-1',
      templateId: 'tpl-1',
      sortOrder: 2,
      note: null,
    };
    selectResult = [template];
    updateResult = [updatedItem];

    const result = await updateTemplateItem('tpl-1', 'item-1', 'user-1', {
      sortOrder: 2,
    });

    expect(result).toEqual(updatedItem);
  });

  it('should throw 404 when template not found', async () => {
    selectResult = [];

    await expect(
      updateTemplateItem('non-existent', 'item-1', 'user-1', { sortOrder: 2 }),
    ).rejects.toThrow(new ApiError(404, 'Template not found'));
  });

  it('should throw 404 when item not found', async () => {
    const template = {
      id: 'tpl-1',
      ownerId: 'user-1',
      name: 'Push Day',
      deletedAt: null,
    };
    selectResult = [template];
    updateResult = [];

    await expect(
      updateTemplateItem('tpl-1', 'non-existent', 'user-1', { sortOrder: 2 }),
    ).rejects.toThrow(new ApiError(404, 'Template item not found'));
  });
});

// ============================================================
// deleteTemplateItem
// ============================================================
describe('deleteTemplateItem', () => {
  it('should delete an item', async () => {
    const template = {
      id: 'tpl-1',
      ownerId: 'user-1',
      name: 'Push Day',
      deletedAt: null,
    };
    selectResult = [template];

    const dbMock = await import('@repo/database/index');
    const deleteSpy = vi.spyOn(dbMock.db, 'delete').mockImplementation(
      () =>
        ({
          where: () => ({ rowCount: 1 }),
        }) as never,
    );

    await expect(
      deleteTemplateItem('tpl-1', 'item-1', 'user-1'),
    ).resolves.toBeUndefined();

    deleteSpy.mockRestore();
  });

  it('should throw 404 when template not found', async () => {
    selectResult = [];

    await expect(
      deleteTemplateItem('non-existent', 'item-1', 'user-1'),
    ).rejects.toThrow(new ApiError(404, 'Template not found'));
  });

  it('should throw 404 when item not found', async () => {
    const template = {
      id: 'tpl-1',
      ownerId: 'user-1',
      name: 'Push Day',
      deletedAt: null,
    };
    selectResult = [template];

    const dbMock = await import('@repo/database/index');
    vi.spyOn(dbMock.db, 'delete').mockImplementation(
      () =>
        ({
          where: () => ({ rowCount: 0 }),
        }) as never,
    );

    await expect(
      deleteTemplateItem('tpl-1', 'non-existent', 'user-1'),
    ).rejects.toThrow(new ApiError(404, 'Template item not found'));

    vi.mocked(dbMock.db.delete).mockRestore();
  });
});
