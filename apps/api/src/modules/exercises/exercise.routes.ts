import { Router } from 'express';

import { requireAuth } from '@/middleware/require-auth.js';

import { createCustom, getDetail, listPreset } from './exercise.controller.js';

const router: Router = Router();

router.use(requireAuth);

router.get('/preset', listPreset);
router.post('/custom', createCustom);
router.get('/:exerciseId', getDetail);

export { router as exerciseRoutes };
