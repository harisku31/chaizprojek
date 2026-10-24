import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../utils/format';
import RobloxBuyModal, { ROBUX_PACKAGES } from './RobloxBuyModal';

export default function RobloxPage({
  onBackToTopUp,
  onBackToStore,
  onShowToast,
  authUser,
  isBanned = false,
  onOpenLogin,
  onOpenBannedModal
}) {
  const [isRobloxModalOpen, setIsRobloxModalOpen] = useState(false);
  const [modalPackageId, setModalPackageId] = useState('50r');
  const [pendingPackageId, setPendingPackageId] = useState(null);

  useEffect(() => {
    if (authUser && pendingPackageId) {
      setModalPackageId(pendingPackageId);
      setIsRobloxModalOpen(true);
      setPendingPackageId(null);
    }
  }, [authUser, pendingPackageId]);

  const handleOpenBuyModal = (pkgId = '50r') => {
    if (isBanned) {
      onOpenBannedModal?.();
      onShowToast?.('Akses Ditolak: Akun Anda sedang di-banned!', 'fa-ban text-danger');
      return;
    }

    if (!authUser) {
      setPendingPackageId(pkgId);
      onOpenLogin?.();
      onShowToast?.('Silakan login terlebih dahulu untuk membeli Robux!', 'fa-right-to-bracket text-warning');
      return;
    }

    setModalPackageId(pkgId);
    setIsRobloxModalOpen(true);
  };

  return (
    <div className="topup-page-container roblox-page-container">
      {/* 1. Header Navigation Bar & Bright Vibrant Hero Banner */}
      <section className="topup-page-hero roblox-page-hero">
        <div className="topup-hero-bg-wrap">
          <img
            src="/roblox.png"
            alt="ChaizStore Roblox Center Banner"
            className="topup-hero-bg-banner"
            loading="eager"
            style={{
              objectPosition: 'center 28%',
              filter: 'brightness(0.95) contrast(1.08) saturate(1.2)'
            }}
            onError={(e) => {
              if (!e.currentTarget.src.endsWith('.jpg')) {
                e.currentTarget.src = '/topup-banner.jpg';
              }
            }}
          />
          <div
            className="topup-hero-overlay"
            style={{
              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.88) 100%)'
            }}
          ></div>
        </div>

        <div className="container">
          {/* Breadcrumb Navigation Buttons */}
          <div
            className="steam-page-nav-bar"
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              marginBottom: '22px',
              flexWrap: 'wrap'
            }}
          >
            {onBackToTopUp && (
              <button
                type="button"
                className="btn btn-outline steam-btn-back"
                onClick={onBackToTopUp}
                title="Kembali ke Halaman Menu Top Up"
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '10px',
                  borderColor: 'rgba(56, 189, 248, 0.45)',
                  background: 'rgba(56, 189, 248, 0.08)',
                  color: '#38bdf8'
                }}
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Kembali ke Halaman Top Up</span>
              </button>
            )}

            {onBackToStore && (
              <button
                type="button"
                className="btn btn-outline steam-btn-back"
                onClick={onBackToStore}
                title="Kembali ke Beranda Toko"
                style={{
                  padding: '8px 14px',
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '10px',
                  opacity: 0.9
                }}
              >
                <i className="fa-solid fa-house"></i>
                <span>Beranda Toko</span>
              </button>
            )}

            <div className="topup-page-status-pill" style={{ marginLeft: 'auto' }}>
              <span className="live-status-dot" style={{ background: '#38bdf8', boxShadow: '0 0 12px #38bdf8' }}></span>
              <span>Layanan Robux Online 24 Jam</span>
            </div>
          </div>

          <div className="topup-hero-content">
            <div className="topup-hero-badge-row">
              <span
                className="topup-hero-badge"
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  borderColor: 'rgba(56, 189, 248, 0.45)',
                  color: '#38bdf8'
                }}
              >
                <i className="fa-solid fa-cube text-cyan"></i> CHAIZSTORE ROBLOX STORE
              </span>
              <span className="badge-status badge-bestseller" style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(168, 85, 247, 0.2)', borderColor: 'rgba(168, 85, 247, 0.4)', color: '#c084fc' }}>
                Via Username Resmi
              </span>
            </div>

            <h1 className="topup-hero-title">
              Pusat Robux Roblox <span style={{ color: '#38bdf8' }}>Via Username</span>
            </h1>
            <p className="topup-hero-sub">
              Top up saldo Robux legal, cepat, dan aman 100%. Cukup masukkan <strong>Username Roblox kamu</strong> tanpa perlu password akun. Saldo Robux langsung masuk kilat (estimasi 1–5 menit) ke avatar kamu!
            </p>

            <div className="topup-hero-stats">
              <div className="topup-stat-item">
                <i className="fa-solid fa-bolt text-warning"></i>
                <div>
                  <strong>1 - 5 Menit</strong>
                  <small>Proses Otomatis Kilat</small>
                </div>
              </div>
              <div className="topup-stat-item">
                <i className="fa-solid fa-user-ninja text-cyan"></i>
                <div>
                  <strong>Cukup Username</strong>
                  <small>Tanpa Password Akun</small>
                </div>
              </div>
              <div className="topup-stat-item">
                <i className="fa-solid fa-shield-halved text-emerald"></i>
                <div>
                  <strong>100% Legal & Safe</strong>
                  <small>Garansi Saldo Masuk</small>
                </div>
              </div>
              <div className="topup-stat-item">
                <i className="fa-brands fa-whatsapp text-success"></i>
                <div>
                  <strong>CS 24 Jam</strong>
                  <small>WhatsApp Ready</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Menu Estetika Rapi Ke Bawah (Tanpa Tombol Beli Duplikat) */}
      <section style={{ padding: '36px 0 48px' }}>
        <div className="container" style={{ maxWidth: '820px' }}>
          <div
            className="roblox-aesthetic-board"
            style={{
              background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.94) 0%, rgba(30, 27, 75, 0.9) 100%)',
              border: '1.5px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '20px',
              padding: '28px 32px',
              boxShadow: '0 16px 48px rgba(56, 189, 248, 0.12)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background Glow Accents */}
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '240px',
                height: '240px',
                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, transparent 70%)',
                pointerEvents: 'none'
              }}
            ></div>
            <div
              style={{
                position: 'absolute',
                bottom: '-40px',
                left: '-40px',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, transparent 70%)',
                pointerEvents: 'none'
              }}
            ></div>

            {/* Aesthetic Header */}
            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '18px', marginBottom: '20px', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '18px', color: '#38bdf8', letterSpacing: '0.5px', fontWeight: 700 }}>
                  ㅤ ╭   ──┼─   ▴  robux username  .ⓘ ›
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    className="badge-status"
                    style={{
                      fontSize: '11px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      borderColor: 'rgba(16, 185, 129, 0.4)',
                      color: '#34d399',
                      padding: '4px 10px',
                      borderRadius: '8px'
                    }}
                  >
                    <i className="fa-solid fa-lock"></i> No Password Required
                  </span>
                  <span
                    className="badge-status"
                    style={{
                      fontSize: '11px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      borderColor: 'rgba(56, 189, 248, 0.4)',
                      color: '#38bdf8',
                      padding: '4px 10px',
                      borderRadius: '8px'
                    }}
                  >
                    <i className="fa-solid fa-bolt"></i> Instant Order
                  </span>
                </div>
              </div>

              <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'rgba(255, 255, 255, 0.82)', lineHeight: 1.5 }}>
                Pilih nominal Robux yang kamu inginkan, lalu masukkan username akun Roblox kamu saat checkout.
              </p>
            </div>

            {/* List Rapi Ke Bawah (Tanpa Tombol Beli Duplikat, 1 Baris Rapih) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', zIndex: 2 }}>
              {ROBUX_PACKAGES.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => handleOpenBuyModal(pkg.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 22px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1.5px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.22s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, rgba(56, 189, 248, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)';
                    e.currentTarget.style.borderColor = '#38bdf8';
                    e.currentTarget.style.transform = 'translateX(6px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(56, 189, 248, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <i className="fa-solid fa-cube" style={{ color: '#38bdf8', fontSize: '16px' }}></i>
                    <span style={{ fontFamily: 'monospace', fontSize: '15px', color: '#ffffff', fontWeight: 600 }}>
                      ㅤ╎  {pkg.decoSymbol}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <strong style={{ color: '#fbbf24', fontSize: '16px', fontFamily: 'monospace', fontWeight: 700 }}>
                      ⦂ {formatRupiah(pkg.price)}
                    </strong>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38bdf8',
                        fontSize: '12px'
                      }}
                    >
                      <i className="fa-solid fa-arrow-right"></i>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Footer Hint */}
            <div
              style={{
                marginTop: '22px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                position: 'relative',
                zIndex: 2
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>
                <i className="fa-solid fa-circle-check text-cyan"></i>
                <span>Klik nominal di atas untuk langsung mengisi username Roblox kamu!</span>
              </div>
              <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 600 }}>
                <i className="fa-solid fa-bolt"></i> Estimasi Proses 1-5 Menit
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Modal Checkout Robux */}
      <RobloxBuyModal
        isOpen={isRobloxModalOpen}
        onClose={() => setIsRobloxModalOpen(false)}
        authUser={authUser}
        isBanned={isBanned}
        onOpenLogin={onOpenLogin}
        onOpenBannedModal={onOpenBannedModal}
        onShowToast={onShowToast}
        initialPackageId={modalPackageId}
      />
    </div>
  );
}
