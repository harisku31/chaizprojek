import React, { useState, useEffect } from 'react';

export default function InstallAppModal({ isOpen, onClose, onShowToast }) {
  const [activeTab, setActiveTab] = useState('pwa'); // 'pwa' | 'apk'
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Tangkap event instalasi PWA native dari browser (Chrome / Android / Edge)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      window.deferredPwaPrompt = e;
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsInstallable(false);
      if (typeof onShowToast === 'function') {
        onShowToast('Aplikasi ChaizStore berhasil dipasang di HP Anda! 🎉', 'fa-circle-check');
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cek apakah sudah berjalan di mode standalone (sudah terinstal)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    if (window.deferredPwaPrompt) {
      setDeferredPrompt(window.deferredPwaPrompt);
      setIsInstallable(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onShowToast]);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        if (typeof onShowToast === 'function') {
          onShowToast('Menginstal aplikasi ChaizStore ke perangkat Anda...', 'fa-arrow-down');
        }
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
    } else {
      if (typeof onShowToast === 'function') {
        onShowToast('Gunakan menu browser (titik 3 di kanan atas) -> pilih "Tambahkan ke Layar Utama" / "Install Aplikasi".', 'fa-circle-info');
      }
    }
  };

  const handleDownloadApk = () => {
    // Link ke file APK lokal jika sudah ditaruh di folder public
    const apkUrl = '/ChaizStore.apk';
    fetch(apkUrl, { method: 'HEAD' })
      .then((res) => {
        if (res.ok) {
          const a = document.createElement('a');
          a.href = apkUrl;
          a.download = 'ChaizStore.apk';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          if (typeof onShowToast === 'function') {
            onShowToast('Mengunduh file ChaizStore.apk...', 'fa-download text-success');
          }
        } else {
          if (typeof onShowToast === 'function') {
            onShowToast('File APK siap di-generate menggunakan Capacitor! Gunakan opsi PWA (Pasang Langsung) untuk instalasi instan sekarang.', 'fa-circle-info');
          }
        }
      })
      .catch(() => {
        if (typeof onShowToast === 'function') {
          onShowToast('Gunakan opsi Pasang Langsung (PWA) untuk instalasi cepat tanpa unduh file!', 'fa-mobile-screen');
        }
      });
  };

  return (
    <div className="login-gate-overlay" style={{ display: 'flex', zIndex: 10000 }}>
      <div className="login-gate-backdrop" onClick={onClose} />
      <div
        className="login-gate-card"
        style={{
          maxWidth: '480px',
          padding: '24px',
          background: '#0d1122',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(139, 92, 246, 0.25)',
          textAlign: 'left'
        }}
      >
        {/* Tombol Tutup X */}
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          title="Tutup"
          style={{ top: '16px', right: '16px' }}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Header Modal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: '#111827',
              border: '2px solid #7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
              flexShrink: 0
            }}
          >
            <img src="/chaizz.png" alt="ChaizStore App" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', color: '#f8fafc', fontWeight: 800 }}>
              Pasang Aplikasi ChaizStore
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
              Akses cepat tanpa browser bar, notifikasi kilat, & hemat kuota
            </p>
          </div>
        </div>

        {/* Tab Switcher: PWA vs APK */}
        <div
          style={{
            display: 'flex',
            background: '#1e293b',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '18px',
            gap: '4px'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'pwa' ? 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)' : 'transparent',
              color: activeTab === 'pwa' ? '#ffffff' : '#94a3b8',
              fontWeight: activeTab === 'pwa' ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fa-solid fa-mobile-screen"></i>
            <span>Pasang di HP (PWA)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'apk' ? 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)' : 'transparent',
              color: activeTab === 'apk' ? '#ffffff' : '#94a3b8',
              fontWeight: activeTab === 'apk' ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fa-brands fa-android text-success"></i>
            <span>File APK Android</span>
          </button>
        </div>

        {/* Konten Tab 1: PWA (Install Langsung Tanpa Unduh) */}
        {activeTab === 'pwa' && (
          <div>
            <div
              style={{
                background: 'rgba(124, 58, 237, 0.1)',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                <i className="fa-solid fa-bolt"></i>
                <span>Metode Rekomendasi (Instan & 100% Gratis)</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: '1.45' }}>
                Aplikasi langsung terpasang di layar utama HP Anda dengan icon ChaizStore, berukuran ringan (hanya beberapa KB), dan otomatis ter-update setiap ada fitur baru!
              </p>
            </div>

            {/* Tombol Aksi Pasang */}
            <button
              type="button"
              onClick={handleInstallClick}
              style={{
                width: '100%',
                padding: '12px 18px',
                background: 'linear-gradient(135deg, #9333ea 0%, #4f46e5 100%)',
                border: '1px solid #c084fc',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '14.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 16px rgba(147, 51, 234, 0.45)',
                transition: 'all 0.2s ease',
                marginBottom: '16px'
              }}
            >
              <i className="fa-solid fa-download"></i>
              <span>{isInstalled ? 'Aplikasi Sudah Terpasang di HP' : isInstallable ? 'Pasang Aplikasi Sekarang' : 'Pasang ke Layar Utama HP'}</span>
            </button>

            {/* Panduan Manual */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
                💡 Cara Pasang Manual jika tombol di atas tidak muncul:
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
                <li>
                  <strong style={{ color: '#60a5fa' }}>Android (Google Chrome):</strong> Tekan tombol titik 3 di pojok kanan atas browser &rarr; pilih <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Install Aplikasi"</strong>.
                </li>
                <li>
                  <strong style={{ color: '#f472b6' }}>iPhone (Safari):</strong> Tekan tombol Bagikan/Share di bagian bawah &rarr; geser ke bawah &rarr; pilih <strong>"Tambah ke Layar Utama (Add to Home Screen)"</strong>.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Konten Tab 2: File APK Android */}
        {activeTab === 'apk' && (
          <div>
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                <i className="fa-brands fa-android"></i>
                <span>Installer Paket Android (.APK)</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: '1.45' }}>
                File installer APK mandiri yang bisa dibagikan langsung lewat WhatsApp atau Telegram dan di-install di HP Android mana pun tanpa melewati Google Play Store.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadApk}
              style={{
                width: '100%',
                padding: '12px 18px',
                background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
                border: '1px solid #4ade80',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '14.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 16px rgba(22, 163, 74, 0.4)',
                transition: 'all 0.2s ease',
                marginBottom: '14px'
              }}
            >
              <i className="fa-solid fa-file-arrow-down"></i>
              <span>Download File ChaizStore.apk</span>
            </button>

            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.5' }}>
              <i className="fa-solid fa-shield-check text-success"></i> Aman dari virus, bebas malware, dan 100% aman untuk semua HP Android (Samsung, Xiaomi, Oppo, Vivo, Realme, Infinix, dll).
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
