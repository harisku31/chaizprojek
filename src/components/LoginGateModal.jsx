import React, { useState } from 'react';
import {
  getActiveGoogleClientId,
  triggerGooglePopupLogin,
  isGoogleAvailable
} from '../utils/googleAuth';

export default function LoginGateModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onShowToast
}) {
  const [isProcessingGoogle, setIsProcessingGoogle] = useState(false);

  if (!isOpen) return null;

  // 1. Handle Login Google Asli
  const handleGoogleLogin = () => {
    const clientId = getActiveGoogleClientId();

    if (!isGoogleAvailable()) {
      onShowToast('Memuat Google Identity Services... Mohon tunggu 1 detik.', 'fa-circle-notch fa-spin');
      return;
    }

    setIsProcessingGoogle(true);
    triggerGooglePopupLogin({
      clientId,
      onSuccess: (googleUser) => {
        setIsProcessingGoogle(false);
        onLoginSuccess(googleUser);
        onClose();
        onShowToast(`Selamat datang, ${googleUser.name}! Login Google berhasil.`, 'fa-brands fa-google');
      },
      onError: (err) => {
        setIsProcessingGoogle(false);
        console.error('Google login error:', err);
        onShowToast('Jendela popup Google ditutup atau dibatalkan.', 'fa-triangle-exclamation');
      }
    });
  };

  // 2. Handle Masuk sebagai Pengguna Biasa (Tamu)
  const handleGuestLogin = () => {
    const user = {
      role: 'guest',
      name: 'Pengguna Chaiz',
      email: 'user@chaizstore.id',
      avatarLetter: 'U',
      isMember: false,
      isGoogle: false,
      loginTime: new Date().toISOString()
    };
    onLoginSuccess(user);
    onClose();
    onShowToast('Selamat datang di ChaizStore! Selamat berbelanja.', 'fa-circle-check');
  };

  return (
    <div className="login-gate-overlay" id="loginGateOverlay" style={{ display: 'flex' }}>
      <div className="login-gate-backdrop" onClick={onClose}></div>
      <div className="login-gate-card login-gate-card-clean">
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          title="Tutup Login"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Header Bersih */}
        <div className="login-header">
          <div className="login-brand">
            <span className="logo-badge">
              <img src="/chaizz.png" alt="ChaizStore" className="logo-img" />
            </span>
            <div className="login-brand-meta">
              <span className="brand-name">Chaiz<span>Store</span></span>
            </div>
          </div>
          <h2>Masuk ke ChaizStore</h2>
          <p>Silakan masuk menggunakan akun Google Anda atau masuk sebagai pengguna biasa:</p>
        </div>

        {/* Hanya 2 Opsi Tombol Bersih */}
        <div className="login-buttons-stack">
          {/* Tombol 1: Login dengan Google Asli */}
          <button
            type="button"
            className="btn-login-main btn-login-google"
            onClick={handleGoogleLogin}
            disabled={isProcessingGoogle}
          >
            <div className="login-btn-icon-wrapper google-icon-wrap">
              {isProcessingGoogle ? (
                <i className="fa-solid fa-circle-notch fa-spin text-primary"></i>
              ) : (
                <svg className="google-svg-logo" viewBox="0 0 24 24" width="24" height="24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.28 21.43 7.37 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.32a7.18 7.18 0 0 1 0-4.64V6.58H1.25a11.97 11.97 0 0 0 0 10.84l4.03-3.1z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.28 2.57 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"/>
                </svg>
              )}
            </div>
            <div className="login-btn-text">
              <span className="login-btn-title">Lanjutkan dengan Google</span>
              <span className="login-btn-desc">
                {isProcessingGoogle
                  ? 'Membuka jendela resmi Google...'
                  : 'Masuk instan dengan akun Gmail Anda'}
              </span>
            </div>
            <i className="fa-solid fa-arrow-right login-btn-arrow"></i>
          </button>

          <div className="login-options-divider">
            <span>atau</span>
          </div>

          {/* Tombol 2: Masuk Sebagai Pengguna Biasa */}
          <button
            type="button"
            className="btn-login-main btn-login-guest"
            onClick={handleGuestLogin}
          >
            <div className="login-btn-icon-wrapper guest-icon">
              <i className="fa-solid fa-user"></i>
            </div>
            <div className="login-btn-text">
              <span className="login-btn-title">Masuk sebagai Pengguna Biasa</span>
              <span className="login-btn-desc">Langsung akses katalog dan belanja tanpa Google</span>
            </div>
            <i className="fa-solid fa-arrow-right login-btn-arrow"></i>
          </button>
        </div>

        <div className="login-modal-footer-note">
          <i className="fa-solid fa-shield-check text-success"></i>
          <span>100% Legal & Bergaransi &bull; Transaksi Kilat 1-5 Menit</span>
        </div>
      </div>
    </div>
  );
}
