import express from 'express';
import { chatWithCoder } from '../llm/coder';
import { getRelevantMemories } from '../memory/memory';
import { appendLog } from '../logs/logs';

const router = express.Router();

const SYSTEM_PROMPT = `
Kamu adalah asisten coding frontend sebagai Senior Frontend Engineer yang sangat jago.

- Ikuti bahasa user (Indonesia / Inggris / campuran).
- Default stack: React + Nextjs + TypeScript + Tailwind CSS.
- Saat slicing desain:
  - Jelaskan dulu struktur layout (section, grid, spacing, typography).
  - Setelah itu, beri contoh kode komponen.
- Saat integrasi API backend:
  - Buat layer service/fetch terpisah.
  - Tunjukkan cara pakai di komponen (hooks, dsb).
- Kalau user bilang jawabanmu salah dan memberi versi yang benar,
  anggap itu sebagai preferensi dan catat agar tidak diulang lagi.
`;

router.post('/', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body as {
      message: string;
      sessionId?: string;
    };

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    // Ambil memori relevan buat session ini
    const memories = getRelevantMemories(sessionId, message);
    const memoryText =
      memories.length === 0
        ? '- (belum ada catatan khusus)'
        : memories.map((m) => `- ${m.content}`).join('\n');

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      {
        role: 'system' as const,
        content: `Catatan preferensi & koreksi user:\n${memoryText}`,
      },
      { role: 'user' as const, content: message },
    ];

    const answer = await chatWithCoder(messages);

    const createdAt = new Date().toISOString();
    const logId = `${sessionId}-${createdAt}`;

    appendLog({
      id: logId,
      session_id: sessionId,
      model: process.env.CODER_MODEL ?? 'qwen2.5-coder:3b',
      messages: [
        { role: 'user', content: message },
        { role: 'assistant', content: answer },
      ],
      used_memory_ids: [], // atau isi sesuai implementasi kamu
      rating: null,
      source: 'chat',
      created_at: createdAt,
    });

    // ⬅️ kirim juga logId ke frontend
    res.json({
      answer,
      logId, // <--- ini yang penting
    });
  } catch (err) {
    console.error('Error in /chat:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
