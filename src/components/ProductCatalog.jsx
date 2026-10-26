import React from 'react';
import ProductCard from './ProductCard';

const CYBER_PARTICLES = [
  { id: 1, left: '10%', top: '35%', size: 5, delay: '0s', dur: '5.5s', color: 'cyan' },
  { id: 2, left: '24%', top: '65%', size: 4, delay: '1.2s', dur: '6.2s', color: 'blue' },
  { id: 3, left: '38%', top: '25%', size: 6, delay: '2.5s', dur: '4.8s', color: 'purple' },
  { id: 4, left: '52%', top: '70%', size: 4, delay: '0.8s', dur: '7.1s', color: 'cyan' },
  { id: 5, left: '68%', top: '40%', size: 5, delay: '3.1s', dur: '5.9s', color: 'blue' },
  { id: 6, left: '82%', top: '55%', size: 4, delay: '1.7s', dur: '6.5s', color: 'cyan' },
  { id: 7, left: '16%', top: '75%', size: 3, delay: '4.0s', dur: '5.2s', color: 'purple' },
  { id: 8, left: '46%', top: '48%', size: 5, delay: '2.0s', dur: '6.8s', color: 'cyan' },
  { id: 9, left: '76%', top: '22%', size: 4, delay: '3.6s', dur: '5.4s', color: 'blue' },
  { id: 10, left: '32%', top: '80%', size: 5, delay: '1.5s', dur: '6.0s', color: 'purple' },
  { id: 11, left: '62%', top: '30%', size: 3, delay: '0.5s', dur: '7.5s', color: 'cyan' },
  { id: 12, left: '92%', top: '62%', size: 5, delay: '2.8s', dur: '5.7s', color: 'blue' }
];

export default function ProductCatalog({
  products,
  currentCategory,
  onCategoryChange,
  searchQuery,
  onResetSearch,
  onOpenProductModal,
  onShowToast,
  highlightedProductId,
  onOpenSteamMenu,
  activeTab = 'store',
  onSwitchTab
}) {
  const categories = [
    { id: 'all', label: 'Semua Akun', icon: 'fa-border-all' },
    { id: 'streaming', label: 'Streaming Video', icon: 'fa-tv' },
    { id: 'musik', label: 'Musik', icon: 'fa-music' },
    { id: 'produktivitas', label: 'Produktivitas & Desain', icon: 'fa-pen-nib' },
    { id: 'ai', label: 'AI & Bot', icon: 'fa-brain' },
    { id: 'utility', label: 'VPN & Utilitas', icon: 'fa-shield-virus' }
  ];

  const filteredProducts = products.filter((product) => {
    const matchCategory =
      currentCategory === 'all' ||
      product.category.toLowerCase() === currentCategory.toLowerCase();

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchCategory;

    const matchSearch =
      product.name.toLowerCase().includes(q) ||
      product.category.toLowerCase().includes(q) ||
      (product.badge && product.badge.toLowerCase().includes(q)) ||
      (product.priceNote && product.priceNote.toLowerCase().includes(q)) ||
      product.features.some((f) => f.toLowerCase().includes(q)) ||
      product.durations.some(
        (d) => d.name.toLowerCase().includes(q) || (d.tag && d.tag.toLowerCase().includes(q))
      );

    return matchCategory && matchSearch;
  });

  return (
    <section className="katalog-section" id="katalog">
      {/* Background Banner Wallpaper Baru Khusus Katalog dengan Animasi Effect */}
      <div className="catalog-wallpaper-bg-wrap">
        <img
          src="/catalog-wallpaper.png?v=2"
          alt="ChaizStore Catalog Wallpaper"
          className="catalog-wallpaper-img living-motion"
          loading="eager"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith('banner.jpg')) {
              e.currentTarget.src = '/banner.jpg';
            }
          }}
        />
        {/* Ambient Section Cyber Aurora & Floating Light Particles */}
        <div className="catalog-fx-section-aurora"></div>
        <div className="catalog-fx-particles section-ambient-particles">
          {CYBER_PARTICLES.slice(0, 8).map((p) => (
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

      <div className="container">
        {/* =========================================================================
            BANNER WALLPAPER BARU KHUSUS KATALOG (DENGAN ANIMASI EFEK CAHAYA & PARTIKEL)
           ========================================================================= */}
        <div className="catalog-hero-banner-card">
          <div className="catalog-hero-banner-bg">
            <img
              src="/catalog-wallpaper.png?v=2"
              alt="ChaizStore Catalog Banner Wallpaper"
              className="catalog-hero-banner-img living-motion"
              loading="eager"
            />
            {/* Animated Cyber Aurora Light Stream */}
            <div className="catalog-fx-aurora-stream"></div>
            <div className="catalog-fx-aurora-secondary"></div>

            {/* Animated Floating Cyber Particles */}
            <div className="catalog-fx-particles">
              {CYBER_PARTICLES.map((p) => (
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

            {/* Dynamic Light Sheen Sweep */}
            <div className="catalog-fx-sheen"></div>

            <div className="catalog-hero-banner-overlay"></div>
            <div className="catalog-hero-banner-glow"></div>
          </div>

          <div className="catalog-hero-banner-body">
            <div className="catalog-hero-banner-left">
              <div className="catalog-hero-banner-badge">
                <i className="fa-solid fa-crown text-warning"></i>
                <span className="badge-desktop-label">KATALOG RESMI CHAIZSTORE • 100% LEGAL & BERGARANSI</span>
                <span className="badge-mobile-label">👑 Katalog Resmi 100% Legal</span>
              </div>

              <h2 className="catalog-hero-banner-title">
                Pilih Layanan Premium Favoritmu
              </h2>

              <p className="catalog-hero-banner-desc">
                Tersedia akun Sharing maupun Private dengan harga bersahabat dan garansi penuh selama berlangganan. Streaming film 4K, musik bebas iklan, editing VIP & AI canggih!
              </p>

              <div className="catalog-hero-banner-perks">
                <span className="catalog-hero-perk">
                  <i className="fa-solid fa-shield-halved text-success"></i> Garansi Penuh
                </span>
                <span className="catalog-hero-perk">
                  <i className="fa-solid fa-bolt text-warning"></i> Aktivasi Kilat 1-5 Menit
                </span>
                <span className="catalog-hero-perk">
                  <i className="fa-solid fa-gem text-cyan"></i> Harga Bersahabat
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
                    className={`service-toggle-btn ${activeTab === 'store' ? 'active' : ''}`}
                    onClick={() => onSwitchTab?.('store')}
                  >
                    <i className="fa-solid fa-crown text-warning"></i>
                    <span>Akun Premium</span>
                  </button>
                  <button
                    type="button"
                    className={`service-toggle-btn ${activeTab === 'topup' ? 'active' : ''}`}
                    onClick={() => onSwitchTab?.('topup')}
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
                    <i className="fa-solid fa-shield-check text-cyan"></i> 100% Legal & Terpercaya
                  </span>
                </div>
                <div className="catalog-visual-apps">
                  <div className="catalog-v-app">
                    <i className="fa-solid fa-film text-danger"></i>
                    <span>Netflix</span>
                  </div>
                  <div className="catalog-v-app">
                    <i className="fa-brands fa-spotify text-success"></i>
                    <span>Spotify</span>
                  </div>
                  <div className="catalog-v-app">
                    <i className="fa-brands fa-youtube text-danger"></i>
                    <span>YouTube</span>
                  </div>
                  <div className="catalog-v-app">
                    <i className="fa-solid fa-palette text-cyan"></i>
                    <span>Canva</span>
                  </div>
                </div>
                <div className="catalog-visual-stats">
                  <div className="v-stat-col">
                    <strong>15+</strong>
                    <small>Produk</small>
                  </div>
                  <div className="v-stat-sep"></div>
                  <div className="v-stat-col">
                    <strong>100%</strong>
                    <small>Garansi</small>
                  </div>
                  <div className="v-stat-sep"></div>
                  <div className="v-stat-col">
                    <strong>1-5 Mnt</strong>
                    <small>Aktivasi</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Filter Tabs */}
        <div className="category-tabs" id="categoryTabs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`cat-btn ${currentCategory === cat.id ? 'active' : ''}`}
              data-category={cat.id}
              onClick={() => onCategoryChange(cat.id)}
            >
              <i className={`fa-solid ${cat.icon}`}></i> {cat.label}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="product-grid" id="productGrid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenModal={onOpenProductModal}
                onShowToast={onShowToast}
                isHighlighted={highlightedProductId === product.id}
                onOpenSteamMenu={onOpenSteamMenu}
              />
            ))}
          </div>
        ) : (
          <div className="empty-search">
            <i className="fa-solid fa-magnifying-glass"></i>
            <h3>Layanan Tidak Ditemukan</h3>
            <p>Maaf, tidak ada akun yang cocok dengan kata kunci "{searchQuery}".</p>
            <button type="button" className="btn btn-outline" onClick={onResetSearch}>
              Reset Pencarian
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
