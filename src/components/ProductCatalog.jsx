import React, { useState } from 'react';
import ProductCard from './ProductCard';

const WALLPAPER_VIDEOS = [
  {
    id: '8ugaeA-nMTc',
    name: 'Cyberpunk Blue Neon 4K',
    shortName: 'Cyber Neon 4K',
    tag: 'Cyber Neon',
    icon: 'fa-solid fa-bolt text-cyan'
  },
  {
    id: 'b9EkMc79ZSU',
    name: 'Netflix Cinema & Series 4K',
    shortName: 'Netflix 4K',
    tag: 'Netflix',
    icon: 'fa-solid fa-film text-danger'
  },
  {
    id: 'BoohroM_XdQ',
    name: 'Disney+ Universe Movies 4K',
    shortName: 'Disney+ 4K',
    tag: 'Disney+',
    icon: 'fa-solid fa-wand-magic-sparkles text-cyan'
  }
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
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const [isVideoMode, setIsVideoMode] = useState(true);

  const activeVideo = WALLPAPER_VIDEOS[currentVideoIdx];

  const handleNextVideo = () => {
    const nextIdx = (currentVideoIdx + 1) % WALLPAPER_VIDEOS.length;
    setCurrentVideoIdx(nextIdx);
    setIsVideoMode(true);
    onShowToast?.(`Ganti Wallpaper Video: ${WALLPAPER_VIDEOS[nextIdx].name}`, 'fa-film text-cyan');
  };

  const handleToggleVideoMode = () => {
    const nextState = !isVideoMode;
    setIsVideoMode(nextState);
    onShowToast?.(
      nextState ? 'Wallpaper Video Bergerak Dinyalakan' : 'Wallpaper Mode Foto Diaktifkan',
      nextState ? 'fa-video text-success' : 'fa-image text-muted'
    );
  };
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
      {/* Background Banner Wallpaper Baru Khusus Katalog */}
      <div className="catalog-wallpaper-bg-wrap">
        <img
          src="/catalog-wallpaper.png?v=2"
          alt="ChaizStore Catalog Wallpaper"
          className="catalog-wallpaper-img"
          loading="eager"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith('banner.jpg')) {
              e.currentTarget.src = '/banner.jpg';
            }
          }}
        />
        <div className="catalog-wallpaper-overlay"></div>
      </div>

      <div className="container">
        {/* =========================================================================
            BANNER WALLPAPER BARU KHUSUS KATALOG (DENGAN LIVE VIDEO BERGERAK 4K)
           ========================================================================= */}
        <div className="catalog-hero-banner-card">
          <div className="catalog-hero-banner-bg">
            {/* Foto Background Wallpaper Dasar (Tetap ada sebagai fallback & base) */}
            <img
              src="/catalog-wallpaper.png?v=2"
              alt="ChaizStore Catalog Banner Wallpaper"
              className="catalog-hero-banner-img"
              loading="eager"
            />

            {/* Live Video Wallpaper Bergerak 4K (AutoPlay, Looping, Muted, No Controls) */}
            {isVideoMode && (
              <div className="catalog-banner-video-container">
                <iframe
                  key={activeVideo.id}
                  src={`https://www.youtube-nocookie.com/embed/${activeVideo.id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${activeVideo.id}&playsinline=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&modestbranding=1&enablejsapi=1`}
                  title={activeVideo.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  className="catalog-banner-video-iframe"
                />
              </div>
            )}

            {/* Glowing Cyber Aurora Waves & Lighting Overlays */}
            <div className="catalog-animated-cyber-aurora"></div>
            <div className="catalog-hero-banner-overlay"></div>
            <div className="catalog-hero-banner-glow"></div>
          </div>

          <div className="catalog-hero-banner-body">
            <div className="catalog-hero-banner-left">
              <div className="catalog-hero-banner-badge-row">
                <div className="catalog-hero-banner-badge">
                  <i className="fa-solid fa-crown text-warning"></i>
                  <span className="badge-desktop-label">KATALOG RESMI CHAIZSTORE • 100% LEGAL & BERGARANSI</span>
                  <span className="badge-mobile-label">👑 Katalog Resmi 100% Legal</span>
                </div>

                {/* Kontrol Motion Video Bergerak */}
                <div className="catalog-motion-ctrl-pill">
                  <span className={`motion-dot-indicator ${isVideoMode ? 'active' : 'paused'}`}></span>
                  <i className={activeVideo.icon}></i>
                  <span className="motion-label-text">
                    {isVideoMode ? activeVideo.shortName : 'Mode Foto'}
                  </span>
                  <button
                    type="button"
                    className="btn-motion-action"
                    onClick={handleNextVideo}
                    title="Ganti Video Iklan Berikutnya"
                  >
                    <i className="fa-solid fa-shuffle"></i>
                    <span>Ganti ({currentVideoIdx + 1}/3)</span>
                  </button>
                  <button
                    type="button"
                    className="btn-motion-action btn-motion-mode"
                    onClick={handleToggleVideoMode}
                    title={isVideoMode ? 'Ganti ke Foto Saja' : 'Nyalakan Video Bergerak'}
                  >
                    <i className={isVideoMode ? 'fa-solid fa-image' : 'fa-solid fa-video'}></i>
                    <span>{isVideoMode ? 'Foto' : 'Video'}</span>
                  </button>
                </div>
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
