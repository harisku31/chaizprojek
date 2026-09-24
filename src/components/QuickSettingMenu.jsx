import React, { useState, useRef, useEffect } from 'react';

export default function QuickSettingMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);

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
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Smooth scroll directly to corresponding section
  const scrollToSection = (targetId) => {
    setIsOpen(false);
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
      {/* Tombol Bulat Setting Berwarna & Glow */}
      <button
        ref={btnRef}
        type="button"
        className={`floating-setting-btn ${isOpen ? 'active' : ''}`}
        id="floatingSettingBtn"
        onClick={() => setIsOpen(!isOpen)}
        title="Menu Bantuan & Navigasi Cepat"
        aria-label="Buka Menu Bantuan"
      >
        <div className="setting-btn-pulse"></div>
        <div className="setting-icon-wrap">
          <i className="fa-solid fa-sliders setting-icon-gear"></i>
          <i className="fa-solid fa-xmark setting-icon-close"></i>
        </div>
        <span className="setting-live-badge">Menu</span>
        <span className="setting-tooltip">Menu Bantuan & Navigasi</span>
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
