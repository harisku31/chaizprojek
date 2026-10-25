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
      <div className="container">
        <div className="section-title text-center">
          <span className="subheading">
            <i className="fa-solid fa-layer-group"></i> KATALOG LENGKAP
          </span>
          <h2>Pilih Layanan Premium Favoritmu</h2>
          <p>Tersedia akun Sharing maupun Private dengan harga bersahabat dan garansi penuh.</p>
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
