import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate, isAdmin } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';
import * as ocController from '../controllers/oc.controller';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo CSV y XLSX'));
    }
  },
});

const router = Router();

router.use(authenticate);

router.get('/', ocController.getAll);
router.get('/:id', ocController.getById);
router.post('/', ocController.create);
router.post('/upload', uploadLimiter, upload.single('file'), ocController.uploadFile);
router.post('/:id/confirm', ocController.confirmUpload);
router.patch('/:id', ocController.update);
router.post('/:id/cambiar-estado', ocController.changeEstado);

export default router;
