import { PRODUCTS } from '../data/products';

const DB_STORAGE_KEY = 'chaiz_products_database';
const SYNC_CHANNEL_NAME = 'chaiz_products_sync';

// Inisialisasi Database Produk dan Gudang Restock
export function initializeProductsDatabase() {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with default PRODUCTS to ensure any new fields exist
        const merged = PRODUCTS.map((prod) => {
          const existing = parsed.find((p) => p.id === prod.id);
          if (existing) {
            return {
              ...prod,
              ...existing,
              stock: typeof existing.stock === 'number' ? existing.stock : prod.stock,
              accounts: Array.isArray(existing.accounts) ? existing.accounts : []
            };
          }
          return {
            ...prod,
            accounts: []
          };
        });
        localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch (e) {
    console.error('Error loading product database, resetting to default:', e);
  }

  // Initial seeding with sample accounts for realistic warehouse experience
  const initial = PRODUCTS.map((p) => {
    const accounts = [];
    if (p.id === 'gemini-advanced') {
      accounts.push(
        {
          id: 'acc_gemini_1',
          email: 'gemini.ultra.pro1@gmail.com',
          password: 'GeminiPass2026!',
          note: 'Gemini 1.5 Pro 2TB Cloud',
          addedAt: new Date(Date.now() - 3600000 * 24).toISOString()
        },
        {
          id: 'acc_gemini_2',
          email: 'gemini.vip.ai2@gmail.com',
          password: 'AiMasterGemini#99',
          note: 'Paket 1 Tahun Garansi',
          addedAt: new Date(Date.now() - 3600000 * 12).toISOString()
        }
      );
    } else if (p.id === 'youtube-prem') {
      accounts.push({
        id: 'acc_yt_1',
        email: 'yt.premium.chaiz@gmail.com',
        password: 'MusicNoAds#2026',
        note: 'YouTube Music & Video Bebas Iklan',
        addedAt: new Date(Date.now() - 3600000 * 8).toISOString()
      });
    } else if (p.id === 'canva-pro') {
      accounts.push({
        id: 'acc_canva_1',
        email: 'canva.team.desain@gmail.com',
        password: 'CanvaMagicStudio#77',
        note: 'Brand Kit & Template Unlocked',
        addedAt: new Date(Date.now() - 3600000 * 5).toISOString()
      });
    }

    return {
      ...p,
      accounts
    };
  });

  try {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(initial));
  } catch (err) {
    console.warn('Unable to persist initial product database:', err);
  }

  return initial;
}

// Ambil seluruh produk dari database gudang
export function getDatabaseProducts() {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to get database products:', e);
  }
  return initializeProductsDatabase();
}

// Ambil satu produk berdasarkan ID
export function getDatabaseProductById(id) {
  const products = getDatabaseProducts();
  return products.find((p) => p.id === id) || null;
}

// Simpan perubahan ke storage & broadcast event ke semua tab/window
function saveAndBroadcastProducts(products, reason = 'STOCK_UPDATED', meta = {}) {
  try {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.error('Failed to save products to localStorage:', e);
  }

  // 1. Dispatch custom event di window saat ini
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('chaiz_stock_updated', {
        detail: { reason, meta, products }
      })
    );
  }

  // 2. BroadcastChannel antar tab browser
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
      bc.postMessage({ type: 'PRODUCTS_UPDATED', reason, meta, products });
      setTimeout(() => bc.close(), 100);
    } catch {
      // Ignore broadcast channel errors
    }
  }
}

// Tambah Akun Baru (Email & Password) -> Otomatis Restock Nambah +1
export function addAccountToProduct(productId, { email, password, note = '' }) {
  if (!email || !password) {
    throw new Error('Email / Username dan Password wajib diisi!');
  }

  const products = getDatabaseProducts();
  const index = products.findIndex((p) => p.id === productId);
  if (index === -1) {
    throw new Error('Produk tidak ditemukan!');
  }

  const target = products[index];
  const newAccount = {
    id: 'acc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    email: email.trim(),
    password: password.trim(),
    note: (note || '').trim(),
    addedAt: new Date().toISOString()
  };

  const updatedAccounts = Array.isArray(target.accounts) ? [...target.accounts, newAccount] : [newAccount];
  const updatedStock = Math.max(0, (target.stock || 0) + 1);

  products[index] = {
    ...target,
    stock: updatedStock,
    accounts: updatedAccounts
  };

  saveAndBroadcastProducts(products, 'ACCOUNT_ADDED', {
    productId,
    productName: target.name,
    email: newAccount.email,
    newStock: updatedStock
  });

  return {
    success: true,
    product: products[index],
    newStock: updatedStock,
    addedAccount: newAccount
  };
}

// Hapus satu akun dari Vault Gudang (Stok berkurang -1)
export function deleteAccountFromProduct(productId, accountId) {
  const products = getDatabaseProducts();
  const index = products.findIndex((p) => p.id === productId);
  if (index === -1) {
    throw new Error('Produk tidak ditemukan!');
  }

  const target = products[index];
  const updatedAccounts = (target.accounts || []).filter((acc) => acc.id !== accountId);
  const updatedStock = Math.max(0, (target.stock || 1) - 1);

  products[index] = {
    ...target,
    stock: updatedStock,
    accounts: updatedAccounts
  };

  saveAndBroadcastProducts(products, 'ACCOUNT_DELETED', {
    productId,
    productName: target.name,
    accountId,
    newStock: updatedStock
  });

  return {
    success: true,
    product: products[index],
    newStock: updatedStock
  };
}

// Atur Restock Secara Manuality (Manual Stok Langsung)
export function updateStockManuality(productId, newStockValue) {
  const parsedStock = parseInt(newStockValue, 10);
  if (isNaN(parsedStock) || parsedStock < 0) {
    throw new Error('Jumlah restock harus berupa angka positif (minimal 0)!');
  }

  const products = getDatabaseProducts();
  const index = products.findIndex((p) => p.id === productId);
  if (index === -1) {
    throw new Error('Produk tidak ditemukan!');
  }

  const target = products[index];
  const oldStock = target.stock || 0;

  products[index] = {
    ...target,
    stock: parsedStock
  };

  saveAndBroadcastProducts(products, 'MANUAL_RESTOCK', {
    productId,
    productName: target.name,
    oldStock,
    newStock: parsedStock
  });

  return {
    success: true,
    product: products[index],
    newStock: parsedStock,
    diff: parsedStock - oldStock
  };
}

// Kurangi stok produk saat transaksi diproses/dikirim oleh Admin (Realtime Sync ke Pembeli & Admin)
export function deductProductStock(productIdentifier, qty = 1, sentAccountEmail = null) {
  const products = getDatabaseProducts();
  const cleanQty = Math.max(1, parseInt(qty, 10) || 1);

  if (!productIdentifier) return null;

  const targetStr = String(productIdentifier).toLowerCase().trim();

  // 1. Cari exact match ID
  let index = products.findIndex((p) => p.id && p.id.toLowerCase() === targetStr);

  // 2. Jika tidak ketemu, cari partial match ID
  if (index === -1) {
    index = products.findIndex(
      (p) => p.id && (p.id.toLowerCase().includes(targetStr) || targetStr.includes(p.id.toLowerCase()))
    );
  }

  // 3. Cari berdasarkan nama produk
  if (index === -1) {
    index = products.findIndex((p) => {
      if (!p.name) return false;
      const pName = p.name.toLowerCase();
      return pName === targetStr || pName.includes(targetStr) || targetStr.includes(pName);
    });
  }

  // 4. Jika masih tidak ketemu, coba kata kunci utama
  if (index === -1) {
    const keywords = [
      'canva',
      'netflix',
      'youtube',
      'spotify',
      'capcut',
      'gemini',
      'alight',
      'disney',
      'vidio',
      'viu',
      'wibuku',
      'bstation',
      'wink',
      'duolingo',
      'grok'
    ];
    for (const kw of keywords) {
      if (targetStr.includes(kw)) {
        index = products.findIndex((p) => (p.name || p.id || '').toLowerCase().includes(kw));
        if (index !== -1) break;
      }
    }
  }

  if (index === -1) {
    console.warn(`[Stock Deduction] Produk "${productIdentifier}" tidak ditemukan di database.`);
    return null;
  }

  const target = products[index];
  const oldStock = typeof target.stock === 'number' ? target.stock : 5;
  const newStock = Math.max(0, oldStock - cleanQty);

  // Jika akun tertentu dikirimkan dan tersimpan di vault akun produk, hapus akun tersebut dari daftar akun siap pakai
  let updatedAccounts = Array.isArray(target.accounts) ? [...target.accounts] : [];
  if (sentAccountEmail && updatedAccounts.length > 0) {
    const cleanMail = String(sentAccountEmail).toLowerCase().trim();
    const accMatchIdx = updatedAccounts.findIndex(
      (a) => a.email && a.email.toLowerCase().trim() === cleanMail
    );
    if (accMatchIdx !== -1) {
      updatedAccounts.splice(accMatchIdx, 1);
    }
  }

  products[index] = {
    ...target,
    stock: newStock,
    accounts: updatedAccounts
  };

  saveAndBroadcastProducts(products, 'PURCHASE_STOCK_DEDUCTED', {
    productId: target.id,
    productName: target.name,
    deductedQty: cleanQty,
    oldStock,
    newStock
  });

  return {
    success: true,
    product: products[index],
    deductedQty: cleanQty,
    oldStock,
    newStock
  };
}

// Listener untuk subscribe perubahan stok realtime (untuk Admin dan Storefront)
export function subscribeToProductChanges(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleCustom = (e) => {
    callback(e.detail?.products || getDatabaseProducts(), e.detail);
  };

  const handleStorage = (e) => {
    if (e.key === DB_STORAGE_KEY) {
      callback(getDatabaseProducts(), { reason: 'STORAGE_EVENT' });
    }
  };

  window.addEventListener('chaiz_stock_updated', handleCustom);
  window.addEventListener('storage', handleStorage);

  let bc = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
      bc.onmessage = (msg) => {
        if (msg.data?.type === 'PRODUCTS_UPDATED') {
          callback(msg.data.products || getDatabaseProducts(), msg.data);
        }
      };
    } catch {
      // Ignore broadcast channel errors
    }
  }

  return () => {
    window.removeEventListener('chaiz_stock_updated', handleCustom);
    window.removeEventListener('storage', handleStorage);
    if (bc) {
      bc.close();
    }
  };
}
