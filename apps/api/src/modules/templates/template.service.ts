import {
  and,
  asc,
  db,
  eq,
  exercises,
  isNull,
  sql,
  templateItems,
  templates,
} from '@repo/database/index';
import type {
  AddTemplateItemInput,
  CreateTemplateInput,
  UpdateTemplateInput,
  UpdateTemplateItemInput,
} from '@repo/shared/templates';

import { ApiError } from '@/utils/api-error.js';

type DatabaseClient = Pick<
  typeof db,
  'select' | 'insert' | 'update' | 'delete' | 'execute'
>;
type TemplateItemRecord = Awaited<ReturnType<typeof listTemplateItems>>[number];
const TEMPLATE_ITEM_ORDER_CONSTRAINT =
  'template_items_template_id_sort_order_unique';

async function findTemplateOrFail(templateId: string) {
  const [template] = await db
    .select()
    .from(templates)
    .where(and(eq(templates.id, templateId), isNull(templates.deletedAt)));

  if (!template) {
    throw new ApiError(404, 'Template not found');
  }

  return template;
}

function verifyOwner(template: { ownerId: string }, userId: string) {
  if (template.ownerId !== userId) {
    throw new ApiError(403, 'Forbidden');
  }
}

function getErrorConstraint(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  if ('constraint' in error && typeof error.constraint === 'string') {
    return error.constraint;
  }

  if ('cause' in error) {
    return getErrorConstraint(error.cause);
  }

  return undefined;
}

function isTemplateItemOrderingConflict(error: unknown) {
  return getErrorConstraint(error) === TEMPLATE_ITEM_ORDER_CONSTRAINT;
}

async function runTemplateItemTransaction<T>(
  callback: (tx: DatabaseClient) => Promise<T>,
) {
  try {
    return await db.transaction((tx) => callback(tx));
  } catch (error) {
    if (isTemplateItemOrderingConflict(error)) {
      throw new ApiError(409, 'Template item ordering conflict');
    }

    throw error;
  }
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) {
    return [...items];
  }

  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);

  if (!item) {
    return nextItems;
  }

  nextItems.splice(toIndex, 0, item);

  return nextItems;
}

async function listTemplateItems(
  templateId: string,
  database: DatabaseClient = db,
) {
  return database
    .select()
    .from(templateItems)
    .where(eq(templateItems.templateId, templateId))
    .orderBy(asc(templateItems.sortOrder));
}

async function persistTemplateItemOrder(
  items: TemplateItemRecord[],
  database: DatabaseClient,
) {
  if (items.length === 0) {
    return [];
  }

  const temporaryOrderValues = sql.join(
    items.map(
      (item, index) =>
        sql`(${item.id}::uuid, ${-(items.length + index + 1)}::integer)`,
    ),
    sql`, `,
  );

  await database.execute(sql`
    UPDATE ${templateItems} AS template_item
    SET sort_order = ordering.sort_order
    FROM (VALUES ${temporaryOrderValues}) AS ordering(id, sort_order)
    WHERE template_item.id = ordering.id
  `);

  const finalOrderValues = sql.join(
    items.map(
      (item, index) => sql`(${item.id}::uuid, ${index}::integer, ${item.note})`,
    ),
    sql`, `,
  );

  await database.execute(sql`
    UPDATE ${templateItems} AS template_item
    SET
      sort_order = ordering.sort_order,
      note = ordering.note
    FROM (VALUES ${finalOrderValues}) AS ordering(id, sort_order, note)
    WHERE template_item.id = ordering.id
  `);

  return items.map((item, index) => ({
    ...item,
    note: item.note ?? null,
    sortOrder: index,
  }));
}

async function verifyExerciseAccessible(exerciseId: string, userId: string) {
  const [exercise] = await db
    .select()
    .from(exercises)
    .where(and(eq(exercises.id, exerciseId), isNull(exercises.deletedAt)));

  if (!exercise) {
    throw new ApiError(400, 'Exercise not accessible');
  }

  if (exercise.source !== 'PRESET' && exercise.ownerId !== userId) {
    throw new ApiError(400, 'Exercise not accessible');
  }
}

export async function createTemplate(
  ownerId: string,
  input: CreateTemplateInput,
) {
  const [created] = await db
    .insert(templates)
    .values({
      ownerId,
      name: input.name,
      description: input.description,
    })
    .returning();

  return created!;
}

export async function listOwnTemplates(ownerId: string) {
  return db
    .select()
    .from(templates)
    .where(and(eq(templates.ownerId, ownerId), isNull(templates.deletedAt)));
}

export async function getTemplateById(templateId: string, userId: string) {
  const template = await findTemplateOrFail(templateId);
  verifyOwner(template, userId);

  const items = await listTemplateItems(templateId);

  return { ...template, items };
}

export async function updateTemplate(
  templateId: string,
  userId: string,
  input: UpdateTemplateInput,
) {
  const template = await findTemplateOrFail(templateId);
  verifyOwner(template, userId);

  const [updated] = await db
    .update(templates)
    .set(input)
    .where(eq(templates.id, templateId))
    .returning();

  return updated!;
}

export async function deleteTemplate(templateId: string, userId: string) {
  const template = await findTemplateOrFail(templateId);
  verifyOwner(template, userId);

  await db
    .update(templates)
    .set({ deletedAt: new Date() })
    .where(eq(templates.id, templateId))
    .returning();
}

export async function addTemplateItem(
  templateId: string,
  userId: string,
  input: AddTemplateItemInput,
) {
  const template = await findTemplateOrFail(templateId);
  verifyOwner(template, userId);

  await verifyExerciseAccessible(input.exerciseId, userId);

  return runTemplateItemTransaction(async (tx) => {
    const existingItems = await listTemplateItems(templateId, tx);
    const insertPosition = input.position ?? existingItems.length;

    if (insertPosition < 0 || insertPosition > existingItems.length) {
      throw new ApiError(400, 'Position out of range');
    }

    const temporarySortOrder = -(existingItems.length + 1);
    const [created] = await tx
      .insert(templateItems)
      .values({
        templateId,
        exerciseId: input.exerciseId,
        sortOrder: temporarySortOrder,
        note: input.note,
      })
      .returning();

    const reorderedItems = [
      ...existingItems.slice(0, insertPosition),
      created!,
      ...existingItems.slice(insertPosition),
    ];
    const updatedItems = await persistTemplateItemOrder(reorderedItems, tx);

    return updatedItems.find((item) => item.id === created!.id)!;
  });
}

export async function updateTemplateItem(
  templateId: string,
  itemId: string,
  userId: string,
  input: UpdateTemplateItemInput,
) {
  const template = await findTemplateOrFail(templateId);
  verifyOwner(template, userId);

  return runTemplateItemTransaction(async (tx) => {
    const existingItems = await listTemplateItems(templateId, tx);
    const currentIndex = existingItems.findIndex((item) => item.id === itemId);

    if (currentIndex === -1) {
      throw new ApiError(404, 'Template item not found');
    }

    const currentItem = existingItems[currentIndex]!;
    const nextPosition = input.position;
    const nextNote =
      input.note === undefined ? (currentItem.note ?? null) : input.note;

    if (
      nextPosition !== undefined &&
      (nextPosition < 0 || nextPosition >= existingItems.length)
    ) {
      throw new ApiError(400, 'Position out of range');
    }

    if (nextPosition === undefined || nextPosition === currentIndex) {
      const [updatedItem] = await tx
        .update(templateItems)
        .set({ note: nextNote })
        .where(
          and(
            eq(templateItems.id, itemId),
            eq(templateItems.templateId, templateId),
          ),
        )
        .returning();

      if (!updatedItem) {
        throw new ApiError(404, 'Template item not found');
      }

      return updatedItem;
    }

    const reorderedItems = moveItem(
      existingItems.map((item, index) =>
        index === currentIndex
          ? {
              ...item,
              note: nextNote,
            }
          : item,
      ),
      currentIndex,
      nextPosition,
    );
    const updatedItems = await persistTemplateItemOrder(reorderedItems, tx);

    return updatedItems.find((item) => item.id === itemId)!;
  });
}

export async function deleteTemplateItem(
  templateId: string,
  itemId: string,
  userId: string,
) {
  const template = await findTemplateOrFail(templateId);
  verifyOwner(template, userId);

  await runTemplateItemTransaction(async (tx) => {
    const existingItems = await listTemplateItems(templateId, tx);
    const deletedItem = existingItems.find((item) => item.id === itemId);

    if (!deletedItem) {
      throw new ApiError(404, 'Template item not found');
    }

    await tx
      .delete(templateItems)
      .where(
        and(
          eq(templateItems.id, itemId),
          eq(templateItems.templateId, templateId),
        ),
      )
      .returning({ id: templateItems.id });

    const remainingItems = existingItems.filter((item) => item.id !== itemId);

    if (remainingItems.length === 0) {
      return;
    }

    await persistTemplateItemOrder(remainingItems, tx);
  });
}
