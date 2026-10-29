// ===================================================================
// CHAIZSTORE TRANSACTIONS & REVIEWS ENGINE
// Realtime sync via Firebase Cloud Database + localStorage + BroadcastChannel
// PRIVATE USER DATABASE ARCHITECTURE: 1 Akun = 1 Riwayat Privat di Firebase
// ===================================================================

import {
  writeToFirebase,
  updateInFirebase,
  readFromFirebase,
  deleteFromFirebase,
  listenToFirebase
} from './firebase.js';
import {
  fetchUserTransactionsFromSql,
  fetchAllTransactionsFromSql,
  createTransactionInSql,
  updateTransactionInSql,
  deleteTransactionProofInSql,
  clearAllTransactionsInSql
} from './sqlApi.js';

const STORAGE_KEY_TRX = 'chaiz_transactions';
const STORAGE_KEY_USER_PREFIX = 'chaiz_user_trx_';
const STORAGE_KEY_REVIEWS = 'chaiz_customer_reviews';
const CHANNEL_NAME = 'chaiz_admin_sync';
const FIREBASE_PATH_TRX = 'transactions';
const FIREBASE_PATH_USER_TRX = 'user_transactions';
const FIREBASE_PATH_REVIEWS = 'customer_reviews';

// Database awal transaksi harus KOSONG (0 demo order) agar riwayat akun baru benar-benar bersih & privat
const INITIAL_TRANSACTIONS = [];

// Masa simpan bukti transfer: 2 Hari (48 Jam) dalam milidetik
export const PROOF_MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000;

// ===================================================================
// USER IDENTITY & PRIVACY HELPERS
// ===================================================================

/**
 * ID pesanan terbaru yang dibuat di perangkat ini (untuk notifikasi & sinkronisasi instan)
 */
export function getRecentOrderIds() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('chaiz_recent_order_ids');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentOrderId(id) {
  if (!id || typeof window === 'undefined') return;
  try {
    const existing = getRecentOrderIds();
    const updated = [id, ...existing.filter((x) => x !== id)].slice(0, 50);
    localStorage.setItem('chaiz_recent_order_ids', JSON.stringify(updated));
  } catch {}
}

/**
 * Generate atau ambil ID unik user yang konsisten berdasarkan email/ID
 */
export function getUniqueUserId(user) {
  if (!user) return `usr_${Date.now()}`;
  if (user.id && String(user.id).startsWith('usr_')) return user.id;
  const rawKey = (user.email || user.name || 'guest').toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < rawKey.length; i++) {
    hash = (hash << 5) - hash + rawKey.charCodeAt(i);
    hash |= 0;
  }
  return `usr_${Math.abs(hash).toString(36)}`;
}

/**
 * Mendapatkan User Key yang aman sebagai path node Firebase RTDB
 */
export function getUserKey(userOrEmail) {
  if (!userOrEmail) return null;
  if (typeof userOrEmail === 'string') {
    if (userOrEmail.startsWith('usr_')) return userOrEmail;
    return getUniqueUserId({ email: userOrEmail });
  }
  if (userOrEmail.id && String(userOrEmail.id).startsWith('usr_')) {
    return userOrEmail.id;
  }
  return getUniqueUserId(userOrEmail);
}

/**
 * Memeriksa apakah sebuah transaksi benar-benar milik user tertentu (Strict Isolation)
 */
export function isOrderOwnedByUser(trx, user) {
  if (!trx || !user) return false;
  const targetEmail = (user.email || '').toLowerCase().trim();
  const trxEmail = (trx.userEmail || trx.customerEmail || '').toLowerCase().trim();

  // ISOLASI KETAT PER AKUN (PRIORITAS EMAIL UTAMA):
  // Jika user yang login memiliki email (login Google / terdaftar):
  // HANYA pesanan dengan email yang sama persis yang diizinkan!
  if (targetEmail) {
    if (trxEmail && trxEmail !== '-' && trxEmail === targetEmail) {
      return true;
    }
    const targetId = user.id || getUserKey(user);
    if (targetId && (trx.userId === targetId || trx.userKey === targetId)) {
      if (!trxEmail || trxEmail === '-' || trxEmail === targetEmail) {
        return true;
      }
    }
    return false;
  }

  // Fallback hanya untuk akun non-email (member username)
  const targetId = user.id || getUserKey(user);
  if (targetId && (trx.userId === targetId || trx.userKey === targetId)) {
    return true;
  }

  return false;
}

/**
 * Cek apakah sebuah transaksi milik user aktif atau pernah dibuat di sesi perangkat ini
 */
export function isOrderBelongsToSession(trx, user) {
  if (!trx) return false;
  if (user && isOrderOwnedByUser(trx, user)) return true;
  const recentIds = getRecentOrderIds();
  if (recentIds.includes(trx.id)) return true;
  return false;
}

// Helper: Broadcast Channel & Custom Event
function broadcastSync(type, data) {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chaiz_trx_updated', { detail: { type, data } }));
      if ('BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel(CHANNEL_NAME);
          bc.postMessage({ type, data, timestamp: Date.now() });
          setTimeout(() => {
            try { bc.close(); } catch {}
          }, 200);
        } catch {}
      }
    }
  } catch (e) {
    // fallback
  }
}

// Helper: Hapus otomatis foto bukti yang sudah lewat dari 2 hari (48 jam)
function purgeExpiredProofs(list) {
  if (!Array.isArray(list)) return [];
  const now = Date.now();

  const sanitized = list.map((trx) => {
    if (trx && trx.proofUrl) {
      const uploadedTime = new Date(trx.proofUploadedAt || trx.createdAt).getTime();
      if (now - uploadedTime > PROOF_MAX_AGE_MS) {
        return {
          ...trx,
          proofUrl: null,
          proofExpired: true,
          proofDeletedReason: 'Foto bukti terhapus otomatis (masa simpan 2 hari telah berakhir)'
        };
      }
    }
    return trx;
  });

  return sanitized;
}

// ===================================================================
// 1. TRANSAKSI PRIVAT PER USER (1 USER = 1 RIWAYAT PRIVAT)
// ===================================================================

/**
 * Mengambil transaksi privat milik user yang sedang login
 * Riwayat akun baru dipastikan KOSONG (0 pesanan)
 */
export function getUserTransactions(user) {
  if (!user) return [];
  const key = getUserKey(user);
  if (!key) return [];

  let list = [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_USER_PREFIX}${key}`);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        list = parsed;
      }
    }
  } catch (e) {}

  // Buang data demo lama yang mungkin tersisa di cache
  list = list.filter((t) => t && t.id !== 'TRX-20261003-CANVA1' && t.id !== 'TRX-20261003-NETFLIX2');
  list = list.filter((t) => isOrderOwnedByUser(t, user));

  // Fallback: Jika storage privat kosong, periksa apakah ada pesanan milik user ini di cache umum
  if (list.length === 0) {
    const all = getTransactions();
    const matched = all.filter((t) => isOrderOwnedByUser(t, user));
    if (matched.length > 0) {
      list = matched;
      saveUserTransactions(user, list, { broadcast: false });
    }
  }

  return purgeExpiredProofs(list);
}

/**
 * Menyimpan transaksi privat user ke localStorage terisolasi
 * Mendukung options.broadcast = false untuk penyimpanan tenang tanpa memicu loop reload
 */
export function saveUserTransactions(user, transactions, options = { broadcast: true }) {
  if (!user) return;
  const key = getUserKey(user);
  if (!key) return;

  const sanitized = (transactions || []).filter(
    (t) => t && t.id !== 'TRX-20261003-CANVA1' && t.id !== 'TRX-20261003-NETFLIX2'
  );

  try {
    localStorage.setItem(`${STORAGE_KEY_USER_PREFIX}${key}`, JSON.stringify(sanitized));
  } catch (e) {
    try {
      const stripped = sanitized.map((t) => ({
        ...t,
        proofUrl: t.proofUrl && t.proofUrl.length > 500 ? null : t.proofUrl
      }));
      localStorage.setItem(`${STORAGE_KEY_USER_PREFIX}${key}`, JSON.stringify(stripped));
    } catch {}
  }

  const shouldBroadcast = options !== false && (typeof options !== 'object' || options.broadcast !== false);
  if (shouldBroadcast) {
    broadcastSync('USER_TRANSACTIONS_UPDATED', { userKey: key, count: sanitized.length });
  }
}

/**
 * Tarik data transaksi privat user langsung dari Firebase Cloud Database
 * Memastikan status riwayat privat database selalu sinkron tanpa lag
 * Dilengkapi Self-Healing Reconciliation antara Global & Privat
 */
export async function syncUserTransactionsFromCloud(user) {
  if (!user) return [];
  const key = getUserKey(user);
  if (!key) return [];

  // PRIORITAS 1: Tarik dari Database SQL (PHP + MySQL Backend) jika aktif
  // Server SQL menyaring dengan WHERE LOWER(user_email) = :email (100% isolasi per akun)
  if (user?.email) {
    try {
      const sqlList = await fetchUserTransactionsFromSql(user.email);
      if (Array.isArray(sqlList) && sqlList.length > 0) {
        const filteredSql = sqlList.filter((t) => isOrderOwnedByUser(t, user));
        filteredSql.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        saveUserTransactions(user, filteredSql, { broadcast: false });
        return purgeExpiredProofs(filteredSql);
      }
    } catch (sqlErr) {
      // Backend PHP offline, lanjut ke Firebase fallback
    }
  }

  let userList = [];

  try {
    // 1. Baca langsung dari node privat database user: user_transactions/{key}
    const privateData = await readFromFirebase(`${FIREBASE_PATH_USER_TRX}/${key}`);
    if (privateData) {
      const rawList = Array.isArray(privateData)
        ? privateData.filter(Boolean)
        : Object.values(privateData).filter(Boolean);
      userList = rawList.filter((t) => t && t.id !== 'TRX-20261003-CANVA1' && t.id !== 'TRX-20261003-NETFLIX2');
    }

    // 2. Self-Healing Reconciliation Otomatis dengan Node Global Transaksi
    // Memastikan jika Admin sudah menyelesaikan/menolak pesanan di global,
    // data akun dan status di user tidak pernah stuck "menunggu proses"
    try {
      const globalData = await readFromFirebase(FIREBASE_PATH_TRX);
      if (globalData) {
        const globalList = Array.isArray(globalData)
          ? globalData.filter(Boolean)
          : Object.values(globalData).filter(Boolean);

        const matchedInGlobal = globalList.filter((t) => isOrderOwnedByUser(t, user));

        matchedInGlobal.forEach((gt) => {
          const idx = userList.findIndex((u) => u.id === gt.id);
          if (idx === -1) {
            // Pesanan ada di global tapi belum masuk node user -> sinkronkan
            userList.push(gt);
            writeToFirebase(`${FIREBASE_PATH_USER_TRX}/${key}/${gt.id}`, gt);
          } else {
            // Pesanan ada di keduanya -> ambil status & kredensial terbaru jika ada perbedaan
            const existing = userList[idx];
            const isGlobalNewerStatus = (gt.status === 'completed' || gt.status === 'rejected') && existing.status === 'processing';
            const hasNewerCredentials = gt.credentials && (gt.credentials.account || gt.credentials.password || gt.credentials.code) && (!existing.credentials || (!existing.credentials.account && !existing.credentials.code));
            const hasNewerAdminNote = gt.adminNote && !existing.adminNote;
            const hasNewerRating = gt.rating && !existing.rating;

            if (isGlobalNewerStatus || hasNewerCredentials || hasNewerAdminNote || hasNewerRating) {
              const merged = { ...existing, ...gt };
              userList[idx] = merged;
              // Sembuhkan node privat user secara otomatis di background
              updateInFirebase(`${FIREBASE_PATH_USER_TRX}/${key}/${gt.id}`, merged);
            }
          }
        });
      }
    } catch (reconcileErr) {
      console.warn('Reconcile error in syncUserTransactionsFromCloud:', reconcileErr);
    }

    // Filter ketat isolasi akun user aktif
    userList = userList.filter((t) => isOrderOwnedByUser(t, user));
    userList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    saveUserTransactions(user, userList, { broadcast: false });
    return purgeExpiredProofs(userList);
  } catch (err) {
    console.warn('Gagal sync transaksi user dari cloud:', err);
  }

  return getUserTransactions(user);
}

/**
 * Langganan Realtime Firebase khusus untuk node privat user yang sedang aktif
 */
export function listenToUserTransactions(user, callback) {
  if (!user || typeof window === 'undefined') return () => {};
  const key = getUserKey(user);
  if (!key) return () => {};

  return listenToFirebase(`${FIREBASE_PATH_USER_TRX}/${key}`, (cloudData) => {
    // Jika undefined (gangguan koneksi/timeout), JANGAN timpa riwayat user dengan array kosong!
    if (cloudData === undefined) {
      const cached = getUserTransactions(user);
      if (cached && cached.length > 0) {
        callback(cached);
      }
      return;
    }

    if (cloudData === null) {
      saveUserTransactions(user, [], { broadcast: false });
      callback([]);
      return;
    }

    try {
      const list = Array.isArray(cloudData)
        ? cloudData.filter(Boolean)
        : Object.values(cloudData).filter(Boolean);
      let filtered = list.filter((t) => t && t.id !== 'TRX-20261003-CANVA1' && t.id !== 'TRX-20261003-NETFLIX2');
      filtered = filtered.filter((t) => isOrderOwnedByUser(t, user));
      filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      saveUserTransactions(user, filtered, { broadcast: false });
      callback(purgeExpiredProofs(filtered));
    } catch (err) {
      console.warn('Error in listenToUserTransactions:', err);
    }
  });
}

// ===================================================================
// 2. TRANSAKSI GLOBAL (UNTUK ADMIN DASHBOARD)
// ===================================================================

/**
 * Ambil Semua Transaksi Global (Untuk Admin)
 */
export function getTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRX);
    if (raw === null) {
      return [];
    }
    const parsed = JSON.parse(raw);
    const validList = Array.isArray(parsed) ? parsed : [];
    const filtered = validList.filter((t) => t && t.id !== 'TRX-20261003-CANVA1' && t.id !== 'TRX-20261003-NETFLIX2');
    return purgeExpiredProofs(filtered);
  } catch (e) {
    return [];
  }
}

/**
 * Simpan Transaksi Global ke LocalStorage Admin
 */
export function saveTransactions(transactions, options = { broadcast: true }) {
  const filtered = (transactions || []).filter(
    (t) => t && t.id !== 'TRX-20261003-CANVA1' && t.id !== 'TRX-20261003-NETFLIX2'
  );
  try {
    localStorage.setItem(STORAGE_KEY_TRX, JSON.stringify(filtered));
  } catch (e) {
    try {
      const stripped = filtered.map((t) => ({
        ...t,
        proofUrl: t.proofUrl && t.proofUrl.length > 500 ? null : t.proofUrl
      }));
      localStorage.setItem(STORAGE_KEY_TRX, JSON.stringify(stripped));
    } catch (inner) {}
  }

  const shouldBroadcast = options !== false && (typeof options !== 'object' || options.broadcast !== false);
  if (shouldBroadcast) {
    broadcastSync('TRANSACTIONS_UPDATED', filtered);
  }
}

/**
 * Tarik Data Transaksi Paling Segar dari Firebase Cloud (Admin)
 */
export async function syncTransactionsFromCloud() {
  // PRIORITAS 1: Tarik seluruh data dari database SQL jika aktif
  try {
    const sqlAll = await fetchAllTransactionsFromSql();
    if (Array.isArray(sqlAll) && sqlAll.length > 0) {
      const filtered = sqlAll.filter((t) => t && t.id !== 'TRX-20261003-CANVA1' && t.id !== 'TRX-20261003-NETFLIX2');
      filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      saveTransactions(filtered, { broadcast: false });
      return purgeExpiredProofs(filtered);
    }
  } catch (sqlErr) {
    // Fallback ke Firebase
  }

  try {
    const cloudData = await readFromFirebase(FIREBASE_PATH_TRX);
    if (cloudData) {
      const list = Array.isArray(cloudData)
        ? cloudData.filter(Boolean)
        : Object.values(cloudData).filter(Boolean);

      const filtered = list.filter((t) => t && t.id !== 'TRX-20261003-CANVA1' && t.id !== 'TRX-20261003-NETFLIX2');
      filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      try {
        localStorage.setItem(STORAGE_KEY_TRX, JSON.stringify(filtered));
      } catch (storageErr) {
        try {
          const stripped = filtered.map((t) => ({
            ...t,
            proofUrl: t.proofUrl && t.proofUrl.length > 500 ? null : t.proofUrl
          }));
          localStorage.setItem(STORAGE_KEY_TRX, JSON.stringify(stripped));
        } catch (innerErr) {
          console.warn('LocalStorage quota exceeded in syncTransactionsFromCloud:', innerErr);
        }
      }
      return filtered;
    }
  } catch (err) {
    console.warn('Gagal sync transaksi dari cloud:', err);
  }
  return getTransactions();
}

/**
 * Langganan Realtime Firebase untuk Seluruh Transaksi Global (Admin App)
 * Memakai native Server-Sent Events (SSE) dengan in-memory delta merging sub-50ms
 */
export function listenToAllTransactions(callback) {
  if (typeof window === 'undefined' || typeof callback !== 'function') return () => {};

  return listenToFirebase(FIREBASE_PATH_TRX, (cloudData) => {
    // Jika undefined (gangguan koneksi/timeout), JANGAN hapus cache lokal! Gunakan data transaksi yang tersimpan
    if (cloudData === undefined) {
      const cached = getTransactions();
      if (cached && cached.length > 0) {
        callback(cached);
      }
      return;
    }

    if (cloudData === null) {
      // Hanya jika node benar-benar kosong di database Firebase
      saveTransactions([], { broadcast: false });
      callback([]);
      return;
    }

    try {
      const list = Array.isArray(cloudData)
        ? cloudData.filter(Boolean)
        : Object.values(cloudData).filter(Boolean);

      let filtered = list.filter((t) => t && t.id !== 'TRX-20261003-CANVA1' && t.id !== 'TRX-20261003-NETFLIX2');
      filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      saveTransactions(filtered, { broadcast: false });
      callback(purgeExpiredProofs(filtered));
    } catch (err) {
      console.warn('Error in listenToAllTransactions:', err);
    }
  });
}

// ===================================================================
// 3. PEMBUATAN & PENGELOLAAN TRANSAKSI
// ===================================================================

/**
 * Buat Transaksi Baru (Dari Checkout Akun Premium / Steam Key)
 * Menyimpan otomatis ke node global (Admin) dan node privat user (Firebase & local)
 */
export function createTransaction({
  productId = null,
  productName,
  productDuration = 'Reguler',
  productCategory = 'Akun Premium',
  price = 0,
  qty = 1,
  total = 0,
  userId = null,
  userEmail = null,
  customerUsername = '',
  customerName = 'Pelanggan Chaiz',
  customerEmail = '-',
  customerPhone = '-',
  paymentMethod = 'QRIS Instant',
  proofUrl = null,
  proofFileName = null,
  proofSize = null,
  warrantyPeriod = 'Garansi Penuh'
}) {
  const cleanEmail = (userEmail || (customerEmail && customerEmail !== '-' ? customerEmail : null) || '').toLowerCase().trim() || null;
  const computedUserKey =
    userId ||
    (cleanEmail ? getUserKey({ email: cleanEmail }) : null) ||
    (customerEmail && customerEmail !== '-' ? getUserKey({ email: customerEmail, name: customerName }) : null);

  const idSuffix = Math.floor(1000 + Math.random() * 9000);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const newId = `TRX-${dateStr}-${idSuffix}`;

  const hasProof = !!proofUrl;
  const proofExpires = hasProof ? new Date(now.getTime() + PROOF_MAX_AGE_MS).toISOString() : null;

  const newTrx = {
    id: newId,
    productId: productId || null,
    userId: computedUserKey || null,
    userKey: computedUserKey || null,
    userEmail: cleanEmail,
    createdAt: now.toISOString(),
    customerUsername: customerUsername || '',
    customerName,
    customerEmail: cleanEmail || customerEmail || '-',
    customerPhone,
    productName,
    productDuration,
    productCategory,
    price,
    qty,
    total: total || price * qty,
    paymentMethod,
    proofUrl: proofUrl || null,
    proofFileName: proofFileName || (hasProof ? 'Bukti_Pembayaran.png' : null),
    proofSize: proofSize || null,
    proofUploadedAt: hasProof ? now.toISOString() : null,
    proofExpiresAt: proofExpires,
    proofExpired: false,
    proofDeletedReason: null,
    warrantyPeriod,
    status: 'processing', // Awal: Sedang diproses admin
    credentials: {
      account: '',
      password: '',
      username: '',
      pin: '',
      profile: '',
      code: ''
    },
    adminNote: '',
    processedAt: null,
    rating: null,
    isRead: false
  };

  // 0. Simpan ID pesanan terbaru ke sesi browser pelanggan
  addRecentOrderId(newId);

  // 1. Simpan ke Global Transaksi (untuk Admin)
  const allTransactions = getTransactions();
  const updatedAll = [newTrx, ...allTransactions];
  saveTransactions(updatedAll);

  // 2. Simpan ke Private User Storage
  if (computedUserKey) {
    const userTrxList = getUserTransactions({ id: computedUserKey, email: customerEmail });
    const updatedUserList = [newTrx, ...userTrxList.filter((t) => t.id !== newTrx.id)];
    saveUserTransactions({ id: computedUserKey }, updatedUserList);
  }

  // 3. Simpan ke Firebase Realtime Database
  // A. Node Admin Global: transactions/{id}
  writeToFirebase(`${FIREBASE_PATH_TRX}/${newTrx.id}`, newTrx);
  // B. Node Privat Database User: user_transactions/{userKey}/{id}
  if (computedUserKey) {
    writeToFirebase(`${FIREBASE_PATH_USER_TRX}/${computedUserKey}/${newTrx.id}`, newTrx);
  }

  // 4. Simpan ke Database SQL (PHP + MySQL Backend) secara aman & privat
  createTransactionInSql(newTrx).catch(() => {});

  broadcastSync('NEW_TRANSACTION', { newTrx, userKey: computedUserKey });
  return newTrx;
}

/**
 * Hapus Bukti Transfer Langsung oleh Admin
 */
export function deleteTransactionProof(id, deletedBy = 'Admin') {
  const transactions = getTransactions();
  let targetTrx = null;

  const updated = transactions.map((trx) => {
    if (trx.id === id) {
      targetTrx = {
        ...trx,
        proofUrl: null,
        proofExpired: true,
        proofDeletedReason: `Foto bukti dihapus langsung oleh ${deletedBy}`
      };
      return targetTrx;
    }
    return trx;
  });

  saveTransactions(updated);

  if (targetTrx) {
    const userKey =
      targetTrx.userKey ||
      targetTrx.userId ||
      (targetTrx.customerEmail && targetTrx.customerEmail !== '-'
        ? getUserKey({ email: targetTrx.customerEmail, name: targetTrx.customerName })
        : null);

    const patch = {
      proofUrl: null,
      proofExpired: true,
      proofDeletedReason: `Foto bukti dihapus langsung oleh ${deletedBy}`
    };

    updateInFirebase(`${FIREBASE_PATH_TRX}/${id}`, patch);

    if (userKey) {
      const userList = getUserTransactions({ id: userKey, email: targetTrx.customerEmail });
      saveUserTransactions({ id: userKey }, userList.map((t) => (t.id === id ? targetTrx : t)));
      updateInFirebase(`${FIREBASE_PATH_USER_TRX}/${userKey}/${id}`, patch);
    }

    // Hapus foto bukti di Database SQL jika aktif
    deleteTransactionProofInSql(id).catch(() => {});
  }
  return targetTrx;
}

/**
 * Bersihkan Seluruh Riwayat Pesanan & Foto Bukti oleh Admin
 */
export function clearAllTransactions() {
  saveTransactions([]);
  deleteFromFirebase(FIREBASE_PATH_TRX);
  deleteFromFirebase(FIREBASE_PATH_USER_TRX);
  clearAllTransactionsInSql().catch(() => {});

  try {
    if (typeof localStorage !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith(STORAGE_KEY_USER_PREFIX) || k === STORAGE_KEY_TRX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
  } catch {}

  broadcastSync('TRANSACTIONS_UPDATED', []);
  return [];
}

/**
 * Hitung Sisa Waktu Masa Aktif Foto Bukti (Maks 2 Hari / 48 Jam)
 */
export function getProofTimeRemaining(trx) {
  if (!trx) return { isExpired: true, text: 'Tidak ada bukti', hoursLeft: 0 };
  if (!trx.proofUrl) {
    return {
      isExpired: true,
      text: trx.proofDeletedReason || 'Foto bukti tidak tersedia',
      hoursLeft: 0
    };
  }

  const uploadedTime = new Date(trx.proofUploadedAt || trx.createdAt).getTime();
  const expiresTime = uploadedTime + PROOF_MAX_AGE_MS;
  const diffMs = expiresTime - Date.now();

  if (diffMs <= 0) {
    return { isExpired: true, text: 'Kedaluwarsa (2 Hari)', hoursLeft: 0 };
  }

  const hours = Math.floor(diffMs / (3600 * 1000));
  const minutes = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return {
      isExpired: false,
      text: `Sisa ${days} hari ${remainingHours} jam`,
      hoursLeft: hours,
      minutesLeft: minutes
    };
  }

  return {
    isExpired: false,
    text: `Sisa ${hours} jam ${minutes} menit`,
    hoursLeft: hours,
    minutesLeft: minutes
  };
}

/**
 * Update Status Pesanan oleh Admin (Kirim Akun & Catatan Khusus)
 * Mengupdate data di node global dan node privat user di Firebase RTDB
 */
export async function fulfillTransaction(id, credentials = {}, adminNote = '', fallbackOrder = null, extraMeta = {}) {
  const transactions = getTransactions();
  let existing = transactions.find((trx) => trx.id === id) || fallbackOrder;

  // Jika tidak ditemukan di localStorage maupun fallback, ambil dari cloud
  if (!existing) {
    try {
      const fromCloud = await readFromFirebase(`${FIREBASE_PATH_TRX}/${id}`);
      if (fromCloud) existing = fromCloud;
    } catch (e) {}
  }

  const userKey =
    existing?.userKey ||
    existing?.userId ||
    (existing?.customerEmail && existing.customerEmail !== '-'
      ? getUserKey({ email: existing.customerEmail, name: existing.customerName })
      : null);

  const deliveryMethod = extraMeta.deliveryMethod || (extraMeta.sendViaWhatsApp ? 'whatsapp' : 'web');
  const updatedTrx = {
    ...(existing || {}),
    id,
    userId: userKey || existing?.userId || null,
    userKey: userKey || existing?.userKey || null,
    status: 'completed',
    deliveryMethod,
    productDuration: extraMeta.duration || credentials?.duration || existing?.productDuration || 'Reguler',
    warrantyPeriod: extraMeta.warranty || credentials?.warranty || existing?.warrantyPeriod || 'Garansi Penuh',
    credentials: {
      account: credentials?.account || existing?.credentials?.account || '',
      password: credentials?.password || existing?.credentials?.password || '',
      username: credentials?.username || existing?.credentials?.username || '',
      pin: credentials?.pin || existing?.credentials?.pin || '',
      profile: credentials?.profile || existing?.credentials?.profile || '',
      code: credentials?.code || existing?.credentials?.code || ''
    },
    adminNote:
      adminNote ||
      existing?.adminNote ||
      'Pesanan Anda telah berhasil diproses oleh Admin ChaizStore. Selamat menikmati layanan kami!',
    adminProofUrl: extraMeta.adminProofUrl || credentials?.adminProofUrl || existing?.adminProofUrl || null,
    adminProofFileName: extraMeta.adminProofFileName || credentials?.adminProofFileName || existing?.adminProofFileName || null,
    adminProofSize: extraMeta.adminProofSize || credentials?.adminProofSize || existing?.adminProofSize || null,
    processedAt: new Date().toISOString(),
    isRead: false
  };

  // 1. Simpan di Global Admin List (tanpa memicu broadcast loop)
  let foundInList = false;
  const updatedList = transactions.map((trx) => {
    if (trx.id === id) {
      foundInList = true;
      return updatedTrx;
    }
    return trx;
  });

  if (!foundInList) {
    updatedList.unshift(updatedTrx);
  }

  saveTransactions(updatedList, { broadcast: false });

  // 2. Simpan di Private User List (tanpa memicu broadcast loop)
  if (userKey) {
    const userTrxList = getUserTransactions({ id: userKey, email: updatedTrx.customerEmail });
    let foundInUser = false;
    const updatedUserList = userTrxList.map((trx) => {
      if (trx.id === id) {
        foundInUser = true;
        return updatedTrx;
      }
      return trx;
    });
    if (!foundInUser) {
      updatedUserList.unshift(updatedTrx);
    }
    saveUserTransactions({ id: userKey }, updatedUserList, { broadcast: false });
  }

  // 3. Sinkronisasi atomic ke Firebase Realtime Database
  const patchData = {
    status: 'completed',
    deliveryMethod,
    productDuration: updatedTrx.productDuration,
    warrantyPeriod: updatedTrx.warrantyPeriod,
    credentials: updatedTrx.credentials,
    adminNote: updatedTrx.adminNote,
    processedAt: updatedTrx.processedAt,
    isRead: false
  };

  try {
    const res = await updateInFirebase(`${FIREBASE_PATH_TRX}/${id}`, patchData);
    if (!res || !res.success) {
      await writeToFirebase(`${FIREBASE_PATH_TRX}/${id}`, updatedTrx);
    }
  } catch (patchErr) {
    try {
      await writeToFirebase(`${FIREBASE_PATH_TRX}/${id}`, updatedTrx);
    } catch (writeErr) {
      console.error('Gagal menulis ke Firebase global:', writeErr);
    }
  }

  // Juga perbarui node privat database user di Firebase
  if (userKey) {
    try {
      const resUser = await updateInFirebase(`${FIREBASE_PATH_USER_TRX}/${userKey}/${id}`, patchData);
      if (!resUser || !resUser.success) {
        await writeToFirebase(`${FIREBASE_PATH_USER_TRX}/${userKey}/${id}`, updatedTrx);
      }
    } catch (userPatchErr) {
      try {
        await writeToFirebase(`${FIREBASE_PATH_USER_TRX}/${userKey}/${id}`, updatedTrx);
      } catch (err) {}
    }
  }

  // 4. Sinkronisasi ke Database SQL (PHP + MySQL Backend) jika aktif
  updateTransactionInSql({
    id,
    status: 'completed',
    deliveryMethod,
    productDuration: updatedTrx.productDuration,
    warrantyPeriod: updatedTrx.warrantyPeriod,
    credentials: updatedTrx.credentials,
    adminNote: updatedTrx.adminNote,
    processedAt: updatedTrx.processedAt,
    isRead: false
  }).catch(() => {});

  broadcastSync('TRANSACTION_FULFILLED', { updatedTrx, userKey });
  return updatedTrx;
}

/**
 * Tolak Pesanan oleh Admin
 */
export async function rejectTransaction(id, rejectReason = 'Pesanan tidak dapat diproses', fallbackOrder = null) {
  const transactions = getTransactions();
  let existing = transactions.find((trx) => trx.id === id) || fallbackOrder;

  if (!existing) {
    try {
      const fromCloud = await readFromFirebase(`${FIREBASE_PATH_TRX}/${id}`);
      if (fromCloud) existing = fromCloud;
    } catch (e) {}
  }

  const userKey =
    existing?.userKey ||
    existing?.userId ||
    (existing?.customerEmail && existing.customerEmail !== '-'
      ? getUserKey({ email: existing.customerEmail, name: existing.customerName })
      : null);

  const updatedTrx = {
    ...(existing || {}),
    id,
    userId: userKey || existing?.userId || null,
    userKey: userKey || existing?.userKey || null,
    status: 'rejected',
    rejectReason: rejectReason || 'Pesanan ditolak oleh admin',
    adminNote: rejectReason || 'Pesanan ditolak oleh admin',
    rejectedAt: new Date().toISOString(),
    isRead: false
  };

  // 1. Simpan di Global Admin List
  let foundInList = false;
  const updatedList = transactions.map((trx) => {
    if (trx.id === id) {
      foundInList = true;
      return updatedTrx;
    }
    return trx;
  });

  if (!foundInList) {
    updatedList.unshift(updatedTrx);
  }

  saveTransactions(updatedList, { broadcast: false });

  // 2. Simpan di Private User List
  if (userKey) {
    const userTrxList = getUserTransactions({ id: userKey, email: updatedTrx.customerEmail });
    let foundInUser = false;
    const updatedUserList = userTrxList.map((trx) => {
      if (trx.id === id) {
        foundInUser = true;
        return updatedTrx;
      }
      return trx;
    });
    if (!foundInUser) {
      updatedUserList.unshift(updatedTrx);
    }
    saveUserTransactions({ id: userKey }, updatedUserList, { broadcast: false });
  }

  // 3. Sinkronisasi atomic ke Firebase Realtime Database
  const patchData = {
    status: 'rejected',
    rejectReason: updatedTrx.rejectReason,
    adminNote: updatedTrx.adminNote,
    rejectedAt: updatedTrx.rejectedAt,
    isRead: false
  };

  try {
    const res = await updateInFirebase(`${FIREBASE_PATH_TRX}/${id}`, patchData);
    if (!res || !res.success) {
      await writeToFirebase(`${FIREBASE_PATH_TRX}/${id}`, updatedTrx);
    }
  } catch (patchErr) {
    try {
      await writeToFirebase(`${FIREBASE_PATH_TRX}/${id}`, updatedTrx);
    } catch (err) {}
  }

  if (userKey) {
    try {
      const resUser = await updateInFirebase(`${FIREBASE_PATH_USER_TRX}/${userKey}/${id}`, patchData);
      if (!resUser || !resUser.success) {
        await writeToFirebase(`${FIREBASE_PATH_USER_TRX}/${userKey}/${id}`, updatedTrx);
      }
    } catch (userPatchErr) {
      try {
        await writeToFirebase(`${FIREBASE_PATH_USER_TRX}/${userKey}/${id}`, updatedTrx);
      } catch (err) {}
    }
  }

  // 4. Sinkronisasi ke SQL
  updateTransactionInSql({
    id,
    status: 'rejected',
    adminNote: updatedTrx.adminNote,
    rejectedAt: updatedTrx.rejectedAt,
    isRead: false
  }).catch(() => {});

  broadcastSync('TRANSACTION_REJECTED', { updatedTrx, userKey });
  return updatedTrx;
}

/**
 * Beri Rating & Ulasan oleh Pelanggan (1 - 5 Bintang + Catatan)
 */
export function rateTransaction(id, stars, comment, authUser = null) {
  const transactions = getTransactions();
  let ratedTrx = null;

  const updated = transactions.map((trx) => {
    if (trx.id === id) {
      ratedTrx = {
        ...trx,
        rating: {
          stars: Math.max(1, Math.min(5, Number(stars) || 5)),
          comment: comment || 'Pelayanan sangat memuaskan!',
          ratedAt: new Date().toISOString()
        }
      };
      return ratedTrx;
    }
    return trx;
  });

  saveTransactions(updated);

  if (ratedTrx) {
    const userKey =
      (authUser && getUserKey(authUser)) ||
      ratedTrx.userKey ||
      ratedTrx.userId ||
      (ratedTrx.customerEmail && ratedTrx.customerEmail !== '-'
        ? getUserKey({ email: ratedTrx.customerEmail, name: ratedTrx.customerName })
        : null);

    if (userKey) {
      const userList = getUserTransactions({ id: userKey, email: ratedTrx.customerEmail });
      const updatedUserList = userList.map((t) => (t.id === id ? ratedTrx : t));
      saveUserTransactions({ id: userKey }, updatedUserList);
      updateInFirebase(`${FIREBASE_PATH_USER_TRX}/${userKey}/${id}`, { rating: ratedTrx.rating });
    }

    updateInFirebase(`${FIREBASE_PATH_TRX}/${id}`, { rating: ratedTrx.rating });

    // Sinkronkan ulasan rating ke SQL database jika aktif
    updateTransactionInSql({
      id,
      rating: ratedTrx.rating
    }).catch(() => {});

    addCustomerReview({
      id: `REV-${Date.now()}`,
      name: ratedTrx.customerName || 'Pelanggan Setia',
      role: `Pembeli ${ratedTrx.productName}`,
      stars: ratedTrx.rating.stars,
      text: ratedTrx.rating.comment,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    });
  }

  broadcastSync('TRANSACTION_RATED', { ratedTrx, userKey: ratedTrx?.userKey });
  return ratedTrx;
}

/**
 * Tandai Notifikasi Transaksi Sudah Dibaca (Khusus untuk Akun User yang Sedang Login)
 */
export function markTransactionsAsRead(user = null) {
  let targetUser = user;
  if (!targetUser && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('chaiz_auth_user');
      if (raw) targetUser = JSON.parse(raw);
    } catch {}
  }
  if (!targetUser) return;
  const list = getUserTransactions(targetUser);
  const hasUnread = list.some((t) => !t.isRead);
  if (!hasUnread) return;

  const updated = list.map((t) => (t.isRead ? t : { ...t, isRead: true }));
  saveUserTransactions(targetUser, updated, { broadcast: false });
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chaiz_notifications_read', { detail: { userKey: getUserKey(targetUser) } }));
    }
  } catch {}
}

/**
 * Ambil Hitungan Notifikasi Transaksi Aktif untuk User yang Sedang Login
 * Jika belum login, return 0
 */
export function getActiveNotificationCount(user = null) {
  let targetUser = user;
  if (!targetUser && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('chaiz_auth_user');
      if (raw) targetUser = JSON.parse(raw);
    } catch {}
  }
  if (!targetUser) {
    const recent = getRecentOrderIds();
    if (recent.length > 0) {
      const all = getTransactions();
      const myOrders = all.filter((t) => recent.includes(t.id));
      return myOrders.filter((t) => !t.isRead && (t.status === 'completed' || t.status === 'rejected')).length;
    }
    return 0;
  }
  const list = getUserTransactions(targetUser);
  return list.filter((t) => !t.isRead).length;
}

// ===================================================================
// 4. TESTIMONI PUBLIK
// ===================================================================

const INITIAL_REVIEWS = [
  {
    id: 'REV-1',
    name: 'Dimas Pratama',
    role: 'Pelanggan Netflix & Spotify',
    stars: 5,
    text: 'Gokil cepet banget pelayanannya! Transfer QRIS, 2 menit kemudian akun Netflix udah dikirim dan langsung bisa nonton 4K bareng keluarga. Garansinya beneran aman.',
    date: '3 Okt 2026'
  },
  {
    id: 'REV-2',
    name: 'Siti Rahmawati',
    role: 'Freelance Designer - Canva Pro',
    stars: 5,
    text: 'Langganan Canva Pro di sini hemat banyak buat tugas kuliah dan desain freelance. Udah 6 bulan lancar jaya no kendala. Pasti bakal repurchase terus di sini.',
    date: '3 Okt 2026'
  },
  {
    id: 'REV-3',
    name: 'Fajar Kurniawan',
    role: 'Software Engineer - Gemini AI',
    stars: 5,
    text: 'Gemini Advanced AI nya mantap banget, kencang buat bantu kerjaan koding dan riset. Adminnya juga ramah ditanya-tanya malam-malam tetep dibales gercep. Recommended seller JB akun!',
    date: '2 Okt 2026'
  }
];

export function getCustomerReviews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REVIEWS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(INITIAL_REVIEWS));
      return INITIAL_REVIEWS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_REVIEWS;
  } catch (e) {
    return INITIAL_REVIEWS;
  }
}

export function addCustomerReview(review) {
  try {
    const reviews = getCustomerReviews();
    const updated = [review, ...reviews];
    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(updated));
    broadcastSync('NEW_CUSTOMER_REVIEW', review);
    writeToFirebase(`${FIREBASE_PATH_REVIEWS}/${review.id}`, review);
    return updated;
  } catch (e) {
    return [];
  }
}

// ===================================================================
// 5. AUTOMATIC FIREBASE REALTIME LISTENER INITIALIZER
// ===================================================================

let isListenerActive = false;

export function initTransactionsFirebaseSync() {
  if (isListenerActive || typeof window === 'undefined') return;
  isListenerActive = true;

  // Sinkronisasi Realtime Ulasan Pelanggan dari Cloud
  listenToFirebase(FIREBASE_PATH_REVIEWS, (cloudReviews) => {
    if (cloudReviews === null) return;

    try {
      const revList = Array.isArray(cloudReviews)
        ? cloudReviews.filter(Boolean)
        : Object.values(cloudReviews).filter(Boolean);

      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(revList));
      broadcastSync('REVIEWS_UPDATED', revList);
    } catch (err) {
      console.warn('Error syncing cloud reviews:', err);
    }
  });
}

// Inisialisasi otomatis listener saat file ini dimuat di browser
if (typeof window !== 'undefined') {
  initTransactionsFirebaseSync();
}
