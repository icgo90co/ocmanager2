import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/auth';
import * as envioController from '../controllers/envio.controller';

const router = Router();

router.use(authenticate);

router.get('/', envioController.getAll);
router.get('/:id', envioController.getById);
router.patch('/:id', isAdmin, envioController.updateEnvio);
router.post('/ov/:ovId/crear', isAdmin, envioController.createFromOV);
router.post('/:id/eventos', isAdmin, envioController.addEvento);
router.get('/:id/eventos', envioController.getEventos);

export default router;
