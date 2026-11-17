// server/routes/aqi.js
import express from 'express';
import aqiHandler from '../../api/aqi.js';

const router = express.Router();

router.get('/', aqiHandler);
router.options('/', aqiHandler);

export default router;
