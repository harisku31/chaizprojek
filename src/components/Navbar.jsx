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

  return (
    <header className="navbar">
      <div className="container nav-container">
        <a href="#" className="logo">
          <span className="logo-badge">
            <img src="/chaizz.png" alt="ChaizStore" className="logo-img" />
          </span>
          <div className="logo-text">
            <span className="brand-name">Chaiz<span>Store</span></span>
            <span className="brand-tag">Premium Digital Account</span>
          </div>
        </a>

        {/* Desktop Search */}
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
            placeholder="Cari akun: Netflix, Spotify, Canva, Gemini..."
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
              <span><i className="fa-solid fa-fire text-warning"></i> Pencarian Populer:</span>
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
            <div className="dropdown-footer">
              <small><i className="fa-solid fa-arrow-turn-down-left"></i> Tekan <strong>Enter</strong> untuk langsung menuju produk</small>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className={`nav-links ${isMobileMenuOpen ? 'show' : ''}`} id="navLinks">
          <a
            href="#katalog"
            className="nav-item active"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <i className="fa-solid fa-layer-group"></i> Akun Premium
          </a>
          <a
            href="javascript:void(0)"
            className="nav-item nav-cart-link"
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenCart();
            }}
          >
            <i className="fa-solid fa-cart-shopping"></i> Keranjang
            {cartCount > 0 && (
              <span className="nav-cart-badge">{cartCount}</span>
            )}
          </a>
          <a
            href="#cara-order"
            className="nav-item"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Cara Order
          </a>
          <a
            href="#testimoni"
            className="nav-item"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Testimoni
          </a>
          <a
            href="#faq"
            className="nav-item"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            FAQ
          </a>
        </nav>

        {/* Navigation Actions */}
        <div className="nav-actions">
          {/* Login or User Profile */}
          {!authUser ? (
            <button
              type="button"
              className="btn btn-outline"
              onClick={onOpenLogin}
              style={{ padding: '7px 15px', borderRadius: '20px', fontSize: '0.85rem' }}
              title="Login"
            >
              <i className="fa-solid fa-right-to-bracket"></i> <span>Login</span>
            </button>
          ) : (
            <div className={`user-profile-chip ${authUser.isMember ? 'member-vip-badge' : ''}`}>
              <div className="user-avatar-badge">
                {authUser.avatarLetter || (authUser.name ? authUser.name.charAt(0).toUpperCase() : 'C')}
              </div>
              <div className="user-details">
                <span className="nav-user-name">{authUser.name || 'Chaiz'}</span>
                <span className="nav-user-email">
                  {authUser.isMember ? (
                    <>
                      <i className="fa-solid fa-crown text-warning"></i> VIP Member
                    </>
                  ) : (
                    'Akun Chaiz'
                  )}
                </span>
              </div>
              <button
                className="btn-logout"
                onClick={onLogout}
                title="Keluar / Logout"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </div>
          )}

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

          {/* Cart Button */}
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

          {/* WhatsApp Button */}
          <a
            href="https://wa.me/6287795172347?text=Halo%20Admin%20ChaizStore,%20mau%20tanya%20stok%20akun%20premium"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-wa-nav"
          >
            <i className="fa-brands fa-whatsapp"></i> <span>CS WhatsApp</span>
          </a>

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
    </header>
  );
}
