import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../utils/format';
import { findVoucher } from '../data/vouchers';

export default function ProductModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onProceedCheckout,
  onShowToast
}) {
  const [selectedDurationId, setSelectedDurationId] = useState('');
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');

  useEffect(() => {
    if (product && product.durations && product.durations.length > 0) {
      setSelectedDurationId(product.durations[0].id);
    }
    setVoucherCodeInput('');
    setAppliedVoucher(null);
    setVoucherError('');
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const currentDur =
    product.durations.find((d) => d.id === selectedDurationId) ||
    product.durations[0] ||
    {};

  const isOutOfStock = product.stock === 0 || !!currentDur.outOfStock;
  const currentPrice = currentDur.price || 0;

  // Discount calculation from voucher
  let discountAmount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.type === 'discount') {
      discountAmount = Math.min(appliedVoucher.discountAmount, currentPrice);
    } else if (appliedVoucher.type === 'full_free') {
      discountAmount = currentPrice;
    }
  }
  const finalPrice = Math.max(0, currentPrice - discountAmount);

  const handleApplyVoucher = () => {
    if (!voucherCodeInput.trim()) {
      setVoucherError('Ketik kode voucher terlebih dahulu');
      return;
    }
    const found = findVoucher(voucherCodeInput);
    if (found) {
      setAppliedVoucher(found);
      setVoucherError('');
      if (onShowToast) {
        onShowToast(`Voucher ${found.code} berhasil dipasang!`, 'fa-circle-check');
      }
    } else {
      setVoucherError(`Kode "${voucherCodeInput}" tidak valid.`);
      if (onShowToast) {
        onShowToast(`Kode voucher "${voucherCodeInput}" tidak ditemukan!`, 'fa-circle-xmark');
      }
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCodeInput('');
    setVoucherError('');
    if (onShowToast) {
      onShowToast('Voucher berhasil dibatalkan', 'fa-trash-can');
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const viaLabel = currentDur.tag || currentDur.warranty || 'Reguler';
    onAddToCart({
      id: Date.now(),
      productId: product.id,
      productName: product.name,
      durationName: currentDur.name,
      viaType: viaLabel,
      price: finalPrice,
      originalPrice: currentPrice,
      appliedVoucher: appliedVoucher
    });
    onClose();
  };

  const handleCheckout = () => {
    if (isOutOfStock) return;
    const viaLabel = currentDur.tag || currentDur.warranty || 'Reguler';
    onProceedCheckout(
      {
        productId: product.id,
        name: product.name,
        duration: currentDur.name,
        via: viaLabel,
        price: currentPrice,
        qty: 1,
        total: currentPrice,
        appliedVoucher: appliedVoucher
      },
      appliedVoucher
    );
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
      <div className="modal-box modal-box-redesign">
        <button className="modal-close-btn" onClick={onClose} aria-label="Tutup">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Modal Header Centered with Large Logo */}
        <div className="modal-header-centered">
          <div className="modal-logo-center-wrap">
            {product.image ? (
              <img
                src={`/${product.image}`}
                alt={product.name}
                className="modal-logo-large-img"
              />
            ) : (
              <div
                className="modal-logo-large-icon"
                style={{ color: product.iconColor || 'var(--primary)' }}
              >
                <i className={product.icon || 'fa-solid fa-cube'}></i>
              </div>
            )}
          </div>

          <div className="modal-header-badges">
            <span className="modal-tag">{product.category.toUpperCase()}</span>
            {product.badge && (
              <span className={`badge-status ${product.badgeClass}`}>
                {product.badge}
              </span>
            )}
          </div>

          <h3 className="modal-title-centered">{product.name}</h3>

          <div className="modal-quick-perks">
            <span>
              <i className="fa-solid fa-bolt text-amber"></i> Proses 1-5 Menit
            </span>
            <span>
              <i className="fa-solid fa-shield-halved text-emerald"></i> Garansi Resmi
            </span>
            <span>
              <i className="fa-solid fa-circle-check text-primary"></i> 100% Legal & Aman
            </span>
          </div>
        </div>

        <div className="modal-body">
          <form onSubmit={(e) => e.preventDefault()}>
            {/* 1. Deskripsi & Keunggulan Layanan (Pindahan dari kartu menu produk) */}
            {product.features && product.features.length > 0 && (
              <div className="modal-section modal-features-section">
                <div className="modal-section-title">
                  <i className="fa-solid fa-circle-info text-primary"></i>
                  <span>Deskripsi & Keunggulan Produk</span>
                </div>
                <div className="modal-features-card">
                  <ul className="modal-features-list">
                    {product.features.map((f, i) => (
                      <li key={i} className="modal-feature-item">
                        <i className="fa-solid fa-circle-check text-emerald"></i>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 2. Menu Baru: Pilih Paket / Durasi */}
            <div className="modal-section modal-packages-section">
              <div className="modal-section-title">
                <i className="fa-solid fa-layer-group text-primary"></i>
                <span>Pilih Paket / Varian</span>
              </div>
              <div className="duration-selector-grid">
                {product.durations && product.durations.map((dur) => (
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

            {/* 3. Kolom Kode Voucher / Promo */}
            <div className="modal-section modal-voucher-section">
              <div className="modal-section-title">
                <i className="fa-solid fa-gift text-warning"></i>
                <span>Punya Kode Voucher / Promo?</span>
              </div>
              <div className="checkout-voucher-input-group">
                <div className="voucher-input-relative">
                  <i className="fa-solid fa-ticket voucher-input-icon"></i>
                  <input
                    type="text"
                    className="form-input voucher-field-input"
                    placeholder="Masukkan kode voucher (misal: DISKON2K)..."
                    value={voucherCodeInput}
                    onChange={(e) => {
                      setVoucherCodeInput(e.target.value.toUpperCase());
                      if (voucherError) setVoucherError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyVoucher();
                      }
                    }}
                    disabled={!!appliedVoucher}
                  />
                </div>
                {appliedVoucher ? (
                  <button
                    type="button"
                    className="btn-voucher-action btn-voucher-remove"
                    onClick={handleRemoveVoucher}
                    title="Hapus voucher"
                  >
                    <i className="fa-solid fa-xmark"></i> Hapus
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-voucher-action btn-voucher-apply"
                    onClick={handleApplyVoucher}
                  >
                    <i className="fa-solid fa-check"></i> Klaim
                  </button>
                )}
              </div>

              {voucherError && (
                <small className="text-danger" style={{ display: 'block', marginTop: '6px', fontSize: '0.8rem' }}>
                  <i className="fa-solid fa-triangle-exclamation"></i> {voucherError}
                </small>
              )}

              {/* Status Voucher Terpasang */}
              {appliedVoucher && (
                <div className="checkout-voucher-active-notice" style={{ marginTop: '10px' }}>
                  <div className="active-voucher-left">
                    <span
                      className="active-voucher-icon"
                      style={{
                        backgroundColor: `${appliedVoucher.color}22`,
                        color: appliedVoucher.color
                      }}
                    >
                      <i className={appliedVoucher.icon}></i>
                    </span>
                    <div>
                      <div className="active-voucher-name">
                        <strong>{appliedVoucher.code}</strong> &bull; {appliedVoucher.name}
                      </div>
                      <div className="active-voucher-desc">{appliedVoucher.description}</div>
                    </div>
                  </div>
                  <span className="active-voucher-tag">
                    <i className="fa-solid fa-circle-check"></i> Terpasang
                  </span>
                </div>
              )}
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

            {/* 4. Order Summary & Total di Bawah */}
            <div className="order-summary-box">
              <div className="summary-row">
                <span>Paket Terpilih:</span>
                <strong>{product.name} ({currentDur.name || '-'})</strong>
              </div>
              <div className="summary-row">
                <span>Masa Garansi:</span>
                <strong className="text-success">
                  <i className="fa-solid fa-shield-check"></i>{' '}
                  {currentDur.warranty || product.warranty || 'Sesuai Durasi'}
                </strong>
              </div>
              <div className="summary-row">
                <span>Ketersediaan Stok:</span>
                <strong className={isOutOfStock ? 'text-danger' : 'text-success'}>
                  <i className={isOutOfStock ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-circle-check'}></i>{' '}
                  {isOutOfStock ? 'Stok Kosong' : `${product.stock || 'Ready'} Tersedia`}
                </strong>
              </div>

              {/* Rincian Diskon jika Voucher Terpasang */}
              {appliedVoucher && discountAmount > 0 && (
                <div className="summary-row">
                  <span>Harga Normal:</span>
                  <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>
                    {formatRupiah(currentPrice)}
                  </span>
                </div>
              )}
              {appliedVoucher && discountAmount > 0 && (
                <div className="summary-row" style={{ color: '#34d399' }}>
                  <span>Potongan Diskon ({appliedVoucher.code}):</span>
                  <strong>-{formatRupiah(discountAmount)}</strong>
                </div>
              )}
              {appliedVoucher && appliedVoucher.type === 'free_item' && (
                <div className="summary-row" style={{ color: '#a855f7' }}>
                  <span>Bonus Voucher ({appliedVoucher.code}):</span>
                  <strong>Gratis 1 Akun Premium Tambahan</strong>
                </div>
              )}

              <div className="summary-divider"></div>
              <div className="summary-row total-row">
                <span>Total Pembayaran:</span>
                <strong className="total-price">
                  {isOutOfStock
                    ? 'Stok Kosong'
                    : finalPrice === 0
                    ? 'Rp 0 (FULL GRATIS)'
                    : formatRupiah(finalPrice)}
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
                <i className="fa-solid fa-bolt"></i> Beli Sekarang
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
