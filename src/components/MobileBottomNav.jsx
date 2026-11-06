import React from 'react';

export default function MobileBottomNav({
  activeTab,
  onSwitchTab,
  cartCount,
  onOpenCart,
  authUser,
  onOpenLogin
}) {
  return (
    <nav className="itemku-bottom-nav" aria-label="Navigasi Bawah">
      {/* 1. Beranda */}
      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'store' ? 'active' : ''}`}
        onClick={() => onSwitchTab('store')}
      >
        <div className="bottom-nav-icon">
          <i className="fa-solid fa-house"></i>
        </div>
        <span className="bottom-nav-label">Beranda</span>
      </button>

      {/* 2. Top Up Game */}
      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'topup' ? 'active' : ''}`}
        onClick={() => onSwitchTab('topup')}
      >
        <div className="bottom-nav-icon">
          <i className="fa-solid fa-bolt-lightning"></i>
          <span className="bottom-nav-mini-badge">HOT</span>
        </div>
        <span className="bottom-nav-label">Top Up</span>
      </button>

      {/* 3. Transaksi */}
      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'transaksi' ? 'active' : ''}`}
        onClick={() => {
          if (!authUser) {
            onOpenLogin();
          } else {
            onSwitchTab('transaksi');
          }
        }}
      >
        <div className="bottom-nav-icon">
          <i className="fa-solid fa-receipt"></i>
        </div>
        <span className="bottom-nav-label">Transaksi</span>
      </button>

      {/* 4. Keranjang Belanja */}
      <button
        type="button"
        className="bottom-nav-item"
        onClick={onOpenCart}
      >
        <div className="bottom-nav-icon">
          <i className="fa-solid fa-cart-shopping"></i>
          {cartCount > 0 && (
            <span className="bottom-nav-cart-badge">{cartCount}</span>
          )}
        </div>
        <span className="bottom-nav-label">Keranjang</span>
      </button>

      {/* 5. Akun Saya */}
      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => {
          if (!authUser) {
            onOpenLogin();
          } else {
            onSwitchTab('profile');
          }
        }}
      >
        <div className="bottom-nav-icon">
          {authUser?.picture ? (
            <img
              src={authUser.picture}
              alt={authUser.name}
              className="bottom-nav-avatar"
              referrerPolicy="no-referrer"
            />
          ) : (
            <i className="fa-solid fa-user"></i>
          )}
        </div>
        <span className="bottom-nav-label">
          {authUser ? 'Akun Saya' : 'Masuk'}
        </span>
      </button>
    </nav>
  );
}
