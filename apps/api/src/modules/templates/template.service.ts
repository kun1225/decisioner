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

  const items = await db
    .select()
    .from(templateItems)
    .where(eq(templateItems.templateId, templateId))
    .orderBy(asc(templateItems.sortOrder));

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

  const [created] = await db
    .insert(templateItems)
    .values({
      templateId,
      exerciseId: input.exerciseId,
      sortOrder: input.sortOrder,
      note: input.note,
    })
    .returning();

  return created!;
}

export async function updateTemplateItem(
  templateId: string,
  itemId: string,
  userId: string,
  input: UpdateTemplateItemInput,
) {
  const template = await findTemplateOrFail(templateId);
  verifyOwner(template, userId);

  const [updated] = await db
    .update(templateItems)
    .set(input)
    .where(
      and(
        eq(templateItems.id, itemId),
        eq(templateItems.templateId, templateId),
      ),
    )
    .returning();

  if (!updated) {
    throw new ApiError(404, 'Template item not found');
  }

  return updated;
}

export async function deleteTemplateItem(
  templateId: string,
  itemId: string,
  userId: string,
) {
  const template = await findTemplateOrFail(templateId);
  verifyOwner(template, userId);

  const deletedItems = await db
    .delete(templateItems)
    .where(
      and(
        eq(templateItems.id, itemId),
        eq(templateItems.templateId, templateId),
      ),
    )
    .returning({ id: templateItems.id });

  if (deletedItems.length === 0) {
    throw new ApiError(404, 'Template item not found');
  }
}
