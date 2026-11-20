// server/routes/personalize.js
import express from 'express';
import { onRequestPost, onRequestOptions } from '../../functions/api/personalize.js';

const router = express.Router();

async function handle(req, res) {
  try {
    const host = req.headers.host || 'localhost:3001';
    const url = `http://${host}${req.originalUrl}`;
    const webReq = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' && req.body ? JSON.stringify(req.body) : undefined
    });

    const response = req.method === 'OPTIONS'
      ? await onRequestOptions({ request: webReq, env: process.env })
      : await onRequestPost({ request: webReq, env: process.env });

    res.status(response.status);
    response.headers.forEach((val, key) => res.setHeader(key, val));
    const text = await response.text();
    res.send(text);
  } catch (err) {
    console.error('Express adapter error in /api/personalize:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to process personalization request.' });
  }
}

router.post('/', handle);
router.options('/', handle);

export default router;
