import React, { useState, useEffect } from 'react';

export default function BannedNoticeModal({ banInfo, onClose, onLogout }) {
  if (!banInfo || !banInfo.isBanned) return null;

  const isPermanent = banInfo.banType === 'permanent';
  const [, setTick] = useState(0);

  // Live countdown ticker every 1 second
  useEffect(() => {
    if (isPermanent) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPermanent]);

  const formatRemainingLive = (untilIso) => {
    if (!untilIso) return '-';
    try {
      const diffMs = new Date(untilIso).getTime() - Date.now();
      if (diffMs <= 0) return 'Masa sanksi banned telah berakhir';
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const parts = [];
      if (days > 0) parts.push(`${days} Hari`);
      if (hours > 0 || days > 0) parts.push(`${hours} Jam`);
      parts.push(`${minutes} Menit`);
      parts.push(`${seconds} Detik`);

      return parts.join(' ');
    } catch {
      return '-';
    }
  };

  const handleContactAdmin = () => {
    const dur = isPermanent ? 'Permanen' : (banInfo.durationText || 'Sementara');
    const msg = encodeURIComponent(
      `Halo Admin ChaizStore, saya ingin mengonfirmasi / banding mengenai akun saya yang terkena Banned (${dur}). Alasan: "${banInfo.reason || '-'}"`
    );
    window.open(`https://wa.me/6287795172347?text=${msg}`, '_blank');
  };

  const durationLabel = banInfo.durationText || 'Sementara';
  const remainingLive = formatRemainingLive(banInfo.bannedUntil);

  return (
    <div className="banned-window-backdrop" onClick={onClose}>
      <div
        className={`banned-window-box ${isPermanent ? 'window-type-permanent' : 'window-type-temporary'}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* OS Window Header / Titlebar */}
        <div className="banned-window-titlebar">
          <div className="window-controls-left">
            <span className="window-traffic-dot dot-red" title="Tutup Jendela" onClick={onClose}></span>
            <span className="window-traffic-dot dot-yellow"></span>
            <span className="window-traffic-dot dot-green"></span>
          </div>

          <div className="window-titlebar-title">
            <i className={isPermanent ? 'fa-solid fa-shield-virus text-danger' : 'fa-solid fa-user-lock text-warning'}></i>
            <span>
              {isPermanent
                ? 'Jendela Sistem: Banned Permanen - Akses Not Failed'
                : 'Jendela Sistem: Peringatan Banned Sementara'}
            </span>
          </div>

          <button
            type="button"
            className="window-titlebar-close"
            onClick={onClose}
            title="Tutup Jendela"
          >
            <i className="fa-solid fa-xmark"></i>
            <span>Tutup</span>
          </button>
        </div>

        {/* Window Body Content */}
        <div className="banned-window-body">
          {/* Top Status Badge */}
          <div className="banned-window-badge-wrap">
            <span className={`banned-window-badge ${isPermanent ? 'badge-perm' : 'badge-temp'}`}>
              <i className={isPermanent ? 'fa-solid fa-ban' : 'fa-solid fa-clock-rotate-left'}></i>
              {isPermanent ? 'Jendela Status: Banned Permanen' : 'Jendela Status: Banned Sementara'}
            </span>
          </div>

          {/* Main Headline - Exact user-requested phrasing */}
          <h2 className={`banned-window-heading ${isPermanent ? 'heading-perm' : 'heading-temp'}`}>
            {isPermanent
              ? 'Anda di-banned permanen, akses not failed'
              : `Anda sedang di-banned sementara`}
          </h2>

          <p className="banned-window-subheading">
            {isPermanent
              ? 'Akses Not Failed / Access Denied. Sanksi pembatasan akun tingkat permanen oleh Admin ChaizStore.'
              : `Sanksi pembatasan akun aktif selama ${durationLabel}.`}
          </p>

          {/* Content Card */}
          <div className={`banned-window-card ${isPermanent ? 'card-perm' : 'card-temp'}`}>
            {/* Live Ticker for Temporary Ban */}
            {!isPermanent && (
              <div className="window-countdown-box">
                <span className="window-countdown-label">
                  <i className="fa-solid fa-hourglass-half"></i> Hitung Mundur Sisa Waktu Banned
                </span>
                <span className="window-countdown-digits">{remainingLive}</span>
              </div>
            )}

            {/* Permanent Ban Access Not Failed Alert Box */}
            {isPermanent && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '14px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '11px', color: '#fca5a5', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '3px' }}>
                  <i className="fa-solid fa-triangle-exclamation"></i> Security Notice Code: 403_ACCESS_NOT_FAILED
                </div>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: '700' }}>
                  Akses Not Failed (Akses Ditolak Secara Mutlak)
                </div>
              </div>
            )}

            {/* Detail Rows */}
            <div className="window-details-grid">
              {(banInfo.userName || banInfo.userEmail) && (
                <div className="window-detail-row">
                  <span className="window-detail-label">Akun Terdampak:</span>
                  <span className="window-detail-value">
                    {banInfo.userName || ''} {banInfo.userEmail ? `(${banInfo.userEmail})` : ''}
                  </span>
                </div>
              )}

              <div className="window-detail-row">
                <span className="window-detail-label">Status Sanksi:</span>
                <span className="window-detail-value" style={{ color: isPermanent ? '#f87171' : '#fbbf24' }}>
                  {isPermanent ? 'Banned Permanen (Seumur Hidup)' : `Banned Sementara (${durationLabel})`}
                </span>
              </div>

              {!isPermanent && banInfo.bannedUntil && (
                <div className="window-detail-row">
                  <span className="window-detail-label">Akses Dibuka Otomatis:</span>
                  <span className="window-detail-value" style={{ color: '#38bdf8' }}>
                    {new Date(banInfo.bannedUntil).toLocaleString('id-ID')} WIB
                  </span>
                </div>
              )}

              <div className="window-detail-row">
                <span className="window-detail-label">Alasan Sanksi:</span>
                <span className="window-detail-value" style={{ fontStyle: 'italic', color: '#ffffff' }}>
                  "{banInfo.reason || 'Pelanggaran ketentuan layanan toko'}"
                </span>
              </div>

              <div className="window-detail-row">
                <span className="window-detail-label">Pembatasan Fitur:</span>
                <span className="window-detail-value" style={{ color: '#f87171', fontWeight: '700' }}>
                  Beli (Ditolak) &bull; Tanya AI (Ditolak) &bull; Keranjang (Ditolak)
                </span>
              </div>

              <div className="window-detail-row">
                <span className="window-detail-label">Opsi Pengguna:</span>
                <span className="window-detail-value" style={{ color: '#cbd5e1', fontWeight: '600' }}>
                  Hanya diperbolehkan Log Out / Keluar Akun
                </span>
              </div>
            </div>
          </div>

          {/* Window Footer Actions */}
          <div className="window-actions-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button
                type="button"
                className="btn-window-wa"
                onClick={handleContactAdmin}
                title="Hubungi Admin WhatsApp untuk Klarifikasi / Banding"
                style={{ flex: 1 }}
              >
                <i className="fa-brands fa-whatsapp" style={{ fontSize: '16px' }}></i>
                <span>Hubungi Admin WA (Banding)</span>
              </button>
              <button
                type="button"
                className="btn-window-close"
                onClick={onClose}
                title="Tutup Jendela Peringatan"
              >
                Tutup Jendela
              </button>
            </div>

            {onLogout && (
              <button
                type="button"
                className="btn-window-logout"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(239, 68, 68, 0.45)',
                  background: 'rgba(239, 68, 68, 0.16)',
                  color: '#fca5a5',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fa-solid fa-right-from-bracket text-danger"></i>
                <span>Keluar dari Akun (Log Out)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
