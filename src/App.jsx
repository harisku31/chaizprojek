import React, { useState, useEffect } from 'react';
import AnnouncementBar from './components/AnnouncementBar';
import IntroSplashScreen from './components/IntroSplashScreen';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ItemkuCategoryGrid from './components/ItemkuCategoryGrid';
import FlashDeals from './components/FlashDeals';
import ProductCatalog from './components/ProductCatalog';
import MobileBottomNav from './components/MobileBottomNav';
import HowToOrder from './components/HowToOrder';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import QuickSettingMenu from './components/QuickSettingMenu';
import CtaBanner from './components/CtaBanner';
import Footer from './components/Footer';
import ProductModal from './components/ProductModal';
import TopUpModal from './components/TopUpModal';
import TopUpPage from './components/TopUpPage';
import SteamPage from './components/SteamPage';
import RobloxPage from './components/RobloxPage';
import TransactionsPage from './components/TransactionsPage';
import TestimonialsPage from './components/TestimonialsPage';
import UserProfilePage from './components/UserProfilePage';
import CheckoutModal from './components/CheckoutModal';
import QrisPaymentPage from './components/QrisPaymentPage';
import CartDrawer from './components/CartDrawer';
import LoginGateModal from './components/LoginGateModal';
import InstallAppModal from './components/InstallAppModal';
import InstallAppBanner from './components/InstallAppBanner';
import CsChatWidget from './components/CsChatWidget';
import ToastContainer from './components/ToastContainer';
import BannedNoticeModal from './components/BannedNoticeModal';
import UnbannedNoticeModal from './components/UnbannedNoticeModal';
import OrderNotificationModal from './components/OrderNotificationModal';
import UserNoticeModal from './components/UserNoticeModal';
import {
  recordUserLogin,
  recordUserLogout,
  recordUserHeartbeat,
  setUserOffline,
  recordUserActivity,
  recordUserVisit,
  updateVisitHeartbeat,
  isUserBanned,
  getUserActiveNotice,
  respondToUserNotice,
  listenToUserNotice,
  getRegisteredUsers,
  saveRegisteredUsers
} from './utils/userTracker';

import {
  getDatabaseProducts,
  subscribeToProductChanges
} from './utils/productDatabase';
import {
  getUserKey,
  getUserTransactions,
  getRecentOrderIds,
  isOrderBelongsToSession,
  getActiveNotificationCount,
  syncUserTransactionsFromCloud,
  listenToUserTransactions
} from './utils/transactions';
import { listenToFirebase } from './utils/firebase';
import { syncUserToSql } from './utils/sqlApi';
import { subscribeUserSocket } from './utils/socketClient';
import { formatRupiah } from './utils/format';
import {
  playUserSuccessSound,
  playUserRejectSound,
  playUserNoticeSound,
  triggerNotificationVibrate,
  unlockAudio
} from './utils/audioNotification';

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

  // Theme Mode: 'light' | 'dark'
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('chaiz_theme');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('chaiz_theme', theme);
    } catch {}
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Active Order Notification Modal state (Kiriman Sukses / Ditolak dari Admin)
  const [activeOrderAlert, setActiveOrderAlert] = useState(null);
  const [autoOpenTrxId, setAutoOpenTrxId] = useState(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState(() => getActiveNotificationCount(authUser));

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState('all');
  const [highlightedProductId, setHighlightedProductId] = useState(null);

  // Active View Tab: 'store' (Akun Premium) | 'topup' (Top Up Center) | 'steam' (Menu Khusus Steam Key) | 'roblox' (Menu Robux) | 'transaksi' | 'testimoni' | 'profile' | 'pembayaran'
  const [activeTab, setActiveTab] = useState(() => {
    if (window.location.hash.startsWith('#pembayaran')) return 'pembayaran';
    if (window.location.hash === '#steam') return 'steam';
    if (window.location.hash === '#roblox') return 'roblox';
    if (window.location.hash === '#topup') return 'topup';
    if (window.location.hash === '#transaksi') return 'transaksi';
    if (window.location.hash === '#testimoni') return 'testimoni';
    if (window.location.hash === '#profile') return 'profile';
    return 'store';
  });

  // Intro Splash Screen State (Dinonaktifkan agar toko langsung terbuka instan seperti itemku.com)
  const [showIntro, setShowIntro] = useState(false);

  // Listen to hash change (back/forward button, links)
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.startsWith('#pembayaran')) {
        setActiveTab('pembayaran');
      } else if (window.location.hash === '#steam') {
        setActiveTab('steam');
      } else if (window.location.hash === '#roblox') {
        setActiveTab('roblox');
      } else if (window.location.hash === '#topup') {
        setActiveTab('topup');
      } else if (window.location.hash === '#transaksi') {
        setActiveTab('transaksi');
      } else if (window.location.hash === '#testimoni') {
        setActiveTab('testimoni');
      } else if (window.location.hash === '#profile') {
        setActiveTab('profile');
      } else {
        setActiveTab('store');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSwitchTab = (tab, extraParams = null) => {
    setActiveTab(tab);
    if (tab === 'pembayaran') {
      const hashStr = extraParams ? `pembayaran?${extraParams}` : 'pembayaran';
      if (!window.location.hash.startsWith('#pembayaran')) {
        window.location.hash = hashStr;
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (authUser) {
        recordUserActivity(authUser, 'VIEW_PAYMENT', 'Membuka Halaman Pembayaran Gateway');
      }
    } else if (tab === 'steam') {
      if (window.location.hash !== '#steam') {
        window.location.hash = 'steam';
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (authUser) {
        recordUserActivity(authUser, 'VIEW_STEAM', 'Membuka menu Steam Key Game Resmi');
      }
    } else if (tab === 'roblox') {
      if (window.location.hash !== '#roblox') {
        window.location.hash = 'roblox';
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (authUser) {
        recordUserActivity(authUser, 'VIEW_ROBLOX', 'Membuka menu Robux Roblox');
      }
    } else if (tab === 'topup') {
      if (window.location.hash !== '#topup') {
        window.location.hash = 'topup';
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (authUser) {
        recordUserActivity(authUser, 'VIEW_TOPUP', 'Membuka menu Top Up Akun & Games');
      }
    } else if (tab === 'transaksi') {
      if (window.location.hash !== '#transaksi') {
        window.location.hash = 'transaksi';
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'testimoni') {
      if (window.location.hash !== '#testimoni') {
        window.location.hash = 'testimoni';
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (authUser) {
        recordUserActivity(authUser, 'VIEW_TESTIMONIALS', 'Membuka Halaman Testimoni & Kritik');
      }
    } else if (tab === 'profile') {
      if (window.location.hash !== '#profile') {
        window.location.hash = 'profile';
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (authUser) {
        recordUserActivity(authUser, 'VIEW_PROFILE', 'Membuka Halaman Profil Pengguna');
      }
    } else {
      if (
        window.location.hash.startsWith('#pembayaran') ||
        window.location.hash === '#topup' ||
        window.location.hash === '#steam' ||
        window.location.hash === '#roblox' ||
        window.location.hash === '#profile' ||
        window.location.hash === '#testimoni' ||
        window.location.hash === '#transaksi'
      ) {
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
  const [activeUserNotice, setActiveUserNotice] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [unbannedNoticeData, setUnbannedNoticeData] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [checkoutData, setCheckoutData] = useState({
    isOpen: false,
    source: 'single', // 'single' | 'cart'
    items: [],
    initialVoucher: null
  });

  // Check banned strictly via real-time validator (never trapped by stale state)
  const isCurrentBanned = Boolean(authUser && isUserBanned(authUser).isBanned);

  // Check initial auth & verify banned / unbanned status (TIDAK memaksa login di awal agar pengunjung bebas explore katalog)
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

    // Pengunjung baru dibiarkan masuk & menjelajahi katalog bebas. Login hanya diminta saat memilih/checkout produk.
    if (authUser) {
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

    // Lacak kunjungan awal pengunjung (baik tamu belum login maupun pengguna login di ponsel/laptop)
    try {
      const visitorId = localStorage.getItem('chaiz_visitor_id') || `vis_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      localStorage.setItem('chaiz_visitor_id', visitorId);

      const target = authUser || {
        id: visitorId,
        userId: visitorId,
        name: 'Pengunjung Toko',
        email: 'pengunjung@chaizstore.id'
      };
      recordUserVisit(target, 'Membuka beranda toko ChaizStore');
    } catch (e) {}
  }, []);

  // Heartbeat & Presence tracking (Sedang Online vs Offline & Auto-detect ban / unban)
  useEffect(() => {
    if (!authUser) return;

    recordUserHeartbeat(authUser);
    recordUserVisit(authUser, 'Membuka beranda toko ChaizStore');
    updateVisitHeartbeat(authUser);

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
    recordUserVisit(authUser, 'Membuka beranda toko ChaizStore');
    updateVisitHeartbeat(authUser);
      }
    }, 8000);

    const handleBeforeUnload = () => {
      setUserOffline(authUser);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setUserOffline(authUser);
      } else if (document.visibilityState === 'visible') {
        recordUserHeartbeat(authUser);
        updateVisitHeartbeat(authUser);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      clearInterval(hbInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [authUser, bannedInfo, isBannedModalOpen]);

  // Realtime Listener for Admin Official Notices (Catatan Khusus Admin & Tombol Continue)
  useEffect(() => {
    // 1. Initial check on mount / auth change
    if (authUser) {
      const pendingNotice = getUserActiveNotice(authUser);
      if (pendingNotice) {
        setActiveUserNotice(pendingNotice);
        playUserNoticeSound();
      }
    }

    // 2. Realtime listener via Firebase RTDB
    const unsubNotice = authUser
      ? listenToUserNotice(authUser, (notice) => {
          if (notice && notice.status === 'pending') {
            setActiveUserNotice(notice);
            playUserNoticeSound();
          }
        })
      : () => {};

    // 3. Realtime listener via BroadcastChannel
    let noticeBc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        noticeBc = new BroadcastChannel('chaiz_admin_sync');
        noticeBc.onmessage = (ev) => {
          if (ev.data?.type === 'USER_NOTICE_SENT') {
            const notice = ev.data?.notice;
            if (notice && notice.status === 'pending') {
              const myEmail = (authUser?.email || '').toLowerCase().trim();
              const myId = authUser?.id || '';
              const targetEmail = (notice.targetEmail || '').toLowerCase().trim();
              const targetId = notice.targetUserId || '';
              if (
                (myEmail && targetEmail && myEmail === targetEmail) ||
                (myId && targetId && myId === targetId)
              ) {
                setActiveUserNotice(notice);
                playUserNoticeSound();
              }
            }
          }
        };
      }
    } catch (e) {}

    return () => {
      if (unsubNotice) unsubNotice();
      if (noticeBc) noticeBc.close();
    };
  }, [authUser]);

  // Handle User clicking "Continue" on the Admin Notice Modal
  const handleContinueNotice = () => {
    if (activeUserNotice) {
      respondToUserNotice(
        activeUserNotice.id,
        authUser || { id: activeUserNotice.targetUserId, email: activeUserNotice.targetEmail }
      );
      setActiveUserNotice(null);
      playUserNoticeSound();
      showToast('Terima kasih! Respon Anda telah terkirim ke Admin.', 'fa-circle-check text-success');
    }
  };

  // Realtime Order & Notification Watcher (Memantau respon Admin secara instan via Firebase RTDB, BroadcastChannel & Storage)
  useEffect(() => {
    // A. Muat riwayat status yang sudah pernah dinotifikasikan dari localStorage
    const getNotifiedMap = () => {
      try {
        const raw = localStorage.getItem('chaiz_notified_orders');
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    };

    const saveNotifiedMap = (map) => {
      try {
        localStorage.setItem('chaiz_notified_orders', JSON.stringify(map));
      } catch {}
    };

    const notifiedMap = getNotifiedMap();
    const knownStatuses = { ...notifiedMap };

    // Sinkronkan hitungan badge awal
    const updateBadge = () => {
      setUnreadNotifCount(getActiveNotificationCount(authUser));
    };
    updateBadge();

    // Handler pusat saat terdeteksi update status pesanan dari Admin
    const handleOrderStatusChange = (trx, source = 'unknown') => {
      if (!trx || !trx.id) return;
      // Cek apakah pesanan ini milik user atau dibuat di perangkat ini
      if (!isOrderBelongsToSession(trx, authUser)) return;

      const id = trx.id;
      const currentStatus = trx.status;

      // Simpan status terbaru
      knownStatuses[id] = currentStatus;

      // Jika status adalah 'completed' dan belum pernah dinotifikasi untuk status ini
      if (currentStatus === 'completed' && notifiedMap[id] !== 'completed') {
        notifiedMap[id] = 'completed';
        saveNotifiedMap(notifiedMap);

        // WAJIB: Bunyikan suara kemenangan sukses & getarkan ponsel
        playUserSuccessSound();
        triggerNotificationVibrate('success');

        // Tampilkan popup notifikasi dialog kiriman admin
        setActiveOrderAlert(trx);

        // Tampilkan toast notifikasi
        showToast(
          `🎉 Pesanan #${id} (${trx.productName}) telah SELESAI diproses Admin! Akun Anda sudah siap.`,
          'fa-circle-check text-success',
          'success'
        );

        updateBadge();
      } else if (currentStatus === 'rejected' && notifiedMap[id] !== 'rejected') {
        notifiedMap[id] = 'rejected';
        saveNotifiedMap(notifiedMap);

        // WAJIB: Bunyikan nada peringatan penolakan
        playUserRejectSound();
        triggerNotificationVibrate('rejected');

        // Tampilkan popup notifikasi dialog penolakan admin
        setActiveOrderAlert(trx);

        // Tampilkan toast
        showToast(
          `⚠️ Pesanan #${id} (${trx.productName}) DITOLAK Admin: ${trx.rejectReason || trx.adminNote || 'Bukti transfer tidak valid'}`,
          'fa-circle-xmark text-danger',
          'warning'
        );

        updateBadge();
      }
    };

    // 1. Firebase RTDB Watcher & Socket.io: Langganan node privat user jika login
    let unsubscribeUserTrx = () => {};
    let unsubscribeSocketUser = () => {};
    if (authUser) {
      unsubscribeUserTrx = listenToUserTransactions(authUser, (userList) => {
        if (Array.isArray(userList)) {
          userList.forEach((trx) => handleOrderStatusChange(trx, 'firebase_user_trx'));
          updateBadge();
        }
      });
      const uKey = authUser.id || authUser.userId || (authUser.email ? getUserKey(authUser) : null);
      if (uKey) {
        unsubscribeSocketUser = subscribeUserSocket(uKey, {
          onOrderUpdated: (updatedTrx) => {
            if (updatedTrx) {
              handleOrderStatusChange(updatedTrx, 'socket_user_trx');
              updateBadge();
            }
          }
        });
      }
    }

    // 2. Firebase RTDB Watcher: Langganan langsung ke ID pesanan yang masih 'processing'
    const unsubsOrders = [];
    const recentIds = getRecentOrderIds();
    recentIds.slice(0, 15).forEach((orderId) => {
      if (notifiedMap[orderId] === 'completed' || notifiedMap[orderId] === 'rejected') return;
      try {
        const unsub = listenToFirebase(`transactions/${orderId}`, (cloudTrx) => {
          if (cloudTrx && (cloudTrx.status === 'completed' || cloudTrx.status === 'rejected')) {
            handleOrderStatusChange(cloudTrx, 'firebase_single_trx');
          }
        });
        unsubsOrders.push(unsub);
      } catch (e) {}
    });

    // 3. BroadcastChannel Watcher (Lintas tab browser)
    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('chaiz_admin_sync');
        bc.onmessage = (ev) => {
          const type = ev.data?.type;
          if (type === 'DEPOSIT_APPROVED') {
            const myEmail = (authUser?.email || '').toLowerCase().trim();
            const myId = authUser?.id || '';
            const depEmail = (ev.data?.userEmail || '').toLowerCase().trim();
            const depId = ev.data?.userId || '';
            if ((myEmail && depEmail && myEmail === depEmail) || (myId && depId && myId === depId)) {
              setAuthUser((prev) => {
                if (!prev) return null;
                const clean = { ...prev, chaizMoney: ev.data.newBalance };
                try {
                  localStorage.setItem('chaiz_auth_user', JSON.stringify(clean));
                } catch (e) {}
                return clean;
              });
              playUserSuccessSound();
              showToast(`🎉 Deposit ChaizMoney sebesar ${formatRupiah(ev.data.creditedAmount)} berhasil disetujui Admin! Saldo sudah masuk.`, 'fa-wallet text-success');
            }
          }
          const updated = ev.data?.data?.updatedTrx || ev.data?.updatedTrx;
          if (updated && (type === 'TRANSACTION_FULFILLED' || type === 'TRANSACTION_REJECTED')) {
            handleOrderStatusChange(updated, 'broadcast_channel');
          } else {
            updateBadge();
          }
        };
      }
    } catch (e) {}

    // 4. Custom Window Events & Storage Events
    const handleTrxCustomEvent = (e) => {
      const type = e.detail?.type;
      const updated = e.detail?.data?.updatedTrx || e.detail?.updatedTrx;
      if (updated && (type === 'TRANSACTION_FULFILLED' || type === 'TRANSACTION_REJECTED')) {
        handleOrderStatusChange(updated, 'custom_event');
      } else {
        updateBadge();
      }
    };
    window.addEventListener('chaiz_trx_updated', handleTrxCustomEvent);
    window.addEventListener('chaiz_notifications_read', updateBadge);

    const handleStorage = (e) => {
      if (e.key === 'chaiz_transactions' || (e.key && e.key.startsWith('chaiz_user_trx_'))) {
        updateBadge();
      }
    };
    window.addEventListener('storage', handleStorage);

    // 5. Polling berkala (fallback setiap 8 detik) untuk memastikan zero-miss
    const pollTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (authUser) {
        syncUserTransactionsFromCloud(authUser).then((fresh) => {
          if (Array.isArray(fresh)) {
            fresh.forEach((t) => handleOrderStatusChange(t, 'poll'));
          }
        }).catch(() => {});
      }
    }, 8000);

    return () => {
      unsubscribeUserTrx();
      unsubscribeSocketUser();
      unsubsOrders.forEach((fn) => {
        try { fn(); } catch {}
      });
      if (bc) bc.close();
      window.removeEventListener('chaiz_trx_updated', handleTrxCustomEvent);
      window.removeEventListener('chaiz_notifications_read', updateBadge);
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollTimer);
    };
  }, [authUser]);

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
    const cleanUser = {
      ...user,
      id: user.id || getUserKey(user),
      isBanned: false,
      banStatus: null
    };
    setAuthUser(cleanUser);
    try {
      localStorage.setItem('chaiz_auth_user', JSON.stringify(cleanUser));
    } catch (e) {
      console.error(e);
    }
    recordUserLogin(cleanUser);
    syncUserToSql(cleanUser).catch(() => {});

    // Jika ada tindakan tertunda saat memilih produk sebelum login, lanjutkan otomatis!
    if (pendingAction) {
      if (pendingAction.type === 'checkout_single') {
        const item = pendingAction.item;
        const voucher = pendingAction.voucher;
        setCheckoutData({
          isOpen: true,
          source: 'single',
          items: [item],
          initialVoucher: voucher
        });
        showToast(`Melanjutkan pembelian ${item.productName || item.name || 'produk'}...`, 'fa-bag-shopping text-cyan');
      } else if (pendingAction.type === 'add_to_cart') {
        const item = pendingAction.item;
        const updated = [...cartItems, item];
        saveCart(updated);
        showToast(`${item.productName} (${item.durationName}) dimasukkan ke keranjang!`, 'fa-cart-plus text-success');
      } else if (pendingAction.type === 'checkout_cart') {
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
      }
      setPendingAction(null);
    }

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
      localStorage.removeItem('chaiz_transactions');
    } catch (e) {
      console.error(e);
    }
    showToast('Anda telah keluar dari akun.', 'fa-right-from-bracket');
  };

  // Update profile user (username, whatsapp/phone, avatar picture, chaizMoney)
  const handleUpdateUser = (updatedFields) => {
    setAuthUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      try {
        localStorage.setItem('chaiz_auth_user', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save updated auth user:', e);
      }

      // Sync to registered users list in localStorage
      try {
        const users = getRegisteredUsers();
        const myKey = updated.id || getUserKey(updated);
        const myEmail = (updated.email || '').toLowerCase().trim();
        const idx = users.findIndex(
          (u) =>
            (myKey && (u.id === myKey || u.userId === myKey)) ||
            (myEmail && u.email && u.email.toLowerCase().trim() === myEmail)
        );
        if (idx !== -1) {
          users[idx] = { ...users[idx], ...updatedFields };
          saveRegisteredUsers(users);
        }
      } catch (e) {
        console.error('Failed to sync updated user to directory:', e);
      }

      // Sync to SQL & Firebase in background
      try {
        syncUserToSql(updated).catch(() => {});
      } catch (e) {}

      return updated;
    });
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

    // 2. Cek jika belum login: Simpan pilihan produk lalu buka modal login
    if (!authUser) {
      setPendingAction({
        type: 'add_to_cart',
        item: item
      });
      setIsLoginOpen(true);
      showToast('Silakan login terlebih dahulu untuk memasukkan produk ke keranjang!', 'fa-right-to-bracket text-warning');
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

    // 2. Cek jika belum login: Simpan pilihan produk lalu buka modal login
    if (!authUser) {
      setPendingAction({
        type: 'checkout_single',
        item: singleItem,
        voucher: initialVoucher || singleItem.appliedVoucher || null
      });
      setIsLoginOpen(true);
      showToast('Silakan login terlebih dahulu untuk melanjutkan pembelian!', 'fa-right-to-bracket text-warning');
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

    // 2. Cek jika belum login: Simpan intent checkout lalu buka modal login
    if (!authUser) {
      setPendingAction({
        type: 'checkout_cart'
      });
      setIsLoginOpen(true);
      showToast('Silakan login terlebih dahulu untuk melakukan checkout pesanan!', 'fa-right-to-bracket text-warning');
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

  const [activePaymentOrder, setActivePaymentOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('chaiz_active_payment');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const saveActivePaymentOrder = (order) => {
    setActivePaymentOrder(order);
    try {
      if (order) {
        localStorage.setItem('chaiz_active_payment', JSON.stringify(order));
      } else {
        localStorage.removeItem('chaiz_active_payment');
      }
    } catch {}
  };

  const handleProceedToPayment = (orderData) => {
    saveActivePaymentOrder(orderData);
    setCheckoutData({ isOpen: false, source: 'single', items: [], initialVoucher: null });
    const methodParam = orderData.subMethod || (orderData.paymentMethod && orderData.paymentMethod.toLowerCase().includes('gopay') ? 'gopay' : 'qris');
    const query = `trx=${orderData.id}&total=${orderData.amount || orderData.total}&method=${methodParam}`;
    handleSwitchTab('pembayaran', query);
  };

  return (
    <>
      {showIntro && (
        <IntroSplashScreen
          onFinish={() => setShowIntro(false)}
          minDurationMs={2000}
        />
      )}

      <AnnouncementBar
        onOpenInstall={() => setIsInstallModalOpen(true)}
        onOpenTesti={() => handleSwitchTab('testimoni')}
        onOpenFaq={() => {
          const el = document.getElementById('faq');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      <Navbar
        authUser={authUser}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenInstall={() => setIsInstallModalOpen(true)}
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
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Notifikasi Banner Pasang/Download Aplikasi (Dapat dilewati 1 hari) */}
      <InstallAppBanner onOpenInstall={() => setIsInstallModalOpen(true)} />

      <main>
        {activeTab === 'pembayaran' ? (
          <QrisPaymentPage
            order={activePaymentOrder}
            authUser={authUser}
            onCancel={() => {
              saveActivePaymentOrder(null);
              handleSwitchTab('store');
              showToast('Pembayaran dibatalkan', 'fa-circle-xmark');
            }}
            onSuccess={(completedOrder) => {
              saveActivePaymentOrder(null);
              handleOrderSuccess('checkout');
              handleSwitchTab('transaksi');
            }}
            onShowToast={showToast}
          />
        ) : activeTab === 'steam' ? (
          <SteamPage
            onBackToTopUp={() => handleSwitchTab('topup')}
            onBackToStore={() => handleSwitchTab('store')}
            onShowToast={showToast}
            authUser={authUser}
            isBanned={isCurrentBanned}
            onOpenLogin={() => setIsLoginOpen(true)}
            onOpenBannedModal={() => setIsBannedModalOpen(true)}
          />
        ) : activeTab === 'roblox' ? (
          <RobloxPage
            onBackToTopUp={() => handleSwitchTab('topup')}
            onBackToStore={() => handleSwitchTab('store')}
            onShowToast={showToast}
            authUser={authUser}
            isBanned={isCurrentBanned}
            onOpenLogin={() => setIsLoginOpen(true)}
            onOpenBannedModal={() => setIsBannedModalOpen(true)}
            onGoToTransactions={() => handleSwitchTab('transaksi')}
          />
        ) : activeTab === 'topup' ? (
          <TopUpPage
            onBackToStore={() => handleSwitchTab('store')}
            onOpenSteamMenu={() => handleSwitchTab('steam')}
            onOpenRobloxMenu={() => handleSwitchTab('roblox')}
            onShowToast={showToast}
            authUser={authUser}
            isBanned={isCurrentBanned}
            onOpenLogin={() => setIsLoginOpen(true)}
            onOpenBannedModal={() => setIsBannedModalOpen(true)}
          />
        ) : activeTab === 'transaksi' ? (
          <TransactionsPage
            key={authUser?.email || authUser?.id || 'guest'}
            onBackToStore={() => handleSwitchTab('store')}
            onShowToast={showToast}
            authUser={authUser}
            onOpenLogin={() => setIsLoginOpen(true)}
            autoOpenTrxId={autoOpenTrxId}
            onClearAutoOpenTrxId={() => setAutoOpenTrxId(null)}
          />
        ) : activeTab === 'testimoni' ? (
          <TestimonialsPage
            onBackToStore={() => handleSwitchTab('store')}
            onShowToast={showToast}
            authUser={authUser}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        ) : activeTab === 'profile' ? (
          <UserProfilePage
            authUser={authUser}
            onUpdateUser={handleUpdateUser}
            onBackToStore={() => handleSwitchTab('store')}
            onGoToTransactions={() => handleSwitchTab('transaksi')}
            onOpenLogin={() => setIsLoginOpen(true)}
            onLogout={handleLogout}
            onShowToast={showToast}
          />
        ) : (
          <>
            <Hero onSwitchTab={handleSwitchTab} />

            {/* Menu Kategori Ikon Populer Ala Itemku */}
            <ItemkuCategoryGrid
              onSelectCategory={(catId, query) => {
                setCurrentCategory(catId);
                if (query) {
                  executeSearchAndPoint(query);
                } else {
                  const el = document.getElementById('katalog');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              onSwitchTab={handleSwitchTab}
            />

            {/* Promo Flash Deals Hari Ini Ala Itemku */}
            <FlashDeals
              products={products}
              onOpenProductModal={(prod) => setModalProduct(prod)}
              onSwitchTab={handleSwitchTab}
              onShowToast={showToast}
            />

            <ProductCatalog
              products={products}
              currentCategory={currentCategory}
              onCategoryChange={setCurrentCategory}
              searchQuery={searchQuery}
              onResetSearch={() => {
                setSearchQuery('');
                setCurrentCategory('all');
              }}
              onOpenProductModal={(prod) => {
                if (prod.isSteamSpecial) {
                  handleSwitchTab('steam');
                } else {
                  setModalProduct(prod);
                }
              }}
              onOpenSteamMenu={() => handleSwitchTab('steam')}
              onShowToast={showToast}
              highlightedProductId={highlightedProductId}
              activeTab={activeTab}
              onSwitchTab={handleSwitchTab}
            />

            <HowToOrder />
            <Testimonials onOpenAllReviews={() => handleSwitchTab('testimoni')} />
            <FAQ />
            <CtaBanner />
          </>
        )}
      </main>

      <Footer
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenInstall={() => setIsInstallModalOpen(true)}
        onOpenTestimonials={() => handleSwitchTab('testimoni')}
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
        onProceedToPayment={handleProceedToPayment}
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

      {/* Pasang Aplikasi Modal (PWA & APK Android) */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onShowToast={showToast}
      />

      {/* Menu Tombol Mengambang Setting di Atas CS: Cara Order, FAQ & Testimoni Pelanggan */}
      <QuickSettingMenu
        activeTab={activeTab}
        onSwitchTab={handleSwitchTab}
        onOpenTopUp={() => handleSwitchTab('topup')}
        onOpenInstall={() => setIsInstallModalOpen(true)}
        authUser={authUser}
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

      {/* Popup Dialog Kiriman Notifikasi Admin (Sukses / Ditolak) */}
      <OrderNotificationModal
        isOpen={Boolean(activeOrderAlert)}
        order={activeOrderAlert}
        onClose={() => setActiveOrderAlert(null)}
        onOpenOrderDetail={(order) => {
          setActiveOrderAlert(null);
          setAutoOpenTrxId(order?.id || null);
          handleSwitchTab('transaksi');
        }}
      />

      {/* Modal Catatan & Pengumuman Khusus dari Admin dengan Tombol Continue */}
      <UserNoticeModal
        isOpen={Boolean(activeUserNotice)}
        notice={activeUserNotice}
        onContinue={handleContinueNotice}
      />

      {/* Itemku Mobile Bottom Navigation Bar (Khusus Tampilan HP / Mobile) */}
      <MobileBottomNav
        activeTab={activeTab}
        onSwitchTab={handleSwitchTab}
        cartCount={cartItems.length}
        onOpenCart={handleOpenCart}
        authUser={authUser}
        onOpenLogin={() => setIsLoginOpen(true)}
      />
    </>
  );
}
