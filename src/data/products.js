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
    stock: 0,
    outOfStock: true,
    warranty: "Habis / Stok Kosong",
    badge: "Stok Kosong",
    badgeClass: "badge-sealed",
    isFlashSale: false,
    oldPrice: 15000,
    currentPrice: 6000,
    priceNote: "Habis / Stok Kosong",
    features: [
      "Keterangan: Habis / Stok Kosong",
      "Durasi: 1 Bulan Penuh",
      "Garansi: 1 Bulan Penggantian",
      "Bebas Iklan di Semua Video & Musik",
      "Background Play & Download Offline",
      "Hubungi CS WhatsApp jika ingin PO Restock"
    ],
    durations: [
      { id: "1m", name: "1 Bulan", price: 6000, warranty: "1 Bulan", tag: "Stok Kosong", outOfStock: true }
    ]
  },
  {
    id: "capcut-pro",
    name: "CapCut Pro Video Editor",
    category: "produktivitas",
    icon: "fa-solid fa-scissors",
    iconColor: "#14b8a6",
    image: "capcut.png",
    stock: 10,
    warranty: "1 Bulan",
    badge: "Editor VIP",
    badgeClass: "badge-bestseller",
    isFlashSale: false,
    oldPrice: 35000,
    currentPrice: 26000,
    features: [
      "Durasi: 1 Bulan Penuh",
      "Garansi: 1 Bulan Penggantian Penuh",
      "Semua Efek & Transisi VIP Terbuka",
      "Auto Caption ID & Ekspor 4K 60fps",
      "Bebas Watermark & Template VIP Lengkap"
    ],
    durations: [
      { id: "1m", name: "1 Bulan", price: 26000, warranty: "1 Bulan", tag: "VIP Pro" }
    ]
  },
  {
    id: "gemini-advanced",
    name: "Gemini Pro (Google AI)",
    category: "ai",
    icon: "fa-solid fa-wand-magic-sparkles",
    iconColor: "#38bdf8",
    image: "gemini.png",
    stock: 20,
    warranty: "1 Bulan / 1 Tahun",
    badge: "1 Bln & 1 Thn",
    badgeClass: "badge-flash",
    isFlashSale: true,
    oldPrice: 15000,
    currentPrice: 5000,
    priceNote: "1 Bln Rp 5.000 • 1 Thn Rp 35.000",
    features: [
      "Paket 1: 1 Bulan Rp 5.000",
      "Paket 2: 1 Tahun Rp 35.000 (Privat)",
      "Garansi: Sesuai Pilihan Durasi Paket",
      "Akses Model Gemini 1.5 Pro & Canggih",
      "Penyimpanan Cloud Google One 2TB",
      "Bisa untuk Riset Dokumen, AI & Koding Cepat"
    ],
    durations: [
      { id: "1m", name: "1 Bulan (Paket 1)", price: 5000, warranty: "1 Bulan", tag: "Rp 5.000/bln" },
      { id: "1y", name: "1 Tahun (Privat)", price: 35000, warranty: "1 Tahun", tag: "Rp 35.000/thn" }
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
    stock: 15,
    warranty: "1 Bulan",
    badge: "Via Profil",
    badgeClass: "badge-bestseller",
    isFlashSale: true,
    oldPrice: 45000,
    currentPrice: 30000,
    features: [
      "Durasi: 1 Bulan (Via Profil)",
      "Garansi: 1 Bulan Penuh Anti On-Hold",
      "1 User 1 Profil Sendiri (Bisa Pasang PIN)",
      "Kualitas Ultra HD 4K + HDR Resmi",
      "Bisa Nonton di HP, Laptop, Tablet & TV"
    ],
    durations: [
      { id: "1m-profile", name: "1 Bulan (Via Profil)", price: 30000, warranty: "1 Bulan", tag: "1 User 1 Profil" }
    ]
  },
  {
    id: "viu-prem",
    name: "VIU Premium",
    category: "streaming",
    icon: "fa-solid fa-video",
    iconColor: "#eab308",
    image: "viu.png",
    stock: 2000,
    warranty: "1 Bulan",
    badge: "Ready 2000+",
    badgeClass: "badge-bestseller",
    isFlashSale: false,
    oldPrice: 10000,
    currentPrice: 3000,
    features: [
      "Durasi: 1 Bulan Penuh",
      "Garansi: 1 Bulan Penggantian Penuh",
      "Nonton Drama Korea, Anime & Asia Lengkap",
      "Bebas Iklan & Subtitle Indonesia Resmi",
      "Kualitas Jernih Full HD di Semua Perangkat"
    ],
    durations: [
      { id: "1m", name: "1 Bulan", price: 3000, warranty: "1 Bulan", tag: "Populer" }
    ]
  },
  {
    id: "bstation-prem",
    name: "Bstation (Bilibili Premium)",
    category: "streaming",
    icon: "fa-solid fa-tv",
    iconColor: "#0284c7",
    image: "bstation.png",
    stock: 0,
    outOfStock: true,
    warranty: "Habis / Stok Kosong",
    badge: "Stok Kosong",
    badgeClass: "badge-sealed",
    isFlashSale: false,
    oldPrice: 15000,
    currentPrice: 7000,
    priceNote: "Habis / Stok Kosong",
    features: [
      "Keterangan: Habis / Stok Kosong",
      "Pilihan: 1 Bulan Sharing & 1 Bulan Privat",
      "Garansi: 1 Bulan Penggantian Penuh",
      "Nonton Anime Kualitas 1080p / 4K UHD",
      "Bebas Iklan & Download Video Offline",
      "Hubungi CS WhatsApp jika ingin PO Restock"
    ],
    durations: [
      { id: "1m-sharing", name: "1 Bulan Sharing", price: 7000, warranty: "1 Bulan", tag: "Stok Kosong", outOfStock: true },
      { id: "1m-privat", name: "1 Bulan Privat", price: 10000, warranty: "1 Bulan", tag: "Stok Kosong", outOfStock: true }
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
