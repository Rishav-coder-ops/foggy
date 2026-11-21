// server/routes/personalize.js
import express from 'express';
import { onRequestPost, onRequestOptions } from '../../functions/api/personalize.js';
import { createFunctionAdapter } from '../adapter.js';

const router = express.Router();
const handle = createFunctionAdapter({ onRequestPost, onRequestOptions }, '/api/personalize');

router.post('/', handle);
router.options('/', handle);

export default router;
