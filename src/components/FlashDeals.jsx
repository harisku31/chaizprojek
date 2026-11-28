import React, { useRef } from 'react';
import { formatRupiah } from '../utils/format';

export default function FlashDeals({
  products = [],
  onOpenProductModal,
  onSwitchTab,
  onShowToast
}) {
  const gridRef = useRef(null);

  const handleScroll = (direction) => {
    if (!gridRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = gridRef.current;
    if (direction === 'left') {
      if (scrollLeft <= 20) {
        gridRef.current.scrollTo({ left: scrollWidth, behavior: 'smooth' });
      } else {
        gridRef.current.scrollBy({ left: -260, behavior: 'smooth' });
      }
    } else {
      if (scrollLeft + clientWidth >= scrollWidth - 20) {
        gridRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        gridRef.current.scrollBy({ left: 260, behavior: 'smooth' });
      }
    }
  };

  // 6 Item Rekomendasi Sale Pilihan Sesuai Permintaan:
  // 1. Canva, 2. Gemini, 3. Alight Motion, 4. Viu, 5. Top Up Robux, 6. Top Up Steam
  const canvaProd = products.find((p) => p.id === 'canva-pro');
  const geminiProd = products.find((p) => p.id === 'gemini-advanced');
  const alightProd = products.find((p) => p.id === 'alight-motion');
  const viuProd = products.find((p) => p.id === 'viu-prem');

  const flashProducts = [
    canvaProd || {
      id: 'canva-pro',
      name: 'Canva Pro Desain & AI',
      category: 'produktivitas',
      image: 'canva.png',
      currentPrice: 3000,
      oldPrice: 10000,
      stock: 5
    },
    geminiProd || {
      id: 'gemini-advanced',
      name: 'Gemini Pro (Google AI)',
      category: 'ai',
      image: 'gemini.png',
      currentPrice: 7000,
      oldPrice: 20000,
      stock: 20
    },
    alightProd || {
      id: 'alight-motion',
      name: 'Alight Motion Pro',
      category: 'produktivitas',
      image: 'alightmotion.png',
      currentPrice: 3000,
      oldPrice: 15000,
      stock: 10
    },
    viuProd || {
      id: 'viu-prem',
      name: 'VIU Premium',
      category: 'streaming',
      image: 'viu.png',
      currentPrice: 3000,
      oldPrice: 10000,
      stock: 2000
    },
    {
      id: 'topup-mlbb',
      name: 'Top Up Mobile Legends (36 Paket)',
      category: 'topup',
      image: 'mobilelegends.jpg',
      currentPrice: 5000,
      oldPrice: 8000,
      stock: 99,
      isTopUp: true,
      isMlbbSpecial: true
    },
    {
      id: 'topup-robux',
      name: 'Top Up Robux (Roblox)',
      category: 'topup',
      image: 'roblox.png',
      currentPrice: 11000,
      oldPrice: 20000,
      stock: 99,
      isTopUp: true,
      isRobuxSpecial: true
    },
    {
      id: 'topup-steam',
      name: 'Top Up Steam (Key Game)',
      category: 'steam',
      image: 'steam.png',
      currentPrice: 1500,
      oldPrice: 5000,
      stock: 50,
      isTopUp: true,
      isSteamSpecial: true
    }
  ];

  const handleItemClick = (prod) => {
    if (prod.isMlbbSpecial) {
      if (onSwitchTab) onSwitchTab('mlbb');
    } else if (prod.isSteamSpecial) {
      if (onSwitchTab) onSwitchTab('steam');
    } else if (prod.isRobuxSpecial) {
      if (onSwitchTab) onSwitchTab('roblox');
    } else {
      if (onOpenProductModal) onOpenProductModal(prod);
    }
  };

  return (
    <section className="itemku-flash-section">
      <div className="container">
        <div className="itemku-flash-header">
          <div className="itemku-flash-title-wrap">
            <div className="itemku-flash-tag">
              <i className="fa-solid fa-fire"></i>
              <span>REKOMENDASI SALE</span>
            </div>
            <h3 className="itemku-flash-title">Termurah Hari Ini di ChaizStore</h3>
          </div>

          <div className="itemku-flash-nav-controls">
            <button
              type="button"
              className="btn-flash-nav prev"
              onClick={() => handleScroll('left')}
              title="Geser ke kiri"
              aria-label="Geser ke kiri"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <button
              type="button"
              className="btn-flash-nav next"
              onClick={() => handleScroll('right')}
              title="Geser ke kanan"
              aria-label="Geser ke kanan"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>

        <div className="itemku-flash-grid-wrap">
          <button
            type="button"
            className="flash-float-arrow prev"
            onClick={() => handleScroll('left')}
            aria-label="Geser ke kiri"
            title="Geser ke kiri"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>

          <div className="itemku-flash-grid" ref={gridRef}>
            {flashProducts.map((prod) => {
              const discountPct = prod.oldPrice && prod.currentPrice
                ? Math.round(((prod.oldPrice - prod.currentPrice) / prod.oldPrice) * 100)
                : 35;

              return (
                <div
                  key={prod.id}
                  className="itemku-flash-card"
                  onClick={() => handleItemClick(prod)}
                >
                  <div className="itemku-flash-thumb-wrap">
                    {prod.image ? (
                      <img
                        src={`/${prod.image}`}
                        alt={prod.name}
                        className="itemku-flash-thumb"
                        loading="lazy"
                      />
                    ) : (
                      <div className="itemku-flash-thumb-placeholder">
                        <i className={prod.icon || 'fa-solid fa-gem'}></i>
                      </div>
                    )}

                    <span className="itemku-discount-badge">
                      -{discountPct}%
                    </span>

                    <span className="itemku-instant-tag">
                      <i className="fa-solid fa-bolt"></i> {prod.isTopUp ? 'Kilat' : 'Instan'}
                    </span>
                  </div>

                  <div className="itemku-flash-body">
                    <span className="itemku-flash-cat">{(prod.category || 'PRODUK').toUpperCase()}</span>
                    <h4 className="itemku-flash-name" title={prod.name}>
                      {prod.name}
                    </h4>

                    <div className="itemku-flash-merchant">
                      <i className="fa-solid fa-shield-halved text-success"></i>
                      <span>ChaizStore Official</span>
                    </div>

                    <div className="itemku-flash-price-wrap">
                      {prod.oldPrice && (
                        <span className="itemku-flash-old-price">
                          {formatRupiah(prod.oldPrice)}
                        </span>
                      )}
                      <span className="itemku-flash-curr-price">
                        {formatRupiah(prod.currentPrice)}
                      </span>
                    </div>

                    {/* Sold indicator bar */}
                    <div className="itemku-sold-bar-wrap">
                      <div className="itemku-sold-bar">
                        <div
                          className="itemku-sold-progress"
                          style={{ width: `${Math.min(92, 40 + (prod.stock || 2) * 5)}%` }}
                        ></div>
                      </div>
                      <span className="itemku-sold-text">
                        <i className="fa-solid fa-fire text-orange"></i> Sisa {prod.stock || 5} stok
                      </span>
                    </div>

                    {/* Tombol Beli / Top Up */}
                    <button
                      type="button"
                      className="btn-itemku-flash-buy"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(prod);
                      }}
                      title={prod.isTopUp ? 'Top Up Sekarang' : 'Beli Sekarang'}
                    >
                      <i className={prod.isTopUp ? 'fa-solid fa-bolt' : 'fa-solid fa-cart-shopping'}></i>
                      <span>{prod.isTopUp ? 'Top Up' : 'Beli'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="flash-float-arrow next"
            onClick={() => handleScroll('right')}
            aria-label="Geser ke kanan"
            title="Geser ke kanan"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </section>
  );
}
