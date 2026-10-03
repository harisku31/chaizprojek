import React from 'react';

export default function UnbannedNoticeModal({ isOpen, onClose, userName }) {
  if (!isOpen) return null;

  return (
    <div className="banned-window-backdrop" onClick={onClose} style={{ zIndex: 999999 }}>
      <div
        className="banned-window-box"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          border: '1.5px solid rgba(16, 185, 129, 0.65)',
          boxShadow: '0 0 50px rgba(16, 185, 129, 0.3), 0 25px 70px rgba(0, 0, 0, 0.85)'
        }}
      >
        {/* OS Window Header / Titlebar */}
        <div className="banned-window-titlebar">
          <div className="window-controls-left">
            <span
              className="window-traffic-dot dot-green"
              title="Tutup Jendela"
              onClick={onClose}
              style={{ cursor: 'pointer' }}
            ></span>
            <span className="window-traffic-dot dot-yellow"></span>
            <span className="window-traffic-dot dot-red" onClick={onClose} style={{ cursor: 'pointer' }}></span>
          </div>

          <div className="window-titlebar-title" style={{ color: '#6ee7b7' }}>
            <i className="fa-solid fa-circle-check text-success"></i>
            <span>Jendela Sistem: Akun Anda Telah Dipulihkan</span>
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
            <span
              className="banned-window-badge"
              style={{
                background: 'rgba(16, 185, 129, 0.18)',
                color: '#6ee7b7',
                border: '1px solid rgba(16, 185, 129, 0.45)'
              }}
            >
              <i className="fa-solid fa-shield-heart"></i>
              JENDELA STATUS: BEBAS SANKSI (PULIH)
            </span>
          </div>

          {/* Main Headline - Exact user-requested phrasing */}
          <h2
            className="banned-window-heading"
            style={{ color: '#a7f3d0' }}
          >
            Akun Anda Tidak Di-banned Lagi
          </h2>

          <p className="banned-window-subheading">
            Sanksi banned telah dicabut oleh Admin ChaizStore. Akses akun Anda telah dipulihkan sepenuhnya.
          </p>

          {/* Content Card */}
          <div
            className="banned-window-card"
            style={{
              border: '1px solid rgba(16, 185, 129, 0.35)',
              boxShadow: 'inset 0 0 20px rgba(16, 185, 129, 0.08)'
            }}
          >
            {/* Status Restore Box */}
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '14px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '3px' }}>
                <i className="fa-solid fa-circle-check"></i> Status Pemulihan Akun
              </div>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: '700' }}>
                Akses Diterima & Pulih Normal (100% Aktif)
              </div>
            </div>

            {/* Detail Rows */}
            <div className="window-details-grid">
              {userName && (
                <div className="window-detail-row">
                  <span className="window-detail-label">Pengguna:</span>
                  <span className="window-detail-value" style={{ color: '#ffffff' }}>
                    {userName}
                  </span>
                </div>
              )}

              <div className="window-detail-row">
                <span className="window-detail-label">Status Sanksi:</span>
                <span className="window-detail-value" style={{ color: '#34d399' }}>
                  <i className="fa-solid fa-check"></i> Sanksi Banned Telah Dicabut
                </span>
              </div>

              <div className="window-detail-row">
                <span className="window-detail-label">Beli Produk & Checkout:</span>
                <span className="window-detail-value" style={{ color: '#38bdf8' }}>
                  <i className="fa-solid fa-circle-check"></i> Diizinkan (Aktif)
                </span>
              </div>

              <div className="window-detail-row">
                <span className="window-detail-label">Keranjang Belanja:</span>
                <span className="window-detail-value" style={{ color: '#38bdf8' }}>
                  <i className="fa-solid fa-circle-check"></i> Diizinkan (Aktif)
                </span>
              </div>

              <div className="window-detail-row">
                <span className="window-detail-label">Customer Service AI:</span>
                <span className="window-detail-value" style={{ color: '#38bdf8' }}>
                  <i className="fa-solid fa-circle-check"></i> Diizinkan (Aktif)
                </span>
              </div>

              <div className="window-detail-row">
                <span className="window-detail-label">Catatan Resmi:</span>
                <span className="window-detail-value" style={{ color: '#cbd5e1', fontWeight: 'normal', fontSize: '12px' }}>
                  Akun Anda sudah tidak di-banned lagi. Anda dapat menikmati seluruh layanan pembelian akun premium, memasukkan produk ke keranjang, dan berkonsultasi dengan CS AI dengan lancar.
                </span>
              </div>
            </div>
          </div>

          {/* Window Footer Actions */}
          <div className="window-actions-row">
            <button
              type="button"
              className="btn-window-wa"
              onClick={onClose}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#fff',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)'
              }}
            >
              <i className="fa-solid fa-bag-shopping"></i>
              <span>Mulai Berbelanja Sekarang</span>
            </button>
            <button
              type="button"
              className="btn-window-close"
              onClick={onClose}
              title="Tutup Jendela"
            >
              Tutup Jendela
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
