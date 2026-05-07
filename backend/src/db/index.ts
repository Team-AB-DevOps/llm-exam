import Database, { Database as DatabaseType } from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(__dirname, "../../data/app.db");

// Ensure data directory exists
import fs from "fs";
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db: DatabaseType = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");

export default db;
