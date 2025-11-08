import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import router from './routes';

// Cargar .env desde la raíz del proyecto
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const app = express();
const PORT = process.env.API_PORT || 3001;

// Trust proxy - MUST be set when behind reverse proxy (Traefik, nginx, etc)
app.set('trust proxy', 1);

// CORS configuration - MUST be before other middleware
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
logger.info(`🔐 CORS configured for origin: ${allowedOrigin}`);

const corsOptions = {
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Apply CORS FIRST
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Security (after CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Logging
app.use(pinoHttp({ logger }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static files (uploads)
app.use('/uploads', express.static('uploads'));

// Health check (before routes)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint for CORS configuration (before routes)
app.get('/api/debug/cors', (req, res) => {
  res.json({
    corsOrigin: process.env.CORS_ORIGIN,
    nodeEnv: process.env.NODE_ENV,
    requestOrigin: req.headers.origin,
    allowedOrigin: allowedOrigin,
  });
});

// Routes
app.use('/api', router);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
