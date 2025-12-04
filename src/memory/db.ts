import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

const dataDir = path.join(process.cwd(), 'data');

// pastikan folder data ada
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'assistant.db');

// SQLite bawaan Node (synchronous)
export const db = new DatabaseSync(dbPath);

// bikin tabel memories kalau belum ada
db.exec(`
  CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    type TEXT,
    tags TEXT,
    content TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
