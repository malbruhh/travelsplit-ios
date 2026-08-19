import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'travelsplit.db');
export const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');

// Initialize schema tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT,
    avatarColor TEXT NOT NULL,
    defaultCurrency TEXT DEFAULT 'USD',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expiresAt TEXT NOT NULL,
    revoked INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    destination TEXT NOT NULL,
    baseCurrency TEXT DEFAULT 'USD',
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    createdBy TEXT NOT NULL,
    joinCode TEXT UNIQUE NOT NULL,
    membersJson TEXT NOT NULL,
    archived INTEGER DEFAULT 0,
    totalBudget REAL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    tripId TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    exchangeRate REAL NOT NULL,
    date TEXT NOT NULL,
    paidByJson TEXT NOT NULL,
    splitType TEXT NOT NULL,
    splitWithMemberIdsJson TEXT NOT NULL,
    customSplitsJson TEXT,
    itemizedItemsJson TEXT,
    taxAmount REAL DEFAULT 0,
    tipAmount REAL DEFAULT 0,
    notes TEXT,
    createdBy TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY(tripId) REFERENCES trips(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settlements (
    id TEXT PRIMARY KEY,
    tripId TEXT NOT NULL,
    fromUserId TEXT NOT NULL,
    toUserId TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    date TEXT NOT NULL,
    notes TEXT,
    paymentMethod TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(tripId) REFERENCES trips(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    tripId TEXT NOT NULL,
    userId TEXT NOT NULL,
    userName TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    FOREIGN KEY(tripId) REFERENCES trips(id) ON DELETE CASCADE
  );
`);

// Safe migration check for existing databases
try {
  const userColumns = db.prepare(`PRAGMA table_info(users)`).all() as Array<{ name: string }>;
  if (!userColumns.some(c => c.name === 'passwordHash')) {
    db.prepare(`ALTER TABLE users ADD COLUMN passwordHash TEXT`).run();
  }
} catch (e) {
  console.warn('Migration check warning:', e);
}
