import express from 'express';
import { saveMemory } from '../memory/memory';

const router = express.Router();

/**
 * Endpoint untuk nyimpen koreksi / preferensi user.
 *
 * Contoh body:
 * {
 *   "sessionId": "fe-project",
 *   "type": "correction",
 *   "content": "Di project ini pakai React Query, jangan useEffect manual",
 *   "tags": ["react-query", "fetch"]
 * }
 */
router.post('/', (req, res) => {
  const {
    sessionId = 'default',
    type = 'correction',
    content,
    tags = [],
  } = req.body as {
    sessionId?: string;
    type?: string;
    content?: string;
    tags?: string[];
  };

  if (!content) {
    return res.status(400).json({ error: 'content is required' });
  }

  saveMemory(sessionId, type, content, tags);
  res.json({ ok: true });
});

export default router;
