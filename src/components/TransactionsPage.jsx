import React, { useState, useEffect, useMemo } from 'react';
import { formatRupiah } from '../utils/format';
import {
  getUserTransactions,
  markTransactionsAsRead,
  syncUserTransactionsFromCloud,
  listenToUserTransactions,
  getUserKey,
  isOrderOwnedByUser
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = () => {
    if (!authUser) {
      setTransactions([]);
      return;
    }
    const list = getUserTransactions(authUser);
    setTransactions((list || []).filter((t) => isOrderOwnedByUser(t, authUser)));
  };

  const handleManualRefresh = async () => {
    if (!authUser) return;
    setIsRefreshing(true);
    try {
      const fresh = await syncUserTransactionsFromCloud(authUser);
      const filtered = (fresh || []).filter((t) => isOrderOwnedByUser(t, authUser));
      setTransactions(filtered);
      markTransactionsAsRead(authUser);
      onShowToast?.('Status riwayat pesanan privat berhasil diperbarui!', 'fa-arrows-rotate text-cyan');
    } catch {
      onShowToast?.('Gagal menyegarkan status riwayat', 'fa-triangle-exclamation', 'warning');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authUser) {
      setTransactions([]);
      return;
    }

    // 1. Muat data privat awal secara instan (zero lag)
    loadData();
    markTransactionsAsRead(authUser);

    // 2. Tarik data paling baru dari node privat Firebase
    syncUserTransactionsFromCloud(authUser).then((fresh) => {
      if (Array.isArray(fresh)) {
        setTransactions(fresh.filter((t) => isOrderOwnedByUser(t, authUser)));
        markTransactionsAsRead(authUser);
      }
    });

    // 3. Realtime Cloud Listener khusus node privat user ini di Firebase
    const unsubscribeCloud = listenToUserTransactions(authUser, (cloudList) => {
      if (Array.isArray(cloudList)) {
        setTransactions(cloudList.filter((t) => isOrderOwnedByUser(t, authUser)));
      }
    });

    // 4. Polling berkala (fallback) setiap 15 detik saat tab aktif
    const pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      syncUserTransactionsFromCloud(authUser).then((fresh) => {
        if (Array.isArray(fresh)) {
          setTransactions(fresh.filter((t) => isOrderOwnedByUser(t, authUser)));
        }
      });
    }, 15000);

    // 5. Listen realtime update dari BroadcastChannel
    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('chaiz_admin_sync');
        bc.onmessage = (ev) => {
          const type = ev.data?.type;
          // Filter: Abaikan event internal penyimpanan cache user atau read status
          if (type === 'USER_TRANSACTIONS_UPDATED' || type === 'NOTIFICATIONS_READ') {
            return;
          }
          const userKey = ev.data?.userKey || ev.data?.data?.userKey;
          const myKey = authUser?.id || getUserKey(authUser);

          if (!userKey || userKey === myKey) {
            loadData();
            if (type === 'TRANSACTION_FULFILLED') {
              onShowToast?.(
                '🎉 Pesanan Anda telah berhasil diproses oleh Admin! Akun Anda sudah siap dilihat.',
                'fa-circle-check text-success'
              );
            }
          }
        };
      }
    } catch (e) {}

    const handleCustomTrx = (e) => {
      const type = e.detail?.type;
      // Filter: Abaikan event internal penyimpanan cache user atau read status
      if (type === 'USER_TRANSACTIONS_UPDATED' || type === 'NOTIFICATIONS_READ') {
        return;
      }
      const userKey = e.detail?.data?.userKey || e.detail?.userKey;
      const myKey = authUser?.id || getUserKey(authUser);
      if (!userKey || userKey === myKey) {
        loadData();
        if (e.detail?.type === 'TRANSACTION_FULFILLED') {
          onShowToast?.(
            '🎉 Pesanan Anda telah berhasil diproses oleh Admin! Akun Anda sudah siap dilihat.',
            'fa-circle-check text-success'
          );
        }
      }
    };

    window.addEventListener('chaiz_trx_updated', handleCustomTrx);

    return () => {
      if (unsubscribeCloud) unsubscribeCloud();
      clearInterval(pollInterval);
      if (bc) bc.close();
      window.removeEventListener('chaiz_trx_updated', handleCustomTrx);
    };
  }, [authUser?.id, authUser?.email]);

  // Sinkronkan selectedTrxDetail jika modal sedang dibuka pelanggan dan status berubah dari cloud
  useEffect(() => {
    if (selectedTrxDetail) {
      const updated = transactions.find((t) => t.id === selectedTrxDetail.id);
      if (
        updated &&
        (updated.status !== selectedTrxDetail.status ||
          JSON.stringify(updated.credentials) !== JSON.stringify(selectedTrxDetail.credentials))
      ) {
        setSelectedTrxDetail(updated);
        if (updated.status === 'completed' && selectedTrxDetail.status !== 'completed') {
          onShowToast?.(
            '🎉 Pesanan Anda telah selesai diproses Admin! Akun & kredensial telah siap di bawah.',
            'fa-circle-check text-success'
          );
        }
      }
    }
  }, [transactions, selectedTrxDetail]);

  // Jika Pengguna Belum Login, tampilkan perlindungan status riwayat privat database
  if (!authUser) {
    return (
      <div className="transactions-page-container">
        {/* Header Hero Khusus Tamu / Belum Login */}
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

              <div
                className="topup-page-status-pill"
                style={{
                  background: 'rgba(6, 182, 212, 0.12)',
                  borderColor: 'rgba(6, 182, 212, 0.35)',
                  color: '#22d3ee'
                }}
              >
                <i className="fa-solid fa-lock" style={{ fontSize: '11px' }}></i>
                <span>Riwayat Privat Terenkripsi</span>
              </div>
            </div>

            <div className="topup-hero-content">
              <span className="topup-hero-badge">
                <i className="fa-solid fa-shield-halved text-cyan"></i> PRIVAT DATABASE FIREBASE
              </span>
              <h1 className="topup-hero-title">
                Riwayat Pesanan <span>Privat Akun</span>
              </h1>
              <p className="topup-hero-sub">
                Di ChaizStore, setiap akun memiliki database riwayat pesanan dan kredensial akun yang bersifat privat dan aman di Firebase Cloud Database. 1 user hanya dapat melihat riwayat milik sendiri.
              </p>
            </div>
          </div>
        </section>

        {/* Kotak Gate Login Privat */}
        <section className="trx-main-section">
          <div className="container">
            <div
              className="empty-state"
              style={{
                maxWidth: '540px',
                margin: '30px auto 60px',
                padding: '44px 28px',
                background: 'rgba(15, 23, 42, 0.85)',
                borderRadius: '24px',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  background: 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: '#22d3ee',
                  fontSize: '32px'
                }}
              >
                <i className="fa-solid fa-user-lock"></i>
              </div>
              <h3 style={{ fontSize: '1.35rem', marginBottom: '12px', color: '#ffffff', fontWeight: '700' }}>
                Login untuk Membuka Riwayat Privat
              </h3>
              <p
                style={{
                  color: '#94a3b8',
                  fontSize: '0.92rem',
                  lineHeight: '1.65',
                  marginBottom: '28px',
                  maxWidth: '440px',
                  margin: '0 auto 28px'
                }}
              >
                Kredensial email, password, PIN, dan garansi akun Anda tersimpan khusus di database privat akun Anda. Silakan login dengan akun Google Anda untuk mengakses pesanan Anda.
              </p>
              <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onOpenLogin}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 24px',
                    borderRadius: '999px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <i className="fa-brands fa-google text-danger"></i>
                  <span>Masuk dengan Google</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={onBackToStore}
                  style={{
                    padding: '12px 22px',
                    borderRadius: '999px',
                    fontSize: '14px'
                  }}
                >
                  <i className="fa-solid fa-layer-group"></i>
                  <span>Katalog Akun</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // STRICT USER ISOLATION FILTER (1 Akun = 1 Riwayat Privat):
  // Filter ketat memastikan transaksi akun lain tidak akan pernah ditampilkan di akun ini
  const myTransactions = useMemo(() => {
    if (!authUser) return [];
    return transactions.filter((t) => isOrderOwnedByUser(t, authUser));
  }, [transactions, authUser]);

  const processingCount = myTransactions.filter((t) => t.status === 'processing').length;
  const completedCount = myTransactions.filter((t) => t.status === 'completed').length;

  const filteredTransactions = myTransactions.filter((t) => {
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

            {/* Status Privat Database Firebase dengan Identitas Akun Aktif */}
            <div
              className="topup-page-status-pill"
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                borderColor: 'rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span className="live-status-dot" style={{ background: '#10b981' }}></span>
              <span>Privat Database: {authUser.name || authUser.email}</span>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="Segarkan status pesanan langsung dari Cloud Database Firebase"
              style={{
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                color: '#22d3ee',
                borderRadius: '999px',
                padding: '6px 14px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: isRefreshing ? 'wait' : 'pointer'
              }}
            >
              <i className={`fa-solid fa-arrows-rotate ${isRefreshing ? 'fa-spin' : ''}`}></i>
              <span>{isRefreshing ? 'Memperbarui...' : 'Segarkan Status'}</span>
            </button>
          </div>

          <div className="topup-hero-content">
            <span className="topup-hero-badge">
              <i className="fa-solid fa-lock text-cyan"></i> RIWAYAT PRIVAT DATABASE FIREBASE
            </span>
            <h1 className="topup-hero-title">
              Daftar Transaksi <span>& Akun Anda</span>
            </h1>
            <p className="topup-hero-sub">
              Riwayat transaksi Anda tersimpan aman dan terenkripsi secara privat di Firebase. Hanya akun Anda ({authUser.email}) yang dapat mengakses pesanan dan kredensial akun di bawah ini.
            </p>

            <div className="trx-hero-stats-aligned">
              <div className="trx-stat-card-aligned card-stat-processing">
                <div className="stat-card-icon-box text-warning">
                  <i className="fa-solid fa-clock-rotate-left"></i>
                </div>
                <div className="stat-card-text">
                  <strong className="stat-number">{processingCount} Pesanan</strong>
                  <span className="stat-label">Sedang Diproses Admin</span>
                </div>
              </div>

              <div className="trx-stat-card-aligned card-stat-completed">
                <div className="stat-card-icon-box text-emerald">
                  <i className="fa-solid fa-circle-check"></i>
                </div>
                <div className="stat-card-text">
                  <strong className="stat-number">{completedCount} Pesanan</strong>
                  <span className="stat-label">Berhasil Selesai</span>
                </div>
              </div>

              <div className="trx-stat-card-aligned card-stat-warranty">
                <div className="stat-card-icon-box text-cyan">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <div className="stat-card-text">
                  <strong className="stat-number">100% Privat</strong>
                  <span className="stat-label">Database Khusus Akun</span>
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
                        - Tombol 1: Lihat Detail
                        - Tombol 2: Rating (jika berhasil terkirim) */}
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
              <h3>Belum Ada Riwayat Pesanan</h3>
              <p>
                {activeFilter === 'all'
                  ? `Halo ${authUser.name || 'Pengguna'}! Akun Anda (${authUser.email}) belum memiliki riwayat pesanan. Semua pembelian baru Anda akan otomatis tercatat secara privat di sini.`
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
        authUser={authUser}
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
