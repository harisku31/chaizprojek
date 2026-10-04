// Seed initial data to Firebase Realtime Database
import { PRODUCTS } from '../src/data/products.js';

const FIREBASE_DB_URL = 'https://chaizstore-default-rtdb.asia-southeast1.firebasedatabase.app';

const INITIAL_TRANSACTIONS = {
  'TRX-20261003-CANVA1': {
    id: 'TRX-20261003-CANVA1',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
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
    status: 'completed',
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
  'TRX-20261003-NETFLIX2': {
    id: 'TRX-20261003-NETFLIX2',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
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
    proofUrl: '/Qris.png',
    proofFileName: 'bukti_transfer_dimas.png',
    proofSize: '142 KB',
    proofUploadedAt: new Date(Date.now() - 1800000).toISOString(),
    proofExpiresAt: new Date(Date.now() - 1800000 + 48 * 3600 * 1000).toISOString(),
    proofExpired: false,
    proofDeletedReason: null,
    warrantyPeriod: 'Garansi 30 Hari Aktif',
    status: 'processing',
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
};

const INITIAL_REVIEWS = {
  'REV-1': {
    id: 'REV-1',
    name: 'Dimas Pratama',
    role: 'Pelanggan Netflix & Spotify',
    stars: 5,
    text: 'Gokil cepet banget pelayanannya! Transfer QRIS, 2 menit kemudian akun Netflix udah dikirim dan langsung bisa nonton 4K bareng keluarga. Garansinya beneran aman.',
    date: '3 Okt 2026'
  },
  'REV-2': {
    id: 'REV-2',
    name: 'Siti Rahmawati',
    role: 'Freelance Designer - Canva Pro',
    stars: 5,
    text: 'Langganan Canva Pro di sini hemat banyak buat tugas kuliah dan desain freelance. Udah 6 bulan lancar jaya no kendala. Pasti bakal repurchase terus di sini.',
    date: '3 Okt 2026'
  },
  'REV-3': {
    id: 'REV-3',
    name: 'Fajar Kurniawan',
    role: 'Software Engineer - Gemini AI',
    stars: 5,
    text: 'Gemini Advanced AI nya mantap banget, kencang buat bantu kerjaan koding dan riset. Adminnya juga ramah ditanya-tanya malam-malam tetep dibales gercep. Recommended seller JB akun!',
    date: '2 Okt 2026'
  }
};

const initialProducts = PRODUCTS.map((p) => {
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

async function seed() {
  console.log('Seeding initial data to Firebase Realtime Database...');

  // 1. Transactions
  const trxRes = await fetch(`${FIREBASE_DB_URL}/transactions.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(INITIAL_TRANSACTIONS)
  });
  console.log('Transactions seeded:', trxRes.status, await trxRes.json());

  // 2. Reviews
  const revRes = await fetch(`${FIREBASE_DB_URL}/customer_reviews.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(INITIAL_REVIEWS)
  });
  console.log('Reviews seeded:', revRes.status, await revRes.json());

  // 3. Products
  const prodRes = await fetch(`${FIREBASE_DB_URL}/products.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(initialProducts)
  });
  console.log('Products seeded:', prodRes.status);

  console.log('All initial data successfully seeded to Firebase!');
}

seed().catch(console.error);
