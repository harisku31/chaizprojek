// ===================================================================
// CHAIZSTORE HIGH-PERFORMANCE SQL DATABASE ENGINE
// Powered by Node.js 24 Native SQLite (ACID, Zero-Config, Unlimited Speed)
// ===================================================================

import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import crypto from 'node:crypto';

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
    paymentStatus TEXT DEFAULT 'Pending',
    isGatewayPaid INTEGER DEFAULT 0,
    gatewayKey TEXT,
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
    rejectReason TEXT,
    rejectedAt TEXT,
    deliveryMethod TEXT DEFAULT 'web',
    customerNote TEXT,
    processedAt TEXT,
    rating INTEGER,
    isRead INTEGER DEFAULT 0,
    voucherCode TEXT,
    voucherDiscount REAL DEFAULT 0,
    voucherName TEXT,
    voucherDescription TEXT,
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

  CREATE TABLE IF NOT EXISTS deposits (
    id TEXT PRIMARY KEY,
    userId TEXT,
    userKey TEXT,
    userName TEXT,
    userEmail TEXT,
    userPhone TEXT,
    userPicture TEXT,
    amount REAL DEFAULT 0,
    creditedAmount REAL DEFAULT 0,
    totalPaid REAL DEFAULT 0,
    taxAmount REAL DEFAULT 100,
    paymentMethod TEXT,
    isGatewayPaid INTEGER DEFAULT 0,
    paymentId TEXT,
    proofImage TEXT,
    proofUrl TEXT,
    customerNote TEXT,
    status TEXT DEFAULT 'pending',
    adminNote TEXT,
    rejectionReason TEXT,
    approvedAt TEXT,
    approvedBy TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_trx_userEmail ON transactions (userEmail);
  CREATE INDEX IF NOT EXISTS idx_trx_userId ON transactions (userId);
  CREATE INDEX IF NOT EXISTS idx_trx_status ON transactions (status);
  CREATE INDEX IF NOT EXISTS idx_users_email ON registered_users (email);
  CREATE INDEX IF NOT EXISTS idx_dep_userEmail ON deposits (userEmail);
  CREATE INDEX IF NOT EXISTS idx_dep_userId ON deposits (userId);
  CREATE INDEX IF NOT EXISTS idx_dep_status ON deposits (status);

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

  CREATE INDEX IF NOT EXISTS idx_admin_user ON admin_auth (username);
  CREATE INDEX IF NOT EXISTS idx_admin_token ON admin_sessions (token);

  CREATE TABLE IF NOT EXISTS vouchers (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    discountAmount REAL NOT NULL DEFAULT 0,
    hasMinPurchase INTEGER DEFAULT 0,
    minPurchaseAmount REAL DEFAULT 0,
    type TEXT DEFAULT 'discount',
    isSingleUse INTEGER DEFAULT 1,
    isUsed INTEGER DEFAULT 0,
    usedAt TEXT,
    usedBy TEXT,
    usedOrder TEXT,
    isActive INTEGER DEFAULT 1,
    badge TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers (code);

  CREATE TABLE IF NOT EXISTS data_backups (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    reason TEXT DEFAULT 'manual',
    createdBy TEXT DEFAULT 'Admin ChaizStore',
    statsJson TEXT,
    payloadJson TEXT NOT NULL,
    createdAt TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_backups_createdAt ON data_backups (createdAt);
`);

// Migrasi aman kolom voucher pada database SQLite yang sudah ada sebelumnya
for (const colDef of [
  'voucherCode TEXT',
  'voucherDiscount REAL DEFAULT 0',
  'voucherName TEXT',
  'voucherDescription TEXT'
]) {
  try {
    db.exec(`ALTER TABLE transactions ADD COLUMN ${colDef};`);
  } catch (_) {}
}

// Inisialisasi kredensial admin dari environment variables server privat (.env)
// Password dan username TIDAK PERNAH ditulis dalam kode program.
try {
  const existingAdmin = db.prepare('SELECT id FROM admin_auth LIMIT 1').get();
  const envUser = process.env.ADMIN_USERNAME || process.env.ADMIN_INITIAL_USERNAME;
  const envPass = process.env.ADMIN_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD;

  if (!existingAdmin && envUser && envPass) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(String(envPass).trim(), salt, 100000, 64, 'sha512').toString('hex');
    db.prepare(`
      INSERT INTO admin_auth (id, username, passwordHash, salt, adminName, failedAttempts, lockedUntil, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)
    `).run(
      'admin_root',
      String(envUser).trim(),
      hash,
      salt,
      process.env.ADMIN_NAME || 'Owner ChaizStore',
      new Date().toISOString(),
      new Date().toISOString()
    );
    console.log('🔒 [Database Auth]: Admin credentials initialized securely from private server environment.');
  }
} catch (e) {
  console.error('[SQLite Admin Auth Init Error]:', e);
}

// Auto Migration: Ensure columns exist in existing SQLite database
try {
  const existingTrxCols = db.prepare('PRAGMA table_info(transactions)').all().map((c) => c.name);
  const ensureTrxCol = (col, typeDef) => {
    if (!existingTrxCols.includes(col)) {
      try {
        db.exec(`ALTER TABLE transactions ADD COLUMN ${col} ${typeDef};`);
      } catch (_) {}
    }
  };
  ensureTrxCol('paymentStatus', "TEXT DEFAULT 'Pending'");
  ensureTrxCol('isGatewayPaid', 'INTEGER DEFAULT 0');
  ensureTrxCol('gatewayKey', 'TEXT');
  ensureTrxCol('rejectReason', 'TEXT');
  ensureTrxCol('rejectedAt', 'TEXT');
  ensureTrxCol('deliveryMethod', "TEXT DEFAULT 'web'");
  ensureTrxCol('customerNote', 'TEXT');
} catch (migErr) {
  console.warn('⚠️ [Migration Warning]:', migErr.message);
}

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
    WHERE userId = ? OR userKey = ? OR LOWER(TRIM(COALESCE(userEmail, ''))) = ? OR LOWER(TRIM(COALESCE(customerEmail, ''))) = ? OR id = ?
    ORDER BY createdAt DESC
  `);
  const rows = stmt.all(userKeyOrEmail, userKeyOrEmail, clean, clean, userKeyOrEmail);
  return rows.map(formatTrxRow);
}

export function getTransactionById(id) {
  const stmt = db.prepare('SELECT * FROM transactions WHERE id = ?');
  const row = stmt.get(id);
  return row ? formatTrxRow(row) : null;
}

export function saveTransaction(trx) {
  if (!trx) return null;
  const now = new Date().toISOString();
  const id = trx.id || `TRX-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const credsStr = typeof trx.credentials === 'object' ? JSON.stringify(trx.credentials) : (trx.credentials || '{}');

  const stmt = db.prepare(`
    INSERT INTO transactions (
      id, productId, userId, userKey, userEmail, customerUsername, customerName,
      customerEmail, customerPhone, productName, productDuration, productCategory,
      price, qty, total, paymentMethod, paymentStatus, isGatewayPaid, gatewayKey,
      proofUrl, proofFileName, proofSize, proofUploadedAt, proofExpiresAt, proofExpired, proofDeletedReason,
      warrantyPeriod, status, credentials, adminNote, rejectReason, rejectedAt,
      deliveryMethod, customerNote, processedAt, rating, isRead,
      voucherCode, voucherDiscount, voucherName, voucherDescription,
      createdAt, updatedAt
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?
    )
    ON CONFLICT(id) DO UPDATE SET
      productId = COALESCE(excluded.productId, transactions.productId),
      userId = COALESCE(excluded.userId, transactions.userId),
      userKey = COALESCE(excluded.userKey, transactions.userKey),
      userEmail = COALESCE(excluded.userEmail, transactions.userEmail),
      customerUsername = COALESCE(excluded.customerUsername, transactions.customerUsername),
      customerName = COALESCE(excluded.customerName, transactions.customerName),
      customerEmail = COALESCE(excluded.customerEmail, transactions.customerEmail),
      customerPhone = COALESCE(excluded.customerPhone, transactions.customerPhone),
      productName = COALESCE(excluded.productName, transactions.productName),
      productDuration = COALESCE(excluded.productDuration, transactions.productDuration),
      productCategory = COALESCE(excluded.productCategory, transactions.productCategory),
      price = COALESCE(excluded.price, transactions.price),
      qty = COALESCE(excluded.qty, transactions.qty),
      total = COALESCE(excluded.total, transactions.total),
      paymentMethod = COALESCE(excluded.paymentMethod, transactions.paymentMethod),
      paymentStatus = COALESCE(excluded.paymentStatus, transactions.paymentStatus),
      isGatewayPaid = COALESCE(excluded.isGatewayPaid, transactions.isGatewayPaid),
      gatewayKey = COALESCE(excluded.gatewayKey, transactions.gatewayKey),
      proofUrl = excluded.proofUrl,
      proofFileName = COALESCE(excluded.proofFileName, transactions.proofFileName),
      proofSize = COALESCE(excluded.proofSize, transactions.proofSize),
      proofExpired = COALESCE(excluded.proofExpired, transactions.proofExpired),
      proofDeletedReason = COALESCE(excluded.proofDeletedReason, transactions.proofDeletedReason),
      warrantyPeriod = COALESCE(excluded.warrantyPeriod, transactions.warrantyPeriod),
      status = excluded.status,
      credentials = excluded.credentials,
      adminNote = excluded.adminNote,
      rejectReason = excluded.rejectReason,
      rejectedAt = excluded.rejectedAt,
      deliveryMethod = COALESCE(excluded.deliveryMethod, transactions.deliveryMethod),
      customerNote = COALESCE(excluded.customerNote, transactions.customerNote),
      processedAt = COALESCE(excluded.processedAt, transactions.processedAt),
      rating = COALESCE(excluded.rating, transactions.rating),
      isRead = COALESCE(excluded.isRead, transactions.isRead),
      voucherCode = COALESCE(excluded.voucherCode, transactions.voucherCode),
      voucherDiscount = COALESCE(excluded.voucherDiscount, transactions.voucherDiscount),
      voucherName = COALESCE(excluded.voucherName, transactions.voucherName),
      voucherDescription = COALESCE(excluded.voucherDescription, transactions.voucherDescription),
      updatedAt = excluded.updatedAt
  `);

  stmt.run(
    id,
    trx.productId || null,
    trx.userId || trx.userKey || null,
    trx.userKey || trx.userId || null,
    trx.userEmail || null,
    trx.customerUsername || '',
    trx.customerName || 'Pelanggan Chaiz',
    trx.customerEmail || '-',
    trx.customerPhone || '-',
    trx.productName || 'Produk Digital',
    trx.productDuration || 'Reguler',
    trx.productCategory || 'Akun Premium',
    trx.price || 0,
    trx.qty || 1,
    trx.total !== undefined && trx.total !== null ? trx.total : (trx.price ? trx.price * (trx.qty || 1) : 0),
    trx.paymentMethod || 'QRIS Instant',
    trx.paymentStatus || (trx.status === 'completed' ? 'Lunas' : 'Pending'),
    trx.isGatewayPaid ? 1 : 0,
    trx.gatewayKey || null,
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
    trx.rejectReason || null,
    trx.rejectedAt || null,
    trx.deliveryMethod || 'web',
    trx.customerNote || '',
    trx.processedAt || null,
    trx.rating || null,
    trx.isRead ? 1 : 0,
    trx.voucherCode || null,
    Number(trx.voucherDiscount) || 0,
    trx.voucherName || null,
    trx.voucherDescription || null,
    trx.createdAt || now,
    now
  );

  return getTransactionById(id);
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
    isGatewayPaid: Boolean(row.isGatewayPaid),
    proofExpired: Boolean(row.proofExpired),
    isRead: Boolean(row.isRead),
    credentials,
    paymentStatus: row.paymentStatus || (row.status === 'completed' ? 'Lunas' : 'Pending'),
    rejectReason: row.rejectReason || null,
    rejectedAt: row.rejectedAt || null,
    deliveryMethod: row.deliveryMethod || 'web',
    customerNote: row.customerNote || '',
    voucherCode: row.voucherCode || null,
    voucherDiscount: Number(row.voucherDiscount) || 0,
    voucherName: row.voucherName || null,
    voucherDescription: row.voucherDescription || null
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
  if (!u || (!u.id && !u.userId)) return null;
  const id = u.id || u.userId;
  const existing = getUserById(id);
  const merged = existing ? { ...existing, ...u } : u;

  const now = new Date().toISOString();
  const banStr = typeof merged.banStatus === 'object' ? JSON.stringify(merged.banStatus) : (merged.banStatus || null);

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
      name = COALESCE(excluded.name, registered_users.name),
      email = COALESCE(excluded.email, registered_users.email),
      picture = COALESCE(excluded.picture, registered_users.picture),
      sessionStatus = COALESCE(excluded.sessionStatus, registered_users.sessionStatus),
      lastHeartbeat = COALESCE(excluded.lastHeartbeat, registered_users.lastHeartbeat),
      lastActiveTime = COALESCE(excluded.lastActiveTime, registered_users.lastActiveTime),
      loginCount = COALESCE(excluded.loginCount, registered_users.loginCount),
      activitiesCount = COALESCE(excluded.activitiesCount, registered_users.activitiesCount),
      deviceType = COALESCE(excluded.deviceType, registered_users.deviceType),
      os = COALESCE(excluded.os, registered_users.os),
      isMobile = COALESCE(excluded.isMobile, registered_users.isMobile),
      browser = COALESCE(excluded.browser, registered_users.browser),
      banStatus = excluded.banStatus,
      lastActivitySummary = COALESCE(excluded.lastActivitySummary, registered_users.lastActivitySummary),
      updatedAt = excluded.updatedAt
  `);

  stmt.run(
    id,
    merged.name || 'Pengguna Chaiz',
    merged.email || null,
    merged.picture || null,
    merged.sessionStatus || 'logged_in',
    merged.lastHeartbeat || Date.now(),
    merged.firstLoginTime || now,
    merged.lastActiveTime || now,
    merged.loginCount || 1,
    merged.activitiesCount || 0,
    merged.deviceType || 'Laptop / PC Desktop',
    merged.os || 'Windows',
    merged.isMobile ? 1 : 0,
    merged.browser || 'Google Chrome',
    banStr,
    merged.lastActivitySummary || 'Login ke toko',
    merged.createdAt || now,
    now
  );

  return getUserById(id);
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
  const id = v.id || v.userId;
  if (!id) return null;

  const now = new Date().toISOString();
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
      name = COALESCE(excluded.name, permanent_visits.name),
      email = COALESCE(excluded.email, permanent_visits.email),
      lastActiveAt = excluded.lastActiveAt,
      totalVisitsCount = excluded.totalVisitsCount,
      device = COALESCE(excluded.device, permanent_visits.device),
      isMobile = excluded.isMobile,
      os = COALESCE(excluded.os, permanent_visits.os),
      browser = COALESCE(excluded.browser, permanent_visits.browser),
      currentActivity = COALESCE(excluded.currentActivity, permanent_visits.currentActivity),
      banStatus = COALESCE(excluded.banStatus, permanent_visits.banStatus),
      activityHistory = COALESCE(excluded.activityHistory, permanent_visits.activityHistory),
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

// ===================================================================
// DEPOSIT REPOSITORY FUNCTIONS (CHAIZMONEY)
// ===================================================================

function formatDepositRow(r) {
  if (!r) return null;
  return {
    ...r,
    amount: Number(r.amount) || 0,
    creditedAmount: Number(r.creditedAmount) || Number(r.amount) || 0,
    totalPaid: Number(r.totalPaid) || Number(r.amount) || 0,
    taxAmount: Number(r.taxAmount) || 100,
    isGatewayPaid: Boolean(r.isGatewayPaid)
  };
}

export function getAllDeposits() {
  const stmt = db.prepare('SELECT * FROM deposits ORDER BY createdAt DESC');
  const rows = stmt.all();
  return rows.map(formatDepositRow);
}

export function getDepositsByUser(userEmailOrId) {
  if (!userEmailOrId) return [];
  const clean = String(userEmailOrId).toLowerCase().trim();
  const stmt = db.prepare(`
    SELECT * FROM deposits
    WHERE LOWER(userEmail) = ? OR userId = ? OR userKey = ?
    ORDER BY createdAt DESC
  `);
  const rows = stmt.all(clean, clean, clean);
  return rows.map(formatDepositRow);
}

export function getDepositById(id) {
  if (!id) return null;
  const stmt = db.prepare('SELECT * FROM deposits WHERE id = ? LIMIT 1');
  const row = stmt.get(id);
  return row ? formatDepositRow(row) : null;
}

export function saveDeposit(d) {
  const now = new Date().toISOString();
  const id = d.id || `DEP-${Date.now().toString().slice(-6)}`;

  const stmt = db.prepare(`
    INSERT INTO deposits (
      id, userId, userKey, userName, userEmail, userPhone, userPicture,
      amount, creditedAmount, totalPaid, taxAmount, paymentMethod, isGatewayPaid,
      paymentId, proofImage, proofUrl, customerNote, status, adminNote,
      rejectionReason, approvedAt, approvedBy, createdAt, updatedAt
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
    ON CONFLICT(id) DO UPDATE SET
      userName = COALESCE(excluded.userName, deposits.userName),
      userPhone = COALESCE(excluded.userPhone, deposits.userPhone),
      amount = COALESCE(excluded.amount, deposits.amount),
      creditedAmount = COALESCE(excluded.creditedAmount, deposits.creditedAmount),
      totalPaid = COALESCE(excluded.totalPaid, deposits.totalPaid),
      taxAmount = COALESCE(excluded.taxAmount, deposits.taxAmount),
      paymentMethod = COALESCE(excluded.paymentMethod, deposits.paymentMethod),
      isGatewayPaid = COALESCE(excluded.isGatewayPaid, deposits.isGatewayPaid),
      paymentId = COALESCE(excluded.paymentId, deposits.paymentId),
      proofImage = COALESCE(excluded.proofImage, deposits.proofImage),
      proofUrl = COALESCE(excluded.proofUrl, deposits.proofUrl),
      customerNote = COALESCE(excluded.customerNote, deposits.customerNote),
      status = excluded.status,
      adminNote = COALESCE(excluded.adminNote, deposits.adminNote),
      rejectionReason = COALESCE(excluded.rejectionReason, deposits.rejectionReason),
      approvedAt = COALESCE(excluded.approvedAt, deposits.approvedAt),
      approvedBy = COALESCE(excluded.approvedBy, deposits.approvedBy),
      updatedAt = excluded.updatedAt
  `);

  stmt.run(
    id,
    d.userId || id,
    d.userKey || d.userId || id,
    d.userName || 'Pengguna',
    (d.userEmail || '').toLowerCase().trim(),
    d.userPhone || '',
    d.userPicture || null,
    Number(d.amount) || 0,
    Number(d.creditedAmount) || Number(d.amount) || 0,
    Number(d.totalPaid) || Number(d.amount) || 0,
    Number(d.taxAmount) || 100,
    d.paymentMethod || 'JansPayment Gateway (Realtime QRIS)',
    d.isGatewayPaid ? 1 : 0,
    d.paymentId || '',
    d.proofImage || null,
    d.proofUrl || null,
    d.customerNote || '',
    d.status || 'pending',
    d.adminNote || '',
    d.rejectionReason || null,
    d.approvedAt || null,
    d.approvedBy || null,
    d.createdAt || now,
    now
  );

  return getDepositById(id);
}

export function updateDeposit(id, patch) {
  const existing = getDepositById(id);
  if (!existing) return null;

  const updated = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString()
  };

  saveDeposit(updated);
  return getDepositById(id);
}

export function deleteDeposit(id) {
  const stmt = db.prepare('DELETE FROM deposits WHERE id = ?');
  stmt.run(id);
  return true;
}

export function clearDeposits() {
  db.exec('DELETE FROM deposits');
  return true;
}

// ===================================================================
// ADMIN SQL DATABASE AUTHENTICATION & SESSION MANAGEMENT
// Cryptographic PBKDF2 Hashing (100k rounds, SHA-512) & Brute-Force Shield
// ===================================================================

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(String(password), String(salt), 100000, 64, 'sha512').toString('hex');
}

export function verifyAdminLogin(username, password) {
  const cleanUser = String(username || '').trim().toLowerCase();
  const row = db.prepare('SELECT * FROM admin_auth WHERE LOWER(username) = ?').get(cleanUser);
  if (!row) {
    return { success: false, reason: 'Kredensial admin tidak valid!' };
  }

  const now = Date.now();
  if (row.lockedUntil && row.lockedUntil > now) {
    const remainingSecs = Math.ceil((row.lockedUntil - now) / 1000);
    return {
      success: false,
      reason: `Akun admin terkunci sementara karena percobaan gagal berulang. Coba lagi dalam ${remainingSecs} detik.`
    };
  }

  const testHash = hashPassword(password, row.salt);
  let isMatch = false;
  try {
    isMatch = crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(row.passwordHash, 'hex'));
  } catch (_) {
    isMatch = false;
  }

  if (!isMatch) {
    const newAttempts = (row.failedAttempts || 0) + 1;
    let lockTime = 0;
    if (newAttempts >= 5) {
      lockTime = now + 5 * 60 * 1000; // 5 minute lock
    }
    db.prepare('UPDATE admin_auth SET failedAttempts = ?, lockedUntil = ? WHERE id = ?').run(newAttempts, lockTime, row.id);
    return { success: false, reason: 'Username atau password admin salah! Periksa kembali huruf besar/kecil.' };
  }

  // Reset failed attempts on success
  db.prepare('UPDATE admin_auth SET failedAttempts = 0, lockedUntil = 0 WHERE id = ?').run(row.id);

  // Generate secure session token
  const token = 'adm_sess_' + crypto.randomBytes(32).toString('hex');
  const expiresAt = now + 30 * 24 * 3600 * 1000; // 30 hari
  db.prepare(`
    INSERT INTO admin_sessions (token, adminId, username, adminName, expiresAt, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(token, row.id, row.username, row.adminName || 'Owner ChaizStore', expiresAt, new Date().toISOString());

  return {
    success: true,
    token,
    admin: {
      username: row.username,
      adminName: row.adminName || 'Owner ChaizStore'
    }
  };
}

export function verifyAdminSessionToken(token) {
  if (!token) return null;
  const cleanToken = String(token).trim();
  const now = Date.now();
  const row = db.prepare('SELECT * FROM admin_sessions WHERE token = ? AND expiresAt > ?').get(cleanToken, now);
  if (!row) return null;
  return {
    valid: true,
    token: row.token,
    username: row.username,
    adminName: row.adminName
  };
}

export function deleteAdminSession(token) {
  if (!token) return;
  db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(String(token).trim());
}

export function updateAdminPasswordInDb(token, oldPassword, newUsername, newPassword) {
  const session = verifyAdminSessionToken(token);
  if (!session) {
    return { success: false, reason: 'Sesi admin tidak valid atau sudah kedaluwarsa. Silakan login kembali.' };
  }

  const row = db.prepare('SELECT * FROM admin_auth WHERE LOWER(username) = ?').get(session.username.toLowerCase());
  if (!row) {
    return { success: false, reason: 'Data admin tidak ditemukan di database server!' };
  }

  const testHash = hashPassword(oldPassword, row.salt);
  let isMatch = false;
  try {
    isMatch = crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(row.passwordHash, 'hex'));
  } catch (_) {
    isMatch = false;
  }

  if (!isMatch) {
    return { success: false, reason: 'Password lama tidak sesuai!' };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, reason: 'Password baru minimal harus 6 karakter!' };
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  const newHash = hashPassword(newPassword, newSalt);
  const finalUsername = (newUsername || row.username).trim();

  db.prepare(`
    UPDATE admin_auth
    SET username = ?, passwordHash = ?, salt = ?, updatedAt = ?
    WHERE id = ?
  `).run(finalUsername, newHash, newSalt, new Date().toISOString(), row.id);

  db.prepare('UPDATE admin_sessions SET username = ? WHERE adminId = ?').run(finalUsername, row.id);

  return {
    success: true,
    admin: {
      username: finalUsername,
      adminName: row.adminName
    }
  };
}

// ===================================================================
// VOUCHERS REPOSITORY (GUDANG VOUCHER 1X PAKAI LANGSUNG HANGUS)
// ===================================================================

function formatVoucherRow(row) {
  if (!row) return null;
  const isUsed = Boolean(row.isUsed);
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description || '',
    discountAmount: Number(row.discountAmount) || 0,
    hasMinPurchase: Boolean(row.hasMinPurchase),
    minPurchaseAmount: Number(row.minPurchaseAmount) || 0,
    type: row.type || 'discount',
    isSingleUse: row.isSingleUse !== 0,
    isUsed,
    usedAt: row.usedAt || null,
    usedBy: row.usedBy || null,
    usedOrder: row.usedOrder || null,
    isActive: isUsed ? false : Boolean(row.isActive),
    badge: row.badge || `Diskon Rp ${(Number(row.discountAmount) || 0).toLocaleString('id-ID')}`,
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null
  };
}

export function getAllVouchers() {
  const rows = db.prepare('SELECT * FROM vouchers ORDER BY createdAt DESC').all();
  return rows.map(formatVoucherRow);
}

export function getVoucherByIdOrCode(idOrCode) {
  if (!idOrCode) return null;
  const raw = String(idOrCode).trim();
  const cleanCode = raw.toUpperCase().replace(/\s+/g, '');
  const row = db.prepare('SELECT * FROM vouchers WHERE id = ? OR UPPER(code) = ? LIMIT 1').get(raw, cleanCode);
  return formatVoucherRow(row);
}

export function saveVoucher(v) {
  if (!v || !v.code) return null;
  const cleanCode = String(v.code).trim().toUpperCase().replace(/\s+/g, '');
  if (!cleanCode) return null;

  const now = new Date().toISOString();
  const existingByCode = db.prepare('SELECT * FROM vouchers WHERE UPPER(code) = ? LIMIT 1').get(cleanCode);
  const existingById = v.id ? db.prepare('SELECT * FROM vouchers WHERE id = ? LIMIT 1').get(v.id) : null;
  const existing = existingById || existingByCode;

  // Replace stale code record if Admin explicitly re-issued the same code with a new ID
  if (existingByCode && v.id && existingByCode.id !== v.id && !v.preserveExisting) {
    db.prepare('DELETE FROM vouchers WHERE id = ?').run(existingByCode.id);
  }

  const id = v.id || existing?.id || `vch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const isUsed = v.isUsed !== undefined ? Boolean(v.isUsed) : Boolean(existing?.isUsed);
  const isActive = isUsed ? false : (v.isActive !== undefined ? Boolean(v.isActive) : (existing ? Boolean(existing.isActive) : true));
  const discountAmount = Number(v.discountAmount ?? existing?.discountAmount) || 0;
  const hasMinPurchase = v.hasMinPurchase !== undefined ? Boolean(v.hasMinPurchase) : Boolean(existing?.hasMinPurchase);
  const minPurchaseAmount = hasMinPurchase ? (Number(v.minPurchaseAmount ?? existing?.minPurchaseAmount) || 20000) : 0;

  db.prepare(`
    INSERT INTO vouchers (
      id, code, name, description, discountAmount, hasMinPurchase, minPurchaseAmount,
      type, isSingleUse, isUsed, usedAt, usedBy, usedOrder, isActive, badge, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      code = excluded.code,
      name = excluded.name,
      description = excluded.description,
      discountAmount = excluded.discountAmount,
      hasMinPurchase = excluded.hasMinPurchase,
      minPurchaseAmount = excluded.minPurchaseAmount,
      type = excluded.type,
      isSingleUse = excluded.isSingleUse,
      isUsed = CASE WHEN vouchers.isUsed = 1 AND excluded.isUsed = 0 AND excluded.createdAt = vouchers.createdAt THEN 1 ELSE excluded.isUsed END,
      usedAt = COALESCE(excluded.usedAt, vouchers.usedAt),
      usedBy = COALESCE(excluded.usedBy, vouchers.usedBy),
      usedOrder = COALESCE(excluded.usedOrder, vouchers.usedOrder),
      isActive = CASE WHEN vouchers.isUsed = 1 AND excluded.isUsed = 0 AND excluded.createdAt = vouchers.createdAt THEN 0 ELSE excluded.isActive END,
      badge = excluded.badge,
      updatedAt = excluded.updatedAt
  `).run(
    id,
    cleanCode,
    String(v.name || existing?.name || `Diskon Rp ${discountAmount.toLocaleString('id-ID')}`).trim(),
    String(v.description ?? existing?.description ?? '').trim(),
    discountAmount,
    hasMinPurchase ? 1 : 0,
    minPurchaseAmount,
    v.type || existing?.type || 'discount',
    v.isSingleUse === false ? 0 : 1,
    isUsed ? 1 : 0,
    v.usedAt || existing?.usedAt || null,
    v.usedBy || existing?.usedBy || null,
    v.usedOrder || existing?.usedOrder || null,
    isActive ? 1 : 0,
    v.badge || existing?.badge || `Diskon Rp ${discountAmount.toLocaleString('id-ID')}`,
    v.createdAt || existing?.createdAt || now,
    now
  );

  return getVoucherByIdOrCode(id);
}

export function redeemVoucherAtomic(idOrCode, userEmail = 'Pelanggan', orderId = '') {
  if (!idOrCode) return { success: false, reason: 'INVALID_CODE' };
  const existing = getVoucherByIdOrCode(idOrCode);
  if (!existing) {
    return { success: false, reason: 'NOT_FOUND' };
  }
  if (existing.isUsed) {
    return { success: false, reason: 'ALREADY_USED', voucher: existing };
  }
  if (existing.isActive === false) {
    return { success: false, reason: 'INACTIVE', voucher: existing };
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE vouchers
    SET isUsed = 1, isActive = 0, usedAt = ?, usedBy = ?, usedOrder = ?, updatedAt = ?
    WHERE id = ?
  `).run(now, userEmail || 'Pelanggan', orderId || '', now, existing.id);

  return {
    success: true,
    voucher: getVoucherByIdOrCode(existing.id)
  };
}

export function toggleVoucherActiveInDb(idOrCode) {
  const existing = getVoucherByIdOrCode(idOrCode);
  if (!existing) return null;
  if (existing.isUsed) return existing; // 1x pakai hangus tidak bisa diaktifkan lagi

  const now = new Date().toISOString();
  const nextActive = existing.isActive ? 0 : 1;
  db.prepare('UPDATE vouchers SET isActive = ?, updatedAt = ? WHERE id = ?').run(nextActive, now, existing.id);
  return getVoucherByIdOrCode(existing.id);
}

export function deleteVoucherInDb(idOrCode) {
  if (!idOrCode) return false;
  const raw = String(idOrCode).trim();
  const cleanCode = raw.toUpperCase().replace(/\s+/g, '');
  const info = db.prepare('DELETE FROM vouchers WHERE id = ? OR UPPER(code) = ?').run(raw, cleanCode);
  return info.changes > 0;
}

export function clearUsedVouchersInDb() {
  const info = db.prepare('DELETE FROM vouchers WHERE isUsed = 1').run();
  return info.changes;
}

// ===================================================================
// DATA BACKUPS & RESTORE REPOSITORY (ANTI-HILANG SAAT RESET DATA)
// ===================================================================

function formatBackupMeta(row) {
  if (!row) return null;
  let stats = {};
  try {
    stats = row.statsJson ? JSON.parse(row.statsJson) : {};
  } catch {
    stats = {};
  }
  return {
    id: row.id,
    label: row.label,
    reason: row.reason || 'manual',
    createdBy: row.createdBy || 'Admin ChaizStore',
    stats,
    createdAt: row.createdAt
  };
}

export function getAllBackupsMeta() {
  const rows = db.prepare('SELECT id, label, reason, createdBy, statsJson, createdAt FROM data_backups ORDER BY createdAt DESC LIMIT 50').all();
  return rows.map(formatBackupMeta);
}

export function getBackupSnapshotById(id) {
  if (!id) return null;
  const row = db.prepare('SELECT * FROM data_backups WHERE id = ?').get(String(id));
  if (!row) return null;
  let data = {};
  try {
    data = row.payloadJson ? JSON.parse(row.payloadJson) : {};
  } catch {
    data = {};
  }
  return {
    ...formatBackupMeta(row),
    data
  };
}

export function saveBackupSnapshot({ id, label, reason = 'manual', createdBy = 'Admin ChaizStore', stats = {}, data = {}, createdAt }) {
  const finalId = id || `BKP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const finalCreatedAt = createdAt || new Date().toISOString();
  const payloadStr = JSON.stringify(data || {});
  const statsStr = JSON.stringify(stats || {});

  db.prepare(`
    INSERT INTO data_backups (id, label, reason, createdBy, statsJson, payloadJson, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      label = excluded.label,
      reason = excluded.reason,
      createdBy = excluded.createdBy,
      statsJson = excluded.statsJson,
      payloadJson = excluded.payloadJson,
      createdAt = excluded.createdAt
  `).run(finalId, String(label || 'Backup Data ChaizStore'), String(reason), String(createdBy), statsStr, payloadStr, finalCreatedAt);

  return getBackupSnapshotById(finalId);
}

export function deleteBackupSnapshotById(id) {
  if (!id) return false;
  const info = db.prepare('DELETE FROM data_backups WHERE id = ?').run(String(id));
  return info.changes > 0;
}

export function restoreDataIntoDb(payload = {}) {
  const data = payload?.data || payload || {};
  const counts = {
    users: 0,
    transactions: 0,
    deposits: 0,
    vouchers: 0,
    activities: 0,
    visits: 0
  };

  if (Array.isArray(data.registered_users)) {
    data.registered_users.forEach((u) => {
      if (u && (u.id || u.userId)) {
        saveUser(u);
        counts.users++;
      }
    });
  }
  if (Array.isArray(data.transactions)) {
    data.transactions.forEach((t) => {
      if (t && t.id) {
        saveTransaction(t);
        counts.transactions++;
      }
    });
  }
  if (Array.isArray(data.deposits)) {
    data.deposits.forEach((d) => {
      if (d && d.id) {
        saveDeposit(d);
        counts.deposits++;
      }
    });
  }
  if (Array.isArray(data.vouchers)) {
    data.vouchers.forEach((v) => {
      if (v && v.code) {
        saveVoucher({ ...v, preserveExisting: true });
        counts.vouchers++;
      }
    });
  }
  if (Array.isArray(data.activity_logs)) {
    data.activity_logs.forEach((a) => {
      if (a && a.id) {
        saveActivity(a);
        counts.activities++;
      }
    });
  }
  if (Array.isArray(data.permanent_visits)) {
    data.permanent_visits.forEach((v) => {
      if (v && (v.id || v.userId)) {
        saveVisit(v);
        counts.visits++;
      }
    });
  }

  return counts;
}
