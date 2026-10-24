import React, { useState, useEffect, useRef } from 'react';
import { formatRupiah, copyToClipboard, compressImageFile } from '../utils/format';
import { PAYMENT_INFO } from '../data/config';
import { createTransaction, getUserKey } from '../utils/transactions';

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
  initialPackageId = '50r'
}) {
  const [selectedPkgId, setSelectedPkgId] = useState(initialPackageId);
  const [robloxUsername, setRobloxUsername] = useState('');
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
      setSelectedMethod('qris');
      setUploadedProof(null);

      if (authUser) {
        setBuyerName(authUser.name || '');
        setBuyerEmail(authUser.email || '');
        setBuyerWa(authUser.phone || '');
        // Biarkan robloxUsername kosong atau autofill jika belum diisi
        if (!robloxUsername) {
          setRobloxUsername(authUser.username || '');
        }
      }
    }
  }, [isOpen, initialPackageId, authUser]);

  if (!isOpen) return null;

  const currentPkg =
    ROBUX_PACKAGES.find((p) => p.id === selectedPkgId) ||
    ROBUX_PACKAGES[0];

  const totalPrice = currentPkg.price;

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

    try {
      const finalEmail = (authUser?.email || email || '').toLowerCase().trim();
      const finalUserId =
        authUser?.id ||
        getUserKey(authUser) ||
        (finalEmail && finalEmail !== '-' ? getUserKey({ email: finalEmail }) : null);

      const proofImg = uploadedProof?.dataUrl || uploadedProof?.uploadedUrl || null;

      const newTrx = createTransaction({
        productId: 'roblox-' + currentPkg.id,
        productName: `Roblox Robux ${currentPkg.name} (${currentPkg.symbol})`,
        productDuration: `Username: ${cleanRobloxUser}`,
        productCategory: 'Top Up Game',
        price: currentPkg.price,
        qty: 1,
        total: totalPrice,
        userId: finalUserId,
        userEmail: finalEmail !== '-' ? finalEmail : null,
        customerUsername: cleanRobloxUser,
        customerName: name,
        customerEmail: finalEmail,
        customerPhone: wa,
        paymentMethod: paymentName,
        proofUrl: proofImg,
        proofFileName: uploadedProof?.name || (proofImg ? 'Bukti_Transfer_Robux.png' : null),
        proofSize: uploadedProof?.size || null,
        warrantyPeriod: 'Garansi Robux Masuk 100%'
      });

      onShowToast?.(
        `🎉 Pesanan Robux #${newTrx.id} berhasil dibuat! Admin segera memproses saldo ke username: ${cleanRobloxUser}`,
        'fa-circle-check text-success'
      );

      // Konfirmasi WhatsApp Otomatis ke CS
      const waText = [
        `*ORDER ROBUX ROBLOX - CHAIZSTORE*`,
        ``,
        `🎮 *Paket Robux:* ${currentPkg.name} (${currentPkg.symbol})`,
        `👤 *Username Roblox:* *${cleanRobloxUser}*`,
        `💰 *Total Tagihan:* *${formatRupiah(totalPrice)}*`,
        `💳 *Metode Bayar:* ${paymentName}`,
        ``,
        `📋 *Data Pemesan:*`,
        `• Nama: ${name}`,
        `• No. WA: ${wa}`,
        `• Email: ${email}`,
        `• ID Pesanan: #${newTrx.id}`,
        ``,
        `Halo Admin ChaizStore, saya sudah melakukan pembayaran dan melampirkan bukti transfer untuk pengisian Robux ke username Roblox saya di atas. Mohon segera diproses ya kak!`
      ].join('\n');

      const waUrl = `https://wa.me/6281809730331?text=${encodeURIComponent(waText)}`;

      setTimeout(() => {
        window.open(waUrl, '_blank');
      }, 700);

      onClose();
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
      <div className="modal-box modal-box-redesign steam-buy-modal-box" style={{ maxWidth: '640px' }}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Tutup">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Modal Header */}
        <div className="modal-header-centered" style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.25)', paddingBottom: '18px' }}>
          <div
            className="trx-header-icon-wrap"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(249, 115, 22, 0.25) 100%)',
              borderColor: 'rgba(239, 68, 68, 0.5)',
              color: '#f87171'
            }}
          >
            <i className="fa-solid fa-cube"></i>
          </div>
          <span className="modal-tag" style={{ color: '#f87171' }}>
            TOP UP ROBUX VIA USERNAME RESMI
          </span>
          <h3 className="modal-title-centered" style={{ color: '#ffffff' }}>
            Checkout Saldo Robux Roblox
          </h3>
          <p className="modal-desc" style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>
            Isi saldo Robux legal dan bergaransi 100%. Cukup masukkan username akun Roblox kamu tanpa butuh password!
          </p>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmitOrder} className="steam-modal-body" style={{ padding: '20px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
          {/* 1. Pilih Denominasi Robux */}
          <div className="steam-selector-section" style={{ marginBottom: '22px' }}>
            <label className="steam-field-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                <i className="fa-solid fa-cube text-danger"></i> <strong>Pilih Jumlah Robux:</strong>
              </span>
              <span style={{ fontSize: '12px', color: '#f87171', fontFamily: 'monospace' }}>
                {currentPkg.decoSymbol}
              </span>
            </label>

            <div className="steam-packages-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '8px' }}>
              {ROBUX_PACKAGES.map((pkg) => {
                const isSelected = selectedPkgId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    className={`steam-pkg-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedPkgId(pkg.id)}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(239, 68, 68, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1.5px solid ${isSelected ? '#ef4444' : 'rgba(255, 255, 255, 0.08)'}`,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.9)' }}>
                      {pkg.name}
                    </div>
                    <div style={{ fontSize: '12px', color: isSelected ? '#fca5a5' : '#ef4444', fontWeight: 600, marginTop: '2px' }}>
                      {formatRupiah(pkg.price)}
                    </div>
                    {isSelected && (
                      <span style={{ position: 'absolute', top: '6px', right: '6px', fontSize: '10px', color: '#ef4444' }}>
                        <i className="fa-solid fa-circle-check"></i>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. INPUT UTAMA: USERNAME ROBLOX KAMU */}
          <div
            className="roblox-username-card"
            style={{
              padding: '16px 18px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(249, 115, 22, 0.08) 100%)',
              border: '1.5px solid rgba(239, 68, 68, 0.45)',
              marginBottom: '22px'
            }}
          >
            <label className="steam-field-label" style={{ display: 'block', marginBottom: '6px', color: '#ffffff' }}>
              <i className="fa-solid fa-user-ninja text-danger" style={{ marginRight: '6px' }}></i>
              <strong>Username Roblox Kamu (Wajib):</strong>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Contoh: player_roblox123"
                value={robloxUsername}
                onChange={(e) => setRobloxUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: '10px',
                  background: 'rgba(0, 0, 0, 0.65)',
                  border: '1.5px solid rgba(239, 68, 68, 0.4)',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 600,
                  letterSpacing: '0.5px'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#ef4444',
                  fontSize: '16px'
                }}
              >
                <i className="fa-solid fa-at"></i>
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
              <i className="fa-solid fa-shield-halved text-emerald"></i>
              <span>Cukup masukkan username akun Roblox kamu tanpa tanda @ dan <strong>tanpa password</strong>.</span>
            </div>
          </div>

          {/* 3. Kontak Pelanggan */}
          <div className="steam-buyer-details" style={{ marginBottom: '22px' }}>
            <label className="steam-field-label" style={{ marginBottom: '8px', display: 'block' }}>
              <i className="fa-solid fa-address-card text-cyan"></i> <strong>Data Pemesan:</strong>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '4px' }}>Nama Lengkap:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nama Lengkap"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '4px' }}>No. WhatsApp:</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Contoh: 08123456789"
                  value={buyerWa}
                  onChange={(e) => setBuyerWa(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '4px' }}>Email / Gmail:</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="alamat.email@gmail.com"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                />
              </div>
            </div>
          </div>

          {/* 4. Pilihan Metode Pembayaran */}
          <div className="steam-payment-methods" style={{ marginBottom: '22px' }}>
            <label className="steam-field-label" style={{ marginBottom: '10px', display: 'block' }}>
              <i className="fa-solid fa-wallet text-warning"></i> <strong>Pilih Metode Pembayaran:</strong>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <button
                type="button"
                className={`steam-method-card ${selectedMethod === 'qris' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('qris')}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: selectedMethod === 'qris' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1.5px solid ${selectedMethod === 'qris' ? '#10b981' : 'rgba(255, 255, 255, 0.08)'}`,
                  textAlign: 'center',
                  cursor: 'pointer',
                  color: '#fff'
                }}
              >
                <i className="fa-solid fa-qrcode" style={{ fontSize: '20px', color: '#10b981', display: 'block', marginBottom: '6px' }}></i>
                <strong style={{ fontSize: '13px', display: 'block' }}>QRIS Instant</strong>
                <small style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Semua E-Wallet/Bank</small>
              </button>

              <button
                type="button"
                className={`steam-method-card ${selectedMethod === 'ewallet' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('ewallet')}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: selectedMethod === 'ewallet' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1.5px solid ${selectedMethod === 'ewallet' ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                  textAlign: 'center',
                  cursor: 'pointer',
                  color: '#fff'
                }}
              >
                <i className="fa-solid fa-wallet" style={{ fontSize: '20px', color: '#38bdf8', display: 'block', marginBottom: '6px' }}></i>
                <strong style={{ fontSize: '13px', display: 'block' }}>DANA / E-Wallet</strong>
                <small style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>0818-0973-0331</small>
              </button>

              <button
                type="button"
                className={`steam-method-card ${selectedMethod === 'bank' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('bank')}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: selectedMethod === 'bank' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1.5px solid ${selectedMethod === 'bank' ? '#a855f7' : 'rgba(255, 255, 255, 0.08)'}`,
                  textAlign: 'center',
                  cursor: 'pointer',
                  color: '#fff'
                }}
              >
                <i className="fa-solid fa-building-columns" style={{ fontSize: '20px', color: '#a855f7', display: 'block', marginBottom: '6px' }}></i>
                <strong style={{ fontSize: '13px', display: 'block' }}>Bank Muamalat</strong>
                <small style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>1080010996</small>
              </button>
            </div>

            {/* Detail Box Metode Pembayaran */}
            <div style={{ marginTop: '14px', padding: '14px 16px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {selectedMethod === 'qris' && (
                <div style={{ textAlign: 'center' }}>
                  <img
                    src="/Qris.png"
                    alt="QRIS ChaizStore"
                    style={{ width: '160px', height: '160px', borderRadius: '10px', margin: '0 auto 10px', display: 'block', background: '#fff', padding: '6px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleDownloadQris}
                      style={{ fontSize: '12px', padding: '6px 14px' }}
                    >
                      <i className="fa-solid fa-download"></i> Download QRIS
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleCopyRekening(formatRupiah(totalPrice), 'Total Pembayaran')}
                      style={{ fontSize: '12px', padding: '6px 14px' }}
                    >
                      <i className="fa-solid fa-copy"></i> Salin Nominal ({formatRupiah(totalPrice)})
                    </button>
                  </div>
                </div>
              )}

              {selectedMethod === 'ewallet' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ display: 'block', color: '#fff', fontSize: '14px' }}>DANA / GoPay / OVO</strong>
                    <span style={{ fontSize: '13px', color: '#38bdf8' }}>0818-0973-0331 (a.n Haris)</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => handleCopyRekening('081809730331', 'Nomor E-Wallet')}
                  >
                    <i className="fa-solid fa-copy"></i> Salin Nomor
                  </button>
                </div>
              )}

              {selectedMethod === 'bank' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ display: 'block', color: '#fff', fontSize: '14px' }}>Bank Muamalat</strong>
                    <span style={{ fontSize: '13px', color: '#a855f7' }}>1080010996 (a.n Haris)</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => handleCopyRekening('1080010996', 'Nomor Rekening')}
                  >
                    <i className="fa-solid fa-copy"></i> Salin Rekening
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 5. Upload Bukti Transfer */}
          <div className="steam-proof-upload" style={{ marginBottom: '22px' }}>
            <label className="steam-field-label" style={{ marginBottom: '8px', display: 'block' }}>
              <i className="fa-solid fa-receipt text-cyan"></i> <strong>Upload Bukti Transfer:</strong>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleProofChange}
              accept="image/*"
              style={{ display: 'none' }}
              id="robloxProofInput"
            />

            {!uploadedProof ? (
              <div
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={{
                  border: '2px dashed rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '28px', color: '#f87171', marginBottom: '8px', display: 'block' }}></i>
                <strong style={{ display: 'block', color: '#fff', fontSize: '14px' }}>Klik untuk Upload Foto Bukti Pembayaran</strong>
                <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Mendukung format JPG, PNG, WEBP (Otomatis Dicompress)</small>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                <img
                  src={uploadedProof.dataUrl}
                  alt="Bukti Transfer"
                  style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: 'block', color: '#fff', fontSize: '13px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {uploadedProof.name}
                  </strong>
                  <small style={{ color: '#10b981', fontSize: '11px' }}>
                    <i className="fa-solid fa-circle-check"></i> Siap dikirim ({uploadedProof.size})
                  </small>
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleRemoveProof}
                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            )}
          </div>

          {/* Ringkasan & Total Tagihan */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
              <span>Item Pesanan:</span>
              <strong style={{ color: '#fff' }}>Robux Roblox ({currentPkg.name})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
              <span>Tujuan Username:</span>
              <strong style={{ color: '#f87171' }}>{robloxUsername || '(Belum diisi)'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
              <span>Metode Pembayaran:</span>
              <span style={{ color: '#38bdf8' }}>{selectedMethod.toUpperCase()}</span>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>Total Tagihan:</span>
              <strong style={{ fontSize: '20px', color: '#f87171', fontWeight: 800 }}>{formatRupiah(totalPrice)}</strong>
            </div>
          </div>

          {/* Tombol Submit Pesanan */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '15px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
              borderColor: '#f87171',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Memproses Pesanan Robux...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-cube"></i>
                <span>Konfirmasi & Beli Sekarang ({formatRupiah(totalPrice)})</span>
                <i className="fa-solid fa-arrow-right" style={{ fontSize: '12px' }}></i>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
