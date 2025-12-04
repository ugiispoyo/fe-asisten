// src/tools/buildDataset.ts
import fs from 'fs';
import path from 'path';

type Memory = {
  id: number;
  session_id: string;
  type: 'correction' | 'preference' | 'note' | string;
  content: string;
  input?: string;
  ideal_output?: string;
  reason?: string;
  tags?: string[];
  created_at: string;
};

type LogMessage = { role: 'user' | 'assistant' | 'system'; content: string };

type LogEntry = {
  id: string;
  session_id: string;
  model: string;
  messages: LogMessage[];
  used_memory_ids?: number[];
  rating?: 'good' | 'bad' | 'needs_review' | null | string;
  source?: 'chat' | 'api' | 'test' | string;
  created_at: string;
};

type DatasetSample = {
  instruction: string;
  input: string;
  output: string;
  source: 'memory' | 'log';
  session_id?: string;
  tags?: string[];
  created_at?: string;
  meta?: Record<string, unknown>;
};

const DATA_DIR = path.join(process.cwd(), 'data');
const MEMORIES_PATH = path.join(DATA_DIR, 'memories.json');
const LOGS_PATH = path.join(DATA_DIR, 'logs.jsonl');
const TRAIN_DIR = path.join(DATA_DIR, 'training');
const DATASET_PATH = path.join(TRAIN_DIR, 'dataset.jsonl');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadMemories(): Memory[] {
  if (!fs.existsSync(MEMORIES_PATH)) {
    console.warn(`[buildDataset] memories.json not found at ${MEMORIES_PATH}, skip memories`);
    return [];
  }

  const raw = fs.readFileSync(MEMORIES_PATH, 'utf-8');
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as Memory[];
    }
    console.warn('[buildDataset] memories.json is not an array, skip');
    return [];
  } catch (err) {
    console.error('[buildDataset] Failed to parse memories.json:', err);
    return [];
  }
}

function loadLogs(): LogEntry[] {
  if (!fs.existsSync(LOGS_PATH)) {
    console.warn(`[buildDataset] logs.jsonl not found at ${LOGS_PATH}, skip logs`);
    return [];
  }

  const lines = fs.readFileSync(LOGS_PATH, 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const result: LogEntry[] = [];
  for (const line of lines) {
    try {
      const obj = JSON.parse(line) as LogEntry;
      result.push(obj);
    } catch (err) {
      console.warn('[buildDataset] Failed to parse log line, skip:', line);
    }
  }
  return result;
}

function sampleFromMemory(mem: Memory): DatasetSample | null {
  const instructionBase = mem.content?.trim();
  const instruction = instructionBase || 'Perbaiki jawaban berikut sesuai preferensi project.';

  // Kalau ada ideal_output, itu yang paling berharga.
  const output = (mem.ideal_output ?? '').trim();
  const input = (mem.input ?? '').trim();

  if (!output) {
    // Kalau nggak ada ideal_output, ya value mem-nya kurang berguna buat fine-tune.
    // Optional: fallback: treat content as output.
    console.warn(`[buildDataset] Memory ${mem.id} has no ideal_output, skip`);
    return null;
  }

  return {
    instruction,
    input: input,
    output,
    source: 'memory',
    session_id: mem.session_id,
    tags: mem.tags ?? [],
    created_at: mem.created_at,
    meta: {
      type: mem.type,
      reason: mem.reason ?? '',
      memory_id: mem.id,
    },
  };
}

function sampleFromLog(log: LogEntry): DatasetSample | null {
  // Hanya pakai log yang sudah diberi rating 'good'
  if (log.rating !== 'good') {
    return null;
  }

  const userMessages = log.messages.filter((m) => m.role === 'user');
  const assistantMessages = log.messages.filter((m) => m.role === 'assistant');

  if (userMessages.length === 0 || assistantMessages.length === 0) {
    console.warn(`[buildDataset] Log ${log.id} has no user/assistant pair, skip`);
    return null;
  }

  // Ambil user terakhir & assistant terakhir (umumnya 1:1)
  const user = userMessages[userMessages.length - 1];
  const assistant = assistantMessages[assistantMessages.length - 1];

  const instruction = user.content.trim();
  const output = assistant.content.trim();

  if (!instruction || !output) {
    console.warn(`[buildDataset] Log ${log.id} has empty instruction/output, skip`);
    return null;
  }

  return {
    instruction,
    input: '',
    output,
    source: 'log',
    session_id: log.session_id,
    created_at: log.created_at,
    meta: {
      log_id: log.id,
      model: log.model,
      source: log.source ?? 'chat',
      used_memory_ids: log.used_memory_ids ?? [],
      rating: log.rating ?? null,
    },
  };
}

function buildDataset() {
  console.log('[buildDataset] Loading memories & logs...');

  const memories = loadMemories();
  const logs = loadLogs();

  const samples: DatasetSample[] = [];

  for (const mem of memories) {
    const sample = sampleFromMemory(mem);
    if (sample) samples.push(sample);
  }

  for (const log of logs) {
    const sample = sampleFromLog(log);
    if (sample) samples.push(sample);
  }

  if (samples.length === 0) {
    console.warn('[buildDataset] No samples generated, nothing to write.');
    return;
  }

  ensureDir(TRAIN_DIR);

  const lines = samples.map((s) => JSON.stringify(s));
  fs.writeFileSync(DATASET_PATH, lines.join('\n') + '\n', 'utf-8');

  console.log(`[buildDataset] Done. Wrote ${samples.length} samples to ${DATASET_PATH}`);
}

buildDataset();
