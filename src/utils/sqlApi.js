// ===================================================================
// CHAIZSTORE DEDICATED SQL & NODE.JS BACKEND CLIENT ADAPTER
// Connects React frontend directly to Express + SQLite/PostgreSQL Engine
// High Performance, Sub-10ms Queries, Zero Browser Socket Limitations
// ===================================================================

const DEFAULT_LOCAL_API = 'http://localhost:3001';

export function getSqlApiBaseUrl() {
  if (typeof window === 'undefined') return DEFAULT_LOCAL_API;

  // 1. Cek environment variable jika didefinisikan di .env
  if (import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL.trim()) {
    return import.meta.env.VITE_BACKEND_URL.trim().replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_SQL_API_URL && import.meta.env.VITE_SQL_API_URL.trim()) {
    return import.meta.env.VITE_SQL_API_URL.trim().replace(/\/+$/, '');
  }

  // 2. Jika diakses via domain produksi dengan subfolder atau origin
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return window.location.origin;
  }

  // 3. Default saat development lokal: Dedicated Node Server Port 3001
  return DEFAULT_LOCAL_API;
}

let isSqlChecked = false;
let isSqlAvailable = false;
let lastCheckTime = 0;

/**
 * Periksa apakah server backend Node.js + SQLite sedang aktif (Circuit Breaker)
 */
export async function checkSqlBackendHealth() {
  const now = Date.now();
  if (isSqlChecked && now - lastCheckTime < 15000) {
    return isSqlAvailable;
  }

  try {
    const baseUrl = getSqlApiBaseUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    isSqlChecked = true;
    lastCheckTime = now;
    isSqlAvailable = res.ok;
    return isSqlAvailable;
  } catch (err) {
    isSqlChecked = true;
    lastCheckTime = now;
    isSqlAvailable = false;
    return false;
  }
}

/**
 * 1. Ambil Riwayat Transaksi Privat dari Database Node/SQLite
 */
export async function fetchUserTransactionsFromSql(userEmailOrKey) {
  if (!userEmailOrKey) return null;
  const isHealthy = await checkSqlBackendHealth();
  if (!isHealthy) return null;

  const baseUrl = getSqlApiBaseUrl();
  const clean = encodeURIComponent(String(userEmailOrKey).toLowerCase().trim());

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${baseUrl}/api/transactions/user/${clean}`, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch (err) {
    // Backend offline / fallback ke Firebase
  }
  return null;
}

/**
 * 2. Ambil Semua Transaksi untuk Admin Dashboard dari Server Dedicated
 */
export async function fetchAllTransactionsFromSql() {
  const isHealthy = await checkSqlBackendHealth();
  if (!isHealthy) return null;

  const baseUrl = getSqlApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${baseUrl}/api/transactions`, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch (err) {}
  return null;
}

/**
 * 3. Simpan Transaksi Baru ke Database Dedicated
 * Memicu WebSocket 0ms ke seluruh Admin yang sedang membuka panel!
 */
export async function createTransactionInSql(transactionData) {
  const isHealthy = await checkSqlBackendHealth();
  if (!isHealthy) return null;

  const baseUrl = getSqlApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${baseUrl}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(transactionData),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && (data.data || data.transaction)) {
        return data.data || data.transaction;
      }
    }
  } catch (err) {
    console.warn('[Dedicated Server] Gagal menyimpan ke backend:', err);
  }
  return null;
}

/**
 * 4. Update Status Transaksi di Backend (Fulfill / Reject / Note)
 */
export async function updateTransactionInSql(patchData) {
  const baseUrl = getSqlApiBaseUrl();
  const id = patchData.id;
  if (!id) return null;

  try {
    const res = await fetch(`${baseUrl}/api/transactions/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(patchData)
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return data.data || data.transaction;
      }
    }
  } catch (err) {
    console.warn('[Dedicated Server] Gagal update transaksi:', err);
  }
  return null;
}

/**
 * 5. Hapus Foto Bukti di Database Server
 */
export async function deleteTransactionProofInSql(id) {
  if (!id) return false;
  const baseUrl = getSqlApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/transactions/${encodeURIComponent(id)}/proof`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

/**
 * 6. Bersihkan Seluruh Transaksi di Database Server
 */
export async function clearAllTransactionsInSql() {
  const baseUrl = getSqlApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/transactions`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

/**
 * 7. Sinkronisasi Profil User ke Database Dedicated
 */
export async function syncUserToSql(user) {
  if (!user) return null;
  const baseUrl = getSqlApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(user)
    });
    if (res.ok) {
      const data = await res.json();
      return data?.data || data?.user || null;
    }
  } catch (err) {}
  return null;
}

export const saveUserToSql = syncUserToSql;

/**
 * 8. Ambil Semua Registered Users dari Database Dedicated
 */
export async function fetchAllUsersFromSql() {
  const isHealthy = await checkSqlBackendHealth();
  if (!isHealthy) return null;

  const baseUrl = getSqlApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/users`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch (err) {}
  return null;
}

/**
 * 9. Update Ban Status di Database Dedicated
 */
export async function banUserInSql(id, banStatus) {
  if (!id) return false;
  const baseUrl = getSqlApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/users/${encodeURIComponent(id)}/ban`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(banStatus)
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

/**
 * 10. Hapus User dari Database Dedicated
 */
export async function deleteUserFromSql(id) {
  if (!id) return false;
  const baseUrl = getSqlApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/users/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

/**
 * 11. Ambil Kunjungan Permanen dari Database Dedicated
 */
export async function fetchAllVisitsFromSql() {
  const isHealthy = await checkSqlBackendHealth();
  if (!isHealthy) return null;

  const baseUrl = getSqlApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/visits`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch (err) {}
  return null;
}

/**
 * 12. Simpan Kunjungan Permanen ke Database Dedicated
 */
export async function saveVisitToSql(visit) {
  if (!visit) return null;
  const baseUrl = getSqlApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visit)
    });
    if (res.ok) {
      const data = await res.json();
      return data?.data || null;
    }
  } catch (err) {}
  return null;
}

/**
 * 13. Ambil Activity Logs dari Database Dedicated
 */
export async function fetchAllActivitiesFromSql(limit = 100) {
  const isHealthy = await checkSqlBackendHealth();
  if (!isHealthy) return null;

  const baseUrl = getSqlApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/activities?limit=${limit}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch (err) {}
  return null;
}

/**
 * 14. Simpan Activity Log ke Database Dedicated
 */
export async function saveActivityToSql(act) {
  if (!act) return null;
  const baseUrl = getSqlApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(act)
    });
    if (res.ok) {
      const data = await res.json();
      return data?.data || null;
    }
  } catch (err) {}
  return null;
}
