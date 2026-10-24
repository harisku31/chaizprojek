// Utilitas untuk memeriksa akun Roblox dan avatar headshot

const profileCache = new Map();

/**
 * Mencari data profil Roblox (Avatar headshot, display name, user ID, verified status)
 * @param {string} rawUsername
 * @returns {Promise<{ found: boolean, user?: object, message?: string, error?: string }>}
 */
export async function fetchRobloxProfile(rawUsername) {
  let username = (rawUsername || '').trim();
  if (username.startsWith('@')) {
    username = username.substring(1).trim();
  }

  if (!username || username.length < 3) {
    return { found: false, message: 'Username minimal 3 karakter' };
  }

  const cacheKey = username.toLowerCase();
  if (profileCache.has(cacheKey)) {
    return profileCache.get(cacheKey);
  }

  try {
    const res = await fetch(`/api/roblox-user?username=${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.success && data.found && data.user) {
      const result = {
        found: true,
        user: data.user
      };
      profileCache.set(cacheKey, result);
      return result;
    }

    const notFoundResult = {
      found: false,
      message: data.message || `Akun Roblox "${username}" tidak ditemukan.`
    };
    // Simpan di cache sementara (TTL sederhana atau map)
    profileCache.set(cacheKey, notFoundResult);
    return notFoundResult;
  } catch (err) {
    console.warn('Gagal memverifikasi akun Roblox:', err);
    return {
      found: false,
      error: 'Tidak dapat menghubungkan ke server Roblox saat ini.'
    };
  }
}
