// server/routes/alerts.js
import express from 'express';
import { onRequestGet, onRequestOptions } from '../../functions/api/alerts.js';
import { createFunctionAdapter } from '../adapter.js';

const router = express.Router();
const handle = createFunctionAdapter({ onRequestGet, onRequestOptions }, '/api/alerts');

router.get('/', handle);
router.options('/', handle);

export default router;
