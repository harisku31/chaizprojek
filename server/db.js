// ===================================================================
// CHAIZSTORE HIGH-PERFORMANCE SQL DATABASE ENGINE
// Powered by Node.js 24 Native SQLite (ACID, Zero-Config, Unlimited Speed)
// ===================================================================

import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'chaizstore.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys for maximum throughput & 60fps performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA synchronous = NORMAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize Tables Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    productId TEXT,
    userId TEXT,
    userKey TEXT,
    userEmail TEXT,
    customerUsername TEXT,
    customerName TEXT,
    customerEmail TEXT,
    customerPhone TEXT,
    productName TEXT NOT NULL,
    productDuration TEXT,
    productCategory TEXT,
    price REAL DEFAULT 0,
    qty INTEGER DEFAULT 1,
    total REAL DEFAULT 0,
    paymentMethod TEXT,
    proofUrl TEXT,
    proofFileName TEXT,
    proofSize TEXT,
    proofUploadedAt TEXT,
    proofExpiresAt TEXT,
    proofExpired INTEGER DEFAULT 0,
    proofDeletedReason TEXT,
    warrantyPeriod TEXT,
    status TEXT DEFAULT 'processing',
    credentials TEXT, -- JSON string: { account, password, username, pin, profile, code }
    adminNote TEXT,
    processedAt TEXT,
    rating INTEGER,
    isRead INTEGER DEFAULT 0,
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS registered_users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    picture TEXT,
    sessionStatus TEXT DEFAULT 'logged_in',
    lastHeartbeat INTEGER,
    firstLoginTime TEXT,
    lastActiveTime TEXT,
    loginCount INTEGER DEFAULT 1,
    activitiesCount INTEGER DEFAULT 0,
    deviceType TEXT,
    os TEXT,
    isMobile INTEGER DEFAULT 0,
    browser TEXT,
    banStatus TEXT, -- JSON string
    lastActivitySummary TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    userId TEXT,
    userName TEXT,
    userEmail TEXT,
    actionType TEXT,
    description TEXT,
    device TEXT,
    ipAddress TEXT,
    timestamp TEXT
  );

  CREATE TABLE IF NOT EXISTS permanent_visits (
    id TEXT PRIMARY KEY,
    userId TEXT,
    name TEXT,
    email TEXT,
    firstVisitedAt TEXT,
    lastActiveAt TEXT,
    totalVisitsCount INTEGER DEFAULT 1,
    device TEXT,
    isMobile INTEGER DEFAULT 0,
    os TEXT,
    browser TEXT,
    currentActivity TEXT,
    banStatus TEXT, -- JSON
    activityHistory TEXT, -- JSON
    lastHeartbeat INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_trx_userEmail ON transactions (userEmail);
  CREATE INDEX IF NOT EXISTS idx_trx_userId ON transactions (userId);
  CREATE INDEX IF NOT EXISTS idx_trx_status ON transactions (status);
  CREATE INDEX IF NOT EXISTS idx_users_email ON registered_users (email);
`);

console.log('✅ [Database Engine]: SQLite Relational Database Connected at', dbPath);

// ===================================================================
// TRANSACTION REPOSITORY FUNCTIONS
// ===================================================================

export function getAllTransactions() {
  const stmt = db.prepare('SELECT * FROM transactions ORDER BY createdAt DESC');
  const rows = stmt.all();
  return rows.map(formatTrxRow);
}

export function getTransactionsByUser(userKeyOrEmail) {
  if (!userKeyOrEmail) return [];
  const clean = userKeyOrEmail.toLowerCase().trim();
  const stmt = db.prepare(`
    SELECT * FROM transactions 
    WHERE userId = ? OR userKey = ? OR LOWER(TRIM(userEmail)) = ? OR LOWER(TRIM(customerEmail)) = ?
    ORDER BY createdAt DESC
  `);
  const rows = stmt.all(userKeyOrEmail, userKeyOrEmail, clean, clean);
  return rows.map(formatTrxRow);
}

export function getTransactionById(id) {
  const stmt = db.prepare('SELECT * FROM transactions WHERE id = ?');
  const row = stmt.get(id);
  return row ? formatTrxRow(row) : null;
}

export function saveTransaction(trx) {
  const now = new Date().toISOString();
  const credsStr = typeof trx.credentials === 'object' ? JSON.stringify(trx.credentials) : (trx.credentials || '{}');

  const stmt = db.prepare(`
    INSERT INTO transactions (
      id, productId, userId, userKey, userEmail, customerUsername, customerName,
      customerEmail, customerPhone, productName, productDuration, productCategory,
      price, qty, total, paymentMethod, proofUrl, proofFileName, proofSize,
      proofUploadedAt, proofExpiresAt, proofExpired, proofDeletedReason,
      warrantyPeriod, status, credentials, adminNote, processedAt, rating, isRead,
      createdAt, updatedAt
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?
    )
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      credentials = excluded.credentials,
      adminNote = excluded.adminNote,
      processedAt = excluded.processedAt,
      rating = excluded.rating,
      isRead = excluded.isRead,
      proofUrl = excluded.proofUrl,
      proofExpired = excluded.proofExpired,
      proofDeletedReason = excluded.proofDeletedReason,
      updatedAt = excluded.updatedAt
  `);

  stmt.run(
    trx.id,
    trx.productId || null,
    trx.userId || trx.userKey || null,
    trx.userKey || trx.userId || null,
    trx.userEmail || null,
    trx.customerUsername || '',
    trx.customerName || 'Pelanggan Chaiz',
    trx.customerEmail || '-',
    trx.customerPhone || '-',
    trx.productName,
    trx.productDuration || 'Reguler',
    trx.productCategory || 'Akun Premium',
    trx.price || 0,
    trx.qty || 1,
    trx.total || (trx.price ? trx.price * (trx.qty || 1) : 0),
    trx.paymentMethod || 'QRIS Instant',
    trx.proofUrl || null,
    trx.proofFileName || null,
    trx.proofSize || null,
    trx.proofUploadedAt || trx.createdAt || now,
    trx.proofExpiresAt || null,
    trx.proofExpired ? 1 : 0,
    trx.proofDeletedReason || null,
    trx.warrantyPeriod || 'Garansi Penuh',
    trx.status || 'processing',
    credsStr,
    trx.adminNote || '',
    trx.processedAt || null,
    trx.rating || null,
    trx.isRead ? 1 : 0,
    trx.createdAt || now,
    now
  );

  return getTransactionById(trx.id);
}

export function updateTransaction(id, patch) {
  const existing = getTransactionById(id);
  if (!existing) return null;

  const merged = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  return saveTransaction(merged);
}

export function deleteTransaction(id) {
  const stmt = db.prepare('DELETE FROM transactions WHERE id = ?');
  stmt.run(id);
  return true;
}

export function clearTransactions() {
  db.exec('DELETE FROM transactions');
  return true;
}

function formatTrxRow(row) {
  let credentials = {};
  try {
    credentials = row.credentials ? JSON.parse(row.credentials) : {};
  } catch {
    credentials = {};
  }

  return {
    ...row,
    price: Number(row.price) || 0,
    qty: Number(row.qty) || 1,
    total: Number(row.total) || 0,
    proofExpired: Boolean(row.proofExpired),
    isRead: Boolean(row.isRead),
    credentials
  };
}

// ===================================================================
// REGISTERED USERS REPOSITORY
// ===================================================================

export function getAllUsers() {
  const stmt = db.prepare('SELECT * FROM registered_users ORDER BY lastActiveTime DESC');
  const rows = stmt.all();
  return rows.map(formatUserRow);
}

export function getUserById(id) {
  const stmt = db.prepare('SELECT * FROM registered_users WHERE id = ?');
  const row = stmt.get(id);
  return row ? formatUserRow(row) : null;
}

export function saveUser(u) {
  const now = new Date().toISOString();
  const banStr = typeof u.banStatus === 'object' ? JSON.stringify(u.banStatus) : (u.banStatus || null);

  const stmt = db.prepare(`
    INSERT INTO registered_users (
      id, name, email, picture, sessionStatus, lastHeartbeat,
      firstLoginTime, lastActiveTime, loginCount, activitiesCount,
      deviceType, os, isMobile, browser, banStatus, lastActivitySummary,
      createdAt, updatedAt
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      email = excluded.email,
      picture = excluded.picture,
      sessionStatus = excluded.sessionStatus,
      lastHeartbeat = excluded.lastHeartbeat,
      lastActiveTime = excluded.lastActiveTime,
      loginCount = excluded.loginCount,
      activitiesCount = excluded.activitiesCount,
      deviceType = excluded.deviceType,
      os = excluded.os,
      isMobile = excluded.isMobile,
      browser = excluded.browser,
      banStatus = excluded.banStatus,
      lastActivitySummary = excluded.lastActivitySummary,
      updatedAt = excluded.updatedAt
  `);

  stmt.run(
    u.id,
    u.name || 'Pengguna Chaiz',
    u.email || null,
    u.picture || null,
    u.sessionStatus || 'logged_in',
    u.lastHeartbeat || Date.now(),
    u.firstLoginTime || now,
    u.lastActiveTime || now,
    u.loginCount || 1,
    u.activitiesCount || 0,
    u.deviceType || 'Laptop / PC Desktop',
    u.os || 'Windows',
    u.isMobile ? 1 : 0,
    u.browser || 'Google Chrome',
    banStr,
    u.lastActivitySummary || 'Login ke toko',
    u.createdAt || now,
    now
  );

  return getUserById(u.id);
}

export function deleteUser(id) {
  const stmt = db.prepare('DELETE FROM registered_users WHERE id = ?');
  stmt.run(id);
  return true;
}

function formatUserRow(row) {
  let banStatus = null;
  try {
    banStatus = row.banStatus ? JSON.parse(row.banStatus) : null;
  } catch {}

  return {
    ...row,
    isMobile: Boolean(row.isMobile),
    loginCount: Number(row.loginCount) || 1,
    activitiesCount: Number(row.activitiesCount) || 0,
    lastHeartbeat: Number(row.lastHeartbeat) || 0,
    banStatus
  };
}

// ===================================================================
// ACTIVITIES & VISITS REPOSITORY
// ===================================================================

export function getAllActivities(limit = 100) {
  const stmt = db.prepare('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT ?');
  return stmt.all(limit);
}

export function saveActivity(act) {
  const now = new Date().toISOString();
  const id = act.id || `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const stmt = db.prepare(`
    INSERT INTO activity_logs (id, userId, userName, userEmail, actionType, description, device, ipAddress, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `);

  stmt.run(
    id,
    act.userId || null,
    act.userName || 'Pengguna',
    act.userEmail || '-',
    act.actionType || 'ACTIVITY',
    act.description || '',
    act.device || 'Web Browser',
    act.ipAddress || '127.0.0.1',
    act.timestamp || now
  );

  return { ...act, id };
}

export function getAllVisits() {
  const stmt = db.prepare('SELECT * FROM permanent_visits ORDER BY lastActiveAt DESC');
  const rows = stmt.all();
  return rows.map((r) => {
    let banStatus = null;
    let activityHistory = [];
    try { banStatus = r.banStatus ? JSON.parse(r.banStatus) : null; } catch {}
    try { activityHistory = r.activityHistory ? JSON.parse(r.activityHistory) : []; } catch {}
    return {
      ...r,
      isMobile: Boolean(r.isMobile),
      totalVisitsCount: Number(r.totalVisitsCount) || 1,
      lastHeartbeat: Number(r.lastHeartbeat) || 0,
      banStatus,
      activityHistory
    };
  });
}

export function saveVisit(v) {
  const now = new Date().toISOString();
  const id = v.id || v.userId;
  if (!id) return null;

  const banStr = typeof v.banStatus === 'object' ? JSON.stringify(v.banStatus) : (v.banStatus || null);
  const actHistStr = Array.isArray(v.activityHistory) ? JSON.stringify(v.activityHistory) : '[]';

  const stmt = db.prepare(`
    INSERT INTO permanent_visits (
      id, userId, name, email, firstVisitedAt, lastActiveAt, totalVisitsCount,
      device, isMobile, os, browser, currentActivity, banStatus, activityHistory, lastHeartbeat
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      email = excluded.email,
      lastActiveAt = excluded.lastActiveAt,
      totalVisitsCount = excluded.totalVisitsCount,
      device = excluded.device,
      isMobile = excluded.isMobile,
      os = excluded.os,
      browser = excluded.browser,
      currentActivity = excluded.currentActivity,
      banStatus = excluded.banStatus,
      activityHistory = excluded.activityHistory,
      lastHeartbeat = excluded.lastHeartbeat
  `);

  stmt.run(
    id,
    v.userId || id,
    v.name || 'Pengunjung',
    v.email || '-',
    v.firstVisitedAt || now,
    v.lastActiveAt || now,
    v.totalVisitsCount || 1,
    v.device || 'Laptop / PC Desktop',
    v.isMobile ? 1 : 0,
    v.os || 'Windows',
    v.browser || 'Google Chrome',
    v.currentActivity || 'Mengunjungi Toko',
    banStr,
    actHistStr,
    v.lastHeartbeat || Date.now()
  );

  return v;
}
