import React, { useState, useEffect, useRef } from 'react';
import { formatRupiah, copyToClipboard, compressImageFile } from '../utils/format';
import { PAYMENT_INFO } from '../data/config';
import { createTransaction } from '../utils/transactions';

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
  initialKeyId = 'original'
}) {
  const [selectedKeyId, setSelectedKeyId] = useState(initialKeyId);
  const [quantity, setQuantity] = useState(1);
  const [buyerUsername, setBuyerUsername] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerWa, setBuyerWa] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('qris');
  const [uploadedProof, setUploadedProof] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // Auto-fill dari akun login & reset saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      if (initialKeyId) setSelectedKeyId(initialKeyId);
      setQuantity(1);
      setSelectedMethod('qris');
      setUploadedProof(null);

      if (authUser) {
        setBuyerUsername(authUser.username || authUser.name?.toLowerCase().replace(/\s+/g, '_') || '');
        setBuyerName(authUser.name || '');
        setBuyerEmail(authUser.email || '');
        setBuyerWa(authUser.phone || '');
      } else {
        setBuyerUsername('');
        setBuyerName('');
        setBuyerEmail('');
        setBuyerWa('');
      }
    }
  }, [isOpen, initialKeyId, authUser]);

  if (!isOpen) return null;

  const currentKey =
    STEAM_KEY_PACKAGES.find((k) => k.id === selectedKeyId) ||
    STEAM_KEY_PACKAGES[0];

  const totalPrice = currentKey.price * quantity;

  const handleCopyRekening = async (number, label) => {
    const success = await copyToClipboard(number);
    if (success) {
      onShowToast?.(`Nomor ${label} (${number}) berhasil disalin!`, 'fa-copy text-success');
    }
  };

  const handleDownloadQris = (e) => {
    e.preventDefault();
    fetch('/Qris.png')
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'QRIS-ChaizStore.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        onShowToast?.('Foto QRIS sedang di-download...', 'fa-circle-check');
      })
      .catch(() => {
        window.open('/Qris.png', '_blank');
      });
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

    // 1. Cek status banned
    if (isBanned) {
      onOpenBannedModal?.();
      onShowToast?.('Akses Ditolak: Akun Anda sedang di-banned!', 'fa-ban text-danger');
      return;
    }

    // 2. Cek apakah sudah login
    if (!authUser) {
      onOpenLogin?.();
      onShowToast?.('Silakan login terlebih dahulu untuk melakukan pembelian Steam Key!', 'fa-right-to-bracket text-warning');
      return;
    }

    // 3. Validasi form
    const username = buyerUsername.trim();
    const name = buyerName.trim();
    const email = buyerEmail.trim();
    const wa = buyerWa.trim();

    if (!name) {
      onShowToast?.('Silakan masukkan Nama Lengkap Anda!', 'fa-triangle-exclamation');
      return;
    }
    if (!email) {
      onShowToast?.('Silakan masukkan Email / Gmail Anda untuk pengiriman kode!', 'fa-triangle-exclamation');
      return;
    }
    if (!wa) {
      onShowToast?.('Silakan masukkan Nomor WhatsApp Anda!', 'fa-triangle-exclamation');
      return;
    }

    if (!selectedMethod) {
      onShowToast?.('Silakan pilih salah satu metode pembayaran!', 'fa-triangle-exclamation');
      return;
    }

    setIsSubmitting(true);

    const paymentName =
      PAYMENT_INFO[selectedMethod]?.name ||
      (selectedMethod === 'qris'
        ? 'QRIS Instant'
        : selectedMethod === 'ewallet'
        ? 'E-Wallet (DANA/OVO/GoPay)'
        : 'Transfer Bank Muamalat');

    let orderMessage = `*ORDER STEAM KEY RESMI - CHAIZSTORE*\n\n`;
    orderMessage += `🎮 *Paket Key:* ${currentKey.name}\n`;
    orderMessage += `🔢 *Jumlah:* ${quantity} Key\n`;
    orderMessage += `💵 *Harga Satuan:* ${formatRupiah(currentKey.price)}\n`;
    orderMessage += `💰 *TOTAL BAYAR:* *${formatRupiah(totalPrice)}*\n\n`;

    orderMessage += `👤 *Data Pengiriman:*\n`;
    if (username) orderMessage += `• Username Steam / ID: ${username}\n`;
    orderMessage += `• Nama: ${name}\n`;
    orderMessage += `• Email/Gmail: ${email}\n`;
    orderMessage += `• No. WhatsApp: ${wa}\n`;
    orderMessage += `• Metode Bayar: ${paymentName}\n`;

    if (uploadedProof?.uploadedUrl) {
      orderMessage += `📸 *Bukti Bayar:* ${uploadedProof.uploadedUrl}\n`;
    }

    const proofImg = uploadedProof?.dataUrl || uploadedProof?.uploadedUrl || null;

    // Simpan otomatis ke sistem Transaksi Pelanggan & Admin secara lokal
    try {
      createTransaction({
        productId: 'steam-' + currentKey.id,
        productName: `Steam Key (${currentKey.name})`,
        productDuration: `${quantity} Key`,
        productCategory: 'Steam Key',
        price: currentKey.price,
        qty: quantity,
        total: totalPrice,
        customerUsername: username,
        customerName: name,
        customerEmail: email,
        customerPhone: wa,
        paymentMethod: paymentName,
        proofUrl: proofImg,
        proofFileName: uploadedProof?.name || (proofImg ? 'Bukti_Steam_Key.png' : null),
        proofSize: uploadedProof?.size || null,
        warrantyPeriod: 'Garansi Resmi Valve 100% Valid'
      });
    } catch (err) {}

    setIsSubmitting(false);
    onClose();
    onShowToast?.(
      '🎉 Pesanan Steam Key berhasil dikirim ke Admin! Anda dapat memantau statusnya di menu Transaksi.',
      'fa-circle-check text-success'
    );
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

        <form onSubmit={handleSubmitOrder} className="steam-modal-form">
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
                    <div className="steam-pkg-top">
                      <span className={`badge-status ${pkg.badgeClass}`}>{pkg.badge}</span>
                      {isSelected && (
                        <span className="steam-pkg-check">
                          <i className="fa-solid fa-circle-check"></i>
                        </span>
                      )}
                    </div>
                    <div className="steam-pkg-name">{pkg.name}</div>
                    <div className="steam-pkg-desc">{pkg.desc}</div>
                    <div className="steam-pkg-price">
                      <strong>{formatRupiah(pkg.price)}</strong>
                      <span>/ {pkg.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Pengatur Jumlah Key */}
          <div className="steam-form-section">
            <div className="steam-qty-row">
              <label className="steam-section-title" style={{ margin: 0 }}>
                <i className="fa-solid fa-layer-group text-cyan"></i> 2. Jumlah Key:
              </label>
              <div className="steam-qty-control">
                <button
                  type="button"
                  className="steam-qty-btn"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                >
                  <i className="fa-solid fa-minus"></i>
                </button>
                <span className="steam-qty-value">{quantity} Key</span>
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
              <span>Total Harga:</span>
              <strong className="steam-total-price">{formatRupiah(totalPrice)}</strong>
            </div>
          </div>

          {/* 3. Form Data Pembeli (Lurus ke bawah, rapi, bersih) */}
          <div className="steam-form-section">
            <label className="steam-section-title">
              <i className="fa-solid fa-id-card text-emerald"></i> 3. Data Pengiriman:
            </label>

            <div className="clean-vertical-form">
              {/* 1. Username Steam */}
              <div className="clean-field-group">
                <label htmlFor="steamBuyerUsername" className="clean-field-label">
                  <i className="fa-brands fa-steam text-cyan"></i>
                  <span>Username Steam / ID</span>
                  <span className="clean-field-badge badge-opt">Opsional</span>
                </label>
                <div className="clean-input-wrapper">
                  <i className="fa-solid fa-at clean-input-lead-icon text-cyan"></i>
                  <input
                    type="text"
                    id="steamBuyerUsername"
                    className="clean-field-control"
                    placeholder="Masukkan Username Steam atau SteamID..."
                    value={buyerUsername}
                    onChange={(e) => setBuyerUsername(e.target.value)}
                  />
                </div>
              </div>

              {/* 2. Nama Lengkap */}
              <div className="clean-field-group">
                <label htmlFor="steamBuyerName" className="clean-field-label">
                  <i className="fa-solid fa-user text-emerald"></i>
                  <span>Nama Lengkap</span>
                  <span className="clean-field-badge badge-req">*Wajib</span>
                </label>
                <div className="clean-input-wrapper">
                  <i className="fa-solid fa-user clean-input-lead-icon text-emerald"></i>
                  <input
                    type="text"
                    id="steamBuyerName"
                    required
                    className="clean-field-control"
                    placeholder="Contoh: Andi Pratama"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                  />
                </div>
              </div>

              {/* 3. Email / Gmail */}
              <div className="clean-field-group">
                <label htmlFor="steamBuyerEmail" className="clean-field-label">
                  <i className="fa-brands fa-google text-amber"></i>
                  <span>Email / Gmail</span>
                  <span className="clean-field-badge badge-req">*Wajib</span>
                </label>
                <div className="clean-input-wrapper">
                  <i className="fa-solid fa-envelope clean-input-lead-icon text-amber"></i>
                  <input
                    type="email"
                    id="steamBuyerEmail"
                    required
                    className="clean-field-control"
                    placeholder="Contoh: emailkamu@gmail.com"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* 4. Nomor WhatsApp */}
              <div className="clean-field-group">
                <label htmlFor="steamBuyerWa" className="clean-field-label">
                  <i className="fa-brands fa-whatsapp text-success"></i>
                  <span>Nomor WhatsApp</span>
                  <span className="clean-field-badge badge-req">*Wajib</span>
                </label>
                <div className="clean-input-wrapper">
                  <i className="fa-brands fa-whatsapp clean-input-lead-icon text-success"></i>
                  <input
                    type="tel"
                    id="steamBuyerWa"
                    required
                    className="clean-field-control"
                    placeholder="Contoh: 081234567890"
                    value={buyerWa}
                    onChange={(e) => setBuyerWa(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Pilihan Metode Pembayaran (Sama persis seperti Akun Premium) */}
          <div className="steam-form-section">
            <label className="steam-section-title">
              <i className="fa-solid fa-wallet text-amber"></i> 4. Metode Pembayaran:
            </label>

            <div className="steam-payment-tabs">
              <button
                type="button"
                className={`steam-pay-tab ${selectedMethod === 'qris' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('qris')}
              >
                <i className="fa-solid fa-qrcode"></i> QRIS Instant
              </button>
              <button
                type="button"
                className={`steam-pay-tab ${selectedMethod === 'ewallet' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('ewallet')}
              >
                <i className="fa-solid fa-wallet"></i> E-Wallet
              </button>
              <button
                type="button"
                className={`steam-pay-tab ${selectedMethod === 'bank' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('bank')}
              >
                <i className="fa-solid fa-building-columns"></i> Transfer Bank
              </button>
            </div>

            {/* Konten Metode Pembayaran */}
            <div className="steam-payment-body">
              {selectedMethod === 'qris' && (
                <div className="steam-qris-box">
                  <div className="qris-img-wrap">
                    <img src="/Qris.png" alt="QRIS ChaizStore" className="qris-preview-img" />
                  </div>
                  <div className="qris-actions">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleDownloadQris}
                    >
                      <i className="fa-solid fa-download"></i> Download QRIS
                    </button>
                    <p className="qris-note">
                      Scan kode QRIS di atas menggunakan BCA, Mandiri, BRI, DANA, GoPay, OVO, ShopeePay, atau m-Banking Anda.
                    </p>
                  </div>
                </div>
              )}

              {selectedMethod === 'ewallet' && (
                <div className="steam-account-box">
                  <div className="account-row">
                    <div>
                      <span className="account-label">Nomor E-Wallet (DANA / GoPay / OVO / ShopeePay):</span>
                      <strong className="account-number">{PAYMENT_INFO.ewallet.account.number}</strong>
                      <span className="account-owner">{PAYMENT_INFO.ewallet.account.owner}</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleCopyRekening(PAYMENT_INFO.ewallet.account.number, 'E-Wallet')}
                    >
                      <i className="fa-solid fa-copy"></i> Salin
                    </button>
                  </div>
                </div>
              )}

              {selectedMethod === 'bank' && (
                <div className="steam-account-box">
                  <div className="account-row">
                    <div>
                      <span className="account-label">Rekening Bank Muamalat:</span>
                      <strong className="account-number">{PAYMENT_INFO.bank.account.number}</strong>
                      <span className="account-owner">{PAYMENT_INFO.bank.account.owner}</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleCopyRekening(PAYMENT_INFO.bank.account.number, 'Rekening')}
                    >
                      <i className="fa-solid fa-copy"></i> Salin
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Foto Bukti Transfer */}
              <div className="steam-proof-upload">
                <label className="proof-label">
                  <i className="fa-solid fa-cloud-arrow-up"></i> Upload Bukti Transfer (Opsional / Disarankan):
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleProofChange}
                  style={{ display: 'none' }}
                />

                {!uploadedProof ? (
                  <div
                    className="proof-dropzone"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    <i className="fa-solid fa-image"></i>
                    <span>Klik untuk upload struk / bukti transfer</span>
                    <small>Mendukung format JPG, PNG, atau WEBP</small>
                  </div>
                ) : (
                  <div className="proof-preview-card">
                    <img src={uploadedProof.dataUrl} alt="Bukti Transfer" className="proof-thumb" />
                    <div className="proof-info">
                      <span className="proof-name">{uploadedProof.name}</span>
                      <span className="proof-size">{uploadedProof.size}</span>
                    </div>
                    <button
                      type="button"
                      className="proof-remove-btn"
                      onClick={handleRemoveProof}
                      title="Hapus Bukti"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="steam-modal-actions">
            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg btn-steam-submit"
              disabled={isSubmitting}
            >
              <i className="fa-solid fa-paper-plane"></i> Kirim Pesanan Steam Key ke Admin
            </button>
            <button
              type="button"
              className="btn btn-outline btn-block"
              onClick={onClose}
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
