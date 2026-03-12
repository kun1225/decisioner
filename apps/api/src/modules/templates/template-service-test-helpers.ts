export type TemplateRecord = {
  createdAt: Date;
  deletedAt: Date | null;
  description: string | null;
  id: string;
  name: string;
  ownerId: string;
};

export type TemplateItemRecord = {
  exerciseId: string;
  id: string;
  note: string | null;
  sortOrder: number;
  templateId: string;
};

export type ExerciseRecord = {
  deletedAt: Date | null;
  id: string;
  ownerId: string | null;
  source: 'PRESET' | 'CUSTOM';
};

export function makeTemplate(
  overrides: Partial<TemplateRecord> = {},
): TemplateRecord {
  return {
    createdAt: new Date('2026-03-11T00:00:00.000Z'),
    deletedAt: null,
    description: null,
    id: 'tpl-1',
    name: 'Push Day',
    ownerId: 'user-1',
    ...overrides,
  };
}

export function makeTemplateItem(
  overrides: Partial<TemplateItemRecord> = {},
): TemplateItemRecord {
  return {
    exerciseId: 'ex-1',
    id: 'item-1',
    note: null,
    sortOrder: 0,
    templateId: 'tpl-1',
    ...overrides,
  };
}

export function makeExercise(
  overrides: Partial<ExerciseRecord> = {},
): ExerciseRecord {
  return {
    deletedAt: null,
    id: 'ex-1',
    ownerId: null,
    source: 'PRESET',
    ...overrides,
  };
}
