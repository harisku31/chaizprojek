import React, { useState, useEffect, useRef } from 'react';

export default function Hero({ onSwitchTab }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartXRef = useRef(null);
  const touchEndXRef = useRef(null);

  const SLIDES_COUNT = 4;
  const SLIDE_INTERVAL = 4000;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES_COUNT);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [currentSlide]);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES_COUNT);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES_COUNT) % SLIDES_COUNT);
  };

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current !== null && touchEndXRef.current !== null) {
      const distance = touchStartXRef.current - touchEndXRef.current;
      if (distance > 50) {
        handleNext();
      } else if (distance < -50) {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const slides = [
    // Slide 1: Akun Premium Resmi
    {
      id: 1,
      bgImage: '/banner-premium-ai.png',
      fallbackImage: '/banner.jpg',
      badge: 'PROMO SPESIAL DIGITAL',
      badgeColor: 'blue',
      title: 'Beli Akun Premium Murah, Legal & Bergaransi',
      desc: 'Netflix 4K, Spotify, YouTube No-Ads, Canva Pro & AI Tools siap pakai langsung aktif dalam 1-5 menit!',
      btnText: 'Beli Sekarang',
      btnIcon: 'fa-cart-shopping',
      action: () => {
        const el = document.getElementById('katalog');
        el?.scrollIntoView({ behavior: 'smooth' });
      },
      tagPill: 'Diskon s/d 70%'
    },
    // Slide 2: Robux Roblox
    {
      id: 2,
      bgImage: '/roblox.png',
      fallbackImage: '/banner.jpg',
      badge: 'TOP UP GAME TERLARIS',
      badgeColor: 'orange',
      title: 'Top Up Robux Roblox Kilat 1-3 Menit Masuk',
      desc: 'Cukup username Roblox tanpa butuh password akun. 100% aman anti-banned dengan rate termurah!',
      btnText: 'Top Up Robux',
      btnIcon: 'fa-bolt',
      action: () => onSwitchTab?.('roblox'),
      tagPill: 'Rate Termurah'
    },
    // Slide 3: Steam Key Valve
    {
      id: 3,
      bgImage: '/banner-steam.png',
      fallbackImage: '/steamori.png',
      badge: 'GAME RESMI VALVE',
      badgeColor: 'cyan',
      title: 'Steam Key Game Original PC Mulai Rp 1.500 Saja!',
      desc: 'Game original bergaransi Valve, aktivasi langsung ke library Steam. Varian Epic AAA, Original & NSFW.',
      btnText: 'Klaim Steam Key',
      btnIcon: 'fa-gamepad',
      action: () => onSwitchTab?.('steam'),
      tagPill: 'Mulai Rp 1.500'
    },
    // Slide 4: Netflix 4K
    {
      id: 4,
      bgImage: '/banner-netflix.png',
      fallbackImage: '/netflix.png',
      badge: 'STREAMING FAVORIT',
      badgeColor: 'red',
      title: 'Netflix Premium Ultra HD 4K Hanya Rp 25.000!',
      desc: 'Nonton ribuan film, serial & drakor favorit kualitas 4K tanpa batas. Full garansi selama berlangganan!',
      btnText: 'Beli Netflix Rp 25rb',
      btnIcon: 'fa-play',
      action: () => {
        const el = document.getElementById('katalog');
        el?.scrollIntoView({ behavior: 'smooth' });
      },
      tagPill: 'Hanya Rp 25.000'
    }
  ];

  return (
    <section className="hero-landscape-section itemku-hero-section">
      <div className="container">
        {/* Main Banner Slider Carousel */}
        <div
          className="itemku-carousel-wrap"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="itemku-carousel-track"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                className={`itemku-slide ${currentSlide === idx ? 'active' : ''}`}
              >
                <img
                  src={slide.bgImage}
                  alt={slide.title}
                  className="itemku-slide-bg"
                  onError={(e) => {
                    if (slide.fallbackImage && e.currentTarget.src !== slide.fallbackImage) {
                      e.currentTarget.src = slide.fallbackImage;
                    }
                  }}
                />
                <div className="itemku-slide-overlay">
                  <div className="itemku-slide-content">
                    <div className="itemku-slide-top-badges">
                      <span className={`slide-badge-pill badge-${slide.badgeColor}`}>
                        <i className="fa-solid fa-crown"></i> {slide.badge}
                      </span>
                      {slide.tagPill && (
                        <span className="slide-tag-promo">
                          <i className="fa-solid fa-fire"></i> {slide.tagPill}
                        </span>
                      )}
                    </div>

                    <h2 className="itemku-slide-title">{slide.title}</h2>
                    <p className="itemku-slide-desc">{slide.desc}</p>

                    <div className="itemku-slide-action-row">
                      <button
                        type="button"
                        className="btn-itemku-hero-cta"
                        onClick={slide.action}
                      >
                        <i className={`fa-solid ${slide.btnIcon}`}></i>
                        <span>{slide.btnText}</span>
                        <i className="fa-solid fa-arrow-right"></i>
                      </button>

                      <div className="itemku-slide-features-inline">
                        <span><i className="fa-solid fa-shield-halved text-success"></i> 100% Legal</span>
                        <span><i className="fa-solid fa-bolt text-warning"></i> Proses Kilat</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Nav Arrows */}
          <button
            type="button"
            className="itemku-arrow prev"
            onClick={handlePrev}
            aria-label="Banner Sebelumnya"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <button
            type="button"
            className="itemku-arrow next"
            onClick={handleNext}
            aria-label="Banner Berikutnya"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>

          {/* Dots Indicator */}
          <div className="itemku-dots">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`itemku-dot-item ${currentSlide === idx ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Slide ${idx + 1}`}
              ></button>
            ))}
          </div>
        </div>

        {/* ITEMKU TRUST BAR (4 KARTU KEUNGGULAN UTAMA) */}
        <div className="itemku-trust-bar">
          <div className="trust-card">
            <div className="trust-icon-box bg-blue-soft">
              <i className="fa-solid fa-bolt-lightning text-blue"></i>
            </div>
            <div className="trust-text">
              <strong>Pengiriman Kilat 1-5 Menit</strong>
              <small>Proses otomatis & instan siap pakai</small>
            </div>
          </div>

          <div className="trust-card">
            <div className="trust-icon-box bg-green-soft">
              <i className="fa-solid fa-shield-halved text-success"></i>
            </div>
            <div className="trust-text">
              <strong>Garansi Toko 100% Aman</strong>
              <small>Garansi anti hackback & full ganti baru</small>
            </div>
          </div>

          <div className="trust-card">
            <div className="trust-icon-box bg-orange-soft">
              <i className="fa-solid fa-wallet text-orange"></i>
            </div>
            <div className="trust-text">
              <strong>Pembayaran Terlengkap</strong>
              <small>QRIS All Payment, E-Wallet & All Bank</small>
            </div>
          </div>

          <div className="trust-card">
            <div className="trust-icon-box bg-purple-soft">
              <i className="fa-solid fa-headset text-purple"></i>
            </div>
            <div className="trust-text">
              <strong>Layanan CS 24 Jam Nonstop</strong>
              <small>Bantuan cepat & ramah setiap hari</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
