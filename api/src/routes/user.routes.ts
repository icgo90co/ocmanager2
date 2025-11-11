import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/auth';
import * as userController from '../controllers/user.controller';

const router = Router();

// Todas las rutas requieren autenticación y ser admin
router.use(authenticate);
router.use(isAdmin);

router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post('/', userController.create);
router.patch('/:id', userController.update);
router.post('/:id/change-password', userController.changePassword);
router.delete('/:id', userController.deleteUser);

export default router;
