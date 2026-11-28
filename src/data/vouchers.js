// ===================================================================
// CHAIZSTORE GUDANG VOUCHER & REALTIME PROMO DATABASE
// Terhubung dinamis dengan Menu Gudang Voucher di Portal Admin
// Sinkron Realtime lintas Device/Browser: LocalStorage + BroadcastChannel
// + Firebase Realtime Database + Dedicated SQLite/Express Backend
// ===================================================================

import {
  writeToFirebase,
  updateInFirebase,
  readFromFirebase,
  deleteFromFirebase,
  listenToFirebase
} from '../utils/firebase';
import {
  fetchAllVouchersFromSql,
  checkVoucherInSql,
  saveVoucherInSql,
  useVoucherInSql,
  toggleVoucherInSql,
  deleteVoucherInSql,
  clearUsedVouchersInSql
} from '../utils/sqlApi';

export const VOUCHERS_STORAGE_KEY = 'chaiz_store_vouchers';
const VOUCHERS_DELETED_KEY = 'chaiz_deleted_voucher_ids';
const VOUCHERS_PENDING_KEY = 'chaiz_pending_voucher_sync_ids';
const FIREBASE_PATH_VOUCHERS = 'vouchers';
const ADMIN_SYNC_CHANNEL = 'chaiz_admin_sync';

function cleanCodeStr(code) {
  return String(code || '').trim().toUpperCase().replace(/\s+/g, '');
}

function readTtlMap(storageKey, ttlMs) {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const now = Date.now();
    const fresh = {};
    Object.entries(parsed || {}).forEach(([id, ts]) => {
      if (now - Number(ts) < ttlMs) fresh[id] = Number(ts);
    });
    return fresh;
  } catch {
    return {};
  }
}

function getDeletedTombstones() {
  return readTtlMap(VOUCHERS_DELETED_KEY, 60000);
}

function recordDeletedTombstone(ids = []) {
  if (typeof window === 'undefined' || !ids.length) return;
  try {
    const current = getDeletedTombstones();
    const now = Date.now();
    ids.forEach((id) => {
      if (id) current[id] = now;
    });
    localStorage.setItem(VOUCHERS_DELETED_KEY, JSON.stringify(current));
  } catch {}
}

function getPendingSyncIds() {
  return readTtlMap(VOUCHERS_PENDING_KEY, 15000);
}

function recordPendingSyncId(id) {
  if (typeof window === 'undefined' || !id) return;
  try {
    const current = getPendingSyncIds();
    current[id] = Date.now();
    localStorage.setItem(VOUCHERS_PENDING_KEY, JSON.stringify(current));
  } catch {}
}

function normalizeVoucher(v) {
  if (!v || !v.code) return null;
  const code = cleanCodeStr(v.code);
  if (!code) return null;
  const isUsed = Boolean(v.isUsed);
  const hasMinPurchase = Boolean(v.hasMinPurchase);
  const discountAmount = Number(v.discountAmount) || 0;
  const minPurchaseAmount = hasMinPurchase ? (Number(v.minPurchaseAmount) || 20000) : 0;

  return {
    ...v,
    id: v.id || `vch_${code}`,
    code,
    name: String(v.name || `Diskon Rp ${discountAmount.toLocaleString('id-ID')}`).trim(),
    description: String(
      v.description ||
        (hasMinPurchase
          ? `Potongan Rp ${discountAmount.toLocaleString('id-ID')} (Minimal belanja Rp ${minPurchaseAmount.toLocaleString('id-ID')})`
          : `Potongan Rp ${discountAmount.toLocaleString('id-ID')} tanpa minimal belanja`)
    ).trim(),
    discountAmount,
    hasMinPurchase,
    minPurchaseAmount,
    type: v.type || 'discount',
    isSingleUse: v.isSingleUse !== false,
    isUsed,
    usedAt: isUsed ? (v.usedAt || new Date().toISOString()) : null,
    usedBy: isUsed ? (v.usedBy || 'Pelanggan') : null,
    usedOrder: isUsed ? (v.usedOrder || '') : null,
    isActive: isUsed ? false : v.isActive !== false,
    badge: v.badge || `Diskon Rp ${discountAmount.toLocaleString('id-ID')}`,
    createdAt: v.createdAt || new Date().toISOString(),
    updatedAt: v.updatedAt || v.createdAt || new Date().toISOString()
  };
}

function sortVouchersNewest(list) {
  return [...list].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

/**
 * Menggabungkan voucher lokal & cloud tanpa pernah menghapus status hangus (`isUsed: true`)
 */
function mergeVoucherLists(localList, remoteList, { authoritativeRemote = false } = {}) {
  const tombstones = getDeletedTombstones();
  const pendingIds = getPendingSyncIds();
  const byId = new Map();
  const codeToId = new Map();

  const localNormalized = (localList || []).map(normalizeVoucher).filter(Boolean);
  const remoteNormalized = (remoteList || []).map(normalizeVoucher).filter(Boolean);

  // 1. Masukkan semua voucher dari remote (kecuali yang baru saja dihapus di perangkat ini)
  for (const r of remoteNormalized) {
    if (tombstones[r.id]) continue;
    const item = { ...r, syncedToCloud: true };
    byId.set(item.id, item);
    codeToId.set(item.code, item.id);
  }

  // 2. Gabungkan dengan local
  const needPushBurnedToCloud = [];
  const needPushLegacyToCloud = [];

  for (const l of localNormalized) {
    if (tombstones[l.id]) continue;
    const matchedId = byId.has(l.id) ? l.id : codeToId.get(l.code);

    if (matchedId) {
      const existing = byId.get(matchedId);
      // Jika kode sama tapi dibuat ulang oleh Admin dengan ID berbeda & createdAt lebih baru, pakai yang terbaru
      if (
        existing.id !== l.id &&
        new Date(l.createdAt || 0).getTime() > new Date(existing.createdAt || 0).getTime()
      ) {
        if (!l.syncedToCloud) {
          byId.delete(matchedId);
          const promoted = { ...l, syncedToCloud: true };
          byId.set(promoted.id, promoted);
          codeToId.set(promoted.code, promoted.id);
          needPushLegacyToCloud.push(promoted);
        }
        continue;
      }

      // Status isUsed: true bersifat permanen (1x pakai hangus) — tidak boleh tertimpa false
      const mergedUsed = Boolean(existing.isUsed || l.isUsed);
      const localTime = new Date(l.updatedAt || l.createdAt || 0).getTime();
      const remoteTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      const base = localTime > remoteTime ? { ...existing, ...l } : { ...l, ...existing };

      const merged = normalizeVoucher({
        ...base,
        id: existing.id,
        isUsed: mergedUsed,
        isActive: mergedUsed ? false : base.isActive,
        usedAt: mergedUsed ? (existing.usedAt || l.usedAt || new Date().toISOString()) : null,
        usedBy: mergedUsed ? (existing.usedBy || l.usedBy || 'Pelanggan') : null,
        usedOrder: mergedUsed ? (existing.usedOrder || l.usedOrder || '') : null,
        syncedToCloud: true
      });

      byId.set(existing.id, merged);
      codeToId.set(merged.code, existing.id);

      if (l.isUsed && !existing.isUsed) {
        needPushBurnedToCloud.push(merged);
      }
    } else if (!authoritativeRemote || !l.syncedToCloud || pendingIds[l.id]) {
      // Pertahankan voucher lokal yang dibuat sebelum cloud sync ada atau masih pending upload
      const promoted = { ...l, syncedToCloud: true };
      byId.set(promoted.id, promoted);
      codeToId.set(promoted.code, promoted.id);
      if (authoritativeRemote && (!l.syncedToCloud || pendingIds[l.id])) {
        needPushLegacyToCloud.push(promoted);
      }
    }
  }

  return {
    merged: sortVouchersNewest(Array.from(byId.values())),
    needPushBurnedToCloud,
    needPushLegacyToCloud
  };
}

/**
 * Mengambil daftar seluruh voucher dari Gudang Voucher
 */
export function getStoredVouchers() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(VOUCHERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortVouchersNewest(parsed.map(normalizeVoucher).filter(Boolean));
  } catch {
    return [];
  }
}

/**
 * Menyimpan daftar voucher ke storage dan broadcast ke seluruh tab browser
 */
export function saveStoredVouchers(list, options = { broadcast: true, reason: 'VOUCHERS_UPDATED' }) {
  if (typeof window === 'undefined') return;
  const cleanList = sortVouchersNewest((list || []).map(normalizeVoucher).filter(Boolean));
  try {
    localStorage.setItem(VOUCHERS_STORAGE_KEY, JSON.stringify(cleanList));
    const shouldBroadcast =
      options !== false && (typeof options !== 'object' || options.broadcast !== false);
    if (shouldBroadcast) {
      window.dispatchEvent(
        new CustomEvent('chaiz_vouchers_updated', {
          detail: { vouchers: cleanList, reason: options?.reason || 'VOUCHERS_UPDATED' }
        })
      );
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel(ADMIN_SYNC_CHANNEL);
        bc.postMessage({
          type: 'VOUCHERS_UPDATED',
          vouchers: cleanList,
          reason: options?.reason || 'VOUCHERS_UPDATED'
        });
        bc.close();
      }
    }
  } catch (e) {
    console.error('Failed to save vouchers:', e);
  }
}

/**
 * Sinkronisasi daftar voucher dari SQLite Server & Firebase Cloud
 */
export async function syncVouchersFromCloud() {
  if (typeof window === 'undefined') return [];

  const localList = getStoredVouchers();
  let sqlList = null;
  let firebaseList = null;
  let firebaseResponded = false;

  const [sqlRes, fbRes] = await Promise.all([
    fetchAllVouchersFromSql().catch(() => null),
    readFromFirebase(FIREBASE_PATH_VOUCHERS).catch(() => undefined)
  ]);

  if (Array.isArray(sqlRes)) {
    sqlList = sqlRes;
  }
  if (fbRes !== undefined) {
    firebaseResponded = true;
    if (fbRes === null) {
      firebaseList = [];
    } else if (typeof fbRes === 'object') {
      firebaseList = Array.isArray(fbRes) ? fbRes.filter(Boolean) : Object.values(fbRes).filter(Boolean);
    }
  }

  // Gabungkan SQL + Firebase terlebih dahulu
  let remoteCombined = null;
  let authoritative = false;

  if (sqlList !== null && firebaseResponded) {
    const step = mergeVoucherLists(sqlList, firebaseList || [], { authoritativeRemote: false });
    remoteCombined = step.merged;
    authoritative = true;
    // Sinkronkan status hangus antar SQL <-> Firebase jika salah satu tertinggal
    step.needPushBurnedToCloud.forEach((v) => {
      updateInFirebase(`${FIREBASE_PATH_VOUCHERS}/${v.id}`, {
        isUsed: true,
        isActive: false,
        usedAt: v.usedAt,
        usedBy: v.usedBy,
        usedOrder: v.usedOrder,
        updatedAt: v.updatedAt
      }).catch(() => {});
    });
  } else if (firebaseResponded) {
    remoteCombined = firebaseList || [];
    authoritative = true;
  } else if (sqlList !== null) {
    remoteCombined = sqlList;
    authoritative = true;
  }

  if (remoteCombined === null) {
    return localList;
  }

  const { merged, needPushBurnedToCloud, needPushLegacyToCloud } = mergeVoucherLists(
    localList,
    remoteCombined,
    { authoritativeRemote: authoritative }
  );

  // Propagasi jika ada voucher baru terpakai/legacy di lokal yang belum sampai ke cloud
  needPushBurnedToCloud.forEach((v) => {
    updateInFirebase(`${FIREBASE_PATH_VOUCHERS}/${v.id}`, {
      isUsed: true,
      isActive: false,
      usedAt: v.usedAt,
      usedBy: v.usedBy,
      usedOrder: v.usedOrder,
      updatedAt: v.updatedAt
    }).catch(() => {});
    useVoucherInSql(v.code, v.usedBy || 'Pelanggan', v.usedOrder || '').catch(() => {});
  });

  needPushLegacyToCloud.forEach((v) => {
    writeToFirebase(`${FIREBASE_PATH_VOUCHERS}/${v.id}`, v).catch(() => {});
    saveVoucherInSql(v).catch(() => {});
  });

  const prevSerialized = JSON.stringify(localList.map(({ syncedToCloud, ...rest }) => rest));
  const nextSerialized = JSON.stringify(merged.map(({ syncedToCloud, ...rest }) => rest));
  saveStoredVouchers(merged, { broadcast: prevSerialized !== nextSerialized, reason: 'CLOUD_SYNC' });

  return merged;
}

/**
 * Langganan realtime perubahan Gudang Voucher (Firebase + Storage + BroadcastChannel + CustomEvent)
 */
export function listenToVouchers(callback) {
  if (typeof window === 'undefined' || typeof callback !== 'function') return () => {};

  const deliverLocal = () => {
    callback(getStoredVouchers());
  };

  // Initial cloud pull
  syncVouchersFromCloud()
    .then((fresh) => {
      if (Array.isArray(fresh)) callback(fresh);
    })
    .catch(() => {});

  // 1. Firebase SSE / adaptive polling
  const unsubFirebase = listenToFirebase(
    FIREBASE_PATH_VOUCHERS,
    (cloudData) => {
      if (cloudData === undefined) return;
      const remoteList =
        cloudData === null
          ? []
          : Array.isArray(cloudData)
          ? cloudData.filter(Boolean)
          : Object.values(cloudData).filter(Boolean);

      const localList = getStoredVouchers();
      const { merged, needPushBurnedToCloud, needPushLegacyToCloud } = mergeVoucherLists(
        localList,
        remoteList,
        { authoritativeRemote: true }
      );

      needPushBurnedToCloud.forEach((v) => {
        updateInFirebase(`${FIREBASE_PATH_VOUCHERS}/${v.id}`, {
          isUsed: true,
          isActive: false,
          usedAt: v.usedAt,
          usedBy: v.usedBy,
          usedOrder: v.usedOrder,
          updatedAt: v.updatedAt
        }).catch(() => {});
      });
      needPushLegacyToCloud.forEach((v) => {
        writeToFirebase(`${FIREBASE_PATH_VOUCHERS}/${v.id}`, v).catch(() => {});
      });

      saveStoredVouchers(merged, { broadcast: false });
      callback(merged);
    },
    { intervalMs: 4000 }
  );

  // 2. LocalStorage & CustomEvent & BroadcastChannel listeners
  const handleStorage = (e) => {
    if (e && e.key === VOUCHERS_STORAGE_KEY) {
      deliverLocal();
    }
  };
  const handleCustom = () => deliverLocal();

  window.addEventListener('storage', handleStorage);
  window.addEventListener('chaiz_vouchers_updated', handleCustom);

  let bc = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      bc = new BroadcastChannel(ADMIN_SYNC_CHANNEL);
      bc.onmessage = (ev) => {
        if (ev.data?.type === 'VOUCHERS_UPDATED') {
          deliverLocal();
        }
      };
    } catch {}
  }

  return () => {
    if (unsubFirebase) unsubFirebase();
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('chaiz_vouchers_updated', handleCustom);
    if (bc) {
      try { bc.close(); } catch {}
    }
  };
}

/**
 * Menambahkan voucher baru ke Gudang Voucher (Lokal + Firebase Cloud + SQLite)
 */
export function addStoredVoucher(voucher) {
  const current = getStoredVouchers();
  const cleanCode = cleanCodeStr(voucher.code);
  const discountAmount = Number(voucher.discountAmount) || 0;
  const hasMinPurchase = Boolean(voucher.hasMinPurchase);
  const minPurchaseAmount = hasMinPurchase ? (Number(voucher.minPurchaseAmount) || 20000) : 0;
  const now = new Date().toISOString();

  const replacedDuplicates = current.filter((v) => v.code === cleanCode);
  if (replacedDuplicates.length > 0) {
    recordDeletedTombstone(replacedDuplicates.map((d) => d.id));
    replacedDuplicates.forEach((d) => {
      deleteFromFirebase(`${FIREBASE_PATH_VOUCHERS}/${d.id}`).catch(() => {});
    });
  }

  const newVoucher = normalizeVoucher({
    id: 'vch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    code: cleanCode,
    name: String(voucher.name || `Diskon Rp ${discountAmount.toLocaleString('id-ID')}`).trim(),
    description: String(
      voucher.description ||
        (hasMinPurchase
          ? `Potongan Rp ${discountAmount.toLocaleString('id-ID')} (Minimal belanja Rp ${minPurchaseAmount.toLocaleString('id-ID')})`
          : `Potongan Rp ${discountAmount.toLocaleString('id-ID')} tanpa minimal belanja`)
    ).trim(),
    discountAmount,
    hasMinPurchase,
    minPurchaseAmount,
    type: 'discount',
    isSingleUse: true, // 1x pakai langsung hangus
    isUsed: false,
    usedAt: null,
    usedBy: null,
    usedOrder: null,
    isActive: true,
    badge: voucher.badge || `Diskon Rp ${discountAmount.toLocaleString('id-ID')}`,
    createdAt: now,
    updatedAt: now,
    ...voucher,
    code: cleanCode,
    syncedToCloud: true
  });

  const updated = [newVoucher, ...current.filter((v) => v.code !== cleanCode)];
  recordPendingSyncId(newVoucher.id);
  saveStoredVouchers(updated, { broadcast: true, reason: 'VOUCHER_ADDED' });

  // Sync ke Cloud & SQLite Backend
  writeToFirebase(`${FIREBASE_PATH_VOUCHERS}/${newVoucher.id}`, newVoucher).catch(() => {});
  saveVoucherInSql(newVoucher).catch(() => {});

  return newVoucher;
}

/**
 * Tandai voucher telah digunakan oleh pembeli (1x Pakai Langsung Hangus di Lokal, Cloud & Admin)
 */
export async function markVoucherAsUsed(codeOrId, userEmail = 'Pelanggan', orderId = '') {
  const clean = cleanCodeStr(codeOrId);
  if (!clean && !codeOrId) return { success: false, reason: 'INVALID_CODE' };

  let current = getStoredVouchers();
  let target = current.find((v) => v.code === clean || v.id === codeOrId) || null;

  // Jika belum ada di cache lokal (mis. user langsung bayar di perangkat baru), sinkronkan dulu dari cloud
  if (!target) {
    try {
      const synced = await syncVouchersFromCloud();
      current = Array.isArray(synced) ? synced : getStoredVouchers();
      target = current.find((v) => v.code === clean || v.id === codeOrId) || null;
    } catch {}
  }

  const now = new Date().toISOString();
  const cleanUsedBy = userEmail || 'Pelanggan';
  const cleanOrderId = orderId || '';

  // 1. Update SQLite Server secara atomic terlebih dahulu (jika backend aktif)
  const sqlRes = await useVoucherInSql(target?.id || clean || codeOrId, cleanUsedBy, cleanOrderId).catch(() => null);
  if (sqlRes && sqlRes.success === false && sqlRes.reason === 'ALREADY_USED') {
    if (sqlRes.data) {
      const syncedList = current.map((v) =>
        v.id === sqlRes.data.id || v.code === sqlRes.data.code ? normalizeVoucher({ ...sqlRes.data, syncedToCloud: true }) : v
      );
      saveStoredVouchers(syncedList, { broadcast: true, reason: 'VOUCHER_ALREADY_USED' });
    }
    return { success: false, reason: 'ALREADY_USED', voucher: sqlRes.data || target };
  }

  // 2. Update LocalStorage & Broadcast ke tab Admin
  let updatedVoucher = sqlRes?.data ? normalizeVoucher({ ...sqlRes.data, syncedToCloud: true }) : null;
  const updatedList = current.map((v) => {
    if (v.code === clean || v.id === codeOrId || (target && v.id === target.id)) {
      updatedVoucher = normalizeVoucher({
        ...v,
        ...(updatedVoucher || {}),
        isUsed: true,
        isActive: false, // Otomatis nonaktif / hangus
        usedAt: updatedVoucher?.usedAt || v.usedAt || now,
        usedBy: updatedVoucher?.usedBy || v.usedBy || cleanUsedBy,
        usedOrder: updatedVoucher?.usedOrder || v.usedOrder || cleanOrderId,
        updatedAt: now,
        syncedToCloud: true
      });
      return updatedVoucher;
    }
    return v;
  });

  if (updatedVoucher) {
    recordPendingSyncId(updatedVoucher.id);
    saveStoredVouchers(updatedList, { broadcast: true, reason: 'VOUCHER_USED' });

    // 3. Update Firebase Cloud agar Admin di HP / Laptop lain langsung melihat status Telah Hangus Dipakai
    const burnPatch = {
      isUsed: true,
      isActive: false,
      usedAt: updatedVoucher.usedAt,
      usedBy: updatedVoucher.usedBy,
      usedOrder: updatedVoucher.usedOrder,
      updatedAt: now
    };
    try {
      const fbPatch = await updateInFirebase(`${FIREBASE_PATH_VOUCHERS}/${updatedVoucher.id}`, burnPatch);
      if (!fbPatch || !fbPatch.success) {
        await writeToFirebase(`${FIREBASE_PATH_VOUCHERS}/${updatedVoucher.id}`, updatedVoucher);
      }
    } catch {
      writeToFirebase(`${FIREBASE_PATH_VOUCHERS}/${updatedVoucher.id}`, updatedVoucher).catch(() => {});
    }
  }

  return { success: true, voucher: updatedVoucher };
}

/**
 * Menghapus voucher tertentu dari Gudang Voucher (Lokal + Cloud + SQLite)
 */
export function deleteStoredVoucher(idOrCode) {
  const current = getStoredVouchers();
  const clean = cleanCodeStr(idOrCode);
  const targets = current.filter((v) => v.id === idOrCode || v.code === clean || v.code === idOrCode);
  const targetIds = targets.map((t) => t.id);
  if (idOrCode && !targetIds.includes(idOrCode)) targetIds.push(idOrCode);

  recordDeletedTombstone(targetIds);

  const updated = current.filter((v) => v.id !== idOrCode && v.code !== clean && v.code !== idOrCode);
  saveStoredVouchers(updated, { broadcast: true, reason: 'VOUCHER_DELETED' });

  targetIds.forEach((id) => {
    deleteFromFirebase(`${FIREBASE_PATH_VOUCHERS}/${id}`).catch(() => {});
  });
  deleteVoucherInSql(idOrCode).catch(() => {});

  return true;
}

/**
 * Hapus Semua Voucher yang Sudah Digunakan (Hangus) Sekaligus
 */
export function clearUsedVouchers() {
  const current = getStoredVouchers();
  const usedVouchers = current.filter((v) => v.isUsed);
  const usedIds = usedVouchers.map((v) => v.id);

  recordDeletedTombstone(usedIds);

  const updated = current.filter((v) => !v.isUsed);
  saveStoredVouchers(updated, { broadcast: true, reason: 'USED_VOUCHERS_CLEARED' });

  usedIds.forEach((id) => {
    deleteFromFirebase(`${FIREBASE_PATH_VOUCHERS}/${id}`).catch(() => {});
  });
  clearUsedVouchersInSql().catch(() => {});

  return true;
}

/**
 * Mengubah status aktif / nonaktif voucher (Lokal + Cloud + SQLite)
 */
export function toggleStoredVoucherActive(idOrCode) {
  const current = getStoredVouchers();
  const clean = cleanCodeStr(idOrCode);
  let toggledVoucher = null;
  const now = new Date().toISOString();

  const updated = current.map((v) => {
    if (v.id === idOrCode || v.code === clean || v.code === idOrCode) {
      if (v.isUsed) return v; // Voucher yang sudah hangus tidak bisa diaktifkan lagi
      toggledVoucher = {
        ...v,
        isActive: !v.isActive,
        updatedAt: now,
        syncedToCloud: true
      };
      return toggledVoucher;
    }
    return v;
  });

  saveStoredVouchers(updated, { broadcast: true, reason: 'VOUCHER_TOGGLED' });

  if (toggledVoucher) {
    updateInFirebase(`${FIREBASE_PATH_VOUCHERS}/${toggledVoucher.id}`, {
      isActive: toggledVoucher.isActive,
      updatedAt: now
    }).catch(() => {
      writeToFirebase(`${FIREBASE_PATH_VOUCHERS}/${toggledVoucher.id}`, toggledVoucher).catch(() => {});
    });
    toggleVoucherInSql(toggledVoucher.id).catch(() => {});
  }

  return updated;
}

/**
 * Mencari voucher berdasarkan kode di cache lokal
 */
export function findVoucher(inputCode) {
  if (!inputCode) return null;
  const clean = cleanCodeStr(inputCode);
  const list = getStoredVouchers();
  return (
    list.find((v) => {
      if (v.code === clean) return true;
      if (Array.isArray(v.aliases) && v.aliases.includes(clean)) return true;
      return false;
    }) || null
  );
}

/**
 * Mencari voucher dengan sinkronisasi terbaru dari Cloud & SQLite (mencegah pemakaian ganda lintas device)
 */
export async function findVoucherFresh(inputCode) {
  if (!inputCode) return null;
  const clean = cleanCodeStr(inputCode);

  const [sqlCheck] = await Promise.all([
    checkVoucherInSql(clean).catch(() => null),
    syncVouchersFromCloud().catch(() => null)
  ]);

  const localFound = findVoucher(clean);
  if (sqlCheck && localFound) {
    const mergedUsed = Boolean(sqlCheck.isUsed || localFound.isUsed);
    return normalizeVoucher({
      ...localFound,
      ...sqlCheck,
      isUsed: mergedUsed,
      isActive: mergedUsed ? false : (sqlCheck.isActive && localFound.isActive)
    });
  }
  return localFound || (sqlCheck ? normalizeVoucher(sqlCheck) : null);
}

// Default export compatibility
export const VOUCHERS = [];
