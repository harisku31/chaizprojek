import React, { useState, useMemo } from 'react';
import { formatRupiah } from '../utils/format';

export default function TopUpPage({ onBackToStore, onShowToast }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGameId, setSelectedGameId] = useState('mlbb');
  const [selectedPackageIdx, setSelectedPackageIdx] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState('qris');
  const [userIdInput, setUserIdInput] = useState('');
  const [zoneIdInput, setZoneIdInput] = useState('');
  const [waInput, setWaInput] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  const TOPUP_ITEMS = [
    {
      id: 'mlbb',
      name: 'Mobile Legends: Bang Bang',
      shortName: 'MLBB',
      publisher: 'Moonton',
      category: 'game',
      icon: 'fa-solid fa-gamepad',
      color: '#3b82f6',
      badge: 'Terpopuler 🔥',
      requiresZone: true,
      userLabel: 'User ID',
      userPlaceholder: 'Contoh: 12345678',
      zoneLabel: 'Zone ID',
      zonePlaceholder: 'Contoh: 2134',
      helperText: 'Buka profil MLBB Anda. User ID & Zone ID tertera di bawah avatar, contoh: 12345678 (2134).',
      packages: [
        { name: 'Weekly Diamond Pass', desc: 'Total 210 Diamonds + Extra Rewards', price: 28000, tag: 'Bestseller' },
        { name: '86 Diamonds', desc: '86 Diamonds Game', price: 21000 },
        { name: '172 Diamonds', desc: '172 Diamonds Game', price: 42000, tag: 'Populer' },
        { name: '257 Diamonds', desc: '257 Diamonds Game', price: 63000 },
        { name: '344 Diamonds', desc: '344 Diamonds Game', price: 84000 },
        { name: '706 Diamonds', desc: '706 Diamonds Game', price: 170000, tag: 'Best Deal' },
        { name: '2195 Diamonds', desc: '2195 Diamonds Game', price: 510000 },
        { name: 'Twilight Pass', desc: 'Akses Pass Eksklusif', price: 145000 }
      ]
    },
    {
      id: 'ff',
      name: 'Free Fire',
      shortName: 'Free Fire',
      publisher: 'Garena',
      category: 'game',
      icon: 'fa-solid fa-fire',
      color: '#f59e0b',
      badge: 'Proses 1 Menit ⚡',
      requiresZone: false,
      userLabel: 'Player ID Free Fire',
      userPlaceholder: 'Contoh: 198273645',
      helperText: 'Buka game Free Fire, klik nama profil di pojok kiri atas untuk melihat Player ID angka Anda.',
      packages: [
        { name: '140 Diamonds', desc: '140 Diamonds FF', price: 19000 },
        { name: '355 Diamonds', desc: '355 Diamonds FF', price: 47000, tag: 'Populer' },
        { name: '720 Diamonds', desc: '720 Diamonds FF', price: 93000, tag: 'Hemat' },
        { name: '1450 Diamonds', desc: '1450 Diamonds FF', price: 185000 },
        { name: 'Membership Mingguan', desc: 'Hadiah klaim 7 hari berturut-turut', price: 30000, tag: 'Bestseller' },
        { name: 'Membership Bulanan', desc: 'Hadiah klaim 30 hari berturut-turut', price: 89000 }
      ]
    },
    {
      id: 'genshin',
      name: 'Genshin Impact',
      shortName: 'Genshin',
      publisher: 'HoYoverse',
      category: 'game',
      icon: 'fa-solid fa-wand-magic-sparkles',
      color: '#06b6d4',
      badge: 'Resmi UID ⭐',
      requiresZone: true,
      userLabel: 'UID Genshin Impact',
      userPlaceholder: 'Contoh: 812345678',
      zoneLabel: 'Server',
      zonePlaceholder: 'Pilih Server (Asia / America / Europe / TW)',
      zoneOptions: ['Asia', 'America', 'Europe', 'TW, HK, MO'],
      helperText: 'UID berada di pojok kanan bawah layar game atau di menu Paimon profil akun.',
      packages: [
        { name: 'Blessing of the Welkin Moon', desc: '300 Genesis Crystals + 90 Primogems/hari (30 Hari)', price: 79000, tag: 'Terlaris' },
        { name: '60 Genesis Crystals', desc: '60 Genesis Crystals', price: 15500 },
        { name: '300 + 30 Genesis Crystals', desc: 'Total 330 Crystals', price: 74000 },
        { name: '980 + 110 Genesis Crystals', desc: 'Total 1090 Crystals', price: 220000, tag: 'Hemat' },
        { name: '1980 + 260 Genesis Crystals', desc: 'Total 2240 Crystals', price: 440000 }
      ]
    },
    {
      id: 'hsr',
      name: 'Honkai: Star Rail',
      shortName: 'HSR',
      publisher: 'HoYoverse',
      category: 'game',
      icon: 'fa-solid fa-train-subway',
      color: '#8b5cf6',
      badge: 'Express Pass 🚂',
      requiresZone: true,
      userLabel: 'UID Star Rail',
      userPlaceholder: 'Contoh: 800123456',
      zoneLabel: 'Server',
      zonePlaceholder: 'Pilih Server',
      zoneOptions: ['Asia', 'America', 'Europe', 'TW, HK, MO'],
      helperText: 'UID terlihat di pojok kiri bawah layar ponsel atau menu telepon game.',
      packages: [
        { name: 'Express Supply Pass', desc: '300 Oneiric Shards + 90 Stellar Jade/hari (30 Hari)', price: 79000, tag: 'Bestseller' },
        { name: '300 + 30 Oneiric Shards', desc: 'Total 330 Shards', price: 74000 },
        { name: '980 + 110 Oneiric Shards', desc: 'Total 1090 Shards', price: 220000 }
      ]
    },
    {
      id: 'valorant',
      name: 'Valorant',
      shortName: 'Valorant',
      publisher: 'Riot Games',
      category: 'game',
      icon: 'fa-solid fa-crosshairs',
      color: '#ef4444',
      badge: 'Riot ID 🎯',
      requiresZone: false,
      userLabel: 'Riot ID + Tagline',
      userPlaceholder: 'Contoh: ChaizGamer#IDN',
      helperText: 'Masukkan Riot ID lengkap beserta tagline tanda pagar, contoh: Player#1234.',
      packages: [
        { name: '475 Valorant Points', desc: '475 VP', price: 54000 },
        { name: '1000 Valorant Points', desc: '1000 VP Battlepass Ready', price: 110000, tag: 'Populer' },
        { name: '2050 Valorant Points', desc: '2050 VP', price: 220000 },
        { name: '3650 Valorant Points', desc: '3650 VP', price: 385000, tag: 'Hemat' }
      ]
    },
    {
      id: 'roblox',
      name: 'Roblox (Robux)',
      shortName: 'Roblox',
      publisher: 'Roblox Corp',
      category: 'game',
      icon: 'fa-solid fa-cube',
      color: '#10b981',
      badge: 'Fast Gift ⚡',
      requiresZone: false,
      userLabel: 'Username Akun Roblox',
      userPlaceholder: 'Contoh: RobuxMasterID',
      helperText: 'Pastikan username Roblox sudah benar dan gamepass publik sudah dibuat bila diperlukan.',
      packages: [
        { name: '400 Robux', desc: '400 Robux Masuk Cepat', price: 75000, tag: 'Populer' },
        { name: '800 Robux', desc: '800 Robux', price: 145000 },
        { name: '1700 Robux', desc: '1700 Robux', price: 290000, tag: 'Best Deal' },
        { name: '4500 Robux', desc: '4500 Robux', price: 750000 }
      ]
    },
    {
      id: 'hok',
      name: 'Honor of Kings',
      shortName: 'HOK',
      publisher: 'Level Infinite',
      category: 'game',
      icon: 'fa-solid fa-shield-halved',
      color: '#eab308',
      badge: 'Global Launch 👑',
      requiresZone: false,
      userLabel: 'User ID HOK',
      userPlaceholder: 'Contoh: 1029384756',
      helperText: 'Buka profil game HOK, klik tombol salin User ID di menu info player.',
      packages: [
        { name: '80 Tokens', desc: '80 Tokens', price: 15000 },
        { name: '240 Tokens', desc: '240 Tokens', price: 43000, tag: 'Populer' },
        { name: '405 Tokens', desc: '405 Tokens', price: 72000 },
        { name: 'Weekly Card Plus', desc: 'Benefit Mingguan Eksklusif', price: 42000, tag: 'Bestseller' }
      ]
    },
    {
      id: 'pubg',
      name: 'PUBG Mobile',
      shortName: 'PUBG',
      publisher: 'Tencent Games',
      category: 'game',
      icon: 'fa-solid fa-helmet-un',
      color: '#f97316',
      badge: 'Unknown Cash 🪖',
      requiresZone: false,
      userLabel: 'Player ID PUBG',
      userPlaceholder: 'Contoh: 5123456789',
      helperText: 'Buka profil karakter PUBG Mobile Anda, salin nomor Player ID numerik.',
      packages: [
        { name: '60 UC', desc: '60 Unknown Cash', price: 15000 },
        { name: '325 UC', desc: '300 + 25 UC Royale Pass', price: 75000, tag: 'Populer' },
        { name: '660 UC', desc: '600 + 60 UC', price: 150000, tag: 'Best Deal' },
        { name: '1800 UC', desc: '1500 + 300 UC', price: 375000 }
      ]
    },
    {
      id: 'dana',
      name: 'Saldo DANA',
      shortName: 'DANA',
      publisher: 'PT Espay Debit Indonesia',
      category: 'ewallet',
      icon: 'fa-solid fa-wallet',
      color: '#10b981',
      badge: 'Bebas Admin 💚',
      requiresZone: false,
      userLabel: 'Nomor HP Terdaftar DANA',
      userPlaceholder: 'Contoh: 081234567890',
      helperText: 'Pastikan nomor HP yang dimasukkan aktif dan terdaftar akun DANA tujuan transfer.',
      packages: [
        { name: 'Saldo Rp 25.000', desc: 'Saldo DANA 25.000', price: 26000 },
        { name: 'Saldo Rp 50.000', desc: 'Saldo DANA 50.000', price: 51000, tag: 'Populer' },
        { name: 'Saldo Rp 100.000', desc: 'Saldo DANA 100.000', price: 101500, tag: 'Hemat' },
        { name: 'Saldo Rp 200.000', desc: 'Saldo DANA 200.000', price: 202000 }
      ]
    },
    {
      id: 'gopay',
      name: 'Saldo GoPay',
      shortName: 'GoPay',
      publisher: 'Gojek Indonesia',
      category: 'ewallet',
      icon: 'fa-solid fa-money-bill-wave',
      color: '#06b6d4',
      badge: 'Instant Transfer 💙',
      requiresZone: false,
      userLabel: 'Nomor HP Terdaftar GoPay',
      userPlaceholder: 'Contoh: 081234567890',
      helperText: 'Pastikan nomor ponsel sesuai dengan akun GoPay / Gojek yang akan menerima saldo.',
      packages: [
        { name: 'Saldo Rp 25.000', desc: 'Saldo GoPay 25.000', price: 26000 },
        { name: 'Saldo Rp 50.000', desc: 'Saldo GoPay 50.000', price: 51000, tag: 'Populer' },
        { name: 'Saldo Rp 100.000', desc: 'Saldo GoPay 100.000', price: 101500, tag: 'Hemat' },
        { name: 'Saldo Rp 200.000', desc: 'Saldo GoPay 200.000', price: 202000 }
      ]
    },
    {
      id: 'shopeepay',
      name: 'Saldo ShopeePay',
      shortName: 'ShopeePay',
      publisher: 'Shopee Indonesia',
      category: 'ewallet',
      icon: 'fa-solid fa-bag-shopping',
      color: '#f97316',
      badge: 'Cepat & Aman 🧡',
      requiresZone: false,
      userLabel: 'Nomor HP ShopeePay',
      userPlaceholder: 'Contoh: 081234567890',
      helperText: 'Pastikan akun ShopeePay sudah aktif dan dapat menerima transfer saldo.',
      packages: [
        { name: 'Saldo Rp 25.000', desc: 'Saldo ShopeePay 25.000', price: 26000 },
        { name: 'Saldo Rp 50.000', desc: 'Saldo ShopeePay 50.000', price: 51000, tag: 'Populer' },
        { name: 'Saldo Rp 100.000', desc: 'Saldo ShopeePay 100.000', price: 101500 }
      ]
    },
    {
      id: 'ovo',
      name: 'Saldo OVO',
      shortName: 'OVO',
      publisher: 'PT Visionet Internasional',
      category: 'ewallet',
      icon: 'fa-solid fa-coins',
      color: '#a855f7',
      badge: 'OVO Cash 💜',
      requiresZone: false,
      userLabel: 'Nomor HP Terdaftar OVO',
      userPlaceholder: 'Contoh: 081234567890',
      helperText: 'Ketikkan nomor telepon yang terdaftar pada aplikasi OVO penerima.',
      packages: [
        { name: 'Saldo Rp 25.000', desc: 'Saldo OVO 25.000', price: 26000 },
        { name: 'Saldo Rp 50.000', desc: 'Saldo OVO 50.000', price: 51000, tag: 'Populer' },
        { name: 'Saldo Rp 100.000', desc: 'Saldo OVO 100.000', price: 101500 }
      ]
    }
  ];

  const PAYMENT_METHODS = [
    { id: 'qris', name: 'QRIS All Payment', badge: 'Instan & Otomatis', desc: 'BCA, Mandiri, BRI, DANA, GoPay, OVO, ShopeePay', icon: 'fa-solid fa-qrcode' },
    { id: 'dana', name: 'DANA Transfer', badge: 'Bebas Admin', desc: 'Transfer sesama DANA langsung ke Admin', icon: 'fa-solid fa-wallet' },
    { id: 'gopay', name: 'GoPay', badge: 'Fast Transfer', desc: 'Transfer saldo GoPay / Gojek', icon: 'fa-solid fa-money-bill-wave' },
    { id: 'bank', name: 'Transfer Bank (BCA / Mandiri / BRI)', badge: 'Semua Bank', desc: 'M-Banking, ATM, Internet Banking', icon: 'fa-solid fa-building-columns' }
  ];

  const PROMO_CODES = {
    CHAIZTOPUP: { discount: 3000, label: 'Diskon Spesial Top Up Rp 3.000' },
    HEMAT10: { discount: 5000, label: 'Potongan Khusus Rp 5.000' },
    TOPUPKILAT: { discount: 2000, label: 'Bonus Kilat Rp 2.000' }
  };

  const filteredItems = useMemo(() => {
    return TOPUP_ITEMS.filter((item) => {
      const matchCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.publisher.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  const currentGame = TOPUP_ITEMS.find((it) => it.id === selectedGameId) || TOPUP_ITEMS[0];
  const currentPackage = currentGame.packages[selectedPackageIdx] || currentGame.packages[0];

  const basePrice = currentPackage.price;
  const discountAmount = appliedVoucher ? appliedVoucher.discount : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  const handleApplyVoucher = (e) => {
    e.preventDefault();
    if (!voucherCode.trim()) {
      onShowToast?.('Silakan masukkan kode voucher!', 'fa-circle-exclamation');
      return;
    }
    const code = voucherCode.trim().toUpperCase();
    if (PROMO_CODES[code]) {
      setAppliedVoucher({ code, ...PROMO_CODES[code] });
      onShowToast?.(`Voucher ${code} berhasil dipasang! Hemat ${formatRupiah(PROMO_CODES[code].discount)}`, 'fa-ticket');
    } else {
      onShowToast?.(`Kode voucher "${code}" tidak valid atau kedaluwarsa`, 'fa-circle-xmark');
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    onShowToast?.('Voucher dihapus', 'fa-trash-can');
  };

  const handleCheckoutWhatsApp = () => {
    if (!userIdInput.trim()) {
      onShowToast?.(`Silakan isi ${currentGame.userLabel} terlebih dahulu!`, 'fa-circle-exclamation');
      const inputEl = document.getElementById('topup-userid-input');
      if (inputEl) inputEl.focus();
      return;
    }

    if (currentGame.requiresZone && !zoneIdInput.trim()) {
      onShowToast?.(`Silakan isi ${currentGame.zoneLabel || 'Server / Zone ID'}!`, 'fa-circle-exclamation');
      const zoneEl = document.getElementById('topup-zoneid-input');
      if (zoneEl) zoneEl.focus();
      return;
    }

    const payMethodName = PAYMENT_METHODS.find((p) => p.id === selectedPayment)?.name || 'QRIS All Payment';

    let orderText = `*HALO ADMIN CHAIZSTORE, SAYA MAU TOP UP*\n\n`;
    orderText += `🎮 *Layanan:* ${currentGame.name}\n`;
    orderText += `📦 *Paket:* ${currentPackage.name}\n`;
    orderText += `🆔 *${currentGame.userLabel}:* ${userIdInput.trim()}\n`;

    if (currentGame.requiresZone) {
      orderText += `🌐 *${currentGame.zoneLabel || 'Server / Zone ID'}:* ${zoneIdInput.trim()}\n`;
    }

    if (waInput.trim()) {
      orderText += `📱 *WhatsApp Pemesan:* ${waInput.trim()}\n`;
    }

    orderText += `💳 *Metode Pembayaran:* ${payMethodName}\n`;
    orderText += `💵 *Harga Paket:* ${formatRupiah(basePrice)}\n`;

    if (appliedVoucher) {
      orderText += `🏷️ *Voucher Promo:* ${appliedVoucher.code} (-${formatRupiah(discountAmount)})\n`;
    }

    orderText += `💰 *TOTAL BAYAR:* *${formatRupiah(finalPrice)}*\n\n`;
    orderText += `_Mohon kirimkan QRIS / Nomor Rekening Pembayaran. Terima kasih!_`;

    const encodedMsg = encodeURIComponent(orderText);
    const waUrl = `https://wa.me/6287795172347?text=${encodedMsg}`;

    onShowToast?.('Membuka WhatsApp Admin ChaizStore...', 'fa-paper-plane');
    window.open(waUrl, '_blank');
  };

  return (
    <div className="topup-page-container">
      {/* 1. Header Banner & Navigasi Halaman */}
      <section className="topup-page-hero">
        <div className="container">
          <div className="topup-breadcrumb-bar">
            <button
              type="button"
              className="topup-back-btn"
              onClick={onBackToStore}
              title="Kembali ke halaman Akun Premium"
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Kembali ke Akun Premium</span>
            </button>

            <div className="topup-page-status-pill">
              <span className="live-status-dot"></span>
              <span>Sistem Top Up Online 24 Jam</span>
            </div>

            <button
              type="button"
              className="topup-newtab-btn"
              onClick={() => window.open(window.location.origin + '/#topup', '_blank')}
              title="Buka Halaman Top Up di Tab Browser Baru"
            >
              <i className="fa-solid fa-arrow-up-right-from-square"></i>
              <span>Buka di Tab Baru</span>
            </button>
          </div>

          <div className="topup-hero-content">
            <span className="topup-hero-badge">
              <i className="fa-solid fa-bolt text-warning"></i> CHAIZSTORE TOP UP CENTER
            </span>
            <h1 className="topup-hero-title">
              Pusat Top Up Game & E-Wallet <span>Resmi & Termurah</span>
            </h1>
            <p className="topup-hero-sub">
              Top up diamond game dan saldo e-wallet favoritmu dalam 1-3 menit proses kilat. 100% legal, aman, & full garansi admin.
            </p>

            <div className="topup-hero-stats">
              <div className="topup-stat-item">
                <i className="fa-solid fa-bolt text-warning"></i>
                <div>
                  <strong>1 - 3 Menit</strong>
                  <small>Proses Otomatis</small>
                </div>
              </div>
              <div className="topup-stat-item">
                <i className="fa-solid fa-shield-halved text-cyan"></i>
                <div>
                  <strong>100% Legal</strong>
                  <small>Garansi Anti-Banned</small>
                </div>
              </div>
              <div className="topup-stat-item">
                <i className="fa-solid fa-qrcode text-success"></i>
                <div>
                  <strong>QRIS All Payment</strong>
                  <small>Bebas Biaya Admin</small>
                </div>
              </div>
              <div className="topup-stat-item">
                <i className="fa-brands fa-whatsapp text-success"></i>
                <div>
                  <strong>CS 24/7</strong>
                  <small>Fast Response WhatsApp</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Step Indicator */}
      <section className="topup-steps-guide">
        <div className="container">
          <div className="topup-steps-grid">
            <div className="step-card">
              <span className="step-num">1</span>
              <div>
                <strong>Pilih Game / Layanan</strong>
                <small>Tersedia 10+ game populer & e-wallet</small>
              </div>
            </div>
            <div className="step-card">
              <span className="step-num">2</span>
              <div>
                <strong>Masukkan Data Akun</strong>
                <small>Player ID & Zone ID tanpa password</small>
              </div>
            </div>
            <div className="step-card">
              <span className="step-num">3</span>
              <div>
                <strong>Pilih Nominal & Paket</strong>
                <small>Harga termurah promo spesial</small>
              </div>
            </div>
            <div className="step-card">
              <span className="step-num">4</span>
              <div>
                <strong>Bayar via WhatsApp</strong>
                <small>QRIS instan & langsung diproses</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Top Up App Layout */}
      <section className="topup-main-section">
        <div className="container">
          <div className="topup-layout-grid">
            {/* KOLOM KIRI: PILIH GAME & LAYANAN */}
            <div className="topup-games-column">
              <div className="topup-panel-box">
                <div className="topup-panel-header">
                  <div className="panel-step-badge">
                    <span>1</span>
                  </div>
                  <div>
                    <h2 className="panel-title">Pilih Game atau E-Wallet</h2>
                    <p className="panel-sub">Pilih produk yang ingin kamu isi ulang hari ini</p>
                  </div>
                </div>

                {/* Filter Kategori & Search Bar */}
                <div className="topup-filter-row">
                  <div className="topup-category-tabs">
                    <button
                      type="button"
                      className={`topup-cat-btn ${activeCategory === 'all' ? 'active' : ''}`}
                      onClick={() => setActiveCategory('all')}
                    >
                      <i className="fa-solid fa-shapes"></i> Semua ({TOPUP_ITEMS.length})
                    </button>
                    <button
                      type="button"
                      className={`topup-cat-btn ${activeCategory === 'game' ? 'active' : ''}`}
                      onClick={() => setActiveCategory('game')}
                    >
                      <i className="fa-solid fa-gamepad"></i> Game Populer
                    </button>
                    <button
                      type="button"
                      className={`topup-cat-btn ${activeCategory === 'ewallet' ? 'active' : ''}`}
                      onClick={() => setActiveCategory('ewallet')}
                    >
                      <i className="fa-solid fa-wallet"></i> E-Wallet
                    </button>
                  </div>

                  <div className="topup-search-box">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input
                      type="text"
                      placeholder="Cari game (MLBB, FF, Genshin...)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="topup-clear-search"
                        onClick={() => setSearchQuery('')}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid Pilihan Game */}
                <div className="topup-games-grid">
                  {filteredItems.map((game) => {
                    const isSelected = selectedGameId === game.id;
                    const startingPrice = game.packages[0]?.price;
                    return (
                      <div
                        key={game.id}
                        className={`topup-game-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedGameId(game.id);
                          setSelectedPackageIdx(0);
                        }}
                      >
                        {game.badge && <span className="game-card-badge">{game.badge}</span>}
                        <div className="game-card-icon" style={{ color: game.color }}>
                          <i className={game.icon}></i>
                        </div>
                        <div className="game-card-info">
                          <strong className="game-card-title">{game.name}</strong>
                          <span className="game-card-sub">{game.publisher}</span>
                          <span className="game-card-price">
                            Mulai {formatRupiah(startingPrice)}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="game-card-check">
                            <i className="fa-solid fa-circle-check"></i>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* KOLOM KANAN: FORMULIR INPUT DATA, NOMINAL, PEMBAYARAN & CHECKOUT */}
            <div className="topup-order-column">
              {/* Form Input User ID & Zone ID */}
              <div className="topup-panel-box mb-4">
                <div className="topup-panel-header">
                  <div className="panel-step-badge">
                    <span>2</span>
                  </div>
                  <div>
                    <h2 className="panel-title">Masukkan Data Akun</h2>
                    <p className="panel-sub">Untuk akun tujuan pengiriman top up {currentGame.name}</p>
                  </div>
                </div>

                <div className="topup-inputs-row">
                  <div className="topup-input-group flex-1">
                    <label htmlFor="topup-userid-input">
                      <i className="fa-solid fa-user-tag text-cyan"></i> {currentGame.userLabel} <span className="text-danger">*</span>
                    </label>
                    <input
                      id="topup-userid-input"
                      type="text"
                      className="topup-text-input"
                      placeholder={currentGame.userPlaceholder}
                      value={userIdInput}
                      onChange={(e) => setUserIdInput(e.target.value)}
                      required
                    />
                  </div>

                  {currentGame.requiresZone && (
                    <div className="topup-input-group flex-1">
                      <label htmlFor="topup-zoneid-input">
                        <i className="fa-solid fa-globe text-warning"></i> {currentGame.zoneLabel || 'Server / Zone ID'} <span className="text-danger">*</span>
                      </label>
                      {currentGame.zoneOptions ? (
                        <select
                          id="topup-zoneid-input"
                          className="topup-text-input"
                          value={zoneIdInput}
                          onChange={(e) => setZoneIdInput(e.target.value)}
                        >
                          <option value="">-- Pilih Server --</option>
                          {currentGame.zoneOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              Server {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id="topup-zoneid-input"
                          type="text"
                          className="topup-text-input"
                          placeholder={currentGame.zonePlaceholder}
                          value={zoneIdInput}
                          onChange={(e) => setZoneIdInput(e.target.value)}
                          required
                        />
                      )}
                    </div>
                  )}
                </div>

                {currentGame.helperText && (
                  <div className="topup-input-hint">
                    <i className="fa-solid fa-circle-info"></i>
                    <span>{currentGame.helperText}</span>
                  </div>
                )}
              </div>

              {/* Pilihan Nominal / Paket */}
              <div className="topup-panel-box mb-4">
                <div className="topup-panel-header">
                  <div className="panel-step-badge">
                    <span>3</span>
                  </div>
                  <div>
                    <h2 className="panel-title">Pilih Nominal / Paket</h2>
                    <p className="panel-sub">Tersedia {currentGame.packages.length} pilihan paket untuk {currentGame.name}</p>
                  </div>
                </div>

                <div className="topup-packages-grid">
                  {currentGame.packages.map((pkg, idx) => {
                    const isSelected = selectedPackageIdx === idx;
                    return (
                      <div
                        key={idx}
                        className={`topup-pkg-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedPackageIdx(idx)}
                      >
                        {pkg.tag && <span className="pkg-tag-badge">{pkg.tag}</span>}
                        <div className="pkg-card-top">
                          <strong className="pkg-title">{pkg.name}</strong>
                          <span className="pkg-price">{formatRupiah(pkg.price)}</span>
                        </div>
                        {pkg.desc && <span className="pkg-desc">{pkg.desc}</span>}
                        {isSelected && (
                          <div className="pkg-check-indicator">
                            <i className="fa-solid fa-check"></i>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pilihan Metode Pembayaran */}
              <div className="topup-panel-box mb-4">
                <div className="topup-panel-header">
                  <div className="panel-step-badge">
                    <span>4</span>
                  </div>
                  <div>
                    <h2 className="panel-title">Pilih Metode Pembayaran</h2>
                    <p className="panel-sub">Pembayaran mudah, bebas biaya admin, & aman</p>
                  </div>
                </div>

                <div className="topup-payments-grid">
                  {PAYMENT_METHODS.map((pm) => {
                    const isSelected = selectedPayment === pm.id;
                    return (
                      <div
                        key={pm.id}
                        className={`topup-payment-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedPayment(pm.id)}
                      >
                        <div className="payment-card-left">
                          <div className="payment-card-icon">
                            <i className={pm.icon}></i>
                          </div>
                          <div>
                            <strong className="payment-title">{pm.name}</strong>
                            <span className="payment-sub">{pm.desc}</span>
                          </div>
                        </div>
                        <div className="payment-card-right">
                          <span className="payment-badge">{pm.badge}</span>
                          <div className={`payment-radio ${isSelected ? 'checked' : ''}`}>
                            {isSelected && <div className="payment-radio-dot"></div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Input Nomor WhatsApp & Kode Voucher */}
              <div className="topup-panel-box mb-4">
                <div className="topup-panel-header">
                  <div className="panel-step-badge">
                    <span>5</span>
                  </div>
                  <div>
                    <h2 className="panel-title">Notifikasi & Voucher Diskon</h2>
                    <p className="panel-sub">Masukkan nomor WhatsApp dan gunakan voucher hemat</p>
                  </div>
                </div>

                <div className="topup-inputs-row mb-3">
                  <div className="topup-input-group flex-1">
                    <label htmlFor="topup-wa-input">
                      <i className="fa-brands fa-whatsapp text-success"></i> Nomor WhatsApp Kamu (Opsional)
                    </label>
                    <input
                      id="topup-wa-input"
                      type="text"
                      className="topup-text-input"
                      placeholder="Contoh: 081234567890 (Untuk konfirmasi)"
                      value={waInput}
                      onChange={(e) => setWaInput(e.target.value)}
                    />
                  </div>
                </div>

                {/* Kolom Voucher Promo */}
                <div className="topup-voucher-box">
                  <label>
                    <i className="fa-solid fa-ticket text-warning"></i> Kode Voucher Promo Top Up
                  </label>
                  {!appliedVoucher ? (
                    <form className="topup-voucher-form" onSubmit={handleApplyVoucher}>
                      <input
                        type="text"
                        className="topup-voucher-input"
                        placeholder="Ketik voucher (Contoh: CHAIZTOPUP, HEMAT10)"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                      />
                      <button type="submit" className="topup-voucher-apply-btn">
                        Terapkan
                      </button>
                    </form>
                  ) : (
                    <div className="topup-voucher-active">
                      <div className="voucher-active-left">
                        <i className="fa-solid fa-circle-check text-success"></i>
                        <div>
                          <strong>{appliedVoucher.code}</strong>
                          <span>{appliedVoucher.label}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="voucher-remove-btn"
                        onClick={handleRemoveVoucher}
                        title="Hapus voucher"
                      >
                        <i className="fa-solid fa-trash-can"></i> Hapus
                      </button>
                    </div>
                  )}

                  <div className="topup-voucher-chips">
                    <span className="chips-label">Voucher aktif:</span>
                    <button
                      type="button"
                      className="voucher-chip"
                      onClick={() => setVoucherCode('CHAIZTOPUP')}
                    >
                      CHAIZTOPUP (-3rb)
                    </button>
                    <button
                      type="button"
                      className="voucher-chip"
                      onClick={() => setVoucherCode('HEMAT10')}
                    >
                      HEMAT10 (-5rb)
                    </button>
                  </div>
                </div>
              </div>

              {/* Rangkuman Transaksi & Tombol Checkout WhatsApp */}
              <div className="topup-summary-panel">
                <div className="summary-panel-header">
                  <i className="fa-solid fa-receipt text-warning"></i>
                  <h3>Ringkasan Pembelian Top Up</h3>
                </div>

                <div className="summary-rows">
                  <div className="summary-row">
                    <span>Produk Layanan</span>
                    <strong>{currentGame.name}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Paket Dipilih</span>
                    <strong>{currentPackage.name}</strong>
                  </div>
                  <div className="summary-row">
                    <span>{currentGame.userLabel}</span>
                    <strong className={userIdInput ? 'text-cyan' : 'text-muted'}>
                      {userIdInput || '(Belum diisi)'}
                    </strong>
                  </div>
                  {currentGame.requiresZone && (
                    <div className="summary-row">
                      <span>{currentGame.zoneLabel || 'Server / Zone ID'}</span>
                      <strong className={zoneIdInput ? 'text-cyan' : 'text-muted'}>
                        {zoneIdInput || '(Belum diisi)'}
                      </strong>
                    </div>
                  )}
                  <div className="summary-row">
                    <span>Metode Bayar</span>
                    <strong>{PAYMENT_METHODS.find((p) => p.id === selectedPayment)?.name}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Harga Normal</span>
                    <span>{formatRupiah(basePrice)}</span>
                  </div>

                  {appliedVoucher && (
                    <div className="summary-row discount-row">
                      <span>Diskon Voucher ({appliedVoucher.code})</span>
                      <strong className="text-success">-{formatRupiah(discountAmount)}</strong>
                    </div>
                  )}

                  <div className="summary-divider"></div>

                  <div className="summary-total-row">
                    <div>
                      <span className="total-label">Total Pembayaran</span>
                      <span className="total-hint">Bebas biaya admin</span>
                    </div>
                    <div className="total-price-wrap">
                      <span className="total-price">{formatRupiah(finalPrice)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="topup-submit-btn"
                  onClick={handleCheckoutWhatsApp}
                >
                  <div className="btn-icon-wrap">
                    <i className="fa-brands fa-whatsapp"></i>
                  </div>
                  <div className="btn-text-wrap">
                    <strong>Top Up Sekarang via WhatsApp</strong>
                    <small>Proses kilat 1-3 menit langsung ke Admin</small>
                  </div>
                  <i className="fa-solid fa-arrow-right btn-arrow"></i>
                </button>

                <p className="topup-security-guarantee">
                  <i className="fa-solid fa-shield-check text-success"></i>
                  <span>Jaminan 100% Saldo/Diamond Masuk Akun atau Uang Kembali Penuh.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FAQ & Panduan Khusus Top Up */}
      <section className="topup-faq-section">
        <div className="container">
          <div className="topup-faq-header text-center">
            <span className="faq-badge">BANTUAN & INFORMASI</span>
            <h2 className="faq-title">Pertanyaan Seputar Layanan Top Up</h2>
            <p className="faq-sub">Semua informasi penting yang perlu kamu ketahui sebelum memesan</p>
          </div>

          <div className="topup-faq-grid">
            <div className="topup-faq-item">
              <div className="faq-q-icon">
                <i className="fa-solid fa-clock"></i>
              </div>
              <div>
                <h4>Berapa lama proses top up diproses?</h4>
                <p>Setelah pembayaran terkonfirmasi, diamond atau saldo langsung masuk ke akun kamu dalam hitungan 1 hingga 3 menit saja.</p>
              </div>
            </div>

            <div className="topup-faq-item">
              <div className="faq-q-icon">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <div>
                <h4>Apakah proses top up memerlukan password?</h4>
                <p><strong>Tidak sama sekali!</strong> Kami hanya membutuhkan Player ID / UID dan Zone ID Anda. Akun Anda 100% aman tanpa risiko kena hack.</p>
              </div>
            </div>

            <div className="topup-faq-item">
              <div className="faq-q-icon">
                <i className="fa-solid fa-qrcode"></i>
              </div>
              <div>
                <h4>Metode pembayaran apa saja yang diterima?</h4>
                <p>Kami menerima QRIS All Payment (bisa scan pakai BCA, Mandiri, BRI, BNI, DANA, GoPay, OVO, ShopeePay) serta Transfer Bank.</p>
              </div>
            </div>

            <div className="topup-faq-item">
              <div className="faq-q-icon">
                <i className="fa-solid fa-headset"></i>
              </div>
              <div>
                <h4>Bagaimana jika saya salah menuliskan Player ID?</h4>
                <p>Segera hubungi CS WhatsApp kami dengan menyertakan bukti screenshot profil game Anda agar admin dapat segera mengoreksi sebelum diproses.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Kembali ke Akun Premium (Bila scroll jauh ke bawah) */}
      <div className="topup-sticky-bar">
        <div className="container sticky-bar-inner">
          <div className="sticky-info">
            <span className="sticky-game">{currentGame.name}</span>
            <span className="sticky-price">{currentPackage.name} • {formatRupiah(finalPrice)}</span>
          </div>
          <div className="sticky-actions">
            <button
              type="button"
              className="sticky-back-btn"
              onClick={onBackToStore}
            >
              <i className="fa-solid fa-layer-group"></i> Ke Akun Premium
            </button>
            <button
              type="button"
              className="sticky-order-btn"
              onClick={handleCheckoutWhatsApp}
            >
              <i className="fa-brands fa-whatsapp"></i> Beli Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
