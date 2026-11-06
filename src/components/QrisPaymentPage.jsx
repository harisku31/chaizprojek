import React, { useState, useEffect, useRef } from 'react';
import { formatRupiah } from '../utils/format';
import {
  createJansPaymentQris,
  checkJansPaymentStatus,
  JANSPAYMENT_API_KEY,
  MERCHANT_NMID
} from '../utils/qrisGateway';
import { createTransaction } from '../utils/transactions';
import { playUserNoticeSound } from '../utils/audioNotification';
import { QrisLogo, GopayLogo } from './PaymentLogos';

export default function QrisPaymentPage({
  order,
  authUser,
  onCancel,
  onSuccess,
  onShowToast
}) {
  // 1. Ambil parameter fallback dari URL hash (misal #pembayaran?trx=CHZ-123&total=5000&method=gopay)
  const hashParams = React.useMemo(() => {
    if (typeof window === 'undefined') return {};
    const hash = window.location.hash || '';
    const qIdx = hash.indexOf('?');
    if (qIdx === -1) return {};
    const sp = new URLSearchParams(hash.slice(qIdx + 1));
    return {
      trx: sp.get('trx'),
      total: Number(sp.get('total')) || null,
      method: sp.get('method')
    };
  }, []);

  // 2. Fallback order data jika dibuka langsung dari URL
  const activeOrder = order || {
    id: hashParams.trx || `CHZ-${Date.now().toString().slice(-6)}`,
    amount: hashParams.total || 3000,
    items: [{ name: 'Produk Digital ChaizStore', price: hashParams.total || 3000, qty: 1 }],
    customerName: authUser?.name || 'Pelanggan ChaizStore',
    customerPhone: authUser?.phone || '081234567890',
    customerEmail: authUser?.email || 'customer@chaizstore.my.id',
    subMethod: hashParams.method || 'qris'
  };

  const baseAmount = activeOrder.amount || activeOrder.total || hashParams.total || 3000;

  // 3. Deteksi apakah metode yang dipilih adalah GoPay atau QRIS
  const isGopay =
    activeOrder.subMethod === 'gopay' ||
    hashParams.method === 'gopay' ||
    activeOrder.paymentMethod === 'gopay' ||
    (activeOrder.paymentMethod && activeOrder.paymentMethod.toLowerCase().includes('gopay')) ||
    (typeof window !== 'undefined' && window.location.hash.toLowerCase().includes('gopay'));

  const [jansData, setJansData] = useState(null);
  const [dynamicQrisUrl, setDynamicQrisUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(360); // 6 Menit (Wajib Hangus saat habis)
  const [isExpired, setIsExpired] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(4);
  const isPaidRef = useRef(false);

  // Nominal yang wajib dibayar persis (termasuk kode unik dari JansPayment jika ada)
  const payableAmount = jansData?.amount || baseAmount;

  // 1. Inisialisasi QRIS Resmi di Server JansPayment
  useEffect(() => {
    let isCancelled = false;
    setIsGenerating(true);

    createJansPaymentQris({
      amount: baseAmount,
      orderId: activeOrder.id,
      note: `Pesanan #${activeOrder.id} ChaizStore`
    })
      .then((res) => {
        if (!isCancelled) {
          setJansData(res);
          setDynamicQrisUrl(res.qrImageUrl);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Error creating JansPayment QRIS:', err);
        if (!isCancelled) setIsGenerating(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [baseAmount, activeOrder.id]);

  // 2. Countdown Timer 6 Menit (Hangus saat habis)
  useEffect(() => {
    if (isPaid || isExpired) return;
    const timer = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          onShowToast?.('⚠️ Waktu pembayaran 6 menit telah habis. Sesi QRIS hangus.', 'fa-triangle-exclamation text-warning');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaid, isExpired]);

  // Format Timer mm:ss
  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 3. Helper Konfirmasi Pembayaran Sukses (HANYA KETIKA JANSPAYMENT MENGONFIRMASI LUNAS)
  const handlePaymentSuccess = (checkData) => {
    if (isPaidRef.current) return;
    isPaidRef.current = true;
    setIsPaid(true);

    const paymentMethodTitle = isGopay ? 'JansPayment GoPay (Otomatis)' : 'JansPayment QRIS (Otomatis)';
    const proofFileTitle = `JansPayment_${jansData?.paymentId || activeOrder.id}`;

    // Simpan transaksi lunas ke database & emit ke admin via socket
    const itemsList = activeOrder.items && activeOrder.items.length > 0
      ? activeOrder.items
      : [{ name: activeOrder.productName || 'Produk Digital', price: baseAmount, qty: 1 }];

    itemsList.forEach((it) => {
      createTransaction({
        id: activeOrder.id,
        productId: it.productId || it.id || null,
        productName: it.name || activeOrder.productName || 'Produk Digital',
        productDuration: it.duration || activeOrder.productDuration || 'Reguler',
        productCategory: it.category || 'Akun Premium',
        price: it.price || baseAmount,
        qty: it.qty || 1,
        total: payableAmount,
        customerName: activeOrder.customerName || 'Pelanggan',
        customerEmail: activeOrder.customerEmail || '-',
        customerPhone: activeOrder.customerPhone || '-',
        customerUsername: activeOrder.customerUsername || '',
        paymentMethod: paymentMethodTitle,
        paymentStatus: 'Lunas',
        isGatewayPaid: true,
        gatewayKey: JANSPAYMENT_API_KEY,
        status: 'processing',
        proofUrl: 'JANSPAYMENT_SETTLED',
        proofFileName: proofFileTitle,
        proofSize: `Lunas (${formatRupiah(payableAmount)})`,
        warrantyPeriod: 'Garansi Penuh'
      });
    });

    playUserNoticeSound();
    onShowToast?.(
      `🎉 Pembayaran JansPayment ${formatRupiah(payableAmount)} Sukses Terverifikasi! Pesanan otomatis masuk ke halaman admin.`,
      'fa-circle-check text-success'
    );
  };

  // 4. Polling Real-Time ke Server JansPayment Setiap 2.5 Detik (100% Otomatis Mendeteksi Saat Scan)
  useEffect(() => {
    if (!jansData?.paymentId || isPaid || isExpired) return;

    const pollInterval = setInterval(async () => {
      if (isPaidRef.current || isExpired) {
        clearInterval(pollInterval);
        return;
      }

      try {
        const check = await checkJansPaymentStatus({ paymentId: jansData.paymentId });
        if (check.paid) {
          clearInterval(pollInterval);
          handlePaymentSuccess(check);
        } else if (check.cancelled || check.expired) {
          clearInterval(pollInterval);
          setIsExpired(true);
          onShowToast?.('Sesi QRIS telah kadaluarsa atau dibatalkan oleh gateway', 'fa-triangle-exclamation');
        }
      } catch (err) {
        // Silent poll error
      }
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [jansData?.paymentId, isPaid, isExpired]);

  // 5. Cek saat user kembali ke tab browser (HANYA CEK STATUS ASLI JANSPAYMENT)
  useEffect(() => {
    if (isPaid) return;

    const handleFocusCheck = async () => {
      if (document.visibilityState === 'visible' && !isPaidRef.current && jansData?.paymentId) {
        try {
          const check = await checkJansPaymentStatus({ paymentId: jansData.paymentId });
          if (check.paid) {
            handlePaymentSuccess(check);
          }
        } catch {}
      }
    };

    document.addEventListener('visibilitychange', handleFocusCheck);
    window.addEventListener('focus', handleFocusCheck);

    return () => {
      document.removeEventListener('visibilitychange', handleFocusCheck);
      window.removeEventListener('focus', handleFocusCheck);
    };
  }, [jansData?.paymentId, isPaid]);

  // 6. Tombol Manual: Saya Sudah Bayar (100% Cek Real ke Server JansPayment, ANTI-TIPU)
  const handleCheckPayment = async () => {
    if (isExpired) {
      onShowToast?.('⚠️ Sesi QRIS sudah hangus karena melebihi batas waktu 6 menit.', 'fa-triangle-exclamation text-danger');
      return;
    }
    if (isVerifying || isPaid) return;
    if (!jansData?.paymentId) {
      onShowToast?.('Sesi QRIS sedang dimuat, mohon tunggu sebentar...', 'fa-clock');
      return;
    }

    setIsVerifying(true);
    try {
      const check = await checkJansPaymentStatus({ paymentId: jansData.paymentId });
      if (check.paid) {
        handlePaymentSuccess(check);
      } else {
        onShowToast?.(
          `Belum mendeteksi pembayaran di sistem JansPayment. Pastikan Anda telah menyelesaikan transfer persis Rp ${payableAmount.toLocaleString('id-ID')}.`,
          'fa-clock text-warning'
        );
      }
    } catch {
      onShowToast?.('Gagal menghubungi gateway, silakan coba sesaat lagi', 'fa-triangle-exclamation');
    } finally {
      setIsVerifying(false);
    }
  };

  // 7. Helper Copy Text, Download & Share
  const handleCopyText = async (text, label) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      onShowToast?.(`${label} (${text}) berhasil disalin!`, 'fa-circle-check text-success');
    } catch {
      onShowToast?.(`Gagal menyalin ${label}`, 'fa-triangle-exclamation');
    }
  };

  const handleDownload = (e) => {
    e.preventDefault();
    const qrUrl = dynamicQrisUrl || jansData?.qrImageUrl || '/Qris.png';
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = isGopay ? `GoPay-ChaizStore-${payableAmount}.png` : `QRIS-ChaizStore-${payableAmount}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast?.(
      isGopay
        ? `Foto QR GoPay (${formatRupiah(payableAmount)}) berhasil di-download!`
        : `Foto QRIS (${formatRupiah(payableAmount)}) berhasil di-download!`,
      'fa-circle-check text-success'
    );
  };

  const handleShare = async (e) => {
    e.preventDefault();
    const shareUrl = window.location.href;
    const shareData = {
      title: isGopay ? 'Pembayaran GoPay Instant ChaizStore' : 'Pembayaran QRIS ChaizStore',
      text: `Bayar pesanan #${activeOrder.id} sebesar ${formatRupiah(payableAmount)} melalui ${isGopay ? 'GoPay Instant' : 'QRIS'} ChaizStore:`,
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        onShowToast?.('Berhasil membagikan pembayaran!', 'fa-share-nodes text-success');
        return;
      } catch {
        // User cancelled share
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      onShowToast?.('Link pembayaran berhasil disalin ke clipboard!', 'fa-copy text-success');
    } catch {
      onShowToast?.('Gagal menyalin link pembayaran', 'fa-triangle-exclamation');
    }
  };

  // 8. Countdown Auto-Redirect Setelah Pembayaran Sukses Terverifikasi
  useEffect(() => {
    if (!isPaid) return;
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onSuccess) onSuccess(activeOrder);
          else if (onCancel) onCancel();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaid, activeOrder, onSuccess, onCancel]);

  return (
    <div className="qris-dedicated-page-container">
      <div className={`qris-dedicated-card ${isGopay ? 'gopay-dedicated-card' : ''} ${isPaid ? 'payment-succeed-mode' : ''}`}>
        {isPaid ? (
          /* ============================================================== */
          /* TAMPILAN SUKSES / SUCCEED CENTANG HIJAU */
          /* ============================================================== */
          <div className="qris-succeed-view animate-fade-in">
            <div className="qris-succeed-celebration">
              <div className="qris-succeed-icon-pulse">
                <i className="fa-solid fa-circle-check"></i>
              </div>
            </div>

            <div className="qris-succeed-badge">
              <i className="fa-solid fa-bolt-lightning text-warning"></i>
              <span>TRANSAKSI LUNAS &bull; SUCCEED</span>
            </div>

            <h2 className="qris-succeed-title">
              Pembayaran Berhasil!
            </h2>
            <p className="qris-succeed-desc">
              Hore! Pembayaran melalui <strong>{isGopay ? 'GoPay Instant' : 'QRIS Gateway'}</strong> sebesar{' '}
              <strong className="text-emerald">{formatRupiah(payableAmount)}</strong> telah resmi terverifikasi dan otomatis masuk ke sistem Admin ChaizStore.
            </p>

            <div className="qris-succeed-invoice-box">
              <div className="qris-invoice-row">
                <span className="qris-inv-lbl">Nomor Pesanan:</span>
                <strong className="qris-inv-val">#{activeOrder.id}</strong>
              </div>
              <div className="qris-invoice-row">
                <span className="qris-inv-lbl">Gateway ID:</span>
                <strong className="qris-inv-val font-mono" style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                  {jansData?.paymentId || 'JansPayment Official'}
                </strong>
              </div>
              <div className="qris-invoice-row">
                <span className="qris-inv-lbl">Metode:</span>
                <strong className="qris-inv-val text-cyan">
                  {isGopay ? 'GoPay Instant' : 'Dynamic QRIS'}
                </strong>
              </div>
              <div className="qris-invoice-row">
                <span className="qris-inv-lbl">Total Bayar:</span>
                <strong className="qris-inv-val text-emerald" style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                  {formatRupiah(payableAmount)}
                </strong>
              </div>
              <div className="qris-invoice-row">
                <span className="qris-inv-lbl">Status Pembayaran:</span>
                <span className="qris-status-pill-paid">
                  <i className="fa-solid fa-check-double"></i> Lunas (Otomatis)
                </span>
              </div>
            </div>

            <div className="qris-succeed-redirect-bar">
              <div className="qris-redirect-info">
                <span>Mengalihkan ke riwayat transaksi...</span>
                <span className="text-cyan font-mono">{redirectCountdown}s</span>
              </div>
              <div className="qris-redirect-progress-track">
                <div
                  className="qris-redirect-progress-fill"
                  style={{ width: `${Math.min(100, Math.max(0, ((4 - redirectCountdown) / 4) * 100))}%` }}
                ></div>
              </div>
            </div>

            <button
              type="button"
              className="btn-qris-view-tx-now"
              onClick={() => {
                if (onSuccess) onSuccess(activeOrder);
                else if (onCancel) onCancel();
              }}
            >
              <span>Buka Menu Transaksi Saya Sekarang</span>
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        ) : (
          /* ============================================================== */
          /* TAMPILAN NORMAL SCAN QRIS / GOPAY */
          /* ============================================================== */
          <>
            {/* Brand Header */}
            <div className="qris-page-header">
              {isGopay ? (
                <div className="qris-brand-row gopay-brand-pill">
                  <GopayLogo />
                  <span className="gopay-pill-tag">Instant Gateway</span>
                </div>
              ) : (
                <div className="qris-brand-row">
                  <QrisLogo />
                  <span className="qris-header-badge-tag">Semua Bank & E-Wallet</span>
                </div>
              )}
              <div className="qris-timer-pill" style={isExpired ? { background: 'rgba(239, 68, 68, 0.25)', color: '#ef4444', borderColor: '#ef4444' } : {}}>
                <i className={`fa-solid ${isExpired ? 'fa-hourglass-end' : 'fa-clock'}`}></i>
                <span>{isExpired ? 'Sesi Hangus (0:00)' : <>Sisa Waktu: <strong>{formatTimer(timerSeconds)}</strong></>}</span>
              </div>
            </div>

            {/* Khusus Mode GoPay: Tombol Buka Aplikasi GoPay & Nomor GoPay */}
            {isGopay && (
              <>
                {/* 1. Tombol Buka Aplikasi GoPay di HP */}
                <div className="gopay-direct-action-card">
                  <div className="gopay-action-title">
                    <i className="fa-solid fa-mobile-screen-button text-cyan"></i>
                    <span>Bayar Instan via Aplikasi GoPay:</span>
                  </div>
                  <a
                    href="gojek://gopay"
                    className="btn-open-gopay-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      setTimeout(() => {
                        window.open('https://gopay.co.id', '_blank');
                      }, 1200);
                    }}
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    <span>Buka Aplikasi GoPay Sekarang</span>
                  </a>
                  <small className="gopay-app-hint">
                    Khusus smartphone: klik untuk membuka GoPay langsung & selesaikan pembayaran.
                  </small>
                </div>

                {/* 2. Nomor Akun GoPay ChaizStore */}
                <div className="gopay-transfer-info-card">
                  <div className="gopay-info-left">
                    <span className="gopay-info-lbl">Nomor Akun GoPay ChaizStore:</span>
                    <strong className="gopay-info-num">0818-0973-0331</strong>
                    <span className="gopay-info-owner">a.n Haris / ChaizStore</span>
                  </div>
                  <button
                    type="button"
                    className="btn-copy-gopay-direct"
                    onClick={() => handleCopyText('081809730331', 'Nomor GoPay')}
                  >
                    <i className="fa-regular fa-copy"></i> Salin Nomor
                  </button>
                </div>
              </>
            )}

            {/* Dynamic QR Display (QRIS / GoPay) */}
            <div className={`qris-page-gateway-box ${isGopay ? 'gopay-qr-box' : ''}`}>
              <div className={`qris-gateway-merchant-badge ${isGopay ? 'gopay-badge-tag' : ''}`}>
                {isGopay ? (
                  <>
                    <i className="fa-solid fa-qrcode text-cyan"></i>
                    <span>SCAN VIA GOPAY &bull; CHAIZSTORE &bull; NMID: {MERCHANT_NMID}</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-shield-halved text-emerald"></i>
                    <span>CHAIZSTORE &bull; NMID: {MERCHANT_NMID}</span>
                  </>
                )}
              </div>

              <div className="qris-qr-display-wrap">
                {isGenerating ? (
                  <div className="qris-qr-loading">
                    <i className="fa-solid fa-spinner fa-spin text-cyan"></i>
                    <span>Menghubungi JansPayment Gateway...</span>
                  </div>
                ) : isExpired ? (
                  <div className="qris-qr-expired" style={{ padding: '36px 16px', textAlign: 'center', color: '#f87171' }}>
                    <i className="fa-solid fa-triangle-exclamation fa-3x" style={{ marginBottom: '12px', display: 'block', margin: '0 auto 12px' }}></i>
                    <strong style={{ fontSize: '1.05rem', display: 'block', color: '#f87171' }}>QRIS HANGUS (6 MENIT HABIS)</strong>
                    <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '6px', maxWidth: '280px', margin: '6px auto 0' }}>
                      Batas waktu transaksi 6 menit telah berakhir. Barcode dinonaktifkan demi keamanan. Silakan buat pesanan baru.
                    </p>
                  </div>
                ) : (
                  <img
                    src={dynamicQrisUrl || jansData?.qrImageUrl || '/Qris.png'}
                    alt={`${isGopay ? 'QR GoPay' : 'QRIS Dinamis'} ${formatRupiah(payableAmount)}`}
                    className="qris-qr-img"
                  />
                )}
              </div>

              {isGopay ? (
                <p className="gopay-qr-instruction">
                  Buka aplikasi GoPay di HP &gt; Pilih menu <strong>Bayar</strong> &gt; Arahkan ke kode QR di atas.
                </p>
              ) : (
                <p className="qris-instruction-text" style={{ fontSize: '0.78rem', color: 'var(--text-muted, #cbd5e1)', margin: '10px 0 0', lineHeight: 1.4 }}>
                  Scan kode QRIS di atas menggunakan <strong>BCA, Mandiri, BRI, BNI, DANA, GoPay, OVO, ShopeePay</strong> atau m-Banking Anda.
                </p>
              )}

              <div className="qris-gateway-key-tag">
                <i className="fa-solid fa-shield-halved text-emerald"></i>
                <span>JansPayment Realtime: {JANSPAYMENT_API_KEY.slice(0, 16)}...</span>
              </div>
            </div>

            {/* 1. Tombol Download & Share */}
            <div className="qris-action-btns-row">
              <button
                type="button"
                className={`btn-qris-action ${isGopay ? 'btn-gopay-download' : 'btn-qris-download'}`}
                onClick={handleDownload}
                title={isGopay ? 'Download QR GoPay' : 'Download Foto QRIS'}
              >
                <i className="fa-solid fa-download"></i>
                <span>Download QR</span>
              </button>

              <button
                type="button"
                className={`btn-qris-action ${isGopay ? 'btn-gopay-share' : 'btn-qris-share'}`}
                onClick={handleShare}
                title="Bagikan Pembayaran"
              >
                <i className="fa-solid fa-share-nodes"></i>
                <span>Share Link</span>
              </button>
            </div>

            {/* 2. Total Tagihan (Otomatis Mendeteksi Pembayaran) */}
            <div className={`qris-total-price-box ${isGopay ? 'gopay-total-box' : ''}`}>
              <div className="qris-total-inner">
                <span className="qris-total-label">
                  Total Tagihan {isGopay ? 'GoPay' : ''}:
                </span>
                <strong className={`qris-total-val ${isGopay ? 'gopay-total-val' : ''}`}>
                  {formatRupiah(payableAmount)}
                </strong>
              </div>
              {jansData?.uniqueCode > 0 && (
                <div style={{ fontSize: '0.74rem', color: '#38bdf8', marginTop: '6px', fontWeight: 600 }}>
                  <i className="fa-solid fa-circle-info"></i> Termasuk kode unik (+Rp {jansData.uniqueCode}) agar sistem mendeteksi pembayaran dalam 0 detik
                </div>
              )}
              <div className="qris-status-subtle pending" style={{ marginTop: '8px' }}>
                <i className="fa-solid fa-circle-notch fa-spin text-cyan"></i>
                <span>Menunggu Anda bayar di HP... (Otomatis Lunas &amp; Centang Hijau)</span>
              </div>
            </div>

            {/* 3. Tombol Batalkan */}
            <div className="qris-cancel-wrap" style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="btn-qris-cancel"
                onClick={onCancel}
              >
                <i className="fa-solid fa-xmark"></i>
                <span>Batalkan Pembayaran</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
