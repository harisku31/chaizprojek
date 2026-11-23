// ===================================================================
// CHAIZSTORE SECURE DATABASE ADMIN MANAGEMENT CLI
// Direct SQLite Database Injection (Zero Code Hardcoding)
// ===================================================================

import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import crypto from 'node:crypto';

// Load .env if present
try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch (_) {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'chaizstore.db');
const db = new DatabaseSync(dbPath);

const args = process.argv.slice(2);
const username = (args[0] || process.env.ADMIN_USERNAME || '').trim();
const password = (args[1] || process.env.ADMIN_PASSWORD || '').trim();
const adminName = (args[2] || process.env.ADMIN_NAME || 'Owner ChaizStore').trim();

if (!username || !password) {
  console.log(`
❌ Gagal: Username dan password wajib diisi!
Cara Penggunaan:
  node server/set-admin.js <username> <password> [adminName]

Contoh:
  node server/set-admin.js admin_chaiz passwordRahasia123 "Owner Chaiz"
  `);
  process.exit(1);
}

if (password.length < 6) {
  console.log('❌ Password minimal harus 6 karakter!');
  process.exit(1);
}

// Ensure tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS admin_auth (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    salt TEXT NOT NULL,
    adminName TEXT DEFAULT 'Owner ChaizStore',
    failedAttempts INTEGER DEFAULT 0,
    lockedUntil INTEGER DEFAULT 0,
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    token TEXT PRIMARY KEY,
    adminId TEXT NOT NULL,
    username TEXT NOT NULL,
    adminName TEXT,
    expiresAt INTEGER NOT NULL,
    createdAt TEXT
  );
`);

const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
const now = new Date().toISOString();

const existing = db.prepare('SELECT id FROM admin_auth WHERE LOWER(username) = ?').get(username.toLowerCase());

if (existing) {
  db.prepare(`
    UPDATE admin_auth
    SET passwordHash = ?, salt = ?, adminName = ?, failedAttempts = 0, lockedUntil = 0, updatedAt = ?
    WHERE id = ?
  `).run(hash, salt, adminName, now, existing.id);
  console.log(`✅ [Database SQLite]: Kredensial akun admin "${username}" BERHASIL DIPERBARUI langsung ke database!`);
} else {
  // If replacing default admin_root
  const existingRoot = db.prepare("SELECT id FROM admin_auth WHERE id = 'admin_root'").get();
  if (existingRoot) {
    db.prepare(`
      UPDATE admin_auth
      SET username = ?, passwordHash = ?, salt = ?, adminName = ?, failedAttempts = 0, lockedUntil = 0, updatedAt = ?
      WHERE id = 'admin_root'
    `).run(username, hash, salt, adminName, now);
    console.log(`✅ [Database SQLite]: Akun admin berhasil diperbarui menjadi "${username}" langsung ke database!`);
  } else {
    db.prepare(`
      INSERT INTO admin_auth (id, username, passwordHash, salt, adminName, failedAttempts, lockedUntil, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)
    `).run('admin_root', username, hash, salt, adminName, now, now);
    console.log(`✅ [Database SQLite]: Akun admin "${username}" BERHASIL DIBUAT langsung ke database!`);
  }
}

// Invalidate old active sessions so old sessions cannot be used
db.exec('DELETE FROM admin_sessions');
console.log('🔒 Semua sesi login lama telah di-reset untuk keamanan.');
