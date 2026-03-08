import type { RequestHandler } from 'express';

import {
  addTemplateItemSchema,
  createTemplateSchema,
  templateIdParamsSchema,
  templateItemIdParamsSchema,
  updateTemplateItemSchema,
  updateTemplateSchema,
} from '@repo/shared/templates';

import {
  addTemplateItem,
  createTemplate,
  deleteTemplate,
  deleteTemplateItem,
  getTemplateById,
  listOwnTemplates,
  updateTemplate,
  updateTemplateItem,
} from './template.service.js';

// POST /api/templates
export const create: RequestHandler = async (req, res) => {
  const input = createTemplateSchema.parse(req.body);
  const template = await createTemplate(req.user!.userId, input);
  res.status(201).json(template);
};

// GET /api/templates
export const list: RequestHandler = async (req, res) => {
  const templates = await listOwnTemplates(req.user!.userId);
  res.json(templates);
};

// GET /api/templates/:templateId
export const getDetail: RequestHandler = async (req, res) => {
  const { templateId } = templateIdParamsSchema.parse(req.params);
  const template = await getTemplateById(templateId, req.user!.userId);
  res.json(template);
};

// PATCH /api/templates/:templateId
export const update: RequestHandler = async (req, res) => {
  const { templateId } = templateIdParamsSchema.parse(req.params);
  const input = updateTemplateSchema.parse(req.body);
  const template = await updateTemplate(templateId, req.user!.userId, input);
  res.json(template);
};

// DELETE /api/templates/:templateId
export const remove: RequestHandler = async (req, res) => {
  const { templateId } = templateIdParamsSchema.parse(req.params);
  await deleteTemplate(templateId, req.user!.userId);
  res.status(204).end();
};

// POST /api/templates/:templateId/items
export const addItem: RequestHandler = async (req, res) => {
  const { templateId } = templateIdParamsSchema.parse(req.params);
  const input = addTemplateItemSchema.parse(req.body);
  const item = await addTemplateItem(templateId, req.user!.userId, input);
  res.status(201).json(item);
};

// PATCH /api/templates/:templateId/items/:itemId
export const updateItem: RequestHandler = async (req, res) => {
  const { templateId, itemId } = templateItemIdParamsSchema.parse(req.params);
  const input = updateTemplateItemSchema.parse(req.body);
  const item = await updateTemplateItem(
    templateId,
    itemId,
    req.user!.userId,
    input,
  );
  res.json(item);
};

// DELETE /api/templates/:templateId/items/:itemId
export const removeItem: RequestHandler = async (req, res) => {
  const { templateId, itemId } = templateItemIdParamsSchema.parse(req.params);
  await deleteTemplateItem(templateId, itemId, req.user!.userId);
  res.status(204).end();
};
