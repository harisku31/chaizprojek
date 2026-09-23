import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../utils/format';

export default function ProductModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onProceedCheckout
}) {
  const [selectedDurationId, setSelectedDurationId] = useState('');

  useEffect(() => {
    if (product && product.durations && product.durations.length > 0) {
      setSelectedDurationId(product.durations[0].id);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const currentDur =
    product.durations.find((d) => d.id === selectedDurationId) ||
    product.durations[0] ||
    {};

  const isOutOfStock = product.stock === 0 || !!currentDur.outOfStock;
  const currentPrice = currentDur.price || 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const viaLabel = currentDur.tag || currentDur.warranty || 'Reguler';
    onAddToCart({
      id: Date.now(),
      productId: product.id,
      productName: product.name,
      durationName: currentDur.name,
      viaType: viaLabel,
      price: currentPrice
    });
    onClose();
  };

  const handleCheckout = () => {
    if (isOutOfStock) return;
    const viaLabel = currentDur.tag || currentDur.warranty || 'Reguler';
    onProceedCheckout({
      name: product.name,
      duration: currentDur.name,
      via: viaLabel,
      price: currentPrice,
      qty: 1,
      total: currentPrice
    });
    onClose();
  };

  return (
    <div
      className={`modal-overlay active`}
      id="orderModal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        <button className="modal-close-btn" onClick={onClose} aria-label="Tutup">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="modal-header">
          <div
            className="modal-product-icon"
            style={
              product.image
                ? { background: '#0f172a', padding: '2px' }
                : { color: product.iconColor }
            }
          >
            {product.image ? (
              <img
                src={`/${product.image}`}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
              />
            ) : (
              <i className={product.icon}></i>
            )}
          </div>
          <div>
            <span className="modal-tag">{product.category.toUpperCase()}</span>
            <h3>{product.name}</h3>
          </div>
        </div>

        <div className="modal-body">
          <form onSubmit={(e) => e.preventDefault()}>
            {/* 1. Duration / Package Selector */}
            <div className="form-group">
              <label className="form-label">
                <i className="fa-solid fa-layer-group"></i> Pilih Paket / Varian:
              </label>
              <div className="duration-selector-grid">
                {product.durations.map((dur) => (
                  <label key={dur.id} className="duration-option">
                    <input
                      type="radio"
                      name="selectedDuration"
                      value={dur.id}
                      checked={dur.id === selectedDurationId}
                      onChange={() => setSelectedDurationId(dur.id)}
                    />
                    <div className="duration-card">
                      <span className="dur-badge">{dur.name}</span>
                      <span className="dur-price">
                        {dur.price > 0
                          ? formatRupiah(dur.price)
                          : dur.outOfStock
                          ? 'Kosong'
                          : '-'}
                      </span>
                      <span className="dur-tag">
                        {dur.tag || (dur.warranty ? 'Garansi ' + dur.warranty : 'Pilihan')}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Out of Stock Alert */}
            {isOutOfStock && (
              <div
                className="privat-alert-box"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  borderColor: 'rgba(239, 68, 68, 0.4)'
                }}
              >
                <div className="alert-icon" style={{ color: '#f87171' }}>
                  <i className="fa-solid fa-circle-xmark"></i>
                </div>
                <div className="alert-content">
                  <strong style={{ color: '#f87171' }}>Stok Sedang Kosong</strong>
                  <p>
                    Mohon maaf, stok akun ini sedang kosong. Silakan hubungi CS WhatsApp kami untuk info jadwal restock!
                  </p>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="order-summary-box">
              <div className="summary-row">
                <span>Paket Terpilih:</span>
                <strong>{product.name} - {currentDur.name || '-'}</strong>
              </div>
              <div className="summary-row">
                <span>Ketersediaan Stok:</span>
                <strong className={isOutOfStock ? 'text-danger' : 'text-success'}>
                  {isOutOfStock ? 'Stok Kosong' : `${product.stock || 'Ready'} Tersedia`}
                </strong>
              </div>
              <div className="summary-row">
                <span>Masa Garansi:</span>
                <strong className="text-success">
                  <i className="fa-solid fa-shield-check"></i>{' '}
                  {currentDur.warranty || product.warranty || 'Sesuai Durasi'}
                </strong>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total-row">
                <span>Total Pembayaran:</span>
                <strong className="total-price">
                  {isOutOfStock ? 'Stok Kosong' : formatRupiah(currentPrice)}
                </strong>
              </div>
            </div>

            {/* Dual Actions: Add to cart & Checkout */}
            <div className="modal-dual-actions">
              <button
                type="button"
                className="btn btn-cart-action"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                style={{
                  opacity: isOutOfStock ? 0.5 : 1,
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                }}
              >
                <i className="fa-solid fa-cart-plus"></i> Masukkan Keranjang
              </button>
              <button
                type="button"
                className="btn btn-primary btn-buy-action"
                disabled={isOutOfStock}
                onClick={handleCheckout}
                style={{
                  opacity: isOutOfStock ? 0.5 : 1,
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                }}
              >
                <i className="fa-solid fa-credit-card"></i> Lanjut Checkout
              </button>
            </div>
            <p className="order-note">
              <i className="fa-solid fa-shield-halved"></i> Garansi 100% aman, legal, & proses kilat 1-5 menit via WhatsApp.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
