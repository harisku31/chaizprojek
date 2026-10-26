import React, { useState } from 'react';
import ProductCard from './ProductCard';

const WALLPAPER_VIDEOS = [
  {
    id: 'b9EkMc79ZSU',
    name: 'Netflix Cinema & Series',
    tag: 'Netflix 4K',
    icon: 'fa-solid fa-film text-danger'
  },
  {
    id: 'BoohroM_XdQ',
    name: 'Disney+ Universe Movies',
    tag: 'Disney+ Movies',
    icon: 'fa-solid fa-wand-magic-sparkles text-cyan'
  },
  {
    id: '8ugaeA-nMTc',
    name: 'Cyberpunk Gaming 4K',
    tag: 'Gaming 4K',
    icon: 'fa-solid fa-gamepad text-warning'
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
  const [currentVideoIdx, setCurrentVideoIdx] = useState(() => {
    return Math.floor(Math.random() * WALLPAPER_VIDEOS.length);
  });
  const [isVideoWallpaperActive, setIsVideoWallpaperActive] = useState(() => {
    try {
      const saved = localStorage.getItem('chaiz_video_wallpaper');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const handleShuffleVideo = () => {
    const nextIdx = (currentVideoIdx + 1) % WALLPAPER_VIDEOS.length;
    setCurrentVideoIdx(nextIdx);
    onShowToast?.(`Ganti Wallpaper Video: ${WALLPAPER_VIDEOS[nextIdx].name}`, 'fa-film text-cyan');
  };

  const handleToggleWallpaper = () => {
    const nextState = !isVideoWallpaperActive;
    setIsVideoWallpaperActive(nextState);
    try {
      localStorage.setItem('chaiz_video_wallpaper', JSON.stringify(nextState));
    } catch {}
    onShowToast?.(
      nextState ? 'Wallpaper Video Iklan Dinyalakan' : 'Wallpaper Video Iklan Dinonaktifkan',
      nextState ? 'fa-play text-success' : 'fa-eye-slash text-muted'
    );
  };

  const activeVideo = WALLPAPER_VIDEOS[currentVideoIdx];
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
      {/* Background Animated Video Wallpaper YouTube (Random 3 Iklan: Netflix, Disney+, Cyberpunk) */}
      {isVideoWallpaperActive && (
        <div className="catalog-wallpaper-bg-wrap">
          <div className="catalog-wallpaper-iframe-scaler">
            <iframe
              key={activeVideo.id}
              src={`https://www.youtube-nocookie.com/embed/${activeVideo.id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${activeVideo.id}&playsinline=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&modestbranding=1&enablejsapi=1`}
              title={activeVideo.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              className="catalog-wallpaper-iframe"
            />
          </div>
          {/* Dark Cinematic Vignette Overlay agar kartu produk & tombol tetap tajam & kontras */}
          <div className="catalog-wallpaper-overlay"></div>
        </div>
      )}

      <div className="container">
        <div className="section-title text-center">
          <span className="subheading">
            <i className="fa-solid fa-layer-group"></i> KATALOG LENGKAP
          </span>
          <h2>Pilih Layanan Premium Favoritmu</h2>
          <p>Tersedia akun Sharing maupun Private dengan harga bersahabat dan garansi penuh.</p>

          {/* Widget Kontrol Live Wallpaper Video Iklan */}
          <div className="wallpaper-control-bar">
            <div className="wallpaper-status-pill">
              <span className={`live-wallpaper-pulse ${isVideoWallpaperActive ? 'active' : 'off'}`}></span>
              <i className={activeVideo.icon}></i>
              <span className="wallpaper-title-text">
                Live Wallpaper: <strong>{activeVideo.name}</strong>
              </span>
            </div>

            <div className="wallpaper-btn-group">
              <button
                type="button"
                className="btn-switch-wallpaper"
                onClick={handleShuffleVideo}
                title="Ganti Video Iklan Acak Lainnya"
              >
                <i className="fa-solid fa-shuffle"></i>
                <span>Ganti Iklan ({currentVideoIdx + 1}/3)</span>
              </button>

              <button
                type="button"
                className="btn-toggle-wallpaper"
                onClick={handleToggleWallpaper}
                title={isVideoWallpaperActive ? 'Sembunyikan Wallpaper Video' : 'Nyalakan Wallpaper Video'}
              >
                <i className={isVideoWallpaperActive ? 'fa-solid fa-eye-slash' : 'fa-solid fa-play'}></i>
                <span>{isVideoWallpaperActive ? 'Sembunyikan' : 'Nyalakan'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pilihan Khusus di Atas: [ Akun Premium ] vs [ Top Up ] */}
        <div className="main-service-toggle-wrapper">
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
          <div className="empty-state" id="emptyState">
            <i className="fa-solid fa-magnifying-glass"></i>
            <h3>Akun Tidak Ditemukan</h3>
            <p>Coba gunakan kata kunci lain seperti "Netflix", "Spotify", atau "Canva".</p>
            <button className="btn btn-outline" onClick={onResetSearch}>
              Tampilkan Semua Akun
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
