import 'dotenv/config';
import express from 'express';
import { initDb } from './store/db.js';
import { corsMiddleware } from './middleware/cors.js';
import { optionalAuth } from './middleware/auth.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './api/auth.js';
import stationsRoutes from './api/stations.js';
import predictionsRoutes from './api/predictions.js';
import alertsRoutes from './api/alerts.js';
import dashboardRoutes from './api/dashboard.js';
import feedsRoutes from './api/feeds.js';

initDb();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(corsMiddleware());
app.use(express.json({ limit: '1mb' }));
app.use(optionalAuth);

app.get('/', (_req, res) => {
  res.json({
    name: 'FRPEWS – Flood Risk Prediction & Early Warning System',
    version: '2.1.1',
    runtime: 'Node.js 22 LTS',
    status: 'online',
    study_areas: ['Makurdi (Benue)', 'Lokoja (Kogi)', 'Onitsha (Anambra)'],
    frontend: 'https://flood-risk-system-ten.vercel.app',
    health: '/health',
    api_prefix: '/api',
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', node: process.version });
});

app.use('/api/auth', authRoutes);
app.use('/api/stations', stationsRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/feeds', feedsRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[FRPEWS] Node ${process.version} API on http://0.0.0.0:${PORT}`);
  console.log('[FRPEWS] CORS allows https://flood-risk-system-ten.vercel.app');
});
