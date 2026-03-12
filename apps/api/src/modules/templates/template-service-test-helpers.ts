type TemplateRecord = {
  createdAt: Date;
  deletedAt: Date | null;
  description: string | null;
  id: string;
  name: string;
  ownerId: string;
};

type TemplateItemRecord = {
  exerciseId: string;
  id: string;
  note: string | null;
  sortOrder: number;
  templateId: string;
};

type ExerciseRecord = {
  deletedAt: Date | null;
  id: string;
  ownerId: string | null;
  source: 'PRESET' | 'CUSTOM';
};

type Condition =
  | { type: 'eq'; column: string; value: unknown }
  | { type: 'and'; conditions: Condition[] }
  | { type: 'is-null'; column: string };

type Order = { type: 'asc'; column: string };
type TableName = 'templates' | 'template_items' | 'exercises';
type MockRow = Record<string, unknown>;
type OrderedRows = MockRow[] & { orderBy: (order: Order) => MockRow[] };

type MockDb = {
  delete: (table: { _name?: string }) => {
    where: (condition?: Condition) => {
      returning: () => MockRow[];
    };
  };
  insert: (table: { _name?: string }) => {
    values: (values: MockRow | MockRow[]) => {
      returning: () => MockRow[];
    };
  };
  select: () => {
    from: (table: { _name?: string }) => {
      where: (condition?: Condition) => OrderedRows;
    };
  };
  transaction: <T>(callback: (tx: MockDb) => Promise<T>) => Promise<T>;
  update: (table: { _name?: string }) => {
    set: (values: MockRow) => {
      where: (condition?: Condition) => {
        returning: () => MockRow[];
      };
    };
  };
};

type MockDbState = {
  deleteCalls: Array<{
    condition?: Condition;
    table: TableName;
  }>;
  deleteResults: MockRow[][];
  insertCalls: Array<{
    table: TableName;
    values: MockRow | MockRow[];
  }>;
  insertResults: MockRow[][];
  orderByCalls: Array<{
    order: Order;
    table: TableName;
  }>;
  selectCalls: Array<{
    condition?: Condition;
    table: TableName;
  }>;
  selectResults: MockRow[][];
  transactionCalls: number;
  updateCalls: Array<{
    condition?: Condition;
    table: TableName;
    values: MockRow;
  }>;
  updateResults: MockRow[][];
};

export type {
  Condition,
  ExerciseRecord,
  MockDbState,
  MockRow,
  Order,
  TableName,
  TemplateItemRecord,
  TemplateRecord,
};

function cloneRows<T extends MockRow>(rows: T[]): T[] {
  return structuredClone(rows);
}

function getFieldName(column: string) {
  return column.split('.').at(-1)!;
}

function matchesCondition(row: MockRow, condition?: Condition): boolean {
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

function dequeueResults(queue: MockRow[][], operation: string) {
  const rows = queue.shift();

  if (!rows) {
    throw new Error(`Missing mock result for ${operation}`);
  }

  return cloneRows(rows);
}

function sortRows(rows: MockRow[], order: Order) {
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

function createWhereResult(
  rows: MockRow[],
  table: TableName,
  state: MockDbState,
): OrderedRows {
  const result = cloneRows(rows) as OrderedRows;

  result.orderBy = (order: Order) => {
    state.orderByCalls.push({ order, table });
    return sortRows(rows, order);
  };

  return result;
}

function createMockDbState(): MockDbState {
  return {
    deleteCalls: [],
    deleteResults: [],
    insertCalls: [],
    insertResults: [],
    orderByCalls: [],
    selectCalls: [],
    selectResults: [],
    transactionCalls: 0,
    updateCalls: [],
    updateResults: [],
  };
}

function resetMockDbState(state: MockDbState) {
  state.selectResults = [];
  state.insertResults = [];
  state.updateResults = [];
  state.deleteResults = [];
  state.selectCalls = [];
  state.orderByCalls = [];
  state.insertCalls = [];
  state.updateCalls = [];
  state.deleteCalls = [];
  state.transactionCalls = 0;
}

function queueSelectResults(state: MockDbState, ...results: MockRow[][]) {
  state.selectResults.push(...results);
}

function queueInsertResults(state: MockDbState, ...results: MockRow[][]) {
  state.insertResults.push(...results);
}

function queueUpdateResults(state: MockDbState, ...results: MockRow[][]) {
  state.updateResults.push(...results);
}

function queueDeleteResults(state: MockDbState, ...results: MockRow[][]) {
  state.deleteResults.push(...results);
}

function createDatabaseModuleMock(state: MockDbState) {
  const db: MockDb = {
    delete: (table: { _name?: string }) => ({
      where: (condition?: Condition) => {
        state.deleteCalls.push({
          condition,
          table: table._name as TableName,
        });

        return {
          returning: () =>
            dequeueResults(
              state.deleteResults,
              `delete from ${String(table._name)}`,
            ),
        };
      },
    }),
    insert: (table: { _name?: string }) => ({
      values: (values: MockRow | MockRow[]) => {
        state.insertCalls.push({
          table: table._name as TableName,
          values,
        });

        return {
          returning: () =>
            dequeueResults(
              state.insertResults,
              `insert into ${String(table._name)}`,
            ),
        };
      },
    }),
    select: () => ({
      from: (table: { _name?: string }) => ({
        where: (condition?: Condition) => {
          state.selectCalls.push({
            condition,
            table: table._name as TableName,
          });

          const rows = dequeueResults(
            state.selectResults,
            `select from ${String(table._name)}`,
          );

          return createWhereResult(
            rows.filter((row) => matchesCondition(row, condition)),
            table._name as TableName,
            state,
          );
        },
      }),
    }),
    transaction: async <T>(callback: (tx: MockDb) => Promise<T>) => {
      state.transactionCalls += 1;
      return callback(db);
    },
    update: (table: { _name?: string }) => ({
      set: (values: MockRow) => ({
        where: (condition?: Condition) => {
          state.updateCalls.push({
            condition,
            table: table._name as TableName,
            values,
          });

          return {
            returning: () =>
              dequeueResults(
                state.updateResults,
                `update ${String(table._name)}`,
              ),
          };
        },
      }),
    }),
  };

  return {
    and: (...conditions: Condition[]): Condition => ({
      conditions,
      type: 'and',
    }),
    asc: (column: string): Order => ({
      column,
      type: 'asc',
    }),
    db,
    eq: (column: string, value: unknown): Condition => ({
      column,
      type: 'eq',
      value,
    }),
    exercises: {
      deletedAt: 'exercises.deletedAt',
      id: 'exercises.id',
      ownerId: 'exercises.ownerId',
      source: 'exercises.source',
      _name: 'exercises' satisfies TableName,
    },
    isNull: (column: string): Condition => ({
      column,
      type: 'is-null',
    }),
    templateItems: {
      exerciseId: 'templateItems.exerciseId',
      id: 'templateItems.id',
      note: 'templateItems.note',
      sortOrder: 'templateItems.sortOrder',
      templateId: 'templateItems.templateId',
      _name: 'template_items' satisfies TableName,
    },
    templates: {
      deletedAt: 'templates.deletedAt',
      description: 'templates.description',
      id: 'templates.id',
      name: 'templates.name',
      ownerId: 'templates.ownerId',
      _name: 'templates' satisfies TableName,
    },
  };
}

function makeTemplate(overrides: Partial<TemplateRecord> = {}): TemplateRecord {
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

function makeTemplateItem(
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

function makeExercise(overrides: Partial<ExerciseRecord> = {}): ExerciseRecord {
  return {
    deletedAt: null,
    id: 'ex-1',
    ownerId: null,
    source: 'PRESET',
    ...overrides,
  };
}

export {
  createDatabaseModuleMock,
  createMockDbState,
  makeExercise,
  makeTemplate,
  makeTemplateItem,
  queueDeleteResults,
  queueInsertResults,
  queueSelectResults,
  queueUpdateResults,
  resetMockDbState,
};
