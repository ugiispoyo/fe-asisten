import fs from 'fs';
import path from 'path';

export type LogMessage = { role: 'user' | 'assistant' | 'system'; content: string };

export type LogEntry = {
  id: string;
  session_id: string;
  model: string;
  messages: LogMessage[];
  used_memory_ids: number[];
  rating: 'good' | 'bad' | 'needs_review' | null;
  source: 'chat' | 'api' | 'test';
  created_at: string;
};

const dataDir = path.join(process.cwd(), 'data');
const logsPath = path.join(dataDir, 'logs.jsonl');

function ensureLogsFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(logsPath)) {
    fs.writeFileSync(logsPath, '', 'utf-8');
  }
}

export function appendLog(entry: LogEntry) {
  ensureLogsFile();
  const line = JSON.stringify(entry);
  fs.appendFileSync(logsPath, line + '\n', 'utf-8');
}
