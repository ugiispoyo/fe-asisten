import express from 'express';
import { chatWithCoder, ChatMessage } from '../llm/coder';
import { getRelevantMemories } from '../memory/memory';
import { appendLog } from '../logs/logs';

const router = express.Router();

const SYSTEM_PROMPT = `
Kamu adalah asisten coding frontend sebagai Senior Frontend Engineer yang sangat jago.
- Ikuti bahasa user (Indonesia / Inggris / campuran).
- Default stack: React + Nextjs + TypeScript + Tailwind CSS.
- Jawab dengan singkat tapi jelas.
- Selalu gunakan konteks percakapan sebelumnya jika tersedia.
- Jika user berkata seperti "ulang lagi", "ulang aja", "perbaiki jawaban sebelumnya",
  "lanjutkan yang tadi", maka:
  *Anggap itu merujuk ke jawabanmu sebelumnya pada percakapan ini.*
  Perbaiki / ulangi / lanjutkan jawaban yang relevan, jangan menjawab generik.
`.trim();

router.post('/', async (req, res) => {
  try {
    const {
      message,
      messages,
      sessionId = 'default',
    } = req.body as {
      message?: string;
      // history dari FE (opsional, tapi disarankan)
      messages?: ChatMessage[];
      sessionId?: string;
    };

    // --- 1. Normalisasi: pakai history kalau ada, kalau tidak pakai single message ---
    let history: ChatMessage[] = [];

    if (Array.isArray(messages) && messages.length > 0) {
      // gunakan apa adanya dari FE
      history = messages;
    } else if (typeof message === 'string' && message.trim()) {
      history = [{ role: 'user', content: message.trim() }];
    } else {
      return res.status(400).json({ error: 'message or messages is required' });
    }

    // cari user message terakhir (buat relevansi memori)
    const lastUserMessage =
      [...history]
        .reverse()
        .find((m) => m.role === 'user')
        ?.content || message || '';

    // --- 2. Ambil memori relevan buat session ini ---
    const memories = getRelevantMemories(sessionId, lastUserMessage);
    const memoryText =
      memories.length === 0
        ? '- (belum ada catatan khusus)'
        : memories.map((m) => `- ${m.content}`).join('\n');

    // --- 3. Build messages ke model: system + memori + history percakapan ---
    const messagesForModel: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'system',
        content: `Catatan preferensi & koreksi user:\n${memoryText}`,
      },
      ...history,
    ];

    const t0 = Date.now();
    const answer = await chatWithCoder(messagesForModel);
    const t1 = Date.now();
    console.log('[chat] ollama latency:', (t1 - t0) / 1000, 's');

    // --- 4. Logging ke logs.jsonl (simpan full context yang dipakai) ---
    const createdAt = new Date().toISOString();
    const logId = `${sessionId}-${createdAt}`;

    appendLog({
      id: logId,
      session_id: sessionId,
      model: process.env.CODER_MODEL ?? 'qwen2.5-coder:3b',
      messages: [
        // simpan context yang dikirim ke model
        ...messagesForModel,
        { role: 'assistant', content: answer },
      ],
      used_memory_ids: [], // bisa diisi nanti kalau mau tracking memori mana yang kepakai
      rating: null,
      source: 'chat',
      created_at: createdAt,
    });

    // --- 5. Response ke frontend ---
    return res.json({
      answer,
      logId,
    });
  } catch (err) {
    console.error('Error in /chat:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
