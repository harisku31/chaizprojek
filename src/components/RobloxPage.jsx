import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../utils/format';
import RobloxBuyModal, { ROBUX_PACKAGES } from './RobloxBuyModal';

export default function RobloxPage({
  onBackToTopUp,
  onBackToStore,
  onShowToast,
  authUser,
  isBanned = false,
  onOpenLogin,
  onOpenBannedModal
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRobloxModalOpen, setIsRobloxModalOpen] = useState(false);
  const [modalPackageId, setModalPackageId] = useState('50r');
  const [pendingPackageId, setPendingPackageId] = useState(null);

  useEffect(() => {
    if (authUser && pendingPackageId) {
      setModalPackageId(pendingPackageId);
      setIsRobloxModalOpen(true);
      setPendingPackageId(null);
    }
  }, [authUser, pendingPackageId]);

  const categories = [
    { id: 'all', label: 'Semua Paket Robux (6)', icon: 'fa-border-all' },
    { id: 'hemat', label: 'Paket Hemat (50r - 200r)', icon: 'fa-piggy-bank' },
    { id: 'sultan', label: 'Paket Sultan (300r - 500r)', icon: 'fa-crown' }
  ];

  const filteredPackages = ROBUX_PACKAGES.filter((pkg) => {
    let matchCat = true;
    if (activeCategory === 'hemat') {
      matchCat = pkg.amount <= 200;
    } else if (activeCategory === 'sultan') {
      matchCat = pkg.amount >= 300;
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchCat;
    return (
      matchCat &&
      (pkg.name.toLowerCase().includes(q) ||
        pkg.symbol.toLowerCase().includes(q) ||
        pkg.desc.toLowerCase().includes(q) ||
        pkg.badge.toLowerCase().includes(q))
    );
  });

  const handleOpenBuyModal = (pkgId = '50r') => {
    if (isBanned) {
      onOpenBannedModal?.();
      onShowToast?.('Akses Ditolak: Akun Anda sedang di-banned!', 'fa-ban text-danger');
      return;
    }

    if (!authUser) {
      setPendingPackageId(pkgId);
      onOpenLogin?.();
      onShowToast?.('Silakan login terlebih dahulu untuk membeli Robux!', 'fa-right-to-bracket text-warning');
      return;
    }

    setModalPackageId(pkgId);
    setIsRobloxModalOpen(true);
  };

  return (
    <div className="topup-page-container roblox-page-container">
      {/* 1. Header Navigation Bar */}
      <section className="topup-page-hero roblox-page-hero">
        <div className="topup-hero-bg-wrap">
          <img
            src="/roblox.png"
            alt="ChaizStore Roblox Center Banner"
            className="topup-hero-bg-banner"
            loading="eager"
            style={{ objectPosition: 'center 20%', filter: 'brightness(0.35) saturate(1.2)' }}
            onError={(e) => {
              if (!e.currentTarget.src.endsWith('.jpg')) {
                e.currentTarget.src = '/topup-banner.jpg';
              }
            }}
          />
          <div
            className="topup-hero-overlay"
            style={{
              background: 'linear-gradient(180deg, rgba(10, 10, 15, 0.75) 0%, rgba(10, 10, 15, 0.95) 100%)'
            }}
          ></div>
        </div>

        <div className="container">
          {/* Breadcrumb Navigation Buttons */}
          <div
            className="steam-page-nav-bar"
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              marginBottom: '22px',
              flexWrap: 'wrap'
            }}
          >
            {onBackToTopUp && (
              <button
                type="button"
                className="btn btn-outline steam-btn-back"
                onClick={onBackToTopUp}
                title="Kembali ke Halaman Menu Top Up"
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '8px',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  color: '#f87171'
                }}
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Kembali ke Halaman Top Up</span>
              </button>
            )}

            {onBackToStore && (
              <button
                type="button"
                className="btn btn-outline steam-btn-back"
                onClick={onBackToStore}
                title="Kembali ke Beranda Toko"
                style={{
                  padding: '8px 14px',
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '8px',
                  opacity: 0.85
                }}
              >
                <i className="fa-solid fa-house"></i>
                <span>Beranda Toko</span>
              </button>
            )}

            <div className="topup-page-status-pill" style={{ marginLeft: 'auto' }}>
              <span className="live-status-dot" style={{ background: '#ef4444', boxShadow: '0 0 10px #ef4444' }}></span>
              <span>Layanan Robux Online 24 Jam</span>
            </div>
          </div>

          <div className="topup-hero-content">
            <div className="topup-hero-badge-row">
              <span
                className="topup-hero-badge"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  borderColor: 'rgba(239, 68, 68, 0.45)',
                  color: '#f87171'
                }}
              >
                <i className="fa-solid fa-cube text-danger"></i> CHAIZSTORE ROBLOX STORE
              </span>
              <span className="badge-status badge-bestseller" style={{ fontSize: '11px', padding: '4px 10px' }}>
                Via Username Resmi
              </span>
            </div>

            <h1 className="topup-hero-title">
              Pusat Robux Roblox <span style={{ color: '#ef4444' }}>Via Username</span>
            </h1>
            <p className="topup-hero-sub">
              Top up saldo Robux legal, cepat, dan aman 100%. Cukup masukkan <strong>Username Roblox kamu</strong> tanpa perlu password akun. Saldo Robux langsung masuk kilat (estimasi 1–5 menit) ke avatar kamu!
            </p>

            <div className="topup-hero-stats">
              <div className="topup-stat-item">
                <i className="fa-solid fa-bolt text-warning"></i>
                <div>
                  <strong>1 - 5 Menit</strong>
                  <small>Proses Otomatis Kilat</small>
                </div>
              </div>
              <div className="topup-stat-item">
                <i className="fa-solid fa-user-ninja text-danger"></i>
                <div>
                  <strong>Cukup Username</strong>
                  <small>Tanpa Password Akun</small>
                </div>
              </div>
              <div className="topup-stat-item">
                <i className="fa-solid fa-shield-halved text-emerald"></i>
                <div>
                  <strong>100% Legal & Safe</strong>
                  <small>Garansi Saldo Masuk</small>
                </div>
              </div>
              <div className="topup-stat-item">
                <i className="fa-brands fa-whatsapp text-success"></i>
                <div>
                  <strong>CS 24 Jam</strong>
                  <small>WhatsApp Ready</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Special Aesthetic Robux Username Menu Card */}
      <section style={{ padding: '28px 0 10px' }}>
        <div className="container">
          <div
            className="roblox-aesthetic-board"
            style={{
              background: 'linear-gradient(135deg, rgba(20, 10, 15, 0.95) 0%, rgba(30, 15, 20, 0.9) 100%)',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '16px',
              padding: '24px 28px',
              boxShadow: '0 12px 36px rgba(239, 68, 68, 0.12)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background Glow */}
            <div
              style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '180px',
                height: '180px',
                background: 'radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, transparent 70%)',
                pointerEvents: 'none'
              }}
            ></div>

            {/* Aesthetic Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', paddingBottom: '16px', marginBottom: '18px' }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '15px', color: '#fca5a5', letterSpacing: '0.5px', fontWeight: 600 }}>
                  ㅤ ╭   ──┼─   ▴  robux username  .ⓘ ›
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                  Pilih nominal Robux yang kamu inginkan, lalu masukkan username akun Roblox kamu saat checkout.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <span className="badge-status badge-guarantee" style={{ fontSize: '11px' }}>
                  <i className="fa-solid fa-lock"></i> No Password Required
                </span>
                <span className="badge-status badge-flash" style={{ fontSize: '11px' }}>
                  <i className="fa-solid fa-bolt"></i> Instant Order
                </span>
              </div>
            </div>

            {/* Aesthetic Price Table Rows */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
              {ROBUX_PACKAGES.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => handleOpenBuyModal(pkg.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                    e.currentTarget.style.borderColor = '#ef4444';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fa-solid fa-cube text-danger" style={{ fontSize: '15px' }}></i>
                    <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', fontWeight: 600 }}>
                      ㅤ╎  {pkg.decoSymbol}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong style={{ color: '#f87171', fontSize: '14px', fontFamily: 'monospace' }}>
                      ⦂ {formatRupiah(pkg.price)}
                    </strong>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        borderColor: '#ef4444',
                        color: '#f87171',
                        borderRadius: '6px'
                      }}
                    >
                      Beli
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Katalog Kartu Robux Roblox */}
      <section className="katalog-section" style={{ paddingTop: '20px' }}>
        <div className="container">
          <div className="section-title text-center">
            <span className="subheading" style={{ color: '#f87171' }}>
              <i className="fa-solid fa-cube"></i> DAFTAR NOMINAL ROBUX
            </span>
            <h2>Pilih Paket Robux Favorit Kamu</h2>
            <p>
              Tersedia paket <strong>50r, 100r, 200r, 300r, 400r, hingga 500r</strong> dengan harga termurah, proses langsung masuk ke username akun Roblox kamu!
            </p>
          </div>

          {/* Filter Categories Bar */}
          <div className="category-tabs" id="robloxCategoryTabs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  borderColor: activeCategory === cat.id ? '#ef4444' : undefined,
                  background: activeCategory === cat.id ? 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' : undefined
                }}
              >
                <i className={`fa-solid ${cat.icon}`}></i> {cat.label}
              </button>
            ))}
          </div>

          {/* Product Grid Layout (6 Paket Robux) */}
          <div className="product-grid" style={{ marginTop: '28px' }}>
            {filteredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="product-card has-banner roblox-card"
                onClick={() => handleOpenBuyModal(pkg.id)}
                style={{
                  cursor: 'pointer',
                  border: '1.5px solid rgba(239, 68, 68, 0.25)',
                  transition: 'all 0.25s ease'
                }}
              >
                <div className="card-top-bar">
                  <div className="card-top-left">
                    <span
                      className="product-category-pill"
                      style={{
                        margin: 0,
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        borderColor: 'rgba(239, 68, 68, 0.35)'
                      }}
                    >
                      <i className="fa-solid fa-cube"></i> ROBUX
                    </span>
                  </div>
                  <span className={`badge-status ${pkg.badgeClass}`}>{pkg.badge}</span>
                </div>

                {/* Banner / Visual Wrap */}
                <div
                  className="product-banner-wrap"
                  style={{
                    background: 'linear-gradient(135deg, #18080a 0%, #2a0e14 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px 20px',
                    position: 'relative'
                  }}
                >
                  <img
                    src="/roblox.png"
                    alt={pkg.name}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: 0.18,
                      filter: 'grayscale(30%)'
                    }}
                  />
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(249, 115, 22, 0.3) 100%)',
                      border: '1.5px solid rgba(239, 68, 68, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      color: '#ffffff',
                      marginBottom: '10px',
                      boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    <i className="fa-solid fa-cube"></i>
                  </div>
                  <h3 style={{ position: 'relative', zIndex: 2, color: '#ffffff', fontSize: '20px', fontWeight: 800, margin: '0 0 2px' }}>
                    {pkg.name}
                  </h3>
                  <span style={{ position: 'relative', zIndex: 2, color: '#fca5a5', fontSize: '13px', fontFamily: 'monospace' }}>
                    {pkg.decoSymbol}
                  </span>
                </div>

                {/* Features List */}
                <ul className="product-banner-features" style={{ margin: '14px 0 10px', padding: '0 20px' }}>
                  <li>
                    <i className="fa-solid fa-circle-check text-danger"></i>
                    <span>Cukup Username Roblox (No Password)</span>
                  </li>
                  <li>
                    <i className="fa-solid fa-circle-check text-danger"></i>
                    <span>Garansi Robux Resmi Masuk 100%</span>
                  </li>
                  <li>
                    <i className="fa-solid fa-circle-check text-danger"></i>
                    <span>Estimasi Kilat 1–5 Menit Proses</span>
                  </li>
                </ul>

                {/* Status Stok */}
                <div className="card-stock-marketing stock-status-available" style={{ margin: '0 20px 10px' }}>
                  <div className="stock-mkt-left">
                    <i className="fa-solid fa-bolt-lightning text-danger"></i>
                    <span className="stock-mkt-label">Status:</span>
                  </div>
                  <span className="stock-mkt-badge badge-available" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                    <strong>Ready Stock</strong>
                  </span>
                </div>

                {/* Price Box */}
                <div className="product-price-box" style={{ padding: '0 20px 14px' }}>
                  <div>
                    <span className="price-label">Harga Satuan</span>
                    <div className="current-price" style={{ color: '#f87171' }}>
                      {formatRupiah(pkg.price)}
                    </div>
                  </div>
                  <span className="price-unit">/ {pkg.symbol}</span>
                </div>

                {/* Action Button */}
                <div className="card-actions" onClick={(e) => e.stopPropagation()} style={{ padding: '0 20px 20px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
                      borderColor: '#f87171',
                      gap: '8px'
                    }}
                    onClick={() => handleOpenBuyModal(pkg.id)}
                  >
                    <i className="fa-solid fa-cube"></i>
                    <span>Beli Robux ({formatRupiah(pkg.price)})</span>
                    <i className="fa-solid fa-arrow-right" style={{ fontSize: '11px', marginLeft: '4px' }}></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Modal Checkout Robux */}
      <RobloxBuyModal
        isOpen={isRobloxModalOpen}
        onClose={() => setIsRobloxModalOpen(false)}
        authUser={authUser}
        isBanned={isBanned}
        onOpenLogin={onOpenLogin}
        onOpenBannedModal={onOpenBannedModal}
        onShowToast={onShowToast}
        initialPackageId={modalPackageId}
      />
    </div>
  );
}
