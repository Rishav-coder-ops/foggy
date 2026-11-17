// server/routes/chat.js
import express from 'express';
import chatHandler from '../../api/chat.js';

const router = express.Router();

router.post('/', chatHandler);
router.options('/', chatHandler);

export default router;
