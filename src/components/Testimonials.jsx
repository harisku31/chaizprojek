import React, { useState, useEffect } from 'react';
import { getCustomerReviews } from '../utils/transactions';

export default function Testimonials() {
  const [reviews, setReviews] = useState([]);

  const loadReviews = () => {
    const list = getCustomerReviews();
    setReviews(list);
  };

  useEffect(() => {
    loadReviews();

    // Listen realtime jika ada ulasan baru yang baru dikirim pelanggan
    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('chaiz_admin_sync');
        bc.onmessage = (ev) => {
          if (ev.data?.type === 'NEW_CUSTOMER_REVIEW' || ev.data?.type === 'TRANSACTION_RATED') {
            loadReviews();
          }
        };
      }
    } catch (e) {}

    const handleStorage = (e) => {
      if (e.key === 'chaiz_customer_reviews') {
        loadReviews();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return (
    <section className="testimonials-section" id="testimoni">
      <div className="container">
        <div className="section-title text-center">
          <span className="subheading">
            <i className="fa-solid fa-star text-warning"></i> KATA MEREKA & ULASAN PELANGGAN
          </span>
          <h2>Testimoni & Kritik Pembeli</h2>
          <p>Ulasan asli dan rating kepuasan yang dikirimkan langsung oleh pelanggan setia ChaizStore.</p>
        </div>

        <div className="testimonials-grid">
          {reviews.map((testi, i) => {
            const starsCount = testi.stars || 5;
            return (
              <div key={testi.id || i} className="testi-card">
                <div className="testi-stars">
                  {[...Array(5)].map((_, s) => (
                    <i
                      key={s}
                      className={`fa-solid fa-star ${s < starsCount ? 'text-warning' : 'text-muted'}`}
                    ></i>
                  ))}
                  {testi.date && <span className="testi-date-tag">{testi.date}</span>}
                </div>
                <p className="testi-text">"{testi.text}"</p>
                <div className="testi-author">
                  <div className="author-avatar">
                    <i className="fa-solid fa-user"></i>
                  </div>
                  <div>
                    <h4>{testi.name}</h4>
                    <span>{testi.role}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
