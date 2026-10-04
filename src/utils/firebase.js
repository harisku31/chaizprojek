// ===================================================================
// CHAIZSTORE CLOUD SYNC ENGINE (Firebase Realtime Database)
// Native zero-dependency implementation using Web Fetch + EventSource (SSE)
// Fast, robust, and 100% compatible with all mobile browsers & laptops!
// ===================================================================

export const FIREBASE_DB_URL = 'https://chaizstore-default-rtdb.asia-southeast1.firebasedatabase.app';

// 1. Simpan Data ke Firebase (Set / Overwrite)
export async function writeToFirebase(path, data) {
  try {
    const cleanPath = path.replace(/^\/+|\/+$/g, '');
    const res = await fetch(`${FIREBASE_DB_URL}/${cleanPath}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return { success: res.ok };
  } catch (err) {
    console.error(`[Firebase write error on ${path}]:`, err);
    return { success: false, error: err };
  }
}

// 2. Update Parsial Data ke Firebase (Patch)
export async function updateInFirebase(path, partialData) {
  try {
    const cleanPath = path.replace(/^\/+|\/+$/g, '');
    const res = await fetch(`${FIREBASE_DB_URL}/${cleanPath}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partialData)
    });
    return { success: res.ok };
  } catch (err) {
    console.error(`[Firebase update error on ${path}]:`, err);
    return { success: false, error: err };
  }
}

// 3. Baca Data Sekali dari Firebase (Get)
export async function readFromFirebase(path) {
  try {
    const cleanPath = path.replace(/^\/+|\/+$/g, '');
    const res = await fetch(`${FIREBASE_DB_URL}/${cleanPath}.json?ts=${Date.now()}`, {
      cache: 'no-store'
    });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    console.error(`[Firebase read error on ${path}]:`, err);
    return null;
  }
}

// 4. Hapus Data dari Firebase (Delete)
export async function deleteFromFirebase(path) {
  try {
    const cleanPath = path.replace(/^\/+|\/+$/g, '');
    const res = await fetch(`${FIREBASE_DB_URL}/${cleanPath}.json`, {
      method: 'DELETE'
    });
    return { success: res.ok };
  } catch (err) {
    console.error(`[Firebase delete error on ${path}]:`, err);
    return { success: false, error: err };
  }
}

// 5. Langganan Realtime Real-Time Listener (SSE EventSource + Smart Polling Heartbeat)
export function listenToFirebase(path, callback) {
  if (typeof window === 'undefined') return () => {};

  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const url = `${FIREBASE_DB_URL}/${cleanPath}.json`;

  let eventSource = null;
  let isClosed = false;

  // Initial immediate fetch
  readFromFirebase(cleanPath).then((data) => {
    if (!isClosed && data !== undefined) {
      callback(data);
    }
  });

  // A. Realtime Streaming via Native Browser EventSource (Server-Sent Events)
  try {
    if (typeof EventSource !== 'undefined') {
      eventSource = new EventSource(url);

      eventSource.addEventListener('put', (e) => {
        if (isClosed) return;
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.path === '/' || parsed.path === '') {
            callback(parsed.data);
          } else {
            // Child modified, refresh entire collection
            readFromFirebase(cleanPath).then((fresh) => {
              if (!isClosed) callback(fresh);
            });
          }
        } catch (err) {
          // ignore parse errors
        }
      });

      eventSource.addEventListener('patch', () => {
        if (isClosed) return;
        readFromFirebase(cleanPath).then((fresh) => {
          if (!isClosed) callback(fresh);
        });
      });

      eventSource.onerror = () => {
        // EventSource will automatically retry in background
      };
    }
  } catch (esErr) {
    console.warn(`[EventSource init error for ${cleanPath}]:`, esErr);
  }

  // B. Fallback / Heartbeat Polling: setiap 2.5 detik saat tab browser aktif (supaya di HP tidak putus)
  const pollInterval = setInterval(() => {
    if (isClosed) return;
    if (typeof document !== 'undefined' && document.hidden) return; // hemat baterai jika tab di-minimize

    readFromFirebase(cleanPath).then((data) => {
      if (!isClosed && data !== undefined) {
        callback(data);
      }
    });
  }, 2500);

  // Return unsubscribe cleaner
  return () => {
    isClosed = true;
    clearInterval(pollInterval);
    if (eventSource) {
      try {
        eventSource.close();
      } catch {}
    }
  };
}
