import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../utils/format';
import { fetchRobloxProfile } from '../utils/roblox';

export const ROBUX_PACKAGES = [
  {
    id: '50r',
    amount: 50,
    name: '50 Robux',
    symbol: '50r',
    decoSymbol: '⁺ִ ⋆𐙚 ̊.  50r',
    price: 11000,
    badge: 'Starter',
    badgeClass: 'badge-bestseller',
    desc: 'Top up 50 Robux via username Roblox resmi tanpa password'
  },
  {
    id: '100r',
    amount: 100,
    name: '100 Robux',
    symbol: '100r',
    decoSymbol: '⁺ִ ⋆𐙚 ̊.  100r',
    price: 20000,
    badge: 'Populer',
    badgeClass: 'badge-flash',
    desc: 'Top up 100 Robux via username Roblox resmi tanpa password'
  },
  {
    id: '200r',
    amount: 200,
    name: '200 Robux',
    symbol: '200r',
    decoSymbol: '⁺ִ ⋆𐙚 ̊.  200r',
    price: 34000,
    badge: 'Hemat',
    badgeClass: 'badge-guarantee',
    desc: 'Top up 200 Robux via username Roblox resmi tanpa password'
  },
  {
    id: '300r',
    amount: 300,
    name: '300 Robux',
    symbol: '300r',
    decoSymbol: '⁺ִ ⋆𐙚 ̊.  300r',
    price: 55000,
    badge: 'Best Deal',
    badgeClass: 'badge-flash',
    desc: 'Top up 300 Robux via username Roblox resmi tanpa password'
  },
  {
    id: '400r',
    amount: 400,
    name: '400 Robux',
    symbol: '400r',
    decoSymbol: '⁺ִ ⋆𐙚 ̊.  400r',
    price: 73000,
    badge: 'Super Value',
    badgeClass: 'badge-bestseller',
    desc: 'Top up 400 Robux via username Roblox resmi tanpa password'
  },
  {
    id: '500r',
    amount: 500,
    name: '500 Robux',
    symbol: '500r',
    decoSymbol: '⁺ִ ⋆𐙚 ̊.  500r',
    price: 93000,
    badge: 'Mega Robux',
    badgeClass: 'badge-flash',
    desc: 'Top up 500 Robux via username Roblox resmi tanpa password'
  }
];

export default function RobloxBuyModal({
  isOpen,
  onClose,
  authUser,
  isBanned = false,
  onOpenLogin,
  onOpenBannedModal,
  onShowToast,
  onAddToCart,
  onProceedCheckout,
  initialPackageId = '50r'
}) {
  const [selectedPkgId, setSelectedPkgId] = useState(initialPackageId);
  const [robloxUsername, setRobloxUsername] = useState('');
  const [robloxProfile, setRobloxProfile] = useState(null);
  const [isSearchingProfile, setIsSearchingProfile] = useState(false);
  const [searchError, setSearchError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (initialPackageId) setSelectedPkgId(initialPackageId);
      if (authUser && !robloxUsername) {
        setRobloxUsername(authUser.username || '');
      }
    } else {
      setRobloxProfile(null);
      setSearchError(null);
      setIsSearchingProfile(false);
    }
  }, [isOpen, initialPackageId, authUser]);

  // Live Roblox Player Profile Lookup Debounce (450ms)
  useEffect(() => {
    if (!isOpen) return;
    let cleanUser = robloxUsername.trim();
    if (cleanUser.startsWith('@')) {
      cleanUser = cleanUser.substring(1).trim();
    }

    if (!cleanUser || cleanUser.length < 3) {
      setRobloxProfile(null);
      setSearchError(null);
      setIsSearchingProfile(false);
      return;
    }

    setIsSearchingProfile(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      try {
        const result = await fetchRobloxProfile(cleanUser);
        setIsSearchingProfile(false);
        if (result && result.found && result.user) {
          setRobloxProfile(result.user);
          setSearchError(null);
        } else {
          setRobloxProfile(null);
          setSearchError(result?.message || `Akun Roblox "${cleanUser}" tidak ditemukan.`);
        }
      } catch {
        setIsSearchingProfile(false);
        setRobloxProfile(null);
        setSearchError('Gagal memeriksa profil Roblox. Periksa koneksi internet.');
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [isOpen, robloxUsername]);

  if (!isOpen) return null;

  const currentPkg =
    ROBUX_PACKAGES.find((p) => p.id === selectedPkgId) || ROBUX_PACKAGES[0];
  const totalPrice = currentPkg.price;
  const cleanRobloxUser = robloxUsername.replace(/^@/, '').trim();

  const validateRobloxAccount = () => {
    if (isBanned) {
      onOpenBannedModal?.();
      onShowToast?.('Akses Ditolak: Akun Anda sedang di-banned!', 'fa-ban text-danger');
      return false;
    }
    if (!authUser) {
      onOpenLogin?.();
      onShowToast?.('Silakan login terlebih dahulu untuk top up Robux Roblox!', 'fa-right-to-bracket text-warning');
      return false;
    }
    if (!cleanRobloxUser || cleanRobloxUser.length < 3) {
      onShowToast?.('Username Roblox kamu wajib diisi pada Masukan Data Akun!', 'fa-triangle-exclamation', 'warning');
      document.getElementById('robloxInputUsername')?.focus();
      return false;
    }
    return true;
  };

  const buildDurationText = () =>
    robloxProfile
      ? `Robux ${currentPkg.symbol} • @${cleanRobloxUser} (ID: ${robloxProfile.id})`
      : `Robux ${currentPkg.symbol} • @${cleanRobloxUser}`;

  const handleAddCurrentToCart = () => {
    if (!validateRobloxAccount()) return;
    if (typeof onAddToCart === 'function') {
      onAddToCart({
        id: Date.now() + Math.floor(Math.random() * 1000),
        productId: `roblox-${currentPkg.id}`,
        productName: `Roblox Robux ${currentPkg.name} (${currentPkg.symbol})`,
        durationName: buildDurationText(),
        viaType: `Username: @${cleanRobloxUser}`,
        category: 'Top Up Game',
        price: currentPkg.price,
        originalPrice: currentPkg.price,
        customerUsername: cleanRobloxUser,
        customerRobloxAvatar: robloxProfile?.avatarUrl || null,
        customerRobloxFullAvatar: robloxProfile?.avatarFullUrl || null,
        customerRobloxDisplayName: robloxProfile?.displayName || null,
        customerRobloxId: robloxProfile?.id || null,
        warrantyPeriod: 'Garansi Robux Masuk 100%'
      });
      onClose();
    }
  };

  const handleProceedOrder = (e) => {
    if (e) e.preventDefault();
    if (!validateRobloxAccount()) return;

    const checkoutItem = {
      productId: `roblox-${currentPkg.id}`,
      name: `Roblox Robux ${currentPkg.name} (${currentPkg.symbol})`,
      duration: buildDurationText(),
      via: `Username: @${cleanRobloxUser}`,
      category: 'Top Up Game',
      price: currentPkg.price,
      qty: 1,
      total: totalPrice,
      customerUsername: cleanRobloxUser,
      customerRobloxAvatar: robloxProfile?.avatarUrl || null,
      customerRobloxFullAvatar: robloxProfile?.avatarFullUrl || null,
      customerRobloxDisplayName: robloxProfile?.displayName || null,
      customerRobloxId: robloxProfile?.id || null,
      warrantyPeriod: 'Garansi Robux Masuk 100%'
    };

    onClose();
    if (typeof onProceedCheckout === 'function') {
      onProceedCheckout(checkoutItem);
    }
  };

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box modal-box-redesign roblox-buy-modal-box">
        <button className="modal-close-btn roblox-modal-close" onClick={onClose} aria-label="Tutup">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Modal Header */}
        <div className="modal-header-centered roblox-modal-header">
          <div className="trx-header-icon-wrap roblox-header-icon">
            <i className="fa-solid fa-cube"></i>
          </div>
          <span className="modal-tag roblox-modal-tag">
            TOP UP ROBUX VIA USERNAME RESMI
          </span>
          <h3 className="modal-title-centered roblox-modal-title">
            Pilih Paket &amp; Data Akun Roblox
          </h3>
          <p className="modal-desc roblox-modal-desc">
            Isi saldo Robux legal dan bergaransi 100%. Masukkan username akun Roblox Anda sebelum masuk Keranjang atau Bayar Sekarang!
          </p>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleProceedOrder} className="steam-modal-body roblox-modal-body">
          {/* 1. Pilih Denominasi Robux */}
          <div className="roblox-section-group">
            <label className="roblox-form-label-header">
              <span>
                <i className="fa-solid fa-cube text-cyan"></i> <strong>1. Pilih Jumlah Robux:</strong>
              </span>
              <span className="roblox-current-deco-symbol">
                {currentPkg.decoSymbol}
              </span>
            </label>

            <div className="roblox-packages-grid">
              {ROBUX_PACKAGES.map((pkg) => {
                const isSelected = selectedPkgId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    className={`roblox-pkg-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedPkgId(pkg.id)}
                  >
                    <div className="roblox-pkg-name">{pkg.name}</div>
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

          {/* 2. Masukan Data Akun (Username Roblox + Avatar Preview + Catatan WA) */}
          <div className="mlbb-account-box">
            <div className="mlbb-account-box-header">
              <span className="mlbb-account-step-pill">
                <i className="fa-solid fa-user-check"></i> Masukan Data Akun
              </span>
              {robloxProfile && (
                <span className="roblox-verified-badge">
                  <i className="fa-solid fa-circle-check"></i> Terverifikasi
                </span>
              )}
            </div>

            <div className="mlbb-account-field">
              <label className="mlbb-account-label" htmlFor="robloxInputUsername">
                Username Roblox (Tanpa Password)
              </label>
              <div className="roblox-input-wrap">
                <span className="roblox-input-icon-left">
                  <i className="fa-solid fa-at"></i>
                </span>
                <input
                  id="robloxInputUsername"
                  type="text"
                  className={`form-control roblox-username-input ${robloxProfile ? 'is-valid' : searchError ? 'is-invalid' : ''}`}
                  placeholder="Ketik username Roblox kamu (cth: player123)"
                  value={robloxUsername}
                  onChange={(e) => setRobloxUsername(e.target.value)}
                  required
                />
                <span className="roblox-input-icon-right">
                  {isSearchingProfile ? (
                    <i className="fa-solid fa-spinner fa-spin text-cyan"></i>
                  ) : robloxProfile ? (
                    <i className="fa-solid fa-circle-check text-emerald"></i>
                  ) : searchError ? (
                    <i className="fa-solid fa-circle-xmark text-danger"></i>
                  ) : null}
                </span>
              </div>
            </div>

            {isSearchingProfile && (
              <div className="roblox-status-box searching">
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Sedang mencari profil avatar Roblox <strong>@{robloxUsername}</strong>...</span>
              </div>
            )}

            {robloxProfile && !isSearchingProfile && (
              <div className="roblox-profile-found-card">
                <div className="roblox-profile-inner">
                  <div className="roblox-avatar-wrap">
                    <img
                      src={robloxProfile.avatarUrl || robloxProfile.avatarFullUrl || '/roblox.png'}
                      alt={robloxProfile.name}
                      className="roblox-avatar-img"
                      onError={(e) => {
                        if (robloxProfile.avatarFullUrl && e.target.src !== robloxProfile.avatarFullUrl) {
                          e.target.src = robloxProfile.avatarFullUrl;
                        } else {
                          e.target.src = '/roblox.png';
                        }
                      }}
                    />
                    <span className="roblox-avatar-check">
                      <i className="fa-solid fa-check"></i>
                    </span>
                  </div>

                  <div className="roblox-profile-info">
                    <div className="roblox-profile-name-row">
                      <span className="roblox-profile-display-name">
                        {robloxProfile.displayName || robloxProfile.name}
                      </span>
                      <span className="roblox-tag-verified">Akun Ditemukan</span>
                    </div>
                    <div className="roblox-profile-id-row">
                      @{robloxProfile.name} &bull; <span>ID: {robloxProfile.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {searchError && !isSearchingProfile && cleanRobloxUser.length >= 3 && (
              <div className="roblox-status-box error">
                <i className="fa-solid fa-triangle-exclamation text-danger"></i>
                <div>
                  <strong>{searchError}</strong>
                  <div className="roblox-error-sub">
                    Gunakan <strong>Username asli</strong> akun Roblox kamu (bukan Display Name) tanpa spasi.
                  </div>
                </div>
              </div>
            )}

            <ul className="mlbb-account-notes">
              <li>Kami akan menghubungi nomor WhatsApp terdaftar jika ada kendala.</li>
              <li>Kode Voucher akan dikirimkan melalui nomor WhatsApp terdaftar.</li>
            </ul>
          </div>

          {/* 3. Ringkasan Pesanan */}
          <div className="roblox-order-summary-box">
            <div className="summary-row">
              <span className="summary-label">Paket Terpilih:</span>
              <strong className="summary-val">Robux Roblox ({currentPkg.name})</strong>
            </div>
            <div className="summary-row">
              <span className="summary-label">Tujuan Username:</span>
              <strong className="summary-val text-cyan">{cleanRobloxUser || '(Belum diisi)'}</strong>
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
            <i className="fa-solid fa-shield-halved"></i> Pembayaran lengkap (QRIS Gateway, GoPay, DANA, Bank Muamalat &amp; Voucher Promo) sama seperti produk Akun Premium.
          </p>
        </form>
      </div>
    </div>
  );
}
