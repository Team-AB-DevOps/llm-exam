import db from "./index";

export function initializeDatabase(): void {
    db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      upload_date TEXT NOT NULL DEFAULT (datetime('now')),
      chunk_count INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'processing'
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conversation 
      ON chat_messages(conversation_id, created_at);
  `);
}
