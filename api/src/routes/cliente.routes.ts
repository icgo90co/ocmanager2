import { Router } from 'express';
import { authenticate, isAdmin, isAdminOrOwner } from '../middleware/auth';
import * as clienteController from '../controllers/cliente.controller';

const router = Router();

router.use(authenticate);

router.get('/', isAdmin, clienteController.getAll);
router.get('/:id', isAdminOrOwner('id'), clienteController.getById);
router.post('/', isAdmin, clienteController.create);
router.patch('/:id', isAdmin, clienteController.update);
router.delete('/:id', isAdmin, clienteController.remove);

export default router;
