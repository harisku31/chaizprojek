import React, { useState, useRef, useEffect } from 'react';

export default function QuickSettingMenu({ onOpenTopUp, onSwitchTab, activeTab = 'store' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLanggananOpen, setIsLanggananOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);
  const langgananRef = useRef(null);
  const langgananBtnRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        btnRef.current &&
        !btnRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
      if (
        isLanggananOpen &&
        langgananRef.current &&
        !langgananRef.current.contains(event.target) &&
        langgananBtnRef.current &&
        !langgananBtnRef.current.contains(event.target)
      ) {
        setIsLanggananOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isLanggananOpen]);

  // Smooth scroll directly to corresponding section
  const scrollToSection = (targetId) => {
    setIsOpen(false);
    setIsLanggananOpen(false);
    setTimeout(() => {
      const element = document.getElementById(targetId);
      if (element) {
        const yOffset = -75; // Offset for sticky navbar
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  };

  const menuItems = [
    {
      id: 'katalog',
      title: 'Pilihan Langganan',
      badge: 'Semua Akun',
      desc: 'Canva, Netflix, YouTube, Spotify, CapCut, dll.',
      icon: 'fa-solid fa-crown',
      theme: 'menu-theme-gold',
      isLink: false
    },
    {
      id: 'cara-order',
      title: 'Cara Order',
      badge: '4 Langkah',
      desc: 'Panduan beli & bayar kilat QRIS All Payment',
      icon: 'fa-solid fa-cart-shopping',
      theme: 'menu-theme-cyan',
      isLink: false
    },
    {
      id: 'testimoni',
      title: 'Testimoni Pembeli',
      badge: 'Rating 5.0 ★',
      desc: 'Ulasan kepuasan & rating pelanggan setia',
      icon: 'fa-solid fa-star',
      theme: 'menu-theme-gold',
      isLink: false
    },
    {
      id: 'faq',
      title: 'FAQ & Aturan Pakai',
      badge: 'Full Garansi',
      desc: 'Penjelasan garansi, aturan sharing & klaim',
      icon: 'fa-solid fa-shield-halved',
      theme: 'menu-theme-purple',
      isLink: false
    },
    {
      id: 'wa-admin',
      title: 'Chat CS WhatsApp',
      badge: 'Online 24/7',
      desc: 'Bantuan admin langsung, stok & konsultasi',
      icon: 'fa-brands fa-whatsapp',
      theme: 'menu-theme-green',
      isLink: true,
      url: 'https://wa.me/6287795172347?text=Halo%20Admin%20ChaizStore,%20mau%20tanya%20seputar%20akun%20premium'
    }
  ];

  return (
    <>
      {/* 1. Tombol Bulat Langganan (Pilihan: Akun Premium & Top Up) */}
      <button
        ref={langgananBtnRef}
        type="button"
        className={`floating-langganan-btn ${isLanggananOpen ? 'active' : ''}`}
        id="floatingLanggananBtn"
        onClick={() => {
          setIsLanggananOpen(!isLanggananOpen);
          if (isOpen) setIsOpen(false);
        }}
        title="Pilihan Layanan: Akun Premium & Top Up"
        aria-label="Pilihan Layanan"
      >
        <div className="setting-btn-pulse langganan-pulse"></div>
        <div className="setting-icon-wrap">
          <i className="fa-solid fa-crown"></i>
        </div>
        <span className="setting-live-badge langganan-live-badge">Langganan</span>
        <span className="setting-tooltip">Pilihan Layanan</span>
      </button>

      {/* Popover Pilihan Langganan & Top Up */}
      {isLanggananOpen && (
        <div ref={langgananRef} className="langganan-popup-menu">
          <div className="langganan-popup-header">
            <span className="langganan-popup-title">
              <i className="fa-solid fa-layer-group text-warning"></i> Pilih Layanan
            </span>
            <span className="langganan-popup-sub">Mau beli akun atau top up game?</span>
          </div>

          <div className="langganan-popup-options">
            <button
              type="button"
              className={`langganan-option-card option-card-premium ${activeTab === 'store' ? 'active-option' : ''}`}
              onClick={() => {
                setIsLanggananOpen(false);
                if (onSwitchTab) onSwitchTab('store');
                scrollToSection('katalog');
              }}
            >
              <div className="option-icon-wrap icon-amber">
                <i className="fa-solid fa-crown"></i>
              </div>
              <div className="option-text-wrap">
                <div className="option-title-row">
                  <strong>Akun Premium</strong>
                  <span className="option-mini-badge badge-popular">Terlaris</span>
                </div>
                <small>Canva, Netflix, YouTube, Spotify, CapCut, dll.</small>
              </div>
              <i className="fa-solid fa-chevron-right option-chevron"></i>
            </button>

            <button
              type="button"
              className={`langganan-option-card option-card-topup ${activeTab === 'topup' ? 'active-option' : ''}`}
              onClick={() => {
                setIsLanggananOpen(false);
                if (onSwitchTab) onSwitchTab('topup');
                else if (onOpenTopUp) onOpenTopUp();
              }}
            >
              <div className="option-icon-wrap icon-cyan">
                <i className="fa-solid fa-gamepad"></i>
              </div>
              <div className="option-text-wrap">
                <div className="option-title-row">
                  <strong>Top Up Game & E-Wallet</strong>
                  <span className="option-mini-badge badge-hot">HALAMAN BARU</span>
                </div>
                <small>Mobile Legends, Free Fire, Valorant, DANA, GoPay</small>
              </div>
              <i className="fa-solid fa-chevron-right option-chevron"></i>
            </button>
          </div>
        </div>
      )}

      {/* 2. Tombol Bulat Menu (Garis 3 Pilihan) */}
      <button
        ref={btnRef}
        type="button"
        className={`floating-setting-btn ${isOpen ? 'active' : ''}`}
        id="floatingSettingBtn"
        onClick={() => {
          setIsOpen(!isOpen);
          if (isLanggananOpen) setIsLanggananOpen(false);
        }}
        title="Menu Bantuan & Navigasi Cepat"
        aria-label="Buka Menu Bantuan"
      >
        <div className="setting-btn-pulse"></div>
        <div className="setting-icon-wrap">
          <i className="fa-solid fa-bars setting-icon-gear"></i>
          <i className="fa-solid fa-xmark setting-icon-close"></i>
        </div>
        <span className="setting-live-badge">Menu</span>
        <span className="setting-tooltip">Menu Bantuan & Pilihan</span>
      </button>

      {/* Popover Deretan Menu Berwarna-Warni */}
      {isOpen && (
        <div ref={menuRef} className="quick-setting-menu-card">
          {/* Header Berwarna */}
          <div className="quick-menu-header">
            <div className="quick-menu-header-title">
              <div className="quick-header-icon-wrap">
                <i className="fa-solid fa-compass"></i>
              </div>
              <div className="quick-header-text">
                <span className="quick-header-main">Menu Bantuan & Info</span>
                <span className="quick-header-sub">Navigasi Cepat ChaizStore</span>
              </div>
            </div>
            <button
              type="button"
              className="quick-menu-close-btn"
              onClick={() => setIsOpen(false)}
              title="Tutup Menu"
              aria-label="Tutup Menu"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Deretan Menu Navigasi Berwarna */}
          <div className="quick-menu-list">
            {menuItems.map((item) =>
              item.isLink ? (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`quick-menu-scroll-row ${item.theme}`}
                  onClick={() => setIsOpen(false)}
                >
                  <div className="quick-menu-row-left">
                    <div className="quick-menu-icon">
                      <i className={item.icon}></i>
                    </div>
                    <div className="quick-menu-row-text">
                      <div className="quick-menu-title-wrap">
                        <h4 className="quick-menu-title">{item.title}</h4>
                        <span className="quick-menu-badge">{item.badge}</span>
                      </div>
                      <span className="quick-menu-sub">{item.desc}</span>
                    </div>
                  </div>
                  <div className="quick-menu-row-arrow">
                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                  </div>
                </a>
              ) : (
                <button
                  key={item.id}
                  type="button"
                  className={`quick-menu-scroll-row ${item.theme}`}
                  onClick={() => scrollToSection(item.id)}
                >
                  <div className="quick-menu-row-left">
                    <div className="quick-menu-icon">
                      <i className={item.icon}></i>
                    </div>
                    <div className="quick-menu-row-text">
                      <div className="quick-menu-title-wrap">
                        <h4 className="quick-menu-title">{item.title}</h4>
                        <span className="quick-menu-badge">{item.badge}</span>
                      </div>
                      <span className="quick-menu-sub">{item.desc}</span>
                    </div>
                  </div>
                  <div className="quick-menu-row-arrow">
                    <i className="fa-solid fa-chevron-right"></i>
                  </div>
                </button>
              )
            )}
          </div>

          {/* Quick Footer Berwarna */}
          <div className="quick-menu-footer">
            <div className="quick-footer-guarantee">
              <i className="fa-solid fa-shield-check text-cyan"></i>
              <span>100% Legal, Aman & Bergaransi Penuh</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
