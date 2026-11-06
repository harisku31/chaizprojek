import React from 'react';
import ProductCard from './ProductCard';

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
    { id: 'all', label: 'Semua Akun', icon: 'fa-solid fa-border-all' },
    { id: 'streaming', label: 'Streaming Video', icon: 'fa-solid fa-tv' },
    { id: 'musik', label: 'Musik VIP', icon: 'fa-solid fa-music' },
    { id: 'produktivitas', label: 'Produktivitas & Desain', icon: 'fa-solid fa-pen-nib' },
    { id: 'ai', label: 'AI & Bot', icon: 'fa-solid fa-brain' },
    { id: 'utility', label: 'VPN & Utilitas', icon: 'fa-solid fa-shield-virus' }
  ];

  const filteredProducts = (products || []).filter((product) => {
    if (!product) return false;
    const matchCategory =
      currentCategory === 'all' ||
      ((product.category || '').toLowerCase() === (currentCategory || '').toLowerCase());

    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) return matchCategory;

    const matchSearch =
      (product.name || '').toLowerCase().includes(q) ||
      (product.category || '').toLowerCase().includes(q) ||
      (product.badge && product.badge.toLowerCase().includes(q)) ||
      (product.priceNote && product.priceNote.toLowerCase().includes(q)) ||
      (Array.isArray(product.features) && product.features.some((f) => f && f.toLowerCase().includes(q))) ||
      (Array.isArray(product.durations) && product.durations.some(
        (d) => (d.name && d.name.toLowerCase().includes(q)) || (d.tag && d.tag.toLowerCase().includes(q))
      ));

    return matchCategory && matchSearch;
  });

  return (
    <section className="katalog-section itemku-catalog-section" id="katalog">
      <div className="container">
        {/* Marketplace Section Header */}
        <div className="itemku-catalog-header">
          <div className="catalog-header-left">
            <div className="catalog-title-badge">
              <i className="fa-solid fa-store text-blue"></i>
              <span>KATALOG RESMI</span>
            </div>
            <h2 className="catalog-main-title">
              Pilihan Akun Premium & Digital Goods
            </h2>
            <p className="catalog-subtitle">
              Pilih akun favoritmu dengan harga termurah, legal 100% dan bergaransi penuh selama pemakaian.
            </p>
          </div>

          {/* Quick Toggle Akun vs Top Up */}
          <div className="catalog-service-switcher">
            <button
              type="button"
              className={`switcher-tab ${activeTab === 'store' ? 'active' : ''}`}
              onClick={() => onSwitchTab?.('store')}
            >
              <i className="fa-solid fa-crown"></i>
              <span>Akun Premium</span>
            </button>
            <button
              type="button"
              className={`switcher-tab ${activeTab === 'topup' ? 'active' : ''}`}
              onClick={() => onSwitchTab?.('topup')}
            >
              <i className="fa-solid fa-bolt"></i>
              <span>Top Up Kilat</span>
              <span className="switcher-mini-tag">HOT</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs Bar (Itemku style pills) */}
        <div className="itemku-filter-bar">
          <div className="filter-pills-scroll">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`filter-pill-item ${currentCategory === cat.id ? 'active' : ''}`}
                onClick={() => {
                  onCategoryChange(cat.id);
                  if (searchQuery) onResetSearch();
                }}
              >
                <i className={cat.icon}></i>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Results Info if Query active */}
        {searchQuery && (
          <div className="itemku-search-notice">
            <div className="search-notice-text">
              <i className="fa-solid fa-magnifying-glass text-blue"></i>
              <span>Hasil pencarian untuk "<strong>{searchQuery}</strong>" ({filteredProducts.length} produk ditemukan)</span>
            </div>
            <button
              type="button"
              className="btn-reset-search"
              onClick={onResetSearch}
            >
              <i className="fa-solid fa-xmark"></i> Hapus Filter
            </button>
          </div>
        )}

        {/* Grid of Product Cards */}
        {filteredProducts.length > 0 ? (
          <div className="itemku-products-grid">
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
          <div className="itemku-empty-state">
            <div className="empty-state-icon">
              <i className="fa-solid fa-box-open"></i>
            </div>
            <h3>Produk Tidak Ditemukan</h3>
            <p>Maaf, tidak ada produk yang cocok dengan pencarian "<strong>{searchQuery}</strong>".</p>
            <button
              type="button"
              className="btn-itemku-primary"
              onClick={onResetSearch}
            >
              Lihat Semua Produk
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
