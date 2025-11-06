import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimiter';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.me);

export default router;
