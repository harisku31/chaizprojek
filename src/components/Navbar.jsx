import React, { useState, useRef, useEffect } from 'react';

export default function Navbar({
  authUser,
  onLogout,
  onOpenLogin,
  cartCount,
  onOpenCart,
  searchQuery,
  onSearchChange,
  onSelectSearchTag,
  onExecuteSearch
}) {
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const desktopInputRef = useRef(null);
  const mobileInputRef = useRef(null);

  const popularTags = [
    { label: 'Disney+', tag: 'Disney', icon: 'fa-film text-cyan' },
    { label: 'Vidio', tag: 'Vidio', icon: 'fa-circle-play text-danger' },
    { label: 'Netflix', tag: 'Netflix', icon: 'fa-film text-rose' },
    { label: 'Spotify', tag: 'Spotify', icon: 'fa-spotify text-success', brand: true },
    { label: 'YouTube', tag: 'YouTube', icon: 'fa-youtube text-danger', brand: true },
    { label: 'Canva', tag: 'Canva', icon: 'fa-palette text-cyan' },
    { label: 'Gemini', tag: 'Gemini', icon: 'fa-wand-magic-sparkles text-cyan' }
  ];

  // Close search dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(event.target)) {
        setIsDesktopSearchOpen(false);
      }
      if (
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target) &&
        !event.target.closest('#mobileSearchToggleBtn')
      ) {
        setIsMobileSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTagClick = (tag) => {
    setIsDesktopSearchOpen(false);
    setIsMobileSearchOpen(false);
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

  const handleCopyEmail = (email) => {
    if (!email) return;
    navigator.clipboard?.writeText(email);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  return (
    <header className="navbar">
      <div className="container nav-container">
        {/* LOGO GROUP: Logo ChaizStore + Logo WhatsApp */}
        <div className="logo-group">
          <a href="#" className="logo">
            <span className="logo-badge">
              <img src="/chaizz.png" alt="ChaizStore" className="logo-img" />
            </span>
            <div className="logo-text">
              <span className="brand-name">Chaiz<span>Store</span></span>
            </div>
          </a>

          {/* Logo WhatsApp di dekat teks ChaizStore */}
          <a
            href="https://wa.me/6287795172347?text=Halo%20Admin%20ChaizStore,%20mau%20tanya%20stok%20akun%20premium"
            target="_blank"
            rel="noopener noreferrer"
            className="wa-brand-icon-btn"
            title="Chat CS WhatsApp"
            aria-label="Chat WhatsApp Admin"
          >
            <i className="fa-brands fa-whatsapp"></i>
          </a>
        </div>

        {/* Navigation Links: Hanya Akun Premium & Cara Order (FAQ & Testimoni dipindah ke 1 tombol dekat CS) */}
        <nav className={`nav-links ${isMobileMenuOpen ? 'show' : ''}`} id="navLinks">

          <a
            href="#katalog"
            className="nav-item active"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <i className="fa-solid fa-layer-group"></i> Akun Premium
          </a>

        </nav>

        {/* Navigation Actions (Kanan): Urutan: [Pencarian] -> [Keranjang] -> [WhatsApp] -> [Profil di Pojok Kanan Atas] */}
        <div className="nav-actions">
          {/* 1. Pencarian Desktop (digeser ke kanan deket keranjang) */}
          <div
            className={`search-box-desktop ${isDesktopSearchOpen ? 'expanded' : ''}`}
            id="searchBoxDesktop"
            ref={desktopSearchRef}
          >
            <i
              className="fa-solid fa-magnifying-glass search-icon"
              style={{ cursor: 'pointer' }}
              title="Cari Akun"
              onClick={() => {
                if (searchQuery) {
                  onExecuteSearch(searchQuery);
                  setIsDesktopSearchOpen(false);
                } else {
                  setIsDesktopSearchOpen(true);
                  desktopInputRef.current?.focus();
                }
              }}
            ></i>
            <input
              type="text"
              ref={desktopInputRef}
              placeholder="Cari akun premium..."
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
                className="clear-btn"
                title="Hapus pencarian"
                onClick={() => {
                  onSearchChange('');
                  desktopInputRef.current?.focus();
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}

            {/* Desktop Search Dropdown */}
            <div className={`desktop-search-dropdown ${isDesktopSearchOpen ? 'open' : ''}`}>
              <div className="dropdown-header">
                <span><i className="fa-solid fa-fire text-warning"></i> Populer:</span>
              </div>
              <div className="dropdown-tags">
                {popularTags.map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    className="search-tag-pill"
                    onClick={() => handleTagClick(item.tag)}
                  >
                    <i className={`${item.brand ? 'fa-brands' : 'fa-solid'} ${item.icon}`}></i> {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Search Toggle Button */}
          <button
            type="button"
            className="btn-search-toggle"
            id="mobileSearchToggleBtn"
            title="Cari Akun"
            aria-label="Buka Pencarian"
            onClick={() => {
              setIsMobileSearchOpen(!isMobileSearchOpen);
              setTimeout(() => mobileInputRef.current?.focus(), 80);
            }}
          >
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>

          {/* 2. Keranjang Belanja (digeser deket profil) */}
          <button
            id="cartBtn"
            className="cart-btn"
            title="Keranjang Belanja"
            onClick={onOpenCart}
          >
            <i className="fa-solid fa-bag-shopping"></i>
            <span className="cart-label">Keranjang</span>
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>

          {/* 3. PROFIL DI KANAN POJOK ATAS (JIKA SUDAH LOGIN: HANYA ADA PROFIL BISA DI-KLIK & ADA LOGOUT, TIDAK ADA TOMBOL LOGIN LAGI!) */}
          {!authUser ? (
            <button
              type="button"
              className="btn btn-outline btn-nav-login"
              onClick={onOpenLogin}
              title="Login Akun"
            >
              <i className="fa-brands fa-google text-danger"></i> <span>Login</span>
            </button>
          ) : (
            <div
              className={`user-profile-chip ${
                authUser.isGoogle
                  ? 'google-user-badge'
                  : authUser.isMember
                  ? 'member-vip-badge'
                  : ''
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
                  {authUser.avatarLetter || (authUser.name ? authUser.name.charAt(0).toUpperCase() : 'G')}
                </div>
              )}

              <div className="user-details">
                <span className="nav-user-name">{authUser.name || 'Pengguna'}</span>
                <span className="nav-user-email">
                  {authUser.isGoogle ? (
                    <>
                      <i className="fa-brands fa-google text-danger"></i> {authUser.email}
                    </>
                  ) : authUser.isMember ? (
                    <>
                      <i className="fa-solid fa-crown text-warning"></i> VIP Member
                    </>
                  ) : (
                    'Akun Tamu'
                  )}
                </span>
              </div>

              <i className="fa-solid fa-chevron-down nav-profile-chevron"></i>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            aria-label="Buka Menu"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
          </button>
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
                placeholder="Cari akun premium: Netflix, Spotify, Canva, Gemini..."
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
            <span className="quick-tag-label"><i className="fa-solid fa-fire text-warning"></i> Populer:</span>
            {popularTags.map((item) => (
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

      {/* ============================================================ */}
      {/* POPUP / MODAL DETAIL PROFIL GOOGLE & LOGOUT                 */}
      {/* ============================================================ */}
      {isProfileModalOpen && authUser && (
        <div className="profile-modal-overlay" style={{ display: 'flex' }}>
          <div
            className="profile-modal-backdrop"
            onClick={() => setIsProfileModalOpen(false)}
          ></div>
          <div className="profile-modal-card">
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setIsProfileModalOpen(false)}
              title="Tutup Profil"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            {/* Header Banner */}
            <div className="profile-card-header">
              <div className="profile-card-banner"></div>
              <div className="profile-avatar-wrapper">
                {authUser.picture ? (
                  <img
                    src={authUser.picture}
                    alt={authUser.name}
                    className="profile-card-avatar"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="profile-card-avatar-badge">
                    {authUser.avatarLetter || (authUser.name ? authUser.name.charAt(0).toUpperCase() : 'G')}
                  </div>
                )}
                {authUser.isGoogle && (
                  <span className="profile-google-badge-tag" title="Akun Terhubung Google">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.28 21.43 7.37 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.32a7.18 7.18 0 0 1 0-4.64V6.58H1.25a11.97 11.97 0 0 0 0 10.84l4.03-3.1z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.28 2.57 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"/>
                    </svg>
                  </span>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="profile-card-body">
              <h3 className="profile-user-name">{authUser.name}</h3>

              <div className="profile-email-badge">
                <span className="email-text">{authUser.email}</span>
                <button
                  type="button"
                  className="btn-copy-email"
                  onClick={() => handleCopyEmail(authUser.email)}
                  title="Salin Email"
                >
                  <i className={`fa-solid ${emailCopied ? 'fa-check text-success' : 'fa-copy'}`}></i>
                  {emailCopied && <span className="copied-tooltip">Disalin!</span>}
                </button>
              </div>

              {/* Status Badge */}
              <div className="profile-status-box">
                {authUser.isGoogle ? (
                  <div className="status-item status-google">
                    <i className="fa-solid fa-shield-check text-success"></i>
                    <div>
                      <strong>Akun Google Terverifikasi</strong>
                      <small>Tersinkronisasi resmi dengan akun Gmail Anda</small>
                    </div>
                  </div>
                ) : authUser.isMember ? (
                  <div className="status-item status-vip">
                    <i className="fa-solid fa-crown text-warning"></i>
                    <div>
                      <strong>VIP Member ChaizStore</strong>
                      <small>Akses harga khusus & akun VIP aktif</small>
                    </div>
                  </div>
                ) : (
                  <div className="status-item status-chaiz">
                    <i className="fa-solid fa-user-check text-cyan"></i>
                    <div>
                      <strong>Pengguna Biasa</strong>
                      <small>Sesi belanja aktif</small>
                    </div>
                  </div>
                )}
              </div>

              {/* Meta details */}
              <div className="profile-meta-list">
                <div className="meta-row">
                  <span>Metode Login:</span>
                  <strong>{authUser.isGoogle ? 'Google OAuth 2.0 Asli' : 'Pengguna Biasa'}</strong>
                </div>
                <div className="meta-row">
                  <span>Garansi Toko:</span>
                  <span className="text-success"><i className="fa-solid fa-circle-check"></i> 100% Aktif & Aman</span>
                </div>
              </div>

              {/* Action Buttons: Logout */}
              <div className="profile-card-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    onOpenCart();
                  }}
                >
                  <i className="fa-solid fa-bag-shopping"></i> Buka Keranjang Belanja ({cartCount})
                </button>

                <button
                  type="button"
                  className="btn btn-outline-danger btn-block btn-logout-full"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    onLogout();
                  }}
                >
                  <i className="fa-solid fa-right-from-bracket"></i> Keluar dari Akun (Logout)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
