import React from 'react';
import { formatRupiah } from '../utils/format';

export default function ProductCard({
  product,
  onOpenModal,
  onShowToast,
  isHighlighted,
  onOpenSteamMenu
}) {
  const isUnreleased = !!product.isUnreleased;
  const isOutOfStock = !isUnreleased && product.stock === 0;
  const hasMultiplePrices = product.durations && product.durations.length > 1;

  let priceHtml = null;
  if (isUnreleased) {
    priceHtml = (
      <span className="current-price text-amber" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
        <i className="fa-solid fa-lock"></i> Segel Belum Rilis
      </span>
    );
  } else if (isOutOfStock) {
    priceHtml = (
      <span className="current-price text-danger" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
        Habis Terjual
      </span>
    );
  } else if (product.priceNote) {
    priceHtml = (
      <span className="current-price itemku-curr-price">
        {product.priceNote}
      </span>
    );
  } else {
    priceHtml = (
      <div className="itemku-price-stack">
        {product.oldPrice && (
          <span className="itemku-old-price">
            {formatRupiah(product.oldPrice)}
          </span>
        )}
        <span className="itemku-curr-price">
          {formatRupiah(product.currentPrice)}
        </span>
      </div>
    );
  }

  const discountPercent =
    product.oldPrice && product.currentPrice
      ? Math.round(((product.oldPrice - product.currentPrice) / product.oldPrice) * 100)
      : null;

  const handleCardClick = () => {
    if (isUnreleased) {
      onShowToast('Grok AI masih dalam status segel dan belum dirilis resmi!', 'fa-lock');
    } else if (product.isSteamSpecial) {
      if (onOpenSteamMenu) onOpenSteamMenu();
      else window.location.hash = 'steam';
    } else {
      onOpenModal(product);
    }
  };

  return (
    <div
      id={`product-card-${product.id}`}
      className={`product-card itemku-product-card ${isUnreleased ? 'card-unreleased' : ''} ${
        isHighlighted ? 'highlight-pulse' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* Search Pointer Pin if highlighted */}
      {isHighlighted && (
        <div className="search-pointer-pin">
          <i className="fa-solid fa-hand-point-down"></i> <span>Produk yang Anda cari</span>
        </div>
      )}

      {/* Top Media / Thumbnail Ala Itemku */}
      <div className="itemku-card-thumb-wrap">
        {product.image ? (
          <img
            src={`/${product.image}`}
            alt={product.name}
            className="itemku-card-thumb-img"
            loading="lazy"
          />
        ) : (
          <div
            className="itemku-card-thumb-fallback"
            style={{ color: product.iconColor || '#0066FF' }}
          >
            <i className={product.icon || 'fa-solid fa-box'}></i>
          </div>
        )}

        {/* Badges on Thumbnail */}
        <div className="itemku-card-top-badges">
          <span className="itemku-badge-instant">
            <i className="fa-solid fa-bolt"></i> Instan
          </span>
          {discountPercent && (
            <span className="itemku-badge-discount">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Category Pill */}
        <span className="itemku-badge-category">
          {(product.category || 'PRODUK').toUpperCase()}
        </span>
      </div>

      {/* Body Info */}
      <div className="itemku-card-body">
        {/* Title */}
        <h3 className="itemku-card-title" title={product.name}>
          {product.name}
        </h3>

        {/* Store & Rating */}
        <div className="itemku-card-seller">
          <div className="seller-name-row">
            <span className="seller-name">ChaizStore Official</span>
            <i className="fa-solid fa-circle-check text-blue" title="Verified Store"></i>
          </div>
          <div className="seller-rating-row">
            <span className="rating-star"><i className="fa-solid fa-star text-warning"></i> 4.9</span>
            <span className="bullet-dot">•</span>
            <span className="sold-count">1.2rb+ Terjual</span>
          </div>
        </div>

        {/* Stock status tag */}
        <div className="itemku-card-stock">
          {isUnreleased ? (
            <span className="stock-tag tag-sealed">
              <i className="fa-solid fa-shield-halved"></i> Segel Resmi
            </span>
          ) : isOutOfStock ? (
            <span className="stock-tag tag-empty">
              <i className="fa-solid fa-circle-xmark"></i> Stok Habis
            </span>
          ) : (
            <span className="stock-tag tag-ready">
              <i className="fa-solid fa-bolt-lightning text-success"></i> Sisa {product.stock} {product.isSteamSpecial ? 'Key' : 'Akun'}
            </span>
          )}
        </div>

        {/* Price & Action */}
        <div className="itemku-card-footer">
          <div className="itemku-card-price-area">
            <span className="price-label-sub">
              {hasMultiplePrices ? 'Mulai dari' : 'Harga'}
            </span>
            {priceHtml}
          </div>

          <div className="itemku-card-btn-area" onClick={(e) => e.stopPropagation()}>
            {isUnreleased ? (
              <button
                type="button"
                className="btn-itemku-sealed"
                onClick={() => onShowToast('Grok AI belum dirilis resmi!', 'fa-lock')}
              >
                <i className="fa-solid fa-lock"></i>
              </button>
            ) : product.isSteamSpecial ? (
              <button
                type="button"
                className="btn-itemku-buy"
                onClick={handleCardClick}
                title="Buka Menu Steam"
              >
                <i className="fa-brands fa-steam"></i>
                <span>Buka</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-itemku-buy"
                onClick={() => onOpenModal(product)}
                title="Beli Sekarang"
              >
                <i className="fa-solid fa-cart-shopping"></i>
                <span>{isOutOfStock ? 'Detail' : 'Beli'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
