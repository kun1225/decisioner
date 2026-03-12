import {
  and,
  asc,
  db,
  eq,
  exercises,
  isNull,
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
  'select' | 'insert' | 'update' | 'delete'
>;
type TemplateItemRecord = Awaited<ReturnType<typeof listTemplateItems>>[number];

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

function invalidPositionError() {
  return new ApiError(400, 'Position out of range');
}

function isUniqueConstraintError(error: unknown) {
  const directCode =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
      ? error.code
      : undefined;
  const causeCode =
    typeof error === 'object' &&
    error !== null &&
    'cause' in error &&
    typeof error.cause === 'object' &&
    error.cause !== null &&
    'code' in error.cause &&
    typeof error.cause.code === 'string'
      ? error.cause.code
      : undefined;

  return directCode === '23505' || causeCode === '23505';
}

async function runTemplateItemTransaction<T>(
  callback: (tx: DatabaseClient) => Promise<T>,
) {
  try {
    return await db.transaction((tx) => callback(tx));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ApiError(409, 'Template item ordering conflict');
    }

    throw error;
  }
}

function resolveInsertPosition(
  position: number | undefined,
  itemCount: number,
) {
  if (position === undefined) {
    return itemCount;
  }

  if (position < 0 || position > itemCount) {
    throw invalidPositionError();
  }

  return position;
}

function resolveMovePosition(position: number | undefined, itemCount: number) {
  if (position === undefined) {
    return undefined;
  }

  if (position < 0 || position >= itemCount) {
    throw invalidPositionError();
  }

  return position;
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
  for (const [index, item] of items.entries()) {
    await database
      .update(templateItems)
      .set({ sortOrder: -(index + 1) })
      .where(eq(templateItems.id, item.id))
      .returning();
  }

  const updatedItems: TemplateItemRecord[] = [];

  for (const [index, item] of items.entries()) {
    const [updatedItem] = await database
      .update(templateItems)
      .set({
        sortOrder: index,
        note: item.note,
      })
      .where(eq(templateItems.id, item.id))
      .returning();

    if (updatedItem) {
      updatedItems.push(updatedItem);
    }
  }

  return updatedItems;
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
    const insertPosition = resolveInsertPosition(
      input.position,
      existingItems.length,
    );
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
    const nextPosition = resolveMovePosition(
      input.position,
      existingItems.length,
    );
    const nextNote =
      input.note === undefined ? (currentItem.note ?? null) : input.note;

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
