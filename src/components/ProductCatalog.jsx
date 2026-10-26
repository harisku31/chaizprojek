import React from 'react';
import ProductCard from './ProductCard';

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
  { id: 20, left: '55%', top: '42%', size: 5, delay: '1.5s', dur: '2.8s', color: 'cyan' },
  { id: 21, left: '62%', top: '85%', size: 7, delay: '2.3s', dur: '3.6s', color: 'purple' },
  { id: 22, left: '70%', top: '15%', size: 4, delay: '0.9s', dur: '2.4s', color: 'white' },
  { id: 23, left: '77%', top: '60%', size: 6, delay: '1.2s', dur: '3.3s', color: 'blue' },
  { id: 24, left: '84%', top: '25%', size: 5, delay: '0.4s', dur: '2.9s', color: 'cyan' },
  { id: 25, left: '91%', top: '78%', size: 7, delay: '1.9s', dur: '3.5s', color: 'purple' },
  { id: 26, left: '97%', top: '40%', size: 4, delay: '1.1s', dur: '2.5s', color: 'white' },
  { id: 27, left: '15%', top: '40%', size: 5, delay: '1.4s', dur: '3.0s', color: 'cyan' },
  { id: 28, left: '40%', top: '82%', size: 6, delay: '0.6s', dur: '3.2s', color: 'blue' },
  { id: 29, left: '60%', top: '22%', size: 4, delay: '2.2s', dur: '2.6s', color: 'white' },
  { id: 30, left: '85%', top: '50%', size: 6, delay: '1.3s', dur: '3.1s', color: 'cyan' }
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
  { id: 114, left: '5%', top: '55%', size: 5, delay: '1.0s', dur: '3.2s', color: 'blue' },
  { id: 115, left: '25%', top: '10%', size: 4, delay: '1.9s', dur: '2.7s', color: 'white' },
  { id: 116, left: '70%', top: '90%', size: 6, delay: '0.8s', dur: '3.5s', color: 'purple' }
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
      {/* Background Banner Wallpaper Baru Khusus Katalog dengan Animasi Effect Kaya & Cepat */}
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

      <div className="container">
        {/* =========================================================================
            BANNER WALLPAPER BARU KHUSUS KATALOG (DENGAN ENERGETIC CYBER EFFECTS)
           ========================================================================= */}
        <div className="catalog-hero-banner-card">
          <div className="catalog-hero-banner-bg">
            <img
              src="/catalog-wallpaper.png?v=2"
              alt="ChaizStore Catalog Banner Wallpaper"
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

            {/* 30x Dense Animated Floating Cyber Particles */}
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
