// ===================================================================
// CHAIZSTORE DEDICATED SQL & NODE.JS BACKEND CLIENT ADAPTER
// Connects React frontend directly to Express + SQLite/PostgreSQL Engine
// High Performance, Sub-10ms Queries, Zero Browser Socket Limitations
// ===================================================================

const DEFAULT_LOCAL_API = 'http://127.0.0.1:3005';
let activeBackendUrl = null;

export function getSqlApiBaseUrl() {
  if (activeBackendUrl) return activeBackendUrl;
  if (typeof window === 'undefined') return DEFAULT_LOCAL_API;

  // 1. Cek environment variable jika didefinisikan di .env
  if (import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL.trim()) {
    return import.meta.env.VITE_BACKEND_URL.trim().replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_SQL_API_URL && import.meta.env.VITE_SQL_API_URL.trim()) {
    return import.meta.env.VITE_SQL_API_URL.trim().replace(/\/+$/, '');
  }

  // 2. Default: gunakan origin browser (terhubung via reverse proxy / Vite proxy ke port 3005)
  return window.location.origin;
}

let isSqlChecked = false;
let isSqlAvailable = false;
let lastCheckTime = 0;

/**
 * Periksa apakah server backend Node.js + SQLite sedang aktif (Circuit Breaker)
 */
export async function checkSqlBackendHealth() {
  const now = Date.now();
  if (isSqlChecked && isSqlAvailable && now - lastCheckTime < 10000) {
    return true;
  }

  const tryUrls = [
    getSqlApiBaseUrl(),
    typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://127.0.0.1:3005',
    'http://127.0.0.1:3005',
    DEFAULT_LOCAL_API
  ];

  const uniqueUrls = [...new Set(tryUrls.filter(Boolean))];

  for (const url of uniqueUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${url}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        activeBackendUrl = url;
        isSqlChecked = true;
        lastCheckTime = now;
        isSqlAvailable = true;
        return true;
      }
    } catch (_) {}
  }

  isSqlChecked = true;
  lastCheckTime = now;
  isSqlAvailable = false;
  return false;
}

function getCandidateUrls() {
  const current = getSqlApiBaseUrl();
  const direct = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://127.0.0.1:3005';
  return [...new Set([current, direct, 'http://127.0.0.1:3005', DEFAULT_LOCAL_API].filter(Boolean))];
}

/**
 * 1. Ambil Riwayat Transaksi Privat dari Database Node/SQLite
 */
export async function fetchUserTransactionsFromSql(userEmailOrKey) {
  if (!userEmailOrKey) return null;
  const clean = encodeURIComponent(String(userEmailOrKey).toLowerCase().trim());
  const urls = getCandidateUrls();

  for (const baseUrl of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${baseUrl}/api/transactions/user/${clean}`, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data)) {
          activeBackendUrl = baseUrl;
          isSqlAvailable = true;
          return data.data;
        }
      }
    } catch (err) {}
  }
  return null;
}

/**
 * 2. Ambil Semua Transaksi untuk Admin Dashboard dari Server Dedicated
 */
export async function fetchAllTransactionsFromSql() {
  const urls = getCandidateUrls();

  for (const baseUrl of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${baseUrl}/api/transactions`, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data)) {
          activeBackendUrl = baseUrl;
          isSqlAvailable = true;
          return data.data;
        }
      }
    } catch (err) {}
  }
  return null;
}

/**
 * 3. Simpan Transaksi Baru ke Database Dedicated
 * Memicu WebSocket 0ms ke seluruh Admin yang sedang membuka panel!
 */
export async function createTransactionInSql(transactionData) {
  const urls = getCandidateUrls();

  for (const baseUrl of urls) {
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
          activeBackendUrl = baseUrl;
          isSqlAvailable = true;
          return data.data || data.transaction;
        }
      }
    } catch (err) {}
  }
  return null;
}

/**
 * 4. Update Status Transaksi di Backend (Fulfill / Reject / Note)
 */
export async function updateTransactionInSql(patchData) {
  const id = patchData?.id;
  if (!id) return null;
  const urls = getCandidateUrls();

  for (const baseUrl of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${baseUrl}/api/transactions/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(patchData),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          activeBackendUrl = baseUrl;
          isSqlAvailable = true;
          return data.data || data.transaction;
        }
      }
    } catch (err) {}
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

// ===================================================================
// DEPOSIT REPOSITORY CALLS (CHAIZMONEY)
// ===================================================================

export async function createDepositInSql(dep) {
  if (!dep) return null;
  const isHealthy = await checkSqlBackendHealth();
  if (!isHealthy) return null;

  const baseUrl = getSqlApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/deposits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dep)
    });
    if (res.ok) {
      const data = await res.json();
      return data?.data || null;
    }
  } catch (err) {
    console.warn('Failed to save deposit in SQL:', err.message);
  }
  return null;
}

export async function fetchAllDepositsFromSql() {
  const isHealthy = await checkSqlBackendHealth();
  if (!isHealthy) return null;

  const baseUrl = getSqlApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/deposits`, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch deposits from SQL:', err.message);
  }
  return null;
}

export async function fetchUserDepositsFromSql(userEmailOrKey) {
  if (!userEmailOrKey) return null;
  const isHealthy = await checkSqlBackendHealth();
  if (!isHealthy) return null;

  const baseUrl = getSqlApiBaseUrl();
  const clean = encodeURIComponent(String(userEmailOrKey).toLowerCase().trim());
  try {
    const res = await fetch(`${baseUrl}/api/deposits/user/${clean}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch user deposits from SQL:', err.message);
  }
  return null;
}

export async function updateDepositInSql(id, patch) {
  if (!id || !patch) return null;
  const isHealthy = await checkSqlBackendHealth();
  if (!isHealthy) return null;

  const baseUrl = getSqlApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/deposits/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
    if (res.ok) {
      const data = await res.json();
      return data?.data || null;
    }
  } catch (err) {
    console.warn('Failed to update deposit in SQL:', err.message);
  }
  return null;
}
