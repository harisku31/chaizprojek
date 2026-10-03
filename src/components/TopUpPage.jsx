import React, { useState } from 'react';
import { formatRupiah } from '../utils/format';
import SteamKeyModal, { STEAM_KEY_PACKAGES } from './SteamKeyModal';

export default function TopUpPage({
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

  const categories = [
    { id: 'all', label: 'Semua Steam Key', icon: 'fa-border-all' },
    { id: 'original', label: 'Original (Rp 1.500)', icon: 'fa-brands fa-steam' },
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
    // 1. Cek jika akun terkena banned
    if (isBanned) {
      onOpenBannedModal?.();
      onShowToast?.('Akses Ditolak: Akun Anda sedang di-banned!', 'fa-ban text-danger');
      return;
    }

    // 2. Cek jika belum login
    if (!authUser) {
      onOpenLogin?.();
      onShowToast?.('Silakan login terlebih dahulu untuk membeli Steam Key!', 'fa-right-to-bracket text-warning');
      return;
    }

    setModalKeyId(keyId);
    setIsSteamModalOpen(true);
  };

  return (
    <div className="topup-page-container">
      {/* 1. Header Banner & Navigasi Halaman */}
      <section className="topup-page-hero">
        <div className="container">
          <div className="topup-breadcrumb-bar">
            <button
              type="button"
              className="topup-back-btn"
              onClick={onBackToStore}
              title="Kembali ke halaman Akun Premium"
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Kembali ke Akun Premium</span>
            </button>

            <div className="topup-page-status-pill">
              <span className="live-status-dot"></span>
              <span>Layanan Steam Key Online 24 Jam</span>
            </div>

            <button
              type="button"
              className="topup-newtab-btn"
              onClick={() => window.open(window.location.origin + '/#topup', '_blank')}
              title="Buka Halaman Top Up di Tab Browser Baru"
            >
              <i className="fa-solid fa-arrow-up-right-from-square"></i>
              <span>Buka di Tab Baru</span>
            </button>
          </div>

          <div className="topup-hero-content">
            <span className="topup-hero-badge">
              <i className="fa-brands fa-steam text-cyan"></i> CHAIZSTORE STEAM TOP UP CENTER
            </span>
            <h1 className="topup-hero-title">
              Pusat Steam Key <span>Resmi & Termurah</span>
            </h1>
            <p className="topup-hero-sub">
              Dapatkan Steam Key game resmi Valve mulai dari <strong>Rp 1.500/key</strong>. Proses kilat 1-3 menit langsung dikirimkan ke WhatsApp & Email Anda dengan aktivasi permanen di library Steam.
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

      {/* 2. Katalog Steam Key (Tata Letak Mirip Akun Premium) */}
      <section className="katalog-section" style={{ paddingTop: '20px' }}>
        <div className="container">
          <div className="section-title text-center">
            <span className="subheading">
              <i className="fa-brands fa-steam"></i> KATALOG STEAM KEY
            </span>
            <h2>Pilih Varian Steam Key Favoritmu</h2>
            <p>Tersedia Steam Key Original, Epic Tier, NSFW 18+, hingga Hanimetai dengan harga terjangkau.</p>
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

          {/* Product Grid Layout (Sama persis seperti Akun Premium) */}
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
                    <span className="product-category-pill" style={{ margin: 0 }}>
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
                    <i className="fa-solid fa-circle-check"></i>
                    <span>{pkg.desc}</span>
                  </li>
                  <li>
                    <i className="fa-solid fa-circle-check"></i>
                    <span>Aktivasi Global Permanen di Library Steam</span>
                  </li>
                  <li>
                    <i className="fa-solid fa-circle-check"></i>
                    <span>100% Legal & Bergaransi Kode Valid</span>
                  </li>
                </ul>

                {/* Indikator Sisa Stok (Gaya Marketing Badge) */}
                <div className="card-stock-marketing stock-status-available">
                  <div className="stock-mkt-left">
                    <i className="fa-solid fa-bolt-lightning text-emerald"></i>
                    <span className="stock-mkt-label">Sisa Stok:</span>
                  </div>
                  <span className="stock-mkt-badge badge-available">
                    <strong>50</strong> Akun
                  </span>
                </div>

                {/* Price Box */}
                <div className="product-price-box">
                  <div>
                    <span className="price-label">Harga Satuan</span>
                    <div className="current-price">{formatRupiah(pkg.price)}</div>
                  </div>
                  <span className="price-unit">/ {pkg.unit}</span>
                </div>

                {/* Action Button: Khusus Tombol Beli Langsung (Tanpa Keranjang) */}
                <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleOpenKeyModal(pkg.id)}
                  >
                    <i className="fa-solid fa-bag-shopping"></i> Beli
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredKeys.length === 0 && (
            <div className="empty-state">
              <i className="fa-brands fa-steam"></i>
              <h3>Paket Steam Key Tidak Ditemukan</h3>
              <p>Coba pilih kategori lain atau tampilkan semua paket Steam Key.</p>
              <button className="btn btn-outline" onClick={() => setActiveCategory('all')}>
                Tampilkan Semua Key
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 3. Panduan Cara Redeem Steam Key */}
      <section className="topup-faq-section" style={{ background: 'var(--bg-surface)', padding: '50px 0', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div className="section-title text-center">
            <span className="subheading">
              <i className="fa-solid fa-circle-question"></i> PANDUAN PENGGUNA
            </span>
            <h2>Cara Aktivasi Steam Key di PC / Laptop</h2>
            <p>Panduan mudah dan cepat untuk me-redeem kode game Steam yang Anda beli.</p>
          </div>

          <div className="topup-steps-grid" style={{ marginTop: '30px' }}>
            <div className="step-card">
              <span className="step-num">1</span>
              <div>
                <strong>Buka Aplikasi Steam</strong>
                <small>Login ke akun Steam Anda di PC atau Laptop.</small>
              </div>
            </div>
            <div className="step-card">
              <span className="step-num">2</span>
              <div>
                <strong>Klik Menu "Add a Game"</strong>
                <small>Terletak di pojok kiri bawah layar aplikasi Steam.</small>
              </div>
            </div>
            <div className="step-card">
              <span className="step-num">3</span>
              <div>
                <strong>Pilih "Activate a Product"</strong>
                <small>Klik opsi "Activate a Product on Steam...".</small>
              </div>
            </div>
            <div className="step-card">
              <span className="step-num">4</span>
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
        isBanned={isBanned}
        onOpenLogin={onOpenLogin}
        onOpenBannedModal={onOpenBannedModal}
        onShowToast={onShowToast}
      />
    </div>
  );
}
