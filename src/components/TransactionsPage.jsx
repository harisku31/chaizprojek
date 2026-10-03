import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../utils/format';
import {
  getTransactions,
  markTransactionsAsRead
} from '../utils/transactions';
import TransactionModal from './TransactionModal';
import RatingModal from './RatingModal';

export default function TransactionsPage({
  onBackToStore,
  onShowToast,
  authUser,
  onOpenLogin
}) {
  const [transactions, setTransactions] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'processing' | 'completed'
  const [selectedTrxDetail, setSelectedTrxDetail] = useState(null);
  const [selectedTrxRating, setSelectedTrxRating] = useState(null);

  const loadData = () => {
    const list = getTransactions();
    setTransactions(list);
    markTransactionsAsRead();
  };

  useEffect(() => {
    loadData();

    // Listen realtime update dari BroadcastChannel (saat Admin klik proses berhasil)
    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('chaiz_admin_sync');
        bc.onmessage = (ev) => {
          if (
            ev.data?.type === 'TRANSACTIONS_UPDATED' ||
            ev.data?.type === 'TRANSACTION_FULFILLED' ||
            ev.data?.type === 'NEW_TRANSACTION' ||
            ev.data?.type === 'TRANSACTION_RATED'
          ) {
            loadData();
            if (ev.data?.type === 'TRANSACTION_FULFILLED') {
              onShowToast?.(
                '🎉 Pesanan Anda telah berhasil diproses oleh Admin! Akun Anda sudah siap dilihat.',
                'fa-circle-check text-success'
              );
            }
          }
        };
      }
    } catch (e) {}

    const handleStorage = (e) => {
      if (e.key === 'chaiz_transactions') {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const processingCount = transactions.filter((t) => t.status === 'processing').length;
  const completedCount = transactions.filter((t) => t.status === 'completed').length;

  const filteredTransactions = transactions.filter((t) => {
    if (activeFilter === 'processing') return t.status === 'processing';
    if (activeFilter === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <div className="transactions-page-container">
      {/* 1. Header Banner & Navigasi */}
      <section className="topup-page-hero trx-page-hero">
        <div className="container">
          <div className="topup-breadcrumb-bar">
            <button
              type="button"
              className="topup-back-btn"
              onClick={onBackToStore}
              title="Kembali ke Beranda Toko"
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Kembali ke Toko</span>
            </button>

            <div className="topup-page-status-pill">
              <span className="live-status-dot"></span>
              <span>Sinkronisasi Pesanan Realtime Aktif</span>
            </div>
          </div>

          <div className="topup-hero-content">
            <span className="topup-hero-badge">
              <i className="fa-solid fa-receipt text-warning"></i> RIWAYAT PESANAN & TRANSAKSI
            </span>
            <h1 className="topup-hero-title">
              Daftar Transaksi <span>& Akun Anda</span>
            </h1>
            <p className="topup-hero-sub">
              Pantau status pesanan Anda secara realtime. Setelah Admin memproses pesanan, kredensial akun (email, password, PIN, profil) akan langsung tampil di sini dan Anda dapat memberikan ulasan bintang 5.
            </p>

            <div className="topup-hero-stats">
              <div className="topup-stat-item">
                <i className="fa-solid fa-clock-rotate-left text-warning"></i>
                <div>
                  <strong>{processingCount} Pesanan</strong>
                  <small>Sedang Diproses Admin</small>
                </div>
              </div>
              <div className="topup-stat-item">
                <i className="fa-solid fa-circle-check text-emerald"></i>
                <div>
                  <strong>{completedCount} Pesanan</strong>
                  <small>Berhasil Selesai</small>
                </div>
              </div>
              <div className="topup-stat-item">
                <i className="fa-solid fa-shield-halved text-cyan"></i>
                <div>
                  <strong>100% Garansi</strong>
                  <small>Full Support Garansi</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Daftar Transaksi Pelanggan */}
      <section className="trx-main-section">
        <div className="container">
          {/* Filter Bar */}
          <div className="trx-filter-row">
            <div className="trx-filter-tabs">
              <button
                type="button"
                className={`trx-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                <i className="fa-solid fa-border-all"></i> Semua Transaksi ({transactions.length})
              </button>
              <button
                type="button"
                className={`trx-tab-btn ${activeFilter === 'processing' ? 'active' : ''}`}
                onClick={() => setActiveFilter('processing')}
              >
                <i className="fa-solid fa-spinner fa-spin text-warning"></i> Sedang Diproses ({processingCount})
              </button>
              <button
                type="button"
                className={`trx-tab-btn ${activeFilter === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveFilter('completed')}
              >
                <i className="fa-solid fa-circle-check text-emerald"></i> Berhasil Terkirim ({completedCount})
              </button>
            </div>
          </div>

          {/* List Card Transaksi */}
          {filteredTransactions.length > 0 ? (
            <div className="trx-cards-list">
              {filteredTransactions.map((trx) => {
                const isCompleted = trx.status === 'completed';
                const hasRated = !!trx.rating;
                const formattedDate = new Date(trx.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={trx.id}
                    className={`trx-card-item ${isCompleted ? 'card-completed' : 'card-processing'}`}
                  >
                    <div className="trx-card-header">
                      <div className="trx-card-left">
                        <span className="trx-id-badge">
                          <i className="fa-solid fa-receipt"></i> {trx.id}
                        </span>
                        <span className="trx-date-badge">
                          <i className="fa-regular fa-clock"></i> {formattedDate} WIB
                        </span>
                      </div>
                      <div className="trx-card-right">
                        <span className={`trx-status-badge ${isCompleted ? 'status-completed' : 'status-processing'}`}>
                          <i className={`fa-solid ${isCompleted ? 'fa-circle-check' : 'fa-spinner fa-spin'}`}></i>
                          {isCompleted ? 'Pesanan Berhasil / Terkirim' : 'Sedang Diproses Admin'}
                        </span>
                      </div>
                    </div>

                    <div className="trx-card-body">
                      <div className="trx-product-info">
                        <div className="trx-product-icon">
                          <i className="fa-solid fa-crown text-warning"></i>
                        </div>
                        <div className="trx-product-details">
                          <h3 className="trx-prod-name">{trx.productName}</h3>
                          <div className="trx-prod-meta">
                            <span className="meta-pill">{trx.productDuration}</span>
                            <span className="meta-warranty">
                              <i className="fa-solid fa-shield-halved text-cyan"></i> {trx.warrantyPeriod}
                            </span>
                            <span className="meta-pay">{trx.paymentMethod}</span>
                          </div>
                        </div>
                      </div>

                      <div className="trx-price-wrap">
                        <span className="price-label">Total Tagihan:</span>
                        <strong className="trx-total-num">{formatRupiah(trx.total)}</strong>
                      </div>
                    </div>

                    {/* Catatan Admin Preview jika sudah selesai */}
                    {isCompleted && trx.adminNote && (
                      <div className="trx-note-preview">
                        <i className="fa-solid fa-comment-dots text-cyan"></i>
                        <span>
                          <strong>Pesan Admin:</strong> "{trx.adminNote}"
                        </span>
                      </div>
                    )}

                    {/* Action Buttons: 
                        - Jika diproses: HANYA 1 tombol (Lihat)
                        - Jika berhasil terkirim: BERUBAH JADI 2 tombol (Lihat & Rating) */}
                    <div className="trx-card-actions">
                      {/* Tombol 1: Lihat Detail */}
                      <button
                        type="button"
                        className="btn btn-outline btn-trx-view"
                        onClick={() => setSelectedTrxDetail(trx)}
                      >
                        <i className="fa-solid fa-eye"></i> Lihat Detail Akun
                      </button>

                      {/* Tombol 2: Rating (HANYA MUNCUL JIKA STATUS SELESAI / BERHASIL TERKIRIM) */}
                      {isCompleted && (
                        <button
                          type="button"
                          className={`btn ${hasRated ? 'btn-rated' : 'btn-primary btn-trx-rating'}`}
                          onClick={() => {
                            if (hasRated) {
                              onShowToast?.(
                                `Anda sudah memberikan ${trx.rating.stars} bintang untuk pesanan ini!`,
                                'fa-star text-warning'
                              );
                            } else {
                              setSelectedTrxRating(trx);
                            }
                          }}
                        >
                          <i className="fa-solid fa-star"></i>{' '}
                          {hasRated ? `Sudah Dirating (${trx.rating.stars} ⭐)` : 'Beri Rating'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <i className="fa-solid fa-receipt"></i>
              <h3>Belum Ada Transaksi</h3>
              <p>
                {activeFilter === 'all'
                  ? 'Anda belum memiliki riwayat pembelian. Pesanan akun atau key Anda akan otomatis dicatat di sini.'
                  : 'Tidak ada transaksi dengan status yang dipilih.'}
              </p>
              <button className="btn btn-primary" onClick={onBackToStore}>
                Mulai Belanja Akun Premium
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Modal Detail Transaksi */}
      <TransactionModal
        isOpen={!!selectedTrxDetail}
        onClose={() => setSelectedTrxDetail(null)}
        transaction={selectedTrxDetail}
        onOpenRatingModal={(t) => setSelectedTrxRating(t)}
        onShowToast={onShowToast}
      />

      {/* Modal Rating Bintang */}
      <RatingModal
        isOpen={!!selectedTrxRating}
        onClose={() => setSelectedTrxRating(null)}
        transaction={selectedTrxRating}
        onRatingSubmitted={(updated) => {
          loadData();
          if (selectedTrxDetail && selectedTrxDetail.id === updated.id) {
            setSelectedTrxDetail(updated);
          }
        }}
        onShowToast={onShowToast}
      />
    </div>
  );
}
