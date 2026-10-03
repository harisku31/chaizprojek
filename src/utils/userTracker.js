/**
 * ChaizStore User Tracker, Presence, Banned Management & Activity Logging System
 * Tracks user list, online/offline presence, session status (Masih Login vs Log Out),
 * temporary & permanent bans, and chronological activity history for Admin Dashboard.
 */

const STORAGE_KEY = 'chaiz_admin_user_logs';
const USERS_KEY = 'chaiz_admin_registered_users';
const ACTIVITY_KEY = 'chaiz_admin_activity_logs';
const BANNED_KEY = 'chaiz_admin_banned_users';
const ADMIN_AUTH_KEY = 'chaiz_admin_credentials';
const ADMIN_SESSION_KEY = 'chaiz_admin_session';

// Default Admin Credentials
export const DEFAULT_ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'adminchaiz123',
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
 * Ban a user (temporary or permanent)
 * @param {string} userId User ID to ban
 * @param {'temporary'|'permanent'} banType
 * @param {number} durationMinutes Duration in minutes (if temporary)
 * @param {string} reason Reason for banning
 */
export function banUser(userId, banType = 'temporary', durationMinutes = 60, reason = 'Pelanggaran aturan toko') {
  const users = getRegisteredUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return false;

  const nowIso = new Date().toISOString();
  let bannedUntil = null;
  const minutes = Math.max(1, parseInt(durationMinutes, 10) || 60);
  const durationText = banType === 'permanent' ? 'Permanen' : formatDurationMinutes(minutes);

  if (banType === 'temporary') {
    bannedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  }

  const banRecord = {
    id: `ban_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    userId: user.id,
    name: user.name,
    email: user.email,
    banType,
    durationMinutes: banType === 'temporary' ? minutes : null,
    durationText,
    reason: reason || 'Pelanggaran aturan toko',
    bannedAt: nowIso,
    bannedUntil
  };

  // 1. Update Banned List
  const bannedList = getBannedList();
  const filteredBanned = bannedList.filter((b) => b.userId !== userId && b.email !== user.email);
  saveBannedList([banRecord, ...filteredBanned]);

  // 2. Update Registered User
  user.banStatus = {
    isBanned: true,
    banType,
    durationMinutes: banType === 'temporary' ? minutes : null,
    durationText,
    reason: banRecord.reason,
    bannedAt: nowIso,
    bannedUntil
  };
  user.sessionStatus = 'logged_out'; // Force logout
  user.lastHeartbeat = 0; // Force offline
  saveRegisteredUsers(users);

  // 3. Log Activity
  const banLabel = banType === 'permanent' ? 'Banned Permanen' : `Banned Sementara (${durationMinutes} menit)`;
  recordUserActivity(
    user,
    'BANNED',
    `Sanksi Admin: Akun dikenai ${banLabel}. Alasan: "${reason}"`
  );

  broadcastAdminUpdate('USER_BANNED', { userId, banType, reason });
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

  // 5. Save unbanned notice so client shows "Akun Anda Tidak Di-banned Lagi" window
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

  // Also touch registered user active time & heartbeat if not banned
  const users = getRegisteredUsers();
  const existingIndex = users.findIndex((u) => u.id === userId);
  if (existingIndex !== -1 && !users[existingIndex].banStatus?.isBanned) {
    users[existingIndex].lastActiveTime = newActivity.timestamp;
    users[existingIndex].lastHeartbeat = Date.now();
    users[existingIndex].activitiesCount = (users[existingIndex].activitiesCount || 0) + 1;
    users[existingIndex].lastActivitySummary = description;
    saveRegisteredUsers(users);
  }

  return newActivity;
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
    users[existingIndex].sessionStatus = 'logged_out'; // Status Sesi: Sudah Logout
    users[existingIndex].lastHeartbeat = 0; // Offline
    users[existingIndex].lastActiveTime = new Date().toISOString();
    users[existingIndex].lastActivitySummary = 'Logout dari akun';
    saveRegisteredUsers(users);
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
      users[existingIndex].lastHeartbeat = Date.now();
      saveRegisteredUsers(users);
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
  return filtered;
}

export function clearAllActivityLogs() {
  saveActivityLogs([]);
  return [];
}

export function deleteUserFromDirectory(userId) {
  const users = getRegisteredUsers();
  const filtered = users.filter((u) => u.id !== userId);
  saveRegisteredUsers(filtered);
  return filtered;
}

export function clearAllUsersDirectory() {
  saveRegisteredUsers([]);
  return [];
}

// =========================================================================
// 6. ADMIN AUTH CREDENTIALS & SESSION
// =========================================================================

export function getAdminCredentials() {
  try {
    const saved = localStorage.getItem(ADMIN_AUTH_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_ADMIN_CREDENTIALS;
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
