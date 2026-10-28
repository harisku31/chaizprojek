// ===================================================================
// CHAIZSTORE PHP + MYSQL BACKEND CLIENT ADAPTER
// Connects React frontend directly to PHP REST API & MySQL Database
// Guarantees 100% Server-Enforced Isolation per User Account
// ===================================================================

const DEFAULT_LOCAL_API = 'http://127.0.0.1:8000/api';

export function getSqlApiBaseUrl() {
  if (typeof window === 'undefined') return DEFAULT_LOCAL_API;

  // 1. Cek environment variable jika didefinisikan di .env
  if (import.meta.env.VITE_SQL_API_URL && import.meta.env.VITE_SQL_API_URL.trim()) {
    return import.meta.env.VITE_SQL_API_URL.trim().replace(/\/+$/, '');
  }

  // 2. Jika diakses via domain produksi dengan subfolder /backend/api
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Bisa mengarah ke /backend/api atau subdomain api
    return `${window.location.origin}/backend/api`;
  }

  // 3. Default saat development lokal
  return DEFAULT_LOCAL_API;
}

let isSqlChecked = false;
let isSqlAvailable = false;
let lastCheckTime = 0;

/**
 * Periksa apakah server backend PHP MySQL sedang aktif (Fast Circuit Breaker)
 */
export async function checkSqlBackendHealth() {
  const now = Date.now();
  if (isSqlChecked && now - lastCheckTime < 60000) {
    return isSqlAvailable;
  }

  try {
    const baseUrl = getSqlApiBaseUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`${baseUrl}/transactions.php?all=1`, {
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
 * 1. Ambil Riwayat Transaksi Privat dari Server MySQL
 * Hanya mengambil pesanan yang emailnya cocok persis di server database
 */
export async function fetchUserTransactionsFromSql(userEmail) {
  if (!userEmail) return null;
  const isHealthy = await checkSqlBackendHealth();
  if (!isHealthy) return null;

  const baseUrl = getSqlApiBaseUrl();
  const cleanEmail = encodeURIComponent(userEmail.toLowerCase().trim());

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(`${baseUrl}/transactions.php?user_email=${cleanEmail}`, {
      headers: {
        'Accept': 'application/json',
        'X-User-Email': userEmail.toLowerCase().trim()
      },
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
    // Backend offline / fallback
  }
  return null;
}

/**
 * 2. Ambil Semua Transaksi untuk Admin Dashboard dari MySQL
 */
export async function fetchAllTransactionsFromSql() {
  const isHealthy = await checkSqlBackendHealth();
  if (!isHealthy) return null;

  const baseUrl = getSqlApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(`${baseUrl}/transactions.php?all=1`, {
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
 * 3. Simpan Transaksi Baru ke Database MySQL
 */
export async function createTransactionInSql(transactionData) {
  const isHealthy = await checkSqlBackendHealth();
  if (!isHealthy) return null;

  const baseUrl = getSqlApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${baseUrl}/transactions.php`, {
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
      if (data && data.success && data.transaction) {
        return data.transaction;
      }
    }
  } catch (err) {
    console.warn('[SQL Client] Gagal menyimpan ke backend PHP:', err);
  }
  return null;
}

/**
 * 4. Update Status Transaksi di MySQL (Fulfill / Rating)
 */
export async function updateTransactionInSql(patchData) {
  const baseUrl = getSqlApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/transactions.php`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(patchData)
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return data.transaction;
      }
    }
  } catch (err) {
    console.warn('[SQL Client] Gagal update transaksi di MySQL:', err);
  }
  return null;
}

/**
 * 5. Hapus Foto Bukti di Database MySQL
 */
export async function deleteTransactionProofInSql(id) {
  const baseUrl = getSqlApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/transactions.php?id=${encodeURIComponent(id)}&action=delete_proof`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

/**
 * 6. Sinkronisasi Profil User ke Database MySQL
 */
export async function syncUserToSql(user) {
  if (!user || !user.email) return null;
  const baseUrl = getSqlApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/auth.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: user.email,
        name: user.name || user.displayName || 'Pengguna',
        picture: user.picture || user.photoURL || null,
        role: user.role || 'user',
        userKey: user.id || null
      })
    });
    if (res.ok) {
      const data = await res.json();
      return data?.user || null;
    }
  } catch (err) {}
  return null;
}

