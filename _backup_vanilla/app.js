/**
 * ===================================================
 * CHAIZSTORE - JUAL BELI AKUN PREMIUM
 * JavaScript Application Logic + Google / Gmail Auth
 * ===================================================
 */

// Konfigurasi Toko & Admin
const CONFIG = {
  storeName: "ChaizStore",
  adminWhatsApp: "6287795172347", // 087795172347
  currency: "Rp"
};

// Format Rupiah Helper
function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
}

// ===================================================
// DATA PRODUK AKUN PREMIUM (DENGAN 3 PAKET DURASI & PILIHAN VIA)
// ===================================================
const PRODUCTS = [
  {
    id: "canva-pro",
    name: "Canva Pro Desain & AI",
    category: "produktivitas",
    icon: "fa-solid fa-palette",
    iconColor: "#06b6d4",
    image: "canva.png",
    stock: 5,
    warranty: "1 Bulan",
    badge: "Desain Pro",
    badgeClass: "badge-bestseller",
    isFlashSale: false,
    oldPrice: 10000,
    currentPrice: 3000,
    features: [
      "Durasi: 1 Bulan Penuh",
      "Garansi: 1 Bulan Penggantian",
      "Akses 100 Juta+ Foto, Font & Template Pro",
      "Magic Studio AI & Brand Kit",
      "Bisa Desain di HP, Tablet & Laptop / PC"
    ],
    durations: [
      { id: "1m", name: "1 Bulan", price: 3000, warranty: "1 Bulan", tag: "Hemat" }
    ]
  },
  {
    id: "youtube-prem",
    name: "YouTube Premium & Music",
    category: "streaming",
    icon: "fa-brands fa-youtube",
    iconColor: "#ef4444",
    image: "youtube.png",
    stock: 5,
    warranty: "1 Bulan",
    badge: "Terlaris",
    badgeClass: "badge-bestseller",
    isFlashSale: false,
    oldPrice: 15000,
    currentPrice: 5000,
    features: [
      "Durasi: 1 Bulan Penuh",
      "Garansi: 1 Bulan Penggantian",
      "Bebas Iklan di Semua Video & Musik",
      "Background Play & Download Offline",
      "Bisa di Akun Pribadi Kamu Sendiri"
    ],
    durations: [
      { id: "1m", name: "1 Bulan", price: 5000, warranty: "1 Bulan", tag: "Populer" }
    ]
  },
  {
    id: "capcut-pro",
    name: "CapCut Pro Video Editor",
    category: "produktivitas",
    icon: "fa-solid fa-scissors",
    iconColor: "#14b8a6",
    image: "capcut.png",
    stock: 5,
    warranty: "1 Bulan",
    badge: "Editor VIP",
    badgeClass: "badge-bestseller",
    isFlashSale: false,
    oldPrice: 30000,
    currentPrice: 10000,
    features: [
      "Pilihan: 1 Bulan & 1 Bulan Akun Sendiri",
      "Garansi: 1 Bulan Penggantian Penuh",
      "Semua Efek & Transisi VIP Terbuka",
      "Auto Caption ID & Ekspor 4K 60fps",
      "Bebas Watermark & Template VIP Lengkap"
    ],
    durations: [
      { id: "1m", name: "1 Bulan", price: 10000, warranty: "1 Bulan", tag: "Sharing / Standar" },
      { id: "1m-own", name: "1 Bulan (Akun Sendiri)", price: 23000, warranty: "1 Bulan", tag: "Akun Sendiri" }
    ]
  },
  {
    id: "gemini-advanced",
    name: "Gemini Advanced (Google AI)",
    category: "ai",
    icon: "fa-solid fa-wand-magic-sparkles",
    iconColor: "#38bdf8",
    image: "gemini.png",
    stock: 20,
    warranty: "1 Bulan / 1 Tahun / 18 Bulan",
    badge: "AI Canggih",
    badgeClass: "badge-flash",
    isFlashSale: true,
    oldPrice: 75000,
    currentPrice: 12000,
    priceNote: "Pilihan Paket Murah",
    features: [
      "Pilihan: 1 Bulan / 1 Tahun / 18 Bulan",
      "Garansi: 1 Bulan / 1 Tahun / 18 Bulan",
      "Akses Model Gemini 1.5 Pro & Ultra",
      "Penyimpanan Cloud Google One 2TB",
      "Bisa untuk Riset, Dokumen & Koding Cepat"
    ],
    durations: [
      { id: "1m", name: "1 Bulan", price: 12000, warranty: "1 Bulan", tag: "Hemat" },
      { id: "1y", name: "1 Tahun", price: 35000, warranty: "1 Tahun", tag: "Populer" },
      { id: "18m-inv", name: "18 Bulan (Invite)", price: 45000, warranty: "18 Bulan", tag: "Best Deal" },
      { id: "18m-priv", name: "18 Bulan (Privat)", price: 19000, warranty: "18 Bulan", tag: "Promo Spesial" }
    ]
  },
  {
    id: "alight-motion",
    name: "Alight Motion Pro",
    category: "produktivitas",
    icon: "fa-solid fa-play",
    iconColor: "#10b981",
    image: "alightmotion.png",
    stock: 10,
    warranty: "1 Bulan / 1 Tahun",
    badge: "1 Bln & 1 Thn",
    badgeClass: "badge-bestseller",
    isFlashSale: false,
    oldPrice: 15000,
    currentPrice: 3000,
    features: [
      "Pilihan Durasi: 1 Bulan & 1 Tahun",
      "Garansi: Sesuai Durasi Paket",
      "Bebas Watermark & Preset XML Support",
      "Semua Efek, Font & Transisi Terbuka",
      "Ekspor Kualitas Full HD / 4K Lancar"
    ],
    durations: [
      { id: "1m", name: "1 Bulan", price: 3000, warranty: "1 Bulan", tag: "Hemat" },
      { id: "1y", name: "1 Tahun", price: 12000, warranty: "1 Tahun", tag: "Best Deal" }
    ]
  },
  {
    id: "netflix-4k",
    name: "Netflix Premium 4K UHD",
    category: "streaming",
    icon: "fa-solid fa-film",
    iconColor: "#f43f5e",
    image: "netflix.png",
    stock: 10,
    warranty: "1 Bulan",
    badge: "Via Profil",
    badgeClass: "badge-bestseller",
    isFlashSale: true,
    oldPrice: 35000,
    currentPrice: 16000,
    features: [
      "Durasi: 1 Bulan (Via Profil)",
      "Garansi: 1 Bulan Penuh Anti On-Hold",
      "1 User 1 Profil Sendiri (Bisa Pasang PIN)",
      "Kualitas Ultra HD 4K + HDR Resmi",
      "Bisa Nonton di HP, Laptop, Tablet & TV"
    ],
    durations: [
      { id: "1m-profile", name: "1 Bulan (Via Profil)", price: 16000, warranty: "1 Bulan", tag: "1 User 1 Profil" }
    ]
  },
  {
    id: "disney-hotstar",
    name: "Disney+ Hotstar Premium",
    category: "streaming",
    icon: "fa-solid fa-film",
    iconColor: "#38bdf8",
    image: "disney.png",
    stock: 10,
    warranty: "1 Bulan",
    badge: "Streaming 4K",
    badgeClass: "badge-bestseller",
    isFlashSale: true,
    oldPrice: 35000,
    currentPrice: 20000,
    features: [
      "Pilihan: Sharing 10 User & Sharing 6 User",
      "Garansi: 1 Bulan Penuh Penggantian",
      "Kualitas Streaming Ultra HD 4K & Dolby Audio",
      "Film Marvel, Disney, Pixar & Star Wars Lengkap",
      "Bisa Nonton di HP, Tablet, Laptop & Smart TV"
    ],
    durations: [
      { id: "1m-share10", name: "1 Bulan (Sharing 10 User)", price: 20000, warranty: "1 Bulan", tag: "Sharing 10 User" },
      { id: "1m-share6", name: "1 Bulan (Sharing 6 User)", price: 27000, warranty: "1 Bulan", tag: "Sharing 6 User" }
    ]
  },
  {
    id: "vidio-prem",
    name: "Vidio Premier Platinum",
    category: "streaming",
    icon: "fa-solid fa-circle-play",
    iconColor: "#ef4444",
    image: "vidio.png",
    stock: 10,
    warranty: "1 Bulan",
    badge: "Live Sport & Film",
    badgeClass: "badge-guarantee",
    isFlashSale: false,
    oldPrice: 39000,
    currentPrice: 27000,
    features: [
      "Durasi: 1 Bulan Penuh",
      "Garansi: 1 Bulan Penuh Penggantian",
      "Nonton Live Sports, BRI Liga 1, UCL, & Film",
      "Bebas Iklan & Kualitas Jernih Full HD 1080p",
      "Bisa Nonton di HP, Tablet, Laptop & Smart TV"
    ],
    durations: [
      { id: "1m", name: "1 Bulan", price: 27000, warranty: "1 Bulan", tag: "Platinum" }
    ]
  },
  {
    id: "viu-prem",
    name: "VIU Premium",
    category: "streaming",
    icon: "fa-solid fa-video",
    iconColor: "#eab308",
    image: "viu.png",
    stock: 0,
    warranty: "1 Bulan",
    badge: "Stok Kosong",
    badgeClass: "badge-out-stock",
    isFlashSale: false,
    oldPrice: null,
    currentPrice: 0,
    features: [
      "Status: Stok Saat Ini Sedang Kosong",
      "Durasi: 1 Bulan (Saat Restock)",
      "Nonton Drama Korea & Asia Lengkap",
      "Bebas Iklan & Subtitle Indonesia Resmi",
      "Silakan Hubungi CS untuk Jadwal Restock"
    ],
    durations: [
      { id: "1m", name: "1 Bulan", price: 0, warranty: "1 Bulan", tag: "Kosong", outOfStock: true }
    ]
  },
  {
    id: "wibuku-prem",
    name: "Wibuku Premium",
    category: "streaming",
    icon: "fa-solid fa-masks-theater",
    iconColor: "#a855f7",
    image: "wibuku.png",
    stock: 10,
    warranty: "1 Bulan",
    badge: "Anime Fans",
    badgeClass: "badge-bestseller",
    isFlashSale: false,
    oldPrice: 12000,
    currentPrice: 6000,
    features: [
      "Durasi: 1 Bulan Penuh",
      "Garansi: 1 Bulan Penggantian Penuh",
      "Streaming Anime Tanpa Iklan Sepuasnya",
      "Update Episode Terbaru Tiap Hari",
      "Subtitle Indonesia Jernih & Server Cepat"
    ],
    durations: [
      { id: "1m", name: "1 Bulan", price: 6000, warranty: "1 Bulan", tag: "Hemat" }
    ]
  },
  {
    id: "bstation-prem",
    name: "Bstation (Bilibili Premium)",
    category: "streaming",
    icon: "fa-solid fa-tv",
    iconColor: "#0284c7",
    image: "bstation.png",
    stock: 10,
    warranty: "1 Bulan",
    badge: "Anime 4K",
    badgeClass: "badge-bestseller",
    isFlashSale: false,
    oldPrice: 15000,
    currentPrice: 7000,
    features: [
      "Pilihan: 1 Bulan Sharing & 1 Bulan Privat",
      "Garansi: 1 Bulan Penggantian Penuh",
      "Nonton Anime Kualitas 1080p / 4K UHD",
      "Bebas Iklan & Download Video Offline",
      "Bisa Login di HP, Tablet & Smart TV"
    ],
    durations: [
      { id: "1m-sharing", name: "1 Bulan Sharing", price: 7000, warranty: "1 Bulan", tag: "Sharing" },
      { id: "1m-privat", name: "1 Bulan Privat", price: 10000, warranty: "1 Bulan", tag: "Privat" }
    ]
  },
  {
    id: "wink-vip",
    name: "Wink Video Retouch VIP",
    category: "produktivitas",
    icon: "fa-solid fa-camera-retro",
    iconColor: "#ec4899",
    image: "wink.png",
    stock: 10,
    warranty: "7 Hari",
    badge: "iOS & Android",
    badgeClass: "badge-flash",
    isFlashSale: false,
    oldPrice: 15000,
    currentPrice: 5000,
    features: [
      "Tersedia untuk Perangkat Android & iOS",
      "Garansi: 7 Hari Masa Aktif",
      "AI Video Enhancement & 4K Quality Repair",
      "Face & Body Retouch Video Otomatis",
      "Semua Filter, Efek & Fitur VIP Terbuka"
    ],
    durations: [
      { id: "android-7d", name: "Android - 7 Hari", price: 5000, warranty: "7 Hari", tag: "Android" },
      { id: "ios-7d-share", name: "iOS - 7 Hari Sharing", price: 17000, warranty: "7 Hari", tag: "iOS Sharing" },
      { id: "ios-7d-privat", name: "iOS - 7 Hari Privat", price: 27000, warranty: "7 Hari", tag: "iOS Privat" }
    ]
  },
  {
    id: "spotify-prem",
    name: "Spotify Premium Music",
    category: "musik",
    icon: "fa-brands fa-spotify",
    iconColor: "#10b981",
    image: "spotify.png",
    stock: 10,
    warranty: "1 Bulan",
    badge: "Terlaris",
    badgeClass: "badge-guarantee",
    isFlashSale: true,
    oldPrice: 35000,
    currentPrice: 22000,
    features: [
      "Pilihan: 1 Bln Famplan & 1 Bln Indplan",
      "Garansi: 1 Bulan Sesuai Durasi Paket",
      "Bebas Iklan & Download Musik Offline",
      "Kualitas Audio Tertinggi (320kbps)",
      "Bisa di Akun Pribadi Kamu Sendiri"
    ],
    durations: [
      { id: "1m-famplan", name: "1 Bulan Famplan", price: 22000, warranty: "1 Bulan", tag: "Family Plan" },
      { id: "1m-indplan", name: "1 Bulan Indplan", price: 28000, warranty: "1 Bulan", tag: "Individual Plan" }
    ]
  },
  {
    id: "grok-ai",
    name: "Grok AI (xAI Premium)",
    category: "ai",
    icon: "fa-solid fa-lock",
    iconColor: "#f59e0b",
    image: null,
    stock: 0,
    isUnreleased: true,
    warranty: "Belum Dirilis",
    badge: "Segel: Belum Dirilis",
    badgeClass: "badge-sealed",
    isFlashSale: false,
    oldPrice: null,
    currentPrice: 0,
    priceNote: "Segel Belum Dirilis",
    features: [
      "Tanda Segel: Belum Dirilis Resmi",
      "Model AI Generasi Terbaru xAI Elon Musk",
      "Real-time Knowledge Update dari X / Twitter",
      "Mode Fun & Uncensored Jawaban Cerdas",
      "Nantikan Jadwal Perilisan Resmi di ChaizStore"
    ],
    durations: [
      { id: "unreleased", name: "Segel Belum Dirilis", price: 0, warranty: "-", tag: "Segel", outOfStock: true }
    ]
  },
  {
    id: "duolingo-plus",
    name: "Duolingo Super (Plus)",
    category: "produktivitas",
    icon: "fa-solid fa-feather-pointed",
    iconColor: "#58cc02",
    image: "duolingo.png",
    stock: 10,
    warranty: "1 Bulan / 12 Bulan",
    badge: "Edukasi",
    badgeClass: "badge-bestseller",
    isFlashSale: false,
    oldPrice: 25000,
    currentPrice: 10000,
    features: [
      "Pilihan: 1 Bulan & 12 Bulan Link Redeem",
      "Garansi: Sesuai Durasi Paket",
      "Nyawa Tanpa Batas (Unlimited Hearts)",
      "Bebas Gangguan Iklan Selama Belajar Bahasa",
      "Latihan Personalisasi & Review Kesalahan"
    ],
    durations: [
      { id: "1m", name: "1 Bulan Super", price: 10000, warranty: "1 Bulan", tag: "Hemat" },
      { id: "12m-redeem", name: "12 Bulan (Link Redeem)", price: 19000, warranty: "12 Bulan", tag: "Best Deal" }
    ]
  }
];

// ===================================================
// STATE APLIKASI & AUTHENTICATION
// ===================================================
let currentFilter = "all";
let searchQuery = "";
let selectedProduct = null;
let selectedDurationId = "1m";
let selectedViaType = "invite"; // 'invite' atau 'private'
let currentCalculatedPrice = 0;
let cartItems = [];
let currentAuthUser = null;

// Load Cart dari LocalStorage
try {
  const savedCart = localStorage.getItem("chaiz_cart");
  if (savedCart) {
    cartItems = JSON.parse(savedCart);
  }
} catch (e) {
  cartItems = [];
}

// Load Sesi Auth User dari LocalStorage (Agar keluar tab / masuk tab / refresh tetap login)
try {
  const savedUser = localStorage.getItem("chaiz_auth_user");
  if (savedUser) {
    currentAuthUser = JSON.parse(savedUser);
  } else {
    currentAuthUser = null;
  }
} catch (e) {
  currentAuthUser = null;
}

// ===================================================
// INITIALIZATION ON DOM READY
// ===================================================
function initApp() {
  try {
    const saved = localStorage.getItem("chaiz_auth_user");
    if (saved) {
      currentAuthUser = JSON.parse(saved);
    }
  } catch (e) {}

  checkAuthState();
  renderProducts();
  setupEventListeners();
  setupAuthEventListeners();
  updateCartUI();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

// ===================================================
// SISTEM AUTENTIKASI: USER & KHUSUS MEMBER
// ===================================================

// Daftar Akun Khusus Member Terdaftar (Tersimpan di Codingan / Script)
// Hanya akun di bawah ini yang diizinkan masuk. Jika salah, otomatis ditolak!
const MEMBER_CREDENTIALS = [
  { username: "member", password: "123", name: "VIP Member", badge: "VIP Member" },
  { username: "admin", password: "123", name: "Admin Chaiz", badge: "VIP Member" },
  { username: "chaizz", password: "123", name: "Chaizz VIP", badge: "VIP Member" }
];

function checkAuthState() {
  const loginGateOverlay = document.getElementById("loginGateOverlay");
  const loginSelectionView = document.getElementById("loginSelectionView");
  const memberLoginView = document.getElementById("memberLoginView");
  const userProfileChip = document.getElementById("userProfileChip");
  const navUserName = document.getElementById("navUserName");
  const navUserEmail = document.getElementById("navUserEmail");
  const navUserAvatar = document.getElementById("navUserAvatar");
  const navMemberLoginBtn = document.getElementById("navMemberLoginBtn");

  if (currentAuthUser && (currentAuthUser.name || currentAuthUser.email)) {
    // Pengguna SUDAH Login (Chaiz atau Member) -> Buka Akses Web
    if (loginGateOverlay) {
      loginGateOverlay.classList.add("unlocked");
      loginGateOverlay.style.display = "none";
    }
    document.body.classList.remove("auth-locked");

    if (userProfileChip) {
      userProfileChip.classList.remove("hidden");
      if (currentAuthUser.isMember) {
        userProfileChip.classList.add("member-vip-badge");
      } else {
        userProfileChip.classList.remove("member-vip-badge");
      }
    }

    if (navUserName) {
      navUserName.textContent = currentAuthUser.name || "Chaiz";
    }

    if (navUserEmail) {
      if (currentAuthUser.isMember) {
        navUserEmail.innerHTML = '<i class="fa-solid fa-crown text-warning"></i> VIP Member';
      } else {
        navUserEmail.textContent = "Akun Chaiz";
      }
    }

    if (navUserAvatar) {
      const initial = (currentAuthUser.avatarLetter || (currentAuthUser.name ? currentAuthUser.name.charAt(0) : "C")).toUpperCase();
      navUserAvatar.textContent = initial;
    }

    // Sembunyikan tombol login biasa jika user sudah login (profil aktif)
    if (navMemberLoginBtn) {
      navMemberLoginBtn.style.display = "none";
    }
  } else {
    // Pengguna BELUM Login -> Kunci Tampilan dengan Gerbang Login (Selamat Datang)
    if (loginGateOverlay) {
      loginGateOverlay.classList.remove("unlocked");
      loginGateOverlay.style.display = "flex";
    }
    document.body.classList.add("auth-locked");

    if (userProfileChip) {
      userProfileChip.classList.add("hidden");
    }

    if (navMemberLoginBtn) {
      navMemberLoginBtn.style.display = "inline-flex";
      navMemberLoginBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> <span>Login</span>';
    }

    // Pastikan view pilihan login (Selamat Datang) aktif
    if (loginSelectionView) loginSelectionView.classList.remove("hidden");
    if (memberLoginView) memberLoginView.classList.add("hidden");
  }
}

// BUKA MODAL LOGIN UTAMA (TAMPILAN SELAMAT DATANG DENGAN PILIHAN LOGIN CHAIZ & MEMBER KHUSUS)
function openLoginModal() {
  const loginGateOverlay = document.getElementById("loginGateOverlay");
  const loginSelectionView = document.getElementById("loginSelectionView");
  const memberLoginView = document.getElementById("memberLoginView");
  const errorBox = document.getElementById("memberLoginError");

  if (errorBox) errorBox.classList.add("hidden");
  if (memberLoginView) memberLoginView.classList.add("hidden");
  if (loginSelectionView) loginSelectionView.classList.remove("hidden");

  if (loginGateOverlay) {
    loginGateOverlay.classList.remove("unlocked");
    loginGateOverlay.style.display = "flex";
  }
  document.body.classList.add("auth-locked");
}

// BUKA FORM LOGIN KHUSUS MEMBER ATAU MODAL LOGIN
function openMemberLoginModal() {
  openLoginModal();
}

// TUTUP MODAL LOGIN GATE (KEMBALI KE TOKO)
function closeLoginGateModal() {
  const loginGateOverlay = document.getElementById("loginGateOverlay");
  if (loginGateOverlay) {
    loginGateOverlay.classList.add("unlocked");
    loginGateOverlay.style.display = "none";
  }
  document.body.classList.remove("auth-locked");
}

// 1. LOGIN SEBAGAI CHAIZ: Akses cepat langsung masuk ke toko tanpa password
function loginAsChaiz() {
  currentAuthUser = {
    role: "chaiz",
    name: "Chaiz",
    email: "chaiz@chaizstore.id",
    avatarLetter: "C",
    isMember: false,
    loginTime: new Date().toISOString()
  };

  try {
    localStorage.setItem("chaiz_auth_user", JSON.stringify(currentAuthUser));
  } catch (e) {
    console.error("Gagal simpan sesi", e);
  }

  checkAuthState();
  showToast("Selamat datang, Chaiz! Selamat berbelanja di ChaizStore.", "fa-circle-check");
}

function loginAsUser() {
  loginAsChaiz();
}

// 2. TAMPILKAN FORM LOGIN KHUSUS MEMBER
function openMemberLoginForm() {
  const selectionView = document.getElementById("loginSelectionView");
  const memberView = document.getElementById("memberLoginView");
  const errorBox = document.getElementById("memberLoginError");

  if (errorBox) errorBox.classList.add("hidden");
  if (selectionView) selectionView.classList.add("hidden");
  if (memberView) {
    memberView.classList.remove("hidden");
    const userField = document.getElementById("memberUsername");
    if (userField) {
      setTimeout(() => userField.focus(), 150);
    }
  }
}

// 3. KEMBALI KE PILIHAN DUA TOMBOL UTAMA
function backToLoginSelection() {
  const selectionView = document.getElementById("loginSelectionView");
  const memberView = document.getElementById("memberLoginView");
  const errorBox = document.getElementById("memberLoginError");

  if (errorBox) errorBox.classList.add("hidden");
  if (memberView) memberView.classList.add("hidden");
  if (selectionView) selectionView.classList.remove("hidden");
}

// 4. TOGGLE LIHAT / SEMBUNYIKAN PASSWORD MEMBER
function togglePasswordVisibility(inputId = "memberPassword") {
  const input = document.getElementById(inputId);
  const icon = document.getElementById("eyeIcon");
  if (!input) return;

  if (input.type === "password") {
    input.type = "text";
    if (icon) {
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    }
  } else {
    input.type = "password";
    if (icon) {
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  }
}

// 5. PROSES LOGIN KHUSUS MEMBER (VALIDASI KETAT DENGAN SCRIPT CODINGAN)
function handleMemberLogin(event) {
  if (event) event.preventDefault();

  const usernameInput = document.getElementById("memberUsername");
  const passwordInput = document.getElementById("memberPassword");
  const errorBox = document.getElementById("memberLoginError");
  const errorText = document.getElementById("memberLoginErrorText");
  const loginCard = document.querySelector(".login-gate-card");

  const username = usernameInput ? usernameInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value.trim() : "";

  // Reset alert error sebelumnya
  if (errorBox) errorBox.classList.add("hidden");

  if (!username) {
    showToast("Silakan masukkan username member Anda!", "fa-triangle-exclamation");
    if (usernameInput) usernameInput.focus();
    return;
  }

  if (!password) {
    showToast("Silakan masukkan password akun member!", "fa-triangle-exclamation");
    if (passwordInput) passwordInput.focus();
    return;
  }

  // VALIDASI KETAT DENGAN DAFTAR AKUN DI CODINGAN (MEMBER_CREDENTIALS)
  const matchedMember = MEMBER_CREDENTIALS.find(
    acc => acc.username.toLowerCase() === username.toLowerCase() && acc.password === password
  );

  // JIKA SALAH -> TOLAK AKSES!
  if (!matchedMember) {
    if (errorBox) {
      if (errorText) errorText.textContent = "Username atau password salah! Akses member ditolak.";
      errorBox.classList.remove("hidden");
    }

    if (loginCard) {
      loginCard.classList.remove("shake-card");
      void loginCard.offsetWidth; // trigger reflow
      loginCard.classList.add("shake-card");
    }

    showToast("Username atau password salah! Akses ditolak.", "fa-circle-xmark");

    if (passwordInput) {
      passwordInput.value = "";
      passwordInput.focus();
    }
    return;
  }

  // JIKA BENAR -> BERHASIL LOGIN MEMBER
  currentAuthUser = {
    role: "member",
    name: matchedMember.name || username,
    email: `${username.toLowerCase()}@member.vip`,
    avatarLetter: (matchedMember.name || username).charAt(0).toUpperCase(),
    isMember: true,
    badge: matchedMember.badge || "VIP Member",
    loginTime: new Date().toISOString()
  };

  try {
    localStorage.setItem("chaiz_auth_user", JSON.stringify(currentAuthUser));
  } catch (e) {
    console.error("Gagal simpan sesi login member", e);
  }

  const form = document.getElementById("memberLoginForm");
  if (form) form.reset();
  if (errorBox) errorBox.classList.add("hidden");

  checkAuthState();
  showToast(`Selamat datang VIP Member, ${currentAuthUser.name}!`, "fa-crown");
}

// 6. LOGOUT PENGGUNA
function logoutUser() {
  currentAuthUser = null;
  try {
    localStorage.removeItem("chaiz_auth_user");
  } catch (e) {}

  backToLoginSelection();
  checkAuthState();
  showToast("Anda telah keluar dari akun.", "fa-right-from-bracket");
}

// Binding ke global window agar selalu dapat dipanggil dari onclick inline HTML
window.openLoginModal = openLoginModal;
window.loginAsChaiz = loginAsChaiz;
window.loginAsUser = loginAsChaiz;
window.openMemberLoginForm = openMemberLoginForm;
window.openMemberLoginModal = openMemberLoginModal;
window.closeLoginGateModal = closeLoginGateModal;
window.backToLoginSelection = backToLoginSelection;
window.togglePasswordVisibility = togglePasswordVisibility;
window.handleMemberLogin = handleMemberLogin;
window.logoutUser = logoutUser;

function setupAuthEventListeners() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logoutUser);
  }

  const loginAsChaizBtn = document.getElementById("loginAsChaizBtn");
  if (loginAsChaizBtn) {
    loginAsChaizBtn.addEventListener("click", loginAsChaiz);
  }

  const loginAsUserBtn = document.getElementById("loginAsUserBtn");
  if (loginAsUserBtn) {
    loginAsUserBtn.addEventListener("click", loginAsChaiz);
  }

  const showMemberFormBtn = document.getElementById("showMemberFormBtn");
  if (showMemberFormBtn) {
    showMemberFormBtn.addEventListener("click", openMemberLoginForm);
  }

  const memberLoginForm = document.getElementById("memberLoginForm");
  if (memberLoginForm) {
    memberLoginForm.addEventListener("submit", handleMemberLogin);
  }
}

// ===================================================
// EVENT LISTENERS SETUP
// ===================================================
function setupEventListeners() {
  // Category Filter Tabs
  const catButtons = document.querySelectorAll(".cat-btn");
  catButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      catButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.getAttribute("data-category");
      renderProducts();
    });
  });

  // ===================================================
  // DESKTOP / LAPTOP SEARCH DROPDOWN CONTROLS
  // ===================================================
  const searchBoxDesktop = document.getElementById("searchBoxDesktop");
  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const searchIconDesktop = document.getElementById("searchIconDesktop");
  const desktopSearchDropdown = document.getElementById("desktopSearchDropdown");

  function openDesktopSearch() {
    if (searchBoxDesktop) searchBoxDesktop.classList.add("expanded");
    if (desktopSearchDropdown) desktopSearchDropdown.classList.add("open");
  }

  function closeDesktopSearch() {
    if (searchBoxDesktop) searchBoxDesktop.classList.remove("expanded");
    if (desktopSearchDropdown) desktopSearchDropdown.classList.remove("open");
  }

  window.openDesktopSearch = openDesktopSearch;
  window.closeDesktopSearch = closeDesktopSearch;

  if (searchInput) {
    searchInput.addEventListener("focus", openDesktopSearch);
    searchInput.addEventListener("click", openDesktopSearch);

    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      const searchInputMobile = document.getElementById("searchInputMobile");
      const clearSearchMobileBtn = document.getElementById("clearSearchMobileBtn");

      if (searchInputMobile) searchInputMobile.value = e.target.value;
      if (clearSearchBtn) {
        clearSearchBtn.classList.toggle("hidden", searchQuery === "");
      }
      if (clearSearchMobileBtn) {
        clearSearchMobileBtn.classList.toggle("hidden", searchQuery === "");
      }
      openDesktopSearch();
      renderProducts();
    });

    // Tekan Enter pada Desktop Search -> Otomatis scroll ke bawah dan menunjuk produk
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        executeSearchAndPoint(searchInput.value);
        closeDesktopSearch();
        searchInput.blur();
      }
    });
  }

  if (searchIconDesktop) {
    searchIconDesktop.addEventListener("click", () => {
      if (searchInput && searchInput.value) {
        executeSearchAndPoint(searchInput.value);
        closeDesktopSearch();
      } else {
        openDesktopSearch();
        if (searchInput) searchInput.focus();
      }
    });
  }

  // Clear Search Desktop
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      searchInput.value = "";
      const searchInputMobile = document.getElementById("searchInputMobile");
      if (searchInputMobile) searchInputMobile.value = "";
      searchQuery = "";
      clearSearchBtn.classList.add("hidden");
      const clearSearchMobileBtn = document.getElementById("clearSearchMobileBtn");
      if (clearSearchMobileBtn) clearSearchMobileBtn.classList.add("hidden");
      renderProducts();
      searchInput.focus();
    });
  }

  // Tutup dropdown desktop jika klik di luar search-box-desktop
  document.addEventListener("click", (e) => {
    if (searchBoxDesktop && !searchBoxDesktop.contains(e.target)) {
      closeDesktopSearch();
    }
  });

  // ===================================================
  // MOBILE / DEVICE SEARCH DROPDOWN CONTROLS
  // ===================================================
  const searchBoxMobile = document.getElementById("searchBoxMobile");
  const mobileSearchToggleBtn = document.getElementById("mobileSearchToggleBtn");
  const closeMobileSearchBtn = document.getElementById("closeMobileSearchBtn");
  const searchInputMobile = document.getElementById("searchInputMobile");
  const clearSearchMobileBtn = document.getElementById("clearSearchMobileBtn");
  const searchIconMobile = document.getElementById("searchIconMobile");

  function toggleMobileSearch() {
    if (!searchBoxMobile) return;
    const isOpen = searchBoxMobile.classList.contains("open");
    if (isOpen) {
      closeMobileSearch();
    } else {
      const navLinks = document.getElementById("navLinks");
      if (navLinks) navLinks.classList.remove("show");
      searchBoxMobile.classList.add("open");
      if (mobileSearchToggleBtn) mobileSearchToggleBtn.classList.add("active");
      if (searchInputMobile) {
        setTimeout(() => {
          searchInputMobile.focus();
        }, 80);
      }
    }
  }

  function closeMobileSearch() {
    if (searchBoxMobile) searchBoxMobile.classList.remove("open");
    if (mobileSearchToggleBtn) mobileSearchToggleBtn.classList.remove("active");
    if (searchInputMobile) searchInputMobile.blur();
  }

  window.toggleMobileSearch = toggleMobileSearch;
  window.closeMobileSearch = closeMobileSearch;

  if (mobileSearchToggleBtn) {
    mobileSearchToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMobileSearch();
    });
  }

  if (closeMobileSearchBtn) {
    closeMobileSearchBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeMobileSearch();
    });
  }

  // Tutup mobile search jika klik di luar navbar
  document.addEventListener("click", (e) => {
    if (searchBoxMobile && searchBoxMobile.classList.contains("open")) {
      const isInside = searchBoxMobile.contains(e.target) || 
                       (mobileSearchToggleBtn && mobileSearchToggleBtn.contains(e.target));
      if (!isInside) {
        closeMobileSearch();
      }
    }
  });

  // Tombol Escape menutup dropdown search mobile
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && searchBoxMobile && searchBoxMobile.classList.contains("open")) {
      closeMobileSearch();
    }
  });

  // Mobile Search Input & Real-time Live Filter
  if (searchInputMobile) {
    searchInputMobile.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      if (searchInput) searchInput.value = e.target.value;
      if (clearSearchMobileBtn) {
        clearSearchMobileBtn.classList.toggle("hidden", searchQuery === "");
      }
      if (clearSearchBtn) {
        clearSearchBtn.classList.toggle("hidden", searchQuery === "");
      }
      renderProducts();
    });

    // Tekan Enter pada HP -> Scroll ke bawah & tunjuk produk langsung
    searchInputMobile.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        executeSearchAndPoint(searchInputMobile.value);
        closeMobileSearch();
      }
    });

    searchInputMobile.addEventListener("search", () => {
      executeSearchAndPoint(searchInputMobile.value);
      closeMobileSearch();
    });
  }

  // Clear Button Mobile Search
  if (clearSearchMobileBtn) {
    clearSearchMobileBtn.addEventListener("click", () => {
      if (searchInputMobile) searchInputMobile.value = "";
      if (searchInput) searchInput.value = "";
      searchQuery = "";
      clearSearchMobileBtn.classList.add("hidden");
      if (clearSearchBtn) clearSearchBtn.classList.add("hidden");
      renderProducts();
      if (searchInputMobile) searchInputMobile.focus();
    });
  }

  if (searchIconMobile) {
    searchIconMobile.addEventListener("click", () => {
      if (searchInputMobile && searchInputMobile.value) {
        executeSearchAndPoint(searchInputMobile.value);
        closeMobileSearch();
      }
    });
  }

  // Reset Search Button in Empty State
  const resetSearchBtn = document.getElementById("resetSearchBtn");
  if (resetSearchBtn) {
    resetSearchBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (searchInputMobile) searchInputMobile.value = "";
      if (clearSearchBtn) clearSearchBtn.classList.add("hidden");
      if (clearSearchMobileBtn) clearSearchMobileBtn.classList.add("hidden");
      searchQuery = "";
      currentFilter = "all";
      document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
      const allBtn = document.querySelector('.cat-btn[data-category="all"]');
      if (allBtn) allBtn.classList.add("active");
      renderProducts();
    });
  }

  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const navLinks = document.getElementById("navLinks");
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navLinks.classList.toggle("show");
      const icon = mobileMenuBtn.querySelector("i");
      if (icon) {
        if (navLinks.classList.contains("show")) {
          icon.className = "fa-solid fa-xmark";
        } else {
          icon.className = "fa-solid fa-bars";
        }
      }
    });

    // Close menu when clicking link
    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("show");
        const icon = mobileMenuBtn.querySelector("i");
        if (icon) icon.className = "fa-solid fa-bars";
      });
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (navLinks.classList.contains("show") && !navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        navLinks.classList.remove("show");
        const icon = mobileMenuBtn.querySelector("i");
        if (icon) icon.className = "fa-solid fa-bars";
      }
    });
  }

  // Nav Cart Link & Cart Button
  const navCartLink = document.getElementById("navCartLink");
  const cartBtn = document.getElementById("cartBtn");
  if (navCartLink) {
    navCartLink.addEventListener("click", openCart);
  }
  if (cartBtn) {
    cartBtn.addEventListener("click", openCart);
  }

  // Modal Close Listeners
  const closeModalBtn = document.getElementById("closeModalBtn");
  const orderModal = document.getElementById("orderModal");
  if (closeModalBtn && orderModal) {
    closeModalBtn.addEventListener("click", closeModal);
    orderModal.addEventListener("click", (e) => {
      if (e.target === orderModal) closeModal();
    });
  }

  // Checkout Modal Backdrop Close Listener
  const checkoutModal = document.getElementById("checkoutModal");
  if (checkoutModal) {
    checkoutModal.addEventListener("click", (e) => {
      if (e.target === checkoutModal) closeCheckoutModal();
    });
  }

  // Order Form Submit ("Beli Sekarang")
  const orderForm = document.getElementById("orderForm");
  if (orderForm) {
    orderForm.addEventListener("submit", handleOrderSubmit);
  }

  // Modal "Masukkan Keranjang" Button
  const modalAddToCartBtn = document.getElementById("modalAddToCartBtn");
  if (modalAddToCartBtn) {
    modalAddToCartBtn.addEventListener("click", handleModalAddToCart);
  }

  // Cart Drawer Listeners
  const cartDrawerOverlay = document.getElementById("cartDrawerOverlay");
  const closeCartBtn = document.getElementById("closeCartBtn");
  const shopNowBtn = document.getElementById("shopNowBtn");
  const cartCheckoutBtn = document.getElementById("cartCheckoutBtn");

  if (closeCartBtn && cartDrawerOverlay) {
    closeCartBtn.addEventListener("click", closeCart);
  }
  if (cartDrawerOverlay) {
    cartDrawerOverlay.addEventListener("click", (e) => {
      if (e.target === cartDrawerOverlay) closeCart();
    });
  }
  if (shopNowBtn) {
    shopNowBtn.addEventListener("click", closeCart);
  }
  if (cartCheckoutBtn) {
    cartCheckoutBtn.addEventListener("click", handleCartCheckout);
  }

  // FAQ Accordion
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(item => {
    const questionBtn = item.querySelector(".faq-question");
    questionBtn.addEventListener("click", () => {
      const isActive = item.classList.contains("active");
      faqItems.forEach(otherItem => {
        if (otherItem !== item) otherItem.classList.remove("active");
      });
      item.classList.toggle("active", !isActive);
    });
  });
}

// ===================================================
// PENCARIAN CERDAS: SCROLL KE BAWAH & TUNJUK PRODUK
// ===================================================
function executeSearchAndPoint(query) {
  if (!query || !query.trim()) {
    showToast("Silakan ketik nama akun yang ingin dicari", "fa-magnifying-glass");
    return;
  }
  const q = query.trim().toLowerCase();
  searchQuery = q;

  const searchInput = document.getElementById("searchInput");
  const searchInputMobile = document.getElementById("searchInputMobile");
  if (searchInput) searchInput.value = query;
  if (searchInputMobile) searchInputMobile.value = query;

  // Pastikan filter kategori aktif di 'all' agar pencarian tidak terhalang
  currentFilter = "all";
  document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
  const allBtn = document.querySelector('.cat-btn[data-category="all"]');
  if (allBtn) allBtn.classList.add("active");

  renderProducts();

  // Scroll ke kartu produk yang cocok dan tampilkan tanda penunjuk
  setTimeout(() => {
    const matchedCard = document.querySelector("#productGrid .product-card");
    if (matchedCard) {
      matchedCard.scrollIntoView({ behavior: "smooth", block: "center" });
      highlightProductCard(matchedCard);
    } else {
      showToast(`Akun "${query}" belum tersedia di katalog`, "fa-circle-question");
    }
  }, 120);
}

function highlightProductCard(card) {
  // Bersihkan highlight lama
  document.querySelectorAll(".highlight-pulse").forEach(el => el.classList.remove("highlight-pulse"));
  document.querySelectorAll(".search-pointer-pin").forEach(el => el.remove());

  card.classList.add("highlight-pulse");

  // Tambahkan pin animasi tangan menunjuk
  const pin = document.createElement("div");
  pin.className = "search-pointer-pin";
  pin.innerHTML = `<i class="fa-solid fa-hand-point-down"></i> <span>Ini produk yang Anda cari!</span>`;
  card.appendChild(pin);

  // Hilangkan pin setelah 3.5 detik
  setTimeout(() => {
    card.classList.remove("highlight-pulse");
    pin.style.opacity = "0";
    pin.style.transition = "opacity 0.4s ease";
    setTimeout(() => pin.remove(), 400);
  }, 3500);
}

// Handler Notifikasi Sosial Media Belum Diupdate
function notifySocialMedia(platform, event) {
  if (event) event.preventDefault();
  showToast(`Mohon maaf, link ${platform} belum di-update sama developer`, "fa-circle-info");
}

// Quick Search Tag dari Pill Rekomendasi di Dropdown Search
function quickSearchTag(tag) {
  if (!tag) return;
  const searchInput = document.getElementById("searchInput");
  const searchInputMobile = document.getElementById("searchInputMobile");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const clearSearchMobileBtn = document.getElementById("clearSearchMobileBtn");

  if (searchInput) searchInput.value = tag;
  if (searchInputMobile) searchInputMobile.value = tag;
  if (clearSearchBtn) clearSearchBtn.classList.remove("hidden");
  if (clearSearchMobileBtn) clearSearchMobileBtn.classList.remove("hidden");

  closeMobileSearch();
  closeDesktopSearch();
  executeSearchAndPoint(tag);
}

window.executeSearchAndPoint = executeSearchAndPoint;
window.notifySocialMedia = notifySocialMedia;
window.quickSearchTag = quickSearchTag;



// ===================================================
// MAIN PRODUCT CATALOG RENDER
// ===================================================
function renderProducts() {
  const container = document.getElementById("productGrid");
  const emptyState = document.getElementById("emptyState");
  if (!container) return;

  const filtered = PRODUCTS.filter(product => {
    const matchCategory = currentFilter === "all" || product.category.toLowerCase() === currentFilter.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchSearch = product.name.toLowerCase().includes(q) ||
                        product.category.toLowerCase().includes(q) ||
                        (product.badge && product.badge.toLowerCase().includes(q)) ||
                        (product.priceNote && product.priceNote.toLowerCase().includes(q)) ||
                        product.features.some(f => f.toLowerCase().includes(q)) ||
                        product.durations.some(d => d.name.toLowerCase().includes(q) || (d.tag && d.tag.toLowerCase().includes(q)));
    return matchCategory && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = "";
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");

  container.innerHTML = filtered.map(item => {
    const isUnreleased = !!item.isUnreleased;
    const isOutOfStock = !isUnreleased && item.stock === 0;
    const hasMultiplePrices = item.durations && item.durations.length > 1;

    let priceHtml = "";
    if (isUnreleased) {
      priceHtml = `<span class="current-price" style="color: #f59e0b; font-size: 0.95rem; font-weight: 700;"><i class="fa-solid fa-lock"></i> Segel Belum Dirilis</span>`;
    } else if (isOutOfStock) {
      priceHtml = `<span class="current-price" style="color: var(--accent-rose);">Stok Kosong</span>`;
    } else if (item.priceNote) {
      priceHtml = `<span class="current-price" style="font-size: 0.95rem; font-weight: 700; color: #38bdf8; line-height: 1.2; display: inline-block;">${item.priceNote}</span>`;
    } else {
      priceHtml = `
        ${item.oldPrice ? `<span class="old-price">${formatRupiah(item.oldPrice)}</span>` : ""}
        <span class="current-price">${formatRupiah(item.currentPrice)}</span>
      `;
    }

    const priceLabel = isUnreleased ? "Status Produk" : (isOutOfStock ? "Status" : (item.priceNote ? "Harga" : (hasMultiplePrices ? "Mulai dari" : "Harga")));
    const priceUnit = (isUnreleased || isOutOfStock) ? "" : (item.priceNote ? "" : (item.durations.length === 1 ? `/ ${item.durations[0].name}` : "/ durasi"));

    // Tampilan Produk: Jika ada foto khusus (Semua akun premium kecuali Grok AI)
    let bodyContentHtml = "";
    if (item.image) {
      bodyContentHtml = `
        <div class="product-banner-wrap">
          <img src="${item.image}" alt="${item.name}" class="product-banner-img" loading="lazy">
          <div class="product-banner-overlay">
            <h3 class="product-banner-title">${item.name}</h3>
            <ul class="product-banner-features">
              ${item.features.map(f => `<li><i class="fa-solid fa-circle-check"></i> <span>${f}</span></li>`).join("")}
            </ul>
          </div>
        </div>
      `;
    } else {
      // Khusus Grok AI (tidak ada foto, menggunakan tanda segel dan icon gembok)
      bodyContentHtml = `
        <div class="product-info">
          ${isUnreleased ? `<div class="product-seal-tag"><i class="fa-solid fa-shield-halved"></i> TANDA SEGEL RESMI</div>` : ""}
          <span class="product-category">${item.category}</span>
          <h3 class="product-title">${item.name}</h3>
          <ul class="product-features-list">
            ${item.features.map(f => `<li><i class="${isUnreleased ? 'fa-solid fa-lock' : 'fa-solid fa-check'}" style="${isUnreleased ? 'color: #f59e0b;' : ''}"></i> ${f}</li>`).join("")}
          </ul>
        </div>
      `;
    }

    let actionsHtml = "";
    if (isUnreleased) {
      actionsHtml = `
        <button type="button" class="btn btn-secondary btn-sealed" style="width: 100%; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.45); color: #fbbf24; font-weight: 700; cursor: pointer;" onclick="showToast('Grok AI masih dalam status segel dan belum dirilis resmi!', 'fa-lock')">
          <i class="fa-solid fa-lock"></i> Segel: Belum Dirilis
        </button>
      `;
    } else {
      actionsHtml = `
        <button class="btn btn-primary" onclick="openOrderModal('${item.id}')">
          <i class="fa-solid fa-tag"></i> ${isOutOfStock ? "Stok Kosong" : "Pilih Paket"}
        </button>
        <button class="btn-add-cart" onclick="openOrderModal('${item.id}')" title="Pilih Paket & Varian">
          <i class="fa-solid fa-cart-plus"></i>
        </button>
      `;
    }

    // Stock Badge di kiri pinggir kartu
    let stockBadgeHtml = "";
    if (isUnreleased) {
      stockBadgeHtml = `<span class="badge-stock badge-stock-sealed" title="Status: Segel Belum Dirilis"><i class="fa-solid fa-lock"></i> Segel</span>`;
    } else if (isOutOfStock) {
      stockBadgeHtml = `<span class="badge-stock badge-stock-empty" title="Stok Saat Ini Kosong"><i class="fa-solid fa-circle-xmark"></i> Stok Habis</span>`;
    } else if (item.stock <= 5) {
      stockBadgeHtml = `<span class="badge-stock badge-stock-low" title="Sisa Stok: ${item.stock} Akun"><i class="fa-solid fa-box-archive"></i> Stok: ${item.stock}</span>`;
    } else {
      stockBadgeHtml = `<span class="badge-stock badge-stock-available" title="Sisa Stok: ${item.stock} Akun"><i class="fa-solid fa-boxes-stacked"></i> Stok: ${item.stock}</span>`;
    }

    const cardClick = isUnreleased ? `onclick="showToast('Grok AI masih dalam status segel dan belum dirilis resmi!', 'fa-lock')"` : `onclick="openOrderModal('${item.id}')"`;

    return `
      <div class="product-card ${item.image ? 'has-banner' : ''} ${isUnreleased ? 'card-unreleased' : ''}" ${cardClick}>
        <div class="card-top-bar">
          <div class="card-top-left">
            ${!item.image ? `
              <div class="product-icon-wrap" style="color: ${item.iconColor}; ${isUnreleased ? 'background: rgba(245, 158, 11, 0.1);' : ''}">
                <i class="${item.icon}"></i>
              </div>
            ` : ''}
            ${stockBadgeHtml}
          </div>
          <span class="badge-status ${item.badgeClass}">${item.badge}</span>
        </div>

        ${bodyContentHtml}

        <div class="product-price-box">
          <div>
            <span class="price-label">${priceLabel}</span>
            <div>${priceHtml}</div>
          </div>
          <span class="price-unit">${priceUnit}</span>
        </div>

        <div class="card-actions" onclick="event.stopPropagation()">
          ${actionsHtml}
        </div>
      </div>
    `;
  }).join("");
}

// ===================================================
// ORDER MODAL & DYNAMIC PACKAGE LOGIC
// ===================================================
function openOrderModal(productId) {
  selectedProduct = PRODUCTS.find(p => p.id === productId);
  if (!selectedProduct) return;

  // Set default package ke opsi pertama
  selectedDurationId = selectedProduct.durations[0]?.id || "default";

  const modal = document.getElementById("orderModal");
  const modalName = document.getElementById("modalProductName");
  const modalCat = document.getElementById("modalProductCat");
  const modalIcon = document.getElementById("modalProductIcon");
  const durationGrid = document.getElementById("modalDurationGrid");

  if (modalName) modalName.textContent = selectedProduct.name;
  if (modalCat) modalCat.textContent = selectedProduct.category.toUpperCase();
  if (modalIcon) {
    if (selectedProduct.image) {
      modalIcon.innerHTML = `<img src="${selectedProduct.image}" alt="${selectedProduct.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
      modalIcon.style.background = "#0f172a";
      modalIcon.style.padding = "2px";
    } else {
      modalIcon.innerHTML = `<i class="${selectedProduct.icon}" style="color: ${selectedProduct.iconColor}"></i>`;
      modalIcon.style.background = "";
      modalIcon.style.padding = "";
    }
  }

  // Render Kartu Paket Dinamis
  if (durationGrid) {
    durationGrid.innerHTML = selectedProduct.durations.map((dur) => `
      <label class="duration-option">
        <input type="radio" name="selectedDuration" value="${dur.id}" ${dur.id === selectedDurationId ? "checked" : ""} onchange="handleDurationChange('${dur.id}')">
        <div class="duration-card">
          <span class="dur-badge">${dur.name}</span>
          <span class="dur-price">${dur.price > 0 ? formatRupiah(dur.price) : (dur.outOfStock ? "Kosong" : "-")}</span>
          <span class="dur-tag">${dur.tag || (dur.warranty ? 'Garansi ' + dur.warranty : 'Pilihan')}</span>
        </div>
      </label>
    `).join("");
  }

  updateOrderCalculations();
  if (modal) modal.classList.add("active");
  document.documentElement.classList.add("modal-open");
  document.body.classList.add("modal-open");
}

function handleDurationChange(durationId) {
  selectedDurationId = durationId;
  updateOrderCalculations();
}

function handleViaChange(viaType) {
  selectedViaType = viaType;
  updateOrderCalculations();
}

// Hitung Ulang Ringkasan & Total Harga
function updateOrderCalculations() {
  if (!selectedProduct) return;

  const currentDur = selectedProduct.durations.find(d => d.id === selectedDurationId) || selectedProduct.durations[0];
  const summaryPackage = document.getElementById("summaryPackage");
  const summaryStock = document.getElementById("summaryStock");
  const summaryWarranty = document.getElementById("summaryWarranty");
  const summaryTotal = document.getElementById("summaryTotal");
  const modalAddToCartBtn = document.getElementById("modalAddToCartBtn");
  const modalCheckoutBtn = document.getElementById("modalCheckoutBtn");
  const stockAlertBox = document.getElementById("stockAlertBox");

  const isOutOfStock = selectedProduct.stock === 0 || currentDur.outOfStock;
  currentCalculatedPrice = currentDur.price || 0;

  if (summaryPackage) {
    summaryPackage.textContent = `${selectedProduct.name} - ${currentDur.name}`;
  }

  if (summaryStock) {
    if (isOutOfStock) {
      summaryStock.textContent = "Stok Kosong";
      summaryStock.className = "text-danger";
    } else {
      summaryStock.textContent = `${selectedProduct.stock || "Ready"} Tersedia`;
      summaryStock.className = "text-success";
    }
  }

  if (summaryWarranty) {
    summaryWarranty.innerHTML = `<i class="fa-solid fa-shield-check"></i> ${currentDur.warranty || selectedProduct.warranty || "Sesuai Durasi"}`;
  }

  if (summaryTotal) {
    summaryTotal.textContent = isOutOfStock ? "Stok Kosong" : formatRupiah(currentCalculatedPrice);
  }

  if (stockAlertBox) {
    stockAlertBox.classList.toggle("hidden", !isOutOfStock);
  }

  if (modalAddToCartBtn) {
    modalAddToCartBtn.disabled = isOutOfStock;
    modalAddToCartBtn.style.opacity = isOutOfStock ? "0.5" : "1";
    modalAddToCartBtn.style.cursor = isOutOfStock ? "not-allowed" : "pointer";
  }

  if (modalCheckoutBtn) {
    modalCheckoutBtn.disabled = isOutOfStock;
    modalCheckoutBtn.style.opacity = isOutOfStock ? "0.5" : "1";
    modalCheckoutBtn.style.cursor = isOutOfStock ? "not-allowed" : "pointer";
  }
}

function closeModal() {
  const modal = document.getElementById("orderModal");
  if (modal) modal.classList.remove("active");
  document.documentElement.classList.remove("modal-open");
  document.body.classList.remove("modal-open");
  document.body.style.overflow = "";
}

// ===================================================
// AKSI 1: MASUKKAN KERANJANG DARI MODAL
// ===================================================
function handleModalAddToCart() {
  if (!selectedProduct) return;

  const currentDur = selectedProduct.durations.find(d => d.id === selectedDurationId) || selectedProduct.durations[0];
  if (selectedProduct.stock === 0 || currentDur.outOfStock) {
    showToast("Maaf, stok produk ini sedang kosong!", "fa-triangle-exclamation");
    return;
  }

  const viaLabel = currentDur.tag || currentDur.warranty || "Reguler";

  const cartItem = {
    id: Date.now(),
    productId: selectedProduct.id,
    productName: selectedProduct.name,
    durationName: currentDur.name,
    viaType: viaLabel,
    price: currentCalculatedPrice
  };

  cartItems.push(cartItem);
  saveCart();
  updateCartUI();

  showToast(`${selectedProduct.name} (${currentDur.name}) dimasukkan ke keranjang!`, "fa-cart-plus");
  closeModal();
}

// Tombol Keranjang pada Card Produk: Sama fungsinya dengan Pilih Paket (membuka modal)
function quickAddToCart(productId) {
  openOrderModal(productId);
}

// ===================================================
// AKSI 2: CHECKOUT & PEMBAYARAN VIA CHECKOUT MODAL
// ===================================================
function handleOrderSubmit(e) {
  if (e) e.preventDefault();
  openCheckoutModal('single');
}

// ===================================================
// CART LOGIC & DRAWER
// ===================================================
function saveCart() {
  try {
    localStorage.setItem("chaiz_cart", JSON.stringify(cartItems));
  } catch (e) {
    console.error("Gagal simpan cart", e);
  }
}

function updateCartUI() {
  const cartCount = document.getElementById("cartCount");
  const navCartBadge = document.getElementById("navCartBadge");
  const cartItemsList = document.getElementById("cartItemsList");
  const cartFooter = document.getElementById("cartFooter");
  const cartTotal = document.getElementById("cartTotal");

  const count = cartItems.length;
  if (cartCount) {
    cartCount.textContent = count;
    cartCount.classList.toggle("hidden", count === 0);
  }
  if (navCartBadge) {
    navCartBadge.textContent = count;
    navCartBadge.classList.toggle("hidden", count === 0);
  }

  if (!cartItemsList) return;

  if (cartItems.length === 0) {
    cartItemsList.innerHTML = `
      <div class="empty-cart-msg">
        <i class="fa-solid fa-basket-shopping"></i>
        <p>Keranjang kamu masih kosong</p>
        <a href="#katalog" class="btn btn-sm btn-outline" onclick="closeCart()">Belanja Sekarang</a>
      </div>
    `;
    if (cartFooter) cartFooter.style.display = "none";
    return;
  }

  // Render daftar item keranjang
  cartItemsList.innerHTML = cartItems.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <h4>${item.productName}</h4>
        <span>${item.durationName} &bull; ${item.viaType}</span>
        <div class="cart-item-price">${formatRupiah(item.price)}</div>
      </div>
      <button class="remove-cart-item" onclick="removeCartItem(${item.id})" title="Hapus item">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `).join("");

  const total = cartItems.reduce((acc, curr) => acc + curr.price, 0);
  if (cartTotal) cartTotal.textContent = formatRupiah(total);
  if (cartFooter) cartFooter.style.display = "block";
}

function removeCartItem(itemId) {
  cartItems = cartItems.filter(item => item.id !== itemId);
  saveCart();
  updateCartUI();
  showToast("Item dihapus dari keranjang", "fa-trash-can");
}

function openCart() {
  const drawer = document.getElementById("cartDrawerOverlay");
  if (drawer) {
    drawer.classList.add("active");
    document.documentElement.classList.add("cart-open");
    document.body.classList.add("cart-open");
  }
}

function closeCart() {
  const drawer = document.getElementById("cartDrawerOverlay");
  if (drawer) {
    drawer.classList.remove("active");
    document.documentElement.classList.remove("cart-open");
    document.body.classList.remove("cart-open");
    document.body.style.overflow = "";
  }
}

function handleCartCheckout() {
  if (cartItems.length === 0) {
    showToast("Keranjang belanja Anda masih kosong!", "fa-basket-shopping");
    return;
  }
  openCheckoutModal('cart');
}

// ===================================================
// CHECKOUT MODAL, QRIS PAYMENT, & PROOF UPLOAD LOGIC
// ===================================================
let currentCheckoutData = {
  source: 'single', // 'single' atau 'cart'
  items: [],
  total: 0
};

let selectedPaymentMethod = 'qris'; // 'qris' | 'ewallet' | 'bank'
let uploadedProofData = null; // { name, size, dataUrl }

const PAYMENT_INFO = {
  qris: {
    name: "QRIS Instant",
    badge: "Scan Langsung via QRIS Semua Bank & E-Wallet",
    desc: "Buka aplikasi Mobile Banking (BCA, Mandiri, BRI, BNI, Jago, dll) atau E-Wallet (DANA, GoPay, OVO, ShopeePay, LinkAja, dll), lalu scan QRIS di atas untuk menyelesaikan pembayaran otomatis."
  },
  ewallet: {
    name: "E-Wallet (081809730331)",
    badge: "Bisa scan QRIS di atas atau transfer langsung ke nomor E-Wallet berikut:",
    account: {
      label: "Nomor E-Wallet (DANA / OVO / GoPay / ShopeePay)",
      number: "081809730331",
      owner: "a/n ChaizStore"
    }
  },
  bank: {
    name: "Bank Muamalat (1410043224)",
    badge: "Bisa scan QRIS di atas atau transfer langsung ke Rekening Bank berikut:",
    account: {
      label: "Rekening Bank Muamalat",
      number: "1410043224",
      owner: "a/n ChaizStore"
    }
  }
};

function openCheckoutModal(source = 'single') {
  currentCheckoutData.source = source;
  
  if (source === 'single') {
    if (!selectedProduct) {
      showToast("Silakan pilih produk akun terlebih dahulu", "fa-triangle-exclamation");
      return;
    }

    const currentDur = selectedProduct.durations.find(d => d.id === selectedDurationId) || selectedProduct.durations[0];
    if (selectedProduct.stock === 0 || currentDur.outOfStock) {
      showToast("Maaf, stok produk ini sedang kosong!", "fa-triangle-exclamation");
      return;
    }
    const viaLabel = currentDur.tag || currentDur.warranty || "Reguler";

    currentCheckoutData.items = [
      {
        name: selectedProduct.name,
        duration: currentDur.name,
        via: viaLabel,
        price: currentCalculatedPrice,
        qty: 1,
        total: currentCalculatedPrice
      }
    ];
    currentCheckoutData.total = currentCalculatedPrice;

    // Tutup modal produk sebelum buka checkout modal
    closeModal();
  } else if (source === 'cart') {
    if (cartItems.length === 0) {
      showToast("Keranjang belanja Anda masih kosong!", "fa-basket-shopping");
      return;
    }

    currentCheckoutData.items = cartItems.map(item => ({
      name: item.productName,
      duration: item.durationName,
      via: item.viaType,
      price: item.price,
      qty: 1,
      total: item.price
    }));

    currentCheckoutData.total = cartItems.reduce((sum, it) => sum + it.price, 0);

    // Tutup drawer keranjang sebelum buka checkout modal
    closeCart();
  }

  // Render Tabel Rincian Item di Checkout Modal
  const tbody = document.getElementById("checkoutItemsTbody");
  if (tbody) {
    tbody.innerHTML = currentCheckoutData.items.map(item => `
      <tr>
        <td>
          <span class="checkout-item-title">${item.name}</span>
          <span class="checkout-item-badge">${item.duration} &bull; ${item.via}</span>
        </td>
        <td>${formatRupiah(item.price)}</td>
        <td style="text-align: center; font-weight: 600;">${item.qty}x</td>
        <td style="text-align: right; font-weight: 700; color: #34d399;">${formatRupiah(item.total)}</td>
      </tr>
    `).join("");
  }

  // Set Total Harga
  const grandTotalEl = document.getElementById("checkoutGrandTotal");
  if (grandTotalEl) {
    grandTotalEl.textContent = formatRupiah(currentCheckoutData.total);
  }

  // Data Pemesan (Nama, No WhatsApp, Gmail) selalu dikosongkan secara default agar diisi sendiri oleh pembeli
  const buyerNameInput = document.getElementById("checkoutBuyerName");
  const buyerWaInput = document.getElementById("checkoutBuyerWa");
  const buyerEmailInput = document.getElementById("checkoutBuyerEmail");
  if (buyerNameInput) buyerNameInput.value = "";
  if (buyerWaInput) buyerWaInput.value = "";
  if (buyerEmailInput) buyerEmailInput.value = "";

  // Data Khusus CapCut Pakai Akun Sendiri
  const hasCapcutOwnAccount = currentCheckoutData.items.some(item => {
    const nameMatch = (item.name || "").toLowerCase().includes("capcut");
    const durMatch = (item.duration || "").toLowerCase().includes("akun sendiri") || 
                     (item.via || "").toLowerCase().includes("akun sendiri");
    return nameMatch && durMatch;
  });
  const capcutAccountGroup = document.getElementById("capcutAccountGroup");
  const capcutAccountInput = document.getElementById("checkoutCapcutAccount");
  if (capcutAccountGroup) {
    if (hasCapcutOwnAccount) {
      capcutAccountGroup.classList.remove("hidden");
    } else {
      capcutAccountGroup.classList.add("hidden");
    }
  }
  if (capcutAccountInput) {
    capcutAccountInput.value = "";
    capcutAccountInput.required = !!hasCapcutOwnAccount;
  }

  // Reset Pilihan Metode Pembayaran diawal (QRIS baru muncul saat salah satu metode dipencet)
  selectedPaymentMethod = null;
  const methodSelectPrompt = document.getElementById("methodSelectPrompt");
  const qrisPaymentContainer = document.getElementById("qrisPaymentContainer");
  if (methodSelectPrompt) methodSelectPrompt.classList.remove("hidden");
  if (qrisPaymentContainer) qrisPaymentContainer.classList.add("hidden");

  // Reset visual tab cards & radio inputs
  ["methodCardQris", "methodCardEwallet", "methodCardBank"].forEach(cardId => {
    const card = document.getElementById(cardId);
    if (card) {
      card.classList.remove("active");
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = false;
    }
  });

  // Reset status upload bukti pembayaran (kunci tombol order)
  resetProofUpload();

  // Buka Modal Checkout
  const checkoutModal = document.getElementById("checkoutModal");
  if (checkoutModal) {
    checkoutModal.classList.add("active");
    document.documentElement.classList.add("modal-open");
    document.body.classList.add("modal-open");
  }
}

function closeCheckoutModal() {
  const checkoutModal = document.getElementById("checkoutModal");
  if (checkoutModal) {
    checkoutModal.classList.remove("active");
    document.documentElement.classList.remove("modal-open");
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
  }
}

function selectCheckoutMethod(methodKey) {
  selectedPaymentMethod = methodKey;

  // Sembunyikan prompt panduan & tampilkan box QRIS
  const methodSelectPrompt = document.getElementById("methodSelectPrompt");
  const qrisPaymentContainer = document.getElementById("qrisPaymentContainer");
  if (methodSelectPrompt) methodSelectPrompt.classList.add("hidden");
  if (qrisPaymentContainer) qrisPaymentContainer.classList.remove("hidden");

  // Update visual tab cards
  const cards = {
    qris: document.getElementById("methodCardQris"),
    ewallet: document.getElementById("methodCardEwallet"),
    bank: document.getElementById("methodCardBank")
  };

  Object.keys(cards).forEach(key => {
    if (cards[key]) {
      if (key === methodKey) {
        cards[key].classList.add("active");
        const radio = cards[key].querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      } else {
        cards[key].classList.remove("active");
      }
    }
  });

  // Render teks keterangan khusus di bawah foto QRIS sesuai method
  const infoBox = document.getElementById("methodInfoBox");
  if (!infoBox) return;

  const info = PAYMENT_INFO[methodKey];
  if (methodKey === 'qris') {
    infoBox.innerHTML = `
      <div class="payment-guide-badge"><i class="fa-solid fa-circle-check"></i> ${info.badge}</div>
      <p style="font-size: 0.82rem; color: #cbd5e1; margin-top: 6px; line-height: 1.5;">${info.desc}</p>
    `;
  } else if (methodKey === 'ewallet') {
    infoBox.innerHTML = `
      <div class="payment-guide-badge"><i class="fa-solid fa-mobile-screen-button"></i> ${info.badge}</div>
      <div class="rekening-list">
        <div class="rekening-item">
          <div>
            <div class="rekening-name">${info.account.label} (${info.account.owner})</div>
            <div class="rekening-num">${info.account.number}</div>
          </div>
          <button type="button" class="btn-copy-rek" onclick="copyRekening('${info.account.number}', 'E-Wallet')">
            <i class="fa-regular fa-copy"></i> Salin
          </button>
        </div>
      </div>
    `;
  } else if (methodKey === 'bank') {
    infoBox.innerHTML = `
      <div class="payment-guide-badge"><i class="fa-solid fa-building-columns"></i> ${info.badge}</div>
      <div class="rekening-list">
        <div class="rekening-item">
          <div>
            <div class="rekening-name">${info.account.label} (${info.account.owner})</div>
            <div class="rekening-num">${info.account.number}</div>
          </div>
          <button type="button" class="btn-copy-rek" onclick="copyRekening('${info.account.number}', 'Bank Muamalat')">
            <i class="fa-regular fa-copy"></i> Salin
          </button>
        </div>
      </div>
    `;
  }
}

function copyRekening(number, name) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(number).then(() => {
      showToast(`Nomor ${name} (${number}) berhasil disalin!`, "fa-copy");
    }).catch(() => {
      fallbackCopy(number, name);
    });
  } else {
    fallbackCopy(number, name);
  }
}

function fallbackCopy(text, label) {
  const tempInput = document.createElement("input");
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);
  showToast(`Nomor ${label} (${text}) berhasil disalin!`, "fa-copy");
}

function downloadQris(e) {
  if (e) e.preventDefault();

  fetch("Qris.png")
    .then(response => {
      if (!response.ok) throw new Error("Gagal mengambil file QRIS");
      return response.blob();
    })
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement("a");
      tempLink.style.display = "none";
      tempLink.href = blobUrl;
      tempLink.download = "QRIS-ChaizStore.png";
      document.body.appendChild(tempLink);
      tempLink.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(tempLink);
      showToast("Foto QRIS berhasil di-download!", "fa-circle-check");
    })
    .catch(() => {
      const tempLink = document.createElement("a");
      tempLink.href = "Qris.png";
      tempLink.download = "QRIS-ChaizStore.png";
      tempLink.target = "_blank";
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      showToast("Foto QRIS sedang di-download...", "fa-circle-check");
    });
}

function handleProofUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Harap pilih file foto bukti transfer (JPG / PNG / WEBP)", "fa-triangle-exclamation");
    e.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    const sizeKb = (file.size / 1024).toFixed(1);
    uploadedProofData = {
      file: file,
      name: file.name,
      size: `${sizeKb} KB`,
      dataUrl: evt.target.result,
      uploadedUrl: null,
      uploadPromise: null
    };

    // Mulai upload gambar di background agar saat klik tombol Order link sudah siap
    uploadedProofData.uploadPromise = uploadProofImage(file).then(url => {
      if (uploadedProofData) uploadedProofData.uploadedUrl = url;
      return url;
    }).catch(() => null);

    // Update UI Preview
    const previewImg = document.getElementById("proofPreviewImg");
    const previewFileName = document.getElementById("proofFileName");
    const previewFileSize = document.getElementById("proofFileSize");
    const dropzonePrompt = document.getElementById("dropzonePrompt");
    const uploadPreviewWrapper = document.getElementById("uploadPreviewWrapper");
    const proofNoticeBox = document.getElementById("proofNoticeBox");
    const btnSubmitOrder = document.getElementById("btnSubmitOrder");

    if (previewImg) previewImg.src = evt.target.result;
    if (previewFileName) previewFileName.textContent = file.name;
    if (previewFileSize) previewFileSize.textContent = `${sizeKb} KB`;

    if (dropzonePrompt) dropzonePrompt.classList.add("hidden");
    if (uploadPreviewWrapper) uploadPreviewWrapper.classList.remove("hidden");
    if (proofNoticeBox) proofNoticeBox.classList.add("hidden");

    // Tampilkan tombol order (baru muncul setelah upload)
    if (btnSubmitOrder) {
      btnSubmitOrder.classList.remove("hidden");
    }

    showToast("Bukti pembayaran berhasil di-upload! Silakan klik tombol Order.", "fa-circle-check");
  };

  reader.readAsDataURL(file);
}

// Helper: Upload Bukti Foto ke Cloud Server agar menghasilkan Link Akses Langsung
async function uploadProofImage(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("expire", "172800"); // Masa aktif link 48 jam (2 hari)

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500); // Batas 4.5 detik

    const res = await fetch("https://tmpfiles.org/api/v1/upload", {
      method: "POST",
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.status === "success" && data.data && data.data.url) {
        // Konversi ke direct view/download URL (tmpfiles.org/dl/...)
        return data.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
      }
    }
  } catch (err) {
    console.warn("Upload bukti foto warning:", err);
  }
  return null;
}

// Helper: Salin Gambar ke Clipboard Sistem (Untuk pengguna Desktop / WA Web bisa langsung Ctrl+V)
async function copyImageBlobToClipboard(file) {
  try {
    if (!navigator.clipboard || !window.ClipboardItem) return false;

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(async (blob) => {
            if (!blob) return resolve(false);
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob })
              ]);
              resolve(true);
            } catch (e) {
              resolve(false);
            }
          }, "image/png");
        } catch (e) {
          resolve(false);
        }
      };
      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });
  } catch (e) {
    return false;
  }
}

function removeProofUpload(e) {
  if (e) e.stopPropagation();

  uploadedProofData = null;
  const fileInput = document.getElementById("proofFileInput");
  if (fileInput) fileInput.value = "";

  const dropzonePrompt = document.getElementById("dropzonePrompt");
  const uploadPreviewWrapper = document.getElementById("uploadPreviewWrapper");
  const proofNoticeBox = document.getElementById("proofNoticeBox");
  const btnSubmitOrder = document.getElementById("btnSubmitOrder");

  if (dropzonePrompt) dropzonePrompt.classList.remove("hidden");
  if (uploadPreviewWrapper) uploadPreviewWrapper.classList.add("hidden");
  if (proofNoticeBox) proofNoticeBox.classList.remove("hidden");

  // Sembunyikan tombol order kembali
  if (btnSubmitOrder) {
    btnSubmitOrder.classList.add("hidden");
  }

  showToast("Foto bukti pembayaran dihapus", "fa-trash-can");
}

function resetProofUpload() {
  uploadedProofData = null;
  const fileInput = document.getElementById("proofFileInput");
  if (fileInput) fileInput.value = "";

  const dropzonePrompt = document.getElementById("dropzonePrompt");
  const uploadPreviewWrapper = document.getElementById("uploadPreviewWrapper");
  const proofNoticeBox = document.getElementById("proofNoticeBox");
  const btnSubmitOrder = document.getElementById("btnSubmitOrder");

  if (dropzonePrompt) dropzonePrompt.classList.remove("hidden");
  if (uploadPreviewWrapper) uploadPreviewWrapper.classList.add("hidden");
  if (proofNoticeBox) proofNoticeBox.classList.remove("hidden");
  if (btnSubmitOrder) btnSubmitOrder.classList.add("hidden");
}

async function processOrderToWhatsApp() {
  if (!selectedPaymentMethod) {
    showToast("Silakan klik salah satu metode pembayaran terlebih dahulu!", "fa-triangle-exclamation");
    return;
  }

  if (!uploadedProofData) {
    showToast("Harap upload foto bukti transfer terlebih dahulu!", "fa-triangle-exclamation");
    return;
  }

  const buyerNameInput = document.getElementById("checkoutBuyerName");
  const buyerWaInput = document.getElementById("checkoutBuyerWa");
  const buyerEmailInput = document.getElementById("checkoutBuyerEmail");

  const name = buyerNameInput ? buyerNameInput.value.trim() : "";
  const wa = buyerWaInput ? buyerWaInput.value.trim() : "";
  const email = buyerEmailInput ? buyerEmailInput.value.trim() || "-" : "-";

  if (!name) {
    showToast("Silakan masukkan Nama Lengkap Anda", "fa-triangle-exclamation");
    if (buyerNameInput) buyerNameInput.focus();
    return;
  }

  if (!wa) {
    showToast("Silakan masukkan No. WhatsApp Anda", "fa-triangle-exclamation");
    if (buyerWaInput) buyerWaInput.focus();
    return;
  }

  // Validasi Nama Akun CapCut jika paket Akun Sendiri dipilih
  const capcutAccountGroup = document.getElementById("capcutAccountGroup");
  const capcutAccountInput = document.getElementById("checkoutCapcutAccount");
  const isCapcutGroupVisible = capcutAccountGroup && !capcutAccountGroup.classList.contains("hidden");
  const capcutAccount = capcutAccountInput ? capcutAccountInput.value.trim() : "";

  if (isCapcutGroupVisible && !capcutAccount) {
    showToast("Nama Akun CapCut wajib diisi untuk paket Akun Sendiri!", "fa-triangle-exclamation");
    if (capcutAccountInput) capcutAccountInput.focus();
    return;
  }

  // Tampilkan indikator proses pada tombol Order
  const btnSubmitOrder = document.getElementById("btnSubmitOrder");
  const originalBtnHtml = btnSubmitOrder ? btnSubmitOrder.innerHTML : '<span>Order</span> <i class="fa-solid fa-arrow-right"></i>';
  if (btnSubmitOrder) {
    btnSubmitOrder.disabled = true;
    btnSubmitOrder.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Menyiapkan Foto & WhatsApp...</span>';
  }

  // 1. Dapatkan Link Foto Bukti (bila sudah selesai di-upload di background, atau upload sekarang)
  let photoUrl = uploadedProofData.uploadedUrl || null;
  if (!photoUrl && uploadedProofData.uploadPromise) {
    try {
      photoUrl = await uploadedProofData.uploadPromise;
    } catch (e) {
      photoUrl = null;
    }
  } else if (!photoUrl && uploadedProofData.file) {
    try {
      photoUrl = await uploadProofImage(uploadedProofData.file);
    } catch (e) {
      photoUrl = null;
    }
  }

  // 2. Salin foto ke clipboard untuk pengguna Desktop (agar bisa langsung Ctrl+V di WhatsApp Web)
  let isCopiedToClipboard = false;
  if (uploadedProofData && uploadedProofData.file) {
    try {
      isCopiedToClipboard = await copyImageBlobToClipboard(uploadedProofData.file);
    } catch (e) {
      isCopiedToClipboard = false;
    }
  }

  let methodTitle = "QRIS Instant";
  if (selectedPaymentMethod === 'ewallet') {
    methodTitle = "E-Wallet (081809730331)";
  } else if (selectedPaymentMethod === 'bank') {
    methodTitle = "Bank Muamalat (1410043224)";
  }

  // Susun Format Rincian Item: Jenis Item, Harga Item, Jumlah, Total
  const itemsText = currentCheckoutData.items.map((item, idx) => {
    return `• Item ${idx + 1}: *${item.name}*\n  - Tipe/Durasi: ${item.duration} (${item.via})\n  - Harga Satuan: ${formatRupiah(item.price)}\n  - Jumlah: ${item.qty}x\n  - Subtotal: ${formatRupiah(item.total)}`;
  }).join("\n\n");

  let buktiPembayaranText = "";
  if (photoUrl) {
    buktiPembayaranText = 
`📸 *FOTO BUKTI PEMBAYARAN:*
• Status: Lunas & Terverifikasi
• Masa Aktif Link Foto: 2 Hari (48 Jam)
• Link Foto Bukti Transfer:
${photoUrl}
_(Silakan klik link foto di atas untuk langsung membuka gambar bukti transfer sah)_`;
  } else {
    buktiPembayaranText = 
`📸 *BUKTI PEMBAYARAN:*
• Status: Foto bukti telah di-upload (${uploadedProofData.name} - ${uploadedProofData.size})
• Gambar bukti transfer terlampir pada chat WhatsApp ini.`;
  }

  let capcutAccountLine = "";
  if (isCapcutGroupVisible && capcutAccount) {
    capcutAccountLine = `\n• Nama Akun CapCut: ${capcutAccount}`;
  }

  const message = 
`Halo Admin *${CONFIG.storeName}*, saya ingin konfirmasi checkout pesanan akun:

━━━━━━━━━━━━━━━━━━━━━
📦 *RINCIAN ITEM:*
${itemsText}
━━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL HARGA:* ${formatRupiah(currentCheckoutData.total)}
💳 *METODE PEMBAYARAN:* ${methodTitle}
━━━━━━━━━━━━━━━━━━━━━
👤 *DATA PEMBELI:*
• Nama: ${name}
• No. WhatsApp: ${wa}
• Email Akun: ${email}${capcutAccountLine}
━━━━━━━━━━━━━━━━━━━━━
${buktiPembayaranText}
━━━━━━━━━━━━━━━━━━━━━

Mohon segera diproses dan dikirimkan akunnya ya admin, terima kasih!`;

  // Langsung buka chat WhatsApp ke nomor Admin (087795172347) tanpa menu share
  const waUrl = `https://wa.me/${CONFIG.adminWhatsApp}?text=${encodeURIComponent(message)}`;
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = waUrl;
  } else {
    window.open(waUrl, "_blank");
  }

  // Kembalikan tombol ke kondisi semula
  if (btnSubmitOrder) {
    btnSubmitOrder.disabled = false;
    btnSubmitOrder.innerHTML = originalBtnHtml;
  }

  // Jika checkout dari keranjang, kosongkan keranjang
  if (currentCheckoutData.source === 'cart') {
    cartItems = [];
    saveCart();
    updateCartUI();
  }

  closeCheckoutModal();

  if (photoUrl) {
    showToast("Link foto bukti transfer & rincian pesanan berhasil masuk ke WhatsApp!", "fa-circle-check");
  } else if (isCopiedToClipboard) {
    showToast("Foto bukti transfer tersalin di clipboard! Tekan Ctrl+V di chat WhatsApp.", "fa-circle-check");
  } else {
    showToast("Pesanan dialihkan ke WhatsApp! Silakan kirimkan foto bukti transfer Anda di chat.", "fa-circle-check");
  }
}



// ===================================================
// TOAST NOTIFICATION UTILITY
// ===================================================
function showToast(message, icon = "fa-circle-check") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ===================================================
// EXPOSE GLOBAL FUNCTIONS FOR INLINE HTML ATTRIBUTES
// ===================================================
window.openCheckoutModal = openCheckoutModal;
window.closeCheckoutModal = closeCheckoutModal;
window.selectCheckoutMethod = selectCheckoutMethod;
window.copyRekening = copyRekening;
window.handleProofUpload = handleProofUpload;
window.removeProofUpload = removeProofUpload;
window.resetProofUpload = resetProofUpload;
window.processOrderToWhatsApp = processOrderToWhatsApp;
window.handleViaChange = handleViaChange;
window.handleDurationChange = handleDurationChange;
window.openOrderModal = openOrderModal;
window.closeModal = closeModal;
window.openCart = openCart;
window.closeCart = closeCart;
window.removeCartItem = removeCartItem;
window.downloadQris = downloadQris;

// ===================================================
// CUSTOMER SERVICE (CS) AI CHATBOT - GEMINI INTEGRATION
// Melayani Komplain, Garansi, & Pertanyaan Akun Premium
// ===================================================
const CS_GEMINI_CONFIG = {
  apiKey: "", // Masukkan API Key Gemini Anda di sini atau gunakan .env
  models: ["gemini-3.6-flash", "gemini-flash-latest", "gemini-2.5-pro"],
  apiEndpoint: "https://generativelanguage.googleapis.com/v1beta/models"
};

let csConversationHistory = [];
let isCsGenerating = false;

// Format ringkasan katalog produk untuk AI
function buildCsCatalogContext() {
  if (typeof PRODUCTS === "undefined" || !Array.isArray(PRODUCTS)) return "";
  return PRODUCTS.map(p => {
    const durList = (p.durations || []).map(d => `${d.name}: ${formatRupiah(d.price)} (garansi: ${d.warranty || p.warranty})`).join(", ");
    return `- ${p.name} [Kategori: ${p.category}] | Harga mulai: ${formatRupiah(p.currentPrice || 0)} | Pilihan durasi: [${durList}] | Stok: ${p.stock > 0 ? 'Tersedia (' + p.stock + ')' : 'Kosong'}.`;
  }).join("\n");
}

// System Instruction untuk Gemini AI
function getCsSystemInstruction() {
  const catalog = buildCsCatalogContext();
  return `Kamu adalah "Customer Service AI Resmi ChaizStore" (Layanan Pelanggan Akun Premium Terpercaya di Indonesia).
Tugas utamamu adalah melayani pembeli dan calon pembeli dengan ramah, santun, responsif, solutif, dan berempati tinggi, terutama mengenai:
1. KOMPLAIN & KENDALA AKUN (Garansi)
2. PERTANYAAN CARA BELI & PEMBAYARAN
3. CEK HARGA & DAFTAR PRODUK AKUN PREMIUM

[INFORMASI PENTING TOKO CHAIZSTORE]
- Nama Toko: ChaizStore
- CS / WhatsApp Admin Resmi: 087795172347 (https://wa.me/6287795172347)
- Metode Pembayaran: QRIS Otomatis All Payment (Mendukung BCA, Mandiri, BRI, BNI, BSI, CIMB, GoPay, OVO, DANA, ShopeePay, LinkAja, dll).
- Pengiriman Akun: Kilat 1 - 5 menit via WhatsApp setelah pembayaran diverifikasi.

[KEBIJAKAN GARANSI & PENANGANAN KOMPLAIN]
- Full Garansi: Semua akun bergaransi penuh selama durasi pembelian.
- Kendala yang Dilindungi: Akun revert/turun ke free, kena hold, logout tiba-tiba, atau password tidak bisa digunakan.
- Prosedur Klaim Garansi:
  1. Pembeli cukup menyiapkan invoice/nama produk dan screenshot bukti error/kendala.
  2. Kirimkan langsung ke WhatsApp Admin di 087795172347 (https://wa.me/6287795172347).
  3. Admin akan segera mengganti dengan akun baru secepatnya (proses 1-10 menit).
- Syarat Garansi Tetap Berlaku: Pembeli dilarang mengubah email/password akun sharing atau mengutak-atik profil pengguna lain.

[KATALOG PRODUK & HARGA SAAT INI]
${catalog}

[CARA MEMBELI]
1. Pilih produk akun di katalog web ChaizStore.
2. Klik tombol "Beli Sekarang", tentukan durasi dan varian.
3. Masukkan Nama & Nomor WhatsApp pembeli.
4. Scan QRIS dan lakukan pembayaran.
5. Konfirmasi bukti ke WhatsApp Admin (087795172347), akun langsung dikirim.

[GAYA BAHASA & FORMAT JAWABAN]
- Gunakan Bahasa Indonesia yang ramah dan hangat (gunakan sapaan "Kak" atau "Kakak").
- Tunjukkan empati tinggi jika user sedang komplain (contoh: "Mohon maaf sekali atas kendala yang dialami ya kak, tenang saja akun di ChaizStore bergaransi penuh 100%...").
- Gunakan format markdown rapi (teks tebal, bullet list point, emoji) agar mudah dibaca di smartphone.
- Jika ada hal teknis yang memerlukan pergantian akun langsung oleh admin manusia, sertakan link WhatsApp Admin: https://wa.me/6287795172347.`;
}

// Buka / Tutup Chat Widget
function toggleCsChat(forceOpen) {
  const widget = document.getElementById("csChatWidget");
  const btn = document.getElementById("floatingCsBtn");
  const input = document.getElementById("csChatInput");
  if (!widget) return;

  const shouldOpen = forceOpen !== undefined ? forceOpen : widget.classList.contains("hidden");

  if (shouldOpen) {
    widget.classList.remove("hidden");
    widget.setAttribute("aria-hidden", "false");
    if (btn) btn.classList.add("active");
    scrollCsChatToBottom();
    if (input) {
      setTimeout(() => input.focus(), 150);
    }
  } else {
    widget.classList.add("hidden");
    widget.setAttribute("aria-hidden", "true");
    if (btn) btn.classList.remove("active");
  }
}

// Auto scroll ke pesan paling bawah
function scrollCsChatToBottom() {
  const body = document.getElementById("csChatBody");
  if (body) {
    setTimeout(() => {
      body.scrollTop = body.scrollHeight;
    }, 50);
  }
}

// Kirim pesan cepat dari suggestion chips
function sendCsQuickMessage(promptText) {
  submitCsMessage(promptText);
}

// Handle submit form
function handleCsSubmit(event) {
  if (event) event.preventDefault();
  const input = document.getElementById("csChatInput");
  if (!input) return;
  const message = input.value.trim();
  if (!message) return;
  submitCsMessage(message);
}

// Handle keydown (Enter to send, Shift+Enter for newline)
function handleCsInputKeydown(event) {
  const textarea = event.target;
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    handleCsSubmit(event);
  } else {
    // Auto adjust height
    setTimeout(() => {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 90) + "px";
    }, 0);
  }
}

// Parser Markdown sederhana dan aman untuk pesan AI
function formatCsMarkdown(rawText) {
  if (!rawText) return "";
  
  // Escape HTML
  let text = rawText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks
  text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italic
  text = text.replace(/(^|[^\*])\*([^\*]+)\*(?!\*)/g, '$1<em>$2</em>');
  text = text.replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1<em>$2</em>');

  // Markdown Links [Label](url)
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="cs-msg-link">$1</a>');

  // Auto link URLs (https://wa.me/...)
  text = text.replace(/(^|[^\w"'])(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer" class="cs-msg-link">$2</a>');

  // Format baris dan list
  const lines = text.split("\n");
  let inUl = false;
  let inOl = false;
  let htmlLines = [];

  for (let line of lines) {
    const trimmed = line.trim();
    const ulMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);

    if (ulMatch) {
      if (!inUl) {
        if (inOl) { htmlLines.push('</ol>'); inOl = false; }
        htmlLines.push('<ul class="cs-msg-list">');
        inUl = true;
      }
      htmlLines.push(`<li>${ulMatch[1]}</li>`);
    } else if (olMatch) {
      if (!inOl) {
        if (inUl) { htmlLines.push('</ul>'); inUl = false; }
        htmlLines.push('<ol class="cs-msg-list">');
        inOl = true;
      }
      htmlLines.push(`<li>${olMatch[2]}</li>`);
    } else {
      if (inUl) { htmlLines.push('</ul>'); inUl = false; }
      if (inOl) { htmlLines.push('</ol>'); inOl = false; }

      if (trimmed === "") {
        htmlLines.push('<div class="cs-msg-spacer"></div>');
      } else {
        htmlLines.push(`<p>${line}</p>`);
      }
    }
  }

  if (inUl) htmlLines.push('</ul>');
  if (inOl) htmlLines.push('</ol>');

  return htmlLines.join("\n");
}

// Tambah bubble pesan ke chat
function appendCsMessage(sender, text) {
  const container = document.getElementById("csChatMessages");
  if (!container) return;

  const msgDiv = document.createElement("div");
  msgDiv.className = `cs-message cs-message-${sender}`;

  if (sender === "user") {
    msgDiv.innerHTML = `
      <div class="cs-msg-content">
        <p>${text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</p>
      </div>
    `;
  } else {
    msgDiv.innerHTML = `
      <div class="cs-msg-avatar"><i class="fa-solid fa-robot"></i></div>
      <div class="cs-msg-content">
        ${formatCsMarkdown(text)}
      </div>
    `;
  }

  container.appendChild(msgDiv);
  scrollCsChatToBottom();
}

// Proses pengiriman pesan ke Gemini API
async function submitCsMessage(messageText) {
  if (isCsGenerating || !messageText.trim()) return;

  const input = document.getElementById("csChatInput");
  const sendBtn = document.getElementById("csBtnSend");
  const typingIndicator = document.getElementById("csTypingIndicator");

  // Pastikan modal terbuka
  toggleCsChat(true);

  // Tampilkan pesan user
  appendCsMessage("user", messageText);

  // Reset input field
  if (input) {
    input.value = "";
    input.style.height = "auto";
  }

  // Set loading state
  isCsGenerating = true;
  if (sendBtn) sendBtn.disabled = true;
  if (input) input.disabled = true;
  if (typingIndicator) typingIndicator.classList.remove("hidden");
  scrollCsChatToBottom();

  // Siapkan payload Gemini API
  const systemPrompt = getCsSystemInstruction();
  const requestContents = [
    ...csConversationHistory.slice(-10), // simpan konteks hingga 10 riwayat sebelumnya
    {
      role: "user",
      parts: [{ text: messageText }]
    }
  ];

  const payload = {
    contents: requestContents,
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000
    }
  };

  let replyText = null;

  // Coba memanggil model secara berurutan jika ada model yang perlu fallback
  for (const modelName of CS_GEMINI_CONFIG.models) {
    try {
      const url = `${CS_GEMINI_CONFIG.apiEndpoint}/${modelName}:generateContent?key=${CS_GEMINI_CONFIG.apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
          replyText = data.candidates[0].content.parts.map(p => p.text).join("");
          break;
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        console.warn(`Gemini model ${modelName} returned error:`, errData);
      }
    } catch (err) {
      console.warn(`Failed to connect with ${modelName}:`, err);
    }
  }

  // Sembunyikan typing indicator
  if (typingIndicator) typingIndicator.classList.add("hidden");
  isCsGenerating = false;
  if (sendBtn) sendBtn.disabled = false;
  if (input) {
    input.disabled = false;
    input.focus();
  }

  if (replyText) {
    // Simpan ke riwayat percakapan
    csConversationHistory.push({
      role: "user",
      parts: [{ text: messageText }]
    });
    csConversationHistory.push({
      role: "model",
      parts: [{ text: replyText }]
    });

    appendCsMessage("bot", replyText);
  } else {
    // Pesan fallback ramah jika terjadi gangguan koneksi
    appendCsMessage(
      "bot",
      "Mohon maaf kak, sistem CS AI sedang mengalami sedikit kendala jaringan. Jangan khawatir! Kamu bisa langsung konsultasi garansi atau keluhan ke WhatsApp Admin resmi kami di [087795172347](https://wa.me/6287795172347) ya! 🙏"
    );
  }
}

// Expose CS Chat functions ke window
window.toggleCsChat = toggleCsChat;
window.sendCsQuickMessage = sendCsQuickMessage;
window.handleCsSubmit = handleCsSubmit;
window.handleCsInputKeydown = handleCsInputKeydown;
window.submitCsMessage = submitCsMessage;

