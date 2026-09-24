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
import CheckoutModal from './components/CheckoutModal';
import CartDrawer from './components/CartDrawer';
import LoginGateModal from './components/LoginGateModal';
import CsChatWidget from './components/CsChatWidget';
import ToastContainer from './components/ToastContainer';

import { PRODUCTS } from './data/products';

export default function App() {
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

  // Modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [checkoutData, setCheckoutData] = useState({
    isOpen: false,
    source: 'single', // 'single' | 'cart'
    items: []
  });

  // Check initial auth - show login gate if not logged in
  useEffect(() => {
    if (!authUser) {
      setIsLoginOpen(true);
    }
  }, []);

  // Save auth user
  const handleLoginSuccess = (user) => {
    setAuthUser(user);
    try {
      localStorage.setItem('chaiz_auth_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setAuthUser(null);
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
    const updated = [...cartItems, item];
    saveCart(updated);
    showToast(`${item.productName} (${item.durationName}) dimasukkan ke keranjang!`, 'fa-cart-plus');
  };

  const handleRemoveCartItem = (itemId) => {
    const updated = cartItems.filter((it) => it.id !== itemId);
    saveCart(updated);
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

    setTimeout(() => {
      const match = PRODUCTS.find((p) => {
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
  const handleProceedCheckoutFromModal = (singleItem) => {
    setCheckoutData({
      isOpen: true,
      source: 'single',
      items: [singleItem]
    });
  };

  const handleProceedCheckoutFromCart = () => {
    if (cartItems.length === 0) {
      showToast('Keranjang belanja Anda masih kosong!', 'fa-basket-shopping');
      return;
    }
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

  const handleOrderSuccess = (source) => {
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
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectSearchTag={(tag) => executeSearchAndPoint(tag)}
        onExecuteSearch={executeSearchAndPoint}
      />

      <main>
        <Hero />

        <ProductCatalog
          products={PRODUCTS}
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
      </main>

      <Footer
        onOpenLogin={() => setIsLoginOpen(true)}
        onShowToast={showToast}
      />

      {/* Product Selection Modal */}
      <ProductModal
        product={modalProduct}
        isOpen={!!modalProduct}
        onClose={() => setModalProduct(null)}
        onAddToCart={handleAddToCart}
        onProceedCheckout={handleProceedCheckoutFromModal}
      />

      {/* Checkout & Payment Modal */}
      <CheckoutModal
        isOpen={checkoutData.isOpen}
        source={checkoutData.source}
        items={checkoutData.items}
        authUser={authUser}
        onClose={() => setCheckoutData({ isOpen: false, source: 'single', items: [] })}
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
      <QuickSettingMenu />

      {/* Gemini AI Customer Service Chat Widget */}
      <CsChatWidget products={PRODUCTS} authUser={authUser} />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />
    </>
  );
}
