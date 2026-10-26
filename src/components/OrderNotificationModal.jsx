import React from 'react';

export default function OrderNotificationModal({
  isOpen,
  order,
  onClose,
  onOpenOrderDetail
}) {
  if (!isOpen || !order) return null;

  const isCompleted = order.status === 'completed';
  const isRejected = order.status === 'rejected';

  const waMessage = encodeURIComponent(
    `Halo Admin ChaizStore, saya ingin konfirmasi pesanan saya #${order.id} (${order.productName || 'Produk'}) yang berstatus ${isCompleted ? 'Sukses' : 'Ditolak'}.`
  );
  const waUrl = `https://wa.me/6287795172347?text=${waMessage}`;

  return (
    <div
      className="order-notif-overlay active"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={`order-notif-card ${isCompleted ? 'card-success' : 'card-rejected'}`}>
        {/* Glow ambient background effect */}
        <div className={`order-notif-glow ${isCompleted ? 'glow-success' : 'glow-rejected'}`}></div>

        {/* Close Button */}
        <button
          type="button"
          className="order-notif-close-btn"
          onClick={onClose}
          aria-label="Tutup Notifikasi"
          title="Tutup"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Header Icon with pulsating wave */}
        <div className="order-notif-header">
          <div className={`order-notif-icon-circle ${isCompleted ? 'icon-success' : 'icon-rejected'}`}>
            <i className={`fa-solid ${isCompleted ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
            <div className={`order-notif-pulse ${isCompleted ? 'pulse-success' : 'pulse-rejected'}`}></div>
          </div>

          <div className="order-notif-badge-wrap">
            <span className={`order-notif-badge ${isCompleted ? 'badge-success' : 'badge-rejected'}`}>
              <i className={`fa-solid ${isCompleted ? 'fa-bell-ring' : 'fa-triangle-exclamation'}`}></i>
              {isCompleted ? 'KIRIMAN BARU DARI ADMIN' : 'PEMBERITAHUAN ADMIN'}
            </span>
          </div>

          <h3 className="order-notif-title">
            {isCompleted ? '🎉 Pesanan Anda Selesai Diproses!' : '⚠️ Pesanan Anda Ditolak Admin'}
          </h3>
          <p className="order-notif-subtitle">
            {isCompleted
              ? 'Admin ChaizStore telah memverifikasi & mengirimkan akun pesanan Anda.'
              : 'Mohon maaf, admin belum dapat memproses pesanan Anda saat ini.'}
          </p>
        </div>

        {/* Body Order Details */}
        <div className="order-notif-body">
          {/* Item Meta Box */}
          <div className="order-notif-product-box">
            <div className="product-box-header">
              <span className="order-id-label">ID Pesanan:</span>
              <strong className="order-id-code">#{order.id}</strong>
            </div>
            <div className="product-box-content">
              <div className="product-title-row">
                <i className={`fa-solid ${isCompleted ? 'fa-box-open text-cyan' : 'fa-box text-rose'}`}></i>
                <span className="product-title-text">{order.productName || 'Produk Digital'}</span>
              </div>
              <div className="product-meta-row">
                <span className="meta-pill duration">
                  <i className="fa-regular fa-clock"></i> {order.productDuration || 'Reguler'}
                </span>
                {order.warrantyPeriod && (
                  <span className="meta-pill warranty">
                    <i className="fa-solid fa-shield-halved"></i> {order.warrantyPeriod}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Admin Message / Note Bubble */}
          {isCompleted && (
            <div className="order-notif-message-card success">
              <div className="message-label">
                <i className="fa-solid fa-comment-dots text-emerald"></i>
                <span>Pesan dari Admin:</span>
              </div>
              <p className="message-text">
                {order.adminNote || 'Pesanan Anda telah selesai diproses oleh Admin ChaizStore. Selamat menikmati layanan kami!'}
              </p>
              {order.credentials && (order.credentials.account || order.credentials.code) && (
                <div className="credentials-teaser">
                  <i className="fa-solid fa-key text-warning"></i>
                  <span>Akun & sandi login sudah siap disalin di menu Riwayat Transaksi.</span>
                </div>
              )}
            </div>
          )}

          {isRejected && (
            <div className="order-notif-message-card rejected">
              <div className="message-label">
                <i className="fa-solid fa-triangle-exclamation text-danger"></i>
                <span>Alasan Penolakan:</span>
              </div>
              <p className="message-text reject-reason">
                "{order.rejectReason || order.adminNote || 'Bukti transfer tidak valid atau stok produk sedang habis.'}"
              </p>
              <p className="reject-helper-text">
                Jika Anda sudah melakukan transfer dana, jangan khawatir! Silakan langsung hubungi Admin via WhatsApp dengan klik tombol di bawah untuk konfirmasi atau refund penuh 100%.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="order-notif-actions">
          {isCompleted ? (
            <>
              <button
                type="button"
                className="btn-notif-primary btn-notif-success"
                onClick={() => onOpenOrderDetail(order)}
              >
                <i className="fa-solid fa-receipt"></i>
                <span>Buka & Salin Akun Sekarang</span>
                <i className="fa-solid fa-arrow-right arrow-icon"></i>
              </button>
              <button
                type="button"
                className="btn-notif-secondary"
                onClick={onClose}
              >
                Nanti Saja
              </button>
            </>
          ) : (
            <>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-notif-primary btn-notif-wa"
                onClick={onClose}
              >
                <i className="fa-brands fa-whatsapp"></i>
                <span>Hubungi CS Admin via WhatsApp</span>
              </a>
              <button
                type="button"
                className="btn-notif-secondary"
                onClick={() => onOpenOrderDetail(order)}
              >
                <i className="fa-solid fa-receipt"></i>
                <span>Buka Riwayat Transaksi</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
