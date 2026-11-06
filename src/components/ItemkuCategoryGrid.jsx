import React from 'react';

export default function ItemkuCategoryGrid({
  onSelectCategory,
  onSwitchTab,
  onSelectProduct
}) {
  const categories = [
    {
      id: 'roblox',
      name: 'Roblox & Robux',
      badge: 'RATE TERMURAH',
      badgeColor: 'orange',
      image: '/roblox.png',
      action: () => onSwitchTab('roblox')
    },
    {
      id: 'steam',
      name: 'Steam Game & Key',
      badge: 'RESMI VALVE',
      badgeColor: 'blue',
      image: '/steam.png',
      action: () => onSwitchTab('steam')
    },
    {
      id: 'netflix',
      name: 'Netflix Premium 4K',
      badge: 'HOT SALE',
      badgeColor: 'red',
      image: '/netflix.png',
      action: () => {
        onSwitchTab('store');
        onSelectCategory('streaming', 'Netflix');
      }
    },
    {
      id: 'spotify',
      name: 'Spotify Premium',
      badge: 'BEBAS IKLAN',
      badgeColor: 'green',
      image: '/spotify.png',
      action: () => {
        onSwitchTab('store');
        onSelectCategory('musik', 'Spotify');
      }
    },
    {
      id: 'youtube',
      name: 'YouTube Premium',
      badge: 'NO ADS',
      badgeColor: 'red',
      image: '/youtube.png',
      action: () => {
        onSwitchTab('store');
        onSelectCategory('streaming', 'YouTube');
      }
    },
    {
      id: 'canva',
      name: 'Canva Pro Desain',
      badge: 'PRO TOOLS',
      badgeColor: 'cyan',
      image: '/canva.png',
      action: () => {
        onSwitchTab('store');
        onSelectCategory('produktivitas', 'Canva');
      }
    },
    {
      id: 'gemini',
      name: 'Gemini Advanced AI',
      badge: 'AI VIP',
      badgeColor: 'purple',
      image: '/gemini.png',
      action: () => {
        onSwitchTab('store');
        onSelectCategory('ai', 'Gemini');
      }
    },
    {
      id: 'vidio',
      name: 'Vidio Platinum',
      badge: 'EPL & FILM',
      badgeColor: 'red',
      image: '/vidio.png',
      action: () => {
        onSwitchTab('store');
        onSelectCategory('streaming', 'Vidio');
      }
    },
    {
      id: 'disney',
      name: 'Disney+ Hotstar',
      badge: 'ORIGINAL',
      badgeColor: 'blue',
      image: '/disney.png',
      action: () => {
        onSwitchTab('store');
        onSelectCategory('streaming', 'Disney');
      }
    },
    {
      id: 'topup',
      name: 'Top Up Game Kilat',
      badge: '1-3 MENIT',
      badgeColor: 'orange',
      image: '/chaizz.png',
      action: () => onSwitchTab('topup')
    },
    {
      id: 'capcut',
      name: 'CapCut Pro Editor',
      badge: 'VIP EDIT',
      badgeColor: 'cyan',
      image: '/capcut.png',
      action: () => {
        onSwitchTab('store');
        onSelectCategory('produktivitas', 'CapCut');
      }
    },
    {
      id: 'all',
      name: 'Semua Produk',
      badge: 'LENGKAP',
      badgeColor: 'blue',
      icon: 'fa-solid fa-shapes',
      action: () => {
        onSwitchTab('store');
        onSelectCategory('all', '');
      }
    }
  ];

  return (
    <section className="itemku-category-section">
      <div className="container">
        <div className="itemku-section-header">
          <div className="itemku-section-title">
            <span className="itemku-title-icon">
              <i className="fa-solid fa-fire text-orange"></i>
            </span>
            <h3>Kategori Populer & Produk Pilihan</h3>
          </div>
          <button
            type="button"
            className="itemku-see-all-link"
            onClick={() => {
              onSwitchTab('store');
              onSelectCategory('all', '');
              const el = document.getElementById('katalog');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span>Lihat Semua</span>
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>

        <div className="itemku-cat-grid">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="itemku-cat-card"
              onClick={cat.action}
              role="button"
              tabIndex={0}
              title={`Buka ${cat.name}`}
            >
              <div className="itemku-cat-icon-wrap">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="itemku-cat-img"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="itemku-cat-icon-fallback">
                    <i className={cat.icon || 'fa-solid fa-cubes'}></i>
                  </div>
                )}
                {cat.badge && (
                  <span className={`itemku-cat-badge badge-${cat.badgeColor}`}>
                    {cat.badge}
                  </span>
                )}
              </div>
              <span className="itemku-cat-name">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
