import React from 'react';

export default function Footer({ onOpenLogin, onShowToast }) {
  const handleSocialClick = (platform, e) => {
    e.preventDefault();
    onShowToast(`Mohon maaf, link ${platform} belum di-update sama developer`, 'fa-circle-info');
  };

  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <a href="#" className="logo">
            <span className="logo-badge">
              <img src="/chaizz.png" alt="ChaizStore" className="logo-img" />
            </span>
            <div className="logo-text">
              <span className="brand-name">Chaiz<span>Store</span></span>
              <span className="brand-tag">Premium Digital Account</span>
            </div>
          </a>
          <p className="footer-desc">
            ChaizStore adalah platform terpercaya penyedia layanan akun premium aplikasi streaming, musik, desain grafis, dan AI dengan harga termurah dan bergaransi penuh.
          </p>
          <div className="social-links">
            <a href="#" onClick={(e) => handleSocialClick('Instagram', e)} aria-label="Instagram">
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a href="#" onClick={(e) => handleSocialClick('WhatsApp', e)} aria-label="WhatsApp">
              <i className="fa-brands fa-whatsapp"></i>
            </a>
            <a href="#" onClick={(e) => handleSocialClick('Telegram', e)} aria-label="Telegram">
              <i className="fa-brands fa-telegram"></i>
            </a>
            <a href="#" onClick={(e) => handleSocialClick('TikTok', e)} aria-label="TikTok">
              <i className="fa-brands fa-tiktok"></i>
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Navigasi</h4>
          <ul>
            <li><a href="#katalog">Katalog Produk</a></li>
            <li><a href="#cara-order">Panduan Pemesanan</a></li>
            <li><a href="#testimoni">Testimoni Pembeli</a></li>
            <li><a href="#faq">Pusat Bantuan / FAQ</a></li>
            <li>
              <a
                href="javascript:void(0)"
                onClick={onOpenLogin}
                style={{ color: '#fbbf24', fontWeight: 600 }}
              >
                <i className="fa-solid fa-crown text-warning"></i> Login Akun / Member
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Akun Populer</h4>
          <ul>
            <li><a href="#katalog">Netflix Premium 4K</a></li>
            <li><a href="#katalog">Spotify Premium Family</a></li>
            <li><a href="#katalog">YouTube Premium No Ads</a></li>
            <li><a href="#katalog">Canva Pro Lifetime</a></li>
            <li><a href="#katalog">Gemini Advanced AI</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Metode Pembayaran</h4>
          <p className="payment-note">Mendukung pembayaran instan melalui:</p>
          <div className="payment-badges">
            <span className="pay-badge"><i className="fa-solid fa-qrcode"></i> QRIS</span>
            <span className="pay-badge"><i className="fa-solid fa-wallet"></i> DANA</span>
            <span className="pay-badge"><i className="fa-solid fa-wallet"></i> GoPay</span>
            <span className="pay-badge"><i className="fa-solid fa-wallet"></i> OVO</span>
            <span className="pay-badge"><i className="fa-solid fa-building-columns"></i> BCA</span>
            <span className="pay-badge"><i className="fa-solid fa-building-columns"></i> Mandiri</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>&copy; 2026 ChaizStore. All rights reserved. Jual Beli Akun Premium Terpercaya.</p>
          <div className="terms-link">
            <span>Aman &bull; Cepat &bull; Bergaransi</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
