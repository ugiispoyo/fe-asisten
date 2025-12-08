import fs from 'fs';
import path from 'path';
import ollama from 'ollama';

/**
 * Model vision untuk baca desain dari gambar.
 * Default: qwen2.5vl:3b (bisa diubah via env VISION_MODEL jika ada).
 */
const VISION_MODEL = process.env.VISION_MODEL ?? 'qwen2.5vl:3b';

export async function sliceLayoutFromImage(
  prompt: string,
  imagePath: string,
): Promise<string> {
  const absolute = path.isAbsolute(imagePath)
    ? imagePath
    : path.join(process.cwd(), imagePath);

  const imageBytes = fs.readFileSync(absolute);

  const res = await ollama.chat({
    model: VISION_MODEL,
    messages: [
      {
        role: 'user',
        content: prompt,
        images: [imageBytes],
      } as any,
    ],
  });

  return res.message.content;
}
