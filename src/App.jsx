import React, { useState, useEffect } from 'react';
import AnnouncementBar from './components/AnnouncementBar';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductCatalog from './components/ProductCatalog';
import HowToOrder from './components/HowToOrder';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import QuickSettingMenu from './components/QuickSettingMenu';
import CtaBanner from './components/CtaBanner';
import Footer from './components/Footer';
import ProductModal from './components/ProductModal';
import TopUpModal from './components/TopUpModal';
import TopUpPage from './components/TopUpPage';
import TransactionsPage from './components/TransactionsPage';
import CheckoutModal from './components/CheckoutModal';
import CartDrawer from './components/CartDrawer';
import LoginGateModal from './components/LoginGateModal';
import CsChatWidget from './components/CsChatWidget';
import ToastContainer from './components/ToastContainer';
import BannedNoticeModal from './components/BannedNoticeModal';
import UnbannedNoticeModal from './components/UnbannedNoticeModal';
import {
  recordUserLogin,
  recordUserLogout,
  recordUserHeartbeat,
  setUserOffline,
  recordUserActivity,
  isUserBanned
} from './utils/userTracker';

import {
  getDatabaseProducts,
  subscribeToProductChanges
} from './utils/productDatabase';

export default function App() {
  // Product Database & Realtime Stock State
  const [products, setProducts] = useState(() => getDatabaseProducts());

  // Listen for realtime product & stock changes from Admin Gudang
  useEffect(() => {
    const unsubscribe = subscribeToProductChanges((updatedProducts) => {
      setProducts(updatedProducts);
    });
    return unsubscribe;
  }, []);

  // Auth state
  const [authUser, setAuthUser] = useState(() => {
    try {
      const saved = localStorage.getItem('chaiz_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Cart state
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('chaiz_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState('all');
  const [highlightedProductId, setHighlightedProductId] = useState(null);

  // Active View Tab: 'store' (Akun Premium) | 'topup' (Halaman Baru Khusus Top Up)
  const [activeTab, setActiveTab] = useState(() => {
    return window.location.hash === '#topup' ? 'topup' : 'store';
  });

  // Listen to hash change (back/forward button, links)
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#topup') {
        setActiveTab('topup');
      } else {
        setActiveTab('store');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSwitchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'topup') {
      if (window.location.hash !== '#topup') {
        window.location.hash = 'topup';
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (authUser) {
        recordUserActivity(authUser, 'VIEW_TOPUP', 'Membuka menu Top Up Steam Wallet');
      }
    } else {
      if (window.location.hash === '#topup') {
        history.pushState('', document.title, window.location.pathname + window.location.search);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (authUser) {
        recordUserActivity(authUser, 'VIEW_PRODUCTS', 'Menjelajahi katalog Akun Premium');
      }
    }
  };

  // Modals & Banned Status
  const [bannedInfo, setBannedInfo] = useState(null);
  const [isBannedModalOpen, setIsBannedModalOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [unbannedNoticeData, setUnbannedNoticeData] = useState(null);
  const [checkoutData, setCheckoutData] = useState({
    isOpen: false,
    source: 'single', // 'single' | 'cart'
    items: [],
    initialVoucher: null
  });

  // Check banned strictly via real-time validator (never trapped by stale state)
  const isCurrentBanned = Boolean(authUser && isUserBanned(authUser).isBanned);

  // Check initial auth - show login gate if not logged in & verify banned / unbanned status
  useEffect(() => {
    // 1. Cek jika ada catatan pemulihan akun (unbanned notice) dari admin
    try {
      const rawNotice = localStorage.getItem('chaiz_last_unbanned_notice');
      if (rawNotice) {
        const noticeObj = JSON.parse(rawNotice);
        const myEmail = (authUser?.email || '').toLowerCase().trim();
        const myId = authUser?.id || '';
        if (
          !authUser ||
          (noticeObj.email && myEmail === noticeObj.email.toLowerCase().trim()) ||
          (noticeObj.userId && myId === noticeObj.userId)
        ) {
          setUnbannedNoticeData(noticeObj);
          localStorage.removeItem('chaiz_last_unbanned_notice');
        }
      }
    } catch (e) {}

    if (!authUser) {
      setIsLoginOpen(true);
    } else {
      const banCheck = isUserBanned(authUser);
      if (banCheck.isBanned) {
        const bannedUser = { ...authUser, isBanned: true, banStatus: banCheck };
        setBannedInfo(banCheck);
        setAuthUser(bannedUser);
        setIsBannedModalOpen(true);
      } else {
        // Akun TIDAK di-banned! Bersihkan status sanksi lama
        setBannedInfo(null);
        setIsBannedModalOpen(false);
        if (authUser.isBanned) {
          const cleanUser = { ...authUser, isBanned: false, banStatus: null };
          setAuthUser(cleanUser);
          try {
            localStorage.setItem('chaiz_auth_user', JSON.stringify(cleanUser));
          } catch (e) {}
          setUnbannedNoticeData({ name: authUser.name || 'Pengguna' });
        }
        recordUserLogin(authUser);
      }
    }

    // Redirect to admin portal if hash is #admin
    if (window.location.hash === '#admin') {
      window.location.href = '/admin.html';
    }
  }, []);

  // Heartbeat & Presence tracking (Sedang Online vs Offline & Auto-detect ban / unban)
  useEffect(() => {
    if (!authUser) return;

    recordUserHeartbeat(authUser);

    // Instant cross-tab sync listener if admin bans or unbans user from admin portal
    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('chaiz_admin_sync');
        bc.onmessage = (ev) => {
          if (ev.data?.type === 'USER_BANNED') {
            const banCheck = isUserBanned(authUser);
            if (banCheck.isBanned) {
              const bannedUser = { ...authUser, isBanned: true, banStatus: banCheck };
              setBannedInfo(banCheck);
              setAuthUser(bannedUser);
              setIsBannedModalOpen(true);
              setIsLoginOpen(false);
              try {
                localStorage.setItem('chaiz_auth_user', JSON.stringify(bannedUser));
              } catch (e) {}
            }
          } else if (ev.data?.type === 'USER_UNBANNED') {
            const banCheck = isUserBanned(authUser);
            if (!banCheck.isBanned) {
              setBannedInfo(null);
              setIsBannedModalOpen(false);
              setAuthUser((prev) => {
                if (!prev) return null;
                const clean = { ...prev, isBanned: false, banStatus: null };
                try {
                  localStorage.setItem('chaiz_auth_user', JSON.stringify(clean));
                } catch (e) {}
                return clean;
              });
              setUnbannedNoticeData({ name: authUser?.name || 'Pengguna' });
              showToast('Akun Anda telah di-unban oleh Admin! Akses kembali aktif.', 'fa-circle-check text-success');
            }
          }
        };
      }
    } catch (e) {}

    const handleStorage = (e) => {
      if (
        e.key === 'chaiz_banned_users' ||
        e.key === 'chaiz_registered_users' ||
        e.key === 'chaiz_last_unbanned_notice'
      ) {
        const banCheck = isUserBanned(authUser);
        if (banCheck.isBanned) {
          const bannedUser = { ...authUser, isBanned: true, banStatus: banCheck };
          setBannedInfo(banCheck);
          setAuthUser(bannedUser);
          setIsBannedModalOpen(true);
          setIsLoginOpen(false);
          try {
            localStorage.setItem('chaiz_auth_user', JSON.stringify(bannedUser));
          } catch (err) {}
        } else {
          // Akun sudah di-unban
          if (bannedInfo?.isBanned || authUser?.isBanned || isBannedModalOpen) {
            setBannedInfo(null);
            setIsBannedModalOpen(false);
            setAuthUser((prev) => {
              if (!prev) return null;
              const clean = { ...prev, isBanned: false, banStatus: null };
              try {
                localStorage.setItem('chaiz_auth_user', JSON.stringify(clean));
              } catch (err) {}
              return clean;
            });
            setUnbannedNoticeData({ name: authUser?.name || 'Pengguna' });
            showToast('Akun Anda telah dipulihkan! Akses belanja aktif kembali.', 'fa-circle-check text-success');
          }
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    const hbInterval = setInterval(() => {
      const banCheck = isUserBanned(authUser);
      if (banCheck.isBanned) {
        const bannedUser = { ...authUser, isBanned: true, banStatus: banCheck };
        setBannedInfo(banCheck);
        setAuthUser(bannedUser);
        setIsBannedModalOpen(true);
        setIsLoginOpen(false);
        try {
          localStorage.setItem('chaiz_auth_user', JSON.stringify(bannedUser));
        } catch (e) {}
      } else {
        if (bannedInfo?.isBanned || authUser?.isBanned || isBannedModalOpen) {
          setBannedInfo(null);
          setIsBannedModalOpen(false);
          setAuthUser((prev) => {
            if (!prev) return null;
            const clean = { ...prev, isBanned: false, banStatus: null };
            try {
              localStorage.setItem('chaiz_auth_user', JSON.stringify(clean));
            } catch (e) {}
            return clean;
          });
          setUnbannedNoticeData({ name: authUser?.name || 'Pengguna' });
        }
        recordUserHeartbeat(authUser);
      }
    }, 4000);

    const handleBeforeUnload = () => {
      setUserOffline(authUser);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      clearInterval(hbInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [authUser, bannedInfo, isBannedModalOpen]);

  // Save auth user & record login for admin dashboard monitoring
  const handleLoginSuccess = (user) => {
    // Check if user is banned
    const banCheck = isUserBanned(user);
    if (banCheck.isBanned) {
      const bannedUser = { ...user, isBanned: true, banStatus: banCheck };
      setBannedInfo(banCheck);
      setAuthUser(bannedUser);
      setIsBannedModalOpen(true);
      setIsLoginOpen(false);
      try {
        localStorage.setItem('chaiz_auth_user', JSON.stringify(bannedUser));
      } catch (e) {}
      return;
    }

    // Login normal & TIDAK di-banned
    setBannedInfo(null);
    setIsBannedModalOpen(false);
    const cleanUser = { ...user, isBanned: false, banStatus: null };
    setAuthUser(cleanUser);
    try {
      localStorage.setItem('chaiz_auth_user', JSON.stringify(cleanUser));
    } catch (e) {
      console.error(e);
    }
    recordUserLogin(cleanUser);

    // Cek jika akun ini baru saja di-unban, tampilkan jendela pemberitahuan!
    try {
      const rawNotice = localStorage.getItem('chaiz_last_unbanned_notice');
      if (rawNotice) {
        const noticeObj = JSON.parse(rawNotice);
        const myEmail = (user.email || '').toLowerCase().trim();
        if (noticeObj.email && noticeObj.email === myEmail) {
          setUnbannedNoticeData(noticeObj);
          localStorage.removeItem('chaiz_last_unbanned_notice');
        }
      }
    } catch (e) {}
  };

  const handleLogout = () => {
    if (authUser) {
      recordUserLogout(authUser);
    }
    setAuthUser(null);
    setBannedInfo(null);
    setIsBannedModalOpen(false);
    try {
      localStorage.removeItem('chaiz_auth_user');
    } catch (e) {
      console.error(e);
    }
    showToast('Anda telah keluar dari akun.', 'fa-right-from-bracket');
  };

  // Cart persistence
  const saveCart = (newCart) => {
    setCartItems(newCart);
    try {
      localStorage.setItem('chaiz_cart', JSON.stringify(newCart));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddToCart = (item) => {
    // 1. Cek jika akun terkena Banned: Tidak bisa akses apa-apa
    if (isCurrentBanned) {
      setIsBannedModalOpen(true);
      showToast('Akses Ditolak: Akun Anda sedang di-banned!', 'fa-ban text-danger');
      return;
    }

    // 2. Cek jika belum login: Munculkan modal login!
    if (!authUser) {
      setIsLoginOpen(true);
      showToast('Silakan login terlebih dahulu untuk memasukkan produk ke keranjang!', 'fa-right-to-bracket');
      return;
    }

    const updated = [...cartItems, item];
    saveCart(updated);
    recordUserActivity(authUser, 'ADD_TO_CART', `Menambahkan ${item.productName} (${item.durationName}) ke keranjang`);
    showToast(`${item.productName} (${item.durationName}) dimasukkan ke keranjang!`, 'fa-cart-plus');
  };

  const handleRemoveCartItem = (itemId) => {
    const target = cartItems.find((it) => it.id === itemId);
    const updated = cartItems.filter((it) => it.id !== itemId);
    saveCart(updated);
    if (authUser) {
      recordUserActivity(authUser, 'REMOVE_CART', `Menghapus ${target?.productName || 'produk'} dari keranjang`);
    }
    showToast('Item dihapus dari keranjang', 'fa-trash-can');
  };

  // Toast helper
  const showToast = (message, icon = 'fa-circle-check') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, icon }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Search & point execution
  const executeSearchAndPoint = (query) => {
    if (!query || !query.trim()) {
      showToast('Silakan ketik nama akun yang ingin dicari', 'fa-magnifying-glass');
      return;
    }
    const q = query.trim().toLowerCase();
    setSearchQuery(q);
    setCurrentCategory('all');

    if (activeTab !== 'store') {
      setActiveTab('store');
      if (window.location.hash === '#topup') {
        history.pushState('', document.title, window.location.pathname + window.location.search);
      }
    }

    setTimeout(() => {
      const match = products.find((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.badge && p.badge.toLowerCase().includes(q)) ||
          p.features.some((f) => f.toLowerCase().includes(q)) ||
          p.durations.some((d) => d.name.toLowerCase().includes(q))
        );
      });

      if (match) {
        setHighlightedProductId(match.id);
        const el = document.getElementById(`product-card-${match.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setTimeout(() => {
          setHighlightedProductId(null);
        }, 3600);
      } else {
        showToast(`Akun "${query}" belum tersedia di katalog`, 'fa-circle-question');
      }
    }, 150);
  };

  // Checkout handlers
  const handleProceedCheckoutFromModal = (singleItem, initialVoucher = null) => {
    // 1. Cek jika akun terkena Banned
    if (isCurrentBanned) {
      setIsBannedModalOpen(true);
      showToast('Akses Ditolak: Akun Anda sedang di-banned!', 'fa-ban text-danger');
      return;
    }

    // 2. Cek jika belum login: Harus login dahulu!
    if (!authUser) {
      setIsLoginOpen(true);
      showToast('Silakan login terlebih dahulu untuk melakukan pembelian!', 'fa-right-to-bracket');
      return;
    }

    recordUserActivity(authUser, 'OPEN_CHECKOUT', `Membuka pembayaran beli ${singleItem.productName || singleItem.name || 'produk'}`);
    setCheckoutData({
      isOpen: true,
      source: 'single',
      items: [singleItem],
      initialVoucher: initialVoucher || singleItem.appliedVoucher || null
    });
  };

  const handleProceedCheckoutFromCart = () => {
    // 1. Cek jika akun terkena Banned
    if (isCurrentBanned) {
      setIsBannedModalOpen(true);
      showToast('Akses Ditolak: Akun Anda sedang di-banned!', 'fa-ban text-danger');
      return;
    }

    // 2. Cek jika belum login: Harus login dahulu!
    if (!authUser) {
      setIsLoginOpen(true);
      showToast('Silakan login terlebih dahulu untuk melakukan checkout pesanan!', 'fa-right-to-bracket');
      return;
    }

    if (cartItems.length === 0) {
      showToast('Keranjang belanja Anda masih kosong!', 'fa-basket-shopping');
      return;
    }
    recordUserActivity(authUser, 'OPEN_CHECKOUT', `Membuka checkout keranjang (${cartItems.length} produk)`);
    const formatted = cartItems.map((it) => ({
      name: it.productName,
      duration: it.durationName,
      via: it.viaType,
      price: it.price,
      qty: 1,
      total: it.price
    }));
    setIsCartOpen(false);
    setCheckoutData({
      isOpen: true,
      source: 'cart',
      items: formatted
    });
  };

  const handleOpenCart = () => {
    if (isCurrentBanned) {
      setIsBannedModalOpen(true);
      showToast('Akses Ditolak: Akun Anda sedang di-banned, tidak bisa mengakses keranjang!', 'fa-ban text-danger');
      return;
    }
    setIsCartOpen(true);
  };

  const handleOrderSuccess = (source) => {
    if (authUser) {
      recordUserActivity(authUser, 'SUBMIT_ORDER', 'Berhasil memproses pesanan belanja');
    }
    if (source === 'cart') {
      saveCart([]);
    }
  };

  return (
    <>
      <AnnouncementBar />

      <Navbar
        authUser={authUser}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginOpen(true)}
        cartCount={cartItems.length}
        onOpenCart={handleOpenCart}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectSearchTag={(tag) => executeSearchAndPoint(tag)}
        onExecuteSearch={executeSearchAndPoint}
        onOpenTopUp={() => handleSwitchTab('topup')}
        activeTab={activeTab}
        onSwitchTab={handleSwitchTab}
        isBanned={isCurrentBanned}
      />

      <main>
        {activeTab === 'topup' ? (
          <TopUpPage
            onBackToStore={() => handleSwitchTab('store')}
            onShowToast={showToast}
            authUser={authUser}
            isBanned={isCurrentBanned}
            onOpenLogin={() => setIsLoginOpen(true)}
            onOpenBannedModal={() => setIsBannedModalOpen(true)}
          />
        ) : activeTab === 'transaksi' ? (
          <TransactionsPage
            onBackToStore={() => handleSwitchTab('store')}
            onShowToast={showToast}
            authUser={authUser}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        ) : (
          <>
            <Hero />

            <ProductCatalog
              products={products}
              currentCategory={currentCategory}
              onCategoryChange={setCurrentCategory}
              searchQuery={searchQuery}
              onResetSearch={() => {
                setSearchQuery('');
                setCurrentCategory('all');
              }}
              onOpenProductModal={(prod) => setModalProduct(prod)}
              onShowToast={showToast}
              highlightedProductId={highlightedProductId}
            />

            <HowToOrder />
            <Testimonials />
            <FAQ />
            <CtaBanner />
          </>
        )}
      </main>

      <Footer
        onOpenLogin={() => setIsLoginOpen(true)}
        onShowToast={showToast}
      />

      {/* Product Selection Modal */}
      <ProductModal
        product={modalProduct ? (products.find((p) => p.id === modalProduct.id) || modalProduct) : null}
        isOpen={!!modalProduct}
        onClose={() => setModalProduct(null)}
        onAddToCart={handleAddToCart}
        onProceedCheckout={handleProceedCheckoutFromModal}
        onShowToast={showToast}
      />

      {/* Checkout & Payment Modal */}
      <CheckoutModal
        isOpen={checkoutData.isOpen}
        source={checkoutData.source}
        items={checkoutData.items}
        initialVoucher={checkoutData.initialVoucher}
        authUser={authUser}
        onClose={() => setCheckoutData({ isOpen: false, source: 'single', items: [], initialVoucher: null })}
        onOrderSuccess={handleOrderSuccess}
        onShowToast={showToast}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={handleProceedCheckoutFromCart}
      />

      {/* Login Gate Modal */}
      <LoginGateModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onShowToast={showToast}
      />

      {/* Menu Tombol Mengambang Setting di Atas CS: Cara Order, FAQ & Testimoni Pelanggan */}
      <QuickSettingMenu
        activeTab={activeTab}
        onSwitchTab={handleSwitchTab}
        onOpenTopUp={() => handleSwitchTab('topup')}
      />

      {/* Top Up Game & E-Wallet Modal */}
      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onShowToast={showToast}
        authUser={authUser}
        isBanned={isCurrentBanned}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenBannedModal={() => setIsBannedModalOpen(true)}
      />

      {/* Gemini AI Customer Service Chat Widget */}
      <CsChatWidget
        products={products}
        authUser={authUser}
        cartItems={cartItems}
        onShowToast={showToast}
        isBanned={isCurrentBanned}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenBannedModal={() => setIsBannedModalOpen(true)}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />

      {/* Banned Sanksi Notice Modal */}
      <BannedNoticeModal
        banInfo={isBannedModalOpen ? bannedInfo : null}
        onClose={() => setIsBannedModalOpen(false)}
        onLogout={handleLogout}
      />

      {/* Unbanned Notice Modal: Akun Anda Tidak Di-banned Lagi */}
      <UnbannedNoticeModal
        isOpen={Boolean(unbannedNoticeData)}
        userName={unbannedNoticeData?.name || authUser?.name}
        onClose={() => setUnbannedNoticeData(null)}
      />
    </>
  );
}
