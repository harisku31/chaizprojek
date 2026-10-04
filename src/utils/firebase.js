// ===================================================================
// CHAIZSTORE FIREBASE REALTIME DATABASE SYNC ENGINE
// Connects phone, laptop, and all devices worldwide in real-time!
// ===================================================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  off
} from 'firebase/database';

export const FIREBASE_DB_URL = 'https://chaizstore-default-rtdb.asia-southeast1.firebasedatabase.app';

const firebaseConfig = {
  databaseURL: FIREBASE_DB_URL,
  projectId: 'chaizstore'
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);

// 1. Simpan Data ke Firebase (Set)
export async function writeToFirebase(path, data) {
  try {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const dbRef = ref(db, cleanPath);
    await set(dbRef, data);
    return { success: true };
  } catch (err) {
    console.warn(`[Firebase SDK Set Failed for ${path}, falling back to REST]:`, err);
    // REST API Fallback
    try {
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      const res = await fetch(`${FIREBASE_DB_URL}/${cleanPath}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return { success: res.ok };
    } catch (restErr) {
      console.error(`[Firebase REST Set Failed for ${path}]:`, restErr);
      return { success: false, error: restErr };
    }
  }
}

// 2. Update Parsial Data ke Firebase (Update / Patch)
export async function updateInFirebase(path, partialData) {
  try {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const dbRef = ref(db, cleanPath);
    await update(dbRef, partialData);
    return { success: true };
  } catch (err) {
    console.warn(`[Firebase SDK Update Failed for ${path}, falling back to REST]:`, err);
    // REST API Fallback
    try {
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      const res = await fetch(`${FIREBASE_DB_URL}/${cleanPath}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialData)
      });
      return { success: res.ok };
    } catch (restErr) {
      console.error(`[Firebase REST Update Failed for ${path}]:`, restErr);
      return { success: false, error: restErr };
    }
  }
}

// 3. Baca Data Sekali dari Firebase (Get)
export async function readFromFirebase(path) {
  try {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const dbRef = ref(db, cleanPath);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (err) {
    console.warn(`[Firebase SDK Get Failed for ${path}, falling back to REST]:`, err);
    try {
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      const res = await fetch(`${FIREBASE_DB_URL}/${cleanPath}.json`);
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (restErr) {
      console.error(`[Firebase REST Get Failed for ${path}]:`, restErr);
      return null;
    }
  }
}

// 4. Hapus Data dari Firebase (Remove)
export async function deleteFromFirebase(path) {
  try {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const dbRef = ref(db, cleanPath);
    await remove(dbRef);
    return { success: true };
  } catch (err) {
    try {
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      const res = await fetch(`${FIREBASE_DB_URL}/${cleanPath}.json`, { method: 'DELETE' });
      return { success: res.ok };
    } catch (restErr) {
      return { success: false, error: restErr };
    }
  }
}

// 5. Langganan Realtime Real-Time Listener (onValue)
export function listenToFirebase(path, callback) {
  if (typeof window === 'undefined') return () => {};

  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const dbRef = ref(db, cleanPath);

  const unsubscribe = onValue(
    dbRef,
    (snapshot) => {
      const val = snapshot.exists() ? snapshot.val() : null;
      callback(val);
    },
    (error) => {
      console.error(`[Firebase onValue listener error on ${path}]:`, error);
    }
  );

  return () => {
    try {
      off(dbRef);
      if (typeof unsubscribe === 'function') unsubscribe();
    } catch {
      // ignore
    }
  };
}

// 6. Monitor Status Koneksi Cloud Firebase
export function listenToFirebaseConnection(callback) {
  if (typeof window === 'undefined') return () => {};
  const connectedRef = ref(db, '.info/connected');
  return onValue(connectedRef, (snap) => {
    const isConnected = snap.val() === true;
    callback(isConnected);
  });
}

export { ref, set, get, update, remove, onValue, off };
