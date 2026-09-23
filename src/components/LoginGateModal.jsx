import React, { useState } from 'react';
import { MEMBER_CREDENTIALS } from '../data/config';

export default function LoginGateModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onShowToast
}) {
  const [view, setView] = useState('selection'); // 'selection' | 'member'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [shake, setShake] = useState(false);

  if (!isOpen) return null;

  const handleLoginAsChaiz = () => {
    const user = {
      role: 'chaiz',
      name: 'Chaiz',
      email: 'chaiz@chaizstore.id',
      avatarLetter: 'C',
      isMember: false,
      loginTime: new Date().toISOString()
    };
    onLoginSuccess(user);
    onClose();
    onShowToast('Selamat datang, Chaiz! Selamat berbelanja di ChaizStore.', 'fa-circle-check');
  };

  const handleMemberLogin = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const u = username.trim();
    const p = password.trim();

    if (!u) {
      onShowToast('Silakan masukkan username member Anda!', 'fa-triangle-exclamation');
      return;
    }

    if (!p) {
      onShowToast('Silakan masukkan password akun member!', 'fa-triangle-exclamation');
      return;
    }

    const matchedMember = MEMBER_CREDENTIALS.find(
      (acc) => acc.username.toLowerCase() === u.toLowerCase() && acc.password === p
    );

    if (!matchedMember) {
      setErrorMessage('Username atau password salah! Akses member ditolak.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      onShowToast('Username atau password salah! Akses ditolak.', 'fa-circle-xmark');
      setPassword('');
      return;
    }

    const user = {
      role: 'member',
      name: matchedMember.name || u,
      email: `${u.toLowerCase()}@member.vip`,
      avatarLetter: (matchedMember.name || u).charAt(0).toUpperCase(),
      isMember: true,
      badge: matchedMember.badge || 'VIP Member',
      loginTime: new Date().toISOString()
    };

    onLoginSuccess(user);
    onClose();
    onShowToast(`Selamat datang VIP Member, ${user.name}!`, 'fa-crown');
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setErrorMessage('');
    setShowPassword(false);
    setView('selection');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="login-gate-overlay" id="loginGateOverlay" style={{ display: 'flex' }}>
      <div className="login-gate-backdrop" onClick={handleClose}></div>
      <div className={`login-gate-card ${shake ? 'shake-card' : ''}`}>
        <button
          type="button"
          className="modal-close-btn"
          onClick={handleClose}
          title="Tutup Login"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="login-badge-tag">
          <i className="fa-solid fa-sparkles text-warning"></i> ChaizStore Portal
        </div>

        {/* Header */}
        <div className="login-header">
          <div className="login-brand">
            <span className="logo-badge">
              <img src="/chaizz.png" alt="ChaizStore" className="logo-img" />
            </span>
            <div className="login-brand-meta">
              <span className="brand-name">Chaiz<span>Store</span></span>
              <span className="brand-subtitle">Official Premium Store</span>
            </div>
          </div>
          <h2>Selamat Datang</h2>
          <p>Silakan pilih akses login untuk masuk ke toko ChaizStore:</p>
        </div>

        {/* View 1: Selection */}
        {view === 'selection' ? (
          <div className="login-selection-view">
            <div className="login-buttons-stack">
              <button
                type="button"
                className="btn-login-main btn-login-chaiz"
                onClick={handleLoginAsChaiz}
              >
                <div className="login-btn-icon-wrapper chaiz-icon">
                  <i className="fa-solid fa-circle-user"></i>
                </div>
                <div className="login-btn-text">
                  <span className="login-btn-title">Login sebagai Chaiz</span>
                  <span className="login-btn-desc">Akses cepat langsung belanja akun premium</span>
                </div>
                <i className="fa-solid fa-arrow-right login-btn-arrow"></i>
              </button>

              <button
                type="button"
                className="btn-login-main btn-login-vip"
                onClick={() => setView('member')}
              >
                <div className="login-btn-icon-wrapper vip-icon">
                  <i className="fa-solid fa-crown"></i>
                </div>
                <div className="login-btn-text">
                  <span className="login-btn-title">Login Member Khusus</span>
                  <span className="login-btn-desc">Akses akun VIP & harga khusus member</span>
                </div>
                <i className="fa-solid fa-chevron-right login-btn-arrow"></i>
              </button>
            </div>

            <div className="login-modal-footer-note">
              <i className="fa-solid fa-shield-check text-success"></i>
              <span>100% Legal & Bergaransi &bull; Kilat 1-5 Menit Langsung Aktif</span>
            </div>
          </div>
        ) : (
          /* View 2: VIP Member Form */
          <div className="member-login-view">
            <div className="member-view-header">
              <span className="badge-vip-tag">
                <i className="fa-solid fa-crown text-warning"></i> VIP Member Portal
              </span>
              <h3>Masuk Akun Member Khusus</h3>
              <p>Silakan masukkan username dan password akun member Anda:</p>
            </div>

            <form onSubmit={handleMemberLogin}>
              <div className="form-group text-left">
                <label className="form-label" htmlFor="memberUsername">
                  <i className="fa-solid fa-user"></i> Username Member:
                </label>
                <input
                  type="text"
                  id="memberUsername"
                  className="form-input"
                  placeholder="Masukkan username member..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="form-group text-left">
                <label className="form-label" htmlFor="memberPassword">
                  <i className="fa-solid fa-key"></i> Password:
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="memberPassword"
                    className="form-input"
                    placeholder="Masukkan password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="btn-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    title="Tampilkan / Sembunyikan Password"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="member-login-error">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="member-form-actions">
                <button type="submit" className="btn btn-primary btn-block btn-lg">
                  <i className="fa-solid fa-arrow-right-to-bracket"></i> Masuk Sebagai Member Khusus
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-block"
                  onClick={() => {
                    setErrorMessage('');
                    setView('selection');
                  }}
                >
                  <i className="fa-solid fa-arrow-left"></i> Kembali ke Pilihan Login
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
