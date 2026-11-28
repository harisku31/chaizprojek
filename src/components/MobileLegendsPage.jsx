import React, { useState } from 'react';
import { formatRupiah } from '../utils/format';
import MobileLegendsBuyModal, { MLBB_PACKAGES } from './MobileLegendsBuyModal';

/**
 * Halaman Khusus Top Up Mobile Legends Indonesia (Diamonds)
 */
export default function MobileLegendsPage({
  onBackToTopUp,
  onBackToStore,
  onShowToast,
  authUser,
  isBanned = false,
  onOpenLogin,
  onOpenBannedModal,
  onGoToTransactions,
  onProceedToPayment
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickUserId, setQuickUserId] = useState('');
  const [quickZoneId, setQuickZoneId] = useState('');
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState('10d');

  const categories = [
    { id: 'all', label: `Semua Nominal (${MLBB_PACKAGES.length})`, icon: 'fa-solid fa-border-all' },
    { id: 'hemat', label: 'Hemat (10 - 425 DM)', icon: 'fa-solid fa-gem' },
    { id: 'menengah', label: 'Menengah (512 - 1164 DM)', icon: 'fa-solid fa-fire' },
    { id: 'sultan', label: 'Sultan Pack (2199+ DM)', icon: 'fa-solid fa-crown' }
  ];

  const guideSteps = [
    {
      num: 1,
      title: 'Pilih Nominal Top Up',
      desc: 'Pilih Nominal Top Up yang di inginkan dari 36 paket Diamonds resmi.'
    },
    {
      num: 2,
      title: 'Masukkan User ID & Zone ID',
      desc: 'Masukkan User ID dan Zone ID dengan benar. Contoh: 1268190411 (15148)'
    },
    {
      num: 3,
      title: 'Pilih Metode Pembayaran',
      desc: 'Pilih Metode Pembayaran yang di inginkan (QRIS Otomatis, GoPay, DANA, atau Bank).'
    },
    {
      num: 4,
      title: 'Proses Instant Masuk Akun',
      desc: 'Selesaikan Pembayaran dan proses Top Up selesai dimasukkan ke akun Mobile Legends Anda.'
    }
  ];

  const handleQuickUserIdChange = (raw) => {
    const comboMatch = raw.match(/^\s*(\d+)\s*\((\d+)\)\s*$/);
    if (comboMatch) {
      setQuickUserId(comboMatch[1]);
      setQuickZoneId(comboMatch[2]);
      return;
    }
    setQuickUserId(raw.replace(/\D/g, ''));
  };

  const filteredPackages = MLBB_PACKAGES.filter((pkg) => {
    const matchCategory = activeCategory === 'all' || pkg.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchCategory;
    return (
      matchCategory &&
      (pkg.name.toLowerCase().includes(q) ||
        pkg.breakdown.toLowerCase().includes(q) ||
        String(pkg.amount).includes(q) ||
        String(pkg.price).includes(q))
    );
  });

  const handleOpenBuyModal = (pkgId) => {
    setSelectedPkgId(pkgId);
    setIsBuyModalOpen(true);
  };

  return (
    <div className="roblox-page-container mlbb-page-container" style={{ paddingTop: '16px', paddingBottom: '60px' }}>
      {/* Hero Banner Header Mobile Legends */}
      <div
        className="catalog-hero-banner roblox-page-hero mlbb-page-hero"
        style={{ position: 'relative', overflow: 'hidden', borderRadius: '0 0 24px 24px', marginBottom: '24px' }}
      >
        <div
          className="hero-bg-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/mobilelegends.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.25,
            filter: 'blur(2px) brightness(0.65)',
            zIndex: 0
          }}
        ></div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(11, 19, 41, 0.92) 0%, rgba(12, 74, 110, 0.85) 55%, rgba(15, 23, 42, 0.95) 100%)',
            zIndex: 1
          }}
        ></div>

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          {/* Breadcrumb & Layanan Badges */}
          <div className="roblox-page-nav-bar">
            <button
              type="button"
              className="btn btn-outline btn-sm roblox-nav-back-btn"
              onClick={onBackToTopUp}
            >
              <i className="fa-solid fa-arrow-left"></i> Semua Top Up
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm roblox-nav-home-btn"
              onClick={onBackToStore}
            >
              <i className="fa-solid fa-house"></i> Beranda Akun
            </button>

            <div className="mlbb-hero-status-group">
              <div className="roblox-status-pill">
                <i className="fa-regular fa-clock"></i>
                <span>Layanan 24 Jam</span>
              </div>
              <div className="roblox-status-pill mlbb-instant-pill">
                <i className="fa-solid fa-bolt"></i>
                <span>Proses Instant</span>
              </div>
            </div>
          </div>

          <div className="roblox-hero-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span className="roblox-hero-badge">
                <i className="fa-solid fa-gem"></i> MOBILE LEGENDS INDONESIA
              </span>
              <span className="roblox-hero-subbadge">
                <i className="fa-solid fa-shield-halved text-emerald"></i> Diamonds Resmi &amp; Legal 100%
              </span>
            </div>

            <h1 className="roblox-hero-title">
              Top Up <span className="roblox-text-accent">Mobile Legends Indonesia</span>
            </h1>
            <p className="roblox-hero-sub">
              Cara Top Up ML Termurah &amp; Proses Cepat! Pilih nominal Diamonds favoritmu mulai dari 10 Diamonds sampai 4404 Diamonds, cukup masukkan User ID dan Zone ID tanpa password akun.
            </p>

            <div className="roblox-hero-stats">
              <div className="topup-stat-item">
                <i className="fa-regular fa-clock text-cyan"></i>
                <div>
                  <strong>Layanan 24 Jam</strong>
                  <small>Aktif nonstop setiap hari</small>
                </div>
              </div>
              <div className="topup-stat-item">
                <i className="fa-solid fa-bolt text-warning"></i>
                <div>
                  <strong>Proses Instant</strong>
                  <small>Langsung masuk akun MLBB</small>
                </div>
              </div>
              <div className="topup-stat-item">
                <i className="fa-solid fa-gem text-cyan"></i>
                <div>
                  <strong>{MLBB_PACKAGES.length} Paket Diamonds</strong>
                  <small>Mulai Rp 5.000 (10 DM)</small>
                </div>
              </div>
              <div className="topup-stat-item">
                <i className="fa-solid fa-shield-halved text-emerald"></i>
                <div>
                  <strong>Hanya User ID &amp; Zone ID</strong>
                  <small>Contoh: 1268190411 (15148)</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="container roblox-katalog-section">
        {/* Panduan 4 Langkah + Input Cepat User ID & Zone ID */}
        <div className="mlbb-info-grid">
          <div className="mlbb-guide-card">
            <div className="mlbb-guide-header">
              <span className="roblox-subheading">
                <i className="fa-solid fa-bolt"></i> PANDUAN RESMI
              </span>
              <h3>Cara Top Up ML Termurah &amp; Proses Cepat :</h3>
            </div>
            <ol className="mlbb-steps-list">
              {guideSteps.map((step) => (
                <li key={step.num} className="mlbb-step-item">
                  <span className="mlbb-step-num">{step.num}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mlbb-quick-id-card">
            <div className="mlbb-guide-header">
              <span className="roblox-subheading">
                <i className="fa-solid fa-id-card"></i> DATA AKUN TUJUAN
              </span>
              <h3>Isi User ID &amp; Zone ID Lebih Dulu (Opsional)</h3>
              <p className="mlbb-quick-sub">
                Isi ID di bawah ini untuk otomatis terpasang saat Anda memilih nominal Diamonds, atau isi langsung saat checkout.
              </p>
            </div>

            <div className="mlbb-id-input-row">
              <div className="mlbb-id-field-col mlbb-userid-col">
                <label className="roblox-input-label" htmlFor="mlQuickUserId">
                  User ID
                </label>
                <input
                  id="mlQuickUserId"
                  type="text"
                  inputMode="numeric"
                  className="form-control roblox-input"
                  placeholder="1268190411"
                  value={quickUserId}
                  onChange={(e) => handleQuickUserIdChange(e.target.value)}
                />
              </div>

              <div className="mlbb-id-field-col mlbb-zoneid-col">
                <label className="roblox-input-label" htmlFor="mlQuickZoneId">
                  Zone ID
                </label>
                <div className="mlbb-zone-input-wrap">
                  <span className="mlbb-zone-paren">(</span>
                  <input
                    id="mlQuickZoneId"
                    type="text"
                    inputMode="numeric"
                    className="form-control roblox-input mlbb-zone-input"
                    placeholder="15148"
                    value={quickZoneId}
                    onChange={(e) => setQuickZoneId(e.target.value.replace(/\D/g, ''))}
                  />
                  <span className="mlbb-zone-paren">)</span>
                </div>
              </div>
            </div>

            <div className="mlbb-id-example-pill">
              <i className="fa-solid fa-circle-info text-cyan"></i>
              <span>
                Contoh: <strong>1268190411 (15148)</strong>
                {quickUserId && quickZoneId ? (
                  <span className="mlbb-ready-tag"> &bull; Tujuan: {quickUserId} ({quickZoneId})</span>
                ) : null}
              </span>
            </div>
          </div>
        </div>

        {/* Section Header + Search + Category Tabs */}
        <div className="section-header text-center" style={{ marginTop: '34px', marginBottom: '20px' }}>
          <span className="section-tag roblox-subheading">
            <i className="fa-solid fa-gem"></i> DIAMONDS MOBILE LEGENDS INDONESIA
          </span>
          <h2 className="section-title roblox-section-h2">
            Pilih Nominal Top Up Diamonds ({MLBB_PACKAGES.length} Varian)
          </h2>
          <p className="section-desc roblox-section-p">
            Klik paket Diamonds di bawah untuk langsung menyelesaikan pembayaran dan mengisi Diamond ke akun Mobile Legends Anda.
          </p>
        </div>

        {/* Search Input Nominal */}
        <div className="mlbb-search-wrap">
          <div className="search-input-inner">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              className="catalog-search-input"
              placeholder="Cari jumlah Diamonds atau harga... (contoh: 257, 717, 1050, 4404)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                title="Hapus pencarian"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="category-tabs" id="robloxCategoryTabs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <i className={cat.icon}></i> {cat.label}
            </button>
          ))}
        </div>

        {/* Product Grid: 36 Paket Diamonds */}
        <div className="mlbb-packages-catalog-grid">
          {filteredPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="product-card roblox-card mlbb-diamond-card"
              onClick={() => handleOpenBuyModal(pkg.id)}
            >
              <div className="card-top-bar">
                <div className="card-top-left">
                  <span className="product-category-pill roblox-card-pill">
                    <i className="fa-solid fa-gem"></i> DIAMONDS
                  </span>
                </div>
                <span className={`badge-status ${pkg.badgeClass}`}>{pkg.badge}</span>
              </div>

              <div className="roblox-card-banner mlbb-card-banner">
                <img
                  src="/mobilelegends.jpg"
                  alt={`Mobile Legends ${pkg.name}`}
                  className="roblox-card-bg-img"
                />
                <div className="roblox-card-icon-wrap mlbb-card-icon">
                  <i className="fa-solid fa-gem"></i>
                </div>
                <h3 className="roblox-card-title">{pkg.name}</h3>
                <span className="roblox-card-symbol">({pkg.breakdown})</span>
              </div>

              <ul className="product-banner-features roblox-card-features">
                <li>
                  <i className="fa-regular fa-clock"></i>
                  <span>Layanan 24 Jam &amp; Proses Instant</span>
                </li>
                <li>
                  <i className="fa-solid fa-id-card"></i>
                  <span>Via User ID &amp; Zone ID (Tanpa Password)</span>
                </li>
                <li>
                  <i className="fa-solid fa-circle-check"></i>
                  <span>{pkg.base} Diamond + {pkg.bonus} Bonus Resmi</span>
                </li>
              </ul>

              <div className="card-stock-marketing roblox-card-stock">
                <div className="stock-mkt-left">
                  <i className="fa-solid fa-bolt text-emerald"></i>
                  <span className="stock-mkt-label">Status:</span>
                </div>
                <span className="stock-mkt-badge badge-available">
                  <strong>Ready</strong> &bull; Instant
                </span>
              </div>

              <div className="product-price-box roblox-card-price-box">
                <div>
                  <span className="price-label">Harga Resmi</span>
                  <div className="current-price">{formatRupiah(pkg.price)}</div>
                </div>
                <span className="price-unit">/ {pkg.amount} DM</span>
              </div>

              <div className="card-actions roblox-card-actions">
                <button
                  type="button"
                  className="btn btn-primary roblox-buy-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenBuyModal(pkg.id);
                  }}
                >
                  <i className="fa-solid fa-bolt"></i>
                  <span>Beli {pkg.name}</span>
                  <i className="fa-solid fa-arrow-right" style={{ fontSize: '11px', marginLeft: '2px' }}></i>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredPackages.length === 0 && (
          <div className="empty-search" style={{ margin: '40px 0' }}>
            <i className="fa-solid fa-gem"></i>
            <h3>Nominal Diamonds Tidak Ditemukan</h3>
            <p>Maaf, tidak ada paket Diamonds yang cocok dengan pencarian &quot;{searchQuery}&quot;.</p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
            >
              Tampilkan Semua 36 Paket
            </button>
          </div>
        )}
      </div>

      {/* Modal Checkout Diamonds Mobile Legends */}
      <MobileLegendsBuyModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        authUser={authUser}
        isBanned={isBanned}
        onOpenLogin={onOpenLogin}
        onOpenBannedModal={onOpenBannedModal}
        onShowToast={onShowToast}
        onGoToTransactions={onGoToTransactions}
        onProceedToPayment={onProceedToPayment}
        initialPackageId={selectedPkgId}
        initialUserId={quickUserId}
        initialZoneId={quickZoneId}
      />
    </div>
  );
}
