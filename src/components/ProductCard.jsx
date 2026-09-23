import React from 'react';
import { formatRupiah } from '../utils/format';

export default function ProductCard({
  product,
  onOpenModal,
  onShowToast,
  isHighlighted
}) {
  const isUnreleased = !!product.isUnreleased;
  const isOutOfStock = !isUnreleased && product.stock === 0;
  const hasMultiplePrices = product.durations && product.durations.length > 1;

  let priceHtml = null;
  if (isUnreleased) {
    priceHtml = (
      <span className="current-price" style={{ color: '#f59e0b', fontSize: '0.95rem', fontWeight: 700 }}>
        <i className="fa-solid fa-lock"></i> Segel Belum Dirilis
      </span>
    );
  } else if (isOutOfStock) {
    priceHtml = (
      <span className="current-price" style={{ color: 'var(--accent-rose)' }}>
        Stok Kosong
      </span>
    );
  } else if (product.priceNote) {
    priceHtml = (
      <span className="current-price" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', lineHeight: 1.2, display: 'inline-block' }}>
        {product.priceNote}
      </span>
    );
  } else {
    priceHtml = (
      <>
        {product.oldPrice && <span className="old-price">{formatRupiah(product.oldPrice)}</span>}
        <span className="current-price">{formatRupiah(product.currentPrice)}</span>
      </>
    );
  }

  const priceLabel = isUnreleased
    ? 'Status Produk'
    : isOutOfStock
    ? 'Status'
    : product.priceNote
    ? 'Harga'
    : hasMultiplePrices
    ? 'Mulai dari'
    : 'Harga';

  const priceUnit =
    isUnreleased || isOutOfStock
      ? ''
      : product.priceNote
      ? ''
      : product.durations.length === 1
      ? `/ ${product.durations[0].name}`
      : '/ durasi';

  let stockBadge = null;
  if (isUnreleased) {
    stockBadge = (
      <span className="badge-stock badge-stock-sealed" title="Status: Segel Belum Dirilis">
        <i className="fa-solid fa-lock"></i> Segel
      </span>
    );
  } else if (isOutOfStock) {
    stockBadge = (
      <span className="badge-stock badge-stock-empty" title="Stok Saat Ini Kosong">
        <i className="fa-solid fa-circle-xmark"></i> Stok Habis
      </span>
    );
  } else if (product.stock <= 5) {
    stockBadge = (
      <span className="badge-stock badge-stock-low" title={`Sisa Stok: ${product.stock} Akun`}>
        <i className="fa-solid fa-box-archive"></i> Stok: {product.stock}
      </span>
    );
  } else {
    stockBadge = (
      <span className="badge-stock badge-stock-available" title={`Sisa Stok: ${product.stock} Akun`}>
        <i className="fa-solid fa-boxes-stacked"></i> Stok: {product.stock}
      </span>
    );
  }

  const handleCardClick = () => {
    if (isUnreleased) {
      onShowToast('Grok AI masih dalam status segel dan belum dirilis resmi!', 'fa-lock');
    } else {
      onOpenModal(product);
    }
  };

  return (
    <div
      id={`product-card-${product.id}`}
      className={`product-card ${product.image ? 'has-banner' : ''} ${isUnreleased ? 'card-unreleased' : ''} ${
        isHighlighted ? 'highlight-pulse' : ''
      }`}
      onClick={handleCardClick}
      style={{ position: 'relative' }}
    >
      {/* Search Pointer Pin if highlighted */}
      {isHighlighted && (
        <div className="search-pointer-pin">
          <i className="fa-solid fa-hand-point-down"></i> <span>Ini produk yang Anda cari!</span>
        </div>
      )}

      <div className="card-top-bar">
        <div className="card-top-left">
          {!product.image && (
            <div
              className="product-icon-wrap"
              style={{
                color: product.iconColor,
                background: isUnreleased ? 'rgba(245, 158, 11, 0.1)' : undefined
              }}
            >
              <i className={product.icon}></i>
            </div>
          )}
          {stockBadge}
        </div>
        <span className={`badge-status ${product.badgeClass}`}>{product.badge}</span>
      </div>

      {product.image ? (
        <div className="product-banner-wrap">
          <img src={`/${product.image}`} alt={product.name} className="product-banner-img" loading="lazy" />
          <div className="product-banner-overlay">
            <h3 className="product-banner-title">{product.name}</h3>
            <ul className="product-banner-features">
              {product.features.map((f, i) => (
                <li key={i}>
                  <i className="fa-solid fa-circle-check"></i> <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="product-info">
          {isUnreleased && (
            <div className="product-seal-tag">
              <i className="fa-solid fa-shield-halved"></i> TANDA SEGEL RESMI
            </div>
          )}
          <span className="product-category">{product.category}</span>
          <h3 className="product-title">{product.name}</h3>
          <ul className="product-features-list">
            {product.features.map((f, i) => (
              <li key={i}>
                <i
                  className={isUnreleased ? 'fa-solid fa-lock' : 'fa-solid fa-check'}
                  style={isUnreleased ? { color: '#f59e0b' } : undefined}
                ></i>{' '}
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="product-price-box">
        <div>
          <span className="price-label">{priceLabel}</span>
          <div>{priceHtml}</div>
        </div>
        <span className="price-unit">{priceUnit}</span>
      </div>

      <div className="card-actions" onClick={(e) => e.stopPropagation()}>
        {isUnreleased ? (
          <button
            type="button"
            className="btn btn-secondary btn-sealed"
            style={{
              width: '100%',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              color: '#fbbf24',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            onClick={() => onShowToast('Grok AI masih dalam status segel dan belum dirilis resmi!', 'fa-lock')}
          >
            <i className="fa-solid fa-lock"></i> Segel: Belum Dirilis
          </button>
        ) : (
          <>
            <button className="btn btn-primary" onClick={() => onOpenModal(product)}>
              <i className="fa-solid fa-tag"></i> {isOutOfStock ? 'Stok Kosong' : 'Pilih Paket'}
            </button>
            <button
              className="btn-add-cart"
              onClick={() => onOpenModal(product)}
              title="Pilih Paket & Varian"
            >
              <i className="fa-solid fa-cart-plus"></i>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
