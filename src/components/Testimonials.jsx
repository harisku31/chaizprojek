import React, { useState, useEffect } from 'react';
import {
  getCustomerReviews,
  listenToCustomerReviews,
  syncCustomerReviewsFromCloud
} from '../utils/transactions';

export default function Testimonials({ onOpenAllReviews }) {
  const [reviews, setReviews] = useState(() => getCustomerReviews());

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

    // Listen realtime jika ada ulasan baru via BroadcastChannel
    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('chaiz_admin_sync');
        bc.onmessage = (ev) => {
          if (ev.data?.type === 'NEW_CUSTOMER_REVIEW' || ev.data?.type === 'REVIEWS_UPDATED') {
            setReviews(getCustomerReviews());
          }
        };
      }
    } catch (e) {}

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      if (bc) bc.close();
    };
  }, []);

  // Ambil 6 ulasan teratas untuk ditampilkan di beranda
  const displayReviews = reviews.slice(0, 6);

  return (
    <section className="testimonials-section" id="testimoni">
      <div className="container">
        <div className="section-title text-center">
          <span className="subheading">
            <i className="fa-solid fa-star text-warning"></i> KATA MEREKA & ULASAN REALTIME
          </span>
          <h2>Testimoni & Kritik Pembeli</h2>
          <p>Ulasan asli dan rating kepuasan yang dikirimkan langsung oleh pelanggan terverifikasi Google.</p>
        </div>

        <div className="testimonials-grid">
          {displayReviews.map((testi, i) => {
            const starsCount = testi.stars || 5;
            const authorName = testi.name || 'Pelanggan Chaiz';
            const authorRole = testi.category || testi.role || 'Pelanggan Setia';
            const displayDate = testi.dateTime || testi.date || 'Baru saja';

            return (
              <div key={testi.id || i} className="testi-card">
                <div className="testi-stars">
                  {[...Array(5)].map((_, s) => (
                    <i
                      key={s}
                      className={`fa-solid fa-star ${s < starsCount ? 'text-warning' : 'text-muted'}`}
                    ></i>
                  ))}
                  {displayDate && <span className="testi-date-tag">{displayDate}</span>}
                </div>

                <p className="testi-text">"{testi.text}"</p>

                <div className="testi-author">
                  <div className="author-avatar" style={{ overflow: 'hidden' }}>
                    {testi.picture ? (
                      <img src={testi.picture} alt={authorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <i className="fa-solid fa-user"></i>
                    )}
                  </div>
                  <div>
                    <h4>{authorName}</h4>
                    <span>{authorRole}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tombol Khusus Lihat Semua Testimoni & Tulis Komentar */}
        <div style={{ textAlign: 'center', marginTop: '36px' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenAllReviews}
            style={{
              padding: '13px 32px',
              fontSize: '14.5px',
              fontWeight: 700,
              borderRadius: '30px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              border: '1px solid #c084fc',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 6px 24px rgba(124, 58, 237, 0.45)',
              transition: 'all 0.25s ease'
            }}
          >
            <i className="fa-solid fa-comments"></i>
            <span>Buka Halaman Testimoni & Tambah Komentar ↗</span>
          </button>
        </div>
      </div>
    </section>
  );
}
