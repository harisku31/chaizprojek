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
  const [memberUser, setMemberUser] = useState('');
  const [memberPass, setMemberPass] = useState('');
  const [memberError, setMemberError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  // 1. Handle Login Google Asli
  const handleGoogleLogin = () => {
    setAuthError('');

    if (isIpAddressHostname()) {
      setAuthError('Google tidak mengizinkan login melalui IP Address lokal (192.168...). Silakan buka domain resmi (localhost / domain Vercel) atau gunakan akun khusus.');
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
          setAuthError(`Otorisasi Google belum aktif untuk origin: ${currentOrigin}. Pastikan "${currentOrigin}" sudah didaftarkan di Authorized JavaScript Origins di Google Cloud Console.`);
        } else {
          setAuthError('Jendela popup Google ditutup atau dibatalkan. Silakan klik tombol di bawah untuk mencoba kembali.');
        }
        onShowToast('Login Google dibatalkan atau terkendala izin.', 'fa-triangle-exclamation');
      }
    });
  };

  // 2. Handle Login Akun Khusus (Pajangan & Verifikasi Khusus - Rahasia / Tanpa Contoh)
  const handleMemberSubmit = (e) => {
    e.preventDefault();
    setMemberError('');

    const trimmedUser = memberUser.trim().toLowerCase();
    const trimmedPass = memberPass.trim();

    if (!trimmedUser || !trimmedPass) {
      setMemberError('Harap isi username dan password khusus.');
      return;
    }

    const found = MEMBER_CREDENTIALS.find(
      (m) =>
        m.username.toLowerCase() === trimmedUser &&
        m.password === trimmedPass
    );

    if (found) {
      const user = {
        role: 'member',
        name: found.name,
        email: `${found.username}@chaizstore.id`,
        avatarLetter: found.name.charAt(0).toUpperCase(),
        isMember: true,
        isGoogle: false,
        badge: found.badge || 'Akun Khusus',
        loginTime: new Date().toISOString()
      };
      onLoginSuccess(user);
      onClose();
      onShowToast(`Selamat datang kembali, ${found.name}!`, 'fa-crown text-warning');
    } else {
      // Pesan error umum tanpa membocorkan kredensial apa pun
      setMemberError('Username atau password khusus tidak sesuai.');
    }
  };

  return (
    <div className="login-gate-overlay" id="loginGateOverlay" style={{ display: 'flex' }}>
      <div className="login-gate-backdrop" onClick={onClose}></div>
      <div className="login-gate-card login-gate-card-clean">
        <style>{`
          /* Tombol Resmi Khas Google (Panjang, Putih Bersih, Logo Google Resmi) */
          .official-google-btn {
            width: 100%;
            height: 48px;
            background: #ffffff;
            border: 1px solid #dadce0;
            border-radius: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            cursor: pointer;
            padding: 0 20px;
            transition: all 0.22s ease-in-out;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
            position: relative;
            user-select: none;
            box-sizing: border-box;
          }

          .official-google-btn:hover {
            background: #f8fafd;
            border-color: #4285f4;
            box-shadow: 0 4px 14px rgba(66, 133, 244, 0.35);
            transform: translateY(-1px);
          }

          .official-google-btn:active {
            background: #eeeeee;
            transform: translateY(0);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          }

          .official-google-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
          }

          .google-btn-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            width: 22px;
            height: 22px;
          }

          .google-btn-label {
            font-family: 'Roboto', 'Google Sans', 'Outfit', system-ui, -apple-system, sans-serif;
            font-size: 14.5px;
            font-weight: 600;
            color: #1f1f1f;
            letter-spacing: 0.2px;
          }

          /* Divider Pemisah Bersih */
          .login-gate-divider {
            display: flex;
            align-items: center;
            text-align: center;
            margin: 20px 0 16px;
            width: 100%;
          }

          .login-gate-divider::before,
          .login-gate-divider::after {
            content: '';
            flex: 1;
            border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          }

          .login-gate-divider span {
            padding: 0 12px;
            font-size: 11px;
            font-weight: 600;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.8px;
          }

          /* Form Input Akun Khusus */
          .login-special-form {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 10px;
            text-align: left;
          }

          .special-input-group {
            position: relative;
            display: flex;
            align-items: center;
            width: 100%;
          }

          .special-input-icon {
            position: absolute;
            left: 14px;
            color: #64748b;
            font-size: 13px;
            pointer-events: none;
            transition: color 0.2s ease;
          }

          .special-input-field {
            width: 100%;
            height: 42px;
            background: #0f172a;
            border: 1px solid rgba(255, 255, 255, 0.14);
            border-radius: 10px;
            padding: 0 40px 0 38px;
            font-size: 13px;
            color: #f1f5f9;
            outline: none;
            transition: all 0.2s ease;
            box-sizing: border-box;
          }

          .special-input-field:focus {
            border-color: #a855f7;
            background: #111827;
            box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.2);
          }

          .special-input-field:focus + .special-input-icon,
          .special-input-group:focus-within .special-input-icon {
            color: #c084fc;
          }

          .special-pw-toggle {
            position: absolute;
            right: 12px;
            background: none;
            border: none;
            color: #64748b;
            font-size: 13px;
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s ease;
          }

          .special-pw-toggle:hover {
            color: #cbd5e1;
          }

          .special-error-box {
            background: rgba(239, 68, 68, 0.12);
            border: 1px solid rgba(239, 68, 68, 0.35);
            border-radius: 8px;
            padding: 8px 12px;
            color: #fca5a5;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .btn-special-submit {
            width: 100%;
            height: 40px;
            background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
            border: 1px solid rgba(168, 85, 247, 0.4);
            border-radius: 10px;
            color: #ffffff;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.22s ease;
            box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);
            margin-top: 2px;
          }

          .btn-special-submit:hover {
            background: linear-gradient(135deg, #9333ea 0%, #4f46e5 100%);
            box-shadow: 0 6px 18px rgba(124, 58, 237, 0.5);
            transform: translateY(-1px);
          }

          .btn-special-submit:active {
            transform: translateY(0);
          }

          .special-form-note {
            font-size: 11px;
            color: #64748b;
            text-align: center;
            margin: 4px 0 0 0;
            line-height: 1.4;
          }
        `}</style>

        {/* Tombol Tutup 'X' */}
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          title="Tutup Login"
          aria-label="Tutup Login"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Header Login */}
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
          <p>Silakan masuk untuk menikmati pesanan akun premium & transaksi bergaransi:</p>
        </div>

        {/* Pesan Alert jika Google Error / Belum terdaftar */}
        {authError && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '10px',
              padding: '10px 12px',
              marginBottom: '14px',
              fontSize: '0.8rem',
              color: '#fca5a5',
              lineHeight: '1.4',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
              <i className="fa-solid fa-circle-exclamation" style={{ color: '#ef4444' }}></i>
              <span>Info Otorisasi Google</span>
            </div>
            <p style={{ margin: 0 }}>{authError}</p>
          </div>
        )}

        {/* 1. TOMBOL PANJANG KHAS GOOGLE DENGAN LOGO RESMI */}
        <div style={{ width: '100%' }}>
          <button
            type="button"
            className="official-google-btn"
            onClick={handleGoogleLogin}
            disabled={isProcessingGoogle}
            title="Masuk dengan akun Google Anda"
          >
            <div className="google-btn-icon">
              {isProcessingGoogle ? (
                <i className="fa-solid fa-circle-notch fa-spin" style={{ color: '#4285f4' }}></i>
              ) : (
                <svg viewBox="0 0 24 24" width="22" height="22">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.28 21.43 7.37 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.32a7.18 7.18 0 0 1 0-4.64V6.58H1.25a11.97 11.97 0 0 0 0 10.84l4.03-3.1z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.28 2.57 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"/>
                </svg>
              )}
            </div>
            <span className="google-btn-label">
              {isProcessingGoogle ? 'Menghubungkan ke Google...' : 'Lanjutkan dengan Google'}
            </span>
          </button>
        </div>

        {/* PEMISAH (DIVIDER) */}
        <div className="login-gate-divider">
          <span>atau masuk akun khusus</span>
        </div>

        {/* 2. FORM LOGIN USERNAME & PASSWORD KHUSUS (PAJANGAN/INTERNAL - RAHASIA) */}
        <form onSubmit={handleMemberSubmit} className="login-special-form">
          <div className="special-input-group">
            <i className="fa-solid fa-user special-input-icon"></i>
            <input
              type="text"
              className="special-input-field"
              placeholder="Username khusus"
              value={memberUser}
              onChange={(e) => setMemberUser(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="special-input-group">
            <i className="fa-solid fa-lock special-input-icon"></i>
            <input
              type={showPassword ? 'text' : 'password'}
              className="special-input-field"
              placeholder="Password khusus"
              value={memberPass}
              onChange={(e) => setMemberPass(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="special-pw-toggle"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
            >
              <i className={showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
            </button>
          </div>

          {memberError && (
            <div className="special-error-box">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{memberError}</span>
            </div>
          )}

          <button type="submit" className="btn-special-submit">
            <i className="fa-solid fa-shield-halved"></i>
            <span>Masuk Akun Khusus</span>
          </button>

          <p className="special-form-note">
            <i className="fa-solid fa-lock"></i> Kredensial khusus bersifat privat untuk akses terdaftar.
          </p>
        </form>

        <div className="login-modal-footer-note">
          <i className="fa-solid fa-shield-check text-success"></i>
          <span>100% Legal & Bergaransi &bull; Transaksi Kilat 1-5 Menit</span>
        </div>
      </div>
    </div>
  );
}
