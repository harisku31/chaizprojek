import React from 'react';

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="container hero-container">
        <div className="hero-content">
          <div className="hero-badge">
            <i className="fa-solid fa-circle-check"></i> #1 Trusted Digital Store di Indonesia
          </div>
          <h1 className="hero-title">
            Beli Akun Premium <span className="gradient-text">Murah, Legal</span> & Bergaransi Penuh
          </h1>
          <p className="hero-desc">
            Nikmati hiburan streaming, musik, produktivitas, dan AI tanpa batasan iklan. Proses otomatis kilat 1-5 menit langsung aktif ke perangkat kamu.
          </p>
          
          <div className="hero-buttons">
            <a href="#katalog" className="btn btn-primary">
              <i className="fa-solid fa-store"></i> Beli Sekarang
            </a>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                const btn = document.getElementById('floatingSettingBtn');
                if (btn) btn.click();
              }}
            >
              <i className="fa-solid fa-list-check"></i> Cara Pemesanan
            </button>
          </div>

          {/* Quick Perks Highlights */}
          <div className="hero-quick-perks">
            <span><i className="fa-solid fa-circle-check text-success"></i> 100% Legal</span>
            <span><i className="fa-solid fa-bolt text-warning"></i> Kilat 1-5 Menit</span>
            <span><i className="fa-solid fa-shield-check text-cyan"></i> Full Garansi</span>
            <span><i className="fa-solid fa-headset text-primary"></i> CS 24 Jam</span>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">1.234+</span>
              <span className="stat-label">Akun Terjual</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">4.9 / 5.0</span>
              <span className="stat-label">Rating Pelanggan</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">100%</span>
              <span className="stat-label">Garansi Aman</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-card-glow"></div>
          {/* Bingkai Poster Banner Kotak (1:1 Aspect Ratio) */}
          <div className="banner-poster-frame">
            <div className="banner-inner">
              <img src="/banner.jpg" alt="ChaizStore Promo Akun Premium" className="banner-poster-img" id="heroBannerImg" />
              <div className="banner-badge-corner">
                <i className="fa-solid fa-fire text-warning"></i> PROMO SPESIAL
              </div>
              <div className="banner-floating-tag">
                <i className="fa-solid fa-circle-check text-success"></i> Official & Bergaransi
              </div>
            </div>
          </div>

          {/* Card Deskripsi & Kelebihan Promo Banner */}
          <div className="banner-promo-desc-card">
            <div className="promo-desc-header">
              <span className="promo-pill-tag"><i className="fa-solid fa-bolt text-warning"></i> PROMO SPESIAL S/D 70%</span>
              <span className="promo-live-badge"><i className="fa-solid fa-circle text-success pulse-dot"></i> Promo Aktif</span>
            </div>
            <h4 className="promo-desc-title">Keunggulan & Kelebihan Beli di ChaizStore:</h4>
            <div className="promo-perks-grid">
              <div className="promo-perk-item">
                <i className="fa-solid fa-shield-halved text-success"></i>
                <div>
                  <strong>Full Garansi Sesuai Durasi</strong>
                  <small>Kena masalah atau hold? Diganti akun baru langsung tanpa ribet selama masa aktif.</small>
                </div>
              </div>
              <div className="promo-perk-item">
                <i className="fa-solid fa-bolt text-warning"></i>
                <div>
                  <strong>Aktivasi Kilat 1 - 5 Menit</strong>
                  <small>Setelah pembayaran terverifikasi, pesanan otomatis dikirim dalam 1-5 menit via WhatsApp.</small>
                </div>
              </div>
              <div className="promo-perk-item">
                <i className="fa-solid fa-credit-card text-cyan"></i>
                <div>
                  <strong>Pembayaran Mudah & Lengkap</strong>
                  <small>Support QRIS All Bank & E-Wallet instan (DANA, OVO, GoPay, ShopeePay, BCA, Mandiri).</small>
                </div>
              </div>
              <div className="promo-perk-item">
                <i className="fa-solid fa-headset text-primary"></i>
                <div>
                  <strong>CS Siap Bantu 24 Jam Nonstop</strong>
                  <small>Ada kendala atau pertanyaan? Tim admin responsif kami siap membantu kapan pun.</small>
                </div>
              </div>
            </div>
            <div className="promo-desc-footer">
              <i className="fa-solid fa-circle-check text-success"></i>
              <span><strong>100% Legal & Aman:</strong> Akses resmi legal, bebas banned/suspend, dan panduan lengkap pemakaian!</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
