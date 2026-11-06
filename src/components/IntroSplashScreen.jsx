import React, { useState, useEffect, useRef } from 'react';
import { APP_VERSION, APP_BUILD_NAME, APP_RELEASE_YEAR } from '../utils/version.js';

export default function IntroSplashScreen({ onFinish, minDurationMs = 2000 }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Memulai sistem ChaizStore...');
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const finishedRef = useRef(false);

  useEffect(() => {
    // Kunci scroll body selama intro tampil
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Tahapan status loading realistis
    const stages = [
      { at: 15, text: 'Memuat aset & antarmuka toko...' },
      { at: 40, text: 'Menghubungkan ke dedicated realtime server...' },
      { at: 68, text: 'Sinkronisasi katalog produk & stok akun...' },
      { at: 88, text: 'Menyiapkan pengalaman belanja terbaik...' },
      { at: 100, text: 'Selamat Datang di ChaizStore! ✨' }
    ];

    const startTime = Date.now();
    const targetDuration = Math.max(1600, minDurationMs);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(100, Math.floor((elapsed / targetDuration) * 100));

      setProgress(rawProgress);

      // Update status text sesuai persentase
      for (let i = stages.length - 1; i >= 0; i--) {
        if (rawProgress >= stages[i].at) {
          setStatusText(stages[i].text);
          break;
        }
      }

      if (rawProgress >= 100) {
        clearInterval(interval);
        if (!finishedRef.current) {
          finishedRef.current = true;
          // Beri jeda singkat agar user melihat 100% dan ucapan selamat datang
          setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => {
              setIsVisible(false);
              document.body.style.overflow = originalOverflow;
              if (typeof onFinish === 'function') onFinish();
            }, 600);
          }, 350);
        }
      }
    }, 40);

    return () => {
      clearInterval(interval);
      document.body.style.overflow = originalOverflow;
    };
  }, [minDurationMs, onFinish]);

  const handleSkip = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setProgress(100);
    setStatusText('Selamat Datang di ChaizStore! ✨');
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = '';
      if (typeof onFinish === 'function') onFinish();
    }, 400);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`chaiz-intro-overlay ${isExiting ? 'fade-out' : 'fade-in'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Loading ChaizStore"
    >
      <style>{`
        .chaiz-intro-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #070913;
          background: radial-gradient(circle at 50% 35%, #181d36 0%, #0c1022 60%, #060812 100%);
          z-index: 999999;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          user-select: none;
          box-sizing: border-box;
          opacity: 1;
          transition: opacity 0.5s ease, transform 0.5s ease;
        }

        .chaiz-intro-overlay.fade-out {
          opacity: 0;
          transform: scale(1.03);
          pointer-events: none;
        }

        /* Ambient Glow Spheres (di atas background solid, tidak tembus ke web) */
        .intro-ambient-1 {
          position: absolute;
          width: 420px;
          height: 420px;
          top: 15%;
          left: 50%;
          transform: translate(-50%, -20%);
          background: radial-gradient(circle, rgba(147, 51, 234, 0.28) 0%, rgba(15, 23, 42, 0) 70%);
          filter: blur(40px);
          pointer-events: none;
        }

        /* Skip Button (Solid & Jelas) */
        .intro-skip-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: #1e293b;
          border: 1px solid #475569;
          color: #cbd5e1;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 18px;
          border-radius: 999px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          z-index: 10;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
        }

        .intro-skip-btn:hover {
          background: #2e1065;
          border-color: #a855f7;
          color: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(168, 85, 247, 0.35);
        }

        /* Center Content */
        .intro-center-box {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 420px;
          width: 100%;
          margin: auto 0;
        }

        /* Logo Container (Solid Non-Transparan) */
        .intro-logo-wrapper {
          position: relative;
          width: 116px;
          height: 116px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .intro-logo-glow-ring {
          position: absolute;
          inset: -4px;
          border-radius: 28px;
          background: linear-gradient(135deg, #9333ea, #3b82f6, #06b6d4);
          opacity: 0.8;
          filter: blur(12px);
          animation: introRingSpin 6s linear infinite;
        }

        @keyframes introRingSpin {
          0% { filter: blur(12px) hue-rotate(0deg); }
          100% { filter: blur(12px) hue-rotate(360deg); }
        }

        .intro-logo-card {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 24px;
          background: #111827;
          border: 2px solid #6b21a8;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 14px 35px rgba(0, 0, 0, 0.8), 0 0 25px rgba(147, 51, 234, 0.3);
          animation: introLogoFloat 3s ease-in-out infinite alternate;
        }

        @keyframes introLogoFloat {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-5px); }
        }

        .intro-logo-img {
          width: 80px;
          height: 80px;
          object-fit: contain;
          filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6));
        }

        /* Brand Title */
        .intro-brand-title {
          font-family: 'Outfit', sans-serif;
          font-size: 34px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin: 0 0 6px 0;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .intro-brand-title .brand-chaiz {
          color: #ffffff;
        }

        .intro-brand-title .brand-store {
          background: linear-gradient(135deg, #c084fc 0%, #60a5fa 50%, #38bdf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .intro-brand-sub {
          font-size: 13px;
          color: #94a3b8;
          margin: 0 0 32px 0;
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        /* Loading Progress Section (Solid Track) */
        .intro-loader-box {
          width: 100%;
          max-width: 320px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .intro-progress-track {
          width: 100%;
          height: 10px;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 999px;
          overflow: hidden;
          position: relative;
          box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.7);
        }

        .intro-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #9333ea, #a855f7, #3b82f6, #06b6d4);
          background-size: 200% 100%;
          border-radius: 999px;
          transition: width 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 14px rgba(168, 85, 247, 0.9);
          animation: introShimmerBar 2s linear infinite;
        }

        @keyframes introShimmerBar {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }

        .intro-progress-meta {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
          font-size: 12px;
        }

        .intro-status-text {
          color: #e2e8f0;
          font-weight: 500;
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 260px;
        }

        .intro-percent-text {
          font-family: 'Outfit', monospace;
          color: #c084fc;
          font-weight: 700;
          font-size: 14px;
          min-width: 42px;
          text-align: right;
        }

        /* Footer Version Section (Solid Badge) */
        .intro-footer {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          margin-top: auto;
          padding-top: 16px;
        }

        .intro-version-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #111827;
          border: 1px solid #4c1d95;
          padding: 7px 18px;
          border-radius: 999px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.7);
        }

        .intro-pulse-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 10px #10b981;
          animation: introDotPulse 1.8s ease-in-out infinite;
        }

        @keyframes introDotPulse {
          0% { transform: scale(0.9); box-shadow: 0 0 4px #10b981; }
          50% { transform: scale(1.2); box-shadow: 0 0 12px #10b981; }
          100% { transform: scale(0.9); box-shadow: 0 0 4px #10b981; }
        }

        .intro-version-label {
          color: #94a3b8;
          font-size: 12px;
          font-weight: 500;
        }

        .intro-version-val {
          color: #f1f5f9;
          font-weight: 700;
          font-size: 13px;
          font-family: 'Outfit', monospace;
          letter-spacing: 0.5px;
          background: linear-gradient(135deg, #f8fafc, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .intro-version-build {
          color: #64748b;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.2px;
        }

        .intro-copyright {
          color: #475569;
          font-size: 11px;
          margin-top: 2px;
        }

        /* Mobile Adjustments */
        @media (max-width: 480px) {
          .intro-brand-title {
            font-size: 27px;
          }
          .intro-logo-wrapper {
            width: 95px;
            height: 95px;
            margin-bottom: 20px;
          }
          .intro-logo-img {
            width: 64px;
            height: 64px;
          }
          .intro-loader-box {
            max-width: 280px;
          }
          .intro-status-text {
            max-width: 210px;
            font-size: 11px;
          }
        }
      `}</style>

      {/* Ambient background light */}
      <div className="intro-ambient-1" />

      {/* Tombol Lewati di pojok kanan atas */}
      <button
        type="button"
        className="intro-skip-btn"
        onClick={handleSkip}
        title="Langsung masuk ke toko tanpa menunggu"
      >
        <i className="fa-solid fa-forward-fast" />
        <span>Lewati</span>
      </button>

      {/* Konten Tengah: Logo ChaizStore, Nama, Subtitle, & Loading Bar */}
      <div className="intro-center-box">
        <div className="intro-logo-wrapper">
          <div className="intro-logo-glow-ring" />
          <div className="intro-logo-card">
            <img src="/chaizz.png" alt="Logo ChaizStore" className="intro-logo-img" />
          </div>
        </div>

        <h1 className="intro-brand-title">
          <span className="brand-chaiz">Chaiz</span>
          <span className="brand-store">Store</span>
        </h1>

        <p className="intro-brand-sub">
          Pusat Akun Premium, Top Up Game & Steam Key Terpercaya
        </p>

        {/* Loading Bar & Dynamic Status Progress */}
        <div className="intro-loader-box">
          <div className="intro-progress-track">
            <div
              className="intro-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="intro-progress-meta">
            <span className="intro-status-text">{statusText}</span>
            <span className="intro-percent-text">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Bagian Bawah: Versi Website & Status Sistem */}
      <div className="intro-footer">
        <div className="intro-version-pill">
          <span className="intro-pulse-dot" />
          <span className="intro-version-label">Versi Website:</span>
          <span className="intro-version-val">{APP_VERSION}</span>
        </div>

        <span className="intro-version-build">
          {APP_BUILD_NAME} &bull; Realtime Engine
        </span>

        <span className="intro-copyright">
          &copy; {APP_RELEASE_YEAR} ChaizStore. All rights reserved.
        </span>
      </div>
    </div>
  );
}
