// server/routes/aqiTimeline.js
import express from 'express';
import { onRequestGet, onRequestOptions } from '../../functions/api/aqi-timeline.js';

const router = express.Router();

async function handle(req, res) {
  try {
    const host = req.headers.host || 'localhost:3001';
    const url = `http://${host}${req.originalUrl}`;
    const webReq = new Request(url, {
      method: req.method,
      headers: req.headers
    });

    const response = req.method === 'OPTIONS'
      ? await onRequestOptions({ request: webReq, env: process.env })
      : await onRequestGet({ request: webReq, env: process.env });

    res.status(response.status);
    response.headers.forEach((val, key) => res.setHeader(key, val));
    const text = await response.text();
    res.send(text);
  } catch (err) {
    console.error('Express adapter error in /api/aqi-timeline:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to process timeline request.' });
  }
}

router.get('/', handle);
router.options('/', handle);

export default router;
