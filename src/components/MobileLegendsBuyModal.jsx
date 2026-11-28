import React, { useState, useEffect, useRef } from 'react';
import { formatRupiah } from '../utils/format';

export const MLBB_PACKAGES = [
  { id: '10d', amount: 10, base: 9, bonus: 1, name: '10 Diamonds', breakdown: '9+1 Bonus', price: 5000, category: 'hemat', badge: 'Termurah', badgeClass: 'badge-bestseller' },
  { id: '113d', amount: 113, base: 102, bonus: 11, name: '113 Diamonds', breakdown: '102+11 Bonus', price: 36000, category: 'hemat', badge: 'Populer', badgeClass: 'badge-flash' },
  { id: '144d', amount: 144, base: 130, bonus: 14, name: '144 Diamonds', breakdown: '130+14 Bonus', price: 45000, category: 'hemat', badge: 'Starter', badgeClass: 'badge-guarantee' },
  { id: '229d', amount: 229, base: 207, bonus: 22, name: '229 Diamonds', breakdown: '207+22 Bonus', price: 70500, category: 'hemat', badge: 'Hemat', badgeClass: 'badge-bestseller' },
  { id: '257d', amount: 257, base: 233, bonus: 24, name: '257 Diamonds', breakdown: '233+24 Bonus', price: 79500, category: 'hemat', badge: 'Best Deal', badgeClass: 'badge-flash' },
  { id: '278d', amount: 278, base: 251, bonus: 27, name: '278 Diamonds', breakdown: '251+27 Bonus', price: 86500, category: 'hemat', badge: 'Favorit', badgeClass: 'badge-guarantee' },
  { id: '284d', amount: 284, base: 257, bonus: 27, name: '284 Diamonds', breakdown: '257+27 Bonus', price: 87500, category: 'hemat', badge: 'Terlaris', badgeClass: 'badge-bestseller' },
  { id: '355d', amount: 355, base: 309, bonus: 46, name: '355 Diamonds', breakdown: '309+46 Bonus', price: 111000, category: 'hemat', badge: 'Bonus +46', badgeClass: 'badge-flash' },
  { id: '374d', amount: 374, base: 326, bonus: 48, name: '374 Diamonds', breakdown: '326+48 Bonus', price: 117000, category: 'hemat', badge: 'Value', badgeClass: 'badge-guarantee' },
  { id: '381d', amount: 381, base: 333, bonus: 48, name: '381 Diamonds', breakdown: '333+48 Bonus', price: 118500, category: 'hemat', badge: 'Recommended', badgeClass: 'badge-bestseller' },
  { id: '425d', amount: 425, base: 373, bonus: 52, name: '425 Diamonds', breakdown: '373+52 Bonus', price: 130500, category: 'hemat', badge: 'Epic Deal', badgeClass: 'badge-flash' },
  { id: '512d', amount: 512, base: 461, bonus: 51, name: '512 Diamonds', breakdown: '461+51 Bonus', price: 153000, category: 'menengah', badge: 'Starlight', badgeClass: 'badge-bestseller' },
  { id: '522d', amount: 522, base: 471, bonus: 51, name: '522 Diamonds', breakdown: '471+51 Bonus', price: 155500, category: 'menengah', badge: 'Plus +51', badgeClass: 'badge-guarantee' },
  { id: '601d', amount: 601, base: 533, bonus: 68, name: '601 Diamonds', breakdown: '533+68 Bonus', price: 175000, category: 'menengah', badge: 'Skin Epic', badgeClass: 'badge-flash' },
  { id: '712d', amount: 712, base: 633, bonus: 79, name: '712 Diamonds', breakdown: '633+79 Bonus', price: 207500, category: 'menengah', badge: 'Terlaris', badgeClass: 'badge-bestseller' },
  { id: '717d', amount: 717, base: 638, bonus: 79, name: '717 Diamonds', breakdown: '638+79 Bonus', price: 207000, category: 'menengah', badge: 'Super Hemat', badgeClass: 'badge-flash' },
  { id: '965d', amount: 965, base: 856, bonus: 109, name: '965 Diamonds', breakdown: '856+109 Bonus', price: 272500, category: 'menengah', badge: 'Event Ready', badgeClass: 'badge-bestseller' },
  { id: '977d', amount: 977, base: 867, bonus: 110, name: '977 Diamonds', breakdown: '867+110 Bonus', price: 282000, category: 'menengah', badge: 'Bonus +110', badgeClass: 'badge-guarantee' },
  { id: '1050d', amount: 1050, base: 933, bonus: 117, name: '1050 Diamonds', breakdown: '933+117 Bonus', price: 313500, category: 'menengah', badge: '1K+ DM', badgeClass: 'badge-flash' },
  { id: '1134d', amount: 1134, base: 1008, bonus: 126, name: '1134 Diamonds', breakdown: '1008+126 Bonus', price: 339500, category: 'menengah', badge: 'Populer 1K', badgeClass: 'badge-bestseller' },
  { id: '1136d', amount: 1136, base: 1006, bonus: 130, name: '1136 Diamonds', breakdown: '1006+130 Bonus', price: 338500, category: 'menengah', badge: 'Worth It', badgeClass: 'badge-guarantee' },
  { id: '1139d', amount: 1139, base: 1013, bonus: 126, name: '1139 Diamonds', breakdown: '1013+126 Bonus', price: 344500, category: 'menengah', badge: 'Gacha Ready', badgeClass: 'badge-flash' },
  { id: '1159d', amount: 1159, base: 1031, bonus: 128, name: '1159 Diamonds', breakdown: '1031+128 Bonus', price: 350000, category: 'menengah', badge: 'Bundle 1K', badgeClass: 'badge-bestseller' },
  { id: '1164d', amount: 1164, base: 1036, bonus: 128, name: '1164 Diamonds', breakdown: '1036+128 Bonus', price: 340500, category: 'menengah', badge: 'Best Rate', badgeClass: 'badge-flash' },
  { id: '2199d', amount: 2199, base: 1879, bonus: 320, name: '2199 Diamonds', breakdown: '1879+320 Bonus', price: 615500, category: 'sultan', badge: 'Sultan Pack', badgeClass: 'badge-bestseller' },
  { id: '2350d', amount: 2350, base: 2017, bonus: 333, name: '2350 Diamonds', breakdown: '2017+333 Bonus', price: 672000, category: 'sultan', badge: 'Collector', badgeClass: 'badge-flash' },
  { id: '2382d', amount: 2382, base: 2033, bonus: 349, name: '2382 Diamonds', breakdown: '2033+349 Bonus', price: 678000, category: 'sultan', badge: 'Mega Bonus', badgeClass: 'badge-guarantee' },
  { id: '2536d', amount: 2536, base: 2182, bonus: 354, name: '2536 Diamonds', breakdown: '2182+354 Bonus', price: 716000, category: 'sultan', badge: 'Mythic Pack', badgeClass: 'badge-bestseller' },
  { id: '2578d', amount: 2578, base: 2211, bonus: 367, name: '2578 Diamonds', breakdown: '2211+367 Bonus', price: 737000, category: 'sultan', badge: 'Pro Gacha', badgeClass: 'badge-flash' },
  { id: '2885d', amount: 2885, base: 2482, bonus: 403, name: '2885 Diamonds', breakdown: '2482+403 Bonus', price: 827000, category: 'sultan', badge: 'VIP Event', badgeClass: 'badge-guarantee' },
  { id: '2904d', amount: 2904, base: 2499, bonus: 405, name: '2904 Diamonds', breakdown: '2499+405 Bonus', price: 833000, category: 'sultan', badge: 'Glorious', badgeClass: 'badge-bestseller' },
  { id: '3453d', amount: 3453, base: 2985, bonus: 468, name: '3453 Diamonds', breakdown: '2985+468 Bonus', price: 996000, category: 'sultan', badge: 'Legend Ready', badgeClass: 'badge-flash' },
  { id: '3481d', amount: 3481, base: 3010, bonus: 471, name: '3481 Diamonds', breakdown: '3010+471 Bonus', price: 999500, category: 'sultan', badge: 'Extra +471', badgeClass: 'badge-guarantee' },
  { id: '3693d', amount: 3693, base: 3202, bonus: 491, name: '3693 Diamonds', breakdown: '3202+491 Bonus', price: 1059000, category: 'sultan', badge: 'Top Tier', badgeClass: 'badge-bestseller' },
  { id: '4020d', amount: 4020, base: 3416, bonus: 604, name: '4020 Diamonds', breakdown: '3416+604 Bonus', price: 1108000, category: 'sultan', badge: 'Ultra Value', badgeClass: 'badge-flash' },
  { id: '4404d', amount: 4404, base: 3763, bonus: 641, name: '4404 Diamonds', breakdown: '3763+641 Bonus', price: 1236500, category: 'sultan', badge: 'King Pack', badgeClass: 'badge-bestseller' }
];

/**
 * Helper membangun payload item keranjang untuk paket Mobile Legends
 */
export function buildMlbbCartItem(pkg, userId, zoneId) {
  const cleanUserId = String(userId || '').trim();
  const cleanZoneId = String(zoneId || '').trim();
  const formattedGameId = `${cleanUserId} (${cleanZoneId})`;
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    productId: `mlbb-${pkg.id}`,
    productName: `Mobile Legends ${pkg.name} (${pkg.breakdown})`,
    durationName: `${pkg.name} (${pkg.breakdown}) • ID: ${formattedGameId}`,
    viaType: `User ID: ${formattedGameId}`,
    category: 'Top Up Game',
    price: pkg.price,
    originalPrice: pkg.price,
    customerUsername: formattedGameId,
    customerMlUserId: cleanUserId,
    customerMlZoneId: cleanZoneId,
    warrantyPeriod: 'Garansi Diamond Masuk 100%'
  };
}

/**
 * Helper membangun payload CheckoutModal standar ChaizStore untuk Mobile Legends
 */
export function buildMlbbCheckoutItem(pkg, userId, zoneId) {
  const cleanUserId = String(userId || '').trim();
  const cleanZoneId = String(zoneId || '').trim();
  const formattedGameId = `${cleanUserId} (${cleanZoneId})`;
  return {
    productId: `mlbb-${pkg.id}`,
    name: `Mobile Legends ${pkg.name} (${pkg.breakdown})`,
    duration: `${pkg.name} (${pkg.breakdown}) • ID: ${formattedGameId}`,
    via: `User ID: ${formattedGameId}`,
    category: 'Top Up Game',
    price: pkg.price,
    qty: 1,
    total: pkg.price,
    customerUsername: formattedGameId,
    customerMlUserId: cleanUserId,
    customerMlZoneId: cleanZoneId,
    warrantyPeriod: 'Garansi Diamond Masuk 100%'
  };
}

/**
 * Modal Pemilihan Paket & Masukan Data Akun Mobile Legends (terhubung langsung ke Keranjang & CheckoutModal)
 */
export default function MobileLegendsBuyModal({
  isOpen,
  onClose,
  isBanned = false,
  onOpenBannedModal,
  onShowToast,
  onAddToCart,
  onProceedCheckout,
  onProceedToPayment,
  initialPackageId = '10d',
  initialUserId = '',
  initialZoneId = '',
  focusAccountInput = false
}) {
  const [selectedPkgId, setSelectedPkgId] = useState(initialPackageId);
  const [mlUserId, setMlUserId] = useState(initialUserId);
  const [mlZoneId, setMlZoneId] = useState(initialZoneId);

  const userIdInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (initialPackageId) setSelectedPkgId(initialPackageId);
      setMlUserId(initialUserId || '');
      setMlZoneId(initialZoneId || '');
      if (focusAccountInput || !initialUserId) {
        setTimeout(() => {
          userIdInputRef.current?.focus();
        }, 120);
      }
    }
  }, [isOpen, initialPackageId, initialUserId, initialZoneId, focusAccountInput]);

  if (!isOpen) return null;

  const currentPkg =
    MLBB_PACKAGES.find((p) => p.id === selectedPkgId) || MLBB_PACKAGES[0];
  const totalPrice = currentPkg.price;

  const handleUserIdInput = (rawValue) => {
    const comboMatch = rawValue.match(/^\s*(\d+)\s*\((\d+)\)\s*$/);
    if (comboMatch) {
      setMlUserId(comboMatch[1]);
      setMlZoneId(comboMatch[2]);
      return;
    }
    setMlUserId(rawValue.replace(/\D/g, ''));
  };

  const handleZoneIdInput = (rawValue) => {
    setMlZoneId(rawValue.replace(/\D/g, ''));
  };

  const cleanUserId = mlUserId.trim();
  const cleanZoneId = mlZoneId.trim();
  const formattedGameId =
    cleanUserId && cleanZoneId
      ? `${cleanUserId} (${cleanZoneId})`
      : cleanUserId || '(Belum diisi)';

  const validateGameAccount = () => {
    if (!cleanUserId || cleanUserId.length < 4) {
      onShowToast?.('Silakan isi User ID Mobile Legends dengan benar (contoh: 1268190411)!', 'fa-triangle-exclamation', 'warning');
      userIdInputRef.current?.focus();
      userIdInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    if (!cleanZoneId || cleanZoneId.length < 2) {
      onShowToast?.('Silakan isi Zone ID / Server dengan benar (contoh: 15148)!', 'fa-triangle-exclamation', 'warning');
      const zoneEl = document.getElementById('mlInputZoneId');
      zoneEl?.focus();
      zoneEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  };

  const handleAddCurrentToCart = () => {
    if (isBanned) {
      onOpenBannedModal?.();
      onShowToast?.('Akses Ditolak: Akun Anda sedang di-banned!', 'fa-ban text-danger');
      return;
    }
    if (!validateGameAccount()) return;

    if (typeof onAddToCart === 'function') {
      onAddToCart(buildMlbbCartItem(currentPkg, cleanUserId, cleanZoneId));
      onClose();
    }
  };

  const handleBayarSekarang = (e) => {
    if (e) e.preventDefault();
    if (isBanned) {
      onOpenBannedModal?.();
      onShowToast?.('Akses Ditolak: Akun Anda sedang di-banned!', 'fa-ban text-danger');
      return;
    }
    if (!validateGameAccount()) return;

    const checkoutItem = buildMlbbCheckoutItem(currentPkg, cleanUserId, cleanZoneId);
    onClose();

    if (typeof onProceedCheckout === 'function') {
      onProceedCheckout(checkoutItem);
    } else if (typeof onProceedToPayment === 'function') {
      const orderId = `MLBB-${Date.now().toString().slice(-6)}`;
      onProceedToPayment({
        id: orderId,
        amount: totalPrice,
        total: totalPrice,
        items: [checkoutItem],
        customerUsername: formattedGameId,
        customerMlUserId: cleanUserId,
        customerMlZoneId: cleanZoneId,
        subMethod: 'qris'
      });
    }
  };

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box modal-box-redesign roblox-buy-modal-box mlbb-buy-modal-box">
        <button className="modal-close-btn roblox-modal-close" onClick={onClose} aria-label="Tutup">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Modal Header */}
        <div className="modal-header-centered roblox-modal-header mlbb-modal-header">
          <div className="trx-header-icon-wrap mlbb-header-icon">
            <i className="fa-solid fa-gem"></i>
          </div>
          <span className="modal-tag mlbb-modal-tag">
            MOBILE LEGENDS INDONESIA • 24 JAM PROSES INSTANT
          </span>
          <h3 className="modal-title-centered roblox-modal-title">
            Top Up Diamonds MLBB
          </h3>
          <p className="modal-desc roblox-modal-desc">
            Pilih nominal Diamonds dan isi Data Akun sebelum memasukkan ke Keranjang atau Bayar Sekarang.
          </p>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleBayarSekarang} className="steam-modal-body roblox-modal-body">
          {/* 1. Pilih Nominal Diamonds */}
          <div className="roblox-section-group">
            <label className="roblox-form-label-header">
              <span>
                <i className="fa-solid fa-gem text-cyan"></i> <strong>1. Pilih Nominal Diamonds ({MLBB_PACKAGES.length} Paket):</strong>
              </span>
              <span className="roblox-current-deco-symbol">
                {currentPkg.name} ({currentPkg.breakdown})
              </span>
            </label>

            <div className="mlbb-modal-packages-grid">
              {MLBB_PACKAGES.map((pkg) => {
                const isSelected = selectedPkgId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    className={`roblox-pkg-card mlbb-pkg-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedPkgId(pkg.id)}
                  >
                    <div className="roblox-pkg-name">{pkg.name}</div>
                    <div className="mlbb-pkg-breakdown">({pkg.breakdown})</div>
                    <div className="roblox-pkg-price">{formatRupiah(pkg.price)}</div>
                    {isSelected && (
                      <span className="roblox-pkg-check">
                        <i className="fa-solid fa-circle-check"></i>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Masukan Data Akun (User ID & Zone ID + Catatan WA) */}
          <div className="mlbb-account-box">
            <div className="mlbb-account-box-header">
              <span className="mlbb-account-step-pill">
                <i className="fa-solid fa-user-check"></i> Masukan Data Akun
              </span>
              {cleanUserId && cleanZoneId && (
                <span className="roblox-verified-badge">
                  <i className="fa-solid fa-circle-check"></i> {formattedGameId}
                </span>
              )}
            </div>

            <div className="mlbb-account-fields-grid">
              <div className="mlbb-account-field">
                <label className="mlbb-account-label" htmlFor="mlInputUserId">
                  User ID
                </label>
                <input
                  ref={userIdInputRef}
                  id="mlInputUserId"
                  type="text"
                  inputMode="numeric"
                  className={`mlbb-account-input ${cleanUserId.length >= 4 ? 'is-valid' : ''}`}
                  placeholder="User ID (cth: 1268190411)"
                  value={mlUserId}
                  onChange={(e) => handleUserIdInput(e.target.value)}
                  required
                />
              </div>

              <div className="mlbb-account-field">
                <label className="mlbb-account-label" htmlFor="mlInputZoneId">
                  Zone ID
                </label>
                <input
                  id="mlInputZoneId"
                  type="text"
                  inputMode="numeric"
                  className={`mlbb-account-input ${cleanZoneId.length >= 2 ? 'is-valid' : ''}`}
                  placeholder="Zone ID (cth: 15148)"
                  value={mlZoneId}
                  onChange={(e) => handleZoneIdInput(e.target.value)}
                  required
                />
              </div>
            </div>

            <ul className="mlbb-account-notes">
              <li>Kami akan menghubungi nomor WhatsApp terdaftar jika ada kendala.</li>
              <li>Kode Voucher akan dikirimkan melalui nomor WhatsApp terdaftar.</li>
            </ul>
          </div>

          {/* 3. Ringkasan Pesanan (Gaya ProductModal Akun Premium) */}
          <div className="roblox-order-summary-box">
            <div className="summary-row">
              <span className="summary-label">Paket Terpilih:</span>
              <strong className="summary-val">Mobile Legends {currentPkg.name} ({currentPkg.breakdown})</strong>
            </div>
            <div className="summary-row">
              <span className="summary-label">Data Akun (User ID &amp; Zone ID):</span>
              <strong className="summary-val text-cyan">{formattedGameId}</strong>
            </div>
            <div className="summary-total-row">
              <span className="total-label">Total Pembayaran:</span>
              <strong className="total-val">{formatRupiah(totalPrice)}</strong>
            </div>
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
            <i className="fa-solid fa-shield-halved"></i> Pembayaran lengkap (QRIS Gateway, GoPay, DANA, Bank &amp; Voucher Promo) sama seperti produk Akun Premium.
          </p>
        </form>
      </div>
    </div>
  );
}
