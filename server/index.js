// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import aqiRouter from './routes/aqi.js';
import chatRouter from './routes/chat.js';
import personalizeRouter from './routes/personalize.js';
import aqiTimelineRouter from './routes/aqiTimeline.js';
import geocodeRouter from './routes/geocode.js';
import alertsRouter from './routes/alerts.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { logger } from '../shared/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from project root
dotenv.config({ path: path.join(rootDir, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Apply rate limiting to all /api/ endpoints to protect free-tier quotas
app.use('/api/', rateLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Foggy API Proxy',
    geminiConfigured: !!(
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
    ),
    aqiConfigured: !!(
      process.env.AQI_API_KEY && process.env.AQI_API_KEY !== 'your_waqi_token_here'
    ),
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/aqi', aqiRouter);
app.use('/api/chat', chatRouter);
app.use('/api/personalize', personalizeRouter);
app.use('/api/aqi-timeline', aqiTimelineRouter);
app.use('/api/geocode', geocodeRouter);
app.use('/api/alerts', alertsRouter);

// Catch-all for undefined API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Serve static frontend build if it exists (e.g., in production)
const distPath = path.join(rootDir, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  const isGeminiSet = !!(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  );
  const isAqiSet = !!(
    process.env.AQI_API_KEY && process.env.AQI_API_KEY !== 'your_waqi_token_here'
  );

  logger.info(`\n======================================================`);
  logger.info(`🌫️  Foggy API Proxy running at: http://localhost:${PORT}`);
  logger.info(
    `   - Gemini AI:  ${isGeminiSet ? '✅ Live Key Loaded' : '💡 Using Intelligent Fallback Core'}`
  );
  logger.info(
    `   - WAQI Data:  ${isAqiSet ? '✅ Live Token Loaded' : '💡 Using Atmospheric Simulation Fallback'}`
  );
  logger.info(`======================================================\n`);
});
