// src/logs/feedback.ts
import fs from 'fs';
import path from 'path';

export type FeedbackRating = 'good' | 'bad';

type LogMessage = { role: 'user' | 'assistant' | 'system'; content: string };

type LogEntry = {
  id: string;
  session_id: string;
  model: string;
  messages: LogMessage[];
  used_memory_ids?: number[];
  rating?: 'good' | 'bad' | 'needs_review' | null | string;
  source?: string;
  created_at: string;
  // NEW: tempat nyimpen komentar feedback
  feedback_comment?: string;
};

const dataDir = path.join(process.cwd(), 'data');
const logsPath = path.join(dataDir, 'logs.jsonl');

export function updateLogFeedback(params: {
  sessionId?: string;
  messageId: string;
  rating: FeedbackRating;
  comment?: string;
}) {
  const { sessionId, messageId, rating, comment } = params;

  if (!fs.existsSync(logsPath)) {
    console.warn('[feedback] logs.jsonl not found, skip update');
    return;
  }

  const raw = fs.readFileSync(logsPath, 'utf-8');
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let updated = false;

  const newLines = lines.map((line) => {
    try {
      const obj = JSON.parse(line) as LogEntry;

      const sameId = obj.id === messageId;
      const sameSession = !sessionId || obj.session_id === sessionId;

      if (sameId && sameSession) {
        obj.rating = rating;
        if (comment !== undefined) {
          obj.feedback_comment = comment;
        }
        updated = true;
        return JSON.stringify(obj);
      }

      return line;
    } catch {
      // kalau ada line rusak, biarkan apa adanya
      return line;
    }
  });

  if (!updated) {
    console.warn(
      `[feedback] log entry not found for messageId=${messageId}, sessionId=${sessionId}`,
    );
    return;
  }

  fs.writeFileSync(logsPath, newLines.join('\n') + '\n', 'utf-8');
  console.log(
    `[feedback] updated rating=${rating} for messageId=${messageId} (sessionId=${sessionId})`,
  );
}
