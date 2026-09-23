export const PRODUCTS = [
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
