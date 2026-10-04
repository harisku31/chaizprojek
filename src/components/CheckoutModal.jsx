import React, { useState, useRef, useEffect } from 'react';
import { CONFIG, PAYMENT_INFO } from '../data/config';
import { VOUCHERS, findVoucher } from '../data/vouchers';
import {
  formatRupiah,
  copyToClipboard,
  compressImageFile,
  copyImageBlobToClipboard
} from '../utils/format';
import { createTransaction } from '../utils/transactions';

export default function CheckoutModal({
  isOpen,
  onClose,
  items,
  source,
  authUser,
  initialVoucher,
  onOrderSuccess,
  onShowToast
}) {
  const [buyerUsername, setBuyerUsername] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerWa, setBuyerWa] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [capcutAccount, setCapcutAccount] = useState('');

  // Voucher states
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [selectedBonusItem, setSelectedBonusItem] = useState('Canva Pro (1 Bulan)');

  // Reset voucher on modal open/close or pre-fill from initialVoucher
  useEffect(() => {
    if (!isOpen) {
      setVoucherCodeInput('');
      setAppliedVoucher(null);
      setSelectedBonusItem('Canva Pro (1 Bulan)');
      setSelectedMethod(null);
      setUploadedProof(null);
    } else if (initialVoucher) {
      setAppliedVoucher(initialVoucher);
      setVoucherCodeInput(initialVoucher.code);
    }
  }, [isOpen, initialVoucher]);

  // Auto-fill dari akun login (Google / Member / Chaiz)
  React.useEffect(() => {
    if (isOpen && authUser) {
      if (authUser.username && !buyerUsername) {
        setBuyerUsername(authUser.username);
      } else if (authUser.name && !buyerUsername) {
        setBuyerUsername(authUser.name.toLowerCase().replace(/\s+/g, '_'));
      }
      if (authUser.name && (!buyerName || buyerName === 'Chaiz')) {
        setBuyerName(authUser.name);
      }
      if (authUser.email && !buyerEmail) {
        setBuyerEmail(authUser.email);
      }
      if (authUser.phone && !buyerWa) {
        setBuyerWa(authUser.phone);
      }
    }
  }, [isOpen, authUser]);

  const [selectedMethod, setSelectedMethod] = useState(null); // 'qris' | 'ewallet' | 'bank'
  const [uploadedProof, setUploadedProof] = useState(null); // { file, name, size, dataUrl, uploadedUrl, uploadPromise }
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const totalAmount = items.reduce((acc, curr) => acc + (curr.total || curr.price || 0), 0);

  // Discount calculation
  let discountAmount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.type === 'discount') {
      discountAmount = Math.min(appliedVoucher.discountAmount, totalAmount);
    } else if (appliedVoucher.type === 'full_free') {
      discountAmount = totalAmount;
    }
  }
  const finalTotal = Math.max(0, totalAmount - discountAmount);

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

  const handleProofChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast('Harap pilih file foto bukti transfer (JPG / PNG / WEBP)', 'fa-triangle-exclamation');
      e.target.value = '';
      return;
    }

    try {
      const compressedDataUrl = await compressImageFile(file, 900, 1200, 0.72);
      const sizeKb = ((compressedDataUrl?.length || file.size) * 0.75 / 1024).toFixed(1);
      const proofObj = {
        file: file,
        name: file.name,
        size: `${sizeKb} KB (Tervalidasi)`,
        dataUrl: compressedDataUrl,
        uploadedUrl: compressedDataUrl,
        uploadPromise: Promise.resolve(compressedDataUrl)
      };

      setUploadedProof(proofObj);
      onShowToast('Bukti pembayaran berhasil di-upload! Silakan klik tombol Kirim Pesanan.', 'fa-circle-check');
    } catch {
      onShowToast('Gagal memproses foto bukti transfer', 'fa-triangle-exclamation');
    }
  };

  const handleRemoveProof = (e) => {
    e.stopPropagation();
    setUploadedProof(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onShowToast('Foto bukti pembayaran dihapus', 'fa-trash-can');
  };

  const handleApplyVoucher = (codeOverride) => {
    const raw = codeOverride || voucherCodeInput;
    if (!raw || !raw.trim()) {
      onShowToast('Silakan masukkan kode voucher / redeem code terlebih dahulu!', 'fa-triangle-exclamation');
      return;
    }
    const found = findVoucher(raw);
    if (!found) {
      onShowToast('Kode redeem tidak valid atau sudah kedaluwarsa', 'fa-circle-xmark');
      return;
    }
    setAppliedVoucher(found);
    setVoucherCodeInput(found.code);

    if (found.type === 'free_item' && (!selectedBonusItem || !found.bonusOptions.some((b) => b.name === selectedBonusItem))) {
      setSelectedBonusItem(found.bonusOptions[0].name);
    }

    if (found.type === 'full_free') {
      onShowToast('🎉 Kode Redeem VIP Valid! Tagihan Anda 100% Full Gratis (Rp 0)!', 'fa-crown');
    } else if (found.type === 'free_item') {
      onShowToast(`🎉 Kode Redeem Valid! Anda mendapatkan hadiah 1 akun premium gratis!`, 'fa-gift');
    } else {
      onShowToast(`✅ Kode Redeem Valid! Potongan ${formatRupiah(found.discountAmount)} berhasil diterapkan!`, 'fa-circle-check');
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCodeInput('');
    onShowToast('Kode voucher telah dihapus', 'fa-trash-can');
  };

  const handleSubmitOrder = async () => {
    if (finalTotal > 0 && !selectedMethod) {
      onShowToast('Silakan klik salah satu metode pembayaran terlebih dahulu!', 'fa-triangle-exclamation');
      return;
    }

    if (finalTotal > 0 && !uploadedProof) {
      onShowToast('Harap upload foto bukti transfer terlebih dahulu!', 'fa-triangle-exclamation');
      return;
    }

    const username = buyerUsername.trim();
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
    let photoUrl = uploadedProof ? uploadedProof.uploadedUrl || null : null;
    if (uploadedProof) {
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
    if (finalTotal === 0) {
      methodTitle = `Voucher Promo Bebas Biaya (100% Full Gratis - ${appliedVoucher ? appliedVoucher.code : 'GRATIS'})`;
    } else if (selectedMethod === 'ewallet') {
      methodTitle = 'E-Wallet (081809730331)';
    } else if (selectedMethod === 'bank') {
      methodTitle = 'Bank Muamalat (1410043224)';
    }

    const itemsText = items
      .map((item, idx) => {
        return `• Item ${idx + 1}: *${item.name}*\n  - Tipe/Durasi: ${item.duration} (${item.via})\n  - Harga Satuan: ${formatRupiah(item.price)}\n  - Jumlah: ${item.qty}x\n  - Subtotal: ${formatRupiah(item.total)}`;
      })
      .join('\n\n');

    let voucherSection = '';
    if (appliedVoucher) {
      if (appliedVoucher.type === 'discount') {
        voucherSection = `\n🎟️ *VOUCHER DIGUNAKAN:* ${appliedVoucher.code} (${appliedVoucher.name})\n🏷️ *POTONGAN DISKON:* -${formatRupiah(discountAmount)}`;
      } else if (appliedVoucher.type === 'full_free') {
        voucherSection = `\n🎟️ *VOUCHER DIGUNAKAN:* ${appliedVoucher.code} (Potongan 100% Full Gratis)\n🏷️ *POTONGAN DISKON:* -${formatRupiah(totalAmount)} (Rp 0 Bebas Biaya)`;
      } else if (appliedVoucher.type === 'free_item') {
        voucherSection = `\n🎟️ *VOUCHER DIGUNAKAN:* ${appliedVoucher.code} (${appliedVoucher.name})\n🎁 *BONUS ITEM GRATIS:* 1x ${selectedBonusItem} (Rp 0 - FREE)`;
      }
    }

    let totalHargaText = '';
    if (appliedVoucher) {
      totalHargaText = `💰 *SUBTOTAL:* ${formatRupiah(totalAmount)}${voucherSection}\n💵 *TOTAL HARGA TAGIHAN:* ${finalTotal === 0 ? 'Rp 0 (FULL GRATIS)' : formatRupiah(finalTotal)}`;
    } else {
      totalHargaText = `💰 *TOTAL HARGA:* ${formatRupiah(totalAmount)}`;
    }

    let buktiPembayaranText = '';
    if (photoUrl) {
      buktiPembayaranText = `📸 *FOTO BUKTI PEMBAYARAN:*
• Status: Lunas & Terverifikasi
• Masa Aktif Link Foto: 2 Hari (48 Jam)
• Link Foto Bukti Transfer:
${photoUrl}
_(Silakan klik link foto di atas untuk langsung membuka gambar bukti transfer sah)_`;
    } else if (uploadedProof) {
      buktiPembayaranText = `📸 *BUKTI PEMBAYARAN:*
• Status: Foto bukti telah di-upload (${uploadedProof.name} - ${uploadedProof.size})
• Gambar bukti transfer terlampir pada chat WhatsApp ini.`;
    } else if (finalTotal === 0) {
      buktiPembayaranText = `🎉 *STATUS PEMBAYARAN:*
• Status: LUNAS & KLAIM GRATIS 100% (Voucher ${appliedVoucher ? appliedVoucher.code : 'FULLGRATIS'})
• Total Transfer: Rp 0 (Bebas Biaya Transfer)`;
    }

    let capcutAccountLine = '';
    const proofImg = (uploadedProof ? uploadedProof.dataUrl : null) || photoUrl || null;

    // Simpan otomatis ke sistem Transaksi Pelanggan & Admin secara lokal
    try {
      items.forEach((item) => {
        createTransaction({
          productId: item.productId || null,
          productName: item.name,
          productDuration: item.duration || 'Reguler',
          productCategory: 'Akun Premium',
          price: item.price || 0,
          qty: item.qty || 1,
          total: item.total || item.price || 0,
          customerUsername: username,
          customerName: name,
          customerEmail: email,
          customerPhone: wa,
          paymentMethod: methodTitle,
          proofUrl: proofImg,
          proofFileName: uploadedProof?.name || (proofImg ? 'Bukti_Transfer.png' : null),
          proofSize: uploadedProof?.size || null,
          warrantyPeriod: `Garansi Full ${item.duration || 'Aktif'}`
        });
      });
    } catch (err) {}

    setIsSubmitting(false);
    onOrderSuccess(source);
    onClose();

    onShowToast('🎉 Pesanan berhasil dikirim ke Admin! Anda dapat memantau status pesanan di menu Transaksi.', 'fa-circle-check');
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
            {/* Voucher Diskon Section */}
            {/* Voucher / Redeem Code Section (Sistem Redeem Code Rahasia) */}
            <div className="checkout-voucher-container">
              <div className="checkout-voucher-header">
                <span className="checkout-voucher-title">
                  <i className="fa-solid fa-gift text-warning"></i> Kode Redeem / Voucher
                </span>
                <span className="checkout-voucher-hint">
                  Punya kode voucher promo khusus? Masukkan kode di bawah untuk klaim:
                </span>
              </div>

              <div className="checkout-voucher-input-group">
                <div className="voucher-input-relative">
                  <i className="fa-solid fa-key voucher-input-icon"></i>
                  <input
                    type="text"
                    className="form-input voucher-field-input"
                    placeholder="Masukkan kode voucher..."
                    value={voucherCodeInput}
                    onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
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
                    title="Batalkan voucher"
                  >
                    <i className="fa-solid fa-xmark"></i> Hapus
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-voucher-action btn-voucher-apply"
                    onClick={() => handleApplyVoucher()}
                  >
                    <i className="fa-solid fa-check"></i> Klaim
                  </button>
                )}
              </div>

              {/* Status Voucher Terpasang (Hanya muncul jika kode valid & berhasil di-klaim) */}
              {appliedVoucher && (
                <div className="checkout-voucher-active-notice">
                  <div className="active-voucher-left">
                    <span className="active-voucher-icon" style={{ backgroundColor: `${appliedVoucher.color}22`, color: appliedVoucher.color }}>
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
                    <i className="fa-solid fa-circle-check"></i> Berhasil Diklaim
                  </span>
                </div>
              )}

              {/* Opsi Pilihan Akun Hadiah Gratis (Untuk Voucher ke-4: Canva / YouTube) */}
              {appliedVoucher && appliedVoucher.type === 'free_item' && (
                <div className="checkout-bonus-picker">
                  <div className="bonus-picker-title">
                    <i className="fa-solid fa-gift text-cyan"></i> Pilih 1 Akun Premium Hadiah Anda:
                  </div>
                  <div className="bonus-picker-grid">
                    {appliedVoucher.bonusOptions.map((opt) => (
                      <label
                        key={opt.id}
                        className={`bonus-card ${selectedBonusItem === opt.name ? 'active' : ''}`}
                        onClick={() => setSelectedBonusItem(opt.name)}
                      >
                        <input
                          type="radio"
                          name="bonusOptionRadio"
                          checked={selectedBonusItem === opt.name}
                          onChange={() => setSelectedBonusItem(opt.name)}
                        />
                        <div className="bonus-card-icon">
                          <i className={opt.id === 'canva' ? 'fa-solid fa-palette text-cyan' : 'fa-brands fa-youtube text-danger'}></i>
                        </div>
                        <div className="bonus-card-info">
                          <strong>{opt.name}</strong>
                          <small>Garansi Penuh 1 Bulan</small>
                        </div>
                        <span className="bonus-card-price">GRATIS</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rincian Subtotal, Diskon, dan Total Tagihan */}
            <div className="checkout-totals-block">
              <div className="checkout-total-row subtotal-row">
                <span>Subtotal Pesanan:</span>
                <span>{formatRupiah(totalAmount)}</span>
              </div>

              {appliedVoucher && appliedVoucher.type === 'discount' && (
                <div className="checkout-total-row discount-row">
                  <span>
                    <i className="fa-solid fa-ticket text-teal"></i> Potongan Voucher ({appliedVoucher.code}):
                  </span>
                  <span className="discount-value">- {formatRupiah(discountAmount)}</span>
                </div>
              )}

              {appliedVoucher && appliedVoucher.type === 'full_free' && (
                <div className="checkout-total-row discount-row full-free-row">
                  <span>
                    <i className="fa-solid fa-crown text-warning"></i> Diskon Full Gratis ({appliedVoucher.code}):
                  </span>
                  <span className="discount-value">- {formatRupiah(totalAmount)} (Full 100% Gratis)</span>
                </div>
              )}

              {appliedVoucher && appliedVoucher.type === 'free_item' && (
                <div className="checkout-total-row bonus-row">
                  <span>
                    <i className="fa-solid fa-gift text-cyan"></i> Bonus Item Gratis:
                  </span>
                  <span className="bonus-value">1x {selectedBonusItem} (Rp 0 - FREE)</span>
                </div>
              )}

              <div className="checkout-grand-total">
                <span>Total Tagihan:</span>
                <strong className={finalTotal === 0 ? 'text-free-glow' : ''}>
                  {finalTotal === 0 ? 'Rp 0 (FULL GRATIS)' : formatRupiah(finalTotal)}
                </strong>
              </div>
            </div>
          </div>

          {/* 2. Data Pemesan (Lurus ke bawah, rapi, bersih) */}
          <div className="checkout-section">
            <h4 className="checkout-section-title">
              <i className="fa-solid fa-user-check text-cyan"></i> Data Pemesan
            </h4>

            {authUser && (
              <div className="checkout-google-sync-notice">
                <div className="sync-notice-left">
                  {authUser.picture ? (
                    <img
                      src={authUser.picture}
                      alt={authUser.name}
                      className="checkout-sync-avatar"
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="checkout-sync-avatar-fallback">
                      <i className={authUser.isGoogle ? 'fa-brands fa-google text-danger' : 'fa-solid fa-user text-cyan'}></i>
                    </div>
                  )}
                  <span className="sync-notice-text">
                    Terhubung sebagai <strong>{authUser.name}</strong> ({authUser.email})
                  </span>
                </div>
                <span className="sync-notice-pill">
                  <i className="fa-solid fa-circle-check text-success"></i> Data Terisi Otomatis
                </span>
              </div>
            )}

            <div className="clean-vertical-form">
              {/* 1. Username Akun */}
              <div className="clean-field-group">
                <label htmlFor="checkoutBuyerUsername" className="clean-field-label">
                  <i className="fa-solid fa-at text-cyan"></i>
                  <span>Username Akun</span>
                  <span className="clean-field-badge badge-opt">Opsional</span>
                </label>
                <div className="clean-input-wrapper">
                  <i className="fa-solid fa-user-tag clean-input-lead-icon text-cyan"></i>
                  <input
                    type="text"
                    id="checkoutBuyerUsername"
                    className="clean-field-control"
                    placeholder="Masukkan username akun pemesan (Opsional)..."
                    value={buyerUsername}
                    onChange={(e) => setBuyerUsername(e.target.value)}
                  />
                </div>
              </div>

              {/* 2. Nama Lengkap */}
              <div className="clean-field-group">
                <label htmlFor="checkoutBuyerName" className="clean-field-label">
                  <i className="fa-solid fa-user text-emerald"></i>
                  <span>Nama Lengkap</span>
                  <span className="clean-field-badge badge-req">*Wajib</span>
                </label>
                <div className="clean-input-wrapper">
                  <i className="fa-solid fa-user clean-input-lead-icon text-emerald"></i>
                  <input
                    type="text"
                    id="checkoutBuyerName"
                    required
                    className="clean-field-control"
                    placeholder="Contoh: Andi Pratama"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                  />
                </div>
              </div>

              {/* 3. Email / Gmail Akun */}
              <div className="clean-field-group">
                <label htmlFor="checkoutBuyerEmail" className="clean-field-label">
                  <i className="fa-brands fa-google text-amber"></i>
                  <span>Email / Gmail Aktif</span>
                  <span className="clean-field-badge badge-req">*Wajib</span>
                </label>
                <div className="clean-input-wrapper">
                  <i className="fa-solid fa-envelope clean-input-lead-icon text-amber"></i>
                  <input
                    type="email"
                    id="checkoutBuyerEmail"
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
                <label htmlFor="checkoutBuyerWa" className="clean-field-label">
                  <i className="fa-brands fa-whatsapp text-success"></i>
                  <span>Nomor WhatsApp Aktif</span>
                  <span className="clean-field-badge badge-req">*Wajib</span>
                </label>
                <div className="clean-input-wrapper">
                  <i className="fa-brands fa-whatsapp clean-input-lead-icon text-success"></i>
                  <input
                    type="tel"
                    id="checkoutBuyerWa"
                    required
                    className="clean-field-control"
                    placeholder="Contoh: 081234567890"
                    value={buyerWa}
                    onChange={(e) => setBuyerWa(e.target.value)}
                  />
                </div>
              </div>

              {/* Special CapCut Field */}
              {hasCapcutOwnAccount && (
                <div className="clean-field-group">
                  <label htmlFor="checkoutCapcutAccount" className="clean-field-label">
                    <i className="fa-solid fa-scissors text-teal"></i>
                    <span>Nama / ID Akun CapCut</span>
                    <span className="clean-field-badge badge-req">*Wajib CapCut</span>
                  </label>
                  <div className="clean-input-wrapper">
                    <i className="fa-solid fa-user-pen clean-input-lead-icon text-teal"></i>
                    <input
                      type="text"
                      id="checkoutCapcutAccount"
                      required
                      className="clean-field-control"
                      placeholder="Masukkan ID / Nama Akun CapCut kamu..."
                      value={capcutAccount}
                      onChange={(e) => setCapcutAccount(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
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
            {!selectedMethod && finalTotal > 0 && (
              <div className="method-select-prompt">
                <i className="fa-solid fa-hand-pointer text-warning"></i>
                <span>
                  Pilih salah satu metode di atas (<strong>QRIS</strong>, <strong>E-Wallet</strong>, atau <strong>Bank</strong>) untuk memunculkan kode QRIS & detail pembayaran.
                </span>
              </div>
            )}
            {finalTotal === 0 && (
              <div className="method-free-banner">
                <i className="fa-solid fa-crown text-warning"></i>
                <span>
                  Voucher Full Gratis Aktif! Total Tagihan <strong>Rp 0</strong>. Tidak perlu transfer pembayaran.
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

            {!uploadedProof && finalTotal > 0 && (
              <div className="proof-warning-notice">
                <i className="fa-solid fa-lock"></i>
                <span>
                  Tombol order akan otomatis muncul setelah Anda mengupload foto bukti transfer di atas.
                </span>
              </div>
            )}

            {finalTotal === 0 && (
              <div className="proof-free-notice">
                <i className="fa-solid fa-crown text-warning"></i>
                <span>
                  <strong>Voucher Full Gratis Aktif (Tagihan Rp 0)!</strong> Anda tidak perlu transfer atau upload bukti transfer. Silakan langsung klik tombol klaim order di bawah.
                </span>
              </div>
            )}
          </div>

          {/* 5. Submit Order Button */}
          {(uploadedProof || finalTotal === 0) && (
            <div className="checkout-order-actions">
              <button
                type="button"
                className={`btn btn-submit-order ${finalTotal === 0 ? 'btn-order-free' : ''}`}
                disabled={isSubmitting}
                onClick={handleSubmitOrder}
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>{' '}
                    <span>Mengirim Pesanan ke Admin...</span>
                  </>
                ) : finalTotal === 0 ? (
                  <>
                    <i className="fa-solid fa-gift"></i>{' '}
                    <span>Klaim Pesanan Gratis</span>{' '}
                    <i className="fa-solid fa-arrow-right"></i>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane"></i>{' '}
                    <span>Kirim Pesanan</span> <i className="fa-solid fa-arrow-right"></i>
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
