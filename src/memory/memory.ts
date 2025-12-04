import fs from 'fs';
import path from 'path';

export type Memory = {
  id: number;
  session_id: string;
  type: string;
  tags: string[];   // disimpan di file sebagai array
  content: string;
  created_at: string;
};

const dataDir = path.join(process.cwd(), 'data');
const filePath = path.join(dataDir, 'memories.json');

function ensureStorage() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf-8');
  }
}

function loadAll(): Memory[] {
  ensureStorage();
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as Memory[];
    }
    return [];
  } catch {
    return [];
  }
}

function saveAll(list: Memory[]) {
  ensureStorage();
  fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
}

function getNextId(list: Memory[]): number {
  if (list.length === 0) return 1;
  return Math.max(...list.map((m) => m.id)) + 1;
}

export function saveMemory(
  sessionId: string,
  type: string,
  content: string,
  tags: string[] = []
) {
  const list = loadAll();
  const now = new Date().toISOString();

  const mem: Memory = {
    id: getNextId(list),
    session_id: sessionId,
    type,
    tags,
    content,
    created_at: now,
  };

  list.push(mem);
  saveAll(list);
}

export function getRelevantMemories(
  sessionId: string,
  query: string,
  limit = 5
): Memory[] {
  const list = loadAll();

  const q = query.toLowerCase();
  const filtered = list
    .filter((m) => m.session_id === sessionId)
    .filter((m) => m.content.toLowerCase().includes(q))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, limit);

  return filtered;
}
