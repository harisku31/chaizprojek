import React, { useState, useEffect } from 'react';
import {
  getCustomerReviews,
  createNewCustomerReview,
  listenToCustomerReviews,
  syncCustomerReviewsFromCloud
} from '../utils/transactions';
import { playUserSuccessSound } from '../utils/audioNotification';

export default function TestimonialsPage({
  onBackToStore,
  onShowToast,
  authUser,
  onOpenLogin
}) {
  const [reviews, setReviews] = useState(() => getCustomerReviews());
  const [filterRating, setFilterRating] = useState('all'); // 'all' | '5' | '4' | 'kritik'

  // Form State
  const [stars, setStars] = useState(5);
  const [hoverStars, setHoverStars] = useState(0);
  const [category, setCategory] = useState('Netflix Premium');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync realtime reviews from Firebase Cloud & BroadcastChannel
  useEffect(() => {
    // 1. Initial load
    setReviews(getCustomerReviews());

    // 2. Fetch fresh cloud reviews
    syncCustomerReviewsFromCloud().then((fresh) => {
      if (Array.isArray(fresh) && fresh.length > 0) {
        setReviews(fresh);
      }
    });

    // 3. Realtime listener via Firebase RTDB
    const unsubscribe = listenToCustomerReviews((liveReviews) => {
      if (Array.isArray(liveReviews) && liveReviews.length > 0) {
        setReviews(liveReviews);
      }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Handle Submit Testimoni
  const handleSubmitReview = (e) => {
    e.preventDefault();

    if (!authUser) {
      if (typeof onOpenLogin === 'function') onOpenLogin();
      if (typeof onShowToast === 'function') {
        onShowToast('Silakan login dengan akun Google terlebih dahulu!', 'fa-brands fa-google text-danger');
      }
      return;
    }

    const cleanText = commentText.trim();
    if (!cleanText || cleanText.length < 5) {
      if (typeof onShowToast === 'function') {
        onShowToast('Mohon tulis catatan ulasan minimal 5 karakter.', 'fa-triangle-exclamation text-warning');
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const created = createNewCustomerReview({
        user: authUser,
        stars,
        text: cleanText,
        category
      });

      // Update state lokal langsung
      setReviews((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
      setCommentText('');
      setStars(5);

      try {
        playUserSuccessSound();
      } catch (err) {}

      if (typeof onShowToast === 'function') {
        onShowToast('Testimoni berhasil dipublikasikan secara realtime! ✨', 'fa-circle-check text-success');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      if (typeof onShowToast === 'function') {
        onShowToast('Gagal mengirim testimoni. Silakan coba kembali.', 'fa-triangle-exclamation text-danger');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hitung rata-rata rating bintang
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (Number(r.stars) || 5), 0) / reviews.length).toFixed(1)
    : '5.0';

  // Filter daftar ulasan
  const filteredReviews = reviews.filter((r) => {
    if (filterRating === 'all') return true;
    if (filterRating === '5') return Number(r.stars) === 5;
    if (filterRating === '4') return Number(r.stars) === 4;
    if (filterRating === 'kritik') {
      return (
        Number(r.stars) <= 3 ||
        (r.category && r.category.toLowerCase().includes('kritik')) ||
        (r.text && r.text.toLowerCase().includes('kritik'))
      );
    }
    return true;
  });

  // Label rating bintang
  const getRatingLabel = (starNum) => {
    switch (starNum) {
      case 5: return '⭐⭐⭐⭐⭐ Sangat Puas & Recommended!';
      case 4: return '⭐⭐⭐⭐ Puas, Layanan Cepat!';
      case 3: return '⭐⭐⭐ Cukup Baik';
      case 2: return '⭐⭐ Kurang Puas';
      case 1: return '⭐ Perlu Perbaikan / Kendala';
      default: return '';
    }
  };

  return (
    <div className="testimonials-page-container">
      <style>{`
        .testimonials-page-container {
          min-height: 100vh;
          background: #060814;
          background: radial-gradient(circle at 50% 10%, #1e1145 0%, #0d1222 45%, #060814 85%);
          color: #f1f5f9;
          padding: 30px 16px 80px;
        }

        .testi-page-inner {
          max-width: 1080px;
          margin: 0 auto;
        }

        /* Top Nav & Breadcrumb */
        .testi-nav-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .btn-back-to-store {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #cbd5e1;
          font-size: 13.5px;
          font-weight: 600;
          padding: 8px 18px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .btn-back-to-store:hover {
          background: rgba(168, 85, 247, 0.2);
          border-color: #a855f7;
          color: #ffffff;
          transform: translateX(-2px);
        }

        .testi-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(16, 185, 129, 0.14);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #34d399;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 999px;
        }

        .live-dot-pulse {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 10px #10b981;
          animation: dotLivePulse 1.8s infinite;
        }

        @keyframes dotLivePulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.8; }
        }

        /* Header Hero */
        .testi-header-hero {
          text-align: center;
          margin-bottom: 36px;
        }

        .testi-header-hero h1 {
          font-family: 'Outfit', sans-serif;
          font-size: 2.3rem;
          font-weight: 800;
          margin: 0 0 10px 0;
          color: #ffffff;
          letter-spacing: -0.5px;
        }

        .testi-header-hero h1 span {
          background: linear-gradient(135deg, #c084fc 0%, #60a5fa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .testi-header-hero p {
          color: #94a3b8;
          font-size: 0.95rem;
          max-width: 620px;
          margin: 0 auto 24px;
          line-height: 1.5;
        }

        /* Stat Pills Grid */
        .testi-stats-grid {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .testi-stat-card {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
        }

        .stat-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(234, 179, 8, 0.15);
          color: #facc15;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .stat-meta {
          text-align: left;
        }

        .stat-meta .val {
          font-family: 'Outfit', sans-serif;
          font-size: 1.3rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.1;
        }

        .stat-meta .lbl {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }

        /* Form Card Tulis Testimoni */
        .testi-form-card {
          background: #0f172a;
          border: 1.5px solid rgba(168, 85, 247, 0.35);
          border-radius: 20px;
          padding: 26px;
          margin-bottom: 40px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(139, 92, 246, 0.15);
        }

        .testi-form-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
          flex-wrap: wrap;
          gap: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 14px;
        }

        .testi-form-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 9px;
        }

        /* Locked Google Login Box */
        .testi-login-gate-box {
          background: #111827;
          border: 1px solid rgba(66, 133, 244, 0.35);
          border-radius: 16px;
          padding: 28px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }

        .btn-google-review-login {
          background: #ffffff;
          border: 1px solid #dadce0;
          border-radius: 24px;
          color: #1f1f1f;
          font-size: 14px;
          font-weight: 600;
          padding: 10px 24px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .btn-google-review-login:hover {
          background: #f8fafd;
          border-color: #4285f4;
          box-shadow: 0 4px 14px rgba(66, 133, 244, 0.35);
          transform: translateY(-1px);
        }

        /* Active User Profile Strip */
        .testi-user-strip {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 10px 16px;
          border-radius: 14px;
          margin-bottom: 20px;
        }

        .testi-user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #7c3aed;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid #a855f7;
        }

        .testi-user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .testi-user-info {
          flex: 1;
        }

        .testi-user-name {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .badge-google-verified {
          background: rgba(66, 133, 244, 0.15);
          border: 1px solid rgba(66, 133, 244, 0.4);
          color: #60a5fa;
          font-size: 10.5px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .testi-user-email {
          font-size: 11.5px;
          color: #94a3b8;
        }

        /* Star Selector */
        .testi-star-selector-wrap {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .testi-star-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .testi-clickable-star {
          font-size: 28px;
          cursor: pointer;
          transition: transform 0.15s ease, color 0.15s ease;
          color: #475569;
        }

        .testi-clickable-star.active {
          color: #facc15;
          text-shadow: 0 0 12px rgba(250, 204, 21, 0.5);
        }

        .testi-clickable-star:hover {
          transform: scale(1.25);
        }

        .testi-rating-meaning {
          font-size: 13px;
          font-weight: 600;
          color: #facc15;
        }

        /* Category Selector */
        .testi-category-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .testi-category-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .testi-cat-chip {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #cbd5e1;
          font-size: 12.5px;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .testi-cat-chip.active {
          background: rgba(168, 85, 247, 0.2);
          border-color: #a855f7;
          color: #f1f5f9;
          font-weight: 700;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.3);
        }

        .testi-cat-chip:hover {
          border-color: rgba(168, 85, 247, 0.6);
          color: #ffffff;
        }

        /* Textarea */
        .testi-textarea-wrap {
          margin-bottom: 20px;
        }

        .testi-textarea {
          width: 100%;
          min-height: 110px;
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 12px;
          padding: 14px;
          color: #f8fafc;
          font-size: 13.5px;
          font-family: inherit;
          resize: vertical;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
          line-height: 1.5;
        }

        .testi-textarea:focus {
          border-color: #a855f7;
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.2);
        }

        .btn-submit-review {
          background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
          border: 1px solid #c084fc;
          border-radius: 12px;
          color: #ffffff;
          font-size: 14.5px;
          font-weight: 700;
          padding: 12px 28px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 18px rgba(124, 58, 237, 0.4);
        }

        .btn-submit-review:hover {
          background: linear-gradient(135deg, #9333ea 0%, #4338ca 100%);
          box-shadow: 0 6px 24px rgba(124, 58, 237, 0.55);
          transform: translateY(-1px);
        }

        .btn-submit-review:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Filter Tabs */
        .testi-filter-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 14px;
        }

        .testi-filter-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .btn-filter-tab {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          font-size: 12.5px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-filter-tab.active {
          background: #7c3aed;
          border-color: #a855f7;
          color: #ffffff;
        }

        /* Review Cards Grid */
        .testi-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 18px;
        }

        .testi-card-item {
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
          transition: all 0.25s ease;
          position: relative;
        }

        .testi-card-item:hover {
          border-color: rgba(168, 85, 247, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.5), 0 0 18px rgba(168, 85, 247, 0.15);
        }

        .card-top-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .card-author-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .card-author-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #4f46e5;
          color: #ffffff;
          font-weight: 700;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
          border: 1.5px solid #818cf8;
        }

        .card-author-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .card-author-text h4 {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 2px 0;
        }

        .card-category-tag {
          font-size: 11px;
          color: #a855f7;
          background: rgba(168, 85, 247, 0.12);
          border: 1px solid rgba(168, 85, 247, 0.3);
          padding: 1px 8px;
          border-radius: 10px;
          font-weight: 600;
        }

        .card-stars-row {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #facc15;
          font-size: 13px;
          margin-bottom: 10px;
        }

        .card-body-text {
          font-size: 13.5px;
          color: #cbd5e1;
          line-height: 1.55;
          margin-bottom: 16px;
          flex: 1;
          white-space: pre-wrap;
          word-break: break-word;
        }

        /* Tanggal dan Waktu Realtime */
        .card-footer-timestamp {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11.5px;
          color: #64748b;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 10px;
        }

        .card-datetime {
          color: #94a3b8;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .card-verified-tag {
          color: #10b981;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        @media (max-width: 640px) {
          .testi-header-hero h1 {
            font-size: 1.8rem;
          }
          .testi-form-card {
            padding: 18px;
          }
          .testi-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="testi-page-inner">
        {/* Navigasi Atas */}
        <div className="testi-nav-bar">
          <button type="button" className="btn-back-to-store" onClick={onBackToStore}>
            <i className="fa-solid fa-arrow-left"></i>
            <span>Kembali ke Beranda Toko</span>
          </button>

          <div className="testi-live-badge">
            <span className="live-dot-pulse"></span>
            <span>Ulasan Realtime Aktif</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="testi-header-hero">
          <h1>
            Testimoni & Kritik <span>Pelanggan</span>
          </h1>
          <p>
            Semua ulasan, kritik, dan saran kepuasan yang dikirimkan secara langsung dan transparan oleh pelanggan ChaizStore.
          </p>

          <div className="testi-stats-grid">
            <div className="testi-stat-card">
              <div className="stat-icon-wrap">
                <i className="fa-solid fa-star"></i>
              </div>
              <div className="stat-meta">
                <div className="val">{averageRating} / 5.0</div>
                <div className="lbl">Rating Rata-Rata</div>
              </div>
            </div>

            <div className="testi-stat-card">
              <div className="stat-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                <i className="fa-solid fa-comments"></i>
              </div>
              <div className="stat-meta">
                <div className="val">{reviews.length} Ulasan</div>
                <div className="lbl">Total Komentar Masuk</div>
              </div>
            </div>

            <div className="testi-stat-card">
              <div className="stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                <i className="fa-solid fa-shield-check"></i>
              </div>
              <div className="stat-meta">
                <div className="val">100%</div>
                <div className="lbl">Ulasan Nyata Terverifikasi</div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Tambah Testimoni / Kritik */}
        <div className="testi-form-card">
          <div className="testi-form-header">
            <div className="testi-form-title">
              <i className="fa-solid fa-pen-to-square text-warning"></i>
              <span>Tulis Testimoni atau Kritik Kamu</span>
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Wajib Akun Google &bull; Realtime Langsung Terbit
            </span>
          </div>

          {/* JIKA BELUM LOGIN GOOGLE -> TAMPILKAN GATE LOGIN */}
          {!authUser ? (
            <div className="testi-login-gate-box">
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(66, 133, 244, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-lock" style={{ fontSize: '1.4rem', color: '#60a5fa' }}></i>
              </div>
              <div style={{ maxWidth: '420px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#ffffff' }}>
                  Masuk Akun Google untuk Menulis Ulasan
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.45' }}>
                  Untuk menjamin seluruh testimoni dan kritik 100% nyata dari pelanggan asli (bebas spam), kamu wajib masuk menggunakan akun Google terlebih dahulu.
                </p>
              </div>
              <button
                type="button"
                className="btn-google-review-login"
                onClick={onOpenLogin}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.28 21.43 7.37 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.32a7.18 7.18 0 0 1 0-4.64V6.58H1.25a11.97 11.97 0 0 0 0 10.84l4.03-3.1z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.28 2.57 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"/>
                </svg>
                <span>Masuk dengan Akun Google</span>
              </button>
            </div>
          ) : (
            /* JIKA SUDAH LOGIN GOOGLE -> TAMPILKAN FORMULIR ULASAN LENGKAP */
            <form onSubmit={handleSubmitReview}>
              {/* Profil Pengulas */}
              <div className="testi-user-strip">
                <div className="testi-user-avatar">
                  {authUser.picture ? (
                    <img src={authUser.picture} alt={authUser.name} />
                  ) : (
                    <span>{(authUser.name || 'G').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="testi-user-info">
                  <div className="testi-user-name">
                    <span>{authUser.name || 'Pengguna Chaiz'}</span>
                    <span className="badge-google-verified">
                      <i className="fa-brands fa-google"></i> Terverifikasi
                    </span>
                  </div>
                  <div className="testi-user-email">
                    {authUser.email || 'Akun Google Terhubung'}
                  </div>
                </div>
              </div>

              {/* 1. Rating Bintang */}
              <div className="testi-star-selector-wrap">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                  Beri Rating Bintang:
                </label>
                <div className="testi-star-row">
                  {[1, 2, 3, 4, 5].map((starNum) => (
                    <i
                      key={starNum}
                      className={`fa-solid fa-star testi-clickable-star ${
                        starNum <= (hoverStars || stars) ? 'active' : ''
                      }`}
                      onMouseEnter={() => setHoverStars(starNum)}
                      onMouseLeave={() => setHoverStars(0)}
                      onClick={() => setStars(starNum)}
                      title={`Beri rating ${starNum} bintang`}
                    ></i>
                  ))}
                  <span className="testi-rating-meaning">
                    {getRatingLabel(hoverStars || stars)}
                  </span>
                </div>
              </div>

              {/* 2. Pilihan Kategori / Produk */}
              <div className="testi-category-row">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                  Produk / Topik Ulasan:
                </label>
                <div className="testi-category-chips">
                  {[
                    'Netflix Premium',
                    'Canva Pro',
                    'YouTube Premium',
                    'Spotify Family',
                    'Gemini AI',
                    'Robux Game',
                    'Steam Key',
                    'Kecepatan Admin & CS',
                    'Kritik & Saran Toko'
                  ].map((catItem) => (
                    <button
                      key={catItem}
                      type="button"
                      className={`testi-cat-chip ${category === catItem ? 'active' : ''}`}
                      onClick={() => setCategory(catItem)}
                    >
                      {catItem}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Catatan Deskripsi / Komentar */}
              <div className="testi-textarea-wrap">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: '6px' }}>
                  Catatan Deskripsi & Komentar:
                </label>
                <textarea
                  className="testi-textarea"
                  placeholder="Ceritakan pengalaman belanja kamu, respon admin, kelancaran akun, atau kritik dan saran membangun untuk toko..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={600}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  <span>Tanggal & waktu posting akan muncul otomatis di ulasan kamu</span>
                  <span>{commentText.length}/600 karakter</span>
                </div>
              </div>

              {/* Tombol Kirim */}
              <button
                type="submit"
                className="btn-submit-review"
                disabled={isSubmitting || !commentText.trim()}
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                    <span>Mempublikasikan...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane"></i>
                    <span>Kirim Testimoni & Ulasan Sekarang</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Filter Strip */}
        <div className="testi-filter-strip">
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
            Daftar Ulasan Pelanggan ({filteredReviews.length})
          </div>

          <div className="testi-filter-tabs">
            <button
              type="button"
              className={`btn-filter-tab ${filterRating === 'all' ? 'active' : ''}`}
              onClick={() => setFilterRating('all')}
            >
              Semua ({reviews.length})
            </button>
            <button
              type="button"
              className={`btn-filter-tab ${filterRating === '5' ? 'active' : ''}`}
              onClick={() => setFilterRating('5')}
            >
              ⭐ 5 Bintang
            </button>
            <button
              type="button"
              className={`btn-filter-tab ${filterRating === '4' ? 'active' : ''}`}
              onClick={() => setFilterRating('4')}
            >
              ⭐ 4 Bintang
            </button>
            <button
              type="button"
              className={`btn-filter-tab ${filterRating === 'kritik' ? 'active' : ''}`}
              onClick={() => setFilterRating('kritik')}
            >
              💬 Kritik & Saran
            </button>
          </div>
        </div>

        {/* Grid Kartu Ulasan Realtime */}
        <div className="testi-cards-grid">
          {filteredReviews.map((testi, i) => {
            const starsCount = testi.stars || 5;
            const authorName = testi.name || 'Pelanggan Chaiz';
            const authorRole = testi.category || testi.role || 'Pelanggan Setia';
            const displayDate = testi.dateTime || testi.date || 'Baru saja';

            return (
              <div key={testi.id || i} className="testi-card-item">
                <div>
                  <div className="card-top-row">
                    <div className="card-author-wrap">
                      <div className="card-author-avatar">
                        {testi.picture ? (
                          <img src={testi.picture} alt={authorName} />
                        ) : (
                          <span>{(testi.avatarLetter || authorName).charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="card-author-text">
                        <h4>{authorName}</h4>
                        <span className="card-category-tag">{authorRole}</span>
                      </div>
                    </div>
                  </div>

                  <div className="card-stars-row">
                    {[...Array(5)].map((_, s) => (
                      <i
                        key={s}
                        className={`fa-solid fa-star ${s < starsCount ? '' : 'text-muted'}`}
                        style={{ color: s < starsCount ? '#facc15' : '#334155' }}
                      ></i>
                    ))}
                  </div>

                  <div className="card-body-text">
                    "{testi.text}"
                  </div>
                </div>

                {/* Tanggal dan Waktu Realtime */}
                <div className="card-footer-timestamp">
                  <span className="card-datetime" title="Waktu pengiriman ulasan">
                    <i className="fa-regular fa-clock"></i>
                    <span>{displayDate}</span>
                  </span>

                  <span className="card-verified-tag">
                    <i className="fa-solid fa-shield-check"></i>
                    <span>Terverifikasi</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
