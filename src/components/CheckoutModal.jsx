import React, { useState, useRef } from 'react';
import { CONFIG, PAYMENT_INFO } from '../data/config';
import {
  formatRupiah,
  copyToClipboard,
  uploadProofImage,
  copyImageBlobToClipboard
} from '../utils/format';

export default function CheckoutModal({
  isOpen,
  onClose,
  items,
  source,
  onOrderSuccess,
  onShowToast
}) {
  const [buyerName, setBuyerName] = useState('');
  const [buyerWa, setBuyerWa] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [capcutAccount, setCapcutAccount] = useState('');

  const [selectedMethod, setSelectedMethod] = useState(null); // 'qris' | 'ewallet' | 'bank'
  const [uploadedProof, setUploadedProof] = useState(null); // { file, name, size, dataUrl, uploadedUrl, uploadPromise }
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const totalAmount = items.reduce((acc, curr) => acc + (curr.total || curr.price || 0), 0);

  const hasCapcutOwnAccount = items.some((item) => {
    const nameMatch = (item.name || '').toLowerCase().includes('capcut');
    const durMatch =
      (item.duration || '').toLowerCase().includes('akun sendiri') ||
      (item.via || '').toLowerCase().includes('akun sendiri');
    return nameMatch && durMatch;
  });

  const handleMethodSelect = (methodKey) => {
    setSelectedMethod(methodKey);
  };

  const handleCopyRekening = async (number, label) => {
    const success = await copyToClipboard(number);
    if (success) {
      onShowToast(`Nomor ${label} (${number}) berhasil disalin!`, 'fa-copy');
    }
  };

  const handleDownloadQris = (e) => {
    e.preventDefault();
    fetch('/Qris.png')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'QRIS-ChaizStore.png';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        onShowToast('Foto QRIS berhasil di-download!', 'fa-circle-check');
      })
      .catch(() => {
        const a = document.createElement('a');
        a.href = '/Qris.png';
        a.download = 'QRIS-ChaizStore.png';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        onShowToast('Foto QRIS sedang di-download...', 'fa-circle-check');
      });
  };

  const handleProofChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast('Harap pilih file foto bukti transfer (JPG / PNG / WEBP)', 'fa-triangle-exclamation');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const sizeKb = (file.size / 1024).toFixed(1);
      const proofObj = {
        file: file,
        name: file.name,
        size: `${sizeKb} KB`,
        dataUrl: evt.target.result,
        uploadedUrl: null,
        uploadPromise: null
      };

      // Background upload for direct photo link in WA
      proofObj.uploadPromise = uploadProofImage(file).then((url) => {
        proofObj.uploadedUrl = url;
        return url;
      });

      setUploadedProof(proofObj);
      onShowToast('Bukti pembayaran berhasil di-upload! Silakan klik tombol Order.', 'fa-circle-check');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProof = (e) => {
    e.stopPropagation();
    setUploadedProof(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onShowToast('Foto bukti pembayaran dihapus', 'fa-trash-can');
  };

  const handleSubmitOrder = async () => {
    if (!selectedMethod) {
      onShowToast('Silakan klik salah satu metode pembayaran terlebih dahulu!', 'fa-triangle-exclamation');
      return;
    }

    if (!uploadedProof) {
      onShowToast('Harap upload foto bukti transfer terlebih dahulu!', 'fa-triangle-exclamation');
      return;
    }

    const name = buyerName.trim();
    const wa = buyerWa.trim();
    const email = buyerEmail.trim() || '-';

    if (!name) {
      onShowToast('Silakan masukkan Nama Lengkap Anda', 'fa-triangle-exclamation');
      return;
    }

    if (!wa) {
      onShowToast('Silakan masukkan No. WhatsApp Anda', 'fa-triangle-exclamation');
      return;
    }

    if (hasCapcutOwnAccount && !capcutAccount.trim()) {
      onShowToast('Nama Akun CapCut wajib diisi untuk paket Akun Sendiri!', 'fa-triangle-exclamation');
      return;
    }

    setIsSubmitting(true);

    // 1. Get uploaded photo URL
    let photoUrl = uploadedProof.uploadedUrl || null;
    if (!photoUrl && uploadedProof.uploadPromise) {
      try {
        photoUrl = await uploadedProof.uploadPromise;
      } catch {
        photoUrl = null;
      }
    } else if (!photoUrl && uploadedProof.file) {
      try {
        photoUrl = await uploadProofImage(uploadedProof.file);
      } catch {
        photoUrl = null;
      }
    }

    // 2. Copy image blob to clipboard on desktop
    let isCopiedToClipboard = false;
    if (uploadedProof && uploadedProof.file) {
      try {
        isCopiedToClipboard = await copyImageBlobToClipboard(uploadedProof.file);
      } catch {
        isCopiedToClipboard = false;
      }
    }

    let methodTitle = 'QRIS Instant';
    if (selectedMethod === 'ewallet') {
      methodTitle = 'E-Wallet (081809730331)';
    } else if (selectedMethod === 'bank') {
      methodTitle = 'Bank Muamalat (1410043224)';
    }

    const itemsText = items
      .map((item, idx) => {
        return `• Item ${idx + 1}: *${item.name}*\n  - Tipe/Durasi: ${item.duration} (${item.via})\n  - Harga Satuan: ${formatRupiah(item.price)}\n  - Jumlah: ${item.qty}x\n  - Subtotal: ${formatRupiah(item.total)}`;
      })
      .join('\n\n');

    let buktiPembayaranText = '';
    if (photoUrl) {
      buktiPembayaranText = `📸 *FOTO BUKTI PEMBAYARAN:*
• Status: Lunas & Terverifikasi
• Masa Aktif Link Foto: 2 Hari (48 Jam)
• Link Foto Bukti Transfer:
${photoUrl}
_(Silakan klik link foto di atas untuk langsung membuka gambar bukti transfer sah)_`;
    } else {
      buktiPembayaranText = `📸 *BUKTI PEMBAYARAN:*
• Status: Foto bukti telah di-upload (${uploadedProof.name} - ${uploadedProof.size})
• Gambar bukti transfer terlampir pada chat WhatsApp ini.`;
    }

    let capcutAccountLine = '';
    if (hasCapcutOwnAccount && capcutAccount.trim()) {
      capcutAccountLine = `\n• Nama Akun CapCut: ${capcutAccount.trim()}`;
    }

    const message = `Halo Admin *${CONFIG.storeName}*, saya ingin konfirmasi checkout pesanan akun:

━━━━━━━━━━━━━━━━━━━━━
📦 *RINCIAN ITEM:*
${itemsText}
━━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL HARGA:* ${formatRupiah(totalAmount)}
💳 *METODE PEMBAYARAN:* ${methodTitle}
━━━━━━━━━━━━━━━━━━━━━
👤 *DATA PEMBELI:*
• Nama: ${name}
• No. WhatsApp: ${wa}
• Email Akun: ${email}${capcutAccountLine}
━━━━━━━━━━━━━━━━━━━━━
${buktiPembayaranText}
━━━━━━━━━━━━━━━━━━━━━

Mohon segera diproses dan dikirimkan akunnya ya admin, terima kasih!`;

    const waUrl = `https://wa.me/${CONFIG.adminWhatsApp}?text=${encodeURIComponent(message)}`;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = waUrl;
    } else {
      window.open(waUrl, '_blank');
    }

    setIsSubmitting(false);
    onOrderSuccess(source);
    onClose();

    if (photoUrl) {
      onShowToast('Link foto bukti transfer & rincian pesanan berhasil masuk ke WhatsApp!', 'fa-circle-check');
    } else if (isCopiedToClipboard) {
      onShowToast('Foto bukti transfer tersalin di clipboard! Tekan Ctrl+V di chat WhatsApp.', 'fa-circle-check');
    } else {
      onShowToast('Pesanan dialihkan ke WhatsApp! Silakan kirimkan foto bukti transfer Anda di chat.', 'fa-circle-check');
    }
  };

  return (
    <div
      className="modal-overlay active"
      id="checkoutModal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box checkout-modal-box">
        <button className="modal-close-btn" onClick={onClose} aria-label="Tutup">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="modal-header">
          <div className="modal-product-icon checkout-header-icon">
            <i className="fa-solid fa-cash-register"></i>
          </div>
          <div>
            <span className="modal-tag">Checkout Pesanan</span>
            <h3>Rincian & Pembayaran Akun</h3>
          </div>
        </div>

        <div className="modal-body checkout-modal-body">
          {/* 1. Detail Item Pesanan */}
          <div className="checkout-section">
            <h4 className="checkout-section-title">
              <i className="fa-solid fa-list-check text-primary"></i> Detail Item Pesanan
            </h4>
            <div className="checkout-items-table-wrapper">
              <table className="checkout-items-table">
                <thead>
                  <tr>
                    <th>Jenis Item</th>
                    <th>Harga</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className="checkout-item-title">{item.name}</span>
                        <span className="checkout-item-badge">
                          {item.duration} &bull; {item.via}
                        </span>
                      </td>
                      <td>{formatRupiah(item.price)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.qty}x</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#34d399' }}>
                        {formatRupiah(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="checkout-grand-total">
              <span>Total Tagihan:</span>
              <strong>{formatRupiah(totalAmount)}</strong>
            </div>
          </div>

          {/* 2. Data Pemesan */}
          <div className="checkout-section">
            <h4 className="checkout-section-title">
              <i className="fa-solid fa-user-check text-cyan"></i> Data Pemesan
            </h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="checkoutBuyerName">
                  <i className="fa-solid fa-user"></i> Nama Lengkap:
                </label>
                <input
                  type="text"
                  id="checkoutBuyerName"
                  className="form-input"
                  placeholder="Nama Anda"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="checkoutBuyerWa">
                  <i className="fa-brands fa-whatsapp"></i> No. WhatsApp:
                </label>
                <input
                  type="tel"
                  id="checkoutBuyerWa"
                  className="form-input"
                  placeholder="08xxxxxxxxxx"
                  value={buyerWa}
                  onChange={(e) => setBuyerWa(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="checkoutBuyerEmail">
                <i className="fa-solid fa-envelope"></i> Email Akun (Wajib jika pilih invite):
              </label>
              <input
                type="email"
                id="checkoutBuyerEmail"
                className="form-input"
                placeholder="emailkamu@gmail.com"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
              />
            </div>

            {/* Special CapCut Field */}
            {hasCapcutOwnAccount && (
              <div
                className="form-group"
                style={{ marginTop: 14, marginBottom: 0 }}
              >
                <label
                  className="form-label"
                  htmlFor="checkoutCapcutAccount"
                  style={{ color: '#14b8a6', fontWeight: 700 }}
                >
                  <i className="fa-solid fa-scissors text-teal"></i> Nama Akun CapCut{' '}
                  <span style={{ color: '#f43f5e' }}>*Wajib Diisi</span>:
                </label>
                <input
                  type="text"
                  id="checkoutCapcutAccount"
                  className="form-input"
                  placeholder="Masukkan ID / Nama Akun CapCut kamu..."
                  style={{ borderColor: 'rgba(20, 184, 166, 0.45)' }}
                  value={capcutAccount}
                  onChange={(e) => setCapcutAccount(e.target.value)}
                  required
                />
                <small style={{ display: 'block', color: '#94a3b8', fontSize: '0.76rem', marginTop: 5 }}>
                  <i className="fa-solid fa-circle-info text-teal"></i> Diperlukan untuk proses upgrade VIP langsung ke akun CapCut pribadi Anda.
                </small>
              </div>
            )}
          </div>

          {/* 3. Metode Pembayaran */}
          <div className="checkout-section">
            <h4 className="checkout-section-title">
              <i className="fa-solid fa-wallet text-warning"></i> Metode Pembayaran
            </h4>
            <p className="checkout-section-desc">Pilih salah satu metode pembayaran di bawah ini:</p>
            <div className="checkout-methods-grid">
              {/* QRIS */}
              <label
                className={`checkout-method-card ${selectedMethod === 'qris' ? 'active' : ''}`}
                onClick={() => handleMethodSelect('qris')}
              >
                <input
                  type="radio"
                  name="checkoutPaymentRadio"
                  checked={selectedMethod === 'qris'}
                  onChange={() => handleMethodSelect('qris')}
                />
                <div className="method-icon-box"><i className="fa-solid fa-qrcode"></i></div>
                <div className="method-details">
                  <strong>QRIS Instant</strong>
                  <small>Semua Bank & E-Wallet</small>
                </div>
                <i className="fa-solid fa-circle-check method-check"></i>
              </label>

              {/* E-Wallet */}
              <label
                className={`checkout-method-card ${selectedMethod === 'ewallet' ? 'active' : ''}`}
                onClick={() => handleMethodSelect('ewallet')}
              >
                <input
                  type="radio"
                  name="checkoutPaymentRadio"
                  checked={selectedMethod === 'ewallet'}
                  onChange={() => handleMethodSelect('ewallet')}
                />
                <div className="method-icon-box"><i className="fa-solid fa-mobile-screen-button"></i></div>
                <div className="method-details">
                  <strong>E-Wallet</strong>
                  <small>081809730331</small>
                </div>
                <i className="fa-solid fa-circle-check method-check"></i>
              </label>

              {/* Bank */}
              <label
                className={`checkout-method-card ${selectedMethod === 'bank' ? 'active' : ''}`}
                onClick={() => handleMethodSelect('bank')}
              >
                <input
                  type="radio"
                  name="checkoutPaymentRadio"
                  checked={selectedMethod === 'bank'}
                  onChange={() => handleMethodSelect('bank')}
                />
                <div className="method-icon-box"><i className="fa-solid fa-building-columns"></i></div>
                <div className="method-details">
                  <strong>Bank Transfer</strong>
                  <small>Bank Muamalat</small>
                </div>
                <i className="fa-solid fa-circle-check method-check"></i>
              </label>
            </div>

            {/* Prompt before selection */}
            {!selectedMethod && (
              <div className="method-select-prompt">
                <i className="fa-solid fa-hand-pointer text-warning"></i>
                <span>
                  Pilih salah satu metode di atas (<strong>QRIS</strong>, <strong>E-Wallet</strong>, atau <strong>Bank</strong>) untuk memunculkan kode QRIS & detail pembayaran.
                </span>
              </div>
            )}

            {/* Display QRIS and payment details once selected */}
            {selectedMethod && (
              <div className="qris-payment-container">
                <div className="qris-image-wrapper">
                  <div className="qris-badge-top">
                    <i className="fa-solid fa-bolt text-warning"></i> SCAN QRIS UNTUK BAYAR
                  </div>
                  <img src="/Qris.png" alt="QRIS ChaizStore" className="qris-display-img" />
                  <span className="qris-footer-text">NMID: ID1020038472910 &bull; CHAIZSTORE</span>
                </div>

                <button
                  type="button"
                  className="btn-download-qris"
                  onClick={handleDownloadQris}
                  title="Download Foto QRIS"
                >
                  <i className="fa-solid fa-cloud-arrow-down"></i>
                  <span>Download QRIS</span>
                </button>

                <div className="method-info-box">
                  {selectedMethod === 'qris' && (
                    <>
                      <div className="payment-guide-badge">
                        <i className="fa-solid fa-circle-check"></i> {PAYMENT_INFO.qris.badge}
                      </div>
                      <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: 6, lineHeight: 1.5 }}>
                        {PAYMENT_INFO.qris.desc}
                      </p>
                    </>
                  )}

                  {selectedMethod === 'ewallet' && (
                    <>
                      <div className="payment-guide-badge">
                        <i className="fa-solid fa-mobile-screen-button"></i> {PAYMENT_INFO.ewallet.badge}
                      </div>
                      <div className="rekening-list">
                        <div className="rekening-item">
                          <div>
                            <div className="rekening-name">
                              {PAYMENT_INFO.ewallet.account.label} ({PAYMENT_INFO.ewallet.account.owner})
                            </div>
                            <div className="rekening-num">{PAYMENT_INFO.ewallet.account.number}</div>
                          </div>
                          <button
                            type="button"
                            className="btn-copy-rek"
                            onClick={() => handleCopyRekening(PAYMENT_INFO.ewallet.account.number, 'E-Wallet')}
                          >
                            <i className="fa-regular fa-copy"></i> Salin
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedMethod === 'bank' && (
                    <>
                      <div className="payment-guide-badge">
                        <i className="fa-solid fa-building-columns"></i> {PAYMENT_INFO.bank.badge}
                      </div>
                      <div className="rekening-list">
                        <div className="rekening-item">
                          <div>
                            <div className="rekening-name">
                              {PAYMENT_INFO.bank.account.label} ({PAYMENT_INFO.bank.account.owner})
                            </div>
                            <div className="rekening-num">{PAYMENT_INFO.bank.account.number}</div>
                          </div>
                          <button
                            type="button"
                            className="btn-copy-rek"
                            onClick={() => handleCopyRekening(PAYMENT_INFO.bank.account.number, 'Bank Muamalat')}
                          >
                            <i className="fa-regular fa-copy"></i> Salin
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. Upload Bukti Pembayaran */}
          <div className="checkout-section">
            <h4 className="checkout-section-title">
              <i className="fa-solid fa-file-invoice text-success"></i> Upload Bukti Pembayaran
            </h4>
            <p className="checkout-section-desc">
              Setelah melakukan pembayaran, upload bukti transfer / tangkapan layar (screenshot):
            </p>

            <div
              className="upload-dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleProofChange}
              />

              {!uploadedProof ? (
                <div className="dropzone-content">
                  <div className="dropzone-icon">
                    <i className="fa-solid fa-cloud-arrow-up"></i>
                  </div>
                  <strong>Klik untuk Upload Bukti Pembayaran</strong>
                  <span>Pilih foto screenshot transfer (JPG, PNG, JPEG, WEBP)</span>
                </div>
              ) : (
                <div className="upload-preview-wrapper">
                  <div className="preview-img-container">
                    <img src={uploadedProof.dataUrl} alt="Bukti Transfer" />
                  </div>
                  <div className="preview-meta">
                    <div className="preview-status">
                      <i className="fa-solid fa-circle-check"></i> Bukti Transfer Terpasang
                    </div>
                    <span className="preview-filename">{uploadedProof.name}</span>
                    <span className="preview-filesize">{uploadedProof.size}</span>
                    <button
                      type="button"
                      className="btn-remove-proof"
                      onClick={handleRemoveProof}
                    >
                      <i className="fa-solid fa-trash-can"></i> Hapus / Ganti Foto
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!uploadedProof && (
              <div className="proof-warning-notice">
                <i className="fa-solid fa-lock"></i>
                <span>
                  Tombol order akan otomatis muncul setelah Anda mengupload foto bukti transfer di atas.
                </span>
              </div>
            )}
          </div>

          {/* 5. Submit Order Button */}
          {uploadedProof && (
            <div className="checkout-order-actions">
              <button
                type="button"
                className="btn btn-wa-order"
                disabled={isSubmitting}
                onClick={handleSubmitOrder}
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>{' '}
                    <span>Menyiapkan Foto & WhatsApp...</span>
                  </>
                ) : (
                  <>
                    <span>Order</span> <i className="fa-solid fa-arrow-right"></i>
                  </>
                )}
              </button>
            </div>
          )}

          <p className="order-guarantee-text">
            <i className="fa-solid fa-shield-check text-success"></i> Transaksi Anda 100% aman & bergaransi penuh. Akun dikirim kilat 1-5 menit.
          </p>
        </div>
      </div>
    </div>
  );
}
