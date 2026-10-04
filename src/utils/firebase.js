// ===================================================================
// CHAIZSTORE CLOUD SYNC ENGINE (Firebase Realtime Database)
// Ultra-lightweight native Web Standards (Fetch + EventSource SSE)
// Optimized for zero mobile lag & 60fps performance
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

// 5. Langganan Realtime Listener (SSE EventSource + Smart Debounced Polling)
export function listenToFirebase(path, callback) {
  if (typeof window === 'undefined') return () => {};

  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const url = `${FIREBASE_DB_URL}/${cleanPath}.json`;

  let eventSource = null;
  let isClosed = false;
  let lastDataString = '';

  // Hanya invoke callback jika data benar-benar berubah, untuk mencegah lag di HP!
  const deliverIfChanged = (data) => {
    if (isClosed || data === undefined) return;
    try {
      const serialized = JSON.stringify(data);
      if (serialized !== lastDataString) {
        lastDataString = serialized;
        callback(data);
      }
    } catch {
      callback(data);
    }
  };

  // Initial immediate fetch
  readFromFirebase(cleanPath).then(deliverIfChanged);

  // A. Realtime Streaming via Native Browser EventSource (Server-Sent Events)
  try {
    if (typeof EventSource !== 'undefined') {
      eventSource = new EventSource(url);

      eventSource.addEventListener('put', (e) => {
        if (isClosed) return;
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.path === '/' || parsed.path === '') {
            deliverIfChanged(parsed.data);
          } else {
            readFromFirebase(cleanPath).then(deliverIfChanged);
          }
        } catch {
          // ignore
        }
      });

      eventSource.addEventListener('patch', () => {
        if (isClosed) return;
        readFromFirebase(cleanPath).then(deliverIfChanged);
      });

      eventSource.onerror = () => {
        // Otomatis reconnect oleh browser
      };
    }
  } catch (esErr) {
    console.warn(`[EventSource init error for ${cleanPath}]:`, esErr);
  }

  // B. Fallback Heartbeat setiap 8 detik (hanya saat layar HP aktif, sangat hemat memori)
  const pollInterval = setInterval(() => {
    if (isClosed) return;
    if (typeof document !== 'undefined' && document.hidden) return;

    readFromFirebase(cleanPath).then(deliverIfChanged);
  }, 8000);

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
