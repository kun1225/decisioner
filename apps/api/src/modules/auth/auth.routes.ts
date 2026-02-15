import { Router } from 'express';

import { requireAuth } from '@/middleware/require-auth.js';

import { login, logout, me, refresh, register } from './auth.controller.js';

const router: Router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export { router as authRoutes };
