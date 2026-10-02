import React, { useState } from 'react';
import { formatRupiah } from '../utils/format';

export default function TopUpModal({ isOpen, onClose, onShowToast }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGameId, setSelectedGameId] = useState('mlbb');
  const [selectedPackageIdx, setSelectedPackageIdx] = useState(0);
  const [userIdInput, setUserIdInput] = useState('');
  const [zoneIdInput, setZoneIdInput] = useState('');

  if (!isOpen) return null;

  const TOPUP_ITEMS = [
    {
      id: 'mlbb',
      name: 'Mobile Legends',
      subtitle: 'Moonton • MLBB',
      category: 'game',
      icon: 'fa-solid fa-gamepad',
      badge: 'Terlaris',
      color: '#3b82f6',
      requiresZone: true,
      zonePlaceholder: 'Zone ID (contoh: 2134)',
      userPlaceholder: 'User ID (contoh: 12345678)',
      packages: [
        { name: 'Weekly Diamond Pass', price: 28000, tag: 'Bestseller' },
        { name: '86 Diamonds', price: 21000 },
        { name: '172 Diamonds', price: 42000, tag: 'Populer' },
        { name: '257 Diamonds', price: 63000 },
        { name: '706 Diamonds', price: 170000, tag: 'Best Deal' }
      ]
    },
    {
      id: 'ff',
      name: 'Free Fire',
      subtitle: 'Garena Free Fire',
      category: 'game',
      icon: 'fa-solid fa-fire',
      badge: 'Proses 1 Menit',
      color: '#f59e0b',
      requiresZone: false,
      userPlaceholder: 'Player ID Free Fire',
      packages: [
        { name: '140 Diamonds', price: 19000 },
        { name: '355 Diamonds', price: 47000, tag: 'Populer' },
        { name: '720 Diamonds', price: 93000, tag: 'Hemat' },
        { name: 'Membership Mingguan', price: 30000, tag: 'Bestseller' }
      ]
    },
    {
      id: 'genshin',
      name: 'Genshin Impact',
      subtitle: 'HoYoverse Genshin',
      category: 'game',
      icon: 'fa-solid fa-wand-magic-sparkles',
      badge: 'Resmi UID',
      color: '#06b6d4',
      requiresZone: true,
      zonePlaceholder: 'Server (Asia / America / Europe)',
      userPlaceholder: 'UID Genshin Impact',
      packages: [
        { name: 'Blessing of the Welkin Moon', price: 79000, tag: 'Terlaris' },
        { name: '300 + 30 Genesis Crystals', price: 74000 },
        { name: '980 + 110 Genesis Crystals', price: 220000, tag: 'Hemat' }
      ]
    },
    {
      id: 'valorant',
      name: 'Valorant',
      subtitle: 'Riot Games Valorant',
      category: 'game',
      icon: 'fa-solid fa-crosshairs',
      badge: 'Riot ID',
      color: '#ef4444',
      requiresZone: false,
      userPlaceholder: 'Riot ID + Tagline (contoh: Player#ID)',
      packages: [
        { name: '475 Valorant Points', price: 54000 },
        { name: '1000 Valorant Points', price: 110000, tag: 'Populer' },
        { name: '2050 Valorant Points', price: 220000 }
      ]
    },
    {
      id: 'roblox',
      name: 'Roblox (Robux)',
      category: 'game',
      icon: 'fa-solid fa-cube',
      badge: 'Fast Gift',
      color: '#8b5cf6',
      requiresZone: false,
      userPlaceholder: 'Username Akun Roblox',
      packages: [
        { name: '400 Robux', price: 75000, tag: 'Populer' },
        { name: '800 Robux', price: 145000 },
        { name: '1700 Robux', price: 290000, tag: 'Best Deal' }
      ]
    },
    {
      id: 'dana',
      name: 'Saldo DANA',
      subtitle: 'E-Wallet DANA',
      category: 'ewallet',
      icon: 'fa-solid fa-wallet',
      badge: 'Bebas Admin',
      color: '#10b981',
      requiresZone: false,
      userPlaceholder: 'Nomor HP Terdaftar DANA',
      packages: [
        { name: 'Top Up Rp 25.000', price: 26000 },
        { name: 'Top Up Rp 50.000', price: 51000, tag: 'Populer' },
        { name: 'Top Up Rp 100.000', price: 101500, tag: 'Hemat' }
      ]
    },
    {
      id: 'gopay',
      name: 'Saldo GoPay',
      subtitle: 'Gojek E-Wallet',
      category: 'ewallet',
      icon: 'fa-solid fa-money-bill-wave',
      badge: 'Instan Kilat',
      color: '#0284c7',
      requiresZone: false,
      userPlaceholder: 'Nomor HP Terdaftar GoPay',
      packages: [
        { name: 'Top Up Rp 25.000', price: 26000 },
        { name: 'Top Up Rp 50.000', price: 51000, tag: 'Populer' },
        { name: 'Top Up Rp 100.000', price: 101500, tag: 'Hemat' }
      ]
    }
  ];

  const filteredItems = TOPUP_ITEMS.filter((item) => {
    const matchCat = activeCategory === 'all' || item.category === activeCategory;
    const matchQ =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQ;
  });

  const currentGame = TOPUP_ITEMS.find((g) => g.id === selectedGameId) || TOPUP_ITEMS[0];
  const currentPackage = currentGame.packages[selectedPackageIdx] || currentGame.packages[0];

  const handleProceedWhatsApp = () => {
    if (!userIdInput.trim()) {
      if (onShowToast) onShowToast('Harap masukkan User ID atau Nomor Tujuan terlebih dahulu!', 'fa-triangle-exclamation');
      return;
    }

    let targetDetail = `ID/Nomor: ${userIdInput}`;
    if (currentGame.requiresZone && zoneIdInput.trim()) {
      targetDetail += ` (Zone/Server: ${zoneIdInput})`;
    }

    const message = `Halo Admin ChaizStore, saya ingin order Top Up:\n\n` +
      `🎮 *Item:* ${currentGame.name}\n` +
      `📦 *Paket:* ${currentPackage.name}\n` +
      `💰 *Harga:* ${formatRupiah(currentPackage.price)}\n` +
      `🎯 *Data Tujuan:* ${targetDetail}\n\n` +
      `Mohon info rekening/QRIS pembayaran dan segera diproses ya kak! Terima kasih 🙏`;

    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/6287795172347?text=${encoded}`;
    window.open(waUrl, '_blank');
    onClose();
  };

  return (
    <div
      className="modal-overlay active"
      id="topUpModal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box modal-box-redesign topup-modal-box">
        <button className="modal-close-btn" onClick={onClose} aria-label="Tutup">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Modal Header */}
        <div className="modal-header-centered topup-header">
          <div className="topup-icon-badge">
            <i className="fa-solid fa-gamepad"></i>
          </div>
          <span className="modal-tag">LAYANAN TOP UP RESMI CHAIZSTORE</span>
          <h3 className="modal-title-centered">Top Up Game & Saldo E-Wallet</h3>
          <p className="topup-header-desc">
            Proses otomatis kilat 1-5 menit langsung masuk ke akun kamu dengan garansi 100% aman & legal!
          </p>

          <div className="modal-quick-perks">
            <span><i className="fa-solid fa-bolt text-amber"></i> Proses 1-5 Menit</span>
            <span><i className="fa-solid fa-shield-check text-emerald"></i> 100% Legal</span>
            <span><i className="fa-solid fa-qrcode text-primary"></i> QRIS & All E-Wallet</span>
          </div>
        </div>

        <div className="modal-body topup-body">
          {/* Category Tabs & Search */}
          <div className="topup-filter-row">
            <div className="topup-category-pills">
              <button
                type="button"
                className={`topup-cat-btn ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                Semua
              </button>
              <button
                type="button"
                className={`topup-cat-btn ${activeCategory === 'game' ? 'active' : ''}`}
                onClick={() => setActiveCategory('game')}
              >
                <i className="fa-solid fa-gamepad"></i> Game
              </button>
              <button
                type="button"
                className={`topup-cat-btn ${activeCategory === 'ewallet' ? 'active' : ''}`}
                onClick={() => setActiveCategory('ewallet')}
              >
                <i className="fa-solid fa-wallet"></i> E-Wallet
              </button>
            </div>

            <div className="topup-search-wrap">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                className="topup-search-input"
                placeholder="Cari game atau e-wallet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* 1. Pilih Game / E-Wallet */}
          <div className="topup-section">
            <label className="modal-section-title">
              <i className="fa-solid fa-cubes text-primary"></i>
              <span>1. Pilih Layanan Top Up:</span>
            </label>
            <div className="topup-game-grid">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`topup-game-card ${item.id === selectedGameId ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedGameId(item.id);
                    setSelectedPackageIdx(0);
                  }}
                >
                  <div className="topup-game-icon" style={{ color: item.color }}>
                    <i className={item.icon}></i>
                  </div>
                  <div className="topup-game-info">
                    <strong>{item.name}</strong>
                    <small>{item.subtitle}</small>
                  </div>
                  <span className="topup-game-badge">{item.badge}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Masukkan ID / Data Akun */}
          <div className="topup-section">
            <label className="modal-section-title">
              <i className="fa-solid fa-id-badge text-warning"></i>
              <span>2. Masukkan Data Akun Tujuan:</span>
            </label>
            <div className={`topup-id-inputs-row ${currentGame.requiresZone ? 'two-cols' : ''}`}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder={currentGame.userPlaceholder || 'Masukkan User ID'}
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                />
              </div>
              {currentGame.requiresZone && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={currentGame.zonePlaceholder || 'Zone ID / Server'}
                    value={zoneIdInput}
                    onChange={(e) => setZoneIdInput(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3. Pilih Nominal / Paket */}
          <div className="topup-section">
            <label className="modal-section-title">
              <i className="fa-solid fa-layer-group text-primary"></i>
              <span>3. Pilih Nominal / Paket:</span>
            </label>
            <div className="duration-selector-grid topup-packages-grid">
              {currentGame.packages.map((pkg, idx) => (
                <label key={idx} className="duration-option">
                  <input
                    type="radio"
                    name="selectedTopupPackage"
                    checked={idx === selectedPackageIdx}
                    onChange={() => setSelectedPackageIdx(idx)}
                  />
                  <div className="duration-card topup-package-card">
                    <span className="dur-badge">{pkg.name}</span>
                    <span className="dur-price">{formatRupiah(pkg.price)}</span>
                    {pkg.tag && <span className="dur-tag">{pkg.tag}</span>}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 4. Ringkasan & Tombol Beli */}
          <div className="order-summary-box topup-summary">
            <div className="summary-row">
              <span>Layanan Terpilih:</span>
              <strong>{currentGame.name}</strong>
            </div>
            <div className="summary-row">
              <span>Paket Nominal:</span>
              <strong>{currentPackage.name}</strong>
            </div>
            <div className="summary-row">
              <span>Data Tujuan:</span>
              <strong className="text-warning">
                {userIdInput ? `${userIdInput} ${zoneIdInput ? `(${zoneIdInput})` : ''}` : 'Belum diisi'}
              </strong>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row total-row">
              <span>Total Biaya:</span>
              <strong className="total-price">{formatRupiah(currentPackage.price)}</strong>
            </div>
          </div>

          <div className="modal-dual-actions" style={{ marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              style={{ borderRadius: 'var(--radius-pill)' }}
            >
              <i className="fa-solid fa-arrow-left"></i> Kembali
            </button>
            <button
              type="button"
              className="btn btn-primary btn-buy-action"
              onClick={handleProceedWhatsApp}
            >
              <i className="fa-brands fa-whatsapp"></i> Pesan Top Up via WhatsApp
            </button>
          </div>

          <p className="order-note" style={{ textAlign: 'center', marginTop: '12px' }}>
            <i className="fa-solid fa-shield-halved"></i> Garansi 100% aman, legal resmi, dan langsung diproses admin dalam 1-5 menit.
          </p>
        </div>
      </div>
    </div>
  );
}
