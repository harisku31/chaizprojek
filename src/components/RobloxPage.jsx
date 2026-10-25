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
  onOpenBannedModal,
  onGoToTransactions
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
      {/* 1. Header Navigation Bar & Bright Vibrant Hero Banner */}
      <section className="topup-page-hero roblox-page-hero">
        <div className="topup-hero-bg-wrap">
          <img
            src="/roblox.png"
            alt="ChaizStore Roblox Center Banner"
            className="topup-hero-bg-banner"
            loading="eager"
            style={{
              objectPosition: 'center 28%',
              filter: 'brightness(0.95) contrast(1.08) saturate(1.2)'
            }}
            onError={(e) => {
              if (!e.currentTarget.src.endsWith('.jpg')) {
                e.currentTarget.src = '/topup-banner.jpg';
              }
            }}
          />
          <div
            className="topup-hero-overlay"
            style={{
              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.88) 100%)'
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
                  borderRadius: '10px',
                  borderColor: 'rgba(56, 189, 248, 0.45)',
                  background: 'rgba(56, 189, 248, 0.08)',
                  color: '#38bdf8'
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
                  borderRadius: '10px',
                  opacity: 0.9
                }}
              >
                <i className="fa-solid fa-house"></i>
                <span>Beranda Toko</span>
              </button>
            )}

            <div className="topup-page-status-pill" style={{ marginLeft: 'auto' }}>
              <span className="live-status-dot" style={{ background: '#38bdf8', boxShadow: '0 0 12px #38bdf8' }}></span>
              <span>Layanan Robux Online 24 Jam</span>
            </div>
          </div>

          <div className="topup-hero-content">
            <div className="topup-hero-badge-row">
              <span
                className="topup-hero-badge"
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  borderColor: 'rgba(56, 189, 248, 0.45)',
                  color: '#38bdf8'
                }}
              >
                <i className="fa-solid fa-cube text-cyan"></i> CHAIZSTORE ROBLOX STORE
              </span>
              <span className="badge-status badge-bestseller" style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(56, 189, 248, 0.2)', borderColor: 'rgba(56, 189, 248, 0.45)', color: '#38bdf8' }}>
                Via Username Resmi
              </span>
            </div>

            <h1 className="topup-hero-title">
              Pusat Robux Roblox <span style={{ color: '#38bdf8' }}>Via Username</span>
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
                <i className="fa-solid fa-user-ninja text-cyan"></i>
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

      {/* 2. Katalog Kartu Robux Roblox (Desain Biru Modern) */}
      <section className="katalog-section" style={{ paddingTop: '28px', paddingBottom: '48px' }}>
        <div className="container">
          <div className="section-title text-center">
            <span className="subheading" style={{ color: '#38bdf8' }}>
              <i className="fa-solid fa-cube"></i> DAFTAR NOMINAL ROBUX VIA USERNAME
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
                  borderColor: activeCategory === cat.id ? '#0ea5e9' : undefined,
                  background: activeCategory === cat.id ? 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)' : undefined,
                  color: activeCategory === cat.id ? '#ffffff' : undefined
                }}
              >
                <i className={`fa-solid ${cat.icon}`}></i> {cat.label}
              </button>
            ))}
          </div>

          {/* Product Grid Layout (6 Paket Robux dengan Tema Warna Biru) */}
          <div className="product-grid" style={{ marginTop: '28px' }}>
            {filteredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="product-card has-banner roblox-card"
                onClick={() => handleOpenBuyModal(pkg.id)}
                style={{
                  cursor: 'pointer',
                  border: '1.5px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '16px',
                  background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
                  boxShadow: '0 10px 30px rgba(2, 132, 199, 0.12)',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#38bdf8';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 16px 36px rgba(56, 189, 248, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(2, 132, 199, 0.12)';
                }}
              >
                <div className="card-top-bar" style={{ padding: '14px 16px 0' }}>
                  <div className="card-top-left">
                    <span
                      className="product-category-pill"
                      style={{
                        margin: 0,
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        borderColor: 'rgba(56, 189, 248, 0.35)'
                      }}
                    >
                      <i className="fa-solid fa-cube"></i> ROBUX
                    </span>
                  </div>
                  <span
                    className={`badge-status ${pkg.badgeClass}`}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      borderColor: 'rgba(56, 189, 248, 0.4)',
                      color: '#38bdf8'
                    }}
                  >
                    {pkg.badge}
                  </span>
                </div>

                {/* Banner / Visual Wrap */}
                <div
                  className="product-banner-wrap"
                  style={{
                    background: 'linear-gradient(135deg, #091322 0%, #0f243c 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px 20px',
                    position: 'relative',
                    overflow: 'hidden'
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
                      opacity: 0.22,
                      filter: 'contrast(1.1) saturate(1.2)'
                    }}
                  />
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.35) 0%, rgba(56, 189, 248, 0.35) 100%)',
                      border: '1.5px solid rgba(56, 189, 248, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      color: '#ffffff',
                      marginBottom: '10px',
                      boxShadow: '0 0 24px rgba(56, 189, 248, 0.4)'
                    }}
                  >
                    <i className="fa-solid fa-cube text-cyan"></i>
                  </div>
                  <h3 style={{ position: 'relative', zIndex: 2, color: '#ffffff', fontSize: '20px', fontWeight: 800, margin: '0 0 2px' }}>
                    {pkg.name}
                  </h3>
                  <span style={{ position: 'relative', zIndex: 2, color: '#38bdf8', fontSize: '13px', fontFamily: 'monospace', fontWeight: 600 }}>
                    {pkg.decoSymbol}
                  </span>
                </div>

                {/* Features List */}
                <ul className="product-banner-features" style={{ margin: '14px 0 10px', padding: '0 20px' }}>
                  <li>
                    <i className="fa-solid fa-circle-check text-cyan"></i>
                    <span>Cukup Username Roblox (No Password)</span>
                  </li>
                  <li>
                    <i className="fa-solid fa-circle-check text-cyan"></i>
                    <span>Garansi Robux Resmi Masuk 100%</span>
                  </li>
                  <li>
                    <i className="fa-solid fa-circle-check text-cyan"></i>
                    <span>Estimasi Kilat 1–5 Menit Proses</span>
                  </li>
                </ul>

                {/* Status Stok */}
                <div className="card-stock-marketing stock-status-available" style={{ margin: '0 20px 10px' }}>
                  <div className="stock-mkt-left">
                    <i className="fa-solid fa-bolt-lightning text-cyan"></i>
                    <span className="stock-mkt-label">Status:</span>
                  </div>
                  <span className="stock-mkt-badge badge-available" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                    <strong>Ready Stock</strong>
                  </span>
                </div>

                {/* Price Box */}
                <div className="product-price-box" style={{ padding: '0 20px 14px' }}>
                  <div>
                    <span className="price-label">Harga Satuan</span>
                    <div className="current-price" style={{ color: '#38bdf8', fontSize: '22px', fontWeight: 800 }}>
                      {formatRupiah(pkg.price)}
                    </div>
                  </div>
                  <span className="price-unit">/ {pkg.symbol}</span>
                </div>

                {/* Action Button: Beli Robux Biru */}
                <div className="card-actions" onClick={(e) => e.stopPropagation()} style={{ padding: '0 20px 20px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
                      borderColor: '#38bdf8',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontWeight: 700,
                      gap: '8px',
                      boxShadow: '0 6px 20px rgba(14, 165, 233, 0.35)'
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

      {/* 3. Modal Checkout Robux */}
      <RobloxBuyModal
        isOpen={isRobloxModalOpen}
        onClose={() => setIsRobloxModalOpen(false)}
        authUser={authUser}
        isBanned={isBanned}
        onOpenLogin={onOpenLogin}
        onOpenBannedModal={onOpenBannedModal}
        onShowToast={onShowToast}
        onGoToTransactions={onGoToTransactions}
        initialPackageId={modalPackageId}
      />
    </div>
  );
}
