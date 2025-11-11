import { Router } from 'express';
import authRoutes from './auth.routes';
import clienteRoutes from './cliente.routes';
import productoRoutes from './producto.routes';
import ocRoutes from './oc.routes';
import ovRoutes from './ov.routes';
import envioRoutes from './envio.routes';
import archivoRoutes from './archivo.routes';
import auditRoutes from './audit.routes';
import userRoutes from './user.routes';
import { apiLimiter } from '../middleware/rateLimiter';
import { runSeed } from '../controllers/seed.controller';

const router = Router();

router.use(apiLimiter);

// Admin utilities
router.post('/admin/seed', runSeed);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/clientes', clienteRoutes);
router.use('/productos', productoRoutes);
router.use('/oc', ocRoutes);
router.use('/ov', ovRoutes);
router.use('/envios', envioRoutes);
router.use('/archivos', archivoRoutes);
router.use('/audit', auditRoutes);

export default router;
