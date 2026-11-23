// ===================================================================
// CHAIZSTORE GUDANG VOUCHER & REALTIME PROMO DATABASE
// Terhubung dinamis dengan Menu Gudang Voucher di Portal Admin
// ===================================================================

export const VOUCHERS_STORAGE_KEY = 'chaiz_store_vouchers';

/**
 * Mengambil daftar seluruh voucher dari Gudang Voucher
 */
export function getStoredVouchers() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(VOUCHERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Menyimpan daftar voucher ke storage dan broadcast ke seluruh tab browser
 */
export function saveStoredVouchers(list) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VOUCHERS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('storage'));
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('chaiz_admin_sync');
      bc.postMessage({ type: 'VOUCHERS_UPDATED', vouchers: list });
      bc.close();
    }
  } catch (e) {
    console.error('Failed to save vouchers:', e);
  }
}

/**
 * Menambahkan voucher baru ke Gudang Voucher
 */
export function addStoredVoucher(voucher) {
  const current = getStoredVouchers();
  const cleanCode = String(voucher.code || '').trim().toUpperCase().replace(/\s+/g, '');
  const discountAmount = Number(voucher.discountAmount) || 0;
  const hasMinPurchase = Boolean(voucher.hasMinPurchase);
  const minPurchaseAmount = hasMinPurchase ? (Number(voucher.minPurchaseAmount) || 20000) : 0;

  const newVoucher = {
    id: 'vch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    code: cleanCode,
    name: String(voucher.name || `Diskon Rp ${discountAmount.toLocaleString('id-ID')}`).trim(),
    description: String(voucher.description || (hasMinPurchase ? `Potongan Rp ${discountAmount.toLocaleString('id-ID')} (Minimal belanja Rp ${minPurchaseAmount.toLocaleString('id-ID')})` : `Potongan Rp ${discountAmount.toLocaleString('id-ID')} tanpa minimal belanja`)).trim(),
    discountAmount,
    hasMinPurchase,
    minPurchaseAmount,
    type: 'discount',
    isSingleUse: true, // 1x pakai langsung hangus
    isUsed: false,
    usedAt: null,
    usedBy: null,
    usedOrder: null,
    isActive: true,
    badge: voucher.badge || `Diskon Rp ${discountAmount.toLocaleString('id-ID')}`,
    createdAt: new Date().toISOString(),
    ...voucher
  };

  const updated = [newVoucher, ...current.filter((v) => v.code !== cleanCode)];
  saveStoredVouchers(updated);
  return newVoucher;
}

/**
 * Tandai voucher telah digunakan oleh pembeli (1x Pakai Langsung Hangus)
 */
export function markVoucherAsUsed(codeOrId, userEmail = 'Pelanggan', orderId = '') {
  const clean = String(codeOrId || '').trim().toUpperCase().replace(/\s+/g, '');
  const current = getStoredVouchers();
  const updated = current.map((v) => {
    if (v.code === clean || v.id === codeOrId) {
      return {
        ...v,
        isUsed: true,
        isActive: false, // Otomatis nonaktif / hangus
        usedAt: new Date().toISOString(),
        usedBy: userEmail || 'Pelanggan',
        usedOrder: orderId || ''
      };
    }
    return v;
  });
  saveStoredVouchers(updated);
  return true;
}

/**
 * Menghapus voucher tertentu dari Gudang Voucher
 */
export function deleteStoredVoucher(idOrCode) {
  const current = getStoredVouchers();
  const updated = current.filter((v) => v.id !== idOrCode && v.code !== idOrCode);
  saveStoredVouchers(updated);
  return true;
}

/**
 * Hapus Semua Voucher yang Sudah Digunakan (Hangus) Sekaligus
 */
export function clearUsedVouchers() {
  const current = getStoredVouchers();
  const updated = current.filter((v) => !v.isUsed);
  saveStoredVouchers(updated);
  return true;
}

/**
 * Mengubah status aktif / nonaktif voucher
 */
export function toggleStoredVoucherActive(idOrCode) {
  const current = getStoredVouchers();
  const updated = current.map((v) => {
    if (v.id === idOrCode || v.code === idOrCode) {
      return { ...v, isActive: !v.isActive };
    }
    return v;
  });
  saveStoredVouchers(updated);
  return updated;
}

/**
 * Mencari voucher berdasarkan kode (lengkap dengan validasi status hangus / expired)
 */
export function findVoucher(inputCode) {
  if (!inputCode) return null;
  const clean = inputCode.trim().toUpperCase().replace(/\s+/g, '');
  const list = getStoredVouchers();
  return (
    list.find((v) => {
      if (v.code === clean) return true;
      if (Array.isArray(v.aliases) && v.aliases.includes(clean)) return true;
      return false;
    }) || null
  );
}

// Default export compatibility
export const VOUCHERS = [];


