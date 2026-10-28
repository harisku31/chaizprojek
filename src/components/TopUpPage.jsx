import React, { useState } from 'react';
import { formatRupiah } from '../utils/format';

const BANNER_PARTICLES = [
  { id: 1, left: '6%', top: '32%', size: 5, delay: '0s', dur: '2.8s', color: 'cyan' },
  { id: 2, left: '14%', top: '68%', size: 6, delay: '0.4s', dur: '3.2s', color: 'blue' },
  { id: 3, left: '22%', top: '22%', size: 4, delay: '0.9s', dur: '2.4s', color: 'white' },
  { id: 4, left: '29%', top: '75%', size: 7, delay: '1.3s', dur: '3.5s', color: 'purple' },
  { id: 5, left: '36%', top: '38%', size: 5, delay: '0.2s', dur: '2.6s', color: 'cyan' },
  { id: 6, left: '44%', top: '62%', size: 6, delay: '1.7s', dur: '3.1s', color: 'blue' },
  { id: 7, left: '51%', top: '18%', size: 4, delay: '0.6s', dur: '2.5s', color: 'white' },
  { id: 8, left: '58%', top: '80%', size: 7, delay: '2.1s', dur: '3.6s', color: 'purple' },
  { id: 9, left: '65%', top: '45%', size: 5, delay: '0.8s', dur: '2.9s', color: 'cyan' },
  { id: 10, left: '72%', top: '28%', size: 6, delay: '1.4s', dur: '3.3s', color: 'blue' },
  { id: 11, left: '79%', top: '72%', size: 4, delay: '0.3s', dur: '2.4s', color: 'white' },
  { id: 12, left: '86%', top: '35%', size: 7, delay: '1.8s', dur: '3.4s', color: 'purple' },
  { id: 13, left: '93%', top: '65%', size: 5, delay: '0.5s', dur: '2.7s', color: 'cyan' },
  { id: 14, left: '10%', top: '50%', size: 6, delay: '1.1s', dur: '3.0s', color: 'blue' },
  { id: 15, left: '18%', top: '15%', size: 4, delay: '1.6s', dur: '2.5s', color: 'white' },
  { id: 16, left: '26%', top: '85%', size: 5, delay: '0.7s', dur: '3.2s', color: 'cyan' },
  { id: 17, left: '33%', top: '55%', size: 7, delay: '2.0s', dur: '3.7s', color: 'purple' },
  { id: 18, left: '41%', top: '28%', size: 4, delay: '1.0s', dur: '2.6s', color: 'white' },
  { id: 19, left: '48%', top: '70%', size: 6, delay: '0.3s', dur: '3.1s', color: 'blue' },
  { id: 20, left: '55%', top: '42%', size: 5, delay: '1.5s', dur: '2.8s', color: 'cyan' }
];

const SECTION_PARTICLES = [
  { id: 101, left: '8%', top: '15%', size: 6, delay: '0.2s', dur: '3.4s', color: 'cyan' },
  { id: 102, left: '20%', top: '40%', size: 5, delay: '1.1s', dur: '3.8s', color: 'blue' },
  { id: 103, left: '35%', top: '20%', size: 7, delay: '0.5s', dur: '3.2s', color: 'white' },
  { id: 104, left: '50%', top: '60%', size: 6, delay: '1.8s', dur: '3.6s', color: 'purple' },
  { id: 105, left: '65%', top: '25%', size: 5, delay: '0.9s', dur: '3.0s', color: 'cyan' },
  { id: 106, left: '80%', top: '45%', size: 7, delay: '1.5s', dur: '3.5s', color: 'blue' },
  { id: 107, left: '92%', top: '20%', size: 4, delay: '0.3s', dur: '2.8s', color: 'white' },
  { id: 108, left: '15%', top: '75%', size: 6, delay: '2.0s', dur: '3.7s', color: 'purple' },
  { id: 109, left: '30%', top: '85%', size: 5, delay: '0.7s', dur: '3.1s', color: 'cyan' },
  { id: 110, left: '45%', top: '35%', size: 6, delay: '1.3s', dur: '3.3s', color: 'blue' },
  { id: 111, left: '60%', top: '80%', size: 7, delay: '2.2s', dur: '3.9s', color: 'purple' },
  { id: 112, left: '75%', top: '70%', size: 4, delay: '0.4s', dur: '2.9s', color: 'white' },
  { id: 113, left: '88%', top: '85%', size: 6, delay: '1.6s', dur: '3.4s', color: 'cyan' },
  { id: 114, left: '5%', top: '55%', size: 5, delay: '1.0s', dur: '3.2s', color: 'blue' }
];

export default function TopUpPage({
  onBackToStore,
  onOpenSteamMenu,
  onOpenRobloxMenu,
  onShowToast,
  authUser,
  isBanned = false,
  onOpenLogin,
  onOpenBannedModal
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGameForModal, setSelectedGameForModal] = useState(null);

  // Form State untuk Modal Order Top Up Game
  const [gameUserId, setGameUserId] = useState('');
  const [gameZoneId, setGameZoneId] = useState('');
  const [selectedPackageIndex, setSelectedPackageIndex] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState('qris');

  const categories = [
    { id: 'all', label: 'Semua Layanan (6)', icon: 'fa-border-all' },
    { id: 'steam', label: 'Steam Games', icon: 'fa-brands fa-steam' },
    { id: 'roblox', label: 'Roblox & Robux', icon: 'fa-solid fa-cube' },
    { id: 'mobile', label: 'Game Mobile', icon: 'fa-solid fa-mobile-screen-button' },
    { id: 'pc', label: 'PC & Voucher', icon: 'fa-solid fa-gamepad' }
  ];

  // Daftar Layanan Top Up Lengkap dengan Visual Premium
  const TOPUP_SERVICES = [
    {
      id: 'steam-game-valve',
      name: 'Steam Key Game Resmi Valve',
      category: 'steam',
      badge: '4 Varian Game',
      badgeClass: 'badge-bestseller',
      image: 'banner-steam.png',
      desc: 'Pusat Steam Key resmi Valve. Tersedia paket Original Key, Epic Tier, NSFW 18+, dan Hanimetai.',
      features: [
        'Tersedia 4 Varian Paket (Original, Epic Tier, NSFW 18+, Hanimetai)',
        'Aktivasi Global Permanen di Library Steam PC / Laptop',
        '100% Legal & Bergaransi Kode Valid Resmi Valve'
      ],
      price: 1500,
      priceNote: 'Mulai Rp 1.500',
      unit: 'key',
      stock: 50,
      isSteamMenuTrigger: true,
      buttonText: 'Buka Menu Steam (4 Paket)',
      buttonIcon: 'fa-brands fa-steam',
      accentColor: '#66c0f4'
    },
    {
      id: 'topup-roblox',
      name: 'Roblox (Robux Instant via Username)',
      category: 'roblox',
      badge: 'Robux Murah',
      badgeClass: 'badge-bestseller',
      image: 'roblox.png',
      desc: 'Pusat isi saldo Robux Roblox via Username. Tersedia paket 50r hingga 500r proses cepat, aman & legal 100% tanpa password.',
      features: [
        'Top Up Robux via Username (Tanpa Password, 100% Aman)',
        'Pilihan Lengkap 50r, 100r, 200r, 300r, 400r, 500r',
        'Garansi Masuk & Proses Kilat Otomatis 5 - 15 Menit'
      ],
      price: 11000,
      priceNote: 'Mulai Rp 11.000',
      unit: 'robux',
      stock: 2000,
      isRobloxMenuTrigger: true,
      buttonText: 'Buka Menu Roblox (6 Paket)',
      buttonIcon: 'fa-solid fa-cube',
      accentColor: '#a855f7'
    },
    {
      id: 'topup-mlbb',
      name: 'Mobile Legends: Bang Bang (MLBB)',
      category: 'mobile',
      badge: 'Kilat Otomatis',
      badgeClass: 'badge-bestseller',
      image: null,
      icon: 'fa-solid fa-shield-halved',
      iconColor: '#38bdf8',
      desc: 'Top up Diamond Mobile Legends resmi server Indonesia. Masukkan User ID & Zone ID, diamond otomatis terkirim.',
      features: [
        'Top Up Cukup Pakai User ID & Zone ID Game',
        'Tersedia Weekly Diamond Pass & Diamond Harian',
        'Server Indonesia 100% Legal Moonton & Bebas Minus'
      ],
      price: 15000,
      priceNote: 'Mulai Rp 15.000',
      unit: 'paket',
      stock: 999,
      buttonText: 'Pilih Nominal Diamond',
      buttonIcon: 'fa-solid fa-gem',
      accentColor: '#38bdf8',
      packages: [
        { name: 'Weekly Diamond Pass (WDP)', price: 27500, desc: 'Klaim diamond harian + benefit eksklusif' },
        { name: '86 Diamonds (78 + 8 Bonus)', price: 19500, desc: 'Proses otomatis 1-3 menit' },
        { name: '172 Diamonds (156 + 16 Bonus)', price: 38500, desc: 'Proses otomatis 1-3 menit' },
        { name: '257 Diamonds (234 + 23 Bonus)', price: 57500, desc: 'Proses otomatis 1-3 menit' },
        { name: '344 Diamonds (312 + 32 Bonus)', price: 76500, desc: 'Proses otomatis 1-3 menit' },
        { name: '706 Diamonds (625 + 81 Bonus)', price: 152000, desc: 'Paket Sultan - Bonus Besar' }
      ]
    },
    {
      id: 'topup-freefire',
      name: 'Free Fire (FF Diamonds Resmi)',
      category: 'mobile',
      badge: 'Fast 1-3 Mnt',
      badgeClass: 'badge-bestseller',
      image: null,
      icon: 'fa-solid fa-fire',
      iconColor: '#f97316',
      desc: 'Isi Diamond Free Fire resmi Garena langsung masuk hanya dengan Player ID akun FF Anda.',
      features: [
        'Top Up Cukup Masukkan Player ID Free Fire',
        'Diamond Resmi Garena & Masuk Otomatis Detik Itu Juga',
        'Bisa Borong Event Bundle & Elite Pass Terbaru'
      ],
      price: 10000,
      priceNote: 'Mulai Rp 10.000',
      unit: 'paket',
      stock: 999,
      buttonText: 'Pilih Nominal Diamond FF',
      buttonIcon: 'fa-solid fa-fire',
      accentColor: '#f97316',
      packages: [
        { name: '140 Diamonds FF', price: 19000, desc: 'Proses kilat 1-3 menit' },
        { name: '355 Diamonds FF', price: 47000, desc: 'Proses kilat 1-3 menit' },
        { name: '720 Diamonds FF', price: 94000, desc: 'Paket Populer Event' },
        { name: 'Member Mingguan FF', price: 29000, desc: 'Klaim diamond setiap hari' },
        { name: 'Member Bulanan FF', price: 145000, desc: 'Hemat 4x lipat sebulan penuh' }
      ]
    },
    {
      id: 'topup-valorant',
      name: 'Valorant Points (VP Riot Games)',
      category: 'pc',
      badge: 'Riot Points',
      badgeClass: 'badge-bestseller',
      image: null,
      icon: 'fa-solid fa-crosshairs',
      iconColor: '#f43f5e',
      desc: 'Top up Riot Points / Valorant Points untuk skin senjata & Battle Pass terbaru akun Valorant server ID.',
      features: [
        'Riot Points Server Indonesia & Asia Pasifik',
        'Cukup Masukkan Riot ID & Tagline (Misal: User#123)',
        'Garansi Kode Resmi & VP Masuk Instan'
      ],
      price: 15000,
      priceNote: 'Mulai Rp 15.000',
      unit: 'paket',
      stock: 999,
      buttonText: 'Pilih Nominal VP',
      buttonIcon: 'fa-solid fa-crosshairs',
      accentColor: '#f43f5e',
      packages: [
        { name: '125 Valorant Points', price: 15000, desc: 'Proses otomatis 1-5 menit' },
        { name: '420 Valorant Points', price: 49000, desc: 'Proses otomatis 1-5 menit' },
        { name: '700 Valorant Points', price: 80000, desc: 'Proses otomatis 1-5 menit' },
        { name: '1375 Valorant Points', price: 155000, desc: 'Paket Populer Skin Senjata' },
        { name: '2400 Valorant Points', price: 265000, desc: 'Paket Sultan Valorant' }
      ]
    },
    {
      id: 'topup-genshin',
      name: 'Genshin Impact (Genesis Crystals / Blessing)',
      category: 'mobile',
      badge: 'Blessing Welkin',
      badgeClass: 'badge-bestseller',
      image: null,
      icon: 'fa-solid fa-star',
      iconColor: '#ec4899',
      desc: 'Top up Blessing of the Welkin Moon & Genesis Crystals Genshin Impact via UID & Server HoYoverse.',
      features: [
        'Top Up Cukup Pakai UID & Pilih Server HoYoverse',
        'Tersedia Blessing of the Welkin Moon & Genesis Crystals',
        '100% Legal HoYoverse Tanpa Login Password'
      ],
      price: 16000,
      priceNote: 'Mulai Rp 16.000',
      unit: 'paket',
      stock: 999,
      buttonText: 'Pilih Paket Genshin',
      buttonIcon: 'fa-solid fa-star',
      accentColor: '#ec4899',
      packages: [
        { name: 'Blessing of the Welkin Moon', price: 79000, desc: '300 Genesis Crystals + 2700 Primogems' },
        { name: '60 Genesis Crystals', price: 16000, desc: 'Proses cepat via UID' },
        { name: '300 + 30 Genesis Crystals', price: 79000, desc: 'Bonus ekstra crystal' },
        { name: '980 + 110 Genesis Crystals', price: 239000, desc: 'Paket Populer Gacha' }
      ]
    }
  ];

  const filteredServices = TOPUP_SERVICES.filter((svc) => {
    const matchCategory = activeCategory === 'all' || svc.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchCategory;
    return (
      matchCategory &&
      (svc.name.toLowerCase().includes(q) ||
        svc.desc.toLowerCase().includes(q) ||
        svc.badge.toLowerCase().includes(q) ||
        svc.features.some((f) => f.toLowerCase().includes(q)))
    );
  });

  const handleCardClick = (service) => {
    if (service.isSteamMenuTrigger) {
      if (onOpenSteamMenu) onOpenSteamMenu();
      else window.location.hash = 'steam';
    } else if (service.isRobloxMenuTrigger) {
      if (onOpenRobloxMenu) onOpenRobloxMenu();
      else window.location.hash = 'roblox';
    } else if (service.packages) {
      setSelectedGameForModal(service);
      setSelectedPackageIndex(0);
      setGameUserId('');
      setGameZoneId('');
    }
  };

  const handleOrderSubmit = (e) => {
    e.preventDefault();
    if (!selectedGameForModal) return;

    if (!gameUserId.trim()) {
      onShowToast?.('Harap masukkan User ID akun game Anda!', 'fa-circle-exclamation text-warning');
      return;
    }

    const pkg = selectedGameForModal.packages[selectedPackageIndex] || selectedGameForModal.packages[0];
    const fullId = gameZoneId.trim() ? `${gameUserId.trim()} (${gameZoneId.trim()})` : gameUserId.trim();

    const waText = encodeURIComponent(
      `Halo Admin ChaizStore! Saya ingin order Top Up Game:\n\n` +
      `🎮 Game: ${selectedGameForModal.name}\n` +
      `📦 Paket: ${pkg.name} (${formatRupiah(pkg.price)})\n` +
      `🆔 User ID: ${fullId}\n` +
      `💳 Pembayaran: ${selectedPayment.toUpperCase()}\n\n` +
      `Mohon proses pesanan saya ya min. Terima kasih!`
    );

    window.open(`https://wa.me/6285236166487?text=${waText}`, '_blank');
    onShowToast?.(`Membuka WhatsApp untuk memproses pesanan ${pkg.name}!`, 'fa-whatsapp text-success');
    setSelectedGameForModal(null);
  };

  return (
    <div className="topup-page-container">
      {/* =========================================================================
          1. BACKGROUND AMBIENT WALLPAPER DENGAN ENERGETIC LIVING MOTION & PARTICLES
         ========================================================================= */}
      <div className="catalog-wallpaper-bg-wrap">
        <img
          src="/catalog-wallpaper.png?v=2"
          alt="ChaizStore Top Up Wallpaper"
          className="catalog-wallpaper-img living-motion"
          loading="eager"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith('banner.jpg')) {
              e.currentTarget.src = '/banner.jpg';
            }
          }}
        />
        {/* Ambient Section Cyber Aurora Waves */}
        <div className="catalog-fx-section-aurora"></div>
        <div className="catalog-fx-aurora-secondary"></div>

        {/* Ambient Floating Light Particles di Seluruh Section */}
        <div className="catalog-fx-particles section-ambient-particles">
          {SECTION_PARTICLES.map((p) => (
            <span
              key={`sec-${p.id}`}
              className={`cyber-particle particle-${p.color}`}
              style={{
                left: p.left,
                top: p.top,
                width: `${p.size + 1}px`,
                height: `${p.size + 1}px`,
                animationDelay: p.delay,
                animationDuration: p.dur
              }}
            />
          ))}
        </div>
        <div className="catalog-wallpaper-overlay"></div>
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 2, paddingTop: '28px' }}>
        {/* =========================================================================
            2. HERO SHOWCASE BANNER CARD (PERSIS SAMA DENGAN DESAIN AKUN PREMIUM)
           ========================================================================= */}
        <div className="catalog-hero-banner-card topup-hero-banner-card" style={{ marginBottom: '32px' }}>
          <div className="catalog-hero-banner-bg">
            <img
              src="/catalog-wallpaper.png?v=2"
              alt="ChaizStore Top Up Wallpaper"
              className="catalog-hero-banner-img living-motion"
              loading="eager"
            />
            {/* Multiple Dynamic Aurora Light Streams */}
            <div className="catalog-fx-aurora-stream"></div>
            <div className="catalog-fx-aurora-secondary"></div>
            <div className="catalog-fx-aurora-tertiary"></div>

            {/* Traveling Laser Energy Beams */}
            <div className="catalog-fx-energy-beam beam-1"></div>
            <div className="catalog-fx-energy-beam beam-2"></div>

            {/* Dense Animated Floating Cyber Particles */}
            <div className="catalog-fx-particles">
              {BANNER_PARTICLES.map((p) => (
                <span
                  key={p.id}
                  className={`cyber-particle particle-${p.color}`}
                  style={{
                    left: p.left,
                    top: p.top,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    animationDelay: p.delay,
                    animationDuration: p.dur
                  }}
                />
              ))}
            </div>

            {/* High-speed Light Sheen Sweep */}
            <div className="catalog-fx-sheen"></div>
            <div className="catalog-hero-banner-overlay"></div>
            <div className="catalog-hero-banner-glow"></div>
            <div className="catalog-hero-banner-glow-secondary"></div>
          </div>

          <div className="catalog-hero-banner-body">
            <div className="catalog-hero-banner-left">
              <div className="catalog-hero-banner-badge">
                <i className="fa-solid fa-bolt text-warning"></i>
                <span className="badge-desktop-label">CHAIZSTORE TOP UP CENTER • 100% LEGAL & PROSES OTOMATIS 1-3 MENIT</span>
                <span className="badge-mobile-label">⚡ Top Up Resmi 100% Legal</span>
              </div>

              <h2 className="catalog-hero-banner-title">
                Pusat Top Up Game & Saldo Favoritmu
              </h2>

              <p className="catalog-hero-banner-desc">
                Pusat isi saldo game resmi termurah dengan garansi 100%. Pilihan lengkap Steam Key game Valve (Original, Epic Tier, NSFW 18+, Hanimetai), Robux Roblox via Username tanpa password, Mobile Legends, Free Fire, Valorant, dan voucher digital favorit dengan proses kilat 1-3 menit langsung masuk!
              </p>

              <div className="catalog-hero-banner-perks">
                <span className="catalog-hero-perk">
                  <i className="fa-solid fa-bolt text-warning"></i> Proses Kilat 1-3 Menit
                </span>
                <span className="catalog-hero-perk">
                  <i className="fa-solid fa-shield-halved text-success"></i> 100% Legal & Bergaransi
                </span>
                <span className="catalog-hero-perk">
                  <i className="fa-solid fa-qrcode text-cyan"></i> QRIS All Payment (0% Fee)
                </span>
                <span className="catalog-hero-perk">
                  <i className="fa-brands fa-whatsapp text-emerald"></i> CS 24/7 Fast Response
                </span>
              </div>

              {/* Pilihan Khusus di Atas: [ Akun Premium ] vs [ Top Up ] */}
              <div className="catalog-hero-banner-toggle-row">
                <span className="catalog-toggle-label">
                  <i className="fa-solid fa-sliders"></i> Pilihan Layanan:
                </span>
                <div className="main-service-toggle">
                  <button
                    type="button"
                    className="service-toggle-btn"
                    onClick={onBackToStore}
                  >
                    <i className="fa-solid fa-crown text-warning"></i>
                    <span>Akun Premium</span>
                  </button>
                  <button
                    type="button"
                    className="service-toggle-btn active"
                  >
                    <i className="fa-solid fa-bolt text-cyan"></i>
                    <span>Top Up</span>
                    <span className="toggle-badge-kilat">KILAT</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Visual Floating Showcase Box */}
            <div className="catalog-hero-banner-right">
              <div className="catalog-visual-card">
                <div className="catalog-visual-card-glow"></div>
                <div className="catalog-visual-header">
                  <span className="visual-badge-pill">
                    <i className="fa-solid fa-bolt text-cyan"></i> Layanan Kilat 24 Jam Online
                  </span>
                </div>
                <div className="catalog-visual-apps topup-visual-apps">
                  <div
                    className="catalog-v-app"
                    onClick={onOpenSteamMenu}
                    style={{ cursor: 'pointer' }}
                    title="Buka Menu Steam"
                  >
                    <i className="fa-brands fa-steam text-cyan"></i>
                    <span>Steam</span>
                  </div>
                  <div
                    className="catalog-v-app"
                    onClick={onOpenRobloxMenu}
                    style={{ cursor: 'pointer' }}
                    title="Buka Menu Roblox"
                  >
                    <i className="fa-solid fa-cube text-purple"></i>
                    <span>Roblox</span>
                  </div>
                  <div className="catalog-v-app">
                    <i className="fa-solid fa-shield-halved text-warning"></i>
                    <span>MLBB</span>
                  </div>
                  <div className="catalog-v-app">
                    <i className="fa-solid fa-crosshairs text-danger"></i>
                    <span>Valorant</span>
                  </div>
                </div>
                <div className="catalog-visual-stats">
                  <div className="v-stat-col">
                    <strong>1-3 Mnt</strong>
                    <small>Otomatis</small>
                  </div>
                  <div className="v-stat-sep"></div>
                  <div className="v-stat-col">
                    <strong>100%</strong>
                    <small>Legal</small>
                  </div>
                  <div className="v-stat-sep"></div>
                  <div className="v-stat-col">
                    <strong>0% Fee</strong>
                    <small>Bebas Admin</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. SEARCH BAR & QUICK FILTERS
           ========================================================================= */}
        <div className="topup-filter-search-wrapper" style={{ marginBottom: '24px' }}>
          <div className="topup-search-box">
            <i className="fa-solid fa-magnifying-glass topup-search-icon"></i>
            <input
              type="text"
              className="topup-search-input"
              placeholder="Cari game, Steam, Robux, voucher, atau layanan top up..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="topup-search-clear"
                onClick={() => setSearchQuery('')}
                title="Hapus pencarian"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>
        </div>

        {/* Categories Filter Tabs */}
        <div className="category-tabs" id="topupCategoryTabs" style={{ marginBottom: '32px' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <i className={cat.icon}></i> {cat.label}
            </button>
          ))}
        </div>

        {/* =========================================================================
            4. PRODUCT GRID (LAYOUT PERSIS SAMA DENGAN CARD AKUN PREMIUM)
           ========================================================================= */}
        <div className="product-grid" style={{ minHeight: '360px' }}>
          {filteredServices.map((svc) => (
            <div
              key={svc.id}
              className={`product-card ${svc.image ? 'has-banner' : ''}`}
              onClick={() => handleCardClick(svc)}
              style={{ cursor: 'pointer' }}
            >
              <div className="card-top-bar">
                <div className="card-top-left">
                  <span
                    className="product-category-pill"
                    style={{
                      margin: 0,
                      background: `rgba(${svc.category === 'steam' ? '102, 192, 244' : svc.category === 'roblox' ? '168, 85, 247' : '56, 189, 248'}, 0.18)`,
                      color: svc.accentColor || '#38bdf8',
                      borderColor: `rgba(${svc.category === 'steam' ? '102, 192, 244' : svc.category === 'roblox' ? '168, 85, 247' : '56, 189, 248'}, 0.35)`
                    }}
                  >
                    <i
                      className={
                        svc.category === 'steam'
                          ? 'fa-brands fa-steam'
                          : svc.category === 'roblox'
                          ? 'fa-solid fa-cube'
                          : svc.icon || 'fa-solid fa-gamepad'
                      }
                    ></i>{' '}
                    {svc.category.toUpperCase()}
                  </span>
                </div>
                <span className={`badge-status ${svc.badgeClass}`}>{svc.badge}</span>
              </div>

              {/* Banner Image / Top Icon Showcase */}
              {svc.image ? (
                <div className="product-banner-wrap">
                  <img
                    src={`/${svc.image}`}
                    alt={svc.name}
                    className="product-banner-img"
                    loading="lazy"
                  />
                  <div className="product-banner-overlay">
                    <span className="product-category-pill">LAYANAN RESMI</span>
                    <h3 className="product-banner-title">{svc.name}</h3>
                  </div>
                </div>
              ) : (
                <div className="product-info" style={{ padding: '24px 20px 10px' }}>
                  <div
                    className="product-icon-wrap"
                    style={{
                      color: svc.iconColor || '#38bdf8',
                      background: 'rgba(255, 255, 255, 0.05)',
                      marginBottom: '12px'
                    }}
                  >
                    <i className={svc.icon || 'fa-solid fa-gamepad'}></i>
                  </div>
                  <span className="product-category">{svc.category.toUpperCase()}</span>
                  <h3 className="product-title">{svc.name}</h3>
                </div>
              )}

              {/* Fitur / Deskripsi */}
              <ul className="product-banner-features" style={{ margin: '14px 0 10px' }}>
                {svc.features.map((feat, idx) => (
                  <li key={idx}>
                    <i className="fa-solid fa-circle-check text-emerald"></i>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              {/* Indikator Sisa Stok */}
              <div className="card-stock-marketing stock-status-available">
                <div className="stock-mkt-left">
                  <i className="fa-solid fa-bolt-lightning text-emerald"></i>
                  <span className="stock-mkt-label">Status Layanan:</span>
                </div>
                <span className="stock-mkt-badge badge-available">
                  <strong>Ready Stock</strong> • Auto 1-3 Mnt
                </span>
              </div>

              {/* Price Box */}
              <div className="product-price-box">
                <div>
                  <span className="price-label">Harga</span>
                  <div
                    className="current-price"
                    style={{
                      color: svc.accentColor || '#38bdf8'
                    }}
                  >
                    {svc.priceNote ? svc.priceNote : formatRupiah(svc.price)}
                  </div>
                </div>
                <span className="price-unit">/ {svc.unit}</span>
              </div>

              {/* Action Button: Buka Menu Steam, Roblox, atau Pilih Paket */}
              <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    background:
                      svc.isSteamMenuTrigger
                        ? 'linear-gradient(135deg, #1075bb 0%, #06b6d4 100%)'
                        : svc.isRobloxMenuTrigger
                        ? 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)'
                        : 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                    borderColor: '#38bdf8',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(6, 182, 212, 0.25)'
                  }}
                  onClick={() => handleCardClick(svc)}
                >
                  <i className={svc.buttonIcon || 'fa-solid fa-bolt'}></i>
                  <span>{svc.buttonText}</span>
                  <i className="fa-solid fa-arrow-right" style={{ fontSize: '11px', marginLeft: '4px' }}></i>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="empty-search" style={{ margin: '40px 0' }}>
            <i className="fa-solid fa-gamepad"></i>
            <h3>Layanan Top Up Tidak Ditemukan</h3>
            <p>Maaf, tidak ada layanan yang cocok dengan kata kunci "{searchQuery}".</p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
            >
              Tampilkan Semua Layanan
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          5. MODAL FORM ORDER TOP UP GAME (UNTUK MLBB, FF, VALORANT, GENSHIN)
         ========================================================================= */}
      {selectedGameForModal && (
        <div className="modal-overlay active" role="dialog" aria-modal="true" onClick={() => setSelectedGameForModal(null)}>
          <div className="modal-card modal-product-detail" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: selectedGameForModal.accentColor || '#38bdf8',
                    fontSize: '18px'
                  }}
                >
                  <i className={selectedGameForModal.icon || 'fa-solid fa-gamepad'}></i>
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '1.15rem', margin: 0 }}>
                    {selectedGameForModal.name}
                  </h3>
                  <small style={{ color: '#94a3b8' }}>Top up resmi kilat otomatis 1-3 menit</small>
                </div>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedGameForModal(null)}
                aria-label="Tutup"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleOrderSubmit} className="modal-body" style={{ padding: '20px' }}>
              {/* Form Input User ID & Server */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                  <i className="fa-solid fa-id-badge text-cyan"></i> Masukkan User ID Akun Game <span className="text-danger">*</span>
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={selectedGameForModal.id === 'topup-valorant' ? 'Misal: Player#123' : 'User ID Game'}
                    value={gameUserId}
                    onChange={(e) => setGameUserId(e.target.value)}
                    required
                    style={{
                      flex: 2,
                      background: 'rgba(15, 23, 42, 0.8)',
                      borderColor: 'rgba(56, 189, 248, 0.3)',
                      color: '#ffffff',
                      padding: '10px 14px',
                      borderRadius: '8px'
                    }}
                  />
                  {(selectedGameForModal.id === 'topup-mlbb' || selectedGameForModal.id === 'topup-genshin') && (
                    <input
                      type="text"
                      className="form-control"
                      placeholder={selectedGameForModal.id === 'topup-mlbb' ? 'Zone ID (4-5 digit)' : 'Server'}
                      value={gameZoneId}
                      onChange={(e) => setGameZoneId(e.target.value)}
                      style={{
                        flex: 1,
                        background: 'rgba(15, 23, 42, 0.8)',
                        borderColor: 'rgba(56, 189, 248, 0.3)',
                        color: '#ffffff',
                        padding: '10px 14px',
                        borderRadius: '8px'
                      }}
                    />
                  )}
                </div>
                <small style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                  <i className="fa-solid fa-circle-info text-cyan"></i> Pastikan User ID sudah benar agar saldo langsung masuk ke akun Anda.
                </small>
              </div>

              {/* Pilihan Paket Nominal Diamond */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                  <i className="fa-solid fa-layer-group text-warning"></i> Pilih Nominal / Paket <span className="text-danger">*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {(selectedGameForModal.packages || []).map((pkg, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedPackageIndex(idx)}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        border: selectedPackageIndex === idx ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: selectedPackageIndex === idx ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <strong style={{ fontSize: '12.5px', color: '#f8fafc', display: 'block', marginBottom: '4px' }}>
                        {pkg.name}
                      </strong>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>
                        {formatRupiah(pkg.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pilihan Metode Pembayaran */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                  <i className="fa-solid fa-wallet text-emerald"></i> Metode Pembayaran
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'qris', label: 'QRIS All Pay', icon: 'fa-qrcode', color: '#10b981' },
                    { id: 'dana', label: 'DANA / GoPay', icon: 'fa-wallet', color: '#06b6d4' },
                    { id: 'shopee', label: 'ShopeePay', icon: 'fa-bag-shopping', color: '#f97316' }
                  ].map((pay) => (
                    <div
                      key={pay.id}
                      onClick={() => setSelectedPayment(pay.id)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: selectedPayment === pay.id ? `1.5px solid ${pay.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                        background: selectedPayment === pay.id ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.4)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: selectedPayment === pay.id ? '#ffffff' : '#94a3b8'
                      }}
                    >
                      <i className={`fa-solid ${pay.icon}`} style={{ color: pay.color, display: 'block', fontSize: '14px', marginBottom: '3px' }}></i>
                      <span>{pay.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Submit Button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div>
                  <small style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Total Pembayaran:</small>
                  <strong style={{ fontSize: '1.25rem', color: '#38bdf8' }}>
                    {formatRupiah(selectedGameForModal.packages?.[selectedPackageIndex]?.price || 0)}
                  </strong>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                    borderColor: '#10b981',
                    padding: '12px 24px',
                    fontWeight: 700,
                    gap: '8px'
                  }}
                >
                  <i className="fa-brands fa-whatsapp"></i>
                  <span>Order via WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
