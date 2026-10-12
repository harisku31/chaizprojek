// Seed initial data to Firebase Realtime Database
import { PRODUCTS } from '../src/data/products.js';

const FIREBASE_DB_URL = 'https://chaizstore-default-rtdb.asia-southeast1.firebasedatabase.app';

const INITIAL_TRANSACTIONS = {};

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
