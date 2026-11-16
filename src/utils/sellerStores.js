// ===================================================================
// CHAIZSTORE - ITEMKU SELLER & MARKETPLACE ENGINE
// Menangani pembukaan toko pengguna, pengelolaan dagangan, dan sinkronisasi
// ===================================================================

import {
  writeToFirebase,
  readFromFirebase,
  updateInFirebase,
  listenToFirebase
} from './firebase';

const STORES_STORAGE_KEY = 'chaiz_user_stores';
const PRODUCTS_STORAGE_KEY = 'chaiz_seller_products';
const SYNC_CHANNEL_NAME = 'chaiz_seller_sync';

// BroadcastChannel for instant cross-tab & cross-device updates
let syncChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  }
} catch (e) {
  // BroadcastChannel not available
}

// -------------------------------------------------------------
// LOCAL STORAGE HELPERS
// -------------------------------------------------------------
export function getAllStoresLocal() {
  try {
    const raw = localStorage.getItem(STORES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveAllStoresLocal(storesMap) {
  try {
    localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(storesMap));
  } catch (e) {
    console.warn('Failed to save user stores locally:', e);
  }
}

export function getAllSellerProductsLocal() {
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAllSellerProductsLocal(productsList) {
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(productsList));
  } catch (e) {
    console.warn('Failed to save seller products locally:', e);
  }
}

// -------------------------------------------------------------
// USER STORE MANAGEMENT
// -------------------------------------------------------------

/**
 * Ambil data toko milik user tertentu berdasarkan userId atau email
 */
export function getUserStore(userId, userEmail = null) {
  if (!userId && !userEmail) return null;
  const stores = getAllStoresLocal();

  // Cari berdasarkan key userId
  if (userId && stores[userId]) {
    return stores[userId];
  }

  // Fallback cari berdasarkan email pemilik
  if (userEmail) {
    const cleanEmail = userEmail.toLowerCase().trim();
    for (const id in stores) {
      if (stores[id]?.ownerEmail?.toLowerCase()?.trim() === cleanEmail) {
        return stores[id];
      }
    }
  }

  return null;
}

/**
 * Daftarkan / Buka Toko Baru untuk User (Ala Itemku "Mulai Jualan")
 */
export async function registerUserStore(userId, {
  storeName,
  slogan = '',
  phone = '',
  ownerName = '',
  ownerEmail = '',
  avatar = ''
}) {
  if (!userId) throw new Error('User ID wajib ada untuk membuka toko');
  const cleanStoreName = (storeName || '').trim();
  if (!cleanStoreName) throw new Error('Nama toko tidak boleh kosong');

  const slug = cleanStoreName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const newStore = {
    id: userId,
    storeName: cleanStoreName,
    slug,
    slogan: (slogan || 'Pusat Akun & Layanan Digital Terpercaya').trim(),
    phone: (phone || '').trim(),
    ownerName,
    ownerEmail,
    avatar: avatar || '',
    isVerified: true, // Auto verified seller badge
    level: 'Super Seller',
    rating: 5.0,
    totalReviews: 12,
    totalSales: 0,
    status: 'open', // 'open' | 'closed'
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Simpan ke Local Storage
  const stores = getAllStoresLocal();
  stores[userId] = newStore;
  saveAllStoresLocal(stores);

  // Broadcast ke tab lain
  syncChannel?.postMessage({
    type: 'STORE_UPDATED',
    store: newStore,
    userId
  });

  // Simpan ke Firebase Realtime Database
  try {
    await writeToFirebase(`user_stores/${userId}`, newStore);
  } catch (err) {
    console.warn('Failed to sync store to Firebase:', err);
  }

  return newStore;
}

/**
 * Perbarui informasi toko yang sudah ada
 */
export async function updateUserStore(userId, partialData) {
  if (!userId) return null;
  const stores = getAllStoresLocal();
  const existing = stores[userId] || {};

  const updated = {
    ...existing,
    ...partialData,
    updatedAt: new Date().toISOString()
  };

  stores[userId] = updated;
  saveAllStoresLocal(stores);

  syncChannel?.postMessage({
    type: 'STORE_UPDATED',
    store: updated,
    userId
  });

  try {
    await updateInFirebase(`user_stores/${userId}`, partialData);
  } catch (err) {
    console.warn('Failed to update store in Firebase:', err);
  }

  return updated;
}

// -------------------------------------------------------------
// SELLER PRODUCTS / DAGANGAN MANAGEMENT
// -------------------------------------------------------------

/**
 * Ambil seluruh dagangan milik seller tertentu
 */
export function getSellerProducts(userId) {
  if (!userId) return [];
  const allProds = getAllSellerProductsLocal();
  return allProds.filter((p) => p.sellerId === userId);
}

/**
 * Ambil seluruh dagangan aktif dari semua penjual untuk ditampilkan di pasar
 */
export function getAllActiveMarketplaceProducts() {
  const allProds = getAllSellerProductsLocal();
  return allProds.filter((p) => p.status === 'active' && (p.stock > 0 || p.stock === undefined));
}

/**
 * Tambah Dagangan Baru Milik Seller (Itemku Style)
 */
export async function addSellerProduct(userId, {
  storeName,
  ownerName,
  ownerEmail,
  name,
  category = 'game',
  categoryLabel = 'Akun Game',
  price = 10000,
  stock = 1,
  description = '',
  credentials = {
    accountUser: '',
    accountPass: '',
    accountNote: ''
  },
  badge = 'Garansi Aman',
  imageUrl = ''
}) {
  if (!userId) throw new Error('Seller ID wajib ada');
  const cleanName = (name || '').trim();
  if (!cleanName) throw new Error('Nama dagangan tidak boleh kosong');

  const productId = `dagangan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newProduct = {
    id: productId,
    sellerId: userId,
    sellerStoreName: storeName || 'Toko Chaiz',
    sellerName: ownerName || 'Penjual',
    sellerEmail: ownerEmail || '',
    name: cleanName,
    category: category || 'game',
    categoryLabel: categoryLabel || 'Akun Game',
    price: Number(price) || 0,
    originalPrice: Math.round((Number(price) || 0) * 1.25),
    stock: Number(stock) || 1,
    description: (description || 'Akun legal siap pakai langsung bergaransi').trim(),
    credentials: {
      accountUser: credentials?.accountUser || '',
      accountPass: credentials?.accountPass || '',
      accountNote: credentials?.accountNote || ''
    },
    badge: badge || 'Garansi Toko',
    imageUrl: imageUrl || '',
    status: 'active', // 'active' | 'inactive' | 'sold_out'
    createdAt: new Date().toISOString(),
    salesCount: 0
  };

  const allProds = getAllSellerProductsLocal();
  allProds.unshift(newProduct);
  saveAllSellerProductsLocal(allProds);

  // Broadcast ke tab lain
  syncChannel?.postMessage({
    type: 'PRODUCT_ADDED',
    product: newProduct
  });

  // Simpan ke Firebase Realtime Database
  try {
    await writeToFirebase(`seller_products/${productId}`, newProduct);
  } catch (err) {
    console.warn('Failed to sync new product to Firebase:', err);
  }

  return newProduct;
}

/**
 * Update Dagangan yang Sudah Ada
 */
export async function updateSellerProduct(productId, partialData) {
  if (!productId) return null;
  const allProds = getAllSellerProductsLocal();
  const index = allProds.findIndex((p) => p.id === productId);
  if (index === -1) return null;

  allProds[index] = {
    ...allProds[index],
    ...partialData,
    updatedAt: new Date().toISOString()
  };

  saveAllSellerProductsLocal(allProds);

  syncChannel?.postMessage({
    type: 'PRODUCT_UPDATED',
    product: allProds[index]
  });

  try {
    await updateInFirebase(`seller_products/${productId}`, partialData);
  } catch (err) {
    console.warn('Failed to update product in Firebase:', err);
  }

  return allProds[index];
}

/**
 * Hapus Dagangan
 */
export async function deleteSellerProduct(productId) {
  if (!productId) return false;
  let allProds = getAllSellerProductsLocal();
  allProds = allProds.filter((p) => p.id !== productId);
  saveAllSellerProductsLocal(allProds);

  syncChannel?.postMessage({
    type: 'PRODUCT_DELETED',
    productId
  });

  try {
    await writeToFirebase(`seller_products/${productId}`, null);
  } catch (err) {
    console.warn('Failed to delete product from Firebase:', err);
  }

  return true;
}

/**
 * Toggle Status Aktif / Nonaktif Dagangan
 */
export async function toggleSellerProductStatus(productId) {
  const allProds = getAllSellerProductsLocal();
  const prod = allProds.find((p) => p.id === productId);
  if (!prod) return null;

  const nextStatus = prod.status === 'active' ? 'inactive' : 'active';
  return await updateSellerProduct(productId, { status: nextStatus });
}

// -------------------------------------------------------------
// CLOUD SYNC & REALTIME LISTENER
// -------------------------------------------------------------

/**
 * Sinkronisasi data Toko dan Produk Penjual dari Firebase Realtime Database
 */
export async function syncSellerStoresFromCloud() {
  try {
    // 1. Ambil Stores
    const cloudStoresRes = await readFromFirebase('user_stores');
    if (cloudStoresRes.success && cloudStoresRes.data && typeof cloudStoresRes.data === 'object') {
      const localStores = getAllStoresLocal();
      const mergedStores = { ...localStores, ...cloudStoresRes.data };
      saveAllStoresLocal(mergedStores);
    }

    // 2. Ambil Seller Products
    const cloudProdsRes = await readFromFirebase('seller_products');
    if (cloudProdsRes.success && cloudProdsRes.data && typeof cloudProdsRes.data === 'object') {
      const list = Object.values(cloudProdsRes.data).filter(Boolean);
      if (list.length > 0) {
        saveAllSellerProductsLocal(list);
      }
    }
  } catch (e) {
    console.warn('Failed to sync seller stores from cloud:', e);
  }
}

/**
 * Listener Realtime untuk Perubahan Toko & Dagangan
 */
export function listenToSellerUpdates(callback) {
  const listeners = [];

  // BroadcastChannel listener
  if (syncChannel) {
    const handleMessage = (event) => {
      if (event.data?.type && callback) {
        callback(event.data);
      }
    };
    syncChannel.addEventListener('message', handleMessage);
    listeners.push(() => syncChannel?.removeEventListener('message', handleMessage));
  }

  // Storage listener for cross-tab fallback
  const handleStorage = (e) => {
    if (e.key === STORES_STORAGE_KEY || e.key === PRODUCTS_STORAGE_KEY) {
      callback?.({ type: 'STORAGE_CHANGE', key: e.key });
    }
  };
  window.addEventListener('storage', handleStorage);
  listeners.push(() => window.removeEventListener('storage', handleStorage));

  // Firebase Realtime SSE listener for user_stores
  try {
    const unsubStores = listenToFirebase('user_stores', (data) => {
      if (data && typeof data === 'object') {
        const local = getAllStoresLocal();
        saveAllStoresLocal({ ...local, ...data });
        callback?.({ type: 'FIREBASE_STORE_SYNC' });
      }
    });
    if (typeof unsubStores === 'function') listeners.push(unsubStores);
  } catch (e) {}

  // Firebase Realtime SSE listener for seller_products
  try {
    const unsubProds = listenToFirebase('seller_products', (data) => {
      if (data && typeof data === 'object') {
        const list = Object.values(data).filter(Boolean);
        saveAllSellerProductsLocal(list);
        callback?.({ type: 'FIREBASE_PRODUCTS_SYNC' });
      }
    });
    if (typeof unsubProds === 'function') listeners.push(unsubProds);
  } catch (e) {}

  return () => {
    listeners.forEach((unsub) => unsub && unsub());
  };
}
