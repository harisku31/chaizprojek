import React, { useState } from 'react';
import { formatRupiah, copyToClipboard } from '../utils/format';

export default function TransactionModal({
  isOpen,
  onClose,
  transaction,
  onOpenRatingModal,
  onShowToast
}) {
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen || !transaction) return null;

  const isCompleted = transaction.status === 'completed';
  const creds = transaction.credentials || {};

  const handleCopy = async (text, label) => {
    if (!text) return;
    const success = await copyToClipboard(text);
    if (success) {
      onShowToast?.(`${label} berhasil disalin!`, 'fa-copy text-success');
    }
  };

  const formattedDate = new Date(transaction.createdAt).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      className="modal-overlay active"
      id="transactionDetailModal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box modal-box-redesign trx-modal-box">
        <button className="modal-close-btn" onClick={onClose} aria-label="Tutup">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Modal Header */}
        <div className="modal-header-centered trx-modal-header">
          <div className="trx-header-icon-wrap">
            <i className={`fa-solid ${isCompleted ? 'fa-circle-check text-emerald' : 'fa-clock-rotate-left text-amber'}`}></i>
          </div>
          <span className="modal-tag">DETAIL TRANSAKSI PELANGGAN</span>
          <h3 className="modal-title-centered">{transaction.productName}</h3>
          <div className="trx-status-pill-row">
            <span className={`trx-status-badge ${isCompleted ? 'status-completed' : 'status-processing'}`}>
              <i className={`fa-solid ${isCompleted ? 'fa-check-double' : 'fa-spinner fa-spin'}`}></i>
              {isCompleted ? 'Pesanan Berhasil / Terkirim' : 'Sedang Diproses Admin'}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="trx-modal-body">
          {/* 1. Rincian Informasi Pesanan & Garansi */}
          <div className="trx-meta-card">
            <div className="trx-meta-grid">
              <div className="meta-item">
                <span className="meta-label">ID Transaksi:</span>
                <strong className="meta-val id-val">{transaction.id}</strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">Tanggal Transaksi:</span>
                <strong className="meta-val">{formattedDate} WIB</strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">Paket / Durasi:</span>
                <strong className="meta-val text-cyan">{transaction.productDuration}</strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">Waktu Garansi:</span>
                <strong className="meta-val text-emerald">
                  <i className="fa-solid fa-shield-halved"></i> {transaction.warrantyPeriod || 'Garansi Penuh'}
                </strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">Metode Pembayaran:</span>
                <strong className="meta-val">{transaction.paymentMethod}</strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">Total Tagihan:</span>
                <strong className="meta-val text-warning total-val">{formatRupiah(transaction.total)}</strong>
              </div>
            </div>
          </div>

          {/* Bukti Pembayaran yang Terkirim */}
          {transaction.proofUrl ? (
            <div className="trx-proof-sent-box">
              <div className="proof-sent-header">
                <i className="fa-solid fa-receipt text-cyan"></i>
                <span>Foto Bukti Pembayaran Terkirim:</span>
              </div>
              <div className="proof-sent-preview">
                <img src={transaction.proofUrl} alt="Bukti Transfer" className="proof-sent-thumb" />
                <div className="proof-sent-details">
                  <strong>{transaction.proofFileName || 'Bukti_Pembayaran.png'}</strong>
                  <small className="text-muted">
                    <i className="fa-regular fa-clock"></i> Foto bukti otomatis terhapus setelah 2 hari demi privasi & kebersihan data.
                  </small>
                </div>
              </div>
            </div>
          ) : transaction.proofExpired ? (
            <div className="trx-proof-expired-notice">
              <i className="fa-solid fa-clock-rotate-left"></i>
              <span>{transaction.proofDeletedReason || 'Foto bukti transfer telah otomatis terhapus setelah masa aktif 2 hari.'}</span>
            </div>
          ) : null}

          {/* 2. Kolom Kredensial / Akun yang Diberikan Admin */}
          <div className="trx-credentials-section">
            <div className="section-header-row">
              <h4>
                <i className="fa-solid fa-key text-warning"></i> Data Akun & Akses Pengguna
              </h4>
              {isCompleted && (
                <span className="badge-status badge-guarantee">Siap Digunakan</span>
              )}
            </div>

            {!isCompleted ? (
              <div className="trx-processing-box">
                <div className="processing-spinner">
                  <i className="fa-solid fa-hourglass-half fa-spin"></i>
                </div>
                <div className="processing-text">
                  <strong>Admin Sedang Menyiapkan Akun Anda</strong>
                  <p>
                    Pesanan Anda sedang diproses oleh admin. Akun/key Anda akan langsung muncul di kolom ini begitu proses selesai (estimasi 1–5 menit).
                  </p>
                </div>
              </div>
            ) : (
              <div className="trx-creds-grid">
                {/* Email / Akun */}
                {creds.account && (
                  <div className="cred-field-card">
                    <div className="cred-info">
                      <span className="cred-label">Akun / Email:</span>
                      <strong className="cred-val">{creds.account}</strong>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm btn-copy"
                      onClick={() => handleCopy(creds.account, 'Email Akun')}
                      title="Salin Email"
                    >
                      <i className="fa-solid fa-copy"></i> Salin
                    </button>
                  </div>
                )}

                {/* Password / PW */}
                {creds.password && (
                  <div className="cred-field-card">
                    <div className="cred-info">
                      <span className="cred-label">Password / PW:</span>
                      <strong className="cred-val">
                        {showPassword ? creds.password : '••••••••••••'}
                      </strong>
                    </div>
                    <div className="cred-actions-group">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm btn-toggle-pw"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                      >
                        <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm btn-copy"
                        onClick={() => handleCopy(creds.password, 'Password')}
                        title="Salin Password"
                      >
                        <i className="fa-solid fa-copy"></i> Salin
                      </button>
                    </div>
                  </div>
                )}

                {/* Username */}
                {creds.username && (
                  <div className="cred-field-card">
                    <div className="cred-info">
                      <span className="cred-label">Username:</span>
                      <strong className="cred-val">{creds.username}</strong>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm btn-copy"
                      onClick={() => handleCopy(creds.username, 'Username')}
                      title="Salin Username"
                    >
                      <i className="fa-solid fa-copy"></i> Salin
                    </button>
                  </div>
                )}

                {/* PIN Profil */}
                {creds.pin && (
                  <div className="cred-field-card">
                    <div className="cred-info">
                      <span className="cred-label">PIN Profil:</span>
                      <strong className="cred-val pin-val">{creds.pin}</strong>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm btn-copy"
                      onClick={() => handleCopy(creds.pin, 'PIN Profil')}
                      title="Salin PIN"
                    >
                      <i className="fa-solid fa-copy"></i> Salin
                    </button>
                  </div>
                )}

                {/* Profile / Profil Pengguna */}
                {creds.profile && (
                  <div className="cred-field-card">
                    <div className="cred-info">
                      <span className="cred-label">Nama Profile:</span>
                      <strong className="cred-val">{creds.profile}</strong>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm btn-copy"
                      onClick={() => handleCopy(creds.profile, 'Nama Profile')}
                      title="Salin Profile"
                    >
                      <i className="fa-solid fa-copy"></i> Salin
                    </button>
                  </div>
                )}

                {/* Code / Key */}
                {creds.code && (
                  <div className="cred-field-card">
                    <div className="cred-info">
                      <span className="cred-label">Kode / Steam Key / Link:</span>
                      <strong className="cred-val code-val">{creds.code}</strong>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm btn-copy"
                      onClick={() => handleCopy(creds.code, 'Kode Key')}
                      title="Salin Kode Key"
                    >
                      <i className="fa-solid fa-copy"></i> Salin
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Catatan Khusus dari Admin */}
          {transaction.adminNote && (
            <div className="trx-admin-note-box">
              <div className="admin-note-header">
                <i className="fa-solid fa-comment-dots text-cyan"></i>
                <strong>Catatan Khusus dari Admin:</strong>
              </div>
              <p className="admin-note-text">{transaction.adminNote}</p>
            </div>
          )}

          {/* 4. Tampilan Rating jika sudah pernah diberi rating */}
          {transaction.rating && (
            <div className="trx-user-rating-box">
              <div className="user-rating-header">
                <div className="rating-stars">
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className={`fa-solid fa-star ${i < transaction.rating.stars ? 'star-filled' : 'star-empty'}`}
                    ></i>
                  ))}
                </div>
                <span className="rating-tag">Ulasan Anda</span>
              </div>
              <p className="user-rating-comment">"{transaction.rating.comment}"</p>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="trx-modal-footer">
          {isCompleted && !transaction.rating && (
            <button
              type="button"
              className="btn btn-primary btn-rating"
              onClick={() => {
                onClose();
                onOpenRatingModal(transaction);
              }}
            >
              <i className="fa-solid fa-star"></i> Beri Rating & Ulasan
            </button>
          )}

          <button type="button" className="btn btn-outline" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
