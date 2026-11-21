// server/routes/aqi.js
import express from 'express';
import { onRequestGet, onRequestOptions } from '../../functions/api/aqi.js';
import { createFunctionAdapter } from '../adapter.js';

const router = express.Router();
const handle = createFunctionAdapter({ onRequestGet, onRequestOptions }, '/api/aqi');

router.get('/', handle);
router.options('/', handle);

export default router;
