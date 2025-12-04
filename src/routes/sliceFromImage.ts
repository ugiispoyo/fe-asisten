import express from 'express';
import multer from 'multer';
import { sliceLayoutFromImage } from '../llm/vision'; 
import { appendLog } from '../logs/logs';   

const router = express.Router();
const upload = multer({ dest: 'data/uploads' });

/**
 * POST /slice-from-image
 * Form-data:
 *   - file: image/*
 *   - instructions: string (prompt user)
 *   - sessionId: string
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { instructions = '', sessionId = 'default' } = req.body as {
      instructions?: string;
      sessionId?: string;
    };

    if (!file) {
      return res.status(400).json({ error: 'file is required' });
    }

    // 1) Panggil vision model (qwen2.5vl) untuk dapetin deskripsi + kode
    const result = await sliceLayoutFromImage(
      instructions,
      file.path,
    );

    // 2) Log ke logs.jsonl supaya bisa di-rating dan dipakai fine-tune
    const createdAt = new Date().toISOString();
    const logId = `slice-${sessionId}-${createdAt}`;

    appendLog({
      id: logId,
      session_id: sessionId,
      model: process.env.VISION_MODEL ?? 'qwen2.5vl:3b',
      messages: [
        {
          role: 'user',
          content:
            `# Slicing dari gambar\n` +
            `User mengupload gambar (path lokal: ${file.path}) dan memberi instruksi:\n` +
            `"${instructions}"\n\n` +
            `Deskripsikan layout + generate kode React/Next.js + Tailwind yang sesuai.`, // <-- jadi text-only instruction untuk fine-tune
        },
        {
          role: 'assistant',
          content: result, // teks yang kamu kirim balik ke UI
        },
      ],
      used_memory_ids: [],         // kalau kamu pakai memory, isi di sini
      rating: null,                // nanti diupdate via /feedback
      source: 'slice',             // ⬅️ tanda bahwa ini log dari slicing
      created_at: createdAt,
      feedback_comment: undefined, // nanti diisi dari feedback
    });

    // 3) Balikin hasil + logId ke frontend
    res.json({
      ok: true,
      result,
      logId,
    });
  } catch (err) {
    console.error('[slice-from-image] error:', err);
    res.status(500).json({ error: 'failed to process image' });
  }
});

export default router;
