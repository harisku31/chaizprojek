import React from 'react';

export default function AnnouncementBar({
  onOpenInstall,
  onOpenTesti,
  onOpenFaq
}) {
  return (
    <div className="announcement-bar itemku-top-bar">
      <div className="container announcement-content">
        <div className="announcement-left">
          <span className="announcement-badge">
            <i className="fa-solid fa-shield-halved"></i> Garansi Resmi
          </span>
          <span className="announcement-text">
            Jual Beli Akun Digital & Game Terpercaya #1 di Indonesia • Proses 1-5 Menit!
          </span>
        </div>

        <div className="announcement-right">
          {onOpenInstall && (
            <button
              type="button"
              className="top-bar-link"
              onClick={onOpenInstall}
              title="Download Aplikasi ChaizStore di HP"
            >
              <i className="fa-solid fa-mobile-screen"></i> Download App
            </button>
          )}

          {onOpenTesti && (
            <button
              type="button"
              className="top-bar-link"
              onClick={onOpenTesti}
              title="Testimoni Pembeli"
            >
              <i className="fa-solid fa-star text-warning"></i> Testimoni
            </button>
          )}

          <a
            href="https://wa.me/6287795172347?text=Halo%20Admin%20ChaizStore,%20mau%20tanya%20produk%20dan%20stok"
            target="_blank"
            rel="noopener noreferrer"
            className="top-bar-link"
            title="Customer Service 24 Jam"
          >
            <i className="fa-brands fa-whatsapp text-success"></i> CS 24 Jam
          </a>
        </div>
      </div>
    </div>
  );
}
