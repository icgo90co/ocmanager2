import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Rutas de archivos implementadas en oc.controller (upload)
// Aquí podrían ir endpoints adicionales para gestión de archivos

export default router;
