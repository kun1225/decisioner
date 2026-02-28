import { Router } from 'express';

import { requireAuth } from '@/middleware/require-auth.js';

import {
  addItem,
  create,
  getDetail,
  list,
  remove,
  removeItem,
  update,
  updateItem,
} from './template.controller.js';

const router: Router = Router();

router.use(requireAuth);

router.post('/', create);
router.get('/', list);
router.get('/:templateId', getDetail);
router.patch('/:templateId', update);
router.delete('/:templateId', remove);
router.post('/:templateId/items', addItem);
router.patch('/:templateId/items/:itemId', updateItem);
router.delete('/:templateId/items/:itemId', removeItem);

export { router as templateRoutes };
