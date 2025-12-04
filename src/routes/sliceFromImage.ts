import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sliceLayoutFromImage } from '../llm/vision';
import { getRelevantMemories } from '../memory/memory';

const router = express.Router();

// Simpan upload di ./data/uploads (masih dalam volume assistant-data)
const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  dest: uploadsDir,
});

router.post('/', upload.single('file'), async (req, res) => {
  const file = req.file;
  const { instructions = '', sessionId = 'default' } = req.body as {
    instructions?: string;
    sessionId?: string;
  };

  if (!file) {
    return res.status(400).json({ error: 'file is required (field name: "file")' });
  }

  try {
    // Ambil memori relevan (biar style konsisten per project)
    const memories = getRelevantMemories(sessionId, 'layout');
    const memoryText =
      memories.length === 0
        ? '- (belum ada catatan khusus)'
        : memories.map((m) => `- ${m.content}`).join('\n');

    const prompt = `
Kamu adalah frontend engineer ahli React + TypeScript + Tailwind CSS.

Tugasmu:
1. Lihat desain pada gambar yang aku kirim.
2. Jelaskan dulu struktur layout dalam bentuk teks:
   - Berapa section?
   - Grid / flex seperti apa?
   - Spacing, padding, margin utama?
   - Tipografi penting (heading, body).
3. Setelah itu, tuliskan contoh kode:
   - React + TypeScript (functional component).
   - Tailwind CSS untuk layout dan styling dasar.
   - Jangan terlalu banyak dummy data; cukup contoh yang representatif.

Catatan preferensi & koreksi user (kalau ada):
${memoryText}

Instruksi tambahan user:
${instructions || '- (tidak ada)'}
`.trim();

    const result = await sliceLayoutFromImage(prompt, file.path);

    // optional: hapus file setelah diproses biar nggak numpuk
    fs.unlink(file.path, (err) => {
      if (err) {
        console.warn('Failed to delete uploaded file:', err);
      }
    });

    res.json({
      ok: true,
      result,
    });
  } catch (err) {
    console.error('Error in /slice-from-image:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
