import React, { useState } from 'react';
import {
  getActiveGoogleClientId,
  triggerGooglePopupLogin,
  isGoogleAvailable,
  isIpAddressHostname
} from '../utils/googleAuth';
import { MEMBER_CREDENTIALS } from '../data/config';

export default function LoginGateModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onShowToast
}) {
  const [isProcessingGoogle, setIsProcessingGoogle] = useState(false);
  const [authError, setAuthError] = useState('');
  const [customName, setCustomName] = useState('');
  const [showMemberLogin, setShowMemberLogin] = useState(false);
  const [memberUser, setMemberUser] = useState('');
  const [memberPass, setMemberPass] = useState('');
  const [memberError, setMemberError] = useState('');

  if (!isOpen) return null;

  // 1. Handle Login Google Asli
  const handleGoogleLogin = () => {
    setAuthError('');

    if (isIpAddressHostname()) {
      setAuthError('Google tidak mengizinkan login melalui IP Address lokal (192.168...). Silakan klik "Masuk sebagai Pengguna Biasa" di bawah ini, atau buka domain Vercel resmi.');
      onShowToast('Google melarang login via IP lokal.', 'fa-triangle-exclamation');
      return;
    }

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
        const errStr = String(err?.message || err || '');
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
        if (errStr.includes('origin_mismatch') || errStr.includes('unregistered') || errStr.includes('policy')) {
          setAuthError(`Otorisasi Google belum aktif untuk origin: ${currentOrigin}. Pastikan "${currentOrigin}" sudah didaftarkan di Authorized JavaScript Origins di Google Cloud Console. Atau kamu bisa langsung klik "Masuk sebagai Pengguna Biasa" di bawah!`);
        } else {
          setAuthError('Jendela popup Google ditutup atau dibatalkan. Kamu bisa coba lagi atau masuk langsung sebagai Pengguna Biasa.');
        }
        onShowToast('Login Google dibatalkan atau terkendala izin.', 'fa-triangle-exclamation');
      }
    });
  };

  // 2. Handle Masuk sebagai Pengguna Biasa (Tamu / Nama Sendiri)
  const handleGuestLogin = () => {
    const displayName = customName.trim() || 'Pengguna Chaiz';
    const user = {
      role: 'guest',
      name: displayName,
      email: `${displayName.toLowerCase().replace(/\s+/g, '')}@chaizstore.id`,
      avatarLetter: displayName.charAt(0).toUpperCase(),
      isMember: false,
      isGoogle: false,
      loginTime: new Date().toISOString()
    };
    onLoginSuccess(user);
    onClose();
    onShowToast(`Selamat datang, ${displayName}! Selamat berbelanja.`, 'fa-circle-check');
  };

  // 3. Handle Login Member VIP
  const handleMemberSubmit = (e) => {
    e.preventDefault();
    setMemberError('');
    const found = MEMBER_CREDENTIALS.find(
      (m) =>
        m.username.toLowerCase() === memberUser.trim().toLowerCase() &&
        m.password === memberPass.trim()
    );

    if (found) {
      const user = {
        role: 'member',
        name: found.name,
        email: `${found.username}@chaizvip.id`,
        avatarLetter: found.name.charAt(0).toUpperCase(),
        isMember: true,
        isGoogle: false,
        badge: found.badge,
        loginTime: new Date().toISOString()
      };
      onLoginSuccess(user);
      onClose();
      onShowToast(`Selamat datang kembali, ${found.name}!`, 'fa-crown text-warning');
    } else {
      setMemberError('Username atau password member salah (Coba: member / 123)');
    }
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
          <p>Pilih metode masuk untuk menikmati layanan akun premium bergaransi:</p>
        </div>

        {/* Pesan Edukasi jika Google Error / Belum terdaftar */}
        {authError && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '14px',
              fontSize: '0.82rem',
              color: '#fca5a5',
              lineHeight: '1.4',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <i className="fa-solid fa-circle-exclamation" style={{ color: '#ef4444' }}></i>
              <span>Info Otorisasi Google</span>
            </div>
            <p style={{ margin: 0 }}>{authError}</p>
          </div>
        )}

        {/* Tombol Login */}
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
            <span>atau masuk instan</span>
          </div>

          {/* Input Opsional Nama untuk Pengguna Biasa */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
            <input
              type="text"
              className="form-input"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                padding: '9px 12px',
                fontSize: '0.85rem'
              }}
              placeholder="Ketik nama kamu (opsional, contoh: Haris)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleGuestLogin();
                }
              }}
            />
          </div>

          {/* Tombol 2: Masuk Sebagai Pengguna Biasa (100% Berhasil) */}
          <button
            type="button"
            className="btn-login-main btn-login-guest"
            onClick={handleGuestLogin}
          >
            <div className="login-btn-icon-wrapper guest-icon">
              <i className="fa-solid fa-bolt text-warning"></i>
            </div>
            <div className="login-btn-text">
              <span className="login-btn-title">
                {customName.trim() ? `Masuk sebagai "${customName.trim()}"` : 'Masuk sebagai Pengguna Biasa'}
              </span>
              <span className="login-btn-desc">1-Klik langsung belanja tanpa login akun luar</span>
            </div>
            <i className="fa-solid fa-arrow-right login-btn-arrow"></i>
          </button>
        </div>

        {/* Accordion / Opsi Member VIP */}
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setShowMemberLogin(!showMemberLogin)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '0.8rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            <i className="fa-solid fa-crown text-warning"></i> {showMemberLogin ? 'Sembunyikan Login Member VIP' : 'Punya akun Member VIP? Masuk di sini'}
          </button>

          {showMemberLogin && (
            <form onSubmit={handleMemberSubmit} style={{ marginTop: '12px', textAlign: 'left' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Username (contoh: member / admin)"
                  value={memberUser}
                  onChange={(e) => setMemberUser(e.target.value)}
                  style={{ fontSize: '0.85rem', padding: '8px 10px' }}
                  required
                />
                <input
                  type="password"
                  className="form-input"
                  placeholder="Password (contoh: 123)"
                  value={memberPass}
                  onChange={(e) => setMemberPass(e.target.value)}
                  style={{ fontSize: '0.85rem', padding: '8px 10px' }}
                  required
                />
                {memberError && (
                  <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>{memberError}</span>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '8px', fontSize: '0.85rem' }}
                >
                  Masuk Akun Member VIP
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="login-modal-footer-note">
          <i className="fa-solid fa-shield-check text-success"></i>
          <span>100% Legal & Bergaransi &bull; Transaksi Kilat 1-5 Menit</span>
        </div>
      </div>
    </div>
  );
}

