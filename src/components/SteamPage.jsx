import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../utils/format';
import SteamKeyModal, { STEAM_KEY_PACKAGES } from './SteamKeyModal';

export default function SteamPage({
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
  const [isSteamModalOpen, setIsSteamModalOpen] = useState(false);
  const [modalKeyId, setModalKeyId] = useState('original');
  const [pendingKeyId, setPendingKeyId] = useState(null);

  // Jika user baru saja login dan sebelumnya sedang memilih paket Steam Key
  useEffect(() => {
    if (authUser && pendingKeyId) {
      setModalKeyId(pendingKeyId);
      setIsSteamModalOpen(true);
      setPendingKeyId(null);
    }
  }, [authUser, pendingKeyId]);

  const categories = [
    { id: 'all', label: 'Semua Paket Steam (4)', icon: 'fa-border-all' },
    { id: 'original', label: 'Original Key (Rp 1.500)', icon: 'fa-brands fa-steam' },
    { id: 'epic', label: 'Epic Tier (Rp 3.500)', icon: 'fa-trophy' },
    { id: 'nsfw', label: 'NSFW 18+ (Rp 3.500)', icon: 'fa-heart' },
    { id: 'hanimentai', label: 'Hanimetai (Rp 3.500)', icon: 'fa-wand-magic-sparkles' }
  ];

  const filteredKeys = STEAM_KEY_PACKAGES.filter((pkg) => {
    const matchCategory = activeCategory === 'all' || pkg.id === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchCategory;
    return (
      matchCategory &&
      (pkg.name.toLowerCase().includes(q) ||
        pkg.desc.toLowerCase().includes(q) ||
        pkg.badge.toLowerCase().includes(q))
    );
  });

  const handleOpenKeyModal = (keyId = 'original') => {
    if (isBanned) {
      onOpenBannedModal?.();
      onShowToast?.('Akses Ditolak: Akun Anda sedang di-banned!', 'fa-ban text-danger');
      return;
    }

    if (!authUser) {
      setPendingKeyId(keyId);
      onOpenLogin?.();
      onShowToast?.('Silakan login terlebih dahulu untuk membeli Steam Key!', 'fa-right-to-bracket text-warning');
      return;
    }

    setModalKeyId(keyId);
    setIsSteamModalOpen(true);
  };

  return (
    <div className="topup-page-container steam-page-container">
      {/* 1. Header Navigation Bar */}
      <section className="topup-page-hero steam-page-hero">
        <div className="topup-hero-bg-wrap">
          <img
            src="/topup-banner.svg"
            alt="ChaizStore Steam Center Banner"
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
          <div className="steam-page-nav-bar" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap' }}>
            {onBackToTopUp && (
              <button
                type="button"
                className="btn btn-outline steam-btn-back"
                onClick={onBackToTopUp}
                title="Kembali ke Halaman Menu Top Up"
                style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '8px' }}
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
                style={{ padding: '8px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '8px', opacity: 0.85 }}
              >
                <i className="fa-solid fa-house"></i>
                <span>Beranda Toko</span>
              </button>
            )}
            <div className="topup-page-status-pill" style={{ marginLeft: 'auto' }}>
              <span className="live-status-dot"></span>
              <span>Layanan Steam Key Online 24 Jam</span>
            </div>
          </div>

          <div className="topup-hero-content">
            <div className="topup-hero-badge-row">
              <span className="topup-hero-badge" style={{ background: 'rgba(102, 192, 244, 0.15)', borderColor: 'rgba(102, 192, 244, 0.4)', color: '#66c0f4' }}>
                <i className="fa-brands fa-steam text-cyan"></i> CHAIZSTORE STEAM CENTER
              </span>
              <span className="badge-status badge-bestseller" style={{ fontSize: '11px', padding: '4px 10px' }}>
                Resmi & Termurah
              </span>
            </div>

            <h1 className="topup-hero-title">
              Pusat Steam Key <span>Resmi Valve</span>
            </h1>
            <p className="topup-hero-sub">
              Dapatkan Steam Key game original berlisensi resmi Valve dengan aktivasi permanen di library Steam PC & Laptop Anda. Harga termurah mulai <strong>Rp 1.500/key</strong>, proses kilat otomatis 1-3 menit langsung dikirimkan ke WhatsApp & Email Anda!
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
                  <small>Garansi Resmi Valve</small>
                </div>
              </div>
              <div className="topup-stat-item">
                <i className="fa-brands fa-steam text-cyan"></i>
                <div>
                  <strong>Global Region</strong>
                  <small>Library PC & Laptop</small>
                </div>
              </div>
              <div className="topup-stat-item">
                <i className="fa-brands fa-whatsapp text-success"></i>
                <div>
                  <strong>WhatsApp Ready</strong>
                  <small>Kirim Otomatis</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Katalog 4 Varian Paket Steam Key */}
      <section className="katalog-section" style={{ paddingTop: '20px' }}>
        <div className="container">
          <div className="section-title text-center">
            <span className="subheading" style={{ color: '#66c0f4' }}>
              <i className="fa-brands fa-steam"></i> MENU STEAM KEY ORIGINAL
            </span>
            <h2>Pilih Varian Paket Game Steam</h2>
            <p>
              Tersedia 4 paket pilihan Steam Key resmi: <strong>Original Key</strong>, <strong>Epic Tier</strong>, <strong>NSFW 18+</strong>, dan <strong>Hanimetai</strong> dengan harga termurah & garansi valid 100%.
            </p>
          </div>

          {/* Filter Categories Bar */}
          <div className="category-tabs" id="steamCategoryTabs">
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

          {/* Product Grid Layout (4 Paket Steam) */}
          <div className="product-grid" style={{ marginTop: '28px' }}>
            {filteredKeys.map((pkg) => (
              <div
                key={pkg.id}
                className="product-card has-banner"
                onClick={() => handleOpenKeyModal(pkg.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-top-bar">
                  <div className="card-top-left">
                    <span className="product-category-pill" style={{ margin: 0, background: 'rgba(102, 192, 244, 0.18)', color: '#66c0f4', borderColor: 'rgba(102, 192, 244, 0.35)' }}>
                      <i className="fa-brands fa-steam"></i> STEAM
                    </span>
                  </div>
                  <span className={`badge-status ${pkg.badgeClass}`}>{pkg.badge}</span>
                </div>

                {/* Banner Image Steam Sesuai Judul / Paket */}
                <div className="product-banner-wrap">
                  <img
                    src={`/${pkg.image || 'steam.png'}`}
                    alt={pkg.name}
                    className="product-banner-img"
                    loading="lazy"
                  />
                  <div className="product-banner-overlay">
                    <span className="product-category-pill">STEAM KEY RESMI</span>
                    <h3 className="product-banner-title">{pkg.name}</h3>
                  </div>
                </div>

                {/* Fitur / Deskripsi */}
                <ul className="product-banner-features" style={{ margin: '14px 0 10px' }}>
                  <li>
                    <i className="fa-solid fa-circle-check text-cyan"></i>
                    <span>{pkg.desc}</span>
                  </li>
                  <li>
                    <i className="fa-solid fa-circle-check text-cyan"></i>
                    <span>Aktivasi Global Permanen di Library Steam</span>
                  </li>
                  <li>
                    <i className="fa-solid fa-circle-check text-cyan"></i>
                    <span>100% Legal & Bergaransi Kode Valid</span>
                  </li>
                </ul>

                {/* Indikator Sisa Stok */}
                <div className="card-stock-marketing stock-status-available">
                  <div className="stock-mkt-left">
                    <i className="fa-solid fa-bolt-lightning text-emerald"></i>
                    <span className="stock-mkt-label">Sisa Stok:</span>
                  </div>
                  <span className="stock-mkt-badge badge-available">
                    <strong>50</strong> Key Ready
                  </span>
                </div>

                {/* Price Box */}
                <div className="product-price-box">
                  <div>
                    <span className="price-label">Harga Satuan</span>
                    <div className="current-price" style={{ color: '#66c0f4' }}>{formatRupiah(pkg.price)}</div>
                  </div>
                  <span className="price-unit">/ {pkg.unit}</span>
                </div>

                {/* Action Button: Beli Langsung */}
                <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #1075bb 0%, #06b6d4 100%)', borderColor: '#38bdf8' }}
                    onClick={() => handleOpenKeyModal(pkg.id)}
                  >
                    <i className="fa-solid fa-bag-shopping"></i> Beli {pkg.name.replace('KEY ', '')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredKeys.length === 0 && (
            <div className="empty-state">
              <i className="fa-brands fa-steam"></i>
              <h3>Paket Steam Key Tidak Ditemukan</h3>
              <p>Coba pilih kategori lain atau tampilkan semua varian paket Steam Key.</p>
              <button className="btn btn-outline" onClick={() => setActiveCategory('all')}>
                Tampilkan Semua Paket
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 3. Panduan Cara Redeem Steam Key dengan Background Banner AI */}
      <section className="topup-faq-section topup-guide-hero-banner">
        <div className="topup-guide-bg-wrap">
          <img
            src="/steam-guide-bg.jpg"
            alt="Panduan Aktivasi Steam Key ChaizStore"
            className="topup-guide-bg-banner"
            loading="lazy"
            onError={(e) => {
              if (!e.currentTarget.src.endsWith('.svg')) {
                e.currentTarget.src = '/topup-banner.svg';
              }
            }}
          />
          <div className="topup-guide-overlay"></div>
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="section-title text-center">
            <span className="subheading" style={{ color: '#66c0f4' }}>
              <i className="fa-brands fa-steam"></i> TUTORIAL LENGKAP
            </span>
            <h2 style={{ color: '#ffffff' }}>
              Cara Aktivasi Steam Key <span>di PC / Laptop</span>
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
              Panduan mudah dan cepat untuk me-redeem kode game Steam resmi yang Anda beli di ChaizStore.
            </p>
          </div>

          <div className="topup-guide-grid">
            <div className="guide-step-card">
              <span className="step-num" style={{ background: '#66c0f4', color: '#0f172a' }}>1</span>
              <div>
                <strong>Buka Aplikasi Steam</strong>
                <small>Login ke akun Steam Anda di PC atau Laptop.</small>
              </div>
            </div>
            <div className="guide-step-card">
              <span className="step-num" style={{ background: '#66c0f4', color: '#0f172a' }}>2</span>
              <div>
                <strong>Klik "+ Add a Game"</strong>
                <small>Terletak di pojok kiri bawah layar aplikasi Steam.</small>
              </div>
            </div>
            <div className="guide-step-card">
              <span className="step-num" style={{ background: '#66c0f4', color: '#0f172a' }}>3</span>
              <div>
                <strong>Pilih "Activate a Product..."</strong>
                <small>Klik opsi "Activate a Product on Steam...".</small>
              </div>
            </div>
            <div className="guide-step-card">
              <span className="step-num" style={{ background: '#66c0f4', color: '#0f172a' }}>4</span>
              <div>
                <strong>Masukkan Kode Steam Key</strong>
                <small>Ketik kode dari Admin ChaizStore & game siap di-download!</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal Khusus Pembelian Steam Key */}
      <SteamKeyModal
        isOpen={isSteamModalOpen}
        onClose={() => setIsSteamModalOpen(false)}
        initialKeyId={modalKeyId}
        authUser={authUser}
        onShowToast={onShowToast}
      />
    </div>
  );
}
