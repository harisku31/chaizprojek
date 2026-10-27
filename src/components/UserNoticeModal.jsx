import React from 'react';

export default function UserNoticeModal({
  isOpen,
  notice,
  onContinue
}) {
  if (!isOpen || !notice) return null;

  return (
    <div className="user-notice-overlay active" role="dialog" aria-modal="true">
      <div className="user-notice-card">
        {/* Ambient Top Glow */}
        <div className="user-notice-glow"></div>

        {/* Header Icon */}
        <div className="user-notice-header">
          <div className="user-notice-icon-circle">
            <i className="fa-solid fa-bullhorn"></i>
            <div className="user-notice-pulse"></div>
          </div>

          <div className="user-notice-badge-wrap">
            <span className="user-notice-badge">
              <i className="fa-solid fa-shield-halved text-cyan"></i> PEMBERITAHUAN RESMI DARI ADMIN
            </span>
          </div>

          <h3 className="user-notice-title">
            {notice.title || 'Pemberitahuan Khusus dari Admin ChaizStore'}
          </h3>
          <p className="user-notice-sub">
            Admin ChaizStore telah mengirimkan catatan / pengumuman penting khusus untuk Anda.
          </p>
        </div>

        {/* Body Message */}
        <div className="user-notice-body">
          <div className="user-notice-message-box">
            <div className="message-box-header">
              <div className="admin-chip">
                <img src="/chaizz.png" alt="Admin" className="admin-chip-img" />
                <span className="admin-chip-name">Owner / Admin ChaizStore</span>
              </div>
              <small className="notice-time">
                {new Date(notice.sentAt || Date.now()).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}{' '}
                WIB
              </small>
            </div>

            <div className="message-box-content">
              <i className="fa-solid fa-quote-left quote-icon"></i>
              <p className="message-text-content">{notice.message}</p>
            </div>
          </div>

          <p className="user-notice-hint">
            <i className="fa-solid fa-circle-info text-cyan"></i> Silakan baca catatan di atas, kemudian klik tombol <strong>Continue</strong> di bawah untuk melanjutkan aktivitas Anda di toko.
          </p>
        </div>

        {/* Action Button: Continue */}
        <div className="user-notice-actions">
          <button
            type="button"
            className="btn-notice-continue"
            onClick={onContinue}
          >
            <span>Continue</span>
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
