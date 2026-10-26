import React, { useState, useEffect, useRef } from 'react';

const HERO_PARTICLES = [
  { id: 1, left: '8%', top: '30%', size: 5, delay: '0s', dur: '2.8s', color: 'cyan' },
  { id: 2, left: '18%', top: '65%', size: 6, delay: '0.5s', dur: '3.2s', color: 'blue' },
  { id: 3, left: '26%', top: '22%', size: 4, delay: '1.0s', dur: '2.5s', color: 'white' },
  { id: 4, left: '34%', top: '78%', size: 7, delay: '1.4s', dur: '3.4s', color: 'purple' },
  { id: 5, left: '42%', top: '35%', size: 5, delay: '0.3s', dur: '2.7s', color: 'cyan' },
  { id: 6, left: '50%', top: '68%', size: 6, delay: '1.8s', dur: '3.1s', color: 'blue' },
  { id: 7, left: '58%', top: '18%', size: 4, delay: '0.7s', dur: '2.4s', color: 'white' },
  { id: 8, left: '66%', top: '82%', size: 7, delay: '2.1s', dur: '3.5s', color: 'purple' },
  { id: 9, left: '74%', top: '42%', size: 5, delay: '0.9s', dur: '2.8s', color: 'cyan' },
  { id: 10, left: '82%', top: '26%', size: 6, delay: '1.5s', dur: '3.3s', color: 'blue' },
  { id: 11, left: '90%', top: '70%', size: 4, delay: '0.4s', dur: '2.5s', color: 'white' },
  { id: 12, left: '95%', top: '38%', size: 6, delay: '1.9s', dur: '3.2s', color: 'cyan' },
  { id: 13, left: '12%', top: '85%', size: 5, delay: '1.2s', dur: '3.0s', color: 'purple' },
  { id: 14, left: '30%', top: '48%', size: 4, delay: '0.6s', dur: '2.6s', color: 'white' },
  { id: 15, left: '62%', top: '58%', size: 6, delay: '1.7s', dur: '3.1s', color: 'blue' },
  { id: 16, left: '86%', top: '85%', size: 5, delay: '0.8s', dur: '2.9s', color: 'cyan' }
];

export default function Hero({ onSwitchTab }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartXRef = useRef(null);
  const touchEndXRef = useRef(null);

  const SLIDES_COUNT = 4;
  const SLIDE_INTERVAL = 3600; // Bergulir otomatis setiap 3.6 detik nonstop

  // Auto slide bergulir otomatis tiap 3.6 detik secara nonstop
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
        handleNext(); // swipe left -> next
      } else if (distance < -50) {
        handlePrev(); // swipe right -> prev
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const openHowToOrder = () => {
    const btn = document.getElementById('floatingSettingBtn');
    if (btn) btn.click();
  };

  const slides = [
    // Slide 1: Akun Premium AI Generated Banner
    {
      id: 1,
      themeClass: 'banner-theme-premium',
      bgImage: '/banner-premium-ai.png',
      fallbackImage: '/banner.jpg',
      badgeIcon: 'fa-solid fa-crown text-warning',
      badgeText: 'AKUN PREMIUM RESMI AI GENERATED • 100% LEGAL',
      mobileBadge: '👑 Akun Premium 100% Legal',
      title: 'Beli Akun Premium Murah, Legal & Bergaransi Penuh',
      mobileTitle: 'Beli Akun Premium Murah & Legal',
      desc: 'Streaming Netflix 4K, Spotify Musik, YouTube No-Ads, Canva Pro & AI Tools tanpa gangguan. Proses kilat 1-5 menit langsung aktif bergaransi resmi!',
      perks: [
        { icon: 'fa-shield-halved text-success', text: '100% Legal & Bergaransi' },
        { icon: 'fa-bolt text-warning', text: 'Aktivasi Kilat 1-5 Menit' },
        { icon: 'fa-qrcode text-cyan', text: 'QRIS & E-Wallet All Bank' }
      ],
      primaryBtn: {
        text: 'Beli Akun Sekarang',
        mobileText: 'Beli Sekarang',
        icon: 'fa-store',
        action: () => {
          const el = document.getElementById('katalog');
          el?.scrollIntoView({ behavior: 'smooth' });
        }
      },
      secondaryBtn: {
        text: 'Cara Pemesanan',
        icon: 'fa-list-check',
        action: openHowToOrder
      },
      visualType: 'apps-grid'
    },

    // Slide 2: Top Up Robux Roblox (Background Foto Roblox Asli)
    {
      id: 2,
      themeClass: 'banner-theme-roblox',
      bgImage: '/roblox.png',
      fallbackImage: '/banner.jpg',
      badgeIcon: 'fa-solid fa-cube text-danger',
      badgeText: 'TOP UP ROBLOX KILAT • RATE TERMURAH',
      mobileBadge: '⚡ Robux Rate Termurah',
      title: 'Top Up Robux Roblox Murah, Proses 1-3 Menit Langsung Masuk',
      mobileTitle: 'Top Up Robux Kilat 1-3 Menit',
      desc: 'Cukup masukkan username Roblox tanpa butuh password akun. 100% aman anti-banned, stok selalu melimpah & rate paling hemat se-Indonesia!',
      perks: [
        { icon: 'fa-lock text-cyan', text: 'Tanpa Password Akun' },
        { icon: 'fa-bolt text-warning', text: 'Masuk Kilat 1-3 Menit' },
        { icon: 'fa-shield-check text-success', text: '100% Anti-Banned & Legal' }
      ],
      primaryBtn: {
        text: 'Top Up Robux Kilat',
        mobileText: 'Top Up Robux',
        icon: 'fa-bolt',
        action: () => onSwitchTab?.('roblox')
      },
      secondaryBtn: {
        text: 'Katalog Top Up Games',
        icon: 'fa-gamepad',
        action: () => onSwitchTab?.('topup')
      },
      visualType: 'roblox'
    },

    // Slide 3: Steam Key Random Game Original Valve (Background Foto Steam Asli)
    {
      id: 3,
      themeClass: 'banner-theme-steam',
      bgImage: '/banner-steam.png',
      fallbackImage: '/steamori.png',
      badgeIcon: 'fa-brands fa-steam text-cyan',
      badgeText: 'STEAM GAME RESMI VALVE • DISKON S/D 90%',
      mobileBadge: '🎮 Game Resmi Valve',
      title: 'Steam Key Game Original PC Mulai Rp 1.500 Saja!',
      mobileTitle: 'Steam Key Original Mulai Rp 1.500',
      desc: 'Dapatkan game PC original legal resmi Valve langsung aktivasi di library Steam kamu! Varian Original Key, Epic Tier AAA, NSFW 18+ & Hanimetai.',
      perks: [
        { icon: 'fa-key text-amber', text: '100% Key Resmi Valve' },
        { icon: 'fa-earth-americas text-cyan', text: 'Aktivasi Global Permanen' },
        { icon: 'fa-tag text-success', text: 'Mulai Rp 1.500 Saja' }
      ],
      primaryBtn: {
        text: 'Klaim Steam Key',
        mobileText: 'Klaim Steam Key',
        icon: 'fa-brands fa-steam',
        action: () => onSwitchTab?.('steam')
      },
      secondaryBtn: {
        text: 'Lihat Menu Game',
        icon: 'fa-gamepad',
        action: () => onSwitchTab?.('topup')
      },
      visualType: 'steam'
    },

    // Slide 4: Promo Spesial Netflix Rp 25.000 (Background banner-netflix.png)
    {
      id: 4,
      themeClass: 'banner-theme-netflix',
      bgImage: '/banner-netflix.png',
      fallbackImage: '/netflix.png',
      badgeIcon: 'fa-solid fa-fire text-danger',
      badgeText: 'PROMO SPESIAL NETFLIX • HANYA RP 25.000',
      mobileBadge: '🔥 Promo Netflix Rp 25.000',
      title: 'Langganan Netflix Premium Ultra HD 4K Hanya Rp 25.000!',
      mobileTitle: 'Netflix Premium 4K Rp 25.000',
      desc: 'Nonton ribuan film, serial & drakor favorit kualitas 4K Ultra HD tanpa batas. Akun resmi anti-hold, garansi penuh selama durasi pemakaian!',
      perks: [
        { icon: 'fa-tv text-danger', text: 'Kualitas 4K UHD & HDR' },
        { icon: 'fa-shield-halved text-success', text: '100% Legal & Bergaransi' },
        { icon: 'fa-bolt text-warning', text: 'Aktivasi Kilat 1-5 Menit' }
      ],
      primaryBtn: {
        text: 'Beli Netflix Rp 25.000',
        mobileText: 'Beli Rp 25rb',
        icon: 'fa-play',
        action: () => {
          const el = document.getElementById('katalog');
          el?.scrollIntoView({ behavior: 'smooth' });
        }
      },
      secondaryBtn: {
        text: 'Cara Pemesanan',
        icon: 'fa-list-check',
        action: openHowToOrder
      },
      visualType: 'netflix'
    }
  ];

  return (
    <section className="hero-landscape-section">
      <div className="container">
        {/* Landscape Carousel Container with Dynamic Ambient Glow Transitions */}
        <div
          className={`landscape-carousel-wrapper wrapper-${slides[currentSlide]?.themeClass || 'banner-theme-premium'}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Slides Track */}
          <div
            className="landscape-carousel-track"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                className={`landscape-banner-slide ${slide.themeClass} ${currentSlide === idx ? 'active-slide' : ''}`}
              >
                {/* Background Foto Banner Asli dengan Living Motion & Dynamic FX */}
                <div className="banner-bg-photo-wrap">
                  <img
                    src={slide.bgImage}
                    alt={slide.title}
                    className="banner-bg-photo living-motion"
                    loading="eager"
                    onError={(e) => {
                      if (slide.fallbackImage && e.currentTarget.src !== slide.fallbackImage) {
                        e.currentTarget.src = slide.fallbackImage;
                      }
                    }}
                  />

                  {/* Animated Thematic Aurora Waves per Slide */}
                  <div className={`hero-fx-aurora-stream stream-${slide.themeClass}`}></div>
                  <div className={`hero-fx-aurora-secondary stream-${slide.themeClass}`}></div>

                  {/* Traveling Laser Energy Beams */}
                  <div className="hero-fx-energy-beam beam-1"></div>
                  <div className="hero-fx-energy-beam beam-2"></div>

                  {/* Dense Floating Cyber Particles Layer */}
                  <div className="hero-fx-particles">
                    {HERO_PARTICLES.map((p) => (
                      <span
                        key={p.id}
                        className={`cyber-particle particle-${p.color}`}
                        style={{
                          left: p.left,
                          top: p.top,
                          width: `${p.size}px`,
                          height: `${p.size}px`,
                          animationDelay: p.delay,
                          animationDuration: p.dur
                        }}
                      />
                    ))}
                  </div>

                  {/* Dynamic Light Sheen Sweep on Slide Transition */}
                  <div className="hero-fx-sheen"></div>

                  <div className="banner-photo-overlay"></div>
                </div>

                <div className="banner-slide-body">
                  {/* Left Column: Text & CTAs */}
                  <div className="banner-slide-content">
                    <div className="banner-slide-badge">
                      <i className={slide.badgeIcon}></i>
                      <span className="badge-desktop-text">{slide.badgeText}</span>
                      <span className="badge-mobile-text">{slide.mobileBadge}</span>
                    </div>

                    <h1 className="banner-slide-title">
                      <span className="title-desktop">{slide.title}</span>
                      <span className="title-mobile">{slide.mobileTitle}</span>
                    </h1>

                    <p className="banner-slide-desc">{slide.desc}</p>

                    <div className="banner-slide-perks">
                      {slide.perks.map((p, pIdx) => (
                        <span key={pIdx} className="banner-perk-chip">
                          <i className={`fa-solid ${p.icon}`}></i> {p.text}
                        </span>
                      ))}
                    </div>

                    <div className="banner-slide-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-banner-action"
                        onClick={slide.primaryBtn.action}
                      >
                        <i className={`fa-solid ${slide.primaryBtn.icon}`}></i>{' '}
                        <span className="btn-text-desktop">{slide.primaryBtn.text}</span>
                        <span className="btn-text-mobile">{slide.primaryBtn.mobileText}</span>
                        <i className="fa-solid fa-arrow-right btn-arrow-icon"></i>
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline btn-banner-secondary"
                        onClick={slide.secondaryBtn.action}
                      >
                        <i className={`fa-solid ${slide.secondaryBtn.icon}`}></i>{' '}
                        <span>{slide.secondaryBtn.text}</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Dynamic Visual Showcase */}
                  <div className="banner-slide-visual">
                    {slide.visualType === 'apps-grid' && (
                      <div className="visual-apps-floating">
                        <div className="app-icon-bubble bubble-1" title="Netflix">
                          <img src="/netflix.png" alt="Netflix" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          <span>Netflix 4K</span>
                        </div>
                        <div className="app-icon-bubble bubble-2" title="Spotify">
                          <img src="/spotify.png" alt="Spotify" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          <span>Spotify</span>
                        </div>
                        <div className="app-icon-bubble bubble-3" title="YouTube Premium">
                          <img src="/youtube.png" alt="YouTube" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          <span>YouTube</span>
                        </div>
                        <div className="app-icon-bubble bubble-4" title="Canva Pro">
                          <img src="/canva.png" alt="Canva" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          <span>Canva Pro</span>
                        </div>
                        <div className="visual-badge-center">
                          <i className="fa-solid fa-crown text-warning"></i>
                          <strong>Akun Premium</strong>
                          <small>100% Legal & Bergaransi</small>
                        </div>
                      </div>
                    )}

                    {slide.visualType === 'roblox' && (
                      <div className="visual-roblox-card">
                        <div className="visual-roblox-logo-wrap">
                          <img src="/roblox.png" alt="Roblox Robux" className="roblox-hero-img" onError={(e) => { e.currentTarget.src = '/banner.jpg'; }} />
                        </div>
                        <div className="roblox-rate-tag">
                          <i className="fa-solid fa-bolt text-warning"></i>
                          <span>Rate Termurah 1-3 Menit</span>
                        </div>
                        <div className="roblox-floating-chip">
                          <i className="fa-solid fa-cube text-danger"></i> 50r - 500r Instant
                        </div>
                      </div>
                    )}

                    {slide.visualType === 'steam' && (
                      <div className="visual-steam-card">
                        <div className="steam-visual-badge">
                          <i className="fa-brands fa-steam"></i>
                          <strong>VALVE OFFICIAL</strong>
                        </div>
                        <div className="steam-images-stack">
                          <img src="/steam.png" alt="Steam Official" className="steam-main-icon" />
                          <div className="steam-tier-pill">
                            <i className="fa-solid fa-award text-amber"></i> Epic Tier & Original
                          </div>
                        </div>
                        <span className="steam-price-label">Mulai <strong>Rp 1.500</strong></span>
                      </div>
                    )}

                    {slide.visualType === 'netflix' && (
                      <div className="visual-netflix-card">
                        <div className="netflix-logo-box">
                          <img src="/netflix.png" alt="Netflix Premium" className="netflix-badge-img" />
                          <span className="netflix-4k-tag">4K ULTRA HD</span>
                        </div>
                        <div className="netflix-price-badge">
                          <small>PROMO SPESIAL</small>
                          <strong>Rp 25.000</strong>
                          <span>/ 1 Bulan Penuh</span>
                        </div>
                        <div className="netflix-feature-pill">
                          <i className="fa-solid fa-circle-check text-success"></i> Full Garansi Anti Hold
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Arrow Controls */}
          <button
            type="button"
            className="carousel-arrow-btn carousel-prev"
            onClick={handlePrev}
            aria-label="Slide Sebelumnya"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <button
            type="button"
            className="carousel-arrow-btn carousel-next"
            onClick={handleNext}
            aria-label="Slide Berikutnya"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>

          {/* Indicators / Dots dengan progress bar geser otomatis */}
          <div className="carousel-indicators">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`carousel-dot ${currentSlide === idx ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Buka Banner ${idx + 1}`}
              >
                {currentSlide === idx ? (
                  <span key={`progress-${currentSlide}`} className="dot-fill-progress"></span>
                ) : (
                  <span className="dot-inner"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal Trust Bar (Ramping & Elegan di Bawah Banner Landscape) */}
        <div className="hero-trust-bar">
          <div className="trust-item">
            <i className="fa-solid fa-circle-check text-success"></i>
            <div>
              <strong>100% Legal & Resmi</strong>
              <small>Aman Anti Banned</small>
            </div>
          </div>
          <div className="trust-divider"></div>
          <div className="trust-item">
            <i className="fa-solid fa-bolt text-warning"></i>
            <div>
              <strong>Proses Kilat 1-5 Menit</strong>
              <small>Pengiriman Otomatis</small>
            </div>
          </div>
          <div className="trust-divider"></div>
          <div className="trust-item">
            <i className="fa-solid fa-shield-halved text-cyan"></i>
            <div>
              <strong>Full Garansi Resmi</strong>
              <small>Sesuai Masa Aktif</small>
            </div>
          </div>
          <div className="trust-divider"></div>
          <div className="trust-item">
            <i className="fa-solid fa-headset text-primary"></i>
            <div>
              <strong>CS Responsif 24 Jam</strong>
              <small>Bantuan Siaga WhatsApp</small>
            </div>
          </div>
          <div className="trust-divider"></div>
          <div className="trust-item trust-stat-item">
            <i className="fa-solid fa-star text-warning"></i>
            <div>
              <strong>4.9 / 5.0 (1.234+ Order)</strong>
              <small>Kepuasan Pelanggan</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
