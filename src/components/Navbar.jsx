import React, { useState, useRef, useEffect } from 'react';

export default function Navbar({
  authUser,
  onLogout,
  onOpenLogin,
  onOpenInstall,
  cartCount,
  onOpenCart,
  searchQuery,
  onSearchChange,
  onSelectSearchTag,
  onExecuteSearch,
  onOpenTopUp,
  activeTab = 'store',
  onSwitchTab,
  isBanned = false,
  theme = 'light',
  onToggleTheme
}) {
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const desktopInputRef = useRef(null);
  const mobileInputRef = useRef(null);
  const categoryDropdownRef = useRef(null);

  const popularTags = [
    { label: 'Netflix 4K', tag: 'Netflix', icon: 'fa-solid fa-film text-danger' },
    { label: 'Robux Roblox', tag: 'Roblox', icon: 'fa-solid fa-cube text-danger' },
    { label: 'Steam Key', tag: 'Steam', icon: 'fa-brands fa-steam text-cyan' },
    { label: 'Spotify', tag: 'Spotify', icon: 'fa-brands fa-spotify text-success' },
    { label: 'YouTube No-Ads', tag: 'YouTube', icon: 'fa-brands fa-youtube text-danger' },
    { label: 'Canva Pro', tag: 'Canva', icon: 'fa-solid fa-palette text-cyan' },
    { label: 'Gemini AI', tag: 'Gemini', icon: 'fa-solid fa-wand-magic-sparkles text-purple' },
    { label: 'Disney+', tag: 'Disney', icon: 'fa-solid fa-film text-blue' },
    { label: 'Vidio Platinum', tag: 'Vidio', icon: 'fa-solid fa-play text-danger' }
  ];

  const quickCategories = [
    { id: 'all', label: 'Semua Kategori', icon: 'fa-solid fa-border-all' },
    { id: 'roblox', label: 'Robux & Roblox', icon: 'fa-solid fa-cube', isTab: 'roblox' },
    { id: 'steam', label: 'Steam Games', icon: 'fa-brands fa-steam', isTab: 'steam' },
    { id: 'topup', label: 'Top Up Kilat', icon: 'fa-solid fa-bolt', isTab: 'topup' },
    { id: 'streaming', label: 'Streaming Video', icon: 'fa-solid fa-tv', tag: 'Netflix' },
    { id: 'musik', label: 'Musik VIP', icon: 'fa-solid fa-music', tag: 'Spotify' },
    { id: 'produktivitas', label: 'Canva & Desain', icon: 'fa-solid fa-palette', tag: 'Canva' },
    { id: 'ai', label: 'AI & Bot', icon: 'fa-solid fa-robot', tag: 'Gemini' }
  ];

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(event.target)) {
        setIsDesktopSearchOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTagClick = (tag) => {
    setIsDesktopSearchOpen(false);
    setIsMobileSearchOpen(false);
    setIsCategoryDropdownOpen(false);
    onSelectSearchTag(tag);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsDesktopSearchOpen(false);
      setIsMobileSearchOpen(false);
      onExecuteSearch(e.target.value);
    }
  };

  const handleCategoryNavClick = (cat) => {
    setIsCategoryDropdownOpen(false);
    if (cat.isTab) {
      onSwitchTab(cat.isTab);
    } else {
      onSwitchTab('store');
      if (cat.tag) {
        onSelectSearchTag(cat.tag);
      } else {
        const el = document.getElementById('katalog');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="navbar itemku-navbar">
      <div className="container nav-container">
        {/* LOGO ITEMKU STYLE: chaizstore (modern lowercase bold with blue & orange dot) */}
        <div className="itemku-logo-area">
          <a
            href="#"
            className="itemku-brand-logo"
            onClick={(e) => {
              e.preventDefault();
              onSwitchTab('store');
            }}
          >
            <span className="itemku-logo-icon">
              <img src="/chaizz.png" alt="ChaizStore" className="logo-img" />
            </span>
            <div className="itemku-logo-text">
              <span className="brand-itemku">chaiz<span>store</span></span>
              <span className="itemku-dot"></span>
            </div>
          </a>

          {/* Mega Kategori Dropdown Button */}
          <div className="itemku-cat-dropdown-wrap" ref={categoryDropdownRef}>
            <button
              type="button"
              className={`btn-itemku-kategori ${isCategoryDropdownOpen ? 'active' : ''}`}
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              title="Pilih Kategori Produk"
            >
              <i className="fa-solid fa-shapes"></i>
              <span>Kategori</span>
              <i className={`fa-solid fa-chevron-down chevron-icon ${isCategoryDropdownOpen ? 'open' : ''}`}></i>
            </button>

            {isCategoryDropdownOpen && (
              <div className="itemku-kategori-popover">
                <div className="kategori-popover-header">
                  <span>Kategori Produk Unggulan</span>
                </div>
                <div className="kategori-popover-list">
                  {quickCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className="kategori-popover-item"
                      onClick={() => handleCategoryNavClick(cat)}
                    >
                      <i className={cat.icon}></i>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CENTER: OMNIBOX SEARCH BAR ALA ITEMKU */}
        <div className="itemku-search-center">
          <div
            className={`itemku-search-omnibox ${isDesktopSearchOpen ? 'focused' : ''}`}
            ref={desktopSearchRef}
          >
            <i className="fa-solid fa-magnifying-glass itemku-search-icon"></i>
            <input
              type="text"
              ref={desktopInputRef}
              placeholder="Cari game, voucher, atau akun premium..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsDesktopSearchOpen(true)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck="false"
            />
            {searchQuery && (
              <button
                type="button"
                className="itemku-search-clear"
                title="Hapus pencarian"
                onClick={() => {
                  onSearchChange('');
                  desktopInputRef.current?.focus();
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
            <button
              type="button"
              className="itemku-search-submit"
              onClick={() => {
                onExecuteSearch(searchQuery);
                setIsDesktopSearchOpen(false);
              }}
              title="Cari"
            >
              <i className="fa-solid fa-magnifying-glass"></i>
              <span>Cari</span>
            </button>

            {/* Desktop Search Suggestions Popover */}
            {isDesktopSearchOpen && (
              <div className="itemku-search-dropdown">
                <div className="search-dropdown-title">
                  <i className="fa-solid fa-fire text-orange"></i>
                  <span>Paling Sering Dicari:</span>
                </div>
                <div className="search-dropdown-pills">
                  {popularTags.map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      className="search-tag-chip"
                      onClick={() => handleTagClick(item.tag)}
                    >
                      <i className={item.icon}></i>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: NAVIGATION ACTIONS (Transaksi, Keranjang, Pasang App, Auth/Profile) */}
        <div className="nav-actions itemku-actions">
          {/* Mobile Search Toggle Button */}
          <button
            type="button"
            className="btn-search-toggle"
            id="mobileSearchToggleBtn"
            title="Cari Produk"
            onClick={() => {
              setIsMobileSearchOpen(!isMobileSearchOpen);
              setTimeout(() => mobileInputRef.current?.focus(), 80);
            }}
          >
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>

          {/* Transaksi Icon Button (Desktop Only - Mobile has bottom bar) */}
          <button
            type="button"
            className={`itemku-action-btn desktop-only-action ${activeTab === 'transaksi' ? 'active' : ''}`}
            onClick={() => {
              if (!authUser) {
                onOpenLogin();
              } else {
                onSwitchTab('transaksi');
              }
            }}
            title="Riwayat Transaksi"
          >
            <i className="fa-solid fa-receipt"></i>
            <span className="action-btn-label">Transaksi</span>
          </button>

          {/* Keranjang Belanja Itemku */}
          <button
            id="cartBtn"
            className="itemku-action-btn itemku-cart-btn"
            title="Keranjang Belanja"
            onClick={onOpenCart}
          >
            <div className="cart-icon-wrap">
              <i className="fa-solid fa-cart-shopping"></i>
              {cartCount > 0 && <span className="itemku-cart-badge">{cartCount}</span>}
            </div>
            <span className="action-btn-label">Keranjang</span>
          </button>

          {/* Mode Gelap & Terang (Dark / Light Mode Toggle) */}
          <button
            type="button"
            className={`itemku-action-btn itemku-theme-toggle ${theme === 'dark' ? 'is-dark' : 'is-light'}`}
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            aria-label="Ubah Tema Gelap atau Terang"
          >
            <div className="theme-toggle-icon">
              {theme === 'dark' ? (
                <i className="fa-solid fa-sun text-warning"></i>
              ) : (
                <i className="fa-solid fa-moon text-blue"></i>
              )}
            </div>
            <span className="action-btn-label theme-label">
              Mode: <strong>{theme === 'dark' ? 'Gelap' : 'Terang'}</strong>
            </span>
          </button>

          {/* Pasang Aplikasi PWA / APK (Desktop Only) */}
          <button
            type="button"
            className="itemku-install-btn desktop-only-action"
            onClick={onOpenInstall}
            title="Pasang Aplikasi ChaizStore di HP"
          >
            <i className="fa-solid fa-mobile-screen"></i>
            <span className="install-label">App</span>
          </button>

          {/* PROFIL / LOGIN BUTTON */}
          {!authUser ? (
            <button
              type="button"
              className="btn btn-itemku-login"
              onClick={onOpenLogin}
              title="Masuk / Daftar Akun"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" style={{ verticalAlign: 'middle', marginRight: '6px' }}>
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.28 21.43 7.37 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.32a7.18 7.18 0 0 1 0-4.64V6.58H1.25a11.97 11.97 0 0 0 0 10.84l4.03-3.1z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.28 2.57 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"/>
              </svg>
              <span>Masuk</span>
            </button>
          ) : (
            <div
              className={`user-profile-chip itemku-user-chip ${
                authUser.isGoogle ? 'google-user-badge' : authUser.isMember ? 'member-vip-badge' : ''
              }`}
              onClick={() => setIsProfileModalOpen(true)}
              title="Klik untuk membuka profil akun & Logout"
              style={{ cursor: 'pointer' }}
            >
              {authUser.picture ? (
                <img
                  src={authUser.picture}
                  alt={authUser.name}
                  className="user-avatar-img"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="user-avatar-badge">
                  {authUser.avatarLetter || (authUser.name ? authUser.name.charAt(0).toUpperCase() : 'U')}
                </div>
              )}

              <div className="user-details">
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span className="nav-user-name">{authUser.name || 'Pengguna'}</span>
                  {isBanned && (
                    <span className="badge-banned-pill">BANNED</span>
                  )}
                </div>
                <span className="nav-user-email">
                  {isBanned ? (
                    <span style={{ color: '#ef4444', fontWeight: '700' }}>Akses Dibatasi</span>
                  ) : (
                    <span>Rp {(authUser.chaizMoney || 0).toLocaleString('id-ID')}</span>
                  )}
                </span>
              </div>

              <i className="fa-solid fa-chevron-down nav-profile-chevron"></i>
            </div>
          )}
        </div>
      </div>

      {/* ITEMKU SUB-HEADER / CATEGORY SHORTCUT STRIP */}
      <div className="itemku-subnav-strip">
        <div className="container itemku-subnav-container">
          <div className="itemku-subnav-scroll">
            {quickCategories.map((cat) => {
              const isActive =
                (cat.isTab && activeTab === cat.isTab) ||
                (cat.id === 'all' && activeTab === 'store');

              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`subnav-pill ${isActive ? 'active' : ''}`}
                  onClick={() => handleCategoryNavClick(cat)}
                >
                  <i className={cat.icon}></i>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar Dropdown */}
      <div
        className={`search-box-mobile ${isMobileSearchOpen ? 'open' : ''}`}
        id="searchBoxMobile"
        ref={mobileSearchRef}
      >
        <div className="container search-mobile-container">
          <div className="search-mobile-inner">
            <div className="search-wrapper">
              <i
                className="fa-solid fa-magnifying-glass search-icon"
                title="Cari Akun"
                onClick={() => {
                  if (searchQuery) {
                    onExecuteSearch(searchQuery);
                    setIsMobileSearchOpen(false);
                  }
                }}
              ></i>
              <input
                type="text"
                ref={mobileInputRef}
                placeholder="Cari game, Netflix, Spotify, Canva, Robux..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                spellCheck="false"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-btn"
                  title="Hapus pencarian"
                  onClick={() => {
                    onSearchChange('');
                    mobileInputRef.current?.focus();
                  }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>
            <button
              type="button"
              className="btn-close-search"
              title="Tutup Pencarian"
              onClick={() => setIsMobileSearchOpen(false)}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="search-quick-tags">
            <span className="quick-tag-label"><i className="fa-solid fa-fire text-orange"></i> Populer:</span>
            {popularTags.slice(0, 5).map((item) => (
              <button
                key={item.tag}
                type="button"
                className="search-tag-pill"
                onClick={() => handleTagClick(item.tag)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* POPUP DROPDOWN MENU PROFIL */}
      {isProfileModalOpen && authUser && (
        <div className="profile-dropdown-overlay" style={{ display: 'flex' }}>
          <div
            className="profile-dropdown-backdrop"
            onClick={() => setIsProfileModalOpen(false)}
          ></div>
          <div className="profile-dropdown-box itemku-profile-box">
            <div className="profile-dropdown-header">
              <div className="profile-dropdown-avatar-wrap">
                {authUser.picture ? (
                  <img
                    src={authUser.picture}
                    alt={authUser.name}
                    className="profile-dropdown-avatar"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="profile-dropdown-avatar-badge">
                    {authUser.avatarLetter || (authUser.name ? authUser.name.charAt(0).toUpperCase() : 'U')}
                  </div>
                )}
                {authUser.isGoogle && (
                  <span className="profile-dropdown-g-badge" title="Google Verified">
                    <i className="fa-solid fa-check"></i>
                  </span>
                )}
              </div>

              <div className="profile-dropdown-userinfo">
                <div className="profile-dropdown-name">{authUser.name || 'Pengguna'}</div>
                <div className="profile-dropdown-email">{authUser.email || ''}</div>
                <span className="profile-dropdown-badge">
                  <i className="fa-solid fa-circle-check text-success"></i> Pengguna Terverifikasi
                </span>
              </div>

              <button
                type="button"
                className="profile-dropdown-close"
                onClick={() => setIsProfileModalOpen(false)}
                title="Tutup Menu"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Saldo ChaizMoney Ringkas */}
            <div className="profile-dropdown-saldo-strip itemku-wallet-strip">
              <div className="strip-left">
                <i className="fa-solid fa-wallet text-blue"></i>
                <span className="strip-label">Saldo ChaizPay:</span>
              </div>
              <strong className="strip-value">Rp {(authUser.chaizMoney || 0).toLocaleString('id-ID')}</strong>
            </div>

            {/* DUA TOMBOL UTAMA */}
            <div className="profile-dropdown-actions">
              <button
                type="button"
                className="btn-dropdown-logout"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  onLogout();
                }}
                title="Keluar dari Akun"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                <span>Log Out</span>
              </button>

              <button
                type="button"
                className="btn-dropdown-visit-profile"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  onSwitchTab('profile');
                }}
                title="Kunjungi Profil Pengguna"
              >
                <i className="fa-solid fa-user-circle"></i>
                <span>Profil Saya</span>
                <i className="fa-solid fa-arrow-right arrow-icon"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
