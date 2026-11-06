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
      {/* 1. Header Navigation Bar & Hero Banner */}
      <section className="topup-page-hero roblox-page-hero">
        <div className="topup-hero-bg-wrap">
          <img
            src="/roblox.png"
            alt="ChaizStore Roblox Center Banner"
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
          {/* Breadcrumb Navigation Buttons */}
          <div className="steam-page-nav-bar roblox-page-nav-bar">
            {onBackToTopUp && (
              <button
                type="button"
                className="btn btn-outline steam-btn-back roblox-nav-back-btn"
                onClick={onBackToTopUp}
                title="Kembali ke Halaman Menu Top Up"
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Kembali ke Halaman Top Up</span>
              </button>
            )}

            {onBackToStore && (
              <button
                type="button"
                className="btn btn-outline steam-btn-back roblox-nav-home-btn"
                onClick={onBackToStore}
                title="Kembali ke Beranda Toko"
              >
                <i className="fa-solid fa-house"></i>
                <span>Beranda Toko</span>
              </button>
            )}

            <div className="topup-page-status-pill roblox-status-pill">
              <span className="live-status-dot"></span>
              <span>Layanan Robux Online 24 Jam</span>
            </div>
          </div>

          <div className="topup-hero-content roblox-hero-content">
            <div className="topup-hero-badge-row">
              <span className="topup-hero-badge roblox-hero-badge">
                <i className="fa-solid fa-cube"></i> CHAIZSTORE ROBLOX STORE
              </span>
              <span className="badge-status badge-bestseller roblox-hero-subbadge">
                Via Username Resmi
              </span>
            </div>

            <h1 className="topup-hero-title roblox-hero-title">
              Pusat Robux Roblox <span className="roblox-text-accent">Via Username</span>
            </h1>
            <p className="topup-hero-sub roblox-hero-sub">
              Top up saldo Robux legal, cepat, dan aman 100%. Cukup masukkan <strong>Username Roblox kamu</strong> tanpa perlu password akun. Saldo Robux langsung masuk kilat (estimasi 1–5 menit) ke avatar kamu!
            </p>

            <div className="topup-hero-stats roblox-hero-stats">
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

      {/* 2. Katalog Kartu Robux Roblox */}
      <section className="katalog-section roblox-katalog-section">
        <div className="container">
          <div className="section-title text-center">
            <span className="subheading roblox-subheading">
              <i className="fa-solid fa-cube"></i> DAFTAR NOMINAL ROBUX VIA USERNAME
            </span>
            <h2 className="roblox-section-h2">Pilih Paket Robux Favorit Kamu</h2>
            <p className="roblox-section-p">
              Tersedia paket <strong>50r, 100r, 200r, 300r, 400r, hingga 500r</strong> dengan harga termurah, proses langsung masuk ke username akun Roblox kamu!
            </p>
          </div>

          {/* Filter Categories Bar */}
          <div className="category-tabs" id="robloxCategoryTabs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <i className={`fa-solid ${cat.icon}`}></i> {cat.label}
              </button>
            ))}
          </div>

          {/* Product Grid Layout (6 Paket Robux) */}
          <div className="product-grid roblox-product-grid">
            {filteredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="product-card has-banner roblox-card"
                onClick={() => handleOpenBuyModal(pkg.id)}
              >
                <div className="card-top-bar">
                  <div className="card-top-left">
                    <span className="product-category-pill roblox-card-pill">
                      <i className="fa-solid fa-cube"></i> ROBUX
                    </span>
                  </div>
                  <span className={`badge-status ${pkg.badgeClass}`}>
                    {pkg.badge}
                  </span>
                </div>

                {/* Banner / Visual Wrap */}
                <div className="product-banner-wrap roblox-card-banner">
                  <img
                    src="/roblox.png"
                    alt={pkg.name}
                    className="roblox-card-bg-img"
                  />
                  <div className="roblox-card-icon-wrap">
                    <i className="fa-solid fa-cube"></i>
                  </div>
                  <h3 className="roblox-card-title">{pkg.name}</h3>
                  <span className="roblox-card-symbol">{pkg.decoSymbol}</span>
                </div>

                {/* Features List */}
                <ul className="product-banner-features roblox-card-features">
                  <li>
                    <i className="fa-solid fa-circle-check"></i>
                    <span>Cukup Username Roblox (No Password)</span>
                  </li>
                  <li>
                    <i className="fa-solid fa-circle-check"></i>
                    <span>Garansi Robux Resmi Masuk 100%</span>
                  </li>
                  <li>
                    <i className="fa-solid fa-circle-check"></i>
                    <span>Estimasi Kilat 1–5 Menit Proses</span>
                  </li>
                </ul>

                {/* Status Stok */}
                <div className="card-stock-marketing stock-status-available roblox-card-stock">
                  <div className="stock-mkt-left">
                    <i className="fa-solid fa-bolt-lightning"></i>
                    <span className="stock-mkt-label">Status:</span>
                  </div>
                  <span className="stock-mkt-badge badge-available">
                    <strong>Ready Stock</strong>
                  </span>
                </div>

                {/* Price Box */}
                <div className="product-price-box roblox-card-price-box">
                  <div>
                    <span className="price-label">Harga Satuan</span>
                    <div className="current-price">
                      {formatRupiah(pkg.price)}
                    </div>
                  </div>
                  <span className="price-unit">/ {pkg.symbol}</span>
                </div>

                {/* Action Button: Beli Robux */}
                <div className="card-actions roblox-card-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="btn btn-primary roblox-buy-btn"
                    onClick={() => handleOpenBuyModal(pkg.id)}
                  >
                    <i className="fa-solid fa-cube"></i>
                    <span>Beli Robux ({formatRupiah(pkg.price)})</span>
                    <i className="fa-solid fa-arrow-right"></i>
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
