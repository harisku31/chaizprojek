// ===================================================================
// JANSPAYMENT OFFICIAL REALTIME QRIS & GOPAY ENGINE
// Provider: https://janspayment.com
// Client API Key: js_c2ae56533ce1a2da9470e1e5916bd8cc67c732718d7b9c43
// Real Auto-Detection: 100% Anti-Fraud & Real-Time Polling
// ===================================================================

import QRCode from 'qrcode';

export const JANSPAYMENT_BASE_URL = 'https://janspayment.com';
export const JANSPAYMENT_API_KEY = 'js_c2ae56533ce1a2da9470e1e5916bd8cc67c732718d7b9c43';
export const QRIS_GATEWAY_CLIENT_KEY = JANSPAYMENT_API_KEY;
export const MERCHANT_NMID = 'ID1026479345864';
export const MERCHANT_NAME = 'ChaizStore 081809730331,';
export const MERCHANT_CITY = 'CIANJUR';

// QRIS Statis Resmi Toko ChaizStore (GoPay Merchant / NMID: ID1026479345864)
export const CHAIZ_STATIC_QRIS = '00020101021126610014COM.GO-JEK.WWW01189360091437613423570210G7613423570303UMI51440014ID.CO.QRIS.WWW0215ID10264793458640303UMI5204899953033605802ID5924ChaizStore 081809730331,6007CIANJUR61054328162070703A016304E7FE';

/**
 * Kalkulasi Checksum CRC16-CCITT standar EMVCo / Bank Indonesia QRIS
 */
export function calculateQrisCrc16(str) {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
  }
  let hex = crc.toString(16).toUpperCase();
  while (hex.length < 4) hex = '0' + hex;
  return hex;
}

/**
 * Generate QRIS Dinamis Resmi Toko ChaizStore dengan Nominal Persis & Terkunci (NMID: ID1026479345864)
 * Pembeli saat scan barcode di HP (BCA, DANA, GoPay, Mandiri, dll) akan otomatis mendapati
 * nominal tagihan persis terkunci tanpa perlu ketik manual, dan dana langsung masuk ke akun resmi ChaizStore.
 */
export async function generateChaizDynamicQris(amount) {
  const cleanAmount = Math.max(1, Math.round(Number(amount) || 1));
  const amountStr = String(cleanAmount);
  const amountTag = '54' + String(amountStr.length).padStart(2, '0') + amountStr;

  // 1. Ubah indikator 010211 (statis) menjadi 010212 (dinamis)
  let qris = CHAIZ_STATIC_QRIS.replace('010211', '010212');
  // 2. Buang tag 6304 + 4 digit CRC lama
  qris = qris.slice(0, -8);

  // 3. Sisipkan tag 54 (nominal) tepat sebelum tag 58 (5802ID)
  const tag58Pos = qris.indexOf('5802ID');
  if (tag58Pos !== -1) {
    qris = qris.slice(0, tag58Pos) + amountTag + qris.slice(tag58Pos);
  } else {
    qris = qris + amountTag;
  }

  // 4. Hitung ulang checksum CRC16 resmi
  qris = qris + '6304';
  const newCrc = calculateQrisCrc16(qris);
  const finalQrString = qris + newCrc;

  // 5. Render ke Data URL base64 image (420x420)
  const qrDataUrl = await QRCode.toDataURL(finalQrString, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 440,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  return {
    success: true,
    provider: 'ChaizStore Official Dynamic QRIS',
    qrString: finalQrString,
    qrImageUrl: qrDataUrl,
    amount: cleanAmount
  };
}

/**
 * 1. Buat Tagihan QRIS Resmi di Server JansPayment
 * Mengembalikan payment_id, nominal unik presisi, dan string QRIS resmi.
 */
export async function createJansPaymentQris({ amount, orderId, note }) {
  const cleanAmount = Math.max(1000, Math.round(Number(amount) || 1000));
  const ref = orderId || `CHZ-${Date.now().toString().slice(-6)}`;
  const orderNote = note || `Pesanan #${ref} ChaizStore`;

  let data = null;
  let fetchError = null;

  // 1. Direct fetch ke server JansPayment
  try {
    const res = await fetch(`${JANSPAYMENT_BASE_URL}/gateaway/qris/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JANSPAYMENT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: cleanAmount,
        ref: ref,
        note: orderNote
      })
    });

    if (res.ok) {
      data = await res.json();
    } else {
      const errTxt = await res.text();
      try { data = JSON.parse(errTxt); } catch (_) {}
    }
  } catch (err) {
    fetchError = err;
    console.warn('Direct JansPayment create failed, attempting proxy route:', err.message);
  }

  // 2. Fallback via local backend proxy jika direct fetch gagal / CORS
  if (!data?.success) {
    try {
      const proxyRes = await fetch('/api/gateway/create-qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cleanAmount,
          orderId: ref,
          note: orderNote
        })
      });
      if (proxyRes.ok) {
        data = await proxyRes.json();
      }
    } catch (proxyErr) {
      console.warn('Proxy JansPayment create failed:', proxyErr.message);
    }
  }

  if (!data?.success || !data?.data) {
    throw new Error(data?.message || fetchError?.message || 'Gagal membuat QRIS di JansPayment');
  }

  const payload = data.data;
  let qrDataUrl = payload.qr_image_url || payload.qr_url;

  // Generate crisp high-res base64 jika ada qr_string resmi
  if (payload.qr_string) {
    try {
      qrDataUrl = await QRCode.toDataURL(payload.qr_string, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 440,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    } catch (err) {
      console.warn('QRCode render error:', err);
    }
  }

  return {
    success: true,
    provider: 'JansPayment',
    paymentId: payload.payment_id,
    amount: payload.amount, // Total tagihan persis dengan kode unik
    requestedAmount: payload.requested_amount || cleanAmount,
    creditAmount: payload.credit_amount || cleanAmount, // Saldo ChaizMoney yang masuk
    feeAmount: payload.fee_amount || 0,
    uniqueCode: payload.unique_code || 0,
    qrString: payload.qr_string,
    qrImageUrl: qrDataUrl,
    checkoutUrl: payload.checkout_url,
    expiryTime: payload.expiry_time,
    expiresAt: payload.payment?.expires_at
  };
}

/**
 * 2. Cek Status Pembayaran Real-Time ke Server JansPayment
 * Hanya mengembalikan paid: true jika uang BENAR-BENAR sudah masuk di rekening/gateway!
 * Jika pembeli belum bayar, paid akan selalu bernilai false (Anti-Tipu).
 */
export async function checkJansPaymentStatus({ paymentId }) {
  if (!paymentId || paymentId.startsWith('fallback_')) {
    return { success: true, paid: false, message: 'Menunggu pembayaran' };
  }

  let data = null;

  // 1. Direct fetch ke JansPayment API
  try {
    const res = await fetch(`${JANSPAYMENT_BASE_URL}/gateaway/payment/check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JANSPAYMENT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payment_id: paymentId
      })
    });

    if (res.ok) {
      data = await res.json();
    }
  } catch (err) {
    // direct error
  }

  // 2. Fallback via local backend proxy
  if (!data?.success) {
    try {
      const proxyRes = await fetch('/api/gateway/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId })
      });
      if (proxyRes.ok) {
        data = await proxyRes.json();
      }
    } catch (e) {}
  }

  if (!data || !data.success) {
    return { success: false, paid: false, error: data?.message || 'Gagal mengecek status' };
  }

  const payload = data.data || {};
  return {
    success: true,
    paid: Boolean(payload.paid),
    expired: Boolean(payload.expired),
    cancelled: Boolean(payload.cancelled),
    creditAmount: payload.credit_amount,
    payment: payload.payment,
    message: data.message
  };
}

/**
 * Helper generator Data URL QRIS Dinamis Toko ChaizStore
 */
export async function generateQrisDataUrl({ amount, orderId }) {
  try {
    const dynamicQris = await generateChaizDynamicQris(amount);
    return {
      dataUrl: dynamicQris.qrImageUrl,
      payload: dynamicQris.qrString,
      amount: dynamicQris.amount,
      jansData: dynamicQris
    };
  } catch {
    const res = await createJansPaymentQris({ amount, orderId });
    return {
      dataUrl: res.qrImageUrl || '/Qris.png',
      payload: res.qrString || '',
      jansData: res
    };
  }
}

export async function verifyGatewayPayment({ orderId, amount, paymentId }) {
  if (paymentId) {
    const status = await checkJansPaymentStatus({ paymentId });
    if (status.paid) {
      return {
        success: true,
        status: 'SETTLED',
        paymentStatus: 'Lunas',
        orderId,
        amount: Math.round(Number(amount)),
        gateway: 'JansPayment Gateway (Resmi)',
        clientKey: JANSPAYMENT_API_KEY,
        transactionId: paymentId,
        verifiedAt: new Date().toISOString()
      };
    } else {
      throw new Error(status.message || 'Pembayaran belum terdeteksi di JansPayment');
    }
  }
  return {
    success: false,
    error: 'Payment ID tidak ditemukan'
  };
}
