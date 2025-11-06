import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/auth';
import * as productoController from '../controllers/producto.controller';

const router = Router();

router.use(authenticate);

router.get('/', productoController.getAll);
router.get('/:id', productoController.getById);
router.post('/', isAdmin, productoController.create);
router.patch('/:id', isAdmin, productoController.update);
router.delete('/:id', isAdmin, productoController.remove);

export default router;
