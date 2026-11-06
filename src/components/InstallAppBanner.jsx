import React, { useState, useEffect } from 'react';

const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 Jam (1 Hari)
const STORAGE_KEY = 'chaiz_install_banner_dismissed_until';

export default function InstallAppBanner({ onOpenInstall }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // 1. Jangan tampilkan jika pengguna sudah membuka via aplikasi standalone (PWA terinstal)
    if (
      (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ||
      (typeof navigator !== 'undefined' && navigator.standalone === true)
    ) {
      return;
    }

    // 2. Periksa apakah masih dalam masa 'Lewati' (1 hari)
    try {
      const dismissedUntil = localStorage.getItem(STORAGE_KEY);
      if (dismissedUntil) {
        const expiryTime = Number(dismissedUntil);
        if (!isNaN(expiryTime) && Date.now() < expiryTime) {
          // Masih dalam jeda 1 hari -> Jangan tampilkan!
          return;
        }
      }
    } catch (e) {}

    // Tampilkan notifikasi banner
    setIsVisible(true);
  }, []);

  // Saat tombol "Lewati" diklik
  const handleSkip = () => {
    setIsClosing(true);
    try {
      // Simpan waktu kadaluarsa jeda: Sekarang + 24 Jam (1 Hari)
      const expiry = Date.now() + ONE_DAY_MS;
      localStorage.setItem(STORAGE_KEY, String(expiry));
    } catch (e) {}

    setTimeout(() => {
      setIsVisible(false);
    }, 350);
  };

  const handleAction = () => {
    if (typeof onOpenInstall === 'function') {
      onOpenInstall();
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`chaiz-install-banner-wrap ${isClosing ? 'banner-slide-up' : 'banner-slide-down'}`}>
      <style>{`
        .chaiz-install-banner-wrap {
          width: 100%;
          background: linear-gradient(90deg, #1e1145 0%, #111827 50%, #0d1527 100%);
          border-bottom: 1px solid rgba(168, 85, 247, 0.4);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45);
          position: relative;
          z-index: 99;
          transition: transform 0.35s ease, opacity 0.35s ease, max-height 0.35s ease;
          overflow: hidden;
        }

        .chaiz-install-banner-wrap.banner-slide-down {
          animation: bannerSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .chaiz-install-banner-wrap.banner-slide-up {
          opacity: 0;
          transform: translateY(-100%);
          max-height: 0;
        }

        @keyframes bannerSlideIn {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .install-banner-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 10px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .install-banner-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 260px;
        }

        .install-banner-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #111827;
          border: 1.5px solid #a855f7;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 0 12px rgba(168, 85, 247, 0.4);
        }

        .install-banner-icon-box img {
          width: 28px;
          height: 28px;
          object-fit: contain;
        }

        .install-banner-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .install-banner-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #f8fafc;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .install-banner-badge {
          background: rgba(34, 197, 94, 0.18);
          border: 1px solid rgba(34, 197, 94, 0.4);
          color: #4ade80;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .install-banner-desc {
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.35;
        }

        .install-banner-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .btn-banner-install {
          background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
          border: 1px solid #c084fc;
          color: #ffffff;
          font-size: 12.5px;
          font-weight: 700;
          padding: 7px 16px;
          border-radius: 20px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 10px rgba(124, 58, 237, 0.35);
          user-select: none;
        }

        .btn-banner-install:hover {
          background: linear-gradient(135deg, #9333ea 0%, #4f46e5 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(147, 51, 234, 0.5);
        }

        .btn-banner-skip {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #cbd5e1;
          font-size: 12px;
          font-weight: 500;
          padding: 7px 14px;
          border-radius: 20px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: all 0.2s ease;
          user-select: none;
        }

        .btn-banner-skip:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.4);
          color: #fca5a5;
        }

        /* Responsive Mobile */
        @media (max-width: 640px) {
          .install-banner-container {
            padding: 8px 12px;
            gap: 10px;
          }
          .install-banner-desc {
            display: none; /* Hemat ruang vertikal di HP */
          }
          .install-banner-title {
            font-size: 12.5px;
          }
          .install-banner-icon-box {
            width: 34px;
            height: 34px;
          }
          .install-banner-icon-box img {
            width: 22px;
            height: 22px;
          }
          .btn-banner-install {
            padding: 6px 12px;
            font-size: 11.5px;
          }
          .btn-banner-skip {
            padding: 6px 10px;
            font-size: 11.5px;
          }
        }
      `}</style>

      <div className="install-banner-container">
        {/* Sisi Kiri: Icon Logo & Teks Keterangan Notifikasi */}
        <div className="install-banner-left">
          <div className="install-banner-icon-box">
            <img src="/chaizz.png" alt="ChaizStore App" />
          </div>
          <div className="install-banner-text">
            <div className="install-banner-title">
              <span>Pasang Aplikasi ChaizStore di HP Anda</span>
              <span className="install-banner-badge">PWA / APK</span>
            </div>
            <div className="install-banner-desc">
              Akses cepat langsung dari layar utama HP, bebas kolom browser, dan hemat kuota internet.
            </div>
          </div>
        </div>

        {/* Sisi Kanan: Tombol Download/Pasang & Tombol Lewati (1 Hari) */}
        <div className="install-banner-actions">
          <button
            type="button"
            className="btn-banner-install"
            onClick={handleAction}
            title="Buka dialog pemasangan aplikasi"
          >
            <i className="fa-solid fa-download"></i>
            <span>Download Aplikasi</span>
          </button>

          <button
            type="button"
            className="btn-banner-skip"
            onClick={handleSkip}
            title="Lewati notifikasi ini (tidak akan muncul lagi selama 1 hari)"
          >
            <i className="fa-solid fa-clock-rotate-left"></i>
            <span>Lewati</span>
          </button>
        </div>
      </div>
    </div>
  );
}
