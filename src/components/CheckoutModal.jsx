import React, { useState, useRef, useEffect } from 'react';
import { CONFIG, PAYMENT_INFO } from '../data/config';
import { VOUCHERS, findVoucher } from '../data/vouchers';
import {
  formatRupiah,
  copyToClipboard,
  compressImageFile,
  copyImageBlobToClipboard
} from '../utils/format';
import { createTransaction, getUserKey } from '../utils/transactions';
import { playUserNoticeSound, unlockAudio } from '../utils/audioNotification';
import {
  generateQrisDataUrl,
  QRIS_GATEWAY_CLIENT_KEY,
  MERCHANT_NMID,
  verifyGatewayPayment
} from '../utils/qrisGateway';
import { QrisLogo, GopayLogo } from './PaymentLogos';

export default function CheckoutModal({
  isOpen,
  onClose,
  items,
  source,
  authUser,
  initialVoucher,
  onOrderSuccess,
  onProceedToPayment,
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

  const [selectedMethod, setSelectedMethod] = useState('qris'); // 'qris' | 'gopay' | 'ewallet' | 'bank'

  // Reset voucher on modal open/close or pre-fill from initialVoucher
  useEffect(() => {
    if (!isOpen) {
      setVoucherCodeInput('');
      setAppliedVoucher(null);
      setSelectedBonusItem('Canva Pro (1 Bulan)');
      setSelectedMethod('qris');
    } else if (initialVoucher) {
      setAppliedVoucher(initialVoucher);
      setVoucherCodeInput(initialVoucher.code);
    }
  }, [isOpen, initialVoucher]);

  // Auto-fill dari akun login (Google / Member / Chaiz)
  React.useEffect(() => {
    if (isOpen) {
      if (authUser) {
        setBuyerUsername(authUser.username || (authUser.name ? authUser.name.toLowerCase().replace(/\s+/g, '_') : ''));
        setBuyerName(authUser.name || '');
        setBuyerEmail(authUser.email || '');
        if (authUser.phone) {
          setBuyerWa(authUser.phone);
        }
      } else {
        setBuyerUsername('');
        setBuyerName('');
        setBuyerEmail('');
        setBuyerWa('');
      }
    }
  }, [isOpen, authUser]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dynamicQrisUrl, setDynamicQrisUrl] = useState(null);
  const [isGeneratingQris, setIsGeneratingQris] = useState(false);
  const [qrisTimerSeconds, setQrisTimerSeconds] = useState(900);

  const totalAmount = (items || []).reduce((acc, curr) => acc + (curr.total || curr.price || 0), 0);

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

  // Dynamic QRIS Generator untuk Total Tagihan (misal Canva Rp 3.000)
  useEffect(() => {
    let isCancelled = false;
    if (isOpen && finalTotal > 0) {
      setIsGeneratingQris(true);
      generateQrisDataUrl({
        amount: finalTotal,
        orderId: `CHZ-${Date.now().toString().slice(-6)}`
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
  }, [isOpen, finalTotal]);

  // Countdown Timer 15 Menit untuk Sesi QRIS Gateway
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

  if (!isOpen) return null;

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
    const qrUrl = dynamicQrisUrl || '/Qris.png';
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `QRIS-ChaizStore-${finalTotal || 0}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast(`Foto QRIS Dinamis (${formatRupiah(finalTotal)}) berhasil di-download!`, 'fa-circle-check');
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
    unlockAudio();
    const username = buyerUsername.trim();
    const name = buyerName.trim();
    const wa = buyerWa.trim();
    const email = buyerEmail.trim() || '-';

    if (!name) {
      onShowToast('Silakan masukkan Nama Lengkap Anda terlebih dahulu!', 'fa-triangle-exclamation');
      const inputEl = document.getElementById('checkoutBuyerName');
      inputEl?.focus();
      inputEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!wa) {
      onShowToast('⚠️ Jangan lupa isi nomor telepon / WhatsApp kamu!', 'fa-phone text-warning');
      const inputEl = document.getElementById('checkoutBuyerWa');
      inputEl?.focus();
      inputEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const cleanWaDigits = wa.replace(/[^0-9]/g, '');
    if (cleanWaDigits.length < 8) {
      onShowToast('Nomor telepon / WhatsApp kamu terlalu pendek! Minimal 8-15 digit (contoh: 081234567890).', 'fa-triangle-exclamation');
      const inputEl = document.getElementById('checkoutBuyerWa');
      inputEl?.focus();
      inputEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (hasCapcutOwnAccount && !capcutAccount.trim()) {
      onShowToast('Nama Akun CapCut wajib diisi untuk paket Akun Sendiri!', 'fa-triangle-exclamation');
      return;
    }

    const finalEmail = (authUser?.email || email || '').toLowerCase().trim();
    const finalUserId =
      authUser?.id ||
      getUserKey(authUser) ||
      (finalEmail && finalEmail !== '-' ? getUserKey({ email: finalEmail }) : null);

    // ===================================================================
    // JANSPAYMENT REALTIME QRIS / GOPAY GATEWAY (ANTI-FRAUD)
    // SELALU MENGALIHKAN KE HALAMAN QRIS REALTIME JANSPAYMENT
    // ===================================================================
    if (finalTotal > 0 && (selectedMethod === 'qris' || selectedMethod === 'gopay')) {
      const orderId = `CHZ-${Date.now().toString().slice(-6)}`;
      const orderPayload = {
        id: orderId,
        amount: finalTotal,
        total: finalTotal,
        items,
        customerName: name || authUser?.name || 'Pelanggan ChaizStore',
        customerPhone: wa,
        customerEmail: finalEmail !== '-' ? finalEmail : 'order@chaizstore.my.id',
        customerUsername: username || authUser?.username || '',
        paymentMethod: selectedMethod === 'gopay' ? 'GoPay Instant Otomatis' : 'QRIS Payment Gateway Otomatis',
        subMethod: selectedMethod,
        source: source
      };

      if (typeof onProceedToPayment === 'function') {
        onProceedToPayment(orderPayload);
      } else {
        try {
          localStorage.setItem('chaiz_active_payment', JSON.stringify(orderPayload));
          window.location.hash = `#pembayaran?trx=${orderId}&total=${finalTotal}&method=${selectedMethod}`;
        } catch {}
        onClose();
      }
      return;
    }

    setIsSubmitting(true);

    let methodTitle = 'QRIS Payment Gateway Otomatis';
    if (finalTotal === 0) {
      methodTitle = `Voucher Promo Bebas Biaya (100% Full Gratis - ${appliedVoucher ? appliedVoucher.code : 'GRATIS'})`;
    } else if (selectedMethod === 'gopay') {
      methodTitle = 'GoPay Instant Otomatis';
    } else if (selectedMethod === 'ewallet') {
      methodTitle = 'E-Wallet Transfer (081809730331)';
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

    let capcutAccountLine = '';

    // Simpan otomatis ke sistem Transaksi Pelanggan & Admin secara lokal
    try {
      const finalEmail = (authUser?.email || email || '').toLowerCase().trim();
      const finalUserId =
        authUser?.id ||
        getUserKey(authUser) ||
        (finalEmail && finalEmail !== '-' ? getUserKey({ email: finalEmail }) : null);

      items.forEach((item) => {
        createTransaction({
          productId: item.productId || null,
          productName: item.name,
          productDuration: item.duration || 'Reguler',
          productCategory: 'Akun Premium',
          price: item.price || 0,
          qty: item.qty || 1,
          total: item.total || item.price || 0,
          userId: finalUserId,
          userEmail: finalEmail !== '-' ? finalEmail : null,
          customerUsername: username || authUser?.username || '',
          customerName: name,
          customerEmail: finalEmail || email,
          customerPhone: wa,
          paymentMethod: methodTitle,
          proofUrl: null,
          proofFileName: null,
          proofSize: null,
          warrantyPeriod: `Garansi Full ${item.duration || 'Aktif'}`
        });
      });
    } catch (err) {}

    setIsSubmitting(false);
    onOrderSuccess(source);
    onClose();

    playUserNoticeSound();
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
              <div className={`clean-field-group ${!buyerWa.trim() ? 'field-highlight-wa' : ''}`}>
                <label htmlFor="checkoutBuyerWa" className="clean-field-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-brands fa-whatsapp text-success"></i>
                    <span>Nomor Telepon / WhatsApp Aktif</span>
                  </div>
                  {!buyerWa.trim() ? (
                    <span className="clean-field-badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.5)', fontWeight: 700, fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px' }}>
                      <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '4px' }}></i>Jangan Lupa Diisi
                    </span>
                  ) : (
                    <span className="clean-field-badge badge-req" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                      <i className="fa-solid fa-check" style={{ marginRight: '4px' }}></i>Sudah Terisi
                    </span>
                  )}
                </label>
                <div className="clean-input-wrapper" style={!buyerWa.trim() ? { borderColor: 'rgba(245, 158, 11, 0.65)', boxShadow: '0 0 0 2px rgba(245, 158, 11, 0.15)' } : {}}>
                  <i className="fa-brands fa-whatsapp clean-input-lead-icon text-success"></i>
                  <input
                    type="tel"
                    id="checkoutBuyerWa"
                    required
                    className="clean-field-control"
                    placeholder="Contoh: 081234567890 (Wajib diisi)"
                    value={buyerWa}
                    onChange={(e) => setBuyerWa(e.target.value)}
                  />
                </div>
                <div style={{ marginTop: '6px', fontSize: '0.78rem', color: !buyerWa.trim() ? '#fbbf24' : 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className={!buyerWa.trim() ? 'fa-solid fa-bullhorn text-warning' : 'fa-solid fa-circle-info'}></i>
                  <span><strong>Arahan:</strong> Jangan lupa isi nomor telepon / WhatsApp kamu agar admin dapat mengirimkan detail akun & informasi pesanan!</span>
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

            {/* Arahan Pengingat Nomor HP jika belum diisi */}
            {!buyerWa.trim() && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.14), rgba(234, 88, 12, 0.08))',
                  border: '1.5px dashed rgba(245, 158, 11, 0.55)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0, fontSize: '0.95rem' }}>
                    <i className="fa-solid fa-phone-volume"></i>
                  </div>
                  <div>
                    <strong style={{ color: '#fbbf24', fontSize: '0.86rem', display: 'block' }}>
                      Pengingat: Jangan lupa isi nomor telepon kamu!
                    </strong>
                    <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
                      Nomor telepon di bagian atas belum terisi. Harap diisi agar pesanan kamu dapat diproses dengan cepat.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('checkoutBuyerWa');
                    el?.focus();
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  style={{
                    background: '#f59e0b',
                    color: '#0f172a',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <i className="fa-solid fa-pen-to-square"></i> Isi Nomor
                </button>
              </div>
            )}

            {/* Pilihan Metode Pembayaran (Grid Bersih, Rapi & Responsif) */}
            <div className="checkout-payment-methods-grid">
              {/* 1. QRIS Gateway */}
              <div
                className={`checkout-pay-card ${selectedMethod === 'qris' ? 'active' : ''}`}
                onClick={() => handleMethodSelect('qris')}
              >
                <div className="pay-card-top">
                  <div className="pay-card-logo-wrap">
                    <QrisLogo />
                  </div>
                  <span className="pay-card-badge badge-emerald">Dinamis Otomatis</span>
                </div>
                <div className="pay-card-body">
                  <strong>QRIS Gateway</strong>
                  <small>Semua Bank & E-Wallet (BCA, Mandiri, BRI, DANA, OVO, dll)</small>
                </div>
                <div className="pay-card-indicator">
                  <i className={selectedMethod === 'qris' ? "fa-solid fa-circle-check text-emerald" : "fa-regular fa-circle"}></i>
                </div>
              </div>

              {/* 2. GoPay Instant */}
              <div
                className={`checkout-pay-card ${selectedMethod === 'gopay' ? 'active' : ''}`}
                onClick={() => handleMethodSelect('gopay')}
              >
                <div className="pay-card-top">
                  <div className="pay-card-logo-wrap gopay-wrap">
                    <GopayLogo />
                  </div>
                  <span className="pay-card-badge badge-cyan">Buka App Langsung</span>
                </div>
                <div className="pay-card-body">
                  <strong>GoPay Instant</strong>
                  <small>Bayar via Aplikasi GoPay di HP / Salin Nomor / QR</small>
                </div>
                <div className="pay-card-indicator">
                  <i className={selectedMethod === 'gopay' ? "fa-solid fa-circle-check text-cyan" : "fa-regular fa-circle"}></i>
                </div>
              </div>

              {/* 3. DANA / E-Wallet Manual */}
              <div
                className={`checkout-pay-card ${selectedMethod === 'ewallet' ? 'active' : ''}`}
                onClick={() => handleMethodSelect('ewallet')}
              >
                <div className="pay-card-top">
                  <div className="pay-card-icon-wrap text-cyan">
                    <i className="fa-solid fa-wallet"></i>
                  </div>
                  <span className="pay-card-badge badge-blue">Bebas Biaya</span>
                </div>
                <div className="pay-card-body">
                  <strong>DANA / E-Wallet</strong>
                  <small>0818-0973-0331 (a.n ChaizStore)</small>
                </div>
                <div className="pay-card-indicator">
                  <i className={selectedMethod === 'ewallet' ? "fa-solid fa-circle-check text-cyan" : "fa-regular fa-circle"}></i>
                </div>
              </div>

              {/* 4. Transfer Bank */}
              <div
                className={`checkout-pay-card ${selectedMethod === 'bank' ? 'active' : ''}`}
                onClick={() => handleMethodSelect('bank')}
              >
                <div className="pay-card-top">
                  <div className="pay-card-icon-wrap text-purple">
                    <i className="fa-solid fa-building-columns"></i>
                  </div>
                  <span className="pay-card-badge badge-purple">Bank Syariah</span>
                </div>
                <div className="pay-card-body">
                  <strong>Bank Muamalat</strong>
                  <small>1410043224 (a.n ChaizStore)</small>
                </div>
                <div className="pay-card-indicator">
                  <i className={selectedMethod === 'bank' ? "fa-solid fa-circle-check text-purple" : "fa-regular fa-circle"}></i>
                </div>
              </div>
            </div>

            {finalTotal === 0 && (
              <div className="method-free-banner">
                <i className="fa-solid fa-crown text-warning"></i>
                <span>
                  Voucher Full Gratis Aktif! Total Tagihan <strong>Rp 0</strong>. Tidak perlu transfer pembayaran.
                </span>
              </div>
            )}

            {/* Detail & Panduan Metode Terpilih */}
            {finalTotal > 0 && selectedMethod === 'qris' && (
              <div className="checkout-method-detail-panel qris-panel">
                <div className="panel-header-row">
                  <div className="panel-icon-brand"><QrisLogo /></div>
                  <div className="panel-title-text">
                    <strong>QRIS Payment Gateway Otomatis</strong>
                    <small>Dapat di-scan dengan semua aplikasi Mobile Banking & E-Wallet</small>
                  </div>
                </div>
                <div className="panel-features-list">
                  <div className="panel-feat-item">
                    <i className="fa-solid fa-shield-check text-emerald"></i>
                    <span>Nominal tagihan <strong>{formatRupiah(finalTotal)}</strong> otomatis terkunci dan terverifikasi instan.</span>
                  </div>
                  <div className="panel-feat-item">
                    <i className="fa-solid fa-bolt text-warning"></i>
                    <span>Pesanan otomatis diproses kilat dan langsung masuk antrean prioritas sistem admin.</span>
                  </div>
                </div>
              </div>
            )}

            {finalTotal > 0 && selectedMethod === 'gopay' && (
              <div className="checkout-method-detail-panel gopay-panel">
                <div className="panel-header-row">
                  <div className="panel-icon-brand"><GopayLogo /></div>
                  <div className="panel-title-text">
                    <strong>GoPay Instant Gateway & Saldo GoPay</strong>
                    <small>Bayar instan via Aplikasi GoPay di HP atau scan QR GoPay</small>
                  </div>
                </div>
                <div className="panel-account-strip">
                  <div className="strip-left">
                    <span className="strip-label">Nomor Akun GoPay ChaizStore:</span>
                    <strong className="strip-number">0818-0973-0331</strong>
                    <span className="strip-owner">a.n Haris / ChaizStore</span>
                  </div>
                  <button
                    type="button"
                    className="btn-strip-copy"
                    onClick={() => handleCopyRekening('081809730331', 'Nomor GoPay')}
                  >
                    <i className="fa-regular fa-copy"></i> Salin Nomor
                  </button>
                </div>
                <div className="panel-features-list">
                  <div className="panel-feat-item">
                    <i className="fa-solid fa-mobile-screen-button text-cyan"></i>
                    <span>Tersedia tombol <strong>Buka Aplikasi GoPay</strong> di halaman pembayaran untuk bayar langsung di HP.</span>
                  </div>
                  <div className="panel-feat-item">
                    <i className="fa-solid fa-bolt text-warning"></i>
                    <span>Verifikasi instan otomatis dan aman terhubung langsung ke sistem.</span>
                  </div>
                </div>
              </div>
            )}

            {finalTotal > 0 && selectedMethod === 'ewallet' && (
              <div className="checkout-method-detail-panel ewallet-panel">
                <div className="panel-header-row">
                  <div className="panel-icon-circle text-cyan"><i className="fa-solid fa-wallet"></i></div>
                  <div className="panel-title-text">
                    <strong>Transfer Manual E-Wallet (DANA / OVO / ShopeePay)</strong>
                    <small>Kirim saldo ke nomor E-Wallet resmi ChaizStore di bawah ini</small>
                  </div>
                </div>
                <div className="panel-account-strip">
                  <div className="strip-left">
                    <span className="strip-label">Nomor E-Wallet (DANA / OVO / ShopeePay):</span>
                    <strong className="strip-number">0818-0973-0331</strong>
                    <span className="strip-owner">a.n Haris / ChaizStore</span>
                  </div>
                  <button
                    type="button"
                    className="btn-strip-copy"
                    onClick={() => handleCopyRekening('081809730331', 'Nomor E-Wallet')}
                  >
                    <i className="fa-regular fa-copy"></i> Salin Nomor
                  </button>
                </div>
                <div className="panel-features-list">
                  <div className="panel-feat-item">
                    <i className="fa-solid fa-circle-check text-emerald"></i>
                    <span>Transfer sesuai total tagihan <strong>{formatRupiah(finalTotal)}</strong> ke nomor di atas.</span>
                  </div>
                  <div className="panel-feat-item">
                    <i className="fa-solid fa-bolt text-warning"></i>
                    <span>Setelah transfer, klik tombol <strong>Kirim Pesanan</strong> di bawah. Admin langsung memproses pesanan Anda kilat 1-5 menit.</span>
                  </div>
                </div>
              </div>
            )}

            {finalTotal > 0 && selectedMethod === 'bank' && (
              <div className="checkout-method-detail-panel bank-panel">
                <div className="panel-header-row">
                  <div className="panel-icon-circle text-purple"><i className="fa-solid fa-building-columns"></i></div>
                  <div className="panel-title-text">
                    <strong>Transfer Bank Muamalat</strong>
                    <small>Transfer via m-Banking, ATM, atau Bank Syariah manapun</small>
                  </div>
                </div>
                <div className="panel-account-strip">
                  <div className="strip-left">
                    <span className="strip-label">Rekening Bank Muamalat:</span>
                    <strong className="strip-number">1410043224</strong>
                    <span className="strip-owner">a.n ChaizStore / Haris</span>
                  </div>
                  <button
                    type="button"
                    className="btn-strip-copy"
                    onClick={() => handleCopyRekening('1410043224', 'Rekening Bank Muamalat')}
                  >
                    <i className="fa-regular fa-copy"></i> Salin Rekening
                  </button>
                </div>
                <div className="panel-features-list">
                  <div className="panel-feat-item">
                    <i className="fa-solid fa-circle-check text-emerald"></i>
                    <span>Transfer sesuai total tagihan <strong>{formatRupiah(finalTotal)}</strong> ke rekening di atas.</span>
                  </div>
                  <div className="panel-feat-item">
                    <i className="fa-solid fa-bolt text-warning"></i>
                    <span>Setelah transfer, klik tombol <strong>Kirim Pesanan</strong> di bawah. Admin langsung memproses pesanan Anda kilat 1-5 menit.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. Submit Order Button */}
          <div className="checkout-order-actions">
            {!buyerWa.trim() && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '10px',
                  padding: '9px 13px',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  color: '#fca5a5',
                  fontSize: '0.8rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-circle-exclamation text-danger" style={{ fontSize: '1rem' }}></i>
                  <span>
                    <strong>Perhatian:</strong> Jangan lupa isi nomor telepon kamu di formulir atas sebelum mengirim pesanan!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('checkoutBuyerWa');
                    el?.focus();
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    color: '#fecaca',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Isi Nomor
                </button>
              </div>
            )}
            <button
              type="button"
              className={`btn btn-submit-order ${
                finalTotal === 0
                  ? 'btn-order-free'
                  : selectedMethod === 'gopay'
                  ? 'btn-gopay-order'
                  : selectedMethod === 'qris'
                  ? 'btn-qris-order'
                  : 'btn-manual-order'
              }`}
              disabled={isSubmitting}
              onClick={handleSubmitOrder}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>{' '}
                  <span>Memproses Pesanan...</span>
                </>
              ) : finalTotal === 0 ? (
                <>
                  <i className="fa-solid fa-gift"></i>{' '}
                  <span>Klaim Pesanan Gratis</span>{' '}
                  <i className="fa-solid fa-arrow-right"></i>
                </>
              ) : selectedMethod === 'gopay' ? (
                <>
                  <i className="fa-solid fa-bolt"></i>{' '}
                  <span>Bayar via GoPay Instant ({formatRupiah(finalTotal)})</span> <i className="fa-solid fa-arrow-right"></i>
                </>
              ) : selectedMethod === 'qris' ? (
                <>
                  <i className="fa-solid fa-qrcode"></i>{' '}
                  <span>Lanjut ke Pembayaran QRIS ({formatRupiah(finalTotal)})</span> <i className="fa-solid fa-arrow-right"></i>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane"></i>{' '}
                  <span>Kirim Pesanan ({formatRupiah(finalTotal)})</span> <i className="fa-solid fa-arrow-right"></i>
                </>
              )}
            </button>
          </div>

          <p className="order-guarantee-text">
            <i className="fa-solid fa-shield-check text-success"></i> Transaksi Anda 100% aman & bergaransi penuh. Akun dikirim kilat 1-5 menit.
          </p>
        </div>
      </div>
    </div>
  );
}
