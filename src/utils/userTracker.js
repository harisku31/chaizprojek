/**
 * ChaizStore User Tracker, Presence, Banned Management & Activity Logging System
 * Tracks user list, online/offline presence, session status (Masih Login vs Log Out),
 * temporary & permanent bans, and chronological activity history for Admin Dashboard.
 */

import {
  writeToFirebase,
  updateInFirebase,
  readFromFirebase,
  deleteFromFirebase,
  listenToFirebase
} from './firebase.js';

const STORAGE_KEY = 'chaiz_admin_user_logs';
const USERS_KEY = 'chaiz_admin_registered_users';
const ACTIVITY_KEY = 'chaiz_admin_activity_logs';
const PERMANENT_VISITS_KEY = 'chaiz_permanent_visit_history';
const FIREBASE_PATH_USERS = 'registered_users';
const FIREBASE_PATH_ACTIVITIES = 'activity_logs';
const FIREBASE_PATH_BANNED = 'banned_users';
const FIREBASE_PATH_VISITS = 'permanent_visits';
const BANNED_KEY = 'chaiz_admin_banned_users';
const ADMIN_AUTH_KEY = 'chaiz_admin_credentials';
const ADMIN_SESSION_KEY = 'chaiz_admin_session';

// Default Admin Credentials
export const DEFAULT_ADMIN_CREDENTIALS = {
  username: 'chaiz',
  password: '34313431',
  adminName: 'Owner ChaizStore'
};

/**
 * Check if current hostname is localhost or local IP
 */
export function isLocalhostHost(hostname = (typeof window !== 'undefined' ? window.location.hostname : 'localhost')) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.endsWith('.local')
  );
}

/**
 * Parse user agent to detect human-readable device and OS
 */
export function parseDevice(ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '')) {
  const isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(ua);
  let os = 'Unknown OS';

  if (/Windows NT 10/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS (iPhone/iPad)';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return {
    type: isMobile ? 'Smartphone / Mobile' : 'Laptop / PC Desktop',
    os,
    isMobile
  };
}

/**
 * Parse user agent to detect browser
 */
export function parseBrowser(ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '')) {
  if (/Edg\//i.test(ua)) return 'Microsoft Edge';
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'Google Chrome';
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Apple Safari';
  if (/Firefox\//i.test(ua)) return 'Mozilla Firefox';
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return 'Opera';
  return 'Web Browser';
}

/**
 * Helper to dispatch cross-tab sync
 */
export function broadcastAdminUpdate(type, payload = {}) {
  try {
    window.dispatchEvent(new Event('storage'));
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('chaiz_admin_sync');
      bc.postMessage({ type, ...payload });
      bc.close();
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Generate a consistent unique user ID based on email or name
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
 * Check if a user is currently ONLINE (heartbeat within 40 seconds & not logged out & not banned)
 */
export function isUserOnline(userRecord) {
  if (!userRecord) return false;
  if (userRecord.sessionStatus === 'logged_out') return false;
  if (userRecord.banStatus?.isBanned) return false;
  const lastHb = userRecord.lastHeartbeat || 0;
  return (Date.now() - lastHb) < 40000; // 40 seconds threshold
}

// =========================================================================
// 1. BANNED SYSTEM (BANNED SEMENTARA & PERMANEN DARI WEB)
// =========================================================================

export function getBannedList() {
  try {
    const raw = localStorage.getItem(BANNED_KEY);
    const list = raw ? JSON.parse(raw) : [];

    // Filter out expired temporary bans
    const now = Date.now();
    let changed = false;
    const activeList = list.filter((item) => {
      if (item.banType === 'temporary' && item.bannedUntil) {
        const until = new Date(item.bannedUntil).getTime();
        if (now >= until) {
          changed = true;
          return false; // Expired
        }
      }
      return true;
    });

    if (changed) {
      localStorage.setItem(BANNED_KEY, JSON.stringify(activeList));
    }
    return activeList;
  } catch (err) {
    console.error('Failed to get banned list:', err);
    return [];
  }
}

function saveBannedList(list) {
  try {
    localStorage.setItem(BANNED_KEY, JSON.stringify(list));
    broadcastAdminUpdate('BANNED_UPDATED', { count: list.length });
  } catch (err) {
    console.error('Failed to save banned list:', err);
  }
}

/**
 * Format duration minutes into readable text (e.g. 15 Menit, 1 Jam, 24 Jam, 3 Hari)
 */
export function formatDurationMinutes(minutes) {
  const m = parseInt(minutes, 10) || 0;
  if (m <= 0) return '-';
  if (m < 60) return `${m} Menit`;
  const hours = Math.floor(m / 60);
  const remainingM = m % 60;
  if (hours < 24) {
    return remainingM > 0 ? `${hours} Jam ${remainingM} Menit` : `${hours} Jam`;
  }
  const days = Math.floor(hours / 24);
  const remainingH = hours % 24;
  return remainingH > 0 ? `${days} Hari ${remainingH} Jam` : `${days} Hari`;
}

/**
 * Check if a user or email is banned
 * Returns: { isBanned: boolean, banType: 'temporary'|'permanent'|null, reason: string, bannedUntil: string|null, bannedAt: string|null }
 */
export function isUserBanned(userOrEmail) {
  if (!userOrEmail) return { isBanned: false };

  const email = (typeof userOrEmail === 'string' ? userOrEmail : userOrEmail.email || '').toLowerCase().trim();
  const userId = typeof userOrEmail === 'object' ? getUniqueUserId(userOrEmail) : '';
  const objId = typeof userOrEmail === 'object' ? (userOrEmail.id || userOrEmail.userId || '') : '';

  const bannedList = getBannedList();
  const found = bannedList.find((b) => {
    if (email && b.email && b.email.toLowerCase().trim() === email) return true;
    if (userId && b.userId === userId) return true;
    if (objId && (b.userId === objId || b.id === objId)) return true;
    return false;
  });

  if (!found) return { isBanned: false };

  // Double check temporary expiration
  if (found.banType === 'temporary' && found.bannedUntil) {
    if (Date.now() >= new Date(found.bannedUntil).getTime()) {
      // Ban expired!
      unbanUser(found.userId || found.id || found.email);
      return { isBanned: false };
    }
  }

  const durationText = found.banType === 'permanent'
    ? 'Permanen'
    : found.durationText || formatDurationMinutes(found.durationMinutes || 60);

  return {
    isBanned: true,
    banType: found.banType, // 'temporary' | 'permanent'
    durationMinutes: found.durationMinutes,
    durationText,
    reason: found.reason || 'Pelanggaran aturan toko',
    bannedAt: found.bannedAt,
    bannedUntil: found.bannedUntil,
    banId: found.id,
    userName: found.name,
    userEmail: found.email
  };
}

/**
 * Ban a user or visitor (temporary or permanent)
 * @param {string|object} userOrId User ID or User/Visitor object to ban
 * @param {'temporary'|'permanent'} banType
 * @param {number} durationMinutes Duration in minutes (if temporary)
 * @param {string} reason Reason for banning
 */
export function banUser(userOrId, banType = 'temporary', durationMinutes = 60, reason = 'Pelanggaran aturan toko') {
  if (!userOrId) return false;

  const users = getRegisteredUsers();
  const visits = getPermanentVisits();

  let targetObj = null;
  if (typeof userOrId === 'object') {
    targetObj = userOrId;
  } else {
    targetObj =
      users.find((u) => u.id === userOrId || u.userId === userOrId) ||
      visits.find((v) => v.id === userOrId || v.userId === userOrId || (v.email && v.email === userOrId));
  }

  const finalUserId = targetObj?.userId || targetObj?.id || (typeof userOrId === 'string' ? userOrId : `usr_${Date.now()}`);
  const finalEmail = (targetObj?.email || (typeof userOrId === 'string' && userOrId.includes('@') ? userOrId : '')).toLowerCase().trim();
  const finalName = targetObj?.name || (finalEmail ? finalEmail.split('@')[0] : 'Pengguna');

  const nowIso = new Date().toISOString();
  let bannedUntil = null;
  const minutes = Math.max(1, parseInt(durationMinutes, 10) || 60);
  const durationText = banType === 'permanent' ? 'Permanen' : formatDurationMinutes(minutes);

  if (banType === 'temporary') {
    bannedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  }

  const banRecord = {
    id: `ban_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    userId: finalUserId,
    name: finalName,
    email: finalEmail,
    banType,
    durationMinutes: banType === 'temporary' ? minutes : null,
    durationText,
    reason: reason || 'Pelanggaran aturan toko',
    bannedAt: nowIso,
    bannedUntil
  };

  // 1. Update Banned List
  const bannedList = getBannedList();
  const filteredBanned = bannedList.filter((b) => {
    if (finalUserId && (b.userId === finalUserId || b.id === finalUserId)) return false;
    if (finalEmail && b.email && b.email.toLowerCase().trim() === finalEmail) return false;
    return true;
  });
  saveBannedList([banRecord, ...filteredBanned]);

  // 2. Update Registered User if exists
  const regUser = users.find(
    (u) => (finalUserId && (u.id === finalUserId || u.userId === finalUserId)) ||
           (finalEmail && u.email && u.email.toLowerCase().trim() === finalEmail)
  );
  if (regUser) {
    regUser.banStatus = {
      isBanned: true,
      banType,
      durationMinutes: banType === 'temporary' ? minutes : null,
      durationText,
      reason: banRecord.reason,
      bannedAt: nowIso,
      bannedUntil
    };
    regUser.sessionStatus = 'logged_out'; // Force logout
    regUser.lastHeartbeat = 0; // Force offline
    saveRegisteredUsers(users);
  }

  // 3. Update Permanent Visit if exists
  let visitUpdated = false;
  visits.forEach((v) => {
    if (
      (finalUserId && (v.userId === finalUserId || v.id === finalUserId)) ||
      (finalEmail && v.email && v.email.toLowerCase().trim() === finalEmail)
    ) {
      v.banStatus = {
        isBanned: true,
        banType,
        durationMinutes: banType === 'temporary' ? minutes : null,
        durationText,
        reason: banRecord.reason,
        bannedAt: nowIso,
        bannedUntil
      };
      visitUpdated = true;
      try {
        updateInFirebase(`${FIREBASE_PATH_VISITS}/${v.userId || v.id}`, { banStatus: v.banStatus }).catch(() => {});
      } catch (e) {}
    }
  });
  if (visitUpdated) {
    savePermanentVisits(visits);
  }

  // 4. Log Activity
  const banLabel = banType === 'permanent' ? 'Banned Permanen' : `Banned Sementara (${minutes} menit)`;
  recordUserActivity(
    { id: finalUserId, name: finalName, email: finalEmail },
    'BANNED',
    `Sanksi Admin: Akun dikenai ${banLabel}. Alasan: "${reason}"`
  );

  broadcastAdminUpdate('USER_BANNED', { userId: finalUserId, email: finalEmail, banType, reason });
  return banRecord;
}

/**
 * Unban a user
 */
export function unbanUser(userOrId) {
  if (!userOrId) return false;

  const targetId = typeof userOrId === 'string' ? userOrId : (userOrId.id || userOrId.userId || '');
  const targetEmail = (
    typeof userOrId === 'string'
      ? (userOrId.includes('@') ? userOrId : '')
      : (userOrId.email || '')
  ).toLowerCase().trim();

  const users = getRegisteredUsers();
  const user = users.find((u) => {
    if (targetId && (u.id === targetId || u.userId === targetId)) return true;
    if (targetEmail && u.email && u.email.toLowerCase().trim() === targetEmail) return true;
    return false;
  });

  const finalId = user?.id || targetId;
  const finalEmail = (user?.email || targetEmail).toLowerCase().trim();

  // 1. Remove from Banned List thoroughly by ID and email (case-insensitive)
  const bannedList = getBannedList();
  const filteredBanned = bannedList.filter((b) => {
    if (finalId && (b.userId === finalId || b.id === finalId)) return false;
    if (finalEmail && b.email && b.email.toLowerCase().trim() === finalEmail) return false;
    if (targetEmail && b.email && b.email.toLowerCase().trim() === targetEmail) return false;
    return true;
  });
  saveBannedList(filteredBanned);

  // 2. Clear banStatus in Registered User
  if (user) {
    user.banStatus = null;
    user.sessionStatus = 'logged_in';
    saveRegisteredUsers(users);

    // 3. Log Activity
    recordUserActivity(
      user,
      'UNBANNED',
      'Status Banned dicabut oleh Admin (Akun dipulihkan)'
    );
  }

  // 4. Update chaiz_auth_user in localStorage if it matches this user
  try {
    const rawAuth = localStorage.getItem('chaiz_auth_user');
    if (rawAuth) {
      const authObj = JSON.parse(rawAuth);
      const authEmail = (authObj.email || '').toLowerCase().trim();
      const authId = authObj.id || authObj.userId || '';
      if ((finalEmail && authEmail === finalEmail) || (finalId && authId === finalId)) {
        authObj.isBanned = false;
        authObj.banStatus = null;
        localStorage.setItem('chaiz_auth_user', JSON.stringify(authObj));
      }
    }
  } catch (e) {
    console.error('Error updating auth user on unban:', e);
  }

  // 5. Clear banStatus in Permanent Visits
  try {
    const visits = getPermanentVisits();
    let visitChanged = false;
    visits.forEach((v) => {
      if (
        (finalId && (v.userId === finalId || v.id === finalId)) ||
        (finalEmail && v.email && v.email.toLowerCase().trim() === finalEmail)
      ) {
        v.banStatus = null;
        visitChanged = true;
        try {
          updateInFirebase(`${FIREBASE_PATH_VISITS}/${v.userId || v.id}`, { banStatus: null }).catch(() => {});
        } catch (e) {}
      }
    });
    if (visitChanged) {
      savePermanentVisits(visits);
    }
  } catch (e) {}

  // 6. Save unbanned notice so client shows "Akun Anda Tidak Di-banned Lagi" window
  try {
    localStorage.setItem('chaiz_last_unbanned_notice', JSON.stringify({
      userId: finalId,
      email: finalEmail,
      name: user?.name || finalEmail || 'Pengguna',
      timestamp: Date.now()
    }));
  } catch (e) {}

  broadcastAdminUpdate('USER_UNBANNED', { userId: finalId, email: finalEmail, name: user?.name });
  return true;
}

// =========================================================================
// 2. USERS DIRECTORY (JUMLAH & DAFTAR PENGGUNA)
// =========================================================================

export function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const users = raw ? JSON.parse(raw) : [];

    // Sync active ban statuses
    const now = Date.now();
    let needSave = false;
    const synced = users.map((u) => {
      if (u.banStatus?.isBanned) {
        if (u.banStatus.banType === 'temporary' && u.banStatus.bannedUntil) {
          if (now >= new Date(u.banStatus.bannedUntil).getTime()) {
            u.banStatus = null;
            needSave = true;
          }
        }
      }
      return u;
    });

    if (needSave) {
      localStorage.setItem(USERS_KEY, JSON.stringify(synced));
    }
    return synced;
  } catch (err) {
    console.error('Failed to get registered users:', err);
    return [];
  }
}

export function saveRegisteredUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    broadcastAdminUpdate('USERS_UPDATED', { count: users.length });
  } catch (err) {
    console.error('Failed to save registered users:', err);
  }
}

/**
 * Sinkronkan seluruh data akun pengguna dari Cloud Firebase Realtime Database
 * Menggabungkan akun yang login dari Ponsel/HP & Laptop secara otomatis
 */
export async function syncRegisteredUsersFromCloud() {
  if (typeof window === 'undefined') return getRegisteredUsers();

  try {
    const [cloudUsersData, cloudVisitsData] = await Promise.all([
      readFromFirebase(FIREBASE_PATH_USERS).catch(() => null),
      readFromFirebase(FIREBASE_PATH_VISITS).catch(() => null)
    ]);

    const localUsers = getRegisteredUsers();
    const userMap = new Map();

    // 1. Data lokal sebagai dasar awal
    localUsers.forEach((u) => {
      if (u && (u.id || u.userId)) {
        userMap.set(u.id || u.userId, u);
      }
    });

    // 2. Gabungkan data akun dari Firebase node registered_users
    if (cloudUsersData) {
      const cloudList = Array.isArray(cloudUsersData)
        ? cloudUsersData.filter(Boolean)
        : Object.values(cloudUsersData).filter(Boolean);

      cloudList.forEach((cu) => {
        if (!cu || (!cu.id && !cu.userId)) return;
        const id = cu.id || cu.userId;
        const existing = userMap.get(id);
        if (!existing) {
          userMap.set(id, cu);
        } else {
          const existingTime = new Date(existing.lastActiveTime || existing.lastHeartbeat || 0).getTime();
          const cloudTime = new Date(cu.lastActiveTime || cu.lastHeartbeat || 0).getTime();
          userMap.set(id, {
            ...existing,
            ...cu,
            lastHeartbeat: cu.lastHeartbeat !== undefined ? cu.lastHeartbeat : existing.lastHeartbeat,
            lastActiveTime: cloudTime >= existingTime ? cu.lastActiveTime : existing.lastActiveTime,
            sessionStatus: cu.sessionStatus || existing.sessionStatus
          });
        }
      });
    }

    // 3. Gabungkan juga akun yang tercatat di kunjungan permanen agar tidak ada akun HP yang terlewat
    if (cloudVisitsData) {
      const visitsList = Array.isArray(cloudVisitsData)
        ? cloudVisitsData.filter(Boolean)
        : Object.values(cloudVisitsData).filter(Boolean);

      visitsList.forEach((v) => {
        if (!v || (!v.userId && !v.id)) return;
        const id = v.userId || v.id;
        const existing = userMap.get(id);
        if (!existing && v.email && v.email !== 'tanpa_email@chaizstore.id') {
          const newUser = {
            id,
            name: v.name || 'Pengguna Chaiz',
            email: v.email,
            picture: v.picture || null,
            sessionStatus: 'logged_in',
            lastHeartbeat: v.lastHeartbeat || Date.now(),
            firstLoginTime: v.firstVisitedAt || new Date().toISOString(),
            lastActiveTime: v.lastActiveAt || new Date().toISOString(),
            loginCount: v.totalVisitsCount || 1,
            activitiesCount: (v.activityHistory || []).length || 1,
            deviceType: v.isMobile ? 'Smartphone / Mobile' : 'Laptop / PC Desktop',
            os: v.os || 'Android',
            isMobile: Boolean(v.isMobile),
            browser: v.browser || 'Google Chrome',
            banStatus: v.banStatus || null,
            lastActivitySummary: v.currentActivity || 'Login ke akun toko'
          };
          userMap.set(id, newUser);
          writeToFirebase(`${FIREBASE_PATH_USERS}/${id}`, newUser).catch(() => {});
        }
      });
    }

    const merged = Array.from(userMap.values());
    merged.sort((a, b) => new Date(b.lastActiveTime || b.firstLoginTime || 0).getTime() - new Date(a.lastActiveTime || a.firstLoginTime || 0).getTime());
    localStorage.setItem(USERS_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.error('Failed to sync registered users from cloud:', err);
    return getRegisteredUsers();
  }
}

/**
 * Langganan realtime streaming (Firebase SSE) untuk seluruh perubahan akun pengguna
 * Memberikan update instan (<50ms) saat pengguna login di ponsel/HP
 */
export function listenToRegisteredUsers(callback) {
  if (typeof window === 'undefined') return () => {};

  return listenToFirebase(FIREBASE_PATH_USERS, (cloudData) => {
    if (!cloudData) return;
    try {
      const cloudList = Array.isArray(cloudData)
        ? cloudData.filter(Boolean)
        : Object.values(cloudData).filter(Boolean);

      if (cloudList.length > 0) {
        const local = getRegisteredUsers();
        const map = new Map();
        local.forEach((u) => map.set(u.id || u.userId, u));

        cloudList.forEach((cu) => {
          if (!cu || (!cu.id && !cu.userId)) return;
          const id = cu.id || cu.userId;
          const existing = map.get(id);
          if (!existing) {
            map.set(id, cu);
          } else {
            map.set(id, {
              ...existing,
              ...cu,
              lastHeartbeat: cu.lastHeartbeat !== undefined ? cu.lastHeartbeat : existing.lastHeartbeat,
              sessionStatus: cu.sessionStatus || existing.sessionStatus
            });
          }
        });

        const merged = Array.from(map.values());
        merged.sort((a, b) => new Date(b.lastActiveTime || b.firstLoginTime || 0).getTime() - new Date(a.lastActiveTime || a.firstLoginTime || 0).getTime());
        localStorage.setItem(USERS_KEY, JSON.stringify(merged));
        callback(merged);
      }
    } catch (e) {
      console.warn('Error in listenToRegisteredUsers:', e);
    }
  });
}

// =========================================================================
// 3. AKTIVITAS (HISTORY AKTIF PENGGUNA)
// =========================================================================

export function getActivityLogs() {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to get activity logs:', err);
    return [];
  }
}

export function saveActivityLogs(activities) {
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activities));
    broadcastAdminUpdate('ACTIVITIES_UPDATED', { count: activities.length });
  } catch (err) {
    console.error('Failed to save activity logs:', err);
  }
}

export async function syncActivityLogsFromCloud() {
  if (typeof window === 'undefined') return getActivityLogs();
  try {
    const cloudData = await readFromFirebase(FIREBASE_PATH_ACTIVITIES);
    if (cloudData) {
      const cloudList = Array.isArray(cloudData)
        ? cloudData.filter(Boolean)
        : Object.values(cloudData).filter(Boolean);
      const local = getActivityLogs();
      const map = new Map();
      local.forEach((a) => map.set(a.id, a));
      cloudList.forEach((a) => map.set(a.id, a));
      const merged = Array.from(map.values());
      merged.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(merged.slice(0, 399)));
      return merged;
    }
  } catch (e) {}
  return getActivityLogs();
}

export function listenToActivityLogs(callback) {
  if (typeof window === 'undefined') return () => {};
  return listenToFirebase(FIREBASE_PATH_ACTIVITIES, (cloudData) => {
    if (!cloudData) return;
    try {
      const cloudList = Array.isArray(cloudData)
        ? cloudData.filter(Boolean)
        : Object.values(cloudData).filter(Boolean);
      if (cloudList.length > 0) {
        const local = getActivityLogs();
        const map = new Map();
        local.forEach((a) => map.set(a.id, a));
        cloudList.forEach((a) => map.set(a.id, a));
        const merged = Array.from(map.values());
        merged.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
        localStorage.setItem(ACTIVITY_KEY, JSON.stringify(merged.slice(0, 399)));
        callback(merged);
      }
    } catch (e) {}
  });
}

/**
 * Record a specific user activity
 */
export function recordUserActivity(user, actionType, description) {
  if (!user) return null;

  const device = parseDevice();
  const browser = parseBrowser();
  const userId = getUniqueUserId(user);

  const newActivity = {
    id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    userId,
    userName: user.name || 'Pengguna Chaiz',
    userEmail: user.email || 'tanpa_email@chaizstore.id',
    userPicture: user.picture || null,
    actionType: actionType || 'GENERAL_ACTION',
    description: description || 'Melakukan aktivitas di toko',
    timestamp: new Date().toISOString(),
    device: `${device.os} • ${browser}`
  };

  const activities = getActivityLogs();
  const updatedActivities = [newActivity, ...activities.slice(0, 399)]; // Keep up to 400 latest activities
  saveActivityLogs(updatedActivities);

  // Sync to Firebase Cloud
  try {
    writeToFirebase(`${FIREBASE_PATH_ACTIVITIES}/${newActivity.id}`, newActivity).catch(() => {});
  } catch (e) {}

  // Also touch registered user active time & heartbeat if not banned
  const users = getRegisteredUsers();
  const existingIndex = users.findIndex((u) => u.id === userId);
  if (existingIndex !== -1 && !users[existingIndex].banStatus?.isBanned) {
    users[existingIndex].lastActiveTime = newActivity.timestamp;
    users[existingIndex].lastHeartbeat = Date.now();
    users[existingIndex].activitiesCount = (users[existingIndex].activitiesCount || 0) + 1;
    users[existingIndex].lastActivitySummary = description;
    saveRegisteredUsers(users);

    try {
      updateInFirebase(`${FIREBASE_PATH_USERS}/${userId}`, {
        lastActiveTime: newActivity.timestamp,
        lastHeartbeat: Date.now(),
        activitiesCount: users[existingIndex].activitiesCount,
        lastActivitySummary: description
      }).catch(() => {});
    } catch (e) {}
  }

  // Sinkronkan ke riwayat kunjungan abadi (permanen tanpa bisa dihapus)
  try {
    recordUserVisit(user, description);
  } catch (e) {}

  return newActivity;
}

// =========================================================================
// 3B. PERMANENT VISIT LOGS (RIWAYAT KUNJUNGAN ABADI - TIDAK BISA DIHAPUS)
// =========================================================================

export function isVisitOnline(visit) {
  if (!visit || !visit.lastHeartbeat) return false;
  return Date.now() - Number(visit.lastHeartbeat) < 45000;
}

export function getPermanentVisits() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PERMANENT_VISITS_KEY);
    let list = raw ? JSON.parse(raw) : [];

    // Jika belum ada data kunjungan tetapi sudah ada registered users, auto-seed dari registered users
    if (list.length === 0) {
      const users = getRegisteredUsers();
      if (users.length > 0) {
        list = users.map((u) => {
          const act = u.lastActivitySummary || 'Mengunjungi toko ChaizStore';
          return {
            id: `vis_${Date.now()}_${u.id}`,
            userId: u.id,
            name: u.name || 'Pengunjung Chaiz',
            email: u.email || 'tanpa_email@chaizstore.id',
            picture: u.picture || null,
            firstVisitedAt: u.firstLoginTime || u.lastActiveTime || new Date().toISOString(),
            lastActiveAt: u.lastActiveTime || new Date().toISOString(),
            lastHeartbeat: u.lastHeartbeat || 0,
            currentActivity: act,
            activityHistory: [
              {
                id: `act_${Date.now()}_seed`,
                action: act,
                timestamp: u.lastActiveTime || new Date().toISOString()
              }
            ],
            device: `${u.os || 'OS'} • ${u.browser || 'Browser'}`,
            os: u.os || 'OS',
            browser: u.browser || 'Browser',
            isMobile: !!u.isMobile,
            totalVisitsCount: u.loginCount || 1,
            isPermanent: true
          };
        });
        localStorage.setItem(PERMANENT_VISITS_KEY, JSON.stringify(list));
      }
    }

    // Sort: Paling baru aktif ditaruh di paling atas
    list.sort((a, b) => new Date(b.lastActiveAt || b.firstVisitedAt || 0).getTime() - new Date(a.lastActiveAt || a.firstVisitedAt || 0).getTime());
    return list;
  } catch (err) {
    console.error('Failed to get permanent visits:', err);
    return [];
  }
}

export function savePermanentVisits(visits) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PERMANENT_VISITS_KEY, JSON.stringify(visits));
    broadcastAdminUpdate('VISITS_UPDATED', { count: visits.length });
  } catch (err) {
    console.error('Failed to save permanent visits:', err);
  }
}

export function recordUserVisit(user, activityDescription = 'Mengunjungi toko ChaizStore') {
  if (!user || typeof window === 'undefined') return null;

  const device = parseDevice();
  const browser = parseBrowser();
  const userId = getUniqueUserId(user);
  const nowIso = new Date().toISOString();

  const visits = getPermanentVisits();
  const cleanEmail = (user.email || '').toLowerCase().trim();

  // Cari apakah user ini (berdasarkan userId atau Email) sudah punya riwayat kunjungan
  const existingIdx = visits.findIndex(
    (v) => v.userId === userId || (cleanEmail && cleanEmail !== '-' && v.email && v.email.toLowerCase() === cleanEmail)
  );

  const newAction = {
    id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    action: activityDescription,
    timestamp: nowIso
  };

  let targetVisit;
  if (existingIdx !== -1) {
    const existing = visits[existingIdx];
    const prevHistory = Array.isArray(existing.activityHistory) ? existing.activityHistory : [];
    
    // Jangan duplikasi aksi yang sama persis jika baru saja tercatat dalam 4 detik
    const isRecentDuplicate = prevHistory.length > 0 && prevHistory[0].action === activityDescription && (Date.now() - new Date(prevHistory[0].timestamp).getTime() < 4000);
    const updatedHistory = isRecentDuplicate ? prevHistory : [newAction, ...prevHistory.slice(0, 49)];

    targetVisit = {
      ...existing,
      name: user.name || existing.name,
      email: user.email || existing.email,
      picture: user.picture || existing.picture,
      lastActiveAt: nowIso,
      lastHeartbeat: Date.now(),
      currentActivity: activityDescription,
      activityHistory: updatedHistory,
      device: `${device.os} • ${browser}`,
      os: device.os,
      browser,
      isMobile: device.isMobile,
      totalVisitsCount: (existing.totalVisitsCount || 1) + 1,
      isPermanent: true
    };
    visits[existingIdx] = targetVisit;
  } else {
    targetVisit = {
      id: `vis_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      name: user.name || 'Pengunjung Chaiz',
      email: user.email || 'tanpa_email@chaizstore.id',
      picture: user.picture || null,
      firstVisitedAt: nowIso,
      lastActiveAt: nowIso,
      lastHeartbeat: Date.now(),
      currentActivity: activityDescription,
      activityHistory: [newAction],
      device: `${device.os} • ${browser}`,
      os: device.os,
      browser,
      isMobile: device.isMobile,
      totalVisitsCount: 1,
      isPermanent: true
    };
    visits.unshift(targetVisit);
  }

  savePermanentVisits(visits);

  // Sync atomic ke Firebase Realtime Database
  try {
    writeToFirebase(`${FIREBASE_PATH_VISITS}/${userId}`, targetVisit).catch(() => {});
  } catch (e) {}

  return targetVisit;
}

export function updateVisitHeartbeat(user) {
  if (!user || typeof window === 'undefined') return;
  const userId = getUniqueUserId(user);
  const cleanEmail = (user.email || '').toLowerCase().trim();

  try {
    const visits = getPermanentVisits();
    const existingIdx = visits.findIndex(
      (v) => v.userId === userId || (cleanEmail && cleanEmail !== '-' && v.email && v.email.toLowerCase() === cleanEmail)
    );
    if (existingIdx !== -1) {
      visits[existingIdx].lastHeartbeat = Date.now();
      visits[existingIdx].lastActiveAt = new Date().toISOString();
      localStorage.setItem(PERMANENT_VISITS_KEY, JSON.stringify(visits));
    }
  } catch (e) {}
}

export async function syncPermanentVisitsFromCloud() {
  if (typeof window === 'undefined') return getPermanentVisits();
  try {
    const cloudData = await readFromFirebase(FIREBASE_PATH_VISITS);
    if (cloudData) {
      const cloudList = Array.isArray(cloudData)
        ? cloudData.filter(Boolean)
        : Object.values(cloudData).filter(Boolean);

      const local = getPermanentVisits();
      const map = new Map();
      local.forEach((v) => map.set(v.userId || v.id, v));
      cloudList.forEach((v) => {
        if (v && (v.userId || v.id)) {
          const key = v.userId || v.id;
          const existing = map.get(key);
          if (!existing || new Date(v.lastActiveAt || 0) >= new Date(existing.lastActiveAt || 0)) {
            map.set(key, { ...existing, ...v });
          }
        }
      });
      const merged = Array.from(map.values());
      merged.sort((a, b) => new Date(b.lastActiveAt || 0).getTime() - new Date(a.lastActiveAt || 0).getTime());
      localStorage.setItem(PERMANENT_VISITS_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch (e) {
    console.warn('Failed to sync permanent visits from cloud:', e);
  }
  return getPermanentVisits();
}

export function listenToPermanentVisits(callback) {
  if (typeof window === 'undefined') return () => {};

  return listenToFirebase(FIREBASE_PATH_VISITS, (cloudData) => {
    if (!cloudData) return;
    try {
      const cloudList = Array.isArray(cloudData)
        ? cloudData.filter(Boolean)
        : Object.values(cloudData).filter(Boolean);

      if (cloudList.length > 0) {
        const local = getPermanentVisits();
        const map = new Map();
        local.forEach((v) => map.set(v.userId || v.id, v));
        cloudList.forEach((v) => {
          if (v && (v.userId || v.id)) {
            const key = v.userId || v.id;
            const existing = map.get(key);
            if (!existing || new Date(v.lastActiveAt || 0) >= new Date(existing.lastActiveAt || 0)) {
              map.set(key, { ...existing, ...v });
            }
          }
        });
        const merged = Array.from(map.values());
        merged.sort((a, b) => new Date(b.lastActiveAt || 0).getTime() - new Date(a.lastActiveAt || 0).getTime());
        localStorage.setItem(PERMANENT_VISITS_KEY, JSON.stringify(merged));
        callback(merged);
      }
    } catch (err) {
      console.warn('Error in listenToPermanentVisits:', err);
    }
  });
}

// =========================================================================
// 3C. USER ANNOUNCEMENT & NOTICES (PENGUMUMAN / CATATAN KHUSUS ADMIN)
// =========================================================================

const FIREBASE_PATH_NOTICES = 'user_notices';
const NOTICE_KEY_PREFIX = 'chaiz_user_notice_';

/**
 * Kirim Catatan / Pengumuman khusus dari Admin ke pengguna / pengunjung tertentu
 */
export function sendNoticeToUser(targetUserId, targetEmail, targetName, { title, message, type = 'info' }) {
  if (!targetUserId && !targetEmail) return null;

  const nowIso = new Date().toISOString();
  const cleanEmail = (targetEmail || '').toLowerCase().trim();
  const userId = targetUserId || getUniqueUserId({ email: cleanEmail });

  const notice = {
    id: `notc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    targetUserId: userId,
    targetEmail: cleanEmail,
    targetName: targetName || 'Pengguna',
    title: title || 'Pemberitahuan dari Admin ChaizStore',
    message: message || '',
    type: type || 'info', // 'info' | 'warning' | 'urgent' | 'promo'
    sentAt: nowIso,
    status: 'pending', // 'pending' | 'responded'
    respondedAt: null
  };

  // 1. Update ke riwayat kunjungan permanen (chaiz_permanent_visit_history)
  try {
    const visits = getPermanentVisits();
    const targetIdx = visits.findIndex(
      (v) => v.userId === userId || (cleanEmail && v.email && v.email.toLowerCase() === cleanEmail)
    );
    if (targetIdx !== -1) {
      visits[targetIdx].adminNotice = notice;
      savePermanentVisits(visits);
    }
  } catch (e) {}

  // 2. Simpan ke localStorage khusus user target
  try {
    localStorage.setItem(`${NOTICE_KEY_PREFIX}${userId}`, JSON.stringify(notice));
    if (cleanEmail) {
      localStorage.setItem(`${NOTICE_KEY_PREFIX}${cleanEmail}`, JSON.stringify(notice));
    }
  } catch (e) {}

  // 3. Simpan ke Firebase Realtime Database
  try {
    writeToFirebase(`${FIREBASE_PATH_NOTICES}/${userId}`, notice).catch(() => {});
    if (cleanEmail) {
      const safeEmailKey = cleanEmail.replace(/[.#$[\]]/g, '_');
      writeToFirebase(`${FIREBASE_PATH_NOTICES}/${safeEmailKey}`, notice).catch(() => {});
    }
    // Update juga di node visit Firebase
    updateInFirebase(`${FIREBASE_PATH_VISITS}/${userId}`, { adminNotice: notice }).catch(() => {});
  } catch (e) {}

  // 4. Broadcast event
  broadcastAdminUpdate('USER_NOTICE_SENT', { notice, targetUserId: userId, targetEmail: cleanEmail });

  return notice;
}

/**
 * Respon pengguna saat menekan tombol "Continue" di popup catatan admin
 */
export function respondToUserNotice(noticeId, userOrKey) {
  if (!noticeId) return null;
  const nowIso = new Date().toISOString();

  // 1. Update di kunjungan permanen
  try {
    const visits = getPermanentVisits();
    let updatedVisit = null;
    visits.forEach((v) => {
      if (
        v.adminNotice &&
        (v.adminNotice.id === noticeId ||
          v.userId === userOrKey ||
          (userOrKey?.email && v.email && v.email.toLowerCase() === userOrKey.email.toLowerCase()))
      ) {
        v.adminNotice.status = 'responded';
        v.adminNotice.respondedAt = nowIso;
        updatedVisit = v;
      }
    });
    if (updatedVisit) {
      savePermanentVisits(visits);
      updateInFirebase(`${FIREBASE_PATH_VISITS}/${updatedVisit.userId}`, { adminNotice: updatedVisit.adminNotice }).catch(() => {});
    }
  } catch (e) {}

  // 2. Update di localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(NOTICE_KEY_PREFIX)) {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed.id === noticeId || parsed.status === 'pending') {
                parsed.status = 'responded';
                parsed.respondedAt = nowIso;
                localStorage.setItem(k, JSON.stringify(parsed));
              }
            }
          } catch {}
        }
      }
    }
  } catch (e) {}

  // 3. Update di Firebase
  const targetId = typeof userOrKey === 'object' ? (userOrKey.id || getUniqueUserId(userOrKey)) : userOrKey;
  if (targetId) {
    updateInFirebase(`${FIREBASE_PATH_NOTICES}/${targetId}`, { status: 'responded', respondedAt: nowIso }).catch(() => {});
  }
  if (userOrKey?.email) {
    const safeEmailKey = userOrKey.email.toLowerCase().trim().replace(/[.#$[\]]/g, '_');
    updateInFirebase(`${FIREBASE_PATH_NOTICES}/${safeEmailKey}`, { status: 'responded', respondedAt: nowIso }).catch(() => {});
  }

  // 4. Broadcast response ke Admin
  broadcastAdminUpdate('USER_NOTICE_RESPONDED', { noticeId, respondedAt: nowIso, targetId });

  return { id: noticeId, status: 'responded', respondedAt: nowIso };
}

/**
 * Mengambil catatan aktif yang belum direspon oleh user yang sedang membuka web
 */
export function getUserActiveNotice(user) {
  if (!user || typeof window === 'undefined') return null;
  const cleanEmail = (user.email || '').toLowerCase().trim();
  const userId = user.id || getUniqueUserId(user);

  try {
    // 1. Cek storage lokal user
    const rawById = localStorage.getItem(`${NOTICE_KEY_PREFIX}${userId}`);
    if (rawById) {
      const parsed = JSON.parse(rawById);
      if (parsed && parsed.status === 'pending') return parsed;
    }

    if (cleanEmail) {
      const rawByEmail = localStorage.getItem(`${NOTICE_KEY_PREFIX}${cleanEmail}`);
      if (rawByEmail) {
        const parsed = JSON.parse(rawByEmail);
        if (parsed && parsed.status === 'pending') return parsed;
      }
    }

    // 2. Cek di daftar kunjungan permanen
    const visits = getPermanentVisits();
    const v = visits.find(
      (item) => item.userId === userId || (cleanEmail && item.email && item.email.toLowerCase() === cleanEmail)
    );
    if (v && v.adminNotice && v.adminNotice.status === 'pending') {
      return v.adminNotice;
    }
  } catch (e) {}

  return null;
}

/**
 * Langganan realtime untuk catatan admin khusus pengguna ini via Firebase
 */
export function listenToUserNotice(user, callback) {
  if (!user || typeof window === 'undefined') return () => {};
  const cleanEmail = (user.email || '').toLowerCase().trim();
  const userId = user.id || getUniqueUserId(user);

  const unsub1 = listenToFirebase(`${FIREBASE_PATH_NOTICES}/${userId}`, (data) => {
    if (data && data.status === 'pending') {
      callback(data);
    }
  });

  let unsub2 = () => {};
  if (cleanEmail) {
    const safeEmailKey = cleanEmail.replace(/[.#$[\]]/g, '_');
    unsub2 = listenToFirebase(`${FIREBASE_PATH_NOTICES}/${safeEmailKey}`, (data) => {
      if (data && data.status === 'pending') {
        callback(data);
      }
    });
  }

  return () => {
    unsub1();
    unsub2();
  };
}

// =========================================================================
// 4. LOGIN & PRESENCE TRACKING
// =========================================================================

/**
 * Record user login event (rejects if user is banned)
 */
export async function recordUserLogin(user) {
  if (!user) return null;

  // Check if banned first
  const banStatus = isUserBanned(user);
  if (banStatus.isBanned) {
    return { isBanned: true, ...banStatus };
  }

  const device = parseDevice();
  const browser = parseBrowser();
  const userId = getUniqueUserId(user);
  const nowIso = new Date().toISOString();

  // 1. Update / Insert to Registered Users Directory
  const users = getRegisteredUsers();
  const existingIndex = users.findIndex((u) => u.id === userId);

  let userRecord;
  if (existingIndex !== -1) {
    userRecord = {
      ...users[existingIndex],
      name: user.name || users[existingIndex].name,
      email: user.email || users[existingIndex].email,
      picture: user.picture || users[existingIndex].picture,
      sessionStatus: 'logged_in', // Status Sesi: Masih Login
      lastHeartbeat: Date.now(), // Online
      lastActiveTime: nowIso,
      loginCount: (users[existingIndex].loginCount || 1) + 1,
      deviceType: device.type,
      os: device.os,
      browser,
      lastActivitySummary: 'Login ke akun toko'
    };
    users[existingIndex] = userRecord;
  } else {
    userRecord = {
      id: userId,
      name: user.name || 'Pengguna Chaiz',
      email: user.email || 'tanpa_email@chaizstore.id',
      picture: user.picture || null,
      sessionStatus: 'logged_in', // Status Sesi: Masih Login
      lastHeartbeat: Date.now(), // Online
      firstLoginTime: nowIso,
      lastActiveTime: nowIso,
      loginCount: 1,
      activitiesCount: 1,
      deviceType: device.type,
      os: device.os,
      isMobile: device.isMobile,
      browser,
      banStatus: null,
      lastActivitySummary: 'Login ke akun toko'
    };
    users.unshift(userRecord);
  }
  saveRegisteredUsers(users);

  // Sync atomic ke Firebase Cloud Realtime Database (Sub-50ms instant lintas perangkat)
  try {
    writeToFirebase(`${FIREBASE_PATH_USERS}/${userId}`, userRecord).catch(() => {});
  } catch (e) {}

  // 2. Record Login in Activity History
  recordUserActivity(user, 'LOGIN', 'Berhasil masuk ke akun toko');

  // 3. Keep backward-compatible User Login Log
  const newLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    userId,
    name: user.name || 'Pengguna Chaiz',
    email: user.email || 'tanpa_email@chaizstore.id',
    picture: user.picture || null,
    loginTime: nowIso,
    deviceType: device.type,
    os: device.os,
    isMobile: device.isMobile,
    browser
  };

  const logs = getUserLogs();
  saveUserLogs([newLog, ...logs.slice(0, 199)]);

  return userRecord;
}

/**
 * Record user logout event
 */
export function recordUserLogout(user) {
  if (!user) return;
  const userId = getUniqueUserId(user);
  const users = getRegisteredUsers();
  const existingIndex = users.findIndex((u) => u.id === userId);

  if (existingIndex !== -1) {
    const nowIso = new Date().toISOString();
    users[existingIndex].sessionStatus = 'logged_out'; // Status Sesi: Sudah Logout
    users[existingIndex].lastHeartbeat = 0; // Offline
    users[existingIndex].lastActiveTime = nowIso;
    users[existingIndex].lastActivitySummary = 'Logout dari akun';
    saveRegisteredUsers(users);

    try {
      updateInFirebase(`${FIREBASE_PATH_USERS}/${userId}`, {
        sessionStatus: 'logged_out',
        lastHeartbeat: 0,
        lastActiveTime: nowIso,
        lastActivitySummary: 'Logout dari akun'
      }).catch(() => {});
    } catch (e) {}
  }

  // Record in activity history
  recordUserActivity(user, 'LOGOUT', 'Pengguna keluar dari akun (Logout)');
}

/**
 * Record periodic user heartbeat
 */
export function recordUserHeartbeat(user) {
  if (!user) return;

  // Don't heartbeat if banned
  const banStatus = isUserBanned(user);
  if (banStatus.isBanned) return;

  const userId = getUniqueUserId(user);
  const users = getRegisteredUsers();
  const existingIndex = users.findIndex((u) => u.id === userId);

  if (existingIndex !== -1) {
    if (users[existingIndex].sessionStatus !== 'logged_out' && !users[existingIndex].banStatus?.isBanned) {
      const now = Date.now();
      const nowIso = new Date().toISOString();
      users[existingIndex].lastHeartbeat = now;
      users[existingIndex].lastActiveTime = nowIso;
      saveRegisteredUsers(users);

      try {
        updateInFirebase(`${FIREBASE_PATH_USERS}/${userId}`, {
          lastHeartbeat: now,
          lastActiveTime: nowIso,
          sessionStatus: 'logged_in'
        }).catch(() => {});
        updateInFirebase(`${FIREBASE_PATH_VISITS}/${userId}`, {
          lastHeartbeat: now,
          lastActiveAt: nowIso
        }).catch(() => {});
      } catch (e) {}
    }
  }
}

/**
 * Mark user presence as offline (e.g. window unload)
 */
export function setUserOffline(user) {
  if (!user) return;
  const userId = getUniqueUserId(user);
  const users = getRegisteredUsers();
  const existingIndex = users.findIndex((u) => u.id === userId);

  if (existingIndex !== -1) {
    users[existingIndex].lastHeartbeat = 0; // Offline
    saveRegisteredUsers(users);

    try {
      updateInFirebase(`${FIREBASE_PATH_USERS}/${userId}`, { lastHeartbeat: 0 }).catch(() => {});
      updateInFirebase(`${FIREBASE_PATH_VISITS}/${userId}`, { lastHeartbeat: 0 }).catch(() => {});
    } catch (e) {}
  }
}

// =========================================================================
// 5. CRUD & CLEANUP HELPERS
// =========================================================================

export function getUserLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

function saveUserLogs(logs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to save user logs:', err);
  }
}

export function deleteActivityLog(activityId) {
  const activities = getActivityLogs();
  const filtered = activities.filter((a) => a.id !== activityId);
  saveActivityLogs(filtered);
  try {
    deleteFromFirebase(`${FIREBASE_PATH_ACTIVITIES}/${activityId}`).catch(() => {});
  } catch (e) {}
  return filtered;
}

export function clearAllActivityLogs() {
  saveActivityLogs([]);
  try {
    deleteFromFirebase(FIREBASE_PATH_ACTIVITIES).catch(() => {});
  } catch (e) {}
  return [];
}

export function deleteUserFromDirectory(userId) {
  const users = getRegisteredUsers();
  const filtered = users.filter((u) => u.id !== userId);
  saveRegisteredUsers(filtered);
  try {
    deleteFromFirebase(`${FIREBASE_PATH_USERS}/${userId}`).catch(() => {});
  } catch (e) {}
  return filtered;
}

export function clearAllUsersDirectory() {
  saveRegisteredUsers([]);
  try {
    deleteFromFirebase(FIREBASE_PATH_USERS).catch(() => {});
  } catch (e) {}
  return [];
}

// =========================================================================
// 6. ADMIN AUTH CREDENTIALS & SESSION
// =========================================================================

export function getAdminCredentials() {
  try {
    const saved = localStorage.getItem(ADMIN_AUTH_KEY);
    if (!saved) return DEFAULT_ADMIN_CREDENTIALS;
    const parsed = JSON.parse(saved);
    // Jika masih memakai kredensial default lama, otomatis migrasi ke kredensial baru
    if (parsed.username === 'admin' && parsed.password === 'adminchaiz123') {
      localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(DEFAULT_ADMIN_CREDENTIALS));
      return DEFAULT_ADMIN_CREDENTIALS;
    }
    return parsed;
  } catch {
    return DEFAULT_ADMIN_CREDENTIALS;
  }
}

export function updateAdminCredentials(newCreds) {
  try {
    const merged = { ...getAdminCredentials(), ...newCreds };
    localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(merged));
    return true;
  } catch (err) {
    console.error('Failed to update admin creds:', err);
    return false;
  }
}

export function getAdminSession() {
  try {
    const session = sessionStorage.getItem(ADMIN_SESSION_KEY) || localStorage.getItem(ADMIN_SESSION_KEY);
    if (!session) return null;
    const parsed = JSON.parse(session);
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      clearAdminSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveAdminSession(adminInfo, remember = true) {
  const sessionData = {
    username: adminInfo.username,
    adminName: adminInfo.adminName || 'Admin',
    timestamp: Date.now()
  };
  const jsonStr = JSON.stringify(sessionData);
  if (remember) {
    localStorage.setItem(ADMIN_SESSION_KEY, jsonStr);
  } else {
    sessionStorage.setItem(ADMIN_SESSION_KEY, jsonStr);
  }
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

// =========================================================================
// 7. SEED DEMO DATA
// =========================================================================

export function seedDemoUsersAndActivities() {
  const now = Date.now();

  const demoUsers = [
    {
      id: 'usr_demo_1',
      name: 'Rian Pratama',
      email: 'rianpratama99@gmail.com',
      picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
      sessionStatus: 'logged_in', // Masih Login
      lastHeartbeat: now - 5000,  // Online (5 detik lalu)
      firstLoginTime: new Date(now - 25 * 60 * 1000).toISOString(),
      lastActiveTime: new Date(now - 5000).toISOString(),
      loginCount: 4,
      activitiesCount: 6,
      deviceType: 'Smartphone / Mobile',
      os: 'Android',
      isMobile: true,
      browser: 'Google Chrome',
      banStatus: null,
      lastActivitySummary: 'Membuka menu Top Up Game & E-Wallet'
    },
    {
      id: 'usr_demo_2',
      name: 'Ahmad Faisal',
      email: 'ahmadfaisal.store@gmail.com',
      picture: null,
      sessionStatus: 'logged_in', // Masih Login (sesi tersimpan)
      lastHeartbeat: now - 15 * 60 * 1000, // Offline (15 menit lalu)
      firstLoginTime: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      lastActiveTime: new Date(now - 15 * 60 * 1000).toISOString(),
      loginCount: 2,
      activitiesCount: 4,
      deviceType: 'Laptop / PC Desktop',
      os: 'Windows 10/11',
      isMobile: false,
      browser: 'Google Chrome',
      banStatus: null,
      lastActivitySummary: 'Menambahkan Netflix Premium ke keranjang'
    },
    {
      id: 'usr_demo_3',
      name: 'Dimas Kurniawan (Spammer)',
      email: 'dimas.spam99@gmail.com',
      picture: null,
      sessionStatus: 'logged_out',
      lastHeartbeat: 0,
      firstLoginTime: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      lastActiveTime: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
      loginCount: 3,
      activitiesCount: 5,
      deviceType: 'Laptop / PC Desktop',
      os: 'Windows 10/11',
      isMobile: false,
      browser: 'Microsoft Edge',
      banStatus: {
        isBanned: true,
        banType: 'temporary',
        reason: 'Spam pesanan palsu berulang kali',
        bannedAt: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
        bannedUntil: new Date(now + 23 * 60 * 60 * 1000).toISOString() // 23 hours remaining
      },
      lastActivitySummary: 'Akun dikenai Banned Sementara oleh Admin'
    }
  ];

  const demoActivities = [
    {
      id: 'act_demo_1',
      userId: 'usr_demo_1',
      userName: 'Rian Pratama',
      userEmail: 'rianpratama99@gmail.com',
      userPicture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
      actionType: 'VIEW_TOPUP',
      description: 'Membuka menu halaman Top Up Game & E-Wallet',
      timestamp: new Date(now - 5000).toISOString(),
      device: 'Android • Google Chrome'
    },
    {
      id: 'act_demo_2',
      userId: 'usr_demo_1',
      userName: 'Rian Pratama',
      userEmail: 'rianpratama99@gmail.com',
      userPicture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
      actionType: 'ADD_TO_CART',
      description: 'Menambahkan Canva Pro 1 Bulan ke keranjang belanja',
      timestamp: new Date(now - 2 * 60 * 1000).toISOString(),
      device: 'Android • Google Chrome'
    },
    {
      id: 'act_demo_3',
      userId: 'usr_demo_1',
      userName: 'Rian Pratama',
      userEmail: 'rianpratama99@gmail.com',
      userPicture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
      actionType: 'LOGIN',
      description: 'Pengguna berhasil masuk ke akun',
      timestamp: new Date(now - 25 * 60 * 1000).toISOString(),
      device: 'Android • Google Chrome'
    },
    {
      id: 'act_demo_4',
      userId: 'usr_demo_3',
      userName: 'Dimas Kurniawan (Spammer)',
      userEmail: 'dimas.spam99@gmail.com',
      userPicture: null,
      actionType: 'BANNED',
      description: 'Sanksi Admin: Akun dikenai Banned Sementara (24 jam). Alasan: "Spam pesanan palsu berulang kali"',
      timestamp: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
      device: 'Windows 10/11 • Microsoft Edge'
    }
  ];

  saveRegisteredUsers(demoUsers);
  saveActivityLogs(demoActivities);
  return { users: demoUsers, activities: demoActivities };
}
