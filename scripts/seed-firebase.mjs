// Seed initial data to Firebase Realtime Database
import { PRODUCTS } from '../src/data/products.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let dbMethods = null;
try {
  dbMethods = require('../server/db.js');
} catch (e) {
  console.warn('SQLite db.js could not be loaded directly:', e.message);
}

const FIREBASE_DB_URL = 'https://chaizstore-default-rtdb.asia-southeast1.firebasedatabase.app';

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

async function uploadNode(path, data) {
  try {
    const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (res.ok) {
      console.log(`✅ [${path}] Berhasil disinkronkan ke Firebase (${Array.isArray(data) ? data.length : Object.keys(data || {}).length} item)`);
      return true;
    } else {
      console.error(`❌ [${path}] Gagal (${res.status}):`, result);
      return false;
    }
  } catch (err) {
    console.error(`❌ [${path}] Error:`, err.message);
    return false;
  }
}

async function seed() {
  console.log('====================================================');
  console.log('🚀 SINKRONISASI DATA KE FIREBASE CLOUD (24 JAM NON-STOP)');
  console.log('Target:', FIREBASE_DB_URL);
  console.log('====================================================\n');

  // 1. Gudang Produk & Restock Akun (15 Produk)
  await uploadNode('products', initialProducts);

  // 2. Testimoni Pelanggan
  await uploadNode('customer_reviews', INITIAL_REVIEWS);

  // 3. Ambil data lokal dari SQLite jika ada
  if (dbMethods) {
    // 3A. Transaksi / Pesanan Masuk
    const trxList = dbMethods.getAllTransactions ? dbMethods.getAllTransactions() : [];
    if (trxList.length > 0) {
      const trxObj = {};
      trxList.forEach((t) => {
        if (t && t.id) trxObj[t.id] = t;
      });
      await uploadNode('transactions', trxObj);
    }

    // 3B. Jumlah & Daftar Pengguna (11 Users)
    const userList = dbMethods.getAllUsers ? dbMethods.getAllUsers() : [];
    if (userList.length > 0) {
      const userObj = {};
      userList.forEach((u) => {
        if (u && (u.id || u.userId)) userObj[u.id || u.userId] = u;
      });
      await uploadNode('registered_users', userObj);
    }

    // 3C. Kunjungan Permanen
    const visitList = dbMethods.getAllVisits ? dbMethods.getAllVisits() : [];
    if (visitList.length > 0) {
      const visitObj = {};
      visitList.forEach((v) => {
        if (v && (v.id || v.userId)) visitObj[v.id || v.userId] = v;
      });
      await uploadNode('permanent_visits', visitObj);
    }

    // 3D. Aktivitas Kronologis Realtime (194 Aktivitas)
    const actList = dbMethods.getAllActivities ? dbMethods.getAllActivities() : [];
    if (actList.length > 0) {
      const actObj = {};
      actList.forEach((a) => {
        if (a && a.id) actObj[a.id] = a;
      });
      await uploadNode('activity_logs', actObj);
    }

    // 3E. Deposit ChaizMoney
    const depList = dbMethods.getAllDeposits ? dbMethods.getAllDeposits() : [];
    if (depList.length > 0) {
      const depObj = {};
      depList.forEach((d) => {
        if (d && d.id) depObj[d.id] = d;
      });
      await uploadNode('deposits', depObj);
    }
  }

  console.log('\n====================================================');
  console.log('Selesai! Jika muncul error "Permission denied", harap');
  console.log('ubah Rules di Firebase Console menjadi:');
  console.log('{\n  "rules": {\n    ".read": true,\n    ".write": true\n  }\n}');
  console.log('====================================================');
}

seed().catch(console.error);
