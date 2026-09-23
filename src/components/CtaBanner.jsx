import React from 'react';

export default function CtaBanner() {
  return (
    <section className="cta-section">
      <div className="container cta-container">
        <div className="cta-card">
          <div className="cta-content">
            <h2>Mau Request Akun Premium Lainnya?</h2>
            <p>
              Belum menemukan akun yang kamu cari? Hubungi admin untuk request aplikasi atau akun digital lainnya dengan harga terbaik.
            </p>
            <a
              href="https://wa.me/6287795172347?text=Halo%20Admin%20ChaizStore,%20saya%20mau%20request%20akun%20premium"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <i className="fa-brands fa-whatsapp"></i> Chat Admin Sekarang
            </a>
          </div>
          <div className="cta-icon-box">
            <i className="fa-solid fa-headset"></i>
          </div>
        </div>
      </div>
    </section>
  );
}
