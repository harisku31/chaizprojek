import React from 'react';
import { APP_VERSION } from '../utils/version.js';

export default function Footer({ onOpenLogin, onOpenInstall, onOpenTestimonials, onShowToast }) {
  const handleSocialClick = (platform, e) => {
    e.preventDefault();
    onShowToast(`Link ${platform} akan segera tersedia! Hubungi WhatsApp untuk respon cepat.`, 'fa-circle-info');
  };

  return (
    <footer className="footer itemku-footer">
      <div className="container footer-content">
        {/* Brand Info */}
        <div className="footer-brand">
          <a href="#" className="itemku-brand-logo footer-logo">
            <span className="itemku-logo-icon">
              <img src="/chaizz.png" alt="ChaizStore" className="logo-img" />
            </span>
            <div className="itemku-logo-text">
              <span className="brand-itemku">chaiz<span>store</span></span>
              <span className="itemku-dot"></span>
            </div>
          </a>
          <p className="footer-desc">
            ChaizStore adalah platform marketplace digital terpercaya penyedia akun premium streaming film, musik, desain grafis, AI tools, dan top up game terlengkap di Indonesia dengan jaminan 100% legal dan garansi penuh.
          </p>

          <div className="itemku-footer-trust-chips">
            <span className="trust-chip"><i className="fa-solid fa-shield-halved text-success"></i> Garansi 100% Anti Hackback</span>
            <span className="trust-chip"><i className="fa-solid fa-bolt text-warning"></i> Pengiriman Otomatis 1-5 Menit</span>
          </div>

          <div className="social-links">
            <a href="https://wa.me/6287795172347" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="social-icon-wa">
              <i className="fa-brands fa-whatsapp"></i>
            </a>
            <a href="#" onClick={(e) => handleSocialClick('Instagram', e)} aria-label="Instagram">
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a href="#" onClick={(e) => handleSocialClick('Telegram', e)} aria-label="Telegram">
              <i className="fa-brands fa-telegram"></i>
            </a>
            <a href="#" onClick={(e) => handleSocialClick('TikTok', e)} aria-label="TikTok">
              <i className="fa-brands fa-tiktok"></i>
            </a>
          </div>
        </div>

        {/* Layanan & Kategori */}
        <div className="footer-col">
          <h4>Kategori Populer</h4>
          <ul>
            <li><a href="#katalog"><i className="fa-solid fa-cube text-danger"></i> Robux & Roblox Kilat</a></li>
            <li><a href="#katalog"><i className="fa-brands fa-steam text-cyan"></i> Steam Key Resmi Valve</a></li>
            <li><a href="#katalog"><i className="fa-solid fa-film text-danger"></i> Netflix Premium 4K UHD</a></li>
            <li><a href="#katalog"><i className="fa-solid fa-play text-success"></i> Alight Motion Pro</a></li>
            <li><a href="#katalog"><i className="fa-brands fa-youtube text-danger"></i> YouTube Premium No-Ads</a></li>
            <li><a href="#katalog"><i className="fa-solid fa-palette text-cyan"></i> Canva Pro Desain & AI</a></li>
            <li><a href="#katalog"><i className="fa-solid fa-robot text-purple"></i> Gemini Advanced AI</a></li>
          </ul>
        </div>

        {/* Bantuan & Panduan */}
        <div className="footer-col">
          <h4>Bantuan & Akun</h4>
          <ul>
            <li>
              <a
                href="#setting"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('floatingSettingBtn')?.click();
                }}
              >
                <i className="fa-solid fa-book-open"></i> Cara Pemesanan & FAQ
              </a>
            </li>
            <li>
              <a
                href="#testimoni"
                onClick={(e) => {
                  e.preventDefault();
                  if (typeof onOpenTestimonials === 'function') onOpenTestimonials();
                }}
              >
                <i className="fa-solid fa-star text-warning"></i> Testimoni Pembeli
              </a>
            </li>
            <li>
              <button
                type="button"
                className="footer-btn-link"
                onClick={onOpenInstall}
              >
                <i className="fa-solid fa-mobile-screen text-blue"></i> Download Aplikasi ChaizStore
              </button>
            </li>
            <li>
              <button
                type="button"
                className="footer-btn-link"
                onClick={onOpenLogin}
              >
                <i className="fa-solid fa-user-circle text-orange"></i> Masuk / Daftar Akun
              </button>
            </li>
          </ul>
        </div>

        {/* Metode Pembayaran */}
        <div className="footer-col footer-col-payment">
          <h4>Metode Pembayaran</h4>
          <p className="payment-note">Transaksi aman, instan & otomatis 24 jam:</p>
          <div className="itemku-payment-badges payment-framed-grid">
            {/* 1. QRIS (Semua E-Wallet) */}
            <div className="pay-badge-frame pay-badge-qris-wide" title="QRIS (Semua E-Wallet & Bank)">
              <img src="/Qris.png" alt="QRIS" className="pay-logo-img pay-logo-qris" />
              <span className="pay-frame-text">QRIS (Semua E-Wallet)</span>
            </div>

            {/* 2. DANA */}
            <div className="pay-badge-frame" title="DANA E-Wallet">
              <img src="/dana.png" alt="DANA" className="pay-logo-img pay-logo-dana" />
            </div>

            {/* 3. GoPay */}
            <div className="pay-badge-frame" title="GoPay Instant">
              <img src="/gopay.png" alt="GoPay" className="pay-logo-img pay-logo-gopay" />
            </div>

            {/* 4. OVO */}
            <div className="pay-badge-frame" title="OVO E-Wallet">
              <img src="/ovo.png" alt="OVO" className="pay-logo-img pay-logo-ovo" />
            </div>

            {/* 5. ShopeePay */}
            <div className="pay-badge-frame" title="ShopeePay">
              <img src="/shoopepay.png" alt="ShopeePay" className="pay-logo-img pay-logo-spay" />
            </div>

            {/* 6. BCA */}
            <div className="pay-badge-frame" title="Bank BCA">
              <img src="/bca.png" alt="BCA" className="pay-logo-img pay-logo-bca" />
            </div>

            {/* 7. Mandiri */}
            <div className="pay-badge-frame" title="Bank Mandiri">
              <img src="/mandiri.svg" alt="Mandiri" className="pay-logo-img pay-logo-mandiri" />
            </div>

            {/* 8. BRI */}
            <div className="pay-badge-frame" title="Bank BRI">
              <img src="/bri.svg" alt="BRI" className="pay-logo-img pay-logo-bri" />
            </div>

            {/* 9. SeaBank */}
            <div className="pay-badge-frame" title="SeaBank">
              <img src="/seanbank.png" alt="SeaBank" className="pay-logo-img pay-logo-seabank" />
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>
            &copy; 2026 <strong>chaizstore</strong>. Terinspirasi dari kemudahan marketplace digital &bull; Versi {APP_VERSION}
          </p>
          <div className="terms-link">
            <span>Aman &bull; Cepat &bull; Bergaransi</span>
            <span className="terms-separator">&bull;</span>
            <a href="/admin.html" target="_blank" rel="noopener noreferrer" className="admin-footer-link" title="Portal Admin">
              <i className="fa-solid fa-shield-halved"></i> Portal Toko
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
