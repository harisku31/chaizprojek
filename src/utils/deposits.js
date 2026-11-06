/**
 * ChaizStore ChaizMoney Deposits Engine
 * Handles user deposit requests, QRIS proof uploads, admin verification,
 * and crediting ChaizMoney digital balances in realtime across clients.
 */

import {
  writeToFirebase,
  updateInFirebase,
  readFromFirebase,
  listenToFirebase
} from './firebase.js';
import { getRegisteredUsers, saveRegisteredUsers, recordUserActivity } from './userTracker.js';

const STORAGE_KEY_DEPOSITS = 'chaiz_admin_deposits';
const FIREBASE_PATH_DEPOSITS = 'deposits';
const BROADCAST_CHANNEL_NAME = 'chaiz_admin_sync';

/**
 * Get all deposits from local storage
 */
export function getDeposits() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEPOSITS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to get deposits from localStorage:', err);
    return [];
  }
}

/**
 * Save deposits list to local storage and broadcast to other tabs
 */
export function saveDeposits(deposits) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_DEPOSITS, JSON.stringify(deposits));
  } catch (err) {
    console.warn('LocalStorage saveDeposits quota warning, attempting cleanup:', err);
    try {
      // Fallback: simpan 25 item terbaru, buang base64 foto dari riwayat yang sudah selesai
      const lightweight = deposits.slice(0, 25).map((d, index) => {
        if (index > 2 && (d.status === 'approved' || d.status === 'rejected')) {
          return { ...d, proofImage: null, proofUrl: null };
        }
        return d;
      });
      localStorage.setItem(STORAGE_KEY_DEPOSITS, JSON.stringify(lightweight));
    } catch (e2) {
      console.error('Final fallback saveDeposits failed:', e2);
    }
  }

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.postMessage({ type: 'DEPOSITS_UPDATED', count: deposits.length });
      bc.close();
    }
  } catch (e) {}

  try {
    window.dispatchEvent(new CustomEvent('chaiz_admin_deposits_updated'));
  } catch (e) {}
}

/**
 * Filter deposits belonging to a specific user
 */
export function getUserDeposits(user) {
  if (!user) return [];
  const myEmail = (user.email || '').toLowerCase().trim();
  const myId = user.id || user.userId || '';
  const list = getDeposits();

  return list.filter((d) => {
    if (!d) return false;
    const dEmail = (d.userEmail || '').toLowerCase().trim();
    if (myEmail && dEmail && myEmail === dEmail) return true;
    if (myId && (d.userId === myId || d.userKey === myId)) return true;
    return false;
  });
}

/**
 * Create a new deposit request from customer
 */
export async function createDeposit(depositData) {
  const now = new Date();
  const id = `DEP-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  const cleanDeposit = {
    id,
    userId: depositData.userId || depositData.userEmail || `usr_${Date.now()}`,
    userKey: depositData.userKey || depositData.userId || depositData.userEmail || `usr_${Date.now()}`,
    userName: depositData.userName || 'Pengguna',
    userEmail: (depositData.userEmail || '').toLowerCase().trim(),
    userPhone: depositData.userPhone || '',
    userPicture: depositData.userPicture || null,
    amount: Number(depositData.amount) || 0,
    paymentMethod: depositData.paymentMethod || 'QRIS Instant',
    proofImage: depositData.proofImage || depositData.proofUrl || null,
    proofUrl: depositData.proofUrl || depositData.proofImage || null,
    customerNote: depositData.customerNote || '',
    status: 'pending', // 'pending' | 'approved' | 'rejected'
    adminNote: '',
    creditedAmount: null,
    approvedAt: null,
    rejectedAt: null,
    rejectReason: '',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  // 1. Save locally with quota-safe protection
  const currentList = getDeposits();
  const updatedList = [cleanDeposit, ...currentList.filter((d) => d.id !== id)];
  saveDeposits(updatedList);

  // 2. Sync to Firebase Cloud (non-blocking)
  try {
    await writeToFirebase(`${FIREBASE_PATH_DEPOSITS}/${cleanDeposit.id}`, cleanDeposit);
  } catch (e) {
    console.warn('Sync deposit to Firebase failed (saved locally):', e);
  }

  // 3. Broadcast to Admin in real-time
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.postMessage({ type: 'NEW_DEPOSIT', data: cleanDeposit, deposit: cleanDeposit });
      bc.postMessage({ type: 'DEPOSIT_CREATED', deposit: cleanDeposit });
      bc.close();
    }
  } catch (e) {}

  try {
    window.dispatchEvent(new CustomEvent('chaiz_admin_deposits_updated', { detail: cleanDeposit }));
    window.dispatchEvent(new CustomEvent('chaiz_trx_updated', { detail: { type: 'NEW_DEPOSIT', data: cleanDeposit } }));
  } catch (e) {}

  // 4. Log User Activity
  try {
    recordUserActivity(
      { id: cleanDeposit.userId, email: cleanDeposit.userEmail, name: cleanDeposit.userName },
      'SUBMIT_DEPOSIT',
      `Mengajukan deposit ChaizMoney Rp ${(cleanDeposit.amount || 0).toLocaleString('id-ID')} via QRIS`
    );
  } catch (e) {}

  return cleanDeposit;
}

/**
 * Approve deposit by Admin and credit ChaizMoney to user's wallet
 */
export async function approveDeposit(depositId, creditedAmount, adminName = 'Admin ChaizStore') {
  const list = getDeposits();
  const deposit = list.find((d) => d.id === depositId);
  if (!deposit) return { success: false, message: 'Deposit tidak ditemukan' };

  const finalAmount = Number(creditedAmount) > 0 ? Number(creditedAmount) : Number(deposit.amount);
  const nowIso = new Date().toISOString();

  // 1. Update deposit object
  deposit.status = 'approved';
  deposit.creditedAmount = finalAmount;
  deposit.approvedAt = nowIso;
  deposit.approvedBy = adminName;
  deposit.updatedAt = nowIso;
  saveDeposits(list);

  // 2. Credit ChaizMoney to registered users list
  let userNewBalance = finalAmount;
  try {
    const users = getRegisteredUsers();
    const targetEmail = (deposit.userEmail || '').toLowerCase().trim();
    const targetId = deposit.userId || '';

    const userIdx = users.findIndex((u) => {
      if (targetEmail && u.email && u.email.toLowerCase().trim() === targetEmail) return true;
      if (targetId && (u.id === targetId || u.userId === targetId)) return true;
      return false;
    });

    if (userIdx !== -1) {
      const existingBalance = Number(users[userIdx].chaizMoney) || 0;
      userNewBalance = existingBalance + finalAmount;
      users[userIdx].chaizMoney = userNewBalance;
      users[userIdx].lastActiveTime = nowIso;
      saveRegisteredUsers(users);

      // Update in Firebase User Node
      const uId = users[userIdx].id || targetId;
      if (uId) {
        updateInFirebase(`registered_users/${uId}`, {
          chaizMoney: userNewBalance,
          lastActiveTime: nowIso
        }).catch(() => {});
      }
    }
  } catch (e) {
    console.error('Error crediting user ChaizMoney:', e);
  }

  // 3. Update localStorage chaiz_auth_user if current tab or active session matches
  try {
    const rawAuth = localStorage.getItem('chaiz_auth_user');
    if (rawAuth) {
      const authUser = JSON.parse(rawAuth);
      const authEmail = (authUser.email || '').toLowerCase().trim();
      const authId = authUser.id || authUser.userId || '';
      const depEmail = (deposit.userEmail || '').toLowerCase().trim();
      const depId = deposit.userId || '';

      if ((depEmail && authEmail === depEmail) || (depId && authId === depId)) {
        const currentBal = Number(authUser.chaizMoney) || 0;
        authUser.chaizMoney = currentBal + finalAmount;
        localStorage.setItem('chaiz_auth_user', JSON.stringify(authUser));
      }
    }
  } catch (e) {}

  // 4. Update in Firebase Deposits Node
  try {
    await updateInFirebase(`${FIREBASE_PATH_DEPOSITS}/${deposit.id}`, {
      status: 'approved',
      creditedAmount: finalAmount,
      approvedAt: nowIso,
      approvedBy: adminName,
      updatedAt: nowIso
    });
  } catch (e) {}

  // 5. Broadcast to cross-tabs / client app
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.postMessage({
        type: 'DEPOSIT_APPROVED',
        depositId: deposit.id,
        userId: deposit.userId,
        userEmail: deposit.userEmail,
        userName: deposit.userName,
        creditedAmount: finalAmount,
        newBalance: userNewBalance
      });
      bc.close();
    } catch (e) {}
  }

  // 6. Record in Activity Log
  try {
    recordUserActivity(
      { id: deposit.userId, email: deposit.userEmail, name: deposit.userName },
      'DEPOSIT_APPROVED',
      `Admin menyetujui deposit ChaizMoney Rp ${finalAmount.toLocaleString('id-ID')} (Saldo masuk)`
    );
  } catch (e) {}

  return { success: true, deposit, newBalance: userNewBalance };
}

/**
 * Create and automatically approve a deposit completed via JansPayment Gateway
 */
export async function createApprovedGatewayDeposit({
  userId,
  userKey,
  userName,
  userEmail,
  userPhone,
  userPicture,
  amount,       // Saldo yang masuk ke akun pengguna (misal Rp 10.000)
  totalPaid,    // Total bayar (+ pajak 100 & fee janspay)
  paymentId,
  gateway = 'JansPayment Gateway (Realtime QRIS)'
}) {
  const now = new Date();
  const nowIso = now.toISOString();
  const id = `DEP-JANSPAY-${Date.now().toString().slice(-6)}`;

  const cleanDeposit = {
    id,
    userId: userId || userEmail || `usr_${Date.now()}`,
    userKey: userKey || userId || userEmail || `usr_${Date.now()}`,
    userName: userName || 'Pengguna',
    userEmail: (userEmail || '').toLowerCase().trim(),
    userPhone: userPhone || '',
    userPicture: userPicture || null,
    amount: Number(amount) || 0,
    creditedAmount: Number(amount) || 0,
    totalPaid: Number(totalPaid) || Number(amount) || 0,
    taxAmount: 100,
    paymentMethod: gateway,
    isGatewayPaid: true,
    paymentId: paymentId || '',
    proofImage: null,
    proofUrl: 'JANSPAYMENT_SETTLED',
    customerNote: 'Top Up ChaizMoney via JansPayment Gateway (Lunas Otomatis)',
    status: 'approved',
    createdAt: nowIso,
    updatedAt: nowIso,
    approvedAt: nowIso,
    approvedBy: 'JansPayment Gateway Server'
  };

  // 1. Simpan ke local deposits
  const currentList = getDeposits();
  const updatedList = [cleanDeposit, ...currentList.filter((d) => d.id !== cleanDeposit.id)];
  saveDeposits(updatedList);

  // 2. Tambah saldo ke registered_users
  let userNewBalance = Number(amount) || 0;
  try {
    const users = getRegisteredUsers();
    const targetEmail = (cleanDeposit.userEmail || '').toLowerCase().trim();
    const targetId = cleanDeposit.userId || '';

    const userIdx = users.findIndex((u) => {
      if (targetEmail && u.email && u.email.toLowerCase().trim() === targetEmail) return true;
      if (targetId && (u.id === targetId || u.userId === targetId)) return true;
      return false;
    });

    if (userIdx !== -1) {
      const existingBalance = Number(users[userIdx].chaizMoney) || 0;
      userNewBalance = existingBalance + Number(amount);
      users[userIdx].chaizMoney = userNewBalance;
      users[userIdx].lastActiveTime = nowIso;
      saveRegisteredUsers(users);

      const uId = users[userIdx].id || targetId;
      if (uId) {
        updateInFirebase(`registered_users/${uId}`, {
          chaizMoney: userNewBalance,
          lastActiveTime: nowIso
        }).catch(() => {});
      }
    }
  } catch (e) {
    console.error('Error crediting user ChaizMoney in gateway deposit:', e);
  }

  // 3. Update localStorage chaiz_auth_user jika session saat ini cocok
  try {
    const rawAuth = localStorage.getItem('chaiz_auth_user');
    if (rawAuth) {
      const authObj = JSON.parse(rawAuth);
      const authEmail = (authObj.email || '').toLowerCase().trim();
      const authId = authObj.id || authObj.userId || '';
      const depEmail = (cleanDeposit.userEmail || '').toLowerCase().trim();
      const depId = cleanDeposit.userId || '';

      if ((depEmail && authEmail === depEmail) || (depId && authId === depId)) {
        const cur = Number(authObj.chaizMoney) || 0;
        authObj.chaizMoney = cur + Number(amount);
        userNewBalance = authObj.chaizMoney;
        localStorage.setItem('chaiz_auth_user', JSON.stringify(authObj));
      }
    }
  } catch (e) {}

  // 4. Simpan ke Firebase
  try {
    await writeToFirebase(`${FIREBASE_PATH_DEPOSITS}/${cleanDeposit.id}`, cleanDeposit);
  } catch (e) {}

  // 5. Broadcast Channel sync
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.postMessage({
        type: 'DEPOSIT_APPROVED',
        depositId: cleanDeposit.id,
        userId: cleanDeposit.userId,
        userEmail: cleanDeposit.userEmail,
        userName: cleanDeposit.userName,
        creditedAmount: Number(amount),
        newBalance: userNewBalance
      });
      bc.close();
    } catch (e) {}
  }

  // 6. Record activity
  try {
    recordUserActivity(
      { id: cleanDeposit.userId, email: cleanDeposit.userEmail, name: cleanDeposit.userName },
      'DEPOSIT_GATEWAY_SUCCESS',
      `Top up saldo ChaizMoney Rp ${Number(amount).toLocaleString('id-ID')} via JansPayment (Lunas Otomatis)`
    );
  } catch (e) {}

  return { success: true, deposit: cleanDeposit, newBalance: userNewBalance };
}

/**
 * Reject deposit by Admin
 */
export async function rejectDeposit(depositId, reason = 'Bukti pembayaran tidak valid / belum masuk ke mutasi', adminName = 'Admin ChaizStore') {
  const list = getDeposits();
  const deposit = list.find((d) => d.id === depositId);
  if (!deposit) return { success: false, message: 'Deposit tidak ditemukan' };

  const nowIso = new Date().toISOString();
  deposit.status = 'rejected';
  deposit.rejectReason = reason;
  deposit.rejectedAt = nowIso;
  deposit.rejectedBy = adminName;
  deposit.updatedAt = nowIso;
  saveDeposits(list);

  // Update in Firebase
  try {
    await updateInFirebase(`${FIREBASE_PATH_DEPOSITS}/${deposit.id}`, {
      status: 'rejected',
      rejectReason: reason,
      rejectedAt: nowIso,
      rejectedBy: adminName,
      updatedAt: nowIso
    });
  } catch (e) {}

  // Broadcast
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.postMessage({
        type: 'DEPOSIT_REJECTED',
        depositId: deposit.id,
        userId: deposit.userId,
        userEmail: deposit.userEmail,
        reason
      });
      bc.close();
    } catch (e) {}
  }

  // Record Activity
  try {
    recordUserActivity(
      { id: deposit.userId, email: deposit.userEmail, name: deposit.userName },
      'DEPOSIT_REJECTED',
      `Deposit ChaizMoney Rp ${(deposit.amount || 0).toLocaleString('id-ID')} ditolak admin: "${reason}"`
    );
  } catch (e) {}

  return { success: true, deposit };
}

/**
 * Sync all deposits from Cloud Firebase Realtime Database
 */
export async function syncDepositsFromCloud() {
  if (typeof window === 'undefined') return getDeposits();
  try {
    const cloudData = await readFromFirebase(FIREBASE_PATH_DEPOSITS);
    if (cloudData) {
      const cloudList = Array.isArray(cloudData)
        ? cloudData.filter(Boolean)
        : Object.values(cloudData).filter(Boolean);

      const localList = getDeposits();
      const map = new Map();

      // Local first
      localList.forEach((d) => {
        if (d && d.id) map.set(d.id, d);
      });

      // Merge Cloud (cloud takes precedence if newer)
      cloudList.forEach((cd) => {
        if (!cd || !cd.id) return;
        const existing = map.get(cd.id);
        if (!existing) {
          map.set(cd.id, cd);
        } else {
          const cloudTime = new Date(cd.updatedAt || cd.createdAt || 0).getTime();
          const localTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
          map.set(cd.id, cloudTime >= localTime ? cd : existing);
        }
      });

      const merged = Array.from(map.values());
      merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      localStorage.setItem(STORAGE_KEY_DEPOSITS, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('Failed to sync deposits from cloud:', err);
  }
  return getDeposits();
}

/**
 * Listen to real-time deposits updates via Firebase EventSource (SSE)
 */
export function listenToDeposits(callback) {
  if (typeof window === 'undefined') return () => {};

  return listenToFirebase(FIREBASE_PATH_DEPOSITS, (cloudData) => {
    if (!cloudData) return;
    try {
      const cloudList = Array.isArray(cloudData)
        ? cloudData.filter(Boolean)
        : Object.values(cloudData).filter(Boolean);

      if (cloudList.length > 0) {
        const localList = getDeposits();
        const map = new Map();
        localList.forEach((d) => { if (d && d.id) map.set(d.id, d); });

        cloudList.forEach((cd) => {
          if (!cd || !cd.id) return;
          map.set(cd.id, cd);
        });

        const merged = Array.from(map.values());
        merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        localStorage.setItem(STORAGE_KEY_DEPOSITS, JSON.stringify(merged));
        callback(merged);
      }
    } catch (e) {
      console.warn('Error in listenToDeposits:', e);
    }
  });
}
