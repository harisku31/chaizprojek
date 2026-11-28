import React, { useState, useRef } from 'react';
import { formatRupiah } from '../utils/format';
import MobileLegendsBuyModal, {
  MLBB_PACKAGES,
  buildMlbbCartItem,
  buildMlbbCheckoutItem
} from './MobileLegendsBuyModal';

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
  onProceedToPayment,
  onAddToCart,
  onProceedCheckout
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickUserId, setQuickUserId] = useState('');
  const [quickZoneId, setQuickZoneId] = useState('');
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState('10d');
  const [modalFocusAccount, setModalFocusAccount] = useState(false);

  const userIdRef = useRef(null);

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
      title: 'Masukan Data Akun (User ID & Zone ID)',
      desc: 'Masukkan User ID dan Zone ID dengan benar. Contoh: 1268190411 (15148)'
    },
    {
      num: 3,
      title: 'Pilih Metode Pembayaran',
      desc: 'Masukkan ke Keranjang atau klik Bayar Sekarang lalu pilih metode pembayaran.'
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

  const selectedPkg =
    MLBB_PACKAGES.find((p) => p.id === selectedPkgId) || MLBB_PACKAGES[0];

  const cleanU = quickUserId.trim();
  const cleanZ = quickZoneId.trim();
  const isAccountReady = cleanU.length >= 4 && cleanZ.length >= 2;

  const handleOpenBuyModal = (pkgId, focusAccount = false) => {
    setSelectedPkgId(pkgId);
    setModalFocusAccount(focusAccount);
    setIsBuyModalOpen(true);
  };

  const handleActionWithPackage = (pkg, mode) => {
    if (isBanned) {
      onOpenBannedModal?.();
      onShowToast?.('Akses Ditolak: Akun Anda sedang di-banned!', 'fa-ban text-danger');
      return;
    }

    setSelectedPkgId(pkg.id);

    if (!isAccountReady) {
      onShowToast?.('Silakan isi Masukan Data Akun (User ID & Zone ID) terlebih dahulu!', 'fa-id-card text-cyan');
      handleOpenBuyModal(pkg.id, true);
      return;
    }

    if (mode === 'cart') {
      if (typeof onAddToCart === 'function') {
        onAddToCart(buildMlbbCartItem(pkg, cleanU, cleanZ));
      }
      return;
    }

    // Mode 'buy': buka CheckoutModal ChaizStore persis sama dengan Akun Premium
    if (typeof onProceedCheckout === 'function') {
      onProceedCheckout(buildMlbbCheckoutItem(pkg, cleanU, cleanZ));
    } else {
      handleOpenBuyModal(pkg.id, false);
    }
  };

  return (
    <div className="roblox-page-container mlbb-page-container" style={{ paddingTop: '16px', paddingBottom: '72px' }}>
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
              Cara Top Up ML Termurah &amp; Proses Cepat! Pilih nominal Diamonds (10 s/d 4404 Diamonds), isi Masukan Data Akun (User ID dan Zone ID), lalu klik Masukkan Keranjang atau Bayar Sekarang.
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
        {/* Masukan Data Akun (+ Keranjang & Bayar) + Panduan 4 Langkah */}
        <div className="mlbb-info-grid">
          <div className="mlbb-account-box mlbb-page-account-card" id="mlPageAccountSection">
            <div className="mlbb-account-box-header">
              <span className="mlbb-account-step-pill">
                <i className="fa-solid fa-user-check"></i> Masukan Data Akun
              </span>
              {isAccountReady && (
                <span className="roblox-verified-badge">
                  <i className="fa-solid fa-circle-check"></i> {cleanU} ({cleanZ})
                </span>
              )}
            </div>

            <div className="mlbb-account-fields-grid">
              <div className="mlbb-account-field">
                <label className="mlbb-account-label" htmlFor="mlQuickUserId">
                  User ID
                </label>
                <input
                  ref={userIdRef}
                  id="mlQuickUserId"
                  type="text"
                  inputMode="numeric"
                  className={`mlbb-account-input ${cleanU.length >= 4 ? 'is-valid' : ''}`}
                  placeholder="User ID (cth: 1268190411)"
                  value={quickUserId}
                  onChange={(e) => handleQuickUserIdChange(e.target.value)}
                />
              </div>

              <div className="mlbb-account-field">
                <label className="mlbb-account-label" htmlFor="mlQuickZoneId">
                  Zone ID
                </label>
                <input
                  id="mlQuickZoneId"
                  type="text"
                  inputMode="numeric"
                  className={`mlbb-account-input ${cleanZ.length >= 2 ? 'is-valid' : ''}`}
                  placeholder="Zone ID (cth: 15148)"
                  value={quickZoneId}
                  onChange={(e) => setQuickZoneId(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            <div className="mlbb-id-example-pill">
              <i className="fa-solid fa-circle-info text-cyan"></i>
              <span>
                Contoh: <strong>1268190411 (15148)</strong> &bull; Nominal dipilih:{' '}
                <strong>{selectedPkg.name} ({formatRupiah(selectedPkg.price)})</strong>
              </span>
            </div>

            <ul className="mlbb-account-notes">
              <li>Kami akan menghubungi nomor WhatsApp terdaftar jika ada kendala.</li>
              <li>Kode Voucher akan dikirimkan melalui nomor WhatsApp terdaftar.</li>
            </ul>

            {/* Tombol Masukkan Keranjang & Bayar Sekarang Langsung */}
            <div className="modal-dual-actions mlbb-page-dual-actions">
              <button
                type="button"
                className="btn btn-cart-action"
                onClick={() => handleActionWithPackage(selectedPkg, 'cart')}
              >
                <i className="fa-solid fa-cart-plus"></i> Masukkan Keranjang
              </button>
              <button
                type="button"
                className="btn btn-primary btn-buy-action"
                onClick={() => handleActionWithPackage(selectedPkg, 'buy')}
              >
                <i className="fa-solid fa-bolt"></i> Bayar Sekarang ({formatRupiah(selectedPkg.price)})
              </button>
            </div>
          </div>

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
            Klik kartu untuk memilih nominal, lalu klik <strong>Keranjang</strong> atau <strong>Bayar</strong>. Metode pembayaran sama persis dengan semua produk Akun Premium.
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
          {filteredPackages.map((pkg) => {
            const isSelected = selectedPkgId === pkg.id;
            return (
              <div
                key={pkg.id}
                className={`product-card roblox-card mlbb-diamond-card ${isSelected ? 'mlbb-card-selected' : ''}`}
                onClick={() => setSelectedPkgId(pkg.id)}
              >
                <div className="card-top-bar">
                  <div className="card-top-left">
                    <span className="product-category-pill roblox-card-pill">
                      <i className="fa-solid fa-gem"></i> {isSelected ? 'TERPILIH' : 'DIAMONDS'}
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

                <div className="card-actions roblox-card-actions mlbb-card-actions-row" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="btn btn-outline mlbb-cart-btn"
                    onClick={() => handleActionWithPackage(pkg, 'cart')}
                    title={`Masukkan ${pkg.name} ke keranjang`}
                  >
                    <i className="fa-solid fa-cart-plus"></i>
                    <span>Keranjang</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary roblox-buy-btn mlbb-buy-now-btn"
                    onClick={() => handleActionWithPackage(pkg, 'buy')}
                  >
                    <i className="fa-solid fa-bolt"></i>
                    <span>Bayar</span>
                  </button>
                </div>
              </div>
            );
          })}
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

        {/* Bar Konfirmasi Bawah Halaman: Keranjang & Bayar Sekarang */}
        <div className="mlbb-bottom-checkout-bar">
          <div className="mlbb-bottom-bar-info">
            <span className="mlbb-bottom-bar-tag">
              <i className="fa-solid fa-gem text-cyan"></i> Paket Dipilih
            </span>
            <strong>{selectedPkg.name} ({selectedPkg.breakdown})</strong>
            <small>
              {isAccountReady
                ? `Tujuan: ${cleanU} (${cleanZ})`
                : 'Belum isi User ID & Zone ID — isi di Masukan Data Akun atau klik tombol di samping'}
            </small>
          </div>

          <div className="mlbb-bottom-bar-actions">
            <div className="mlbb-bottom-bar-price">
              <span>Total</span>
              <strong>{formatRupiah(selectedPkg.price)}</strong>
            </div>
            <button
              type="button"
              className="btn btn-cart-action"
              onClick={() => handleActionWithPackage(selectedPkg, 'cart')}
            >
              <i className="fa-solid fa-cart-plus"></i> Masukkan Keranjang
            </button>
            <button
              type="button"
              className="btn btn-primary btn-buy-action"
              onClick={() => handleActionWithPackage(selectedPkg, 'buy')}
            >
              <i className="fa-solid fa-bolt"></i> Bayar Sekarang
            </button>
          </div>
        </div>
      </div>

      {/* Modal Pemilihan & Masukan Data Akun Mobile Legends */}
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
        onAddToCart={onAddToCart}
        onProceedCheckout={onProceedCheckout}
        initialPackageId={selectedPkgId}
        initialUserId={quickUserId}
        initialZoneId={quickZoneId}
        focusAccountInput={modalFocusAccount}
      />
    </div>
  );
}
