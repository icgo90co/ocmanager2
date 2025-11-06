import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/auth';
import * as auditController from '../controllers/audit.controller';

const router = Router();

router.use(authenticate);
router.use(isAdmin);

router.get('/', auditController.getAll);

export default router;
