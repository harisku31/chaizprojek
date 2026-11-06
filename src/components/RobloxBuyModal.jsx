import React, { useState, useEffect, useRef } from 'react';
import { formatRupiah, copyToClipboard, compressImageFile } from '../utils/format';
import { PAYMENT_INFO } from '../data/config';
import { createTransaction, getUserKey } from '../utils/transactions';
import { fetchRobloxProfile } from '../utils/roblox';
import { playUserNoticeSound, unlockAudio } from '../utils/audioNotification';
import {
  generateQrisDataUrl,
  QRIS_GATEWAY_CLIENT_KEY,
  MERCHANT_NMID,
  verifyGatewayPayment
} from '../utils/qrisGateway';

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
  onGoToTransactions,
  initialPackageId = '50r'
}) {
  const [selectedPkgId, setSelectedPkgId] = useState(initialPackageId);
  const [robloxUsername, setRobloxUsername] = useState('');
  const [robloxProfile, setRobloxProfile] = useState(null);
  const [isSearchingProfile, setIsSearchingProfile] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerWa, setBuyerWa] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('qris');
  const [uploadedProof, setUploadedProof] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dynamicQrisUrl, setDynamicQrisUrl] = useState(null);
  const [isGeneratingQris, setIsGeneratingQris] = useState(false);
  const [qrisTimerSeconds, setQrisTimerSeconds] = useState(900);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (initialPackageId) setSelectedPkgId(initialPackageId);
      setSelectedMethod('qris');
      setUploadedProof(null);

      if (authUser) {
        setBuyerName(authUser.name || '');
        setBuyerEmail(authUser.email || '');
        setBuyerWa(authUser.phone || '');
        if (!robloxUsername) {
          setRobloxUsername(authUser.username || '');
        }
      }
    } else {
      setRobloxProfile(null);
      setSearchError(null);
      setIsSearchingProfile(false);
    }
  }, [isOpen, initialPackageId, authUser]);

  // Live Roblox Player Profile Lookup Debounce (450ms)
  useEffect(() => {
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
      } catch (err) {
        setIsSearchingProfile(false);
        setRobloxProfile(null);
        setSearchError('Gagal memeriksa profil Roblox. Periksa koneksi internet.');
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [robloxUsername]);

  if (!isOpen) return null;

  const currentPkg =
    ROBUX_PACKAGES.find((p) => p.id === selectedPkgId) ||
    ROBUX_PACKAGES[0];

  const totalPrice = currentPkg.price;

  // Generate Dynamic QRIS Otomatis Sesuai Paket Robux
  useEffect(() => {
    let isCancelled = false;
    if (isOpen && totalPrice > 0) {
      setIsGeneratingQris(true);
      generateQrisDataUrl({
        amount: totalPrice,
        orderId: `RBX-${Date.now().toString().slice(-6)}`
      })
        .then((res) => {
          if (!isCancelled) {
            setDynamicQrisUrl(res.dataUrl);
            setIsGeneratingQris(false);
          }
        })
        .catch(() => {
          if (!isCancelled) setIsGeneratingQris(false);
        });
    }
    return () => {
      isCancelled = true;
    };
  }, [isOpen, totalPrice]);

  // Countdown timer 15 Menit
  useEffect(() => {
    if (!isOpen) {
      setQrisTimerSeconds(900);
      return;
    }
    const timer = setInterval(() => {
      setQrisTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const handleCopyRekening = async (number, label) => {
    const success = await copyToClipboard(number);
    if (success) {
      onShowToast?.(`Nomor ${label} (${number}) berhasil disalin!`, 'fa-copy text-success');
    }
  };

  const handleDownloadQris = (e) => {
    e.preventDefault();
    const qrUrl = dynamicQrisUrl || '/Qris.png';
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `QRIS-ChaizStore-Robux-${currentPkg.symbol}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast?.(`Foto QRIS Dinamis Robux (${formatRupiah(totalPrice)}) berhasil di-download!`, 'fa-circle-check text-success');
  };

  const handleProofChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast?.('Harap pilih file foto bukti transfer (JPG / PNG / WEBP)', 'fa-triangle-exclamation');
      e.target.value = '';
      return;
    }

    try {
      const compressedDataUrl = await compressImageFile(file, 900, 1200, 0.72);
      const sizeKb = ((compressedDataUrl?.length || file.size) * 0.75 / 1024).toFixed(1);
      const proofObj = {
        file,
        name: file.name,
        size: `${sizeKb} KB (Ringan & Cepat)`,
        dataUrl: compressedDataUrl,
        uploadedUrl: compressedDataUrl
      };

      setUploadedProof(proofObj);
      onShowToast?.('Foto bukti transfer berhasil di-upload!', 'fa-circle-check text-success');
    } catch {
      onShowToast?.('Gagal memproses foto bukti transfer', 'fa-triangle-exclamation');
    }
  };

  const handleRemoveProof = (e) => {
    e.stopPropagation();
    setUploadedProof(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onShowToast?.('Foto bukti transfer dihapus', 'fa-trash-can');
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    unlockAudio();

    if (isBanned) {
      onOpenBannedModal?.();
      onShowToast?.('Akses Ditolak: Akun Anda sedang di-banned!', 'fa-ban text-danger');
      return;
    }

    if (!authUser) {
      onOpenLogin?.();
      onShowToast?.('Silakan login terlebih dahulu untuk melakukan pembelian Robux!', 'fa-right-to-bracket text-warning');
      return;
    }

    const cleanRobloxUser = robloxUsername.trim();
    const name = buyerName.trim();
    const email = buyerEmail.trim();
    const wa = buyerWa.trim();

    if (!cleanRobloxUser) {
      onShowToast?.('Username Roblox kamu wajib diisi untuk pengisian Robux!', 'fa-triangle-exclamation', 'warning');
      return;
    }
    if (!name) {
      onShowToast?.('Silakan masukkan Nama Lengkap Anda!', 'fa-triangle-exclamation');
      return;
    }
    if (!email) {
      onShowToast?.('Silakan masukkan Email / Gmail Anda!', 'fa-triangle-exclamation');
      return;
    }
    if (!wa) {
      onShowToast?.('⚠️ Jangan lupa isi nomor telepon / WhatsApp kamu!', 'fa-phone text-warning', 'warning');
      const el = document.getElementById('robloxBuyerWa');
      el?.focus();
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!selectedMethod) {
      onShowToast?.('Silakan pilih salah satu metode pembayaran!', 'fa-triangle-exclamation');
      return;
    }

    setIsSubmitting(true);

    try {
      if (selectedMethod === 'qris') {
        await verifyGatewayPayment({
          orderId: `roblox-${currentPkg.id}`,
          amount: totalPrice
        });
      }

      const finalEmail = (authUser?.email || email || '').toLowerCase().trim();
      const finalUserId =
        authUser?.id ||
        getUserKey(authUser) ||
        (finalEmail && finalEmail !== '-' ? getUserKey({ email: finalEmail }) : null);

      const isGateway = selectedMethod === 'qris';
      const proofImg = isGateway ? 'GATEWAY_SUCCESS' : (uploadedProof?.dataUrl || uploadedProof?.uploadedUrl || null);

      const newTrx = createTransaction({
        productId: 'roblox-' + currentPkg.id,
        productName: `Roblox Robux ${currentPkg.name} (${currentPkg.symbol})`,
        productDuration: robloxProfile
          ? `Robux ${currentPkg.symbol} • ${cleanRobloxUser} (ID: ${robloxProfile.id})`
          : `Robux ${currentPkg.symbol} • ${cleanRobloxUser}`,
        productCategory: 'Top Up Game',
        price: currentPkg.price,
        qty: 1,
        total: totalPrice,
        userId: finalUserId,
        userEmail: finalEmail !== '-' ? finalEmail : null,
        customerUsername: cleanRobloxUser,
        customerRobloxAvatar: robloxProfile?.avatarUrl || null,
        customerRobloxFullAvatar: robloxProfile?.avatarFullUrl || null,
        customerRobloxDisplayName: robloxProfile?.displayName || null,
        customerRobloxId: robloxProfile?.id || null,
        customerName: name,
        customerEmail: finalEmail,
        customerPhone: wa,
        paymentMethod: isGateway ? 'QRIS Payment Gateway Otomatis' : (PAYMENT_INFO[selectedMethod]?.name || 'Transfer'),
        paymentStatus: isGateway ? 'Lunas' : 'Pending',
        isGatewayPaid: isGateway,
        gatewayKey: isGateway ? QRIS_GATEWAY_CLIENT_KEY : null,
        proofUrl: proofImg,
        proofFileName: isGateway ? 'Verifikasi_Otomatis_Gateway' : (uploadedProof?.name || (proofImg ? 'Bukti_Transfer_Robux.png' : null)),
        proofSize: isGateway ? `Lunas (${QRIS_GATEWAY_CLIENT_KEY.slice(0, 10)}...)` : (uploadedProof?.size || null),
        warrantyPeriod: 'Garansi Robux Masuk 100%'
      });

      playUserNoticeSound();

      onShowToast?.(
        `🎉 Pesanan Robux #${newTrx.id} berhasil dibuat! Membuka daftar transaksi akun Anda...`,
        'fa-circle-check text-success'
      );

      onClose();

      if (typeof onGoToTransactions === 'function') {
        setTimeout(() => {
          onGoToTransactions();
        }, 150);
      }
    } catch (err) {
      console.error('Error creating Roblox transaction:', err);
      onShowToast?.('Gagal membuat pesanan Robux, coba sesaat lagi.', 'fa-triangle-exclamation', 'danger');
    } finally {
      setIsSubmitting(false);
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
            Checkout Saldo Robux Roblox
          </h3>
          <p className="modal-desc roblox-modal-desc">
            Isi saldo Robux legal dan bergaransi 100%. Cukup masukkan username akun Roblox kamu tanpa butuh password!
          </p>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmitOrder} className="steam-modal-body roblox-modal-body">
          {/* 1. Pilih Denominasi Robux */}
          <div className="roblox-section-group">
            <label className="roblox-form-label-header">
              <span>
                <i className="fa-solid fa-cube text-cyan"></i> <strong>Pilih Jumlah Robux:</strong>
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
                    <div className="roblox-pkg-name">
                      {pkg.name}
                    </div>
                    <div className="roblox-pkg-price">
                      {formatRupiah(pkg.price)}
                    </div>
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

          {/* 2. INPUT UTAMA: USERNAME ROBLOX KAMU */}
          <div className="roblox-username-card">
            <div className="roblox-username-header">
              <label className="roblox-form-label" htmlFor="robloxInputUsername">
                <i className="fa-solid fa-user-ninja text-cyan"></i>
                <strong>Username Roblox Kamu (Wajib):</strong>
              </label>
              {robloxProfile && (
                <span className="roblox-verified-badge">
                  <i className="fa-solid fa-circle-check"></i> Terverifikasi
                </span>
              )}
            </div>

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

            {/* Status Searching */}
            {isSearchingProfile && (
              <div className="roblox-status-box searching">
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Sedang mencari profil avatar Roblox <strong>@{robloxUsername}</strong>...</span>
              </div>
            )}

            {/* Profile Avatar Card Ketika Ditemukan */}
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
                      {robloxProfile.hasVerifiedBadge && (
                        <i className="fa-solid fa-certificate text-cyan" title="Roblox Verified"></i>
                      )}
                      <span className="roblox-tag-verified">
                        Akun Ditemukan
                      </span>
                    </div>

                    <div className="roblox-profile-id-row">
                      @{robloxProfile.name} • <span>ID: {robloxProfile.id}</span>
                    </div>

                    <div className="roblox-profile-notice">
                      <i className="fa-solid fa-circle-check"></i>
                      <span>Pastikan foto avatar ini beneran akun Roblox kamu ya!</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Not Found */}
            {searchError && !isSearchingProfile && robloxUsername.trim().length >= 3 && (
              <div className="roblox-status-box error">
                <i className="fa-solid fa-triangle-exclamation text-danger"></i>
                <div>
                  <strong>{searchError}</strong>
                  <div className="roblox-error-sub">
                    Gunakan <strong>Username asli</strong> akun Roblox kamu (bukan Display Name) tanpa tanda spasi.
                  </div>
                </div>
              </div>
            )}

            {/* Catatan Bantuan */}
            <div className="roblox-field-helper">
              <i className="fa-solid fa-shield-halved text-emerald"></i>
              <span>Cukup masukkan username akun Roblox kamu tanpa tanda @ dan <strong>tanpa password</strong>.</span>
            </div>
          </div>

          {/* 3. Kontak Pelanggan */}
          <div className="roblox-section-group roblox-buyer-details">
            <label className="roblox-form-label-header">
              <i className="fa-solid fa-address-card text-cyan"></i> <strong>Data Pemesan:</strong>
            </label>

            <div className="roblox-form-grid-2">
              <div>
                <label className="roblox-input-label" htmlFor="robloxBuyerName">Nama Lengkap:</label>
                <input
                  id="robloxBuyerName"
                  type="text"
                  className="form-control roblox-input"
                  placeholder="Nama Lengkap"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="roblox-input-label-row">
                  <label className="roblox-input-label" htmlFor="robloxBuyerWa">
                    No. WhatsApp / HP:
                  </label>
                  {!buyerWa.trim() && (
                    <span className="roblox-required-hint">*Jangan lupa isi</span>
                  )}
                </div>
                <input
                  id="robloxBuyerWa"
                  type="tel"
                  className={`form-control roblox-input ${!buyerWa.trim() ? 'border-warning' : ''}`}
                  placeholder="Contoh: 08123456789"
                  value={buyerWa}
                  onChange={(e) => setBuyerWa(e.target.value)}
                  required
                />
              </div>

              <div className="roblox-full-col">
                <label className="roblox-input-label" htmlFor="robloxBuyerEmail">Email / Gmail:</label>
                <input
                  id="robloxBuyerEmail"
                  type="email"
                  className="form-control roblox-input"
                  placeholder="alamat.email@gmail.com"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* 4. Pilihan Metode Pembayaran */}
          <div className="roblox-section-group roblox-payment-section">
            <label className="roblox-form-label-header">
              <i className="fa-solid fa-wallet text-warning"></i> <strong>Pilih Metode Pembayaran:</strong>
            </label>

            <div className="roblox-method-grid">
              <button
                type="button"
                className={`roblox-method-card qris ${selectedMethod === 'qris' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('qris')}
              >
                <i className="fa-solid fa-qrcode method-icon text-emerald"></i>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                  <strong className="method-title">QRIS Gateway</strong>
                </div>
                <small className="method-sub">Dinamis &bull; Lunas Otomatis</small>
              </button>

              <button
                type="button"
                className={`roblox-method-card ewallet ${selectedMethod === 'ewallet' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('ewallet')}
              >
                <i className="fa-solid fa-wallet method-icon text-cyan"></i>
                <strong className="method-title">DANA / E-Wallet</strong>
                <small className="method-sub">0818-0973-0331</small>
              </button>

              <button
                type="button"
                className={`roblox-method-card bank ${selectedMethod === 'bank' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('bank')}
              >
                <i className="fa-solid fa-building-columns method-icon text-purple"></i>
                <strong className="method-title">Bank Muamalat</strong>
                <small className="method-sub">1080010996</small>
              </button>
            </div>

            {/* Detail Box Metode Pembayaran */}
            <div className="roblox-method-detail-box">
              {selectedMethod === 'qris' && (
                <div className="roblox-qris-wrap">
                  <div className="dynamic-qris-nominal-box" style={{ margin: '0 0 12px', padding: '10px 14px' }}>
                    <div className="nominal-header">
                      <div className="nominal-tag">
                        <i className="fa-solid fa-bolt text-warning"></i>
                        <span>DYNAMIC QRIS GATEWAY</span>
                      </div>
                      <div className="nominal-timer">
                        <i className="fa-regular fa-clock"></i>
                        <span>Sesi: {Math.floor(qrisTimerSeconds / 60)}:{('0' + (qrisTimerSeconds % 60)).slice(-2)}</span>
                      </div>
                    </div>
                    <div className="nominal-amount-wrap" style={{ marginTop: '4px' }}>
                      <span className="nominal-label-text">Total Nominal Terkunci:</span>
                      <strong className="nominal-val">{formatRupiah(totalPrice)}</strong>
                    </div>
                  </div>

                  <div className="roblox-qris-img-container">
                    {isGeneratingQris ? (
                      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
                        <i className="fa-solid fa-spinner fa-spin text-cyan" style={{ fontSize: '1.8rem', marginBottom: '8px' }}></i>
                        <p style={{ margin: 0, fontSize: '0.8rem' }}>Membuat QRIS Dinamis {formatRupiah(totalPrice)}...</p>
                      </div>
                    ) : (
                      <img
                        src={dynamicQrisUrl || '/Qris.png'}
                        alt={`QRIS ChaizStore Robux ${formatRupiah(totalPrice)}`}
                        className="roblox-qris-img"
                      />
                    )}
                  </div>
                  <div style={{ textAlign: 'center', margin: '4px 0 10px', fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
                    <span>NMID: {MERCHANT_NMID} &bull; CHAIZSTORE &bull; {QRIS_GATEWAY_CLIENT_KEY.slice(0, 16)}...</span>
                  </div>
                  <div className="roblox-qris-btns">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm roblox-btn-copy"
                      onClick={handleDownloadQris}
                    >
                      <i className="fa-solid fa-download"></i> Download QRIS ({formatRupiah(totalPrice)})
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm roblox-btn-copy"
                      onClick={() => handleCopyRekening(formatRupiah(totalPrice), 'Total Pembayaran')}
                    >
                      <i className="fa-solid fa-copy"></i> Salin Nominal
                    </button>
                  </div>
                </div>
              )}

              {selectedMethod === 'ewallet' && (
                <div className="roblox-rekening-row">
                  <div>
                    <strong className="roblox-rek-title">DANA / GoPay / OVO</strong>
                    <span className="roblox-rek-sub text-cyan">0818-0973-0331 (a.n Haris)</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm roblox-btn-copy"
                    onClick={() => handleCopyRekening('081809730331', 'Nomor E-Wallet')}
                  >
                    <i className="fa-solid fa-copy"></i> Salin Nomor
                  </button>
                </div>
              )}

              {selectedMethod === 'bank' && (
                <div className="roblox-rekening-row">
                  <div>
                    <strong className="roblox-rek-title">Bank Muamalat</strong>
                    <span className="roblox-rek-sub text-purple">1080010996 (a.n Haris)</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm roblox-btn-copy"
                    onClick={() => handleCopyRekening('1080010996', 'Nomor Rekening')}
                  >
                    <i className="fa-solid fa-copy"></i> Salin Rekening
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 5. Informasi Garansi & Proses */}
          <div className="roblox-section-group roblox-proof-section">
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.06))',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                padding: '12px 14px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <i className="fa-solid fa-bolt text-warning" style={{ fontSize: '1.2rem' }}></i>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                <strong style={{ color: '#34d399', display: 'block' }}>Proses Otomatis & Garansi Robux 100%</strong>
                Pesanan Robux Anda akan langsung diproses ke akun Roblox tujuan setelah konfirmasi pembayaran.
              </div>
            </div>
          </div>

          {/* Ringkasan & Total Tagihan */}
          <div className="roblox-order-summary-box">
            <div className="summary-row">
              <span className="summary-label">Item Pesanan:</span>
              <strong className="summary-val">Robux Roblox ({currentPkg.name})</strong>
            </div>
            <div className="summary-row">
              <span className="summary-label">Tujuan Username:</span>
              <strong className="summary-val text-cyan">{robloxUsername || '(Belum diisi)'}</strong>
            </div>
            <div className="summary-row">
              <span className="summary-label">Metode Pembayaran:</span>
              <span className="summary-val text-cyan">{selectedMethod.toUpperCase()}</span>
            </div>
            <div className="summary-total-row">
              <span className="total-label">Total Tagihan:</span>
              <strong className="total-val">{formatRupiah(totalPrice)}</strong>
            </div>
          </div>

          {/* Tombol Submit Pesanan */}
          <button
            type="submit"
            className="btn btn-primary roblox-modal-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Memproses Pesanan Robux...</span>
              </>
            ) : (
              <>
                <i className={selectedMethod === 'qris' ? 'fa-solid fa-bolt' : 'fa-solid fa-cube'}></i>
                <span>{selectedMethod === 'qris' ? `Bayar Sekarang via QRIS Gateway (${formatRupiah(totalPrice)})` : `Konfirmasi & Beli Sekarang (${formatRupiah(totalPrice)})`}</span>
                <i className="fa-solid fa-arrow-right"></i>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
