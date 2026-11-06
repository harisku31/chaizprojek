// ===================================================================
// MIDTRANS SNAP CLIENT HELPER (PRODUCTION / SANDBOX)
// High-Reliability Dynamic QRIS & Auto-Payment Pop-up
// ===================================================================

import { getSqlApiBaseUrl } from './sqlApi';

export const MIDTRANS_CLIENT_KEY = 'Mid-client-4pG9zJwns0zxH_HE';

/**
 * Meminta Snap Token dari Backend (Local Node Server / Vercel Serverless)
 */
export async function getMidtransSnapToken(orderData) {
  const baseUrl = getSqlApiBaseUrl();

  // Coba backend server Node.js lokal terlebih dahulu
  try {
    const res = await fetch(`${baseUrl}/api/midtrans/create-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) return data.token;
    }
  } catch (e) {
    console.warn('Dedicated Node server Midtrans endpoint fallback to relative API...');
  }

  // Fallback ke relative API (Vercel serverless /api/midtrans/token)
  try {
    const res2 = await fetch('/api/midtrans/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2.token) return data2.token;
    }
    const errData = await res2.json().catch(() => ({}));
    throw new Error(errData.error || 'Gagal membuat sesi pembayaran Midtrans');
  } catch (err) {
    throw err;
  }
}

/**
 * Menampilkan Pop-Up Resmi Midtrans Snap (QRIS Dinamis Otomatis)
 */
export function payWithMidtransSnap(snapToken, { onSuccess, onPending, onError, onClose }) {
  if (typeof window === 'undefined' || !window.snap) {
    // Jika script snap.js belum siap, coba muat dinamis
    const script = document.createElement('script');
    script.src = 'https://app.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
    script.onload = () => {
      window.snap.pay(snapToken, {
        onSuccess: (result) => onSuccess && onSuccess(result),
        onPending: (result) => onPending && onPending(result),
        onError: (result) => onError && onError(result),
        onClose: () => onClose && onClose()
      });
    };
    document.body.appendChild(script);
    return;
  }

  window.snap.pay(snapToken, {
    onSuccess: (result) => onSuccess && onSuccess(result),
    onPending: (result) => onPending && onPending(result),
    onError: (result) => onError && onError(result),
    onClose: () => onClose && onClose()
  });
}
