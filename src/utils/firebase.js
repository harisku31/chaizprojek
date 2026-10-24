// ===================================================================
// CHAIZSTORE CLOUD SYNC ENGINE (Firebase Realtime Database)
// Ultra-lightweight native Web Standards (Fetch + EventSource SSE)
// Optimized for zero lag, instant updates & 60fps performance
// ===================================================================

export const FIREBASE_DB_URL = 'https://chaizstore-default-rtdb.asia-southeast1.firebasedatabase.app';

// In-flight GET request deduplication cache to prevent duplicate parallel downloads
const inFlightReads = new Map();

// Helper: Network fetch with automatic exponential backoff retry (up to 3 attempts)
async function fetchWithRetry(url, options, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) {
        return { success: true, res };
      }
      if (attempt === maxRetries) {
        return { success: false, status: res.status };
      }
    } catch (err) {
      if (attempt === maxRetries) {
        return { success: false, error: err };
      }
    }
    // Exponential backoff delay (100ms, 250ms, 500ms)
    await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2.2, attempt)));
  }
  return { success: false };
}

// 1. Simpan Data ke Firebase (Set / Overwrite with Retry)
export async function writeToFirebase(path, data) {
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const result = await fetchWithRetry(`${FIREBASE_DB_URL}/${cleanPath}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return { success: result.success };
}

// 2. Update Parsial Data ke Firebase (Patch with Retry)
export async function updateInFirebase(path, partialData) {
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const result = await fetchWithRetry(`${FIREBASE_DB_URL}/${cleanPath}.json`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partialData)
  });
  return { success: result.success };
}

// 3. Baca Data Sekali dari Firebase (Get with In-Flight Coalescing)
export async function readFromFirebase(path) {
  const cleanPath = path.replace(/^\/+|\/+$/g, '');

  // Coalesce duplicate parallel read requests for the same path
  if (inFlightReads.has(cleanPath)) {
    return inFlightReads.get(cleanPath);
  }

  const readPromise = (async () => {
    try {
      const res = await fetch(`${FIREBASE_DB_URL}/${cleanPath}.json?ts=${Date.now()}`, {
        cache: 'no-store'
      });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (err) {
      console.warn(`[Firebase read error on ${cleanPath}]:`, err.message || err);
      return null;
    } finally {
      // Release in-flight lock after small window
      setTimeout(() => inFlightReads.delete(cleanPath), 100);
    }
  })();

  inFlightReads.set(cleanPath, readPromise);
  return readPromise;
}

// 4. Hapus Data dari Firebase (Delete with Retry)
export async function deleteFromFirebase(path) {
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const result = await fetchWithRetry(`${FIREBASE_DB_URL}/${cleanPath}.json`, {
    method: 'DELETE'
  });
  return { success: result.success };
}

// Helper: In-memory deep delta applicator for Firebase SSE PUT/PATCH
function applyDeepDelta(target, pathParts, value, isPatch = false) {
  if (!target || typeof target !== 'object') return target;
  if (!pathParts || pathParts.length === 0) {
    if (isPatch && typeof value === 'object' && value !== null) {
      return { ...target, ...value };
    }
    return value;
  }

  let current = target;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const key = pathParts[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  const lastKey = pathParts[pathParts.length - 1];
  if (value === null && !isPatch) {
    if (Array.isArray(current)) {
      const idx = current.findIndex((it) => it && (it.id === lastKey || String(it.id) === lastKey));
      if (idx >= 0) current.splice(idx, 1);
    } else {
      delete current[lastKey];
    }
  } else if (isPatch && typeof value === 'object' && value !== null && typeof current[lastKey] === 'object' && current[lastKey] !== null) {
    current[lastKey] = { ...current[lastKey], ...value };
  } else {
    if (Array.isArray(current)) {
      const idx = current.findIndex((it) => it && (it.id === lastKey || String(it.id) === lastKey));
      if (idx >= 0) {
        current[idx] = isPatch ? { ...current[idx], ...value } : value;
      } else {
        current.unshift(value);
      }
    } else {
      current[lastKey] = value;
    }
  }
  return target;
}

// 5. Langganan Realtime Listener (SSE EventSource + Smart In-Memory Delta + Debounced Deliver)
export function listenToFirebase(path, callback) {
  if (typeof window === 'undefined' || typeof callback !== 'function') return () => {};

  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const url = `${FIREBASE_DB_URL}/${cleanPath}.json`;

  let eventSource = null;
  let isClosed = false;
  let lastDataString = '';
  let currentData = null;
  let debounceTimer = null;

  // Hanya deliver callback jika data benar-benar berubah, hemat memori & 60fps
  const deliverIfChanged = (data) => {
    if (isClosed || data === undefined) return;
    try {
      const serialized = JSON.stringify(data);
      if (serialized !== lastDataString) {
        lastDataString = serialized;
        currentData = data;
        callback(data);
      }
    } catch {
      callback(data);
    }
  };

  // Trailing debounce untuk mencegah re-render berlebihan (smooth 60fps)
  const scheduleDelivery = (data) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      deliverIfChanged(data);
    }, 40);
  };

  // Initial immediate fetch
  readFromFirebase(cleanPath).then((initData) => {
    if (!isClosed && initData !== undefined) {
      currentData = initData;
      deliverIfChanged(initData);
    }
  });

  // A. Realtime Streaming via Native Browser EventSource (Server-Sent Events)
  try {
    if (typeof EventSource !== 'undefined') {
      eventSource = new EventSource(url);

      // Handle PUT events (root replace or child node set)
      eventSource.addEventListener('put', (e) => {
        if (isClosed) return;
        try {
          const parsed = JSON.parse(e.data);
          if (!parsed.path || parsed.path === '/' || parsed.path === '') {
            currentData = parsed.data;
            scheduleDelivery(currentData);
          } else {
            const parts = parsed.path.replace(/^\/+|\/+$/g, '').split('/');
            if (currentData && typeof currentData === 'object') {
              applyDeepDelta(currentData, parts, parsed.data, false);
              scheduleDelivery(currentData);
            } else {
              readFromFirebase(cleanPath).then(scheduleDelivery);
            }
          }
        } catch {
          readFromFirebase(cleanPath).then(scheduleDelivery);
        }
      });

      // Handle PATCH events (instant in-memory delta merging without full network fetch)
      eventSource.addEventListener('patch', (e) => {
        if (isClosed) return;
        try {
          const parsed = JSON.parse(e.data);
          if (!parsed.path || parsed.path === '/' || parsed.path === '') {
            if (currentData && typeof currentData === 'object' && parsed.data) {
              currentData = { ...currentData, ...parsed.data };
              scheduleDelivery(currentData);
            } else {
              readFromFirebase(cleanPath).then(scheduleDelivery);
            }
          } else {
            const parts = parsed.path.replace(/^\/+|\/+$/g, '').split('/');
            if (currentData && typeof currentData === 'object') {
              applyDeepDelta(currentData, parts, parsed.data, true);
              scheduleDelivery(currentData);
            } else {
              readFromFirebase(cleanPath).then(scheduleDelivery);
            }
          }
        } catch {
          readFromFirebase(cleanPath).then(scheduleDelivery);
        }
      });

      eventSource.onerror = () => {
        // Browser handles auto-reconnect automatically
      };
    }
  } catch (esErr) {
    console.warn(`[EventSource init error for ${cleanPath}]:`, esErr);
  }

  // B. Fallback Heartbeat setiap 15 detik jika EventSource terputus atau backgrounding
  const pollInterval = setInterval(() => {
    if (isClosed) return;
    if (typeof document !== 'undefined' && document.hidden) return;

    readFromFirebase(cleanPath).then((refreshed) => {
      if (!isClosed && refreshed !== undefined) {
        scheduleDelivery(refreshed);
      }
    });
  }, 15000);

  // Return unsubscribe cleaner
  return () => {
    isClosed = true;
    if (debounceTimer) clearTimeout(debounceTimer);
    clearInterval(pollInterval);
    if (eventSource) {
      try {
        eventSource.close();
      } catch {}
    }
  };
}
