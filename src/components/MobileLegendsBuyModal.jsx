import React, { useState, useEffect, useRef } from 'react';
import { formatRupiah, copyToClipboard, compressImageFile } from '../utils/format';
import { PAYMENT_INFO } from '../data/config';
import { createTransaction, getUserKey } from '../utils/transactions';
import { playUserNoticeSound, unlockAudio } from '../utils/audioNotification';
import { QrisLogo, GopayLogo } from './PaymentLogos';

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
 * Modal Checkout Top Up Diamond Mobile Legends Indonesia
 */
export default function MobileLegendsBuyModal({
  isOpen,
  onClose,
  authUser,
  isBanned = false,
  onOpenLogin,
  onOpenBannedModal,
  onShowToast,
  onGoToTransactions,
  onProceedToPayment,
  initialPackageId = '10d',
  initialUserId = '',
  initialZoneId = ''
}) {
  const [selectedPkgId, setSelectedPkgId] = useState(initialPackageId);
  const [mlUserId, setMlUserId] = useState(initialUserId);
  const [mlZoneId, setMlZoneId] = useState(initialZoneId);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerWa, setBuyerWa] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('qris');
  const [uploadedProof, setUploadedProof] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (initialPackageId) setSelectedPkgId(initialPackageId);
      if (initialUserId) setMlUserId(initialUserId);
      if (initialZoneId) setMlZoneId(initialZoneId);
      setSelectedMethod('qris');
      setUploadedProof(null);

      if (authUser) {
        setBuyerName(authUser.name || '');
        setBuyerEmail(authUser.email || '');
        setBuyerWa(authUser.phone || authUser.whatsapp || '');
      }
    }
  }, [isOpen, initialPackageId, initialUserId, initialZoneId, authUser]);

  if (!isOpen) return null;

  const currentPkg =
    MLBB_PACKAGES.find((p) => p.id === selectedPkgId) || MLBB_PACKAGES[0];
  const totalPrice = currentPkg.price;

  const handleUserIdInput = (rawValue) => {
    // Izinkan tempel format "1268190411 (15148)" lalu pisah otomatis menjadi User ID & Zone ID
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

  const handleCopyRekening = async (number, label) => {
    const success = await copyToClipboard(number);
    if (success) {
      onShowToast?.(`Nomor ${label} (${number}) berhasil disalin!`, 'fa-copy text-success');
    }
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
      const sizeKb = (((compressedDataUrl?.length || file.size) * 0.75) / 1024).toFixed(1);
      setUploadedProof({
        file,
        name: file.name,
        size: `${sizeKb} KB (Ringan & Cepat)`,
        dataUrl: compressedDataUrl,
        uploadedUrl: compressedDataUrl
      });
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

  const cleanUserId = mlUserId.trim();
  const cleanZoneId = mlZoneId.trim();
  const formattedGameId =
    cleanUserId && cleanZoneId
      ? `${cleanUserId} (${cleanZoneId})`
      : cleanUserId || '(Belum diisi)';

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
      onShowToast?.('Silakan login terlebih dahulu untuk top up Diamond Mobile Legends!', 'fa-right-to-bracket text-warning');
      return;
    }

    if (!cleanUserId || cleanUserId.length < 4) {
      onShowToast?.('User ID Mobile Legends wajib diisi dengan benar (contoh: 1268190411)!', 'fa-triangle-exclamation', 'warning');
      document.getElementById('mlInputUserId')?.focus();
      return;
    }
    if (!cleanZoneId || cleanZoneId.length < 2) {
      onShowToast?.('Zone ID / Server Mobile Legends wajib diisi dengan benar (contoh: 15148)!', 'fa-triangle-exclamation', 'warning');
      document.getElementById('mlInputZoneId')?.focus();
      return;
    }

    const name = buyerName.trim();
    const email = buyerEmail.trim();
    const wa = buyerWa.trim();

    if (!name) {
      onShowToast?.('Silakan masukkan Nama Lengkap Anda!', 'fa-triangle-exclamation');
      return;
    }
    if (!wa) {
      onShowToast?.('⚠️ Jangan lupa isi nomor telepon / WhatsApp kamu!', 'fa-phone text-warning', 'warning');
      const el = document.getElementById('mlBuyerWa');
      el?.focus();
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!email) {
      onShowToast?.('Silakan masukkan Email / Gmail Anda!', 'fa-triangle-exclamation');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalEmail = (authUser?.email || email || '').toLowerCase().trim();
      const finalUserId =
        authUser?.id ||
        getUserKey(authUser) ||
        (finalEmail && finalEmail !== '-' ? getUserKey({ email: finalEmail }) : null);

      const durationLabel = `${currentPkg.name} (${currentPkg.breakdown}) • ID: ${formattedGameId}`;

      // 1. Alur Otomatis JansPayment QRIS / GoPay Instant
      if (selectedMethod === 'qris' || selectedMethod === 'gopay') {
        const orderId = `MLBB-${Date.now().toString().slice(-6)}`;
        const orderPayload = {
          id: orderId,
          amount: totalPrice,
          total: totalPrice,
          originalTotal: totalPrice,
          productDuration: durationLabel,
          warrantyPeriod: 'Garansi Diamond Masuk 100%',
          items: [
            {
              id: 'mlbb-' + currentPkg.id,
              productId: 'mlbb-' + currentPkg.id,
              name: `Mobile Legends ${currentPkg.name} (${currentPkg.breakdown})`,
              duration: durationLabel,
              category: 'Top Up Game',
              price: currentPkg.price,
              qty: 1,
              warrantyPeriod: 'Garansi Diamond Masuk 100%'
            }
          ],
          userId: finalUserId,
          userEmail: finalEmail !== '-' ? finalEmail : null,
          customerName: name || authUser?.name || 'Pelanggan ChaizStore',
          customerPhone: wa,
          customerEmail: finalEmail !== '-' ? finalEmail : 'order@chaizstore.my.id',
          customerUsername: formattedGameId,
          customerMlUserId: cleanUserId,
          customerMlZoneId: cleanZoneId,
          paymentMethod:
            selectedMethod === 'gopay'
              ? 'GoPay Instant Otomatis'
              : 'QRIS Payment Gateway Otomatis',
          subMethod: selectedMethod,
          source: 'mlbb'
        };

        setIsSubmitting(false);
        onClose();
        if (typeof onProceedToPayment === 'function') {
          onProceedToPayment(orderPayload);
        } else {
          try {
            localStorage.setItem('chaiz_active_payment', JSON.stringify(orderPayload));
            window.location.hash = `#pembayaran?trx=${orderId}&total=${totalPrice}&method=${selectedMethod}`;
          } catch {}
        }
        return;
      }

      // 2. Alur Transfer Manual (DANA / E-Wallet / Bank Muamalat)
      const proofImg = uploadedProof?.dataUrl || uploadedProof?.uploadedUrl || null;
      const newTrx = createTransaction({
        productId: 'mlbb-' + currentPkg.id,
        productName: `Mobile Legends ${currentPkg.name} (${currentPkg.breakdown})`,
        productDuration: durationLabel,
        productCategory: 'Top Up Game',
        price: currentPkg.price,
        qty: 1,
        total: totalPrice,
        userId: finalUserId,
        userEmail: finalEmail !== '-' ? finalEmail : null,
        customerUsername: formattedGameId,
        customerMlUserId: cleanUserId,
        customerMlZoneId: cleanZoneId,
        customerName: name,
        customerEmail: finalEmail,
        customerPhone: wa,
        paymentMethod: PAYMENT_INFO[selectedMethod]?.name || 'Transfer Manual',
        paymentStatus: 'Pending',
        isGatewayPaid: false,
        proofUrl: proofImg,
        proofFileName: uploadedProof?.name || (proofImg ? 'Bukti_Transfer_MLBB.png' : null),
        proofSize: uploadedProof?.size || null,
        warrantyPeriod: 'Garansi Diamond Masuk 100%'
      });

      playUserNoticeSound();
      onShowToast?.(
        `🎉 Pesanan MLBB #${newTrx.id} berhasil dibuat! Silakan pantau proses pengiriman di halaman Transaksi.`,
        'fa-circle-check text-success'
      );

      onClose();
      if (typeof onGoToTransactions === 'function') {
        setTimeout(() => onGoToTransactions(), 150);
      }
    } catch (err) {
      console.error('Error creating MLBB transaction:', err);
      onShowToast?.('Gagal membuat pesanan Mobile Legends, coba sesaat lagi.', 'fa-triangle-exclamation', 'danger');
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
            Checkout Top Up Diamonds MLBB
          </h3>
          <p className="modal-desc roblox-modal-desc">
            Isi nominal Diamonds, masukkan User ID &amp; Zone ID dengan benar, lalu selesaikan pembayaran untuk proses masuk instant ke akun Anda.
          </p>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmitOrder} className="steam-modal-body roblox-modal-body">
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

          {/* 2. Input User ID dan Zone ID */}
          <div className="roblox-username-card mlbb-id-card">
            <div className="roblox-username-header">
              <label className="roblox-form-label" htmlFor="mlInputUserId">
                <i className="fa-solid fa-id-card text-cyan"></i>
                <strong>2. Masukkan User ID dan Zone ID dengan benar:</strong>
              </label>
              {cleanUserId && cleanZoneId && (
                <span className="roblox-verified-badge">
                  <i className="fa-solid fa-circle-check"></i> {formattedGameId}
                </span>
              )}
            </div>

            <div className="mlbb-id-input-row">
              <div className="mlbb-id-field-col mlbb-userid-col">
                <label className="roblox-input-label" htmlFor="mlInputUserId">
                  User ID
                </label>
                <input
                  id="mlInputUserId"
                  type="text"
                  inputMode="numeric"
                  className={`form-control roblox-input ${cleanUserId.length >= 4 ? 'is-valid' : ''}`}
                  placeholder="1268190411"
                  value={mlUserId}
                  onChange={(e) => handleUserIdInput(e.target.value)}
                  required
                />
              </div>

              <div className="mlbb-id-field-col mlbb-zoneid-col">
                <label className="roblox-input-label" htmlFor="mlInputZoneId">
                  Zone ID (Server)
                </label>
                <div className="mlbb-zone-input-wrap">
                  <span className="mlbb-zone-paren">(</span>
                  <input
                    id="mlInputZoneId"
                    type="text"
                    inputMode="numeric"
                    className={`form-control roblox-input mlbb-zone-input ${cleanZoneId.length >= 2 ? 'is-valid' : ''}`}
                    placeholder="15148"
                    value={mlZoneId}
                    onChange={(e) => handleZoneIdInput(e.target.value)}
                    required
                  />
                  <span className="mlbb-zone-paren">)</span>
                </div>
              </div>
            </div>

            <div className="roblox-field-helper">
              <i className="fa-solid fa-circle-info text-cyan"></i>
              <span>
                Contoh: <strong>1268190411 (15148)</strong>. Untuk mengecek User ID, klik foto profil di pojok kiri atas lobby Mobile Legends.
              </span>
            </div>
          </div>

          {/* 3. Data Pemesan */}
          <div className="roblox-section-group roblox-buyer-details">
            <label className="roblox-form-label-header">
              <i className="fa-solid fa-address-card text-cyan"></i> <strong>Data Pemesan:</strong>
            </label>

            <div className="roblox-form-grid-2">
              <div>
                <label className="roblox-input-label" htmlFor="mlBuyerName">Nama Lengkap:</label>
                <input
                  id="mlBuyerName"
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
                  <label className="roblox-input-label" htmlFor="mlBuyerWa">
                    No. WhatsApp / HP:
                  </label>
                  {!buyerWa.trim() && (
                    <span className="roblox-required-hint">*Jangan lupa isi</span>
                  )}
                </div>
                <input
                  id="mlBuyerWa"
                  type="tel"
                  className={`form-control roblox-input ${!buyerWa.trim() ? 'border-warning' : ''}`}
                  placeholder="Contoh: 08123456789"
                  value={buyerWa}
                  onChange={(e) => setBuyerWa(e.target.value)}
                  required
                />
              </div>

              <div className="roblox-full-col">
                <label className="roblox-input-label" htmlFor="mlBuyerEmail">Email / Gmail:</label>
                <input
                  id="mlBuyerEmail"
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

          {/* 4. Pilih Metode Pembayaran */}
          <div className="roblox-section-group roblox-payment-section">
            <label className="roblox-form-label-header">
              <i className="fa-solid fa-wallet text-warning"></i> <strong>3. Pilih Metode Pembayaran yang di inginkan:</strong>
            </label>

            <div className="mlbb-method-grid">
              <button
                type="button"
                className={`roblox-method-card qris ${selectedMethod === 'qris' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('qris')}
              >
                <QrisLogo style={{ marginBottom: '6px' }} />
                <strong className="method-title">QRIS Gateway</strong>
                <small className="method-sub">Otomatis 24 Jam</small>
              </button>

              <button
                type="button"
                className={`roblox-method-card ${selectedMethod === 'gopay' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('gopay')}
              >
                <GopayLogo style={{ marginBottom: '6px' }} />
                <strong className="method-title">GoPay Instant</strong>
                <small className="method-sub">Verifikasi Kilat</small>
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

            {/* Detail Metode Pembayaran */}
            <div className="roblox-method-detail-box">
              {(selectedMethod === 'qris' || selectedMethod === 'gopay') && (
                <div className="mlbb-gateway-notice">
                  <i className="fa-solid fa-bolt text-warning"></i>
                  <div>
                    <strong>Pembayaran Otomatis 24 Jam ({selectedMethod === 'gopay' ? 'GoPay' : 'QRIS All Payment'})</strong>
                    <p>
                      Setelah klik tombol di bawah, Anda akan diarahkan ke halaman QRIS Gateway resmi untuk menyelesaikan pembayaran <strong>{formatRupiah(totalPrice)}</strong> dan Diamond langsung diproses.
                    </p>
                  </div>
                </div>
              )}

              {selectedMethod === 'ewallet' && (
                <div>
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

                  <div className="mlbb-proof-upload-row">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleProofChange}
                    />
                    {uploadedProof ? (
                      <div className="mlbb-proof-preview">
                        <span><i className="fa-solid fa-circle-check text-emerald"></i> {uploadedProof.name}</span>
                        <button type="button" className="btn btn-outline btn-sm" onClick={handleRemoveProof}>
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm roblox-btn-copy"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <i className="fa-solid fa-cloud-arrow-up"></i> Upload Bukti Transfer (Opsional)
                      </button>
                    )}
                  </div>
                </div>
              )}

              {selectedMethod === 'bank' && (
                <div>
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

                  <div className="mlbb-proof-upload-row">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleProofChange}
                    />
                    {uploadedProof ? (
                      <div className="mlbb-proof-preview">
                        <span><i className="fa-solid fa-circle-check text-emerald"></i> {uploadedProof.name}</span>
                        <button type="button" className="btn btn-outline btn-sm" onClick={handleRemoveProof}>
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm roblox-btn-copy"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <i className="fa-solid fa-cloud-arrow-up"></i> Upload Bukti Transfer (Opsional)
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5. Ringkasan Pesanan */}
          <div className="roblox-order-summary-box">
            <div className="summary-row">
              <span className="summary-label">Item Pesanan:</span>
              <strong className="summary-val">Mobile Legends {currentPkg.name} ({currentPkg.breakdown})</strong>
            </div>
            <div className="summary-row">
              <span className="summary-label">Tujuan User ID (Zone ID):</span>
              <strong className="summary-val text-cyan">{formattedGameId}</strong>
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

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary roblox-modal-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Memproses Pesanan Diamonds...</span>
              </>
            ) : (
              <>
                <i className={selectedMethod === 'qris' || selectedMethod === 'gopay' ? 'fa-solid fa-bolt' : 'fa-solid fa-gem'}></i>
                <span>
                  {selectedMethod === 'qris' || selectedMethod === 'gopay'
                    ? `Lanjut Bayar Sekarang (${formatRupiah(totalPrice)})`
                    : `Konfirmasi & Beli Sekarang (${formatRupiah(totalPrice)})`}
                </span>
                <i className="fa-solid fa-arrow-right"></i>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
