// src/tools/buildDataset.ts
import fs from 'fs';
import path from 'path';

/**
 * Tipe data sesuai struktur yang kita pakai di memories.json & logs.jsonl
 */

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
  feedback_comment?: string;
};

type DatasetSample = {
  id: string;
  source: 'memory' | 'log';
  session_id: string;
  instruction: string;
  input: string;
  output: string;
  rating?: 'good' | 'bad';
  comment?: string;
  tags?: string[];
  created_at?: string;
  meta?: Record<string, unknown>;
};

// Path file
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

  const lines = fs
    .readFileSync(LOGS_PATH, 'utf-8')
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

/**
 * Utility: normalisasi string, trim + hilangin spasi berlebih
 */
function normalize(str: string | undefined | null): string {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Konversi Memory → DatasetSample
 * - Butuh ideal_output yang non-empty
 * - content jadi instruction
 * - input (kalau ada) jadi "input"
 */
function sampleFromMemory(mem: Memory): DatasetSample | null {
  const instruction = normalize(mem.content);
  const input = normalize(mem.input ?? '');
  const output = normalize(mem.ideal_output ?? '');

  if (!output) {
    console.warn(
      `[buildDataset] Memory ${mem.id} has no ideal_output, skip (but consider melengkapi ideal_output kalau mau dipakai fine-tune)`
    );
    return null;
  }

  const id = `mem-${mem.id}`;

  return {
    id,
    source: 'memory',
    session_id: mem.session_id,
    instruction:
      instruction || 'Terapkan preferensi/aturan berikut pada jawaban model.',
    input,
    output,
    tags: mem.tags ?? [],
    created_at: mem.created_at,
    meta: {
      type: mem.type,
      reason: mem.reason ?? '',
    },
  };
}

/**
 * Konversi LogEntry → DatasetSample
 * - Hanya pakai log dengan rating 'good'
 * - instruction = user terakhir
 * - output = assistant terakhir
 * - comment feedback & rating masuk ke field comment/meta
 */
function sampleFromLog(log: LogEntry): DatasetSample | null {
  if (log.rating !== 'good') {
    return null;
  }

  const userMessages = log.messages.filter((m) => m.role === 'user');
  const assistantMessages = log.messages.filter((m) => m.role === 'assistant');

  if (userMessages.length === 0 || assistantMessages.length === 0) {
    console.warn(`[buildDataset] Log ${log.id} has no user/assistant pair, skip`);
    return null;
  }

  const user = userMessages[userMessages.length - 1];
  const assistant = assistantMessages[assistantMessages.length - 1];

  const instruction = normalize(user.content);
  const output = normalize(assistant.content);

  if (!instruction || !output) {
    console.warn(`[buildDataset] Log ${log.id} has empty instruction/output, skip`);
    return null;
  }

  const id = `log-${log.id}`;

  return {
    id,
    source: 'log',
    session_id: log.session_id,
    instruction,
    input: '',
    output,
    rating: log.rating === 'good' ? 'good' : undefined,
    comment: log.feedback_comment || undefined,
    created_at: log.created_at,
    meta: {
      model: log.model,
      log_source: log.source ?? 'chat',
      used_memory_ids: log.used_memory_ids ?? [],
    },
  };
}

function buildDataset() {
  console.log('🧱 [buildDataset] Start building dataset...');
  console.log(`   - memories:  ${MEMORIES_PATH}`);
  console.log(`   - logs:      ${LOGS_PATH}`);
  console.log(`   - output:    ${DATASET_PATH}`);

  const memories = loadMemories();
  const logs = loadLogs();

  const samples: DatasetSample[] = [];

  // 1) dari memories
  for (const mem of memories) {
    const sample = sampleFromMemory(mem);
    if (sample) samples.push(sample);
  }

  // 2) dari logs (rating good)
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

  console.log(
    `✅ [buildDataset] Done. Wrote ${samples.length} samples to ${DATASET_PATH}`
  );
}

// jalankan langsung kalau file ini di-run via ts-node
buildDataset();
