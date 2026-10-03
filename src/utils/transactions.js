// ===================================================================
// CHAIZSTORE TRANSACTIONS & REVIEWS ENGINE
// Realtime sync via localStorage & BroadcastChannel
// ===================================================================

const STORAGE_KEY_TRX = 'chaiz_transactions';
const STORAGE_KEY_REVIEWS = 'chaiz_customer_reviews';
const CHANNEL_NAME = 'chaiz_admin_sync';

// Default Demo Transactions jika baru pertama kali dibuka
const INITIAL_TRANSACTIONS = [
  {
    id: 'TRX-20261003-CANVA1',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 jam lalu
    customerName: 'Siti Rahmawati',
    customerEmail: 'siti.rahma@gmail.com',
    customerPhone: '081234567890',
    productName: 'Canva Pro',
    productDuration: '1 Tahun',
    productCategory: 'Produktivitas',
    price: 25000,
    qty: 1,
    total: 25000,
    paymentMethod: 'QRIS Instant',
    proofUrl: null,
    warrantyPeriod: 'Garansi 1 Tahun Penuh (365 Hari)',
    status: 'completed', // 'processing' | 'completed'
    credentials: {
      account: 'siti.canva.pro@gmail.com',
      password: 'CanvaUser2026!',
      username: 'SitiDesignPro',
      pin: '',
      profile: 'Team Member 1',
      code: 'INV-CANVA-TEAM-8921'
    },
    adminNote: 'Akun Canva Pro 1 Tahun sudah aktif full garansi. Silakan login di canva.com dengan akun di atas. Selamat berkarya kak!',
    processedAt: new Date(Date.now() - 3600000 * 1.8).toISOString(),
    rating: {
      stars: 5,
      comment: 'Cepat banget pelayanannya, akun Canva Pro langsung bisa dipakai buat kerjaan freelance!',
      ratedAt: new Date(Date.now() - 3600000 * 1.5).toISOString()
    },
    isRead: true
  },
  {
    id: 'TRX-20261003-NETFLIX2',
    createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 menit lalu
    customerName: 'Dimas Pratama',
    customerEmail: 'dimas.pratama@gmail.com',
    customerPhone: '085712349988',
    productName: 'Netflix Premium 4K UHD',
    productDuration: '1 Bulan',
    productCategory: 'Streaming',
    price: 35000,
    qty: 1,
    total: 35000,
    paymentMethod: 'QRIS Instant',
    proofUrl: '/Qris.png', // Demo bukti transfer
    proofFileName: 'bukti_transfer_dimas.png',
    proofSize: '142 KB',
    proofUploadedAt: new Date(Date.now() - 1800000).toISOString(),
    proofExpiresAt: new Date(Date.now() - 1800000 + 48 * 3600 * 1000).toISOString(),
    proofExpired: false,
    proofDeletedReason: null,
    warrantyPeriod: 'Garansi 30 Hari Aktif',
    status: 'processing', // Sedang diproses
    credentials: {
      account: '',
      password: '',
      username: '',
      pin: '',
      profile: '',
      code: ''
    },
    adminNote: '',
    processedAt: null,
    rating: null,
    isRead: false
  }
];

// Masa simpan bukti transfer: 2 Hari (48 Jam) dalam milidetik
export const PROOF_MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000;

// Helper Broadcast Channel
function broadcastSync(type, data) {
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(CHANNEL_NAME);
      bc.postMessage({ type, data, timestamp: Date.now() });
      bc.close();
    }
  } catch (e) {
    // fallback
  }
}

// Helper: Hapus otomatis foto bukti yang sudah lewat dari 2 hari (48 jam)
function purgeExpiredProofs(list) {
  if (!Array.isArray(list)) return [];
  const now = Date.now();
  let hasExpired = false;

  const sanitized = list.map((trx) => {
    if (trx.proofUrl) {
      const uploadedTime = new Date(trx.proofUploadedAt || trx.createdAt).getTime();
      if (now - uploadedTime > PROOF_MAX_AGE_MS) {
        hasExpired = true;
        return {
          ...trx,
          proofUrl: null,
          proofExpired: true,
          proofDeletedReason: 'Foto bukti terhapus otomatis (masa simpan 2 hari telah berakhir)'
        };
      }
    }
    return trx;
  });

  if (hasExpired) {
    try {
      localStorage.setItem(STORAGE_KEY_TRX, JSON.stringify(sanitized));
      broadcastSync('TRANSACTIONS_UPDATED', sanitized);
    } catch (e) {}
  }

  return sanitized;
}

// 1. Ambil Semua Transaksi (dengan auto-purge bukti kedaluwarsa 2 hari)
export function getTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRX);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEY_TRX, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    const parsed = JSON.parse(raw);
    const validList = Array.isArray(parsed) ? parsed : [];
    return purgeExpiredProofs(validList);
  } catch (e) {
    return [];
  }
}

// 2. Simpan Transaksi
export function saveTransactions(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY_TRX, JSON.stringify(transactions));
    broadcastSync('TRANSACTIONS_UPDATED', transactions);
  } catch (e) {}
}

// 3. Buat Transaksi Baru (Dari Checkout Akun Premium / Steam Key)
export function createTransaction({
  productName,
  productDuration = 'Reguler',
  productCategory = 'Akun Premium',
  price = 0,
  qty = 1,
  total = 0,
  customerUsername = '',
  customerName = 'Pelanggan Chaiz',
  customerEmail = '-',
  customerPhone = '-',
  paymentMethod = 'QRIS Instant',
  proofUrl = null,
  proofFileName = null,
  proofSize = null,
  warrantyPeriod = 'Garansi Penuh'
}) {
  const transactions = getTransactions();
  const idSuffix = Math.floor(1000 + Math.random() * 9000);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const newId = `TRX-${dateStr}-${idSuffix}`;

  const hasProof = !!proofUrl;
  const proofExpires = hasProof ? new Date(now.getTime() + PROOF_MAX_AGE_MS).toISOString() : null;

  const newTrx = {
    id: newId,
    createdAt: now.toISOString(),
    customerUsername: customerUsername || '',
    customerName,
    customerEmail,
    customerPhone,
    productName,
    productDuration,
    productCategory,
    price,
    qty,
    total: total || price * qty,
    paymentMethod,
    proofUrl: proofUrl || null,
    proofFileName: proofFileName || (hasProof ? 'Bukti_Pembayaran.png' : null),
    proofSize: proofSize || null,
    proofUploadedAt: hasProof ? now.toISOString() : null,
    proofExpiresAt: proofExpires,
    proofExpired: false,
    proofDeletedReason: null,
    warrantyPeriod,
    status: 'processing', // Awal: Sedang diproses admin
    credentials: {
      account: '',
      password: '',
      username: '',
      pin: '',
      profile: '',
      code: ''
    },
    adminNote: '',
    processedAt: null,
    rating: null,
    isRead: false
  };

  const updated = [newTrx, ...transactions];
  saveTransactions(updated);
  broadcastSync('NEW_TRANSACTION', newTrx);
  return newTrx;
}

// Helper: Hapus Bukti Transfer Langsung oleh Admin
export function deleteTransactionProof(id, deletedBy = 'Admin') {
  const transactions = getTransactions();
  let targetTrx = null;

  const updated = transactions.map((trx) => {
    if (trx.id === id) {
      targetTrx = {
        ...trx,
        proofUrl: null,
        proofExpired: true,
        proofDeletedReason: `Foto bukti dihapus langsung oleh ${deletedBy}`
      };
      return targetTrx;
    }
    return trx;
  });

  saveTransactions(updated);
  return targetTrx;
}

// Helper: Bersihkan Seluruh Riwayat Pesanan & Foto Kiriman Bukti Transfer oleh Admin
export function clearAllTransactions() {
  saveTransactions([]);
  broadcastSync('TRANSACTIONS_UPDATED', []);
  return [];
}

// Helper: Hitung Sisa Waktu Masa Aktif Foto Bukti (Maks 2 Hari / 48 Jam)
export function getProofTimeRemaining(trx) {
  if (!trx) return { isExpired: true, text: 'Tidak ada bukti', hoursLeft: 0 };
  if (!trx.proofUrl) {
    return {
      isExpired: true,
      text: trx.proofDeletedReason || 'Foto bukti tidak tersedia',
      hoursLeft: 0
    };
  }

  const uploadedTime = new Date(trx.proofUploadedAt || trx.createdAt).getTime();
  const expiresTime = uploadedTime + PROOF_MAX_AGE_MS;
  const diffMs = expiresTime - Date.now();

  if (diffMs <= 0) {
    return { isExpired: true, text: 'Kedaluwarsa (2 Hari)', hoursLeft: 0 };
  }

  const hours = Math.floor(diffMs / (3600 * 1000));
  const minutes = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return {
      isExpired: false,
      text: `Sisa ${days} hari ${remainingHours} jam`,
      hoursLeft: hours,
      minutesLeft: minutes
    };
  }

  return {
    isExpired: false,
    text: `Sisa ${hours} jam ${minutes} menit`,
    hoursLeft: hours,
    minutesLeft: minutes
  };
}

// 4. Update Status Pesanan oleh Admin (Kirim Akun & Catatan Khusus)
export function fulfillTransaction(id, credentials, adminNote) {
  const transactions = getTransactions();
  let updatedTrx = null;

  const updated = transactions.map((trx) => {
    if (trx.id === id) {
      updatedTrx = {
        ...trx,
        status: 'completed',
        credentials: {
          account: credentials.account || '',
          password: credentials.password || '',
          username: credentials.username || '',
          pin: credentials.pin || '',
          profile: credentials.profile || '',
          code: credentials.code || ''
        },
        adminNote: adminNote || 'Pesanan Anda telah berhasil diproses oleh Admin ChaizStore. Selamat menikmati layanan kami!',
        processedAt: new Date().toISOString(),
        isRead: false // Supaya ada notifikasi ke pelanggan
      };
      return updatedTrx;
    }
    return trx;
  });

  saveTransactions(updated);
  broadcastSync('TRANSACTION_FULFILLED', updatedTrx);
  return updatedTrx;
}

// 5. Beri Rating & Ulasan oleh Pelanggan (1 - 5 Bintang + Catatan)
export function rateTransaction(id, stars, comment) {
  const transactions = getTransactions();
  let ratedTrx = null;

  const updated = transactions.map((trx) => {
    if (trx.id === id) {
      ratedTrx = {
        ...trx,
        rating: {
          stars: Math.max(1, Math.min(5, Number(stars) || 5)),
          comment: comment || 'Pelayanan sangat memuaskan!',
          ratedAt: new Date().toISOString()
        }
      };
      return ratedTrx;
    }
    return trx;
  });

  saveTransactions(updated);

  // Otomatis tambahkan ke Testimoni / Ulasan Publik di website!
  if (ratedTrx) {
    addCustomerReview({
      id: `REV-${Date.now()}`,
      name: ratedTrx.customerName || 'Pelanggan Setia',
      role: `Pembeli ${ratedTrx.productName}`,
      stars: ratedTrx.rating.stars,
      text: ratedTrx.rating.comment,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    });
  }

  broadcastSync('TRANSACTION_RATED', ratedTrx);
  return ratedTrx;
}

// 6. Tandai Notifikasi Transaksi Sudah Dibaca
export function markTransactionsAsRead() {
  const transactions = getTransactions();
  const updated = transactions.map((t) => ({ ...t, isRead: true }));
  saveTransactions(updated);
}

// 7. Ambil Hitungan Notifikasi Transaksi Aktif
export function getActiveNotificationCount() {
  const transactions = getTransactions();
  // Notifikasi muncul jika ada pesanan baru diproses atau pesanan baru selesai yang belum dibuka (isRead: false)
  return transactions.filter((t) => !t.isRead).length;
}

// ===================================================================
// PUBLIC CUSTOMER REVIEWS (TESTIMONI PUBLIK)
// ===================================================================
const INITIAL_REVIEWS = [
  {
    id: 'REV-1',
    name: 'Dimas Pratama',
    role: 'Pelanggan Netflix & Spotify',
    stars: 5,
    text: 'Gokil cepet banget pelayanannya! Transfer QRIS, 2 menit kemudian akun Netflix udah dikirim dan langsung bisa nonton 4K bareng keluarga. Garansinya beneran aman.',
    date: '3 Okt 2026'
  },
  {
    id: 'REV-2',
    name: 'Siti Rahmawati',
    role: 'Freelance Designer - Canva Pro',
    stars: 5,
    text: 'Langganan Canva Pro di sini hemat banyak buat tugas kuliah dan desain freelance. Udah 6 bulan lancar jaya no kendala. Pasti bakal repurchase terus di sini.',
    date: '3 Okt 2026'
  },
  {
    id: 'REV-3',
    name: 'Fajar Kurniawan',
    role: 'Software Engineer - Gemini AI',
    stars: 5,
    text: 'Gemini Advanced AI nya mantap banget, kencang buat bantu kerjaan koding dan riset. Adminnya juga ramah ditanya-tanya malam-malam tetep dibales gercep. Recommended seller JB akun!',
    date: '2 Okt 2026'
  }
];

export function getCustomerReviews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REVIEWS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(INITIAL_REVIEWS));
      return INITIAL_REVIEWS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_REVIEWS;
  } catch (e) {
    return INITIAL_REVIEWS;
  }
}

export function addCustomerReview(review) {
  try {
    const reviews = getCustomerReviews();
    const updated = [review, ...reviews];
    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(updated));
    broadcastSync('NEW_CUSTOMER_REVIEW', review);
    return updated;
  } catch (e) {
    return [];
  }
}
