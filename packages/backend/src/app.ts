// IMPORTANT: load env before anything else
import './env.js';

import express, { type Express } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDatabase } from './config/database.js';
import { config, validateConfig } from './config/index.js';
import { errorHandler, requestLogger } from './middleware/index.js';
import { sendSuccess } from './utils/response.js';
import { authRoutes } from './modules/auth/index.js';
import { jewelryRoutes } from './modules/jewelry/index.js';
import { setRoutes } from './modules/sets/index.js';
import { groupRoutes } from './modules/groups/index.js';
import { conversationRoutes } from './modules/conversations/index.js';
import { bookingRoutes } from './modules/bookings/index.js';
import { notificationRoutes, initWebPush } from './modules/notifications/index.js';
import { mediaRoutes, ensureMediaDirs } from './modules/media/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();

app.use(
  cors({
    origin: config.isDevelopment ? [config.frontendUrl, 'http://localhost:3000'] : true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health checks
app.get('/api/health', (_req, res) => {
  sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    environment: config.nodeEnv,
  });
});

app.get('/api/health/db', async (_req, res, next) => {
  try {
    const mongoose = await import('mongoose');
    const state = mongoose.default.connection.readyState;
    const states: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    sendSuccess(res, { status: state === 1 ? 'ok' : 'error', database: states[state] || 'unknown' });
  } catch (error) {
    next(error);
  }
});

// Feature routes
app.use('/api/auth', authRoutes);
app.use('/api/jewelry', jewelryRoutes);
app.use('/api/sets', setRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/media', mediaRoutes);

// Serve the built frontend in production
if (config.isProduction) {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// 404 for unknown API routes
app.use('/api/*', (_req, res) => {
  res.status(404).json({ status: 'error', message: 'API endpoint not found' });
});

app.use(errorHandler);

const start = async () => {
  try {
    validateConfig();
    await connectDatabase();
    await ensureMediaDirs();
    initWebPush();
    app.listen(config.port, () => {
      console.log('');
      console.log('💎 Jewel Finder - Backend');
      console.log('=========================');
      console.log(`📍 Port: ${config.port}`);
      console.log(`🌱 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health: http://localhost:${config.port}/api/health`);
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();

export default app;
