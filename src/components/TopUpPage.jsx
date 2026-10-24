import React, { useState } from 'react';
import { formatRupiah } from '../utils/format';

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
    { id: 'all', label: 'Semua Layanan Top Up', icon: 'fa-border-all' },
    { id: 'steam', label: 'Steam Games', icon: 'fa-brands fa-steam' },
    { id: 'roblox', label: 'Roblox & Robux', icon: 'fa-solid fa-cube' },
    { id: 'pc', label: 'PC Games & Voucher', icon: 'fa-gamepad' }
  ];

  // Daftar Layanan Top Up (Steam & Roblox dijadikan Menu Utama Lengkap)
  const TOPUP_SERVICES = [
    {
      id: 'steam-game-valve',
      name: 'Steam Key Game Resmi Valve',
      category: 'steam',
      badge: '4 Varian Game',
      badgeClass: 'badge-bestseller',
      image: 'steam.png',
      desc: 'Pusat Steam Key resmi Valve. Tersedia paket Original Key, Epic Tier, NSFW 18+, dan Hanimetai.',
      features: [
        'Tersedia 4 Varian Paket (Original, Epic Tier, NSFW 18+, Hanimetai)',
        'Aktivasi Global Permanen di Library Steam PC / Laptop',
        '100% Legal & Bergaransi Kode Valid Resmi'
      ],
      price: 1500,
      priceNote: 'Mulai Rp 1.500',
      unit: 'key',
      stock: 50,
      isSteamMenuTrigger: true,
      buttonText: 'Buka Menu Steam',
      buttonIcon: 'fa-brands fa-steam'
    },
    {
      id: 'topup-roblox',
      name: 'Roblox (Robux Instant)',
      category: 'roblox',
      badge: 'Robux Murah',
      badgeClass: 'badge-bestseller',
      image: 'roblox.png',
      desc: 'Pusat isi saldo Robux Roblox via Username. Tersedia paket 50r hingga 500r proses cepat, aman & legal 100% tanpa password.',
      features: [
        'Top Up Robux via Username (Tanpa Password)',
        'Pilihan Lengkap 50r, 100r, 200r, 300r, 400r, 500r',
        '100% Aman & Bergaransi Saldo Masuk'
      ],
      price: 11000,
      priceNote: 'Mulai Rp 11.000',
      unit: 'robux',
      stock: 2000,
      isRobloxMenuTrigger: true,
      buttonText: 'Buka Menu Roblox',
      buttonIcon: 'fa-solid fa-cube'
    },
    {
      id: 'topup-valorant',
      name: 'Valorant Points (VP)',
      category: 'pc',
      badge: 'Segera Hadir',
      badgeClass: 'badge-sealed',
      image: null,
      icon: 'fa-solid fa-crosshairs',
      iconColor: '#f43f5e',
      desc: 'Top up Riot Points / Valorant Points untuk skin senjata & Battle Pass terbaru.',
      features: [
        'Riot Points / Valorant Points Server Indonesia',
        'Cukup Masukkan Riot ID & Tagline',
        'Garansi Kode & Saldo Resmi Riot Games'
      ],
      price: 15000,
      priceNote: 'Segera Hadir',
      unit: 'vp',
      stock: 0,
      isComingSoon: true,
      buttonText: 'Segera Hadir',
      buttonIcon: 'fa-solid fa-clock'
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
        svc.badge.toLowerCase().includes(q))
    );
  });

  const handleCardClick = (service) => {
    if (service.isSteamMenuTrigger) {
      if (onOpenSteamMenu) {
        onOpenSteamMenu();
      } else {
        window.location.hash = 'steam';
      }
    } else if (service.isRobloxMenuTrigger) {
      if (onOpenRobloxMenu) {
        onOpenRobloxMenu();
      } else {
        window.location.hash = 'roblox';
      }
    } else if (service.isComingSoon) {
      onShowToast?.(`Layanan ${service.name} sedang dalam persiapan & segera hadir di ChaizStore!`, 'fa-clock text-warning');
    }
  };

  return (
    <div className="topup-page-container">
      {/* 1. Header Hero Banner dengan Foto Background AI Top Up & Games */}
      <section className="topup-page-hero">
        <div className="topup-hero-bg-wrap">
          <img
            src="/topup-banner.svg"
            alt="ChaizStore Top Up Akun & Games Banner"
            className="topup-hero-bg-banner"
            loading="eager"
            onError={(e) => {
              if (!e.currentTarget.src.endsWith('.jpg')) {
                e.currentTarget.src = '/topup-banner.jpg';
              }
            }}
          />
          <div className="topup-hero-overlay"></div>
        </div>

        <div className="container">
          <div className="topup-hero-content">
            <div className="topup-hero-badge-row">
              <span className="topup-hero-badge">
                <i className="fa-solid fa-bolt text-cyan"></i> CHAIZSTORE TOP UP CENTER
              </span>
              <div className="topup-page-status-pill">
                <span className="live-status-dot"></span>
                <span>Layanan Online 24 Jam</span>
              </div>
            </div>

            <h1 className="topup-hero-title">
              Top Up Akun <span>& Games</span>
            </h1>
            <p className="topup-hero-sub">
              Pusat layanan top up resmi dan instan untuk berbagai akun premium, Steam Key game resmi, voucher game, dan langganan digital terpercaya. Proses kilat otomatis 1-3 menit langsung aktif dengan garansi penuh 100%.
            </p>

            <div className="topup-hero-stats">
              <div className="topup-stat-item">
                <i className="fa-solid fa-bolt text-warning"></i>
                <div>
                  <strong>1 - 3 Menit</strong>
                  <small>Proses Otomatis</small>
                </div>
              </div>
              <div className="topup-stat-item">
                <i className="fa-solid fa-shield-halved text-cyan"></i>
                <div>
                  <strong>100% Legal</strong>
                  <small>Garansi Resmi</small>
                </div>
              </div>
              <div className="topup-stat-item">
                <i className="fa-solid fa-qrcode text-success"></i>
                <div>
                  <strong>QRIS All Payment</strong>
                  <small>Bebas Biaya Admin</small>
                </div>
              </div>
              <div className="topup-stat-item">
                <i className="fa-brands fa-whatsapp text-success"></i>
                <div>
                  <strong>CS 24/7</strong>
                  <small>Fast Response WhatsApp</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Katalog Top Up & Games */}
      <section className="katalog-section" style={{ paddingTop: '20px' }}>
        <div className="container">
          <div className="section-title text-center">
            <span className="subheading">
              <i className="fa-solid fa-layer-group"></i> KATALOG TOP UP AKUN & GAMES
            </span>
            <h2>Pilih Layanan Top Up Favoritmu</h2>
            <p>
              Tersedia menu Steam Key game resmi Valve (Original, Epic Tier, NSFW 18+, Hanimetai), voucher game, dan produk digital favorit dengan harga termurah & proses kilat otomatis.
            </p>
          </div>

          {/* Filter Categories Bar */}
          <div className="category-tabs" id="topupCategoryTabs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <i className={`fa-solid ${cat.icon}`}></i> {cat.label}
              </button>
            ))}
          </div>

          {/* Product Grid Layout: 1 Steam Card + Layanan Top Up Lainnya */}
          <div className="product-grid" style={{ marginTop: '28px' }}>
            {filteredServices.map((svc) => (
              <div
                key={svc.id}
                className={`product-card ${svc.image ? 'has-banner' : ''} ${svc.isComingSoon ? 'card-unreleased' : ''}`}
                onClick={() => handleCardClick(svc)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-top-bar">
                  <div className="card-top-left">
                    <span
                      className="product-category-pill"
                      style={{
                        margin: 0,
                        background: svc.isSteamMenuTrigger
                          ? 'rgba(102, 192, 244, 0.18)'
                          : svc.isRobloxMenuTrigger
                          ? 'rgba(56, 189, 248, 0.18)'
                          : undefined,
                        color: svc.isSteamMenuTrigger
                          ? '#66c0f4'
                          : svc.isRobloxMenuTrigger
                          ? '#38bdf8'
                          : undefined,
                        borderColor: svc.isSteamMenuTrigger
                          ? 'rgba(102, 192, 244, 0.35)'
                          : svc.isRobloxMenuTrigger
                          ? 'rgba(56, 189, 248, 0.35)'
                          : undefined
                      }}
                    >
                      <i
                        className={
                          svc.isSteamMenuTrigger
                            ? 'fa-brands fa-steam'
                            : svc.isRobloxMenuTrigger
                            ? 'fa-solid fa-cube'
                            : 'fa-solid fa-gamepad'
                        }
                      ></i>{' '}
                      {svc.category.toUpperCase()}
                    </span>
                  </div>
                  <span className={`badge-status ${svc.badgeClass}`}>{svc.badge}</span>
                </div>

                {/* Banner Image / Icon Wrap */}
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
                      <i className={`fa-solid fa-circle-check ${svc.isSteamMenuTrigger ? 'text-cyan' : 'text-emerald'}`}></i>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Indikator Sisa Stok */}
                <div className={`card-stock-marketing ${svc.stock > 0 ? 'stock-status-available' : 'stock-status-sealed'}`}>
                  <div className="stock-mkt-left">
                    <i className={`fa-solid ${svc.stock > 0 ? 'fa-bolt-lightning text-emerald' : 'fa-clock text-warning'}`}></i>
                    <span className="stock-mkt-label">{svc.stock > 0 ? 'Status Layanan:' : 'Status:'}</span>
                  </div>
                  <span className={`stock-mkt-badge ${svc.stock > 0 ? 'badge-available' : 'badge-sealed'}`}>
                    {svc.stock > 0 ? <strong>Ready Stock</strong> : 'Segera Hadir'}
                  </span>
                </div>

                {/* Price Box */}
                <div className="product-price-box">
                  <div>
                    <span className="price-label">Harga</span>
                    <div
                      className="current-price"
                      style={{
                        color: svc.isSteamMenuTrigger
                          ? '#66c0f4'
                          : svc.isRobloxMenuTrigger
                          ? '#fbbf24'
                          : undefined
                      }}
                    >
                      {svc.priceNote ? svc.priceNote : formatRupiah(svc.price)}
                    </div>
                  </div>
                  <span className="price-unit">{svc.stock > 0 ? `/ ${svc.unit}` : ''}</span>
                </div>

                {/* Action Button: Buka Menu Steam, Roblox, atau Segera Hadir */}
                <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                  {svc.isSteamMenuTrigger ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #1075bb 0%, #06b6d4 100%)',
                        borderColor: '#38bdf8',
                        gap: '8px'
                      }}
                      onClick={() => handleCardClick(svc)}
                    >
                      <i className="fa-brands fa-steam"></i>
                      <span>Buka Menu Steam</span>
                      <i className="fa-solid fa-arrow-right" style={{ fontSize: '11px', marginLeft: '4px' }}></i>
                    </button>
                  ) : svc.isRobloxMenuTrigger ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
                        borderColor: '#38bdf8',
                        gap: '8px',
                        boxShadow: '0 4px 16px rgba(6, 182, 212, 0.25)'
                      }}
                      onClick={() => handleCardClick(svc)}
                    >
                      <i className="fa-solid fa-cube"></i>
                      <span>Buka Menu Roblox</span>
                      <i className="fa-solid fa-arrow-right" style={{ fontSize: '11px', marginLeft: '4px' }}></i>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sealed"
                      style={{
                        width: '100%',
                        background: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        color: '#fbbf24',
                        fontWeight: 700
                      }}
                      onClick={() => handleCardClick(svc)}
                    >
                      <i className="fa-solid fa-clock"></i> Segera Hadir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="empty-state">
              <i className="fa-solid fa-gamepad"></i>
              <h3>Layanan Top Up Tidak Ditemukan</h3>
              <p>Coba pilih kategori lain atau tampilkan semua layanan top up.</p>
              <button className="btn btn-outline" onClick={() => setActiveCategory('all')}>
                Tampilkan Semua Layanan
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
