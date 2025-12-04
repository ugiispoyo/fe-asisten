// src/routes/feedback.ts
import express from 'express';
import { updateLogFeedback } from '../logs/feedback';

const router = express.Router();

/**
 * POST /feedback
 *
 * Body:
 * {
 *   "sessionId": "sess-xxx",
 *   "messageId": "log-id-yang-mau-di-rate",
 *   "rating": "good" | "bad",
 *   "comment": "opsional"
 * }
 */
router.post('/', (req, res) => {
  const {
    sessionId = 'default',
    messageId,
    rating,
    comment,
  } = req.body as {
    sessionId?: string;
    messageId?: string;
    rating?: 'good' | 'bad';
    comment?: string;
  };

  if (!messageId || !rating) {
    return res
      .status(400)
      .json({ error: 'messageId and rating are required' });
  }

  try {
    updateLogFeedback({
      sessionId,
      messageId,
      rating,
      comment,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('[feedback] failed to update log:', err);
    return res.status(500).json({ error: 'failed to update feedback' });
  }
});

export default router;
