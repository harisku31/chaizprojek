import React, { useState } from 'react';
import { rateTransaction } from '../utils/transactions';

export default function RatingModal({
  isOpen,
  onClose,
  transaction,
  onRatingSubmitted,
  onShowToast
}) {
  const [stars, setStars] = useState(5);
  const [hoverStars, setHoverStars] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !transaction) return null;

  const starLabels = {
    1: 'Kecewa 😞',
    2: 'Kurang Puas 😐',
    3: 'Cukup Baik 🙂',
    4: 'Puas & Rekomendasi 😊',
    5: 'Sangat Puas & Pelayanan Terbaik! ⭐⭐⭐⭐⭐'
  };

  const currentStarCount = hoverStars || stars;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      onShowToast?.('Silakan tulis ulasan atau catatan pengalaman Anda!', 'fa-triangle-exclamation');
      return;
    }

    setIsSubmitting(true);
    const updated = rateTransaction(transaction.id, stars, comment.trim());

    onShowToast?.(
      '🎉 Terima kasih! Rating dan ulasan Anda telah tercantum di halaman website.',
      'fa-star text-warning'
    );

    setIsSubmitting(false);
    onRatingSubmitted?.(updated);
    onClose();
  };

  return (
    <div
      className="modal-overlay active"
      id="ratingModal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box modal-box-redesign rating-modal-box">
        <button className="modal-close-btn" onClick={onClose} aria-label="Tutup">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Modal Header */}
        <div className="modal-header-centered rating-modal-header">
          <div className="rating-header-icon">
            <i className="fa-solid fa-star-half-stroke"></i>
          </div>
          <span className="modal-tag">PENILAIAN & KRITIK PELANGGAN</span>
          <h3 className="modal-title-centered">Beri Rating Pesanan</h3>
          <p className="rating-modal-sub">
            Bagaimana kepuasan Anda belanja <strong>{transaction.productName}</strong> di ChaizStore? Ulasan Anda akan otomatis tercantum di halaman website.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rating-modal-form">
          {/* 5 Bintang Interaktif */}
          <div className="rating-stars-picker-wrap">
            <label className="rating-picker-label">Pilih Jumlah Bintang:</label>
            <div className="interactive-stars-row">
              {[1, 2, 3, 4, 5].map((starNum) => {
                const isLit = starNum <= currentStarCount;
                return (
                  <button
                    key={starNum}
                    type="button"
                    className={`star-btn ${isLit ? 'lit' : ''}`}
                    onClick={() => setStars(starNum)}
                    onMouseEnter={() => setHoverStars(starNum)}
                    onMouseLeave={() => setHoverStars(0)}
                    aria-label={`Beri ${starNum} bintang`}
                  >
                    <i className="fa-solid fa-star"></i>
                  </button>
                );
              })}
            </div>
            <span className="star-feeling-text">{starLabels[currentStarCount]}</span>
          </div>

          {/* Kolom Catatan Kritik / Ulasan */}
          <div className="rating-textarea-wrap">
            <label className="rating-textarea-label">
              <i className="fa-solid fa-pen-to-square text-cyan"></i> Catatan Ulasan, Kritik & Saran:
            </label>
            <textarea
              required
              rows={4}
              className="rating-textarea"
              placeholder="Contoh: Proses pengiriman akun cepat banget, Netflix langsung bisa nonton 4K tanpa hambatan. Adminnya ramah dan terpercaya!"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>
            <small className="rating-helper">
              Ulasan Anda akan membantu kami terus meningkatkan kualitas pelayanan di ChaizStore.
            </small>
          </div>

          {/* Modal Actions */}
          <div className="rating-modal-actions">
            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={isSubmitting}
            >
              <i className="fa-solid fa-paper-plane"></i> Kirim Ulasan & Bintang
            </button>
            <button
              type="button"
              className="btn btn-outline btn-block"
              onClick={onClose}
            >
              Nanti Saja
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
