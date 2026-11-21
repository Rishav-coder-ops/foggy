// server/routes/aqiTimeline.js
import express from 'express';
import { onRequestGet, onRequestOptions } from '../../functions/api/aqi-timeline.js';
import { createFunctionAdapter } from '../adapter.js';

const router = express.Router();
const handle = createFunctionAdapter({ onRequestGet, onRequestOptions }, '/api/aqi-timeline');

router.get('/', handle);
router.options('/', handle);

export default router;
