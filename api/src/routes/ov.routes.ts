import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/auth';
import * as ovController from '../controllers/ov.controller';

const router = Router();

router.use(authenticate);

router.get('/', ovController.getAll);
router.get('/:id', ovController.getById);
router.post('/', isAdmin, ovController.create);
router.post('/desde-oc/:ocId', isAdmin, ovController.createFromOC);
router.patch('/:id', isAdmin, ovController.update);
router.post('/:id/cambiar-estado', isAdmin, ovController.changeEstado);

export default router;
