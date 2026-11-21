// server/routes/chat.js
import express from 'express';
import { onRequestPost, onRequestOptions } from '../../functions/api/chat.js';
import { createFunctionAdapter } from '../adapter.js';

const router = express.Router();
const handle = createFunctionAdapter({ onRequestPost, onRequestOptions }, '/api/chat');

router.post('/', handle);
router.options('/', handle);

export default router;
