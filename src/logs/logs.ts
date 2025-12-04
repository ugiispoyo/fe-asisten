import fs from 'fs';
import path from 'path';

export type LogMessage = { role: 'user' | 'assistant' | 'system'; content: string };

export type LogEntry = {
  id: string;
  session_id: string;
  model: string;
  messages: LogMessage[];
  used_memory_ids?: number[];
  rating?: 'good' | 'bad' | 'needs_review' | null | string;
  source?: 'chat' | 'slice' | 'api' | 'test' | string;
  created_at: string;
  feedback_comment?: string;
};

const dataDir = path.join(process.cwd(), 'data');
const logsPath = path.join(dataDir, 'logs.jsonl');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function appendLog(entry: LogEntry) {
  ensureDir(dataDir);
  const line = JSON.stringify(entry);
  fs.appendFileSync(logsPath, line + '\n', 'utf-8');
}
