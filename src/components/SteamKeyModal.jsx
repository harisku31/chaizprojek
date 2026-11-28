import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../utils/format';

export const STEAM_KEY_PACKAGES = [
  {
    id: 'original',
    name: 'KEY ORIGINAL STEAM',
    price: 1500,
    unit: '1 key',
    image: 'steamori.png',
    badge: 'Termurah',
    badgeClass: 'badge-bestseller',
    desc: 'Random game Steam original berlisensi resmi Valve'
  },
  {
    id: 'epic',
    name: 'KEY EPIC STEAM',
    price: 3500,
    unit: '1 key',
    image: 'steamepic.png',
    badge: 'Epic Tier',
    badgeClass: 'badge-flash',
    desc: 'Game Steam tier Epic berkualitas tinggi & terpopuler'
  },
  {
    id: 'nsfw',
    name: 'KEY NSFW STEAM',
    price: 3500,
    unit: '1 key',
    image: 'steamnsfw.png',
    badge: '18+ Uncensored',
    badgeClass: 'badge-flash',
    desc: 'Game Steam kategori 18+ unrated tanpa sensor'
  },
  {
    id: 'hanimentai',
    name: 'KEYHANIMENTAI',
    price: 3500,
    unit: '1 key',
    image: 'steamhanimentai.png',
    badge: 'Anime Special',
    badgeClass: 'badge-guarantee',
    desc: 'Game Steam bertema anime / hanime spesial'
  }
];

export default function SteamKeyModal({
  isOpen,
  onClose,
  authUser,
  isBanned = false,
  onOpenLogin,
  onOpenBannedModal,
  onShowToast,
  onAddToCart,
  onProceedCheckout,
  initialKeyId = 'original'
}) {
  const [selectedKeyId, setSelectedKeyId] = useState(initialKeyId);
  const [quantity, setQuantity] = useState(1);
  const [buyerUsername, setBuyerUsername] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialKeyId) setSelectedKeyId(initialKeyId);
      setQuantity(1);
      if (authUser) {
        setBuyerUsername(authUser.username || authUser.name?.toLowerCase().replace(/\s+/g, '_') || '');
      } else {
        setBuyerUsername('');
      }
    }
  }, [isOpen, initialKeyId, authUser]);

  if (!isOpen) return null;

  const currentKey =
    STEAM_KEY_PACKAGES.find((k) => k.id === selectedKeyId) ||
    STEAM_KEY_PACKAGES[0];
  const totalPrice = currentKey.price * quantity;
  const cleanUser = buyerUsername.trim();

  const validateAccess = () => {
    if (isBanned) {
      onOpenBannedModal?.();
      onShowToast?.('Akses Ditolak: Akun Anda sedang di-banned!', 'fa-ban text-danger');
      return false;
    }
    if (!authUser) {
      onOpenLogin?.();
      onShowToast?.('Silakan login terlebih dahulu untuk membeli Steam Key!', 'fa-right-to-bracket text-warning');
      return false;
    }
    return true;
  };

  const handleAddCurrentToCart = () => {
    if (!validateAccess()) return;
    if (typeof onAddToCart === 'function') {
      onAddToCart({
        id: Date.now() + Math.floor(Math.random() * 1000),
        productId: `steam-${currentKey.id}`,
        productName: `Steam Key (${currentKey.name})`,
        durationName: `${quantity} Key Resmi Valve`,
        viaType: cleanUser ? `Steam: ${cleanUser}` : 'Kode Dikirim via WhatsApp & Email',
        category: 'Steam Key',
        price: currentKey.price,
        qty: quantity,
        total: totalPrice,
        originalPrice: totalPrice,
        customerUsername: cleanUser || authUser?.username || '',
        warrantyPeriod: 'Garansi Resmi Valve 100% Valid'
      });
      onClose();
    }
  };

  const handleProceedOrder = (e) => {
    if (e) e.preventDefault();
    if (!validateAccess()) return;

    const checkoutItem = {
      productId: `steam-${currentKey.id}`,
      name: `Steam Key (${currentKey.name})`,
      duration: `${quantity} Key Resmi Valve`,
      via: cleanUser ? `Steam: ${cleanUser}` : 'Kode Dikirim via WhatsApp & Email',
      category: 'Steam Key',
      price: currentKey.price,
      qty: quantity,
      total: totalPrice,
      customerUsername: cleanUser || authUser?.username || '',
      warrantyPeriod: 'Garansi Resmi Valve 100% Valid'
    };

    onClose();
    if (typeof onProceedCheckout === 'function') {
      onProceedCheckout(checkoutItem);
    }
  };

  return (
    <div
      className="modal-overlay active"
      id="steamKeyModal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box modal-box-redesign steam-key-modal-box">
        <button className="modal-close-btn" onClick={onClose} aria-label="Tutup">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Modal Header */}
        <div className="modal-header-centered steam-modal-header">
          <div className="steam-modal-logo-wrap">
            <img
              src={`/${currentKey.image || 'steam.png'}`}
              alt={currentKey.name}
              className="steam-modal-logo-img"
            />
          </div>
          <div className="modal-header-badges">
            <span className="modal-tag">STEAM KEY RESMI</span>
            <span className={`badge-status ${currentKey.badgeClass}`}>{currentKey.badge}</span>
          </div>
          <h3 className="modal-title-centered">{currentKey.name}</h3>
          <p className="steam-modal-subtitle">
            {currentKey.desc}. Aktivasi permanen langsung di library Steam Anda.
          </p>
        </div>

        <form onSubmit={handleProceedOrder} className="steam-modal-form">
          {/* 1. Pilihan Paket Steam Key */}
          <div className="steam-form-section">
            <label className="steam-section-title">
              <i className="fa-solid fa-key text-warning"></i> 1. Pilih Paket Steam Key:
            </label>
            <div className="steam-packages-grid">
              {STEAM_KEY_PACKAGES.map((pkg) => {
                const isSelected = selectedKeyId === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    className={`steam-pkg-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedKeyId(pkg.id)}
                  >
                    <div className="steam-pkg-thumb-wrap">
                      <img
                        src={`/${pkg.image || 'steam.png'}`}
                        alt={pkg.name}
                        className="steam-pkg-thumb-img"
                        loading="lazy"
                      />
                    </div>
                    <div className="steam-pkg-info">
                      <strong>{pkg.name}</strong>
                      <span className="steam-pkg-price">{formatRupiah(pkg.price)}</span>
                    </div>
                    <i className={isSelected ? 'fa-solid fa-circle-check text-cyan' : 'fa-regular fa-circle'}></i>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Jumlah Pembelian */}
          <div className="steam-form-section">
            <div className="steam-qty-row">
              <label className="steam-section-title" style={{ margin: 0 }}>
                <i className="fa-solid fa-cubes text-cyan"></i> 2. Jumlah Steam Key:
              </label>
              <div className="steam-qty-controls">
                <button
                  type="button"
                  className="steam-qty-btn"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                >
                  <i className="fa-solid fa-minus"></i>
                </button>
                <span className="steam-qty-val">{quantity}</span>
                <button
                  type="button"
                  className="steam-qty-btn"
                  onClick={() => setQuantity((prev) => Math.min(50, prev + 1))}
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>
            <div className="steam-total-bar">
              <span>Total Harga ({quantity}x {currentKey.name}):</span>
              <strong className="steam-total-price">{formatRupiah(totalPrice)}</strong>
            </div>
          </div>

          {/* 3. Masukan Data Akun Steam */}
          <div className="mlbb-account-box">
            <div className="mlbb-account-box-header">
              <span className="mlbb-account-step-pill">
                <i className="fa-solid fa-user-check"></i> Masukan Data Akun
              </span>
              <span className="clean-field-badge badge-opt">Opsional</span>
            </div>

            <div className="mlbb-account-field">
              <label className="mlbb-account-label" htmlFor="steamBuyerUsername">
                Username Steam / ID Akun Tujuan
              </label>
              <input
                type="text"
                id="steamBuyerUsername"
                className="mlbb-account-input"
                placeholder="Masukkan Username Steam atau SteamID (Opsional)..."
                value={buyerUsername}
                onChange={(e) => setBuyerUsername(e.target.value)}
              />
            </div>

            <ul className="mlbb-account-notes">
              <li>Kami akan menghubungi nomor WhatsApp terdaftar jika ada kendala.</li>
              <li>Kode Voucher / Steam Key akan dikirimkan melalui nomor WhatsApp terdaftar.</li>
            </ul>
          </div>

          {/* Dual Actions Persis Akun Premium: Masukkan Keranjang & Bayar Sekarang */}
          <div className="modal-dual-actions">
            {typeof onAddToCart === 'function' && (
              <button
                type="button"
                className="btn btn-cart-action"
                onClick={handleAddCurrentToCart}
              >
                <i className="fa-solid fa-cart-plus"></i> Masukkan Keranjang
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary btn-buy-action"
            >
              <i className="fa-solid fa-bolt"></i> Bayar Sekarang ({formatRupiah(totalPrice)})
            </button>
          </div>
          <p className="order-note" style={{ marginTop: '10px', textAlign: 'center' }}>
            <i className="fa-solid fa-shield-halved"></i> Pembayaran lengkap (QRIS Gateway, GoPay, DANA, Bank Muamalat &amp; Voucher Promo) sama seperti produk Akun Premium.
          </p>
        </form>
      </div>
    </div>
  );
}
