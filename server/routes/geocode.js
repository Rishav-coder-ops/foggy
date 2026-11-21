// server/routes/geocode.js
import express from 'express';
import { onRequest } from '../../functions/api/geocode.js';
import { createFunctionAdapter } from '../adapter.js';

const router = express.Router();
const handle = createFunctionAdapter({ onRequest }, '/api/geocode');

router.get('/', handle);
router.options('/', handle);

export default router;
