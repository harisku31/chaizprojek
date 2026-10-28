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

  const categories = [
    { id: 'all', label: 'Semua Layanan (2)', icon: 'fa-border-all' },
    { id: 'steam', label: 'Steam Games (4 Varian)', icon: 'fa-brands fa-steam' },
    { id: 'roblox', label: 'Roblox & Robux (6 Paket)', icon: 'fa-solid fa-cube' }
  ];

  // Daftar Layanan Top Up Resmi (Hanya 2 Layanan: Steam & Roblox)
  const TOPUP_SERVICES = [
    {
      id: 'steam-game-valve',
      name: 'Steam Key Game Resmi Valve',
      category: 'steam',
      badge: '4 Varian Game',
      badgeClass: 'badge-bestseller',
      image: 'banner-steam.png',
      desc: 'Pusat Steam Key resmi Valve terpercaya. Pilihan lengkap 4 paket: Original Key, Epic Tier, NSFW 18+, dan Hanimetai. Aktivasi global permanen di library Steam PC / Laptop Anda.',
      features: [
        'Tersedia 4 Varian Paket (Original, Epic Tier, NSFW 18+, Hanimetai)',
        'Aktivasi Global Permanen di Library Steam PC / Laptop',
        '100% Legal & Bergaransi Kode Valid Resmi Valve',
        'Bisa Dapatkan Game Sultan & Triple-A (AAA) Beruntung'
      ],
      price: 1500,
      priceNote: 'Mulai Rp 1.500 / key',
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
      desc: 'Pusat isi saldo Robux Roblox via Username. Pilihan lengkap 6 paket: 50r, 100r, 200r, 300r, 400r, hingga 500r. Proses kilat otomatis, aman & legal 100% tanpa perlu password akun.',
      features: [
        'Top Up Robux via Username (Tanpa Password, 100% Aman)',
        'Pilihan Lengkap 6 Paket: 50r, 100r, 200r, 300r, 400r, 500r',
        'Garansi Masuk & Proses Kilat Otomatis 5 - 15 Menit',
        'Bisa Borong Gamepass, Avatar Outfit & Item Favorit'
      ],
      price: 11000,
      priceNote: 'Mulai Rp 11.000 / paket',
      unit: 'robux',
      stock: 2000,
      isRobloxMenuTrigger: true,
      buttonText: 'Buka Menu Roblox (6 Paket)',
      buttonIcon: 'fa-solid fa-cube',
      accentColor: '#a855f7'
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
    }
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
                Pusat Top Up Steam & Roblox Resmi
              </h2>

              <p className="catalog-hero-banner-desc">
                Pusat isi saldo game resmi termurah dengan garansi 100%. Pilihan lengkap Steam Key game Valve resmi (Original, Epic Tier, NSFW 18+, Hanimetai) dan Robux Roblox instant via Username tanpa password dengan proses kilat 1-3 menit langsung masuk!
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
                <div className="catalog-visual-apps topup-visual-apps" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  <div
                    className="catalog-v-app"
                    onClick={onOpenSteamMenu}
                    style={{ cursor: 'pointer' }}
                    title="Buka Menu Steam"
                  >
                    <i className="fa-brands fa-steam text-cyan"></i>
                    <span>Steam Key</span>
                  </div>
                  <div
                    className="catalog-v-app"
                    onClick={onOpenRobloxMenu}
                    style={{ cursor: 'pointer' }}
                    title="Buka Menu Roblox"
                  >
                    <i className="fa-solid fa-cube text-purple"></i>
                    <span>Robux Roblox</span>
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
              placeholder="Cari Steam Key, Robux Roblox, atau layanan top up..."
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
        <div
          className="product-grid"
          style={{
            minHeight: '360px',
            maxWidth: '960px',
            margin: '0 auto',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}
        >
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
                      background: `rgba(${svc.category === 'steam' ? '102, 192, 244' : '168, 85, 247'}, 0.18)`,
                      color: svc.accentColor || '#38bdf8',
                      borderColor: `rgba(${svc.category === 'steam' ? '102, 192, 244' : '168, 85, 247'}, 0.35)`
                    }}
                  >
                    <i
                      className={
                        svc.category === 'steam'
                          ? 'fa-brands fa-steam'
                          : 'fa-solid fa-cube'
                      }
                    ></i>{' '}
                    {svc.category.toUpperCase()}
                  </span>
                </div>
                <span className={`badge-status ${svc.badgeClass}`}>{svc.badge}</span>
              </div>

              {/* Banner Image Showcase */}
              {svc.image && (
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

              {/* Action Button: Buka Menu Steam atau Roblox */}
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
                        : 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
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
    </div>
  );
}
