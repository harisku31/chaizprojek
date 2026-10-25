import React, { useState, useEffect, useMemo } from 'react';
import {
  getRegisteredUsers,
  getActivityLogs,
  getUserLogs,
  isUserOnline,
  deleteUserFromDirectory,
  clearAllUsersDirectory,
  deleteActivityLog,
  clearAllActivityLogs,
  banUser,
  unbanUser,
  getAdminCredentials,
  updateAdminCredentials,
  getAdminSession,
  saveAdminSession,
  clearAdminSession,
  seedDemoUsersAndActivities,
  recordUserLogin,
  recordUserActivity
} from '../utils/userTracker';
import {
  getDatabaseProducts,
  getDatabaseProductById,
  addAccountToProduct,
  deleteAccountFromProduct,
  updateStockManuality,
  deductProductStock,
  subscribeToProductChanges
} from '../utils/productDatabase';
import {
  getTransactions,
  fulfillTransaction,
  rejectTransaction,
  deleteTransactionProof,
  getProofTimeRemaining,
  clearAllTransactions,
  syncTransactionsFromCloud,
  listenToAllTransactions
} from '../utils/transactions';
import { compressImageFile } from '../utils/format';
import { playAdminOrderSound, isSoundEnabled, setSoundEnabled } from '../utils/audioNotification';

// Helper: Bersihkan nomor HP untuk format WhatsApp internasional (62xxxx)
const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
};

// Safe String Trim Helper: Mencegah TypeError jika data bertipe number/null/undefined
const sTrim = (val) => {
  if (val === null || val === undefined) return '';
  return String(val).trim();
};

// Helper: Format pesan WhatsApp kredensial pesanan berdasarkan 4 Mode:
// 1. note_only: Kirim Catatan Saja
// 2. premium_account: Kirim Akun Premium (Nama Akun, Password, Profile, PIN, Durasi, Garansi)
// 3. voucher: Kirim Voucer (Code Voucer, Catatan)
// 4. topup: Kirim Top Up (Nama Akun, Nama Gmail Otomatis, Catatan)
// Aturan: Hanya field yang diisi yang akan disertakan!
const formatWhatsAppFulfillMessage = (order, mode = 'premium_account', data = {}, adminNote = '') => {
  if (!order) return '';
  const customerName = sTrim(order.customerName) || 'Kak';
  const orderId = order.id || '-';
  const productName = sTrim(order.productName) || 'Produk';
  const duration = sTrim(data.duration || order.productDuration);
  const warranty = sTrim(data.warranty || order.warrantyPeriod);
  const account = sTrim(data.account);
  const password = sTrim(data.password);
  const profile = sTrim(data.profile);
  const pin = sTrim(data.pin);
  const code = sTrim(data.code);

  // Ambil Gmail & Nomor WhatsApp pelanggan secara komprehensif
  const customerEmail = sTrim(
    data.email ||
    order.customerEmail ||
    order.userEmail ||
    order.email ||
    (mode === 'premium_account' ? data.account : '')
  );
  const customerPhone = sTrim(
    data.phone ||
    order.customerPhone ||
    order.phone ||
    order.wa
  );
  const customerUsername = sTrim(
    data.username ||
    order.customerUsername ||
    order.username
  );
  const note = sTrim(adminNote);

  const lines = [
    `Halo kak *${customerName}*! Salam dari *ChaizStore* ✨`,
    `Pesanan Anda telah selesai diproses oleh Admin. Berikut adalah rincian pesanan Anda:`,
    ``,
    `📦 *DETAIL PESANAN:*`,
    `• ID Pesanan: #${orderId}`,
    `• Produk: *${productName}*${duration ? ` (${duration})` : ''}`
  ];

  if (customerUsername && customerUsername !== '-') {
    lines.push(`• Username Roblox / ID: *${customerUsername}*`);
  }
  if (customerEmail && customerEmail !== '-') {
    lines.push(`• Nama Gmail Pelanggan: *${customerEmail}*`);
  }
  if (customerPhone && customerPhone !== '-') {
    lines.push(`• No. WhatsApp: *${customerPhone}*`);
  }
  if (duration) {
    lines.push(`• Durasi Paket: ${duration}`);
  }
  if (warranty) {
    lines.push(`• Garansi: ${warranty}`);
  }

  if (mode === 'note_only') {
    lines.push(``);
    if (note) {
      lines.push(`📝 *CATATAN / PANDUAN ADMIN:*`);
      lines.push(note);
      lines.push(``);
    }
  } else if (mode === 'premium_account') {
    lines.push(``);

    const credLines = [];
    if (account) {
      credLines.push(`• *Nama Akun / Gmail:* ${account}`);
    }
    if (password) {
      credLines.push(`• *Password:* ${password}`);
    }
    if (profile) {
      credLines.push(`• *Profile / Layar:* ${profile}`);
    }
    if (pin) {
      credLines.push(`• *PIN:* ${pin}`);
    }

    if (credLines.length > 0) {
      lines.push(`🔐 *DATA KREDENSIAL AKUN:*`);
      credLines.forEach((cl) => lines.push(cl));
      lines.push(``);
    }

    if (note) {
      lines.push(`📝 *CATATAN / PANDUAN PENGGUNA:*`);
      lines.push(note);
      lines.push(``);
    }
  } else if (mode === 'voucher') {
    lines.push(``);
    if (code) {
      lines.push(`🎟️ *KODE VOUCER:*`);
      lines.push(`• *Code Voucer:* ${code}`);
      lines.push(``);
    }
    if (note) {
      lines.push(`📝 *PANDUAN / CATATAN:*`);
      lines.push(note);
      lines.push(``);
    }
  } else if (mode === 'topup') {
    lines.push(``);
    const topupLines = [];
    if (account) {
      topupLines.push(`• *Nama Akun / Game ID:* ${account}`);
    }
    if (customerEmail && customerEmail !== '-') {
      topupLines.push(`• *Nama Gmail Pelanggan:* ${customerEmail}`);
    }
    if (topupLines.length > 0) {
      lines.push(`⚡ *DETAIL AKUN TOP UP:*`);
      topupLines.forEach((tl) => lines.push(tl));
      lines.push(``);
    }
    if (note) {
      lines.push(`📝 *CATATAN:*`);
      lines.push(note);
      lines.push(``);
    }
  }

  if (data.adminProofUrl || data.hasAdminProof) {
    lines.push(`📸 *FOTO BUKTI PENGIRIMAN:*`);
    lines.push(`Foto screenshot bukti aktivasi/pengiriman telah dilampirkan oleh Admin dan dapat Anda lihat langsung di menu rincian transaksi akun website ChaizStore.`);
    lines.push(``);
  }

  lines.push(`🛡️ *GARANSI RESMI CHAIZSTORE:*`);
  lines.push(`Pesanan ini bergaransi penuh 100%. Jika ada pertanyaan atau kendala aktivasi/login, silakan langsung balas chat WhatsApp ini ya kak!`);
  lines.push(``);
  lines.push(`Terima kasih telah berbelanja di ChaizStore! Selamat menikmati layanannya 🙏✨`);

  return lines.join('\n');
};

export default function AdminApp() {
  // Admin Auth State
  const [adminSession, setAdminSession] = useState(() => getAdminSession());
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Main Admin Tab: 'users' | 'activity' | 'gudang' | 'orders'
  const [activeAdminTab, setActiveAdminTab] = useState('users');

  // Dashboard Data State
  const [registeredUsers, setRegisteredUsers] = useState(() => getRegisteredUsers());
  const [activityLogs, setActivityLogs] = useState(() => getActivityLogs());

  // Gudang & Database Restock State
  const [productsList, setProductsList] = useState(() => getDatabaseProducts());
  const [gudangSearch, setGudangSearch] = useState('');
  const [gudangCategory, setGudangCategory] = useState('all');
  const [selectedProductForRestock, setSelectedProductForRestock] = useState(null);
  const [restockMode, setRestockMode] = useState('account'); // 'account' | 'manuality'
  const [newAccEmail, setNewAccEmail] = useState('');
  const [newAccPassword, setNewAccPassword] = useState('');
  const [newAccNote, setNewAccNote] = useState('');
  const [showNewAccPassword, setShowNewAccPassword] = useState(false);
  const [manualStockInput, setManualStockInput] = useState('10');
  const [visibleVaultPasswords, setVisibleVaultPasswords] = useState({});
  const [copiedAccId, setCopiedAccId] = useState(null);
 
  // Orders / Transaksi Masuk State (Menu 4)
  const [ordersList, setOrdersList] = useState(() => getTransactions());
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'processing' | 'completed' | 'rejected'
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrderForFulfill, setSelectedOrderForFulfill] = useState(null);
  const [fulfillMode, setFulfillMode] = useState('premium_account'); // 'note_only' | 'premium_account' | 'voucher' | 'topup'
  const [fulfillAccount, setFulfillAccount] = useState('');
  const [fulfillPassword, setFulfillPassword] = useState('');
  const [fulfillUsername, setFulfillUsername] = useState('');
  const [fulfillPin, setFulfillPin] = useState('');
  const [fulfillProfile, setFulfillProfile] = useState('');
  const [fulfillDuration, setFulfillDuration] = useState('1 Bulan');
  const [fulfillWarranty, setFulfillWarranty] = useState('30 Hari');
  const [fulfillCode, setFulfillCode] = useState('');
  const [fulfillAdminNote, setFulfillAdminNote] = useState('');
  const [fulfillCustomerPhone, setFulfillCustomerPhone] = useState('');
  const [copyWaSuccess, setCopyWaSuccess] = useState(false);
  const [showFulfillPassword, setShowFulfillPassword] = useState(false);
  const [showExtraFields, setShowExtraFields] = useState(false);
  const [fulfillProofPhoto, setFulfillProofPhoto] = useState(null); // Foto Bukti Kirim dari Admin (Opsional)
  const fulfillFileInputRef = React.useRef(null);
  const [adminSoundOn, setAdminSoundOn] = useState(() => isSoundEnabled());
  const knownOrderIdsRef = React.useRef(new Set());
  const isInitialLoadRef = React.useRef(true);
  const [selectedOrderProof, setSelectedOrderProof] = useState(null); // Modal Bukti Kiriman Foto Pembeli
  const [proofImgError, setProofImgError] = useState(false);
  const [isFulfilling, setIsFulfilling] = useState(false);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);

  // Filter & Search State
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState('all'); // 'all' | 'online' | 'offline' | 'logged_in' | 'logged_out' | 'banned'

  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [activityFilter, setActivityFilter] = useState('all'); // 'all' | 'auth' | 'banned' | 'cart' | 'topup' | 'today'

  // Modals State
  const [selectedUserForHistory, setSelectedUserForHistory] = useState(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [isChangeCredsOpen, setIsChangeCredsOpen] = useState(false);

  // Banned Modal State
  const [userToBan, setUserToBan] = useState(null);
  const [banType, setBanType] = useState('temporary'); // 'temporary' | 'permanent'
  const [banDurationPreset, setBanDurationPreset] = useState('60'); // minutes: '15', '60', '360', '1440', '4320', '10080', 'custom'
  const [customBanMinutes, setCustomBanMinutes] = useState('120');
  const [banReason, setBanReason] = useState('Pelanggaran aturan toko');

  // Change Password Form State
  const [oldPass, setOldPass] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [credsError, setCredsError] = useState('');
  const [credsSuccess, setCredsSuccess] = useState('');

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  // Live timer tick for countdown and realtime updates
  const [, setTick] = useState(0);

  const showToast = (message, icon = 'fa-circle-check', type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, icon, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Reload all tracker & orders data
  const reloadAllData = () => {
    setRegisteredUsers(getRegisteredUsers());
    setActivityLogs(getActivityLogs());
    setOrdersList(getTransactions());
    syncTransactionsFromCloud().then((fresh) => {
      if (fresh && fresh.length > 0) {
        setOrdersList(fresh);
      }
    });
  };

  // Seed demo data if totally empty
  useEffect(() => {
    const currentUsers = getRegisteredUsers();
    if (currentUsers.length === 0) {
      const seeded = seedDemoUsersAndActivities();
      setRegisteredUsers(seeded.users);
      setActivityLogs(seeded.activities);
    }
  }, []);

  // Real-time synchronization (Storage & BroadcastChannel & Polling)
  useEffect(() => {
    const handleStorageChange = () => {
      reloadAllData();
    };

    window.addEventListener('storage', handleStorageChange);

    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('chaiz_admin_sync');
        bc.onmessage = (ev) => {
          const type = ev.data?.type;
          if (type === 'USERS_UPDATED') {
            setRegisteredUsers(getRegisteredUsers());
            showToast('Daftar status pengguna diperbarui realtime!', 'fa-bolt', 'info');
          } else if (type === 'ACTIVITIES_UPDATED') {
            setActivityLogs(getActivityLogs());
            showToast('Aktivitas baru pengguna baru saja tercatat!', 'fa-clock-rotate-left', 'info');
          } else if (type === 'USER_BANNED') {
            setRegisteredUsers(getRegisteredUsers());
            showToast('Sanksi Banned pengguna berhasil diterapkan!', 'fa-ban', 'warning');
          } else if (type === 'USER_UNBANNED') {
            setRegisteredUsers(getRegisteredUsers());
            showToast('Sanksi Banned pengguna telah dicabut!', 'fa-circle-check', 'success');
          } else if (type === 'NEW_TRANSACTION') {
            const newTrx = ev.data?.data?.newTrx || ev.data?.newTrx;
            if (newTrx && newTrx.id) {
              setOrdersList((prev) => {
                if (prev.some((o) => o.id === newTrx.id)) return prev;
                return [newTrx, ...prev];
              });
            } else {
              setOrdersList(getTransactions());
            }
            showToast('Pesanan baru masuk dari pelanggan!', 'fa-receipt', 'success');
          } else if (type === 'TRANSACTION_FULFILLED') {
            const updated = ev.data?.data?.updatedTrx || ev.data?.updatedTrx;
            if (updated && updated.id) {
              setOrdersList((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
            } else {
              setOrdersList(getTransactions());
            }
            showToast('Pesanan berhasil diproses & akun terkirim!', 'fa-circle-check', 'success');
          } else if (type === 'TRANSACTION_REJECTED') {
            const updated = ev.data?.data?.updatedTrx || ev.data?.updatedTrx;
            if (updated && updated.id) {
              setOrdersList((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
            }
          } else if (type === 'TRANSACTION_RATED') {
            setOrdersList(getTransactions());
            showToast('Pelanggan telah memberikan rating bintang!', 'fa-star', 'info');
          }
        };
      } catch (e) {
        // ignore
      }
    }

    // Cloud Event Listeners (Firebase Cloud Realtime Updates)
    const handleCustomTrx = (e) => {
      const type = e.detail?.type;
      if (type === 'USER_TRANSACTIONS_UPDATED' || type === 'NOTIFICATIONS_READ') {
        return;
      }
      if (type === 'TRANSACTION_FULFILLED') {
        const updated = e.detail?.data?.updatedTrx || e.detail?.updatedTrx;
        if (updated && updated.id) {
          setOrdersList((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        }
        return;
      }
      if (type === 'NEW_TRANSACTION') {
        const newTrx = e.detail?.data?.newTrx || e.detail?.newTrx;
        if (newTrx && newTrx.id) {
          knownOrderIdsRef.current.add(newTrx.id);
          setOrdersList((prev) => {
            if (prev.some((o) => o.id === newTrx.id)) return prev;
            return [newTrx, ...prev];
          });
        } else {
          setOrdersList(getTransactions());
        }
        playAdminOrderSound();
        showToast('🔔 Pesanan baru masuk dari pelanggan!', 'fa-bell text-warning', 'success');
      }
    };

    window.addEventListener('chaiz_trx_updated', handleCustomTrx);

    // Native Firebase SSE streaming untuk seluruh pesanan (sub-50ms instant delta)
    const unsubscribeAllTrx = listenToAllTransactions((liveOrders) => {
      if (Array.isArray(liveOrders)) {
        if (isInitialLoadRef.current) {
          liveOrders.forEach((o) => knownOrderIdsRef.current.add(o.id));
          isInitialLoadRef.current = false;
        } else {
          const hasNewOrder = liveOrders.some(
            (o) => !knownOrderIdsRef.current.has(o.id) && (o.status === 'processing' || o.status === 'pending')
          );
          if (hasNewOrder) {
            playAdminOrderSound();
            showToast('🔔 Pesanan baru masuk dari pelanggan!', 'fa-bell text-warning', 'success');
          }
          liveOrders.forEach((o) => knownOrderIdsRef.current.add(o.id));
        }
        setOrdersList(liveOrders);
      }
    });

    // Auto poll gentle heartbeat countdown timer
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    // Gentle cloud poll fallback every 20s when page is active
    const cloudPollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      syncTransactionsFromCloud().then((fresh) => {
        if (fresh && fresh.length > 0) {
          setOrdersList(fresh);
        }
      });
    }, 20000);

    return () => {
      if (unsubscribeAllTrx) unsubscribeAllTrx();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('chaiz_trx_updated', handleCustomTrx);
      if (bc) bc.close();
      clearInterval(interval);
      clearInterval(cloudPollInterval);
    };
  }, []);

  // Subscribe to real-time product database & stock changes
  useEffect(() => {
    const unsub = subscribeToProductChanges((updatedProducts) => {
      setProductsList(updatedProducts);
      setSelectedProductForRestock((prev) => {
        if (!prev) return null;
        return updatedProducts.find((p) => p.id === prev.id) || prev;
      });
    });
    return unsub;
  }, []);

  // Gudang Stats Summary
  const gudangStats = useMemo(() => {
    let totalStock = 0;
    let totalAccounts = 0;
    let lowStockCount = 0;
    productsList.forEach((p) => {
      const s = typeof p.stock === 'number' ? p.stock : 0;
      totalStock += s;
      totalAccounts += Array.isArray(p.accounts) ? p.accounts.length : 0;
      if (s <= 3) lowStockCount++;
    });
    return {
      totalProducts: productsList.length,
      totalStock,
      totalAccounts,
      lowStockCount
    };
  }, [productsList]);

  // Filtered Gudang Products List
  const filteredGudangProducts = useMemo(() => {
    return productsList.filter((prod) => {
      let matchCat = true;
      if (gudangCategory === 'low') {
        matchCat = (prod.stock || 0) <= 5;
      } else if (gudangCategory !== 'all') {
        matchCat = prod.category === gudangCategory;
      }

      const q = gudangSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        prod.category.toLowerCase().includes(q) ||
        (prod.badge && prod.badge.toLowerCase().includes(q));

      return matchCat && matchSearch;
    });
  }, [productsList, gudangCategory, gudangSearch]);

  // Gudang Actions Handlers
  const handleOpenRestockModal = (product) => {
    setSelectedProductForRestock(product);
    setRestockMode('account');
    setNewAccEmail('');
    setNewAccPassword('');
    setNewAccNote('');
    setShowNewAccPassword(false);
    setManualStockInput(String(product.stock || 0));
  };

  const handleToggleVaultPassword = (accId) => {
    setVisibleVaultPasswords((prev) => ({
      ...prev,
      [accId]: !prev[accId]
    }));
  };

  const handleCopyCredential = (acc) => {
    const text = `Email: ${acc.email}\nPassword: ${acc.password}${acc.note ? `\nCatatan: ${acc.note}` : ''}`;
    navigator.clipboard?.writeText(text);
    setCopiedAccId(acc.id);
    showToast('Kredensial akun berhasil disalin ke clipboard!', 'fa-copy', 'info');
    setTimeout(() => setCopiedAccId(null), 2000);
  };

  const handleAddAccountSubmit = (e) => {
    e.preventDefault();
    if (!selectedProductForRestock) return;
    if (!newAccEmail.trim() || !newAccPassword.trim()) {
      showToast('Email/Username dan Password akun wajib diisi!', 'fa-triangle-exclamation', 'warning');
      return;
    }

    try {
      const res = addAccountToProduct(selectedProductForRestock.id, {
        email: newAccEmail.trim(),
        password: newAccPassword.trim(),
        note: newAccNote.trim()
      });

      // Log activity in tracker
      recordUserActivity(
        adminSession || { name: 'Admin ChaizStore', email: 'admin@chaizstore.local' },
        'RESTOCK_ACCOUNT',
        `Menambahkan 1 akun ke Gudang ${selectedProductForRestock.name}: ${newAccEmail.trim()} (Stok bertambah jadi ${res.newStock})`
      );

      showToast(
        `Akun berhasil ditambahkan ke Gudang! Stok ${selectedProductForRestock.name} bertambah jadi ${res.newStock}.`,
        'fa-circle-check',
        'success'
      );

      setNewAccEmail('');
      setNewAccPassword('');
      setNewAccNote('');
      setSelectedProductForRestock(res.product);
      setManualStockInput(String(res.newStock));
    } catch (err) {
      showToast(err.message || 'Gagal menambahkan akun', 'fa-circle-xmark', 'error');
    }
  };

  const handleDeleteAccount = (accId, accEmail) => {
    if (!selectedProductForRestock) return;
    if (!window.confirm(`Yakin ingin menghapus akun "${accEmail}" dari vault gudang? Stok produk akan otomatis berkurang 1.`)) {
      return;
    }

    try {
      const res = deleteAccountFromProduct(selectedProductForRestock.id, accId);
      recordUserActivity(
        adminSession || { name: 'Admin ChaizStore', email: 'admin@chaizstore.local' },
        'RESTOCK_ACCOUNT',
        `Menghapus akun ${accEmail} dari Gudang ${selectedProductForRestock.name} (Sisa stok ${res.newStock})`
      );
      showToast(`Akun dihapus dari vault. Sisa stok: ${res.newStock}`, 'fa-trash-can', 'info');
      setSelectedProductForRestock(res.product);
      setManualStockInput(String(res.newStock));
    } catch (err) {
      showToast(err.message || 'Gagal menghapus akun', 'fa-circle-xmark', 'error');
    }
  };

  const handleConfirmManuality = (e) => {
    e.preventDefault();
    if (!selectedProductForRestock) return;
    const val = parseInt(manualStockInput, 10);
    if (isNaN(val) || val < 0) {
      showToast('Masukkan jumlah stok yang valid (angka minimal 0)!', 'fa-triangle-exclamation', 'warning');
      return;
    }

    try {
      const res = updateStockManuality(selectedProductForRestock.id, val);
      recordUserActivity(
        adminSession || { name: 'Admin ChaizStore', email: 'admin@chaizstore.local' },
        'RESTOCK_MANUAL',
        `Restock Manual: Stok ${selectedProductForRestock.name} diubah menjadi ${val} akun (User pembeli langsung melihat stok baru)`
      );
      showToast(
        `Stok ${selectedProductForRestock.name} berhasil diubah jadi ${val} akun! Tampilan pembeli di toko langsung terupdate realtime.`,
        'fa-boxes-stacked',
        'success'
      );
      setSelectedProductForRestock(res.product);
    } catch (err) {
      showToast(err.message || 'Gagal mengubah stok manual', 'fa-circle-xmark', 'error');
    }
  };

  // Orders (Menu 4) Stats Summary & Filtered List
  const pendingOrdersCount = useMemo(() => {
    return ordersList.filter((o) => o.status === 'processing').length;
  }, [ordersList]);

  const ordersStats = useMemo(() => {
    let totalRevenue = 0;
    let completedCount = 0;
    let processingCount = 0;
    let rejectedCount = 0;

    ordersList.forEach((o) => {
      totalRevenue += Number(o.total) || 0;
      if (o.status === 'completed') completedCount++;
      if (o.status === 'processing') processingCount++;
      if (o.status === 'rejected') rejectedCount++;
    });

    return {
      total: ordersList.length,
      processing: processingCount,
      completed: completedCount,
      rejected: rejectedCount,
      totalRevenue
    };
  }, [ordersList]);

  const filteredOrders = useMemo(() => {
    return ordersList.filter((order) => {
      if (orderFilter === 'processing' && order.status !== 'processing') return false;
      if (orderFilter === 'completed' && order.status !== 'completed') return false;
      if (orderFilter === 'rejected' && order.status !== 'rejected') return false;

      if (!orderSearch.trim()) return true;
      const q = orderSearch.toLowerCase();
      return (
        order.id.toLowerCase().includes(q) ||
        (order.customerName && order.customerName.toLowerCase().includes(q)) ||
        (order.customerEmail && order.customerEmail.toLowerCase().includes(q)) ||
        (order.customerPhone && order.customerPhone.toLowerCase().includes(q)) ||
        (order.productName && order.productName.toLowerCase().includes(q))
      );
    });
  }, [ordersList, orderFilter, orderSearch]);

  const handleOpenFulfillModal = (order) => {
    if (!order) return;
    setSelectedOrderForFulfill(order);

    const prodName = String(order.productName || '').toLowerCase();
    const catName = String(order.productCategory || '').toLowerCase();

    // Auto-detect initial fulfillment mode based on product
    let initialMode = 'premium_account';
    if (
      prodName.includes('top up') ||
      prodName.includes('topup') ||
      catName.includes('top up') ||
      catName.includes('topup') ||
      catName.includes('game')
    ) {
      initialMode = 'topup';
    } else if (
      prodName.includes('key') ||
      prodName.includes('voucher') ||
      prodName.includes('voucer') ||
      prodName.includes('steam') ||
      catName.includes('key') ||
      catName.includes('voucher')
    ) {
      initialMode = 'voucher';
    } else {
      initialMode = 'premium_account';
    }
    setFulfillMode(initialMode);

    const customerMail =
      order.customerEmail && order.customerEmail !== '-'
        ? order.customerEmail
        : (order.userEmail && order.userEmail !== '-' ? order.userEmail : (order.email && order.email !== '-' ? order.email : ''));
    const customerPhone =
      order.customerPhone && order.customerPhone !== '-'
        ? order.customerPhone
        : (order.phone && order.phone !== '-' ? order.phone : (order.wa && order.wa !== '-' ? order.wa : ''));

    const initialAccount =
      order.credentials?.account || customerMail || order.customerUsername || '';

    setFulfillAccount(String(initialAccount || ''));
    setFulfillPassword(String(order.credentials?.password || ''));
    setFulfillUsername(String(order.credentials?.username || order.customerUsername || ''));
    setFulfillPin(String(order.credentials?.pin || ''));
    setFulfillProfile(String(order.credentials?.profile || ''));
    setFulfillDuration(String(order.productDuration || '1 Bulan'));
    setFulfillWarranty(String(order.warrantyPeriod || '30 Hari'));
    setFulfillCode(String(order.credentials?.code || ''));
    setFulfillCustomerPhone(String(customerPhone || ''));
    setCopyWaSuccess(false);

    setFulfillAdminNote(
      order.adminNote ||
        (initialMode === 'voucher'
          ? 'Kode Voucher / Key Original aktif & bergaransi resmi. Silakan segera aktivasi di akun Anda. Selamat menikmati!'
          : initialMode === 'topup'
          ? `Layanan Top Up untuk pesanan ${order.productName || 'Produk'} telah berhasil diproses ke akun Anda. Selamat bermain!`
          : `Layanan Akun ${order.productName || 'Premium'} sudah berhasil diproses dan diaktifkan. Garansi penuh ChaizStore aktif!`)
    );
    setShowFulfillPassword(false);
    setFulfillProofPhoto(null);
  };

  const handleAdminProofChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Harap pilih file foto bukti pengiriman (JPG / PNG / WEBP)', 'fa-triangle-exclamation', 'warning');
      e.target.value = '';
      return;
    }

    try {
      const compressedDataUrl = await compressImageFile(file, 900, 1200, 0.72);
      const sizeKb = ((compressedDataUrl?.length || file.size) * 0.75 / 1024).toFixed(1);
      setFulfillProofPhoto({
        file,
        name: file.name,
        size: `${sizeKb} KB`,
        dataUrl: compressedDataUrl
      });
      showToast('Foto bukti pengiriman admin berhasil diunggah!', 'fa-camera text-success', 'success');
    } catch {
      showToast('Gagal memproses foto bukti pengiriman', 'fa-triangle-exclamation', 'error');
    }
  };

  // Ceklis Hijau: Selesaikan pesanan langsung & kirim konfirmasi WhatsApp ke pelanggan
  const handleQuickCompleteOrder = async (order) => {
    if (!order) return;
    const cleanPhone = cleanPhoneNumber(order.customerPhone);
    const hasPhone = cleanPhone && cleanPhone.length >= 7;

    const confirmed = window.confirm(
      `Selesaikan Pesanan #${order.id} (${order.productName}) untuk ${order.customerName}?\n\n` +
      (hasPhone
        ? `WhatsApp konfirmasi selesai akan otomatis dibuka ke nomor pelanggan (${order.customerPhone}).`
        : `Pesanan akan ditandai selesai di sistem.`)
    );
    if (!confirmed) return;

    let waUrl = '';
    let waWindow = null;
    if (hasPhone) {
      const waMsg = [
        `Halo kak *${order.customerName || 'Pelanggan'}*! Salam dari *ChaizStore* ✨`,
        `Pesanan Anda dengan ID *#${order.id}* (*${order.productName}*) telah selesai diproses oleh Admin.`,
        ``,
        `📦 *STATUS PESANAN:* Telah Dikirim / Selesai ✅`,
        ``,
        `Terima kasih telah berbelanja di ChaizStore! Selamat menikmati layanannya 🙏✨`
      ].join('\n');
      waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`;
      try {
        waWindow = window.open(waUrl, '_blank');
      } catch (e) {}
    }

    try {
      const fulfilled = await fulfillTransaction(
        order.id,
        order.credentials || {},
        order.adminNote || 'Pesanan Anda telah selesai diproses oleh Admin ChaizStore.',
        order
      );

      try {
        const prodIdentifier = order.productId || order.productName;
        deductProductStock(prodIdentifier, order.qty || 1, order.customerEmail || null);
      } catch (e) {}

      recordUserActivity(
        adminSession || { name: 'Admin ChaizStore', email: 'admin@chaizstore.local' },
        'ORDER_FULFILLED',
        `Menyelesaikan pesanan #${order.id} (${order.productName}) untuk ${order.customerName} (Ceklis cepat)`
      );

      setOrdersList((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, ...(fulfilled || {}), status: 'completed' } : o))
      );
      setProductsList(getDatabaseProducts());

      if (hasPhone) {
        if (!waWindow || waWindow.closed || typeof waWindow.closed === 'undefined') {
          window.open(waUrl, '_blank');
        }
        showToast(`Pesanan #${order.id} selesai & WhatsApp pelanggan dibuka!`, 'fa-circle-check text-success', 'success');
      } else {
        showToast(`Pesanan #${order.id} berhasil ditandai selesai di sistem!`, 'fa-circle-check', 'success');
      }
    } catch (err) {
      if (waWindow && !waWindow.closed) waWindow.close();
      showToast('Gagal memproses pesanan: ' + err.message, 'fa-circle-xmark', 'error');
    }
  };

  // X Merah: Proses ditolak
  const handleQuickRejectOrder = async (order) => {
    if (!order) return;
    const reasonInput = window.prompt(
      `Tolak Pesanan #${order.id} untuk ${order.customerName}?\n\nMasukkan alasan penolakan (akan ditampilkan kepada pembeli):`,
      'Bukti transfer tidak valid atau stok produk sedang habis'
    );
    if (reasonInput === null) return;

    try {
      const rejected = await rejectTransaction(order.id, reasonInput.trim() || 'Pesanan ditolak oleh admin', order);

      recordUserActivity(
        adminSession || { name: 'Admin ChaizStore', email: 'admin@chaizstore.local' },
        'ORDER_REJECTED',
        `Menolak pesanan #${order.id} (${order.productName}) untuk ${order.customerName}. Alasan: ${reasonInput}`
      );

      setOrdersList((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, ...(rejected || {}), status: 'rejected' } : o))
      );

      showToast(`Pesanan #${order.id} berhasil ditolak. Pembeli dapat menghubungi admin via WA 0818-0973-0331.`, 'fa-circle-xmark', 'warning');
    } catch (err) {
      showToast('Gagal menolak pesanan: ' + err.message, 'fa-circle-xmark', 'error');
    }
  };

  const handleFulfillSubmit = async (e, sendViaWhatsApp = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedOrderForFulfill || isFulfilling) return;

    // Validation based on mode
    if (fulfillMode === 'voucher') {
      if (!fulfillCode.trim()) {
        showToast('Harap masukkan Code Voucer yang akan dikirim!', 'fa-triangle-exclamation', 'warning');
        return;
      }
    } else if (fulfillMode === 'note_only') {
      if (!fulfillAdminNote.trim()) {
        showToast('Harap masukkan catatan yang akan dikirim!', 'fa-triangle-exclamation', 'warning');
        return;
      }
    } else if (fulfillMode === 'topup') {
      if (!fulfillAccount.trim() && !selectedOrderForFulfill.customerEmail) {
        showToast('Harap isi Nama Akun / Game ID!', 'fa-triangle-exclamation', 'warning');
        return;
      }
    } else {
      // premium_account
      if (!fulfillAccount.trim() && !fulfillPassword.trim() && !fulfillCode.trim()) {
        showToast('Harap isi Nama Akun atau Password!', 'fa-triangle-exclamation', 'warning');
        return;
      }
    }

    let cleanPhone = '';
    let waUrl = '';

    if (sendViaWhatsApp) {
      let targetPhone = fulfillCustomerPhone || selectedOrderForFulfill.customerPhone;
      cleanPhone = cleanPhoneNumber(targetPhone);

      if (!cleanPhone || cleanPhone.length < 7) {
        const manualPhone = window.prompt(
          `Nomor WhatsApp untuk ${selectedOrderForFulfill.customerName || 'Pelanggan'} belum terisi atau kurang lengkap.\n\nSilakan masukkan nomor WhatsApp pelanggan (contoh: 08123456789):`,
          ''
        );
        if (!manualPhone) {
          showToast('Pengiriman WhatsApp dibatalkan karena nomor HP tidak diisi.', 'fa-triangle-exclamation', 'warning');
          return;
        }
        cleanPhone = cleanPhoneNumber(manualPhone);
        if (!cleanPhone || cleanPhone.length < 7) {
          showToast('Nomor WhatsApp tidak valid. Pengiriman dibatalkan.', 'fa-circle-xmark', 'error');
          return;
        }
        setFulfillCustomerPhone(manualPhone);
      }

      const waMessage = formatWhatsAppFulfillMessage(
        selectedOrderForFulfill,
        fulfillMode,
        {
          account: fulfillAccount,
          password: fulfillPassword,
          profile: fulfillProfile,
          pin: fulfillPin,
          duration: fulfillDuration,
          warranty: fulfillWarranty,
          code: fulfillCode,
          email: fulfillAccount || selectedOrderForFulfill.customerEmail || selectedOrderForFulfill.userEmail || selectedOrderForFulfill.email,
          phone: fulfillCustomerPhone || selectedOrderForFulfill.customerPhone || selectedOrderForFulfill.phone || selectedOrderForFulfill.wa,
          adminProofUrl: fulfillProofPhoto?.dataUrl || null
        },
        fulfillAdminNote
      );

      waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

      // Buka tab WhatsApp secara instan dengan link click helper agar tidak diblokir browser
      try {
        const waLink = document.createElement('a');
        waLink.href = waUrl;
        waLink.target = '_blank';
        waLink.rel = 'noopener noreferrer';
        document.body.appendChild(waLink);
        waLink.click();
        document.body.removeChild(waLink);
      } catch (eWa) {
        window.open(waUrl, '_blank');
      }
    }

    setIsFulfilling(true);
    try {
      const fulfilled = await fulfillTransaction(
        selectedOrderForFulfill.id,
        {
          account: sTrim(fulfillAccount),
          password: sTrim(fulfillPassword),
          username: sTrim(fulfillUsername),
          pin: sTrim(fulfillPin),
          profile: sTrim(fulfillProfile),
          code: sTrim(fulfillCode)
        },
        sTrim(fulfillAdminNote),
        selectedOrderForFulfill,
        {
          duration: sTrim(fulfillDuration),
          warranty: sTrim(fulfillWarranty),
          deliveryMethod: sendViaWhatsApp ? 'whatsapp' : 'web',
          sendViaWhatsApp,
          adminProofUrl: fulfillProofPhoto?.dataUrl || null,
          adminProofFileName: fulfillProofPhoto?.name || null,
          adminProofSize: fulfillProofPhoto?.size || null
        }
      );

      // Kurangi stok produk secara realtime
      let stockResult = null;
      try {
        const prodIdentifier =
          selectedOrderForFulfill.productId ||
          selectedOrderForFulfill.productName;
        const qtyToDeduct = selectedOrderForFulfill.qty || 1;
        const sentEmail = fulfillAccount.trim() || null;
        stockResult = deductProductStock(prodIdentifier, qtyToDeduct, sentEmail);
      } catch (errStock) {
        console.warn('Gagal memotong stok saat fulfillment:', errStock);
      }

      recordUserActivity(
        adminSession || { name: 'Admin ChaizStore', email: 'admin@chaizstore.local' },
        'ORDER_FULFILLED',
        `Memproses pesanan #${selectedOrderForFulfill.id} (${selectedOrderForFulfill.productName}) untuk ${selectedOrderForFulfill.customerName} - Mode: ${fulfillMode} (${sendViaWhatsApp ? 'WhatsApp' : 'Web Saja'})`
      );

      setOrdersList((prev) =>
        prev.map((o) =>
          o.id === selectedOrderForFulfill.id
            ? {
                ...o,
                ...(fulfilled || {}),
                status: 'completed',
                adminProofUrl: fulfillProofPhoto?.dataUrl || null,
                adminProofFileName: fulfillProofPhoto?.name || null,
                adminProofSize: fulfillProofPhoto?.size || null
              }
            : o
        )
      );
      setProductsList(getDatabaseProducts());

      const stockNote = stockResult
        ? ` • Sisa stok ${stockResult.product?.name || 'produk'}: ${stockResult.newStock} akun`
        : '';

      if (sendViaWhatsApp) {
        showToast(
          `Pesanan #${selectedOrderForFulfill.id} berhasil diproses & pesan WhatsApp dibuka!${stockNote}`,
          'fa-brands fa-whatsapp text-success',
          'success'
        );
      } else {
        showToast(
          `Pesanan #${selectedOrderForFulfill.id} berhasil diproses & disimpan di Web! Kredensial aktif.${stockNote}`,
          'fa-circle-check text-success',
          'success'
        );
      }
      setSelectedOrderForFulfill(null);
    } catch (err) {
      showToast('Gagal memproses pesanan: ' + err.message, 'fa-circle-xmark', 'error');
    } finally {
      setIsFulfilling(false);
    }
  };

  const handleCopyWaText = () => {
    if (!selectedOrderForFulfill) return;
    const msg = formatWhatsAppFulfillMessage(
      selectedOrderForFulfill,
      fulfillMode,
      {
        account: fulfillAccount,
        password: fulfillPassword,
        profile: fulfillProfile,
        pin: fulfillPin,
        duration: fulfillDuration,
        warranty: fulfillWarranty,
        code: fulfillCode,
        email: fulfillAccount || selectedOrderForFulfill.customerEmail || selectedOrderForFulfill.userEmail || selectedOrderForFulfill.email,
        phone: fulfillCustomerPhone || selectedOrderForFulfill.customerPhone || selectedOrderForFulfill.phone || selectedOrderForFulfill.wa,
        adminProofUrl: fulfillProofPhoto?.dataUrl || null
      },
      fulfillAdminNote
    );
    navigator.clipboard.writeText(msg);
    setCopyWaSuccess(true);
    showToast('Teks pesan WhatsApp berhasil disalin ke clipboard!', 'fa-copy', 'success');
    setTimeout(() => setCopyWaSuccess(false), 2500);
  };

  // Segarkan Data Pesanan Langsung dari Cloud
  const handleRefreshOrders = async () => {
    setIsRefreshingOrders(true);
    try {
      const fresh = await syncTransactionsFromCloud();
      if (fresh) {
        setOrdersList(fresh);
      } else {
        setOrdersList(getTransactions());
      }
      showToast('Daftar pesanan berhasil disegarkan langsung dari Cloud Database!', 'fa-arrows-rotate text-cyan');
    } catch (err) {
      showToast('Gagal menyegarkan pesanan: ' + err.message, 'fa-triangle-exclamation', 'warning');
    } finally {
      setTimeout(() => setIsRefreshingOrders(false), 450);
    }
  };

  // Bersihkan Seluruh Riwayat Pesanan & Foto Bukti oleh Admin
  const handleClearOrdersHistory = () => {
    if (ordersList.length === 0) {
      showToast('Riwayat pesanan sudah dalam keadaan bersih kosong.', 'fa-circle-info', 'info');
      return;
    }

    const confirmed = window.confirm(
      '⚠️ PERINGATAN BERSIHKAN RIWAYAT PESANAN:\n\nApakah Anda yakin ingin membersihkan dan menghapus SEMUA riwayat pesanan serta foto bukti kiriman di sistem?\n\nSetelah dibersihkan, seluruh data riwayat pesanan dan kiriman foto bukti transfer akan terhapus bersih.'
    );

    if (!confirmed) return;

    try {
      clearAllTransactions();
      setOrdersList([]);
      setSelectedOrderForFulfill(null);
      setSelectedOrderProof(null);

      recordUserActivity(
        adminSession || { name: 'Admin ChaizStore', email: 'admin@chaizstore.local' },
        'CLEAR_ORDERS_HISTORY',
        'Admin membersihkan seluruh riwayat pesanan dan foto bukti transfer dari sistem.'
      );

      showToast('Seluruh riwayat pesanan dan foto kiriman berhasil dibersihkan total!', 'fa-trash-can', 'success');
    } catch (err) {
      showToast('Gagal membersihkan riwayat pesanan: ' + err.message, 'fa-circle-xmark', 'error');
    }
  };

  // Hapus Foto Bukti Pembayaran oleh Admin
  const handleDeleteProof = (orderId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus foto bukti pembayaran ini dari sistem?')) {
      deleteTransactionProof(orderId, adminSession?.adminName || 'Admin');
      setOrdersList(getTransactions());
      if (selectedOrderProof && selectedOrderProof.id === orderId) {
        setSelectedOrderProof((prev) => (prev ? { ...prev, proofUrl: null, proofExpired: true, proofDeletedReason: 'Foto bukti dihapus langsung oleh Admin' } : null));
      }
      if (selectedOrderForFulfill && selectedOrderForFulfill.id === orderId) {
        setSelectedOrderForFulfill((prev) => (prev ? { ...prev, proofUrl: null, proofExpired: true, proofDeletedReason: 'Foto bukti dihapus langsung oleh Admin' } : null));
      }
      showToast('Foto bukti pembayaran berhasil dihapus dari sistem!', 'fa-trash-can', 'info');
    }
  };

  // Handle Admin Login
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    setTimeout(() => {
      const creds = getAdminCredentials();
      const enteredUser = loginUser.trim().toLowerCase();
      const targetUser = creds.username.trim().toLowerCase();

      if (enteredUser === targetUser && loginPass === creds.password) {
        const sessionInfo = {
          username: creds.username,
          adminName: creds.adminName || 'Owner ChaizStore'
        };
        saveAdminSession(sessionInfo, rememberMe);
        setAdminSession(sessionInfo);
        setIsLoggingIn(false);
        showToast(`Selamat datang, ${sessionInfo.adminName}! Portal Admin siap digunakan.`, 'fa-shield-halved');
      } else {
        setIsLoggingIn(false);
        setLoginError('Nama akun atau password admin salah! Periksa kembali huruf besar/kecil.');
      }
    }, 300);
  };

  // Handle Logout
  const handleLogout = () => {
    clearAdminSession();
    setAdminSession(null);
    setLoginPass('');
    showToast('Anda telah keluar dari Portal Admin.', 'fa-right-from-bracket', 'info');
  };

  // Handle Change Credentials
  const handleChangeCredsSubmit = (e) => {
    e.preventDefault();
    setCredsError('');
    setCredsSuccess('');

    const creds = getAdminCredentials();
    if (oldPass !== creds.password) {
      setCredsError('Password lama tidak sesuai!');
      return;
    }

    if (newPass.length < 6) {
      setCredsError('Password baru minimal harus 6 karakter!');
      return;
    }

    if (newPass !== confirmPass) {
      setCredsError('Konfirmasi password baru tidak cocok!');
      return;
    }

    const updatedUser = newUsername.trim() || creds.username;
    updateAdminCredentials({
      username: updatedUser,
      password: newPass
    });

    setCredsSuccess('Kredensial Admin berhasil diperbarui!');
    showToast('Nama akun & password admin berhasil diubah!', 'fa-key');
    setOldPass('');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => {
      setIsChangeCredsOpen(false);
      setCredsSuccess('');
    }, 1500);
  };

  // Format Relative Time
  const formatTimeAgo = (isoString) => {
    if (!isoString) return '-';
    try {
      const now = Date.now();
      const past = new Date(isoString).getTime();
      const diffSec = Math.floor((now - past) / 1000);

      if (diffSec < 10) return 'Baru saja';
      if (diffSec < 60) return `${diffSec} dtk lalu`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} mnt lalu`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour} jam lalu`;
      const diffDay = Math.floor(diffHour / 24);
      return `${diffDay} hr lalu`;
    } catch {
      return '-';
    }
  };

  // Format Ban Remaining Time
  const formatBanRemaining = (untilIso) => {
    if (!untilIso) return '-';
    try {
      const diffMs = new Date(untilIso).getTime() - Date.now();
      if (diffMs <= 0) return 'Kadaluarsa';
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `Sisa ${days} hr ${hours % 24} jam`;
      }
      if (hours > 0) return `Sisa ${hours} jam ${minutes} mnt`;
      return `Sisa ${minutes} menit`;
    } catch {
      return '-';
    }
  };

  // Statistics for Users Directory
  const userStats = useMemo(() => {
    const total = registeredUsers.length;
    const onlineCount = registeredUsers.filter((u) => isUserOnline(u)).length;
    const offlineCount = total - onlineCount;
    const loggedInCount = registeredUsers.filter((u) => u.sessionStatus !== 'logged_out' && !u.banStatus?.isBanned).length;
    const loggedOutCount = registeredUsers.filter((u) => u.sessionStatus === 'logged_out').length;
    const bannedCount = registeredUsers.filter((u) => u.banStatus?.isBanned).length;

    return {
      total,
      onlineCount,
      offlineCount,
      loggedInCount,
      loggedOutCount,
      bannedCount
    };
  }, [registeredUsers]);

  // Statistics for Activity Logs
  const activityStats = useMemo(() => {
    const total = activityLogs.length;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const todayCount = activityLogs.filter((a) => new Date(a.timestamp).getTime() > oneDayAgo).length;
    const bannedCount = activityLogs.filter((a) => a.actionType === 'BANNED' || a.actionType === 'UNBANNED').length;
    const cartCount = activityLogs.filter((a) => a.actionType === 'ADD_TO_CART' || a.actionType === 'OPEN_CHECKOUT' || a.actionType === 'SUBMIT_ORDER').length;

    return {
      total,
      todayCount,
      bannedCount,
      cartCount
    };
  }, [activityLogs]);

  // Filtered Registered Users
  const filteredUsers = useMemo(() => {
    return registeredUsers.filter((u) => {
      const online = isUserOnline(u);
      const isLoggedOut = u.sessionStatus === 'logged_out';
      const isBanned = Boolean(u.banStatus?.isBanned);

      if (userFilter === 'online' && !online) return false;
      if (userFilter === 'offline' && online) return false;
      if (userFilter === 'logged_in' && (isLoggedOut || isBanned)) return false;
      if (userFilter === 'logged_out' && !isLoggedOut) return false;
      if (userFilter === 'banned' && !isBanned) return false;

      if (userSearchQuery.trim()) {
        const q = userSearchQuery.toLowerCase().trim();
        const nameMatch = (u.name || '').toLowerCase().includes(q);
        const emailMatch = (u.email || '').toLowerCase().includes(q);
        const browserMatch = (u.browser || '').toLowerCase().includes(q);
        const osMatch = (u.os || '').toLowerCase().includes(q);
        const reasonMatch = (u.banStatus?.reason || '').toLowerCase().includes(q);
        return nameMatch || emailMatch || browserMatch || osMatch || reasonMatch;
      }

      return true;
    });
  }, [registeredUsers, userFilter, userSearchQuery]);

  // Filtered Activity Logs
  const filteredActivities = useMemo(() => {
    return activityLogs.filter((a) => {
      const isAuth = a.actionType === 'LOGIN' || a.actionType === 'LOGOUT';
      const isBanned = a.actionType === 'BANNED' || a.actionType === 'UNBANNED';
      const isCart = a.actionType === 'ADD_TO_CART' || a.actionType === 'REMOVE_CART' || a.actionType === 'OPEN_CHECKOUT' || a.actionType === 'SUBMIT_ORDER';
      const isTopup = a.actionType === 'VIEW_TOPUP';

      if (activityFilter === 'auth' && !isAuth) return false;
      if (activityFilter === 'banned' && !isBanned) return false;
      if (activityFilter === 'cart' && !isCart) return false;
      if (activityFilter === 'topup' && !isTopup) return false;
      if (activityFilter === 'today') {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        if (new Date(a.timestamp).getTime() <= oneDayAgo) return false;
      }

      if (activitySearchQuery.trim()) {
        const q = activitySearchQuery.toLowerCase().trim();
        const nameMatch = (a.userName || '').toLowerCase().includes(q);
        const emailMatch = (a.userEmail || '').toLowerCase().includes(q);
        const descMatch = (a.description || '').toLowerCase().includes(q);
        const actionMatch = (a.actionType || '').toLowerCase().includes(q);
        return nameMatch || emailMatch || descMatch || actionMatch;
      }

      return true;
    });
  }, [activityLogs, activityFilter, activitySearchQuery]);

  // User-specific activities for history modal
  const userSpecificActivities = useMemo(() => {
    if (!selectedUserForHistory) return [];
    return activityLogs.filter(
      (a) => a.userId === selectedUserForHistory.id || a.userEmail === selectedUserForHistory.email
    );
  }, [selectedUserForHistory, activityLogs]);

  // Open Ban Modal
  const handleOpenBanModal = (user) => {
    setUserToBan(user);
    setBanType('temporary');
    setBanDurationPreset('60');
    setBanReason('Pelanggaran aturan toko / aktivitas mencurigakan');
  };

  // Submit Ban Form
  const handleExecuteBan = (e) => {
    e.preventDefault();
    if (!userToBan) return;

    let finalMinutes = 60;
    if (banType === 'temporary') {
      if (banDurationPreset === 'custom') {
        finalMinutes = parseInt(customBanMinutes, 10) || 60;
      } else {
        finalMinutes = parseInt(banDurationPreset, 10) || 60;
      }
    }

    banUser(userToBan.id, banType, finalMinutes, banReason);
    reloadAllData();

    const durationText = banType === 'permanent' ? 'secara Permanen' : `selama ${finalMinutes} menit`;
    showToast(`Akun ${userToBan.name} berhasil di-banned ${durationText}!`, 'fa-ban', 'warning');
    setUserToBan(null);
  };

  // Unban Action
  const handleExecuteUnban = (user) => {
    if (window.confirm(`Apakah Anda yakin ingin memulihkan (Unban) akun ${user.name}? Pengguna akan dapat login kembali.`)) {
      unbanUser(user.id);
      reloadAllData();
      showToast(`Sanksi banned akun ${user.name} berhasil dicabut!`, 'fa-circle-check', 'success');
      if (selectedUserDetail && selectedUserDetail.id === user.id) {
        setSelectedUserDetail(null);
      }
    }
  };

  // Quick Action: Simulate a live user
  const handleSimulateActiveUser = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const demoUser = {
      name: `Pengguna Aktif ${randomNum}`,
      email: `user.aktif${randomNum}@gmail.com`,
      picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
    };
    recordUserLogin(demoUser);
    recordUserActivity(demoUser, 'VIEW_TOPUP', 'Membuka menu Top Up Game & E-Wallet');
    recordUserActivity(demoUser, 'ADD_TO_CART', 'Menambahkan Spotify Premium 3 Bulan ke keranjang');
    reloadAllData();
    showToast(`Simulasi pengguna aktif (${demoUser.email}) berhasil dibuat!`, 'fa-user-plus');
  };

  // Export Users to CSV
  const handleExportUsersCSV = () => {
    if (registeredUsers.length === 0) {
      showToast('Belum ada data pengguna untuk diekspor.', 'fa-circle-exclamation', 'warning');
      return;
    }

    const headers = ['ID', 'Nama', 'Email', 'Presensi', 'Status Sesi', 'Status Akun / Banned', 'Alasan Banned', 'Berlaku Hingga', 'Terakhir Aktif'];
    const rows = registeredUsers.map((u) => {
      const ban = u.banStatus?.isBanned;
      const banText = !ban ? 'Normal' : u.banStatus.banType === 'permanent' ? 'Banned Permanen' : 'Banned Sementara';
      return [
        `"${u.id}"`,
        `"${u.name || '-'}"`,
        `"${u.email || '-'}"`,
        `"${isUserOnline(u) ? 'Sedang Online' : 'Offline'}"`,
        `"${u.sessionStatus === 'logged_out' ? 'Sudah Logout' : 'Masih Login'}"`,
        `"${banText}"`,
        `"${u.banStatus?.reason || '-'}"`,
        `"${u.banStatus?.bannedUntil ? new Date(u.banStatus.bannedUntil).toLocaleString('id-ID') : '-'}"`,
        `"${new Date(u.lastActiveTime || u.firstLoginTime).toLocaleString('id-ID')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `chaizstore_daftar_pengguna_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File CSV data pengguna berhasil diunduh!', 'fa-file-csv');
  };

  // Delete User
  const handleDeleteUser = (userId) => {
    if (window.confirm('Yakin ingin menghapus pengguna ini dari daftar pemantauan?')) {
      const updated = deleteUserFromDirectory(userId);
      setRegisteredUsers(updated);
      showToast('Pengguna berhasil dihapus.', 'fa-trash-can');
      if (selectedUserDetail && selectedUserDetail.id === userId) {
        setSelectedUserDetail(null);
      }
    }
  };

  // Reset Users
  const handleResetUsers = () => {
    if (window.confirm('PERINGATAN: Apakah Anda yakin ingin mengosongkan SEMUA data pengguna?')) {
      clearAllUsersDirectory();
      setRegisteredUsers([]);
      showToast('Daftar pengguna berhasil dikosongkan.', 'fa-broom');
    }
  };

  // Reset Activities
  const handleResetActivities = () => {
    if (window.confirm('PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA riwayat aktivitas?')) {
      clearAllActivityLogs();
      setActivityLogs([]);
      showToast('Semua riwayat aktivitas berhasil dibersihkan.', 'fa-broom');
    }
  };

  // Action badge mapping
  const getActionBadge = (actionType) => {
    switch (actionType) {
      case 'LOGIN':
        return { label: 'Login Masuk', icon: 'fa-right-to-bracket', className: 'act-badge-login' };
      case 'LOGOUT':
        return { label: 'Log Out', icon: 'fa-right-from-bracket', className: 'act-badge-logout' };
      case 'BANNED':
        return { label: 'Sanksi Banned', icon: 'fa-ban', className: 'act-badge-banned' };
      case 'UNBANNED':
        return { label: 'Akun Dipulihkan', icon: 'fa-circle-check', className: 'act-badge-unban' };
      case 'ADD_TO_CART':
        return { label: '+ Keranjang', icon: 'fa-cart-plus', className: 'act-badge-cart' };
      case 'REMOVE_CART':
        return { label: 'Hapus Keranjang', icon: 'fa-trash-can', className: 'act-badge-del' };
      case 'VIEW_TOPUP':
        return { label: 'Menu Top Up', icon: 'fa-gamepad', className: 'act-badge-topup' };
      case 'VIEW_PRODUCTS':
        return { label: 'Katalog Akun', icon: 'fa-store', className: 'act-badge-store' };
      case 'OPEN_CHECKOUT':
        return { label: 'Buka Checkout', icon: 'fa-money-bill-wave', className: 'act-badge-checkout' };
      case 'SUBMIT_ORDER':
        return { label: 'Pesanan Selesai', icon: 'fa-circle-check', className: 'act-badge-success' };
      case 'RESTOCK_ACCOUNT':
        return { label: 'Restock Akun Vault', icon: 'fa-vault', className: 'act-badge-cart' };
      case 'RESTOCK_MANUAL':
        return { label: 'Restock Manual', icon: 'fa-boxes-stacked', className: 'act-badge-store' };
      case 'ORDER_FULFILLED':
        return { label: 'Kirim Akun Pesanan', icon: 'fa-paper-plane', className: 'act-badge-success' };
      default:
        return { label: actionType || 'Aktivitas', icon: 'fa-circle-info', className: 'act-badge-default' };
    }
  };

  // =========================================================================
  // VIEW 1: GERBANG LOGIN ADMIN (JIKA BELUM LOGIN)
  // =========================================================================
  if (!adminSession) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="admin-shield-icon">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <span className="admin-portal-badge">CHAIZSTORE SECURE GATE</span>
            <h1 className="admin-login-title">Portal Login Admin</h1>
            <p className="admin-login-desc">
              Pusat Kontrol Pemilik Toko: Jumlah & Daftar Pengguna, Status Online/Offline, Sesi Login, serta Fitur Banned Pengguna.
            </p>
          </div>

          {loginError && (
            <div className="admin-login-alert">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{loginError}</span>
            </div>
          )}

          <form className="admin-login-form" onSubmit={handleLoginSubmit}>
            <div className="admin-form-group">
              <label htmlFor="adminUser">
                <i className="fa-solid fa-user-shield text-cyan"></i> Nama Akun / Username Admin
              </label>
              <div className="admin-input-wrap">
                <input
                  id="adminUser"
                  type="text"
                  placeholder="Ketik username admin..."
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label htmlFor="adminPass">
                <i className="fa-solid fa-key text-warning"></i> Password Admin
              </label>
              <div className="admin-input-wrap">
                <input
                  id="adminPass"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Ketik password admin..."
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="admin-pass-toggle"
                  onClick={() => setShowPass(!showPass)}
                  title={showPass ? 'Sembunyikan password' : 'Lihat password'}
                >
                  <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="admin-form-options">
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Ingat sesi saya di perangkat ini</span>
              </label>
            </div>

            <button
              type="submit"
              className="admin-login-btn"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  <span>Memverifikasi Kredensial...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-right-to-bracket"></i>
                  <span>Buka Dashboard Admin</span>
                </>
              )}
            </button>
          </form>

          <div className="admin-login-footer">
            <div className="admin-credentials-hint">
              <i className="fa-solid fa-circle-info text-cyan"></i>
              <div>
                <strong>Info Akun Bawaan (Default):</strong>
                <p>Username: <code>admin</code> • Password: <code>adminchaiz123</code></p>
                <small>Bisa diubah kapan saja di menu pengaturan dashboard setelah login.</small>
              </div>
            </div>

            <a href="/" className="admin-back-to-store">
              <i className="fa-solid fa-store"></i> Kembali ke Toko ChaizStore
            </a>
          </div>
        </div>

        {/* Toast Container */}
        <div className="admin-toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`admin-toast-card toast-${t.type}`}>
              <i className={`fa-solid ${t.icon}`}></i>
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: DASHBOARD UTAMA ADMIN (AUTHENTICATED)
  // =========================================================================
  return (
    <div className="admin-dashboard-wrapper">
      {/* Top Navbar Admin */}
      <header className="admin-navbar">
        <div className="admin-nav-container">
          <div className="admin-brand-group">
            <a href="/admin.html" className="admin-logo">
              <span className="admin-logo-icon">
                <i className="fa-solid fa-shield-halved"></i>
              </span>
              <div className="admin-logo-info">
                <strong className="admin-brand-title">CHAIZSTORE <span>ADMIN</span></strong>
                <span className="admin-brand-sub">User & Activity Control Center</span>
              </div>
            </a>
          </div>

          <div className="admin-nav-actions">
            <div className="admin-live-pulse">
              <span className="pulse-dot"></span>
              <span>Live Sync Online</span>
            </div>

            <button
              type="button"
              className={`admin-nav-btn ${adminSoundOn ? 'btn-sound-active' : 'btn-sound-muted'}`}
              onClick={() => {
                const nextState = !adminSoundOn;
                setAdminSoundOn(nextState);
                setSoundEnabled(nextState);
                if (nextState) {
                  playAdminOrderSound();
                  showToast('Suara notifikasi pesanan AKTIF! (Bel berbunyi)', 'fa-volume-high text-success', 'success');
                } else {
                  showToast('Suara notifikasi dibisukan (MUTE)', 'fa-volume-xmark text-muted', 'info');
                }
              }}
              style={{
                background: adminSoundOn ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.16)',
                border: adminSoundOn ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(239, 68, 68, 0.4)',
                color: adminSoundOn ? '#34d399' : '#fca5a5',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title={adminSoundOn ? 'Suara notifikasi pesanan aktif. Klik untuk matikan suara.' : 'Suara notifikasi pesanan nonaktif. Klik untuk menyalakan.'}
            >
              <i className={`fa-solid ${adminSoundOn ? 'fa-bell text-warning' : 'fa-bell-slash text-danger'}`}></i>
              <span>{adminSoundOn ? 'Suara: ON' : 'Suara: OFF'}</span>
            </button>

            <button
              type="button"
              className="admin-nav-btn btn-store"
              onClick={() => window.open('/', '_blank')}
              title="Buka Website Toko Utama di Tab Baru"
            >
              <i className="fa-solid fa-arrow-up-right-from-square"></i>
              <span>Buka Toko ↗</span>
            </button>

            <button
              type="button"
              className="admin-nav-btn btn-settings"
              onClick={() => {
                setNewUsername(getAdminCredentials().username);
                setIsChangeCredsOpen(true);
              }}
              title="Ganti Nama Akun & Password Admin"
            >
              <i className="fa-solid fa-key"></i>
              <span>Ganti Password</span>
            </button>

            <button
              type="button"
              className="admin-nav-btn btn-logout"
              onClick={handleLogout}
              title="Keluar dari Portal Admin"
            >
              <i className="fa-solid fa-right-from-bracket"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="admin-main-container">
        {/* Navigation 2 Menu Utama: 1. DAFTAR PENGGUNA & STATUS | 2. AKTIVITAS */}
        <section className="admin-tab-nav-section">
          <div className="admin-tabs-nav-bar">
            {/* Menu 1 */}
            <button
              type="button"
              className={`admin-nav-tab ${activeAdminTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveAdminTab('users')}
            >
              <div className="nav-tab-icon">
                <i className="fa-solid fa-users-gear"></i>
              </div>
              <div className="nav-tab-text">
                <strong>1. Jumlah & Daftar Pengguna</strong>
                <span>Presensi Online/Offline, Sesi Login, & Sanksi Banned Pengguna</span>
              </div>
              <span className="nav-tab-counter">{registeredUsers.length}</span>
            </button>

            {/* Menu 2 */}
            <button
              type="button"
              className={`admin-nav-tab ${activeAdminTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveAdminTab('activity')}
            >
              <div className="nav-tab-icon">
                <i className="fa-solid fa-clock-rotate-left"></i>
              </div>
              <div className="nav-tab-text">
                <strong>2. Aktivitas</strong>
                <span>Catatan Kronologis Interaksi & Riwayat Pengguna Realtime</span>
              </div>
              <span className="nav-tab-counter">{activityLogs.length}</span>
            </button>

            {/* Menu 3: GUDANG (RESTOCK AKUN) */}
            <button
              type="button"
              className={`admin-nav-tab ${activeAdminTab === 'gudang' ? 'active' : ''}`}
              onClick={() => setActiveAdminTab('gudang')}
            >
              <div className="nav-tab-icon">
                <i className="fa-solid fa-warehouse"></i>
              </div>
              <div className="nav-tab-text">
                <strong>3. Gudang (Restock Akun)</strong>
                <span>Restock Akun Gemini, YouTube & Tambah Akun / Manuality</span>
              </div>
              <span className="nav-tab-counter">{productsList.length}</span>
            </button>

            {/* Menu 4: PESANAN MASUK (TRANSAKSI) */}
            <button
              type="button"
              className={`admin-nav-tab ${activeAdminTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveAdminTab('orders')}
            >
              <div className="nav-tab-icon">
                <i className="fa-solid fa-receipt"></i>
              </div>
              <div className="nav-tab-text">
                <strong>4. Pesanan Masuk</strong>
                <span>Proses Pesanan, Kirim Akun/PW/PIN/Code, & Catatan Khusus</span>
              </div>
              <span className={`nav-tab-counter ${pendingOrdersCount > 0 ? 'badge-alert-pulse' : ''}`}>
                {ordersList.length}
              </span>
            </button>
          </div>
        </section>

        {/* ===================================================================
            MENU 1: JUMLAH & DAFTAR PENGGUNA (DENGAN FITUR BANNED PENGGUNA)
            =================================================================== */}
        {activeAdminTab === 'users' && (
          <div className="tab-pane-content">
            {/* Header & Quick Action Bar */}
            <section className="admin-welcome-bar">
              <div className="welcome-text">
                <h2>Jumlah & Daftar Pengguna</h2>
                <p>
                  Pantau seluruh pengguna yang pernah login ke web toko. Admin dapat memantau presensi <strong>🟢 Sedang Online</strong> vs <strong>⚪ Offline</strong>, status <strong>Masih Login</strong> vs <strong>Log Out</strong>, serta melakukan <strong>🚫 Banned Sementara</strong> (durasi dapat diatur) maupun <strong>⛔ Banned Permanen</strong> langsung dari sini.
                </p>
              </div>

              <div className="admin-quick-actions">
                <button
                  type="button"
                  className="admin-action-btn action-refresh"
                  onClick={() => {
                    reloadAllData();
                    showToast('Data pengguna dimuat ulang!', 'fa-arrows-rotate');
                  }}
                  title="Muat ulang data pengguna"
                >
                  <i className="fa-solid fa-arrows-rotate"></i>
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  className="admin-action-btn action-export-csv"
                  onClick={handleExportUsersCSV}
                  title="Unduh daftar pengguna format Excel / CSV"
                >
                  <i className="fa-solid fa-file-csv"></i>
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  className="admin-action-btn action-demo"
                  onClick={handleSimulateActiveUser}
                  title="Tambahkan simulasi user sedang aktif"
                >
                  <i className="fa-solid fa-user-plus"></i>
                  <span>Simulasi User Aktif</span>
                </button>

                {registeredUsers.length > 0 && (
                  <button
                    type="button"
                    className="admin-action-btn action-clear"
                    onClick={handleResetUsers}
                    title="Kosongkan daftar pengguna"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                    <span>Reset Pengguna</span>
                  </button>
                )}
              </div>
            </section>

            {/* 5 Stats Cards Pengguna */}
            <section className="admin-stats-grid">
              <div className="admin-stat-card card-total">
                <div className="stat-card-icon">
                  <i className="fa-solid fa-users"></i>
                </div>
                <div className="stat-card-info">
                  <span className="stat-label">Total Pengguna Terdaftar</span>
                  <strong className="stat-value">{userStats.total}</strong>
                  <small className="stat-sub">Akun yang pernah login ke toko</small>
                </div>
              </div>

              <div className="admin-stat-card card-today">
                <div className="stat-card-icon">
                  <i className="fa-solid fa-circle-dot text-success pulse-anim"></i>
                </div>
                <div className="stat-card-info">
                  <span className="stat-label">Sedang Online Sekarang</span>
                  <strong className="stat-value text-success">{userStats.onlineCount}</strong>
                  <small className="stat-sub">Aktif dalam 40 detik terakhir</small>
                </div>
              </div>

              <div className="admin-stat-card card-total">
                <div className="stat-card-icon">
                  <i className="fa-solid fa-key text-cyan"></i>
                </div>
                <div className="stat-card-info">
                  <span className="stat-label">Masih Login (Sesi Aktif)</span>
                  <strong className="stat-value text-cyan">{userStats.loggedInCount}</strong>
                  <small className="stat-sub">Sesi login masih tersimpan</small>
                </div>
              </div>

              <div className="admin-stat-card card-local">
                <div className="stat-card-icon">
                  <i className="fa-solid fa-right-from-bracket text-muted"></i>
                </div>
                <div className="stat-card-info">
                  <span className="stat-label">Sudah Log Out</span>
                  <strong className="stat-value">{userStats.loggedOutCount}</strong>
                  <small className="stat-sub">Telah klik keluar dari akun</small>
                </div>
              </div>

              <div className="admin-stat-card card-banned">
                <div className="stat-card-icon">
                  <i className="fa-solid fa-user-slash text-danger"></i>
                </div>
                <div className="stat-card-info">
                  <span className="stat-label">Terkena Sanksi Banned</span>
                  <strong className="stat-value text-danger">{userStats.bannedCount}</strong>
                  <small className="stat-sub">Diblokir sementara / permanen</small>
                </div>
              </div>
            </section>

            {/* Filter & Search Bar Pengguna */}
            <section className="admin-table-controls">
              <div className="admin-filter-pills">
                <button
                  type="button"
                  className={`filter-pill ${userFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setUserFilter('all')}
                >
                  <i className="fa-solid fa-list"></i> Semua ({registeredUsers.length})
                </button>

                <button
                  type="button"
                  className={`filter-pill filter-pill-online ${userFilter === 'online' ? 'active' : ''}`}
                  onClick={() => setUserFilter('online')}
                >
                  <span className="online-dot"></span> Sedang Online ({userStats.onlineCount})
                </button>

                <button
                  type="button"
                  className={`filter-pill ${userFilter === 'offline' ? 'active' : ''}`}
                  onClick={() => setUserFilter('offline')}
                >
                  <span className="offline-dot"></span> Offline ({userStats.offlineCount})
                </button>

                <button
                  type="button"
                  className={`filter-pill ${userFilter === 'logged_in' ? 'active' : ''}`}
                  onClick={() => setUserFilter('logged_in')}
                >
                  <i className="fa-solid fa-key text-cyan"></i> Masih Login ({userStats.loggedInCount})
                </button>

                <button
                  type="button"
                  className={`filter-pill ${userFilter === 'logged_out' ? 'active' : ''}`}
                  onClick={() => setUserFilter('logged_out')}
                >
                  <i className="fa-solid fa-right-from-bracket text-muted"></i> Log Out ({userStats.loggedOutCount})
                </button>

                <button
                  type="button"
                  className={`filter-pill filter-pill-banned ${userFilter === 'banned' ? 'active' : ''}`}
                  onClick={() => setUserFilter('banned')}
                >
                  <i className="fa-solid fa-ban text-danger"></i> Terkena Banned ({userStats.bannedCount})
                </button>
              </div>

              <div className="admin-search-wrapper">
                <i className="fa-solid fa-magnifying-glass search-icon"></i>
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Cari nama, email, alasan banned, perangkat..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                />
                {userSearchQuery && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setUserSearchQuery('')}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
            </section>

            {/* Tabel Daftar Pengguna */}
            <section className="admin-table-card">
              <div className="table-responsive">
                <table className="admin-users-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Pengguna</th>
                      <th>Email Akun</th>
                      <th>Presensi (Online / Offline)</th>
                      <th>Status Sesi Login</th>
                      <th>Status Akun & Banned</th>
                      <th>Terakhir Aktif</th>
                      <th>Perangkat</th>
                      <th style={{ textAlign: 'center' }}>Kelola & Sanksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="empty-table-state">
                          <div className="empty-box">
                            <i className="fa-solid fa-user-slash empty-icon"></i>
                            <h3>Tidak Ada Pengguna Ditemukan</h3>
                            <p>
                              {userSearchQuery
                                ? `Tidak ada pengguna yang cocok dengan pencarian "${userSearchQuery}".`
                                : 'Setiap kali ada pengunjung yang login di toko ChaizStore, datanya akan otomatis masuk ke daftar pengguna ini.'}
                            </p>
                            <button
                              type="button"
                              className="btn-seed-demo"
                              onClick={handleSimulateActiveUser}
                            >
                              <i className="fa-solid fa-user-plus"></i> Tambah Simulasi Pengguna
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u, index) => {
                        const online = isUserOnline(u);
                        const isLoggedOut = u.sessionStatus === 'logged_out';
                        const isBanned = Boolean(u.banStatus?.isBanned);
                        const isPermanentBan = isBanned && u.banStatus.banType === 'permanent';

                        return (
                          <tr key={u.id} className={`user-log-row ${online ? 'row-user-online' : ''} ${isBanned ? 'row-user-banned' : ''}`}>
                            <td className="col-num">{index + 1}</td>

                            {/* Nama & Avatar */}
                            <td className="col-user">
                              <div className="user-cell-wrap">
                                <div className="avatar-with-presence">
                                  {u.picture ? (
                                    <img
                                      src={u.picture}
                                      alt={u.name}
                                      className="user-avatar-small"
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="user-avatar-initial">
                                      {(u.name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <span className={`avatar-status-badge ${online ? 'status-online' : 'status-offline'}`}></span>
                                </div>
                                <div className="user-name-box">
                                  <strong>{u.name || 'Pengguna'}</strong>
                                  <span className="user-id-sub">ID: {u.id.slice(-6)}</span>
                                </div>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="col-email">
                              <div className="email-cell-wrap">
                                <span className="email-text">{u.email}</span>
                                {u.email && u.email !== '-' && (
                                  <button
                                    type="button"
                                    className="copy-email-btn"
                                    onClick={() => {
                                      navigator.clipboard?.writeText(u.email);
                                      showToast(`Email ${u.email} disalin!`, 'fa-copy');
                                    }}
                                    title="Salin email"
                                  >
                                    <i className="fa-regular fa-copy"></i>
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Presensi: Sedang Online vs Offline */}
                            <td className="col-presence">
                              {online ? (
                                <div className="presence-badge presence-online">
                                  <span className="online-dot"></span>
                                  <span>Sedang Online</span>
                                </div>
                              ) : (
                                <div className="presence-badge presence-offline">
                                  <span className="offline-dot"></span>
                                  <span>Offline</span>
                                </div>
                              )}
                            </td>

                            {/* Status Sesi: Masih Login vs Log Out */}
                            <td className="col-session">
                              {isLoggedOut ? (
                                <div className="session-badge session-logged-out">
                                  <i className="fa-solid fa-right-from-bracket"></i>
                                  <span>Log Out</span>
                                </div>
                              ) : (
                                <div className="session-badge session-logged-in">
                                  <i className="fa-solid fa-key"></i>
                                  <span>Masih Login</span>
                                </div>
                              )}
                            </td>

                            {/* Status Akun & Banned */}
                            <td className="col-banned-status">
                              {isBanned ? (
                                isPermanentBan ? (
                                  <div className="banned-pill pill-perm-banned" title={`Alasan: ${u.banStatus.reason}`}>
                                    <i className="fa-solid fa-ban"></i>
                                    <div className="banned-pill-text">
                                      <strong>Banned Permanen</strong>
                                      <small>Akses Toko Diblokir</small>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="banned-pill pill-temp-banned" title={`Alasan: ${u.banStatus.reason}`}>
                                    <i className="fa-solid fa-user-lock"></i>
                                    <div className="banned-pill-text">
                                      <strong>Banned Sementara</strong>
                                      <small>{formatBanRemaining(u.banStatus.bannedUntil)}</small>
                                    </div>
                                  </div>
                                )
                              ) : (
                                <div className="banned-pill pill-normal">
                                  <i className="fa-solid fa-circle-check text-success"></i>
                                  <span>Normal / Aktif</span>
                                </div>
                              )}
                            </td>

                            {/* Waktu Terakhir Aktif */}
                            <td className="col-time">
                              <div className="time-cell-wrap">
                                <strong className="time-relative">{formatTimeAgo(u.lastActiveTime || u.firstLoginTime)}</strong>
                                <small className="time-full">
                                  {new Date(u.lastActiveTime || u.firstLoginTime || Date.now()).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })} WIB
                                </small>
                              </div>
                            </td>

                            {/* Perangkat & OS */}
                            <td className="col-device">
                              <div className="device-cell-wrap">
                                <div className="device-top">
                                  <i className={`fa-solid ${u.isMobile ? 'fa-mobile-screen-button text-cyan' : 'fa-laptop text-warning'}`}></i>
                                  <strong>{u.os || 'OS'}</strong>
                                </div>
                                <span className="browser-sub">{u.browser || 'Browser'}</span>
                              </div>
                            </td>

                            {/* Kelola & Sanksi (Banned / Unban, Riwayat, Detail, Hapus) */}
                            <td className="col-actions">
                              <div className="action-buttons-wrap">
                                {/* Tombol Banned / Unban */}
                                {isBanned ? (
                                  <button
                                    type="button"
                                    className="btn-tbl-action btn-unban"
                                    onClick={() => handleExecuteUnban(u)}
                                    title="Cabut Sanksi Banned (Pulihkan Akun Pengguna)"
                                  >
                                    <i className="fa-solid fa-user-check"></i>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn-tbl-action btn-ban"
                                    onClick={() => handleOpenBanModal(u)}
                                    title="Banned Pengguna dari Web (Sementara / Permanen)"
                                  >
                                    <i className="fa-solid fa-ban"></i>
                                  </button>
                                )}

                                {/* Riwayat Aksi Pengguna */}
                                <button
                                  type="button"
                                  className="btn-tbl-action btn-history"
                                  onClick={() => setSelectedUserForHistory(u)}
                                  title="Lihat Riwayat Aktivitas Pengguna Ini"
                                >
                                  <i className="fa-solid fa-clock-rotate-left"></i>
                                  <span className="btn-act-count">{u.activitiesCount || 1}</span>
                                </button>

                                {/* Detail Profil */}
                                <button
                                  type="button"
                                  className="btn-tbl-action btn-view"
                                  onClick={() => setSelectedUserDetail(u)}
                                  title="Lihat Detail Pengguna"
                                >
                                  <i className="fa-solid fa-eye"></i>
                                </button>

                                {/* Hapus Data */}
                                <button
                                  type="button"
                                  className="btn-tbl-action btn-del"
                                  onClick={() => handleDeleteUser(u.id)}
                                  title="Hapus dari daftar pengguna"
                                >
                                  <i className="fa-solid fa-trash-can"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ===================================================================
            MENU 2: AKTIVITAS (HISTORY AKTIF PENGGUNA)
            =================================================================== */}
        {activeAdminTab === 'activity' && (
          <div className="tab-pane-content">
            {/* Header Bar */}
            <section className="admin-welcome-bar">
              <div className="welcome-text">
                <h2>Aktivitas Pengguna</h2>
                <p>
                  Catatan kronologis realtime seluruh interaksi pengguna di toko: proses login/logout, sanksi banned/unban admin, membuka halaman Top Up, memasukkan barang ke keranjang, hingga transaksi belanja.
                </p>
              </div>

              <div className="admin-quick-actions">
                <button
                  type="button"
                  className="admin-action-btn action-gudang"
                  style={{
                    background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                    color: '#ffffff',
                    borderColor: '#38bdf8',
                    fontWeight: 700
                  }}
                  onClick={() => setActiveAdminTab('gudang')}
                  title="Buka Gudang Restock Akun"
                >
                  <i className="fa-solid fa-warehouse"></i>
                  <span>Gudang Restock</span>
                </button>

                <button
                  type="button"
                  className="admin-action-btn action-refresh"
                  onClick={() => {
                    reloadAllData();
                    showToast('History aktivitas dimuat ulang!', 'fa-arrows-rotate');
                  }}
                  title="Muat ulang aktivitas"
                >
                  <i className="fa-solid fa-arrows-rotate"></i>
                  <span>Refresh</span>
                </button>

                {activityLogs.length > 0 && (
                  <button
                    type="button"
                    className="admin-action-btn action-clear"
                    onClick={handleResetActivities}
                    title="Kosongkan seluruh riwayat aktivitas"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                    <span>Reset Aktivitas</span>
                  </button>
                )}
              </div>
            </section>

            {/* Stats Cards Aktivitas */}
            <section className="admin-stats-grid">
              <div className="admin-stat-card card-total">
                <div className="stat-card-icon">
                  <i className="fa-solid fa-clock-rotate-left"></i>
                </div>
                <div className="stat-card-info">
                  <span className="stat-label">Total Aktivitas Tercatat</span>
                  <strong className="stat-value">{activityStats.total}</strong>
                  <small className="stat-sub">Seluruh log interaksi toko</small>
                </div>
              </div>

              <div className="admin-stat-card card-today">
                <div className="stat-card-icon">
                  <i className="fa-solid fa-bolt text-warning"></i>
                </div>
                <div className="stat-card-info">
                  <span className="stat-label">Aktivitas 24 Jam Terakhir</span>
                  <strong className="stat-value">{activityStats.todayCount}</strong>
                  <small className="stat-sub">Kunjungan dan aksi hari ini</small>
                </div>
              </div>

              <div className="admin-stat-card card-banned">
                <div className="stat-card-icon">
                  <i className="fa-solid fa-shield-halved text-danger"></i>
                </div>
                <div className="stat-card-info">
                  <span className="stat-label">Sanksi Banned & Keamanan</span>
                  <strong className="stat-value text-danger">{activityStats.bannedCount}</strong>
                  <small className="stat-sub">Aksi penegakan aturan admin</small>
                </div>
              </div>

              <div className="admin-stat-card card-total">
                <div className="stat-card-icon">
                  <i className="fa-solid fa-cart-shopping text-cyan"></i>
                </div>
                <div className="stat-card-info">
                  <span className="stat-label">Keranjang & Belanja</span>
                  <strong className="stat-value text-cyan">{activityStats.cartCount}</strong>
                  <small className="stat-sub">Aktivitas minat beli produk</small>
                </div>
              </div>
            </section>

            {/* Filter & Search Bar Aktivitas */}
            <section className="admin-table-controls">
              <div className="admin-filter-pills">
                <button
                  type="button"
                  className={`filter-pill ${activityFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setActivityFilter('all')}
                >
                  <i className="fa-solid fa-list"></i> Semua Aktivitas ({activityLogs.length})
                </button>

                <button
                  type="button"
                  className={`filter-pill ${activityFilter === 'auth' ? 'active' : ''}`}
                  onClick={() => setActivityFilter('auth')}
                >
                  <i className="fa-solid fa-key text-cyan"></i> Login & Logout
                </button>

                <button
                  type="button"
                  className={`filter-pill filter-pill-banned ${activityFilter === 'banned' ? 'active' : ''}`}
                  onClick={() => setActivityFilter('banned')}
                >
                  <i className="fa-solid fa-ban text-danger"></i> Banned & Keamanan ({activityStats.bannedCount})
                </button>

                <button
                  type="button"
                  className={`filter-pill ${activityFilter === 'cart' ? 'active' : ''}`}
                  onClick={() => setActivityFilter('cart')}
                >
                  <i className="fa-solid fa-cart-shopping text-success"></i> Keranjang & Beli ({activityStats.cartCount})
                </button>

                <button
                  type="button"
                  className={`filter-pill ${activityFilter === 'topup' ? 'active' : ''}`}
                  onClick={() => setActivityFilter('topup')}
                >
                  <i className="fa-solid fa-gamepad text-warning"></i> Menu Top Up
                </button>

                <button
                  type="button"
                  className={`filter-pill ${activityFilter === 'today' ? 'active' : ''}`}
                  onClick={() => setActivityFilter('today')}
                >
                  <i className="fa-solid fa-clock text-cyan"></i> Hari Ini ({activityStats.todayCount})
                </button>
              </div>

              <div className="admin-search-wrapper">
                <i className="fa-solid fa-magnifying-glass search-icon"></i>
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Cari aktivitas, aksi, nama user, atau email..."
                  value={activitySearchQuery}
                  onChange={(e) => setActivitySearchQuery(e.target.value)}
                />
                {activitySearchQuery && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setActivitySearchQuery('')}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
            </section>

            {/* Tabel History Aktivitas */}
            <section className="admin-table-card">
              <div className="table-responsive">
                <table className="admin-users-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Waktu Aktivitas</th>
                      <th>Pengguna</th>
                      <th>Tipe Aksi</th>
                      <th>Rincian Aktivitas Pengguna</th>
                      <th>Perangkat</th>
                      <th style={{ textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivities.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="empty-table-state">
                          <div className="empty-box">
                            <i className="fa-solid fa-clock-rotate-left empty-icon"></i>
                            <h3>Belum Ada Riwayat Aktivitas</h3>
                            <p>
                              {activitySearchQuery
                                ? `Tidak ada aktivitas yang cocok dengan pencarian "${activitySearchQuery}".`
                                : 'Setiap aksi pengguna seperti login, membuka halaman top up, memasukkan barang ke keranjang, atau sanksi banned admin otomatis tercatat di sini.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredActivities.map((act, index) => {
                        const badgeInfo = getActionBadge(act.actionType);

                        return (
                          <tr key={act.id} className="user-log-row">
                            <td className="col-num">{index + 1}</td>

                            {/* Waktu */}
                            <td className="col-time">
                              <div className="time-cell-wrap">
                                <strong className="time-relative">{formatTimeAgo(act.timestamp)}</strong>
                                <small className="time-full">
                                  {new Date(act.timestamp).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  })}{' '}
                                  • {new Date(act.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </small>
                              </div>
                            </td>

                            {/* User */}
                            <td className="col-user">
                              <div className="user-cell-wrap">
                                {act.userPicture ? (
                                  <img
                                    src={act.userPicture}
                                    alt={act.userName}
                                    className="user-avatar-small"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="user-avatar-initial">
                                    {(act.userName || 'U').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="user-name-box">
                                  <strong>{act.userName}</strong>
                                  <span className="user-id-sub">{act.userEmail}</span>
                                </div>
                              </div>
                            </td>

                            {/* Tipe Aksi */}
                            <td className="col-method">
                              <span className={`activity-type-badge ${badgeInfo.className}`}>
                                <i className={`fa-solid ${badgeInfo.icon}`}></i>
                                <span>{badgeInfo.label}</span>
                              </span>
                            </td>

                            {/* Rincian Aktivitas */}
                            <td className="col-desc">
                              <div className="activity-desc-cell">
                                <span className="activity-desc-text">{act.description}</span>
                              </div>
                            </td>

                            {/* Perangkat */}
                            <td className="col-device">
                              <span className="device-simple-text">{act.device || '-'}</span>
                            </td>

                            {/* Aksi */}
                            <td className="col-actions">
                              <button
                                type="button"
                                className="btn-tbl-action btn-del"
                                onClick={() => {
                                  deleteActivityLog(act.id);
                                  setActivityLogs(getActivityLogs());
                                  showToast('Item aktivitas dihapus.', 'fa-trash-can');
                                }}
                                title="Hapus log aktivitas ini"
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ===================================================================
            MENU 3: GUDANG (RESTOCK AKUN & DATABASE INVENTARIS)
            =================================================================== */}
        {activeAdminTab === 'gudang' && (
          <div className="tab-pane-content">
            {/* Header & Quick Action Bar */}
            <section className="admin-welcome-bar">
              <div className="welcome-text">
                <h2>Gudang & Database Restock Akun</h2>
                <p>
                  Pusat kontrol database inventaris seluruh akun premium (Gemini, YouTube, Canva, CapCut, Netflix, dll). Klik salah satu produk untuk <strong>Menambahkan Akun & Password</strong> (otomatis menambah restock) atau gunakan mode <strong>Manuality</strong> untuk mengatur jumlah stok langsung realtime ke pembeli.
                </p>
              </div>

              <div className="admin-quick-actions">
                <button
                  type="button"
                  className="admin-action-btn action-refresh"
                  onClick={() => {
                    setProductsList(getDatabaseProducts());
                    showToast('Data gudang & database restock dimuat ulang!', 'fa-arrows-rotate');
                  }}
                  title="Muat ulang data stok gudang"
                >
                  <i className="fa-solid fa-arrows-rotate"></i>
                  <span>Refresh Gudang</span>
                </button>
              </div>
            </section>

            {/* Stats Cards Gudang */}
            <section className="admin-stats-grid">
              <div className="admin-stat-card card-total">
                <div className="stat-card-icon">
                  <i className="fa-solid fa-layer-group text-cyan"></i>
                </div>
                <div className="stat-card-info">
                  <span className="stat-label">Total Produk di Database</span>
                  <strong className="stat-value">{gudangStats.totalProducts}</strong>
                  <small className="stat-sub">Item katalog akun premium</small>
                </div>
              </div>

              <div className="admin-stat-card card-today">
                <div className="stat-card-icon">
                  <i className="fa-solid fa-boxes-stacked text-success"></i>
                </div>
                <div className="stat-card-info">
                  <span className="stat-label">Total Stok Siap Kirim</span>
                  <strong className="stat-value text-success">{gudangStats.totalStock}</strong>
                  <small className="stat-sub">Akun ready di toko</small>
                </div>
              </div>

              <div className="admin-stat-card card-online">
                <div className="stat-card-icon">
                  <i className="fa-solid fa-vault text-warning"></i>
                </div>
                <div className="stat-card-info">
                  <span className="stat-label">Akun Tersimpan di Vault</span>
                  <strong className="stat-value text-warning">{gudangStats.totalAccounts}</strong>
                  <small className="stat-sub">Kredensial email & pass</small>
                </div>
              </div>

              <div className="admin-stat-card card-banned">
                <div className="stat-card-icon">
                  <i className="fa-solid fa-triangle-exclamation text-danger"></i>
                </div>
                <div className="stat-card-info">
                  <span className="stat-label">Perlu Restock Segera</span>
                  <strong className="stat-value text-danger">{gudangStats.lowStockCount}</strong>
                  <small className="stat-sub">Stok ≤ 3 atau kosong</small>
                </div>
              </div>
            </section>

            {/* Filter & Search Bar Gudang (Redesigned) */}
            <section className="gudang-controls-card">
              <div className="gudang-controls-top">
                <div className="gudang-search-box">
                  <div className="search-icon-wrap">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </div>
                  <input
                    type="text"
                    className="gudang-search-input"
                    placeholder="Cari produk restock (Gemini, YouTube, Canva, CapCut, Netflix...)..."
                    value={gudangSearch}
                    onChange={(e) => setGudangSearch(e.target.value)}
                  />
                  {gudangSearch && (
                    <button
                      type="button"
                      className="gudang-clear-btn"
                      onClick={() => setGudangSearch('')}
                      title="Hapus pencarian"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  )}
                </div>

                <div className="gudang-search-meta">
                  <span className="search-result-pill">
                    <i className="fa-solid fa-cubes text-cyan"></i>
                    <span>Menampilkan <strong>{filteredGudangProducts.length}</strong> dari <strong>{productsList.length}</strong> Produk</span>
                  </span>
                </div>
              </div>

              <div className="gudang-filter-scroll">
                <div className="gudang-filter-tabs">
                  {[
                    { id: 'all', label: 'Semua Produk', icon: 'fa-solid fa-shapes', color: '#38bdf8', count: productsList.length },
                    { id: 'ai', label: 'AI (Gemini / Grok)', icon: 'fa-solid fa-wand-magic-sparkles', color: '#06b6d4', count: productsList.filter(p => p.category === 'ai').length },
                    { id: 'streaming', label: 'Streaming & Video', icon: 'fa-solid fa-film', color: '#f43f5e', count: productsList.filter(p => p.category === 'streaming').length },
                    { id: 'produktivitas', label: 'Produktivitas & Desain', icon: 'fa-solid fa-palette', color: '#10b981', count: productsList.filter(p => p.category === 'produktivitas').length },
                    { id: 'musik', label: 'Musik', icon: 'fa-solid fa-headphones', color: '#22c55e', count: productsList.filter(p => p.category === 'musik').length },
                    { id: 'low', label: 'Stok Menipis / Kosong', icon: 'fa-solid fa-triangle-exclamation', color: '#f59e0b', count: gudangStats.lowStockCount, isAlert: true }
                  ].map((tab) => {
                    const isActive = gudangCategory === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        className={`gudang-tab-pill ${isActive ? 'active' : ''} ${tab.isAlert ? 'tab-alert' : ''}`}
                        onClick={() => setGudangCategory(tab.id)}
                      >
                        <i className={tab.icon} style={{ color: isActive ? 'inherit' : tab.color }}></i>
                        <span className="tab-label">{tab.label}</span>
                        <span className="tab-counter-badge">{tab.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Products Grid Gudang */}
            <section className="gudang-products-section">
              <div className="gudang-grid">
                {filteredGudangProducts.map((prod) => {
                  const s = typeof prod.stock === 'number' ? prod.stock : 0;
                  const isZero = s === 0;
                  const isLow = s > 0 && s <= 5;
                  const accountsCount = Array.isArray(prod.accounts) ? prod.accounts.length : 0;

                  return (
                    <div
                      key={prod.id}
                      className={`gudang-card ${isZero ? 'stock-empty' : isLow ? 'stock-low' : 'stock-ok'}`}
                      onClick={() => handleOpenRestockModal(prod)}
                      title={`Klik untuk kelola restock ${prod.name}`}
                    >
                      <div className="gudang-card-header">
                        <div className="gudang-item-avatar">
                          {prod.image ? (
                            <img
                              src={`/${prod.image}`}
                              alt={prod.name}
                              className="gudang-item-img"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <i className={prod.icon || 'fa-solid fa-box'} style={{ color: prod.iconColor || '#38bdf8' }}></i>
                          )}
                        </div>
                        <div className="gudang-item-meta">
                          <span className="gudang-cat-badge">{prod.category.toUpperCase()}</span>
                          <h3 className="gudang-item-name">{prod.name}</h3>
                          <span className="gudang-warranty">
                            <i className="fa-solid fa-shield-check text-cyan"></i> Garansi {prod.warranty}
                          </span>
                        </div>
                      </div>

                      <div className="gudang-stock-indicator">
                        <div className="indicator-label-row">
                          <span className="text-muted">Status Stok:</span>
                          <strong className={isZero ? 'text-danger' : isLow ? 'text-warning' : 'text-success'}>
                            {isZero ? '⛔ Stok Kosong' : isLow ? `⚠️ Menipis (${s} Akun)` : `🟢 Ready (${s} Akun)`}
                          </strong>
                        </div>
                        <div className="gudang-stock-bar">
                          <div
                            className={`gudang-stock-fill ${isZero ? 'fill-empty' : isLow ? 'fill-low' : 'fill-ok'}`}
                            style={{ width: `${Math.min(100, Math.max(isZero ? 0 : 8, (s / 30) * 100))}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="gudang-card-footer">
                        <div className="gudang-vault-pill" title="Jumlah akun tersimpan di database vault">
                          <i className="fa-solid fa-vault text-warning"></i>
                          <span>{accountsCount} Akun Vault</span>
                        </div>
                        <button
                          type="button"
                          className="btn-kelola-restock"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRestockModal(prod);
                          }}
                        >
                          <i className="fa-solid fa-boxes-packing"></i>
                          <span>Kelola Restock</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredGudangProducts.length === 0 && (
                <div className="admin-empty-state">
                  <i className="fa-solid fa-boxes-stacked"></i>
                  <h3>Produk Tidak Ditemukan</h3>
                  <p>Tidak ada produk yang cocok dengan pencarian "{gudangSearch}".</p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ===================================================================
            MENU 4: PESANAN MASUK (TRANSAKSI & ORDER FULFILLMENT)
            =================================================================== */}
        {activeAdminTab === 'orders' && (
          <div className="tab-pane-content">
            {/* Header & Description */}
            <section className="admin-welcome-bar">
              <div className="welcome-text">
                <h2>Pesanan Masuk & Pengiriman Akun</h2>
                <p>
                  Pantau pesanan pelanggan dari toko online secara realtime. Buka pesanan untuk mengirimkan detail kredensial akun
                  (<strong>Email/Akun, Password, Username, PIN, Profil, Kode Key</strong>) serta <strong>Catatan Khusus Admin</strong>.
                  Data akun yang dikirimkan akan langsung tersinkronisasi ke tab Transaksi pelanggan secara instan.
                </p>
              </div>

              <div className="admin-quick-actions orders-quick-actions-bar">
                <div className="orders-live-status-pill">
                  <span className="live-status-pulse"></span>
                  <span>Cloud Sync Aktif</span>
                </div>

                <button
                  type="button"
                  className="admin-action-btn action-refresh-orders"
                  onClick={handleRefreshOrders}
                  disabled={isRefreshingOrders}
                  title="Segarkan daftar pesanan langsung dari Firebase Cloud"
                >
                  <i className={`fa-solid fa-arrows-rotate ${isRefreshingOrders ? 'fa-spin' : ''}`}></i>
                  <span>{isRefreshingOrders ? 'Menyegarkan...' : 'Refresh Pesanan'}</span>
                </button>

                <button
                  type="button"
                  className="admin-action-btn action-clear-orders"
                  onClick={handleClearOrdersHistory}
                  disabled={ordersList.length === 0}
                  title={ordersList.length === 0 ? 'Riwayat pesanan sudah kosong' : 'Bersihkan semua riwayat pesanan & foto bukti kiriman'}
                >
                  <i className="fa-solid fa-trash-can"></i>
                  <span>Bersihkan Riwayat</span>
                  {ordersList.length > 0 && (
                    <span className="orders-badge-count">{ordersList.length}</span>
                  )}
                </button>
              </div>
            </section>

            {/* Stats Cards Orders */}
            <section className="admin-stats-grid">
              <div className="admin-stat-card card-total">
                <div className="stat-card-icon">
                  <i className="fa-solid fa-receipt text-cyan"></i>
                </div>
                <div className="stat-card-info">
                  <span className="stat-label">Total Semua Pesanan</span>
                  <strong className="stat-value">{ordersStats.total}</strong>
                  <small className="stat-sub">Transaksi masuk di sistem</small>
                </div>
              </div>

              <div className="admin-stat-card card-banned">
                <div className="stat-card-icon">
                  <i className="fa-solid fa-clock text-warning"></i>
                </div>
                <div className="stat-card-info">
                  <span className="stat-label">Menunggu Diproses</span>
                  <strong className="stat-value text-warning">{ordersStats.processing}</strong>
                  <small className="stat-sub">Perlu dikirimkan akun</small>
                </div>
              </div>

              <div className="admin-stat-card card-today">
                <div className="stat-card-icon">
                  <i className="fa-solid fa-circle-check text-success"></i>
                </div>
                <div className="stat-card-info">
                  <span className="stat-label">Pesanan Selesai</span>
                  <strong className="stat-value text-success">{ordersStats.completed}</strong>
                  <small className="stat-sub">Akun sukses terkirim</small>
                </div>
              </div>

              <div className="admin-stat-card card-online">
                <div className="stat-card-icon">
                  <i className="fa-solid fa-money-bill-wave text-cyan"></i>
                </div>
                <div className="stat-card-info">
                  <span className="stat-label">Total Omset Transaksi</span>
                  <strong className="stat-value text-cyan">
                    Rp {ordersStats.totalRevenue.toLocaleString('id-ID')}
                  </strong>
                  <small className="stat-sub">Akumulasi nilai penjualan</small>
                </div>
              </div>
            </section>

            {/* Controls Filter & Search */}
            <section className="gudang-controls-card">
              <div className="gudang-controls-top">
                <div className="gudang-search-box">
                  <div className="search-icon-wrap">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </div>
                  <input
                    type="text"
                    className="gudang-search-input"
                    placeholder="Cari pesanan (ID transaksi, nama pelanggan, email, nomor WA, nama produk)..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                  {orderSearch && (
                    <button
                      type="button"
                      className="gudang-clear-btn"
                      onClick={() => setOrderSearch('')}
                      title="Hapus pencarian"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  )}
                </div>

                <div className="gudang-search-meta">
                  <span className="search-result-pill">
                    <i className="fa-solid fa-list-check text-cyan"></i>
                    <span>Menampilkan <strong>{filteredOrders.length}</strong> dari <strong>{ordersList.length}</strong> Pesanan</span>
                  </span>
                </div>
              </div>

              <div className="gudang-filter-scroll">
                <div className="gudang-filter-tabs">
                  <button
                    type="button"
                    className={`gudang-tab-pill ${orderFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setOrderFilter('all')}
                  >
                    <i className="fa-solid fa-layer-group" style={{ color: '#38bdf8' }}></i>
                    <span className="tab-label">Semua Pesanan</span>
                    <span className="tab-counter-badge">{ordersList.length}</span>
                  </button>

                  <button
                    type="button"
                    className={`gudang-tab-pill ${orderFilter === 'processing' ? 'active tab-alert' : ''}`}
                    onClick={() => setOrderFilter('processing')}
                  >
                    <i className="fa-solid fa-hourglass-half" style={{ color: '#f59e0b' }}></i>
                    <span className="tab-label">Menunggu Diproses</span>
                    <span className="tab-counter-badge">{ordersStats.processing}</span>
                  </button>

                  <button
                    type="button"
                    className={`gudang-tab-pill ${orderFilter === 'completed' ? 'active' : ''}`}
                    onClick={() => setOrderFilter('completed')}
                  >
                    <i className="fa-brands fa-whatsapp" style={{ color: '#10b981' }}></i>
                    <span className="tab-label">Pesanan Selesai</span>
                    <span className="tab-counter-badge">{ordersStats.completed}</span>
                  </button>

                  <button
                    type="button"
                    className={`gudang-tab-pill ${orderFilter === 'rejected' ? 'active' : ''}`}
                    onClick={() => setOrderFilter('rejected')}
                  >
                    <i className="fa-solid fa-circle-xmark" style={{ color: '#ef4444' }}></i>
                    <span className="tab-label">Ditolak</span>
                    <span className="tab-counter-badge">{ordersStats.rejected}</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Orders Table / Cards List */}
            <section className="admin-orders-list-section">
              {filteredOrders.length === 0 ? (
                <div className="admin-empty-state">
                  <i className="fa-solid fa-receipt"></i>
                  <h3>Belum Ada Pesanan yang Sesuai</h3>
                  <p>Tidak ada data pesanan pada filter ini atau belum ada pesanan masuk dari pembeli.</p>
                </div>
              ) : (
                <div className="admin-orders-table-wrapper">
                  <table className="admin-orders-table">
                    <thead>
                      <tr>
                        <th>ID & Waktu Pesanan</th>
                        <th>Pelanggan</th>
                        <th>Produk & Garansi</th>
                        <th>Total & Bayar</th>
                        <th>Bukti Kiriman</th>
                        <th>Status</th>
                        <th>Kredensial Terkirim</th>
                        <th>Aksi Admin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => {
                        const isProcessing = order.status === 'processing';
                        const isRejected = order.status === 'rejected';
                        const hasCreds =
                          order.credentials &&
                          (order.credentials.account || order.credentials.code || order.credentials.password);
                        const proofTimeInfo = getProofTimeRemaining(order);

                        return (
                          <tr key={order.id} className={isProcessing ? 'row-processing' : isRejected ? 'row-rejected' : 'row-completed'}>
                            {/* ID & Date */}
                            <td className="cell-order-id">
                              <strong className="order-id-badge">{order.id}</strong>
                              <span className="order-date-text">
                                <i className="fa-regular fa-calendar"></i>{' '}
                                {new Date(order.createdAt).toLocaleString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </td>

                            {/* Customer */}
                            <td className="cell-customer">
                              <strong className="customer-name-text">
                                <i className="fa-solid fa-user-circle text-cyan"></i> {order.customerName || 'Pelanggan'}
                              </strong>
                              {order.customerUsername && order.customerUsername !== '-' && (
                                <span className="customer-sub-text customer-username-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                  {order.customerRobloxAvatar ? (
                                    <img src={order.customerRobloxAvatar} alt="" style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #38bdf8' }} />
                                  ) : (
                                    <i className="fa-solid fa-at text-purple"></i>
                                  )}
                                  {order.customerUsername}
                                </span>
                              )}
                              {(() => {
                                const rowEmail = order.customerEmail && order.customerEmail !== '-'
                                  ? order.customerEmail
                                  : (order.userEmail && order.userEmail !== '-' ? order.userEmail : (order.email && order.email !== '-' ? order.email : ''));
                                const rowPhone = order.customerPhone && order.customerPhone !== '-'
                                  ? order.customerPhone
                                  : (order.phone && order.phone !== '-' ? order.phone : (order.wa && order.wa !== '-' ? order.wa : ''));

                                return (
                                  <>
                                    {rowEmail ? (
                                      <span className="customer-sub-text">
                                        <i className="fa-regular fa-envelope text-warning"></i> {rowEmail}
                                      </span>
                                    ) : null}
                                    {rowPhone ? (
                                      <span className="customer-sub-text">
                                        <i className="fa-brands fa-whatsapp text-success"></i> {rowPhone}
                                      </span>
                                    ) : null}
                                  </>
                                );
                              })()}
                            </td>

                            {/* Product */}
                            <td className="cell-product">
                              <strong className="product-title-text">{order.productName}</strong>
                              <div className="product-badges-row">
                                {order.productDuration && (
                                  <span className="order-pill-duration">{order.productDuration}</span>
                                )}
                                {order.warrantyPeriod && (
                                  <span className="order-pill-warranty">
                                    <i className="fa-solid fa-shield-halved"></i> {order.warrantyPeriod}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Total & Payment */}
                            <td className="cell-payment">
                              <strong className="order-total-price">
                                Rp {Number(order.total || order.price).toLocaleString('id-ID')}
                              </strong>
                              <span className="order-pay-method">
                                <i className="fa-solid fa-wallet"></i> {order.paymentMethod || 'QRIS Instant'}
                              </span>
                              {order.qty > 1 && (
                                <small className="text-muted">Jumlah: {order.qty} pcs</small>
                              )}
                            </td>

                            {/* Bukti Kiriman (Foto Upload Pembeli) */}
                            <td className="cell-proof">
                              {order.proofUrl ? (
                                <div className="proof-action-cell">
                                  <button
                                    type="button"
                                    className="btn-admin-view-proof"
                                    onClick={() => {
                                      setProofImgError(false);
                                      setSelectedOrderProof(order);
                                    }}
                                    title="Klik untuk melihat foto bukti transfer yang dikirim pembeli"
                                  >
                                    <i className="fa-solid fa-image"></i>
                                    <span>Lihat Kiriman</span>
                                  </button>
                                  <span className="proof-timer-badge" title="Masa aktif foto sebelum terhapus otomatis (2 hari)">
                                    <i className="fa-regular fa-clock"></i> {proofTimeInfo.text}
                                  </span>
                                </div>
                              ) : order.proofExpired ? (
                                <div className="proof-expired-cell" title={order.proofDeletedReason || 'Foto bukti sudah kedaluwarsa'}>
                                  <span className="proof-expired-badge">
                                    <i className="fa-solid fa-trash-can"></i> Foto Terhapus
                                  </span>
                                  <small className="text-muted">(Masa 2 Hari)</small>
                                </div>
                              ) : (
                                <span className="text-muted" style={{ fontSize: '12px' }}>
                                  <i className="fa-solid fa-minus"></i> Tanpa Foto
                                </span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="cell-status">
                              {isProcessing ? (
                                <span className="admin-status-badge badge-processing">
                                  <span className="badge-pulse-dot"></span>
                                  <span>Menunggu Diproses</span>
                                </span>
                              ) : isRejected ? (
                                <span className="admin-status-badge badge-rejected" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.35)' }}>
                                  <i className="fa-solid fa-circle-xmark"></i>
                                  <span>Ditolak</span>
                                </span>
                              ) : (
                                <span
                                  className="admin-status-badge badge-completed"
                                  style={
                                    order.deliveryMethod === 'web'
                                      ? { background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.35)' }
                                      : undefined
                                  }
                                >
                                  <i className={order.deliveryMethod === 'web' ? 'fa-solid fa-circle-check text-emerald' : 'fa-brands fa-whatsapp'}></i>
                                  <span>{order.deliveryMethod === 'web' ? 'Selesai di Web' : 'Telah Dikirim WA'}</span>
                                </span>
                              )}

                              {order.rating && (
                                <div className="order-rating-pill" title={`Rating dari pembeli: ${order.rating.stars} bintang`}>
                                  {'★'.repeat(order.rating.stars)}{'☆'.repeat(5 - order.rating.stars)}
                                  <small>({order.rating.stars}/5)</small>
                                </div>
                              )}
                            </td>

                            {/* Credentials sent */}
                            <td className="cell-creds">
                              {hasCreds ? (
                                <div className="creds-summary-box">
                                  {order.credentials.account && (
                                    <div className="creds-summary-line">
                                      <i className="fa-solid fa-at text-cyan"></i>
                                      <span>{order.credentials.account}</span>
                                    </div>
                                  )}
                                  {order.credentials.code && (
                                    <div className="creds-summary-line">
                                      <i className="fa-solid fa-key text-warning"></i>
                                      <span>{order.credentials.code}</span>
                                    </div>
                                  )}
                                  {order.credentials.profile && (
                                    <small className="text-muted">{order.credentials.profile}</small>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted italic" style={{ fontSize: '12px' }}>
                                  Belum diisi admin
                                </span>
                              )}
                            </td>

                            {/* Actions: 1. Ceklis (Selesai Kirim WA), 2. X Merah (Tolak), 3. Pesawat Kertas Lipat (Modal 4 Pilihan) */}
                            <td className="cell-action">
                              <div className="order-actions-cell-group">
                                <button
                                  type="button"
                                  className="btn-admin-order-action-check"
                                  onClick={() => handleQuickCompleteOrder(order)}
                                  title="Ceklis: Tandai pesanan selesai & kirim notifikasi WhatsApp"
                                >
                                  <i className="fa-solid fa-check"></i>
                                </button>
                                <button
                                  type="button"
                                  className="btn-admin-order-action-reject"
                                  onClick={() => handleQuickRejectOrder(order)}
                                  title="X Merah: Proses ditolak (Pembeli dapat opsi Hubungi Admin)"
                                >
                                  <i className="fa-solid fa-xmark"></i>
                                </button>
                                <button
                                  type="button"
                                  className="btn-admin-order-action-plane"
                                  onClick={() => handleOpenFulfillModal(order)}
                                  title="Kirim Pesawat: Rombak kirim Catatan, Akun Premium, Voucer, atau Top Up"
                                >
                                  <i className="fa-solid fa-paper-plane"></i>
                                </button>
                                {order.adminProofUrl && (
                                  <button
                                    type="button"
                                    className="btn-admin-order-action-plane"
                                    style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                                    onClick={() => window.open(order.adminProofUrl, '_blank')}
                                    title="Lihat Foto Bukti Pengiriman yang Dikirim Admin"
                                  >
                                    <i className="fa-solid fa-camera"></i>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* ===================================================================
          MODAL: BANNED PENGGUNA (SEMENTARA / PERMANEN)
          =================================================================== */}
      {userToBan && (
        <div className="admin-modal-backdrop" onClick={() => setUserToBan(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="admin-modal-header" style={{ borderBottomColor: banType === 'permanent' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)' }}>
              <div className="modal-title-wrap">
                <i className={banType === 'permanent' ? 'fa-solid fa-ban text-danger' : 'fa-solid fa-user-lock text-warning'}></i>
                <h3>Sanksi Banned Pengguna: {userToBan.name}</h3>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setUserToBan(null)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleExecuteBan}>
              <div className="admin-modal-body">
                {/* User Target Card */}
                <div className="modal-user-summary mb-3">
                  <div className="avatar-with-presence">
                    {userToBan.picture ? (
                      <img src={userToBan.picture} alt={userToBan.name} className="modal-user-avatar" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="modal-user-avatar-initial">{(userToBan.name || 'U').charAt(0).toUpperCase()}</div>
                    )}
                  </div>
                  <div className="modal-user-summary-text">
                    <h4>{userToBan.name}</h4>
                    <span className="modal-email">{userToBan.email}</span>
                  </div>
                </div>

                {/* 1. Pilih Jenis Banned */}
                <div className="admin-form-group mb-3">
                  <label>Jenis Sanksi Banned <span className="text-danger">*</span></label>
                  <div className="ban-type-selector">
                    <button
                      type="button"
                      className={`ban-type-btn ${banType === 'temporary' ? 'active-temp' : ''}`}
                      onClick={() => setBanType('temporary')}
                    >
                      <i className="fa-solid fa-user-clock"></i>
                      <div>
                        <strong>Banned Sementara</strong>
                        <small>Akses diblokir dengan batas durasi tertentu</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`ban-type-btn ${banType === 'permanent' ? 'active-perm' : ''}`}
                      onClick={() => setBanType('permanent')}
                    >
                      <i className="fa-solid fa-ban"></i>
                      <div>
                        <strong>Banned Permanen</strong>
                        <small>Akses diblokir selamanya sampai di-unban</small>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Jika Banned Sementara: Atur Durasi Waktu */}
                {banType === 'temporary' && (
                  <div className="admin-form-group mb-3" style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                    <label htmlFor="durationPreset">
                      <i className="fa-solid fa-stopwatch text-warning"></i> Atur Durasi Banned Sementara <span className="text-danger">*</span>
                    </label>

                    <div className="duration-presets-grid">
                      {[
                        { label: '15 Menit', val: '15' },
                        { label: '1 Jam', val: '60' },
                        { label: '6 Jam', val: '360' },
                        { label: '24 Jam (1 Hari)', val: '1440' },
                        { label: '3 Hari', val: '4320' },
                        { label: '7 Hari', val: '10080' },
                        { label: '30 Hari', val: '43200' },
                        { label: 'Kustom Menit', val: 'custom' }
                      ].map((p) => (
                        <button
                          key={p.val}
                          type="button"
                          className={`preset-btn ${banDurationPreset === p.val ? 'active' : ''}`}
                          onClick={() => setBanDurationPreset(p.val)}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    {banDurationPreset === 'custom' && (
                      <div style={{ marginTop: '10px' }}>
                        <label style={{ fontSize: '12px', color: '#94a3b8' }}>Ketik Jumlah Durasi (Menit):</label>
                        <input
                          type="number"
                          min="1"
                          className="admin-text-input"
                          value={customBanMinutes}
                          onChange={(e) => setCustomBanMinutes(e.target.value)}
                          placeholder="Misal: 120 (2 jam)"
                          required
                        />
                      </div>
                    )}

                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#fbbf24' }}>
                      <i className="fa-solid fa-circle-info"></i> Sanksi akan otomatis kadaluarsa setelah durasi waktu habis.
                    </div>
                  </div>
                )}

                {/* 3. Alasan Banned */}
                <div className="admin-form-group mb-3">
                  <label htmlFor="banReason">Alasan Banned <span className="text-danger">*</span></label>
                  <input
                    id="banReason"
                    type="text"
                    className="admin-text-input"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Contoh: Spam pesanan, aktivitas mencurigakan..."
                    required
                  />

                  {/* Preset Alasan Cepat */}
                  <div className="reason-quick-tags">
                    {[
                      'Spam pesanan palsu',
                      'Aktivitas mencurigakan',
                      'Pelanggaran aturan toko',
                      'Pending konfirmasi admin'
                    ].map((r) => (
                      <button
                        key={r}
                        type="button"
                        className="tag-btn"
                        onClick={() => setBanReason(r)}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setUserToBan(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`btn-modal-save ${banType === 'permanent' ? 'btn-ban-perm' : 'btn-ban-temp'}`}
                >
                  <i className="fa-solid fa-ban"></i> {banType === 'permanent' ? 'Terapkan Banned Permanen' : 'Terapkan Banned Sementara'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: DETAIL PROFIL PENGGUNA
          =================================================================== */}
      {selectedUserDetail && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedUserDetail(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="modal-title-wrap">
                <i className="fa-solid fa-id-card text-warning"></i>
                <h3>Detail Lengkap Pengguna</h3>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedUserDetail(null)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="modal-user-summary">
                {selectedUserDetail.picture ? (
                  <img src={selectedUserDetail.picture} alt={selectedUserDetail.name} className="modal-user-avatar" referrerPolicy="no-referrer" />
                ) : (
                  <div className="modal-user-avatar-initial">{(selectedUserDetail.name || 'U').charAt(0).toUpperCase()}</div>
                )}
                <div className="modal-user-summary-text">
                  <h4>{selectedUserDetail.name}</h4>
                  <span className="modal-email">{selectedUserDetail.email}</span>
                  <div className="modal-badge-row">
                    <span className={`presence-badge ${isUserOnline(selectedUserDetail) ? 'presence-online' : 'presence-offline'}`}>
                      {isUserOnline(selectedUserDetail) ? 'Sedang Online' : 'Offline'}
                    </span>
                    <span className={`session-badge ${selectedUserDetail.sessionStatus === 'logged_out' ? 'session-logged-out' : 'session-logged-in'}`}>
                      {selectedUserDetail.sessionStatus === 'logged_out' ? 'Log Out' : 'Masih Login'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-detail-rows">
                <div className="detail-row">
                  <span>User ID</span>
                  <code>{selectedUserDetail.id}</code>
                </div>
                <div className="detail-row">
                  <span>Status Presensi</span>
                  <strong className={isUserOnline(selectedUserDetail) ? 'text-success' : 'text-muted'}>
                    {isUserOnline(selectedUserDetail) ? '🟢 Sedang Online Sekarang' : '⚪ Offline'}
                  </strong>
                </div>
                <div className="detail-row">
                  <span>Status Sesi Login</span>
                  <strong className={selectedUserDetail.sessionStatus === 'logged_out' ? 'text-danger' : 'text-cyan'}>
                    {selectedUserDetail.sessionStatus === 'logged_out' ? '🚪 Sudah Log Out' : '🔑 Masih Login (Sesi Aktif)'}
                  </strong>
                </div>
                <div className="detail-row">
                  <span>Status Sanksi Banned</span>
                  {selectedUserDetail.banStatus?.isBanned ? (
                    <strong className="text-danger">
                      🚫 {selectedUserDetail.banStatus.banType === 'permanent' ? 'Banned Permanen' : `Banned Sementara (${formatBanRemaining(selectedUserDetail.banStatus.bannedUntil)})`}
                    </strong>
                  ) : (
                    <strong className="text-success">✅ Normal / Tidak Banned</strong>
                  )}
                </div>
                {selectedUserDetail.banStatus?.isBanned && (
                  <div className="detail-row">
                    <span>Alasan Banned</span>
                    <strong style={{ color: '#fbbf24' }}>"{selectedUserDetail.banStatus.reason}"</strong>
                  </div>
                )}
                <div className="detail-row">
                  <span>Perangkat & Sistem Operasi</span>
                  <strong>{selectedUserDetail.deviceType} • {selectedUserDetail.os}</strong>
                </div>
                <div className="detail-row">
                  <span>Browser</span>
                  <strong>{selectedUserDetail.browser}</strong>
                </div>
                <div className="detail-row">
                  <span>Waktu Terakhir Aktif</span>
                  <strong>{new Date(selectedUserDetail.lastActiveTime || Date.now()).toLocaleString('id-ID')} WIB ({formatTimeAgo(selectedUserDetail.lastActiveTime)})</strong>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              {selectedUserDetail.banStatus?.isBanned ? (
                <button
                  type="button"
                  className="btn-modal-save"
                  style={{ background: '#10b981' }}
                  onClick={() => handleExecuteUnban(selectedUserDetail)}
                >
                  <i className="fa-solid fa-user-check"></i> Cabut Banned (Unban)
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-modal-delete"
                  onClick={() => {
                    handleOpenBanModal(selectedUserDetail);
                    setSelectedUserDetail(null);
                  }}
                >
                  <i className="fa-solid fa-ban"></i> Banned Pengguna
                </button>
              )}

              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setSelectedUserDetail(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: RIWAYAT AKTIVITAS LENGKAP PENGGUNA
          =================================================================== */}
      {selectedUserForHistory && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedUserForHistory(null)}>
          <div className="admin-modal-box modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="modal-title-wrap">
                <i className="fa-solid fa-clock-rotate-left text-cyan"></i>
                <h3>Riwayat Aktivitas: {selectedUserForHistory.name}</h3>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedUserForHistory(null)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="modal-user-summary">
                <div className="avatar-with-presence">
                  {selectedUserForHistory.picture ? (
                    <img src={selectedUserForHistory.picture} alt={selectedUserForHistory.name} className="modal-user-avatar" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="modal-user-avatar-initial">{(selectedUserForHistory.name || 'U').charAt(0).toUpperCase()}</div>
                  )}
                  <span className={`avatar-status-badge ${isUserOnline(selectedUserForHistory) ? 'status-online' : 'status-offline'}`}></span>
                </div>

                <div className="modal-user-summary-text">
                  <h4>{selectedUserForHistory.name}</h4>
                  <span className="modal-email">{selectedUserForHistory.email}</span>
                  <div className="modal-badge-row">
                    <span className={`presence-badge ${isUserOnline(selectedUserForHistory) ? 'presence-online' : 'presence-offline'}`}>
                      {isUserOnline(selectedUserForHistory) ? 'Sedang Online' : 'Offline'}
                    </span>
                    <span className={`session-badge ${selectedUserForHistory.sessionStatus === 'logged_out' ? 'session-logged-out' : 'session-logged-in'}`}>
                      {selectedUserForHistory.sessionStatus === 'logged_out' ? 'Log Out' : 'Masih Login'}
                    </span>
                    {selectedUserForHistory.banStatus?.isBanned && (
                      <span className="badge-banned-alert">
                        <i className="fa-solid fa-ban"></i> {selectedUserForHistory.banStatus.banType === 'permanent' ? 'Banned Permanen' : 'Banned Sementara'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Linimasa Aktivitas */}
              <div className="user-timeline-wrapper">
                <h4 className="timeline-title">
                  <i className="fa-solid fa-timeline text-warning"></i> Linimasa Aktivitas ({userSpecificActivities.length} Aksi)
                </h4>

                {userSpecificActivities.length === 0 ? (
                  <div className="empty-sub-state">
                    <p>Belum ada catatan aktivitas detail untuk pengguna ini.</p>
                  </div>
                ) : (
                  <div className="timeline-list">
                    {userSpecificActivities.map((act) => {
                      const badge = getActionBadge(act.actionType);
                      return (
                        <div key={act.id} className="timeline-item">
                          <div className="timeline-marker">
                            <i className={`fa-solid ${badge.icon}`}></i>
                          </div>
                          <div className="timeline-content">
                            <div className="timeline-header">
                              <span className={`activity-type-badge ${badge.className}`}>{badge.label}</span>
                              <span className="timeline-time">{formatTimeAgo(act.timestamp)} • {new Date(act.timestamp).toLocaleTimeString('id-ID')} WIB</span>
                            </div>
                            <p className="timeline-desc">{act.description}</p>
                            <div className="timeline-footer-meta">
                              <span><i className="fa-solid fa-desktop"></i> {act.device}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setSelectedUserForHistory(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: GANTI USERNAME & PASSWORD ADMIN
          =================================================================== */}
      {isChangeCredsOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsChangeCredsOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="modal-title-wrap">
                <i className="fa-solid fa-key text-warning"></i>
                <h3>Keamanan: Ganti Akun & Password Admin</h3>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setIsChangeCredsOpen(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleChangeCredsSubmit}>
              <div className="admin-modal-body">
                {credsError && (
                  <div className="admin-login-alert mb-3">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <span>{credsError}</span>
                  </div>
                )}
                {credsSuccess && (
                  <div className="admin-login-success mb-3">
                    <i className="fa-solid fa-circle-check"></i>
                    <span>{credsSuccess}</span>
                  </div>
                )}

                <div className="admin-form-group mb-3">
                  <label htmlFor="oldPass">Password Lama Admin <span className="text-danger">*</span></label>
                  <input
                    id="oldPass"
                    type="password"
                    className="admin-text-input"
                    placeholder="Masukkan password saat ini..."
                    value={oldPass}
                    onChange={(e) => setOldPass(e.target.value)}
                    required
                  />
                </div>

                <div className="admin-form-group mb-3">
                  <label htmlFor="newUsername">Nama Akun / Username Baru</label>
                  <input
                    id="newUsername"
                    type="text"
                    className="admin-text-input"
                    placeholder="Contoh: chaizowner (Opsional)"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                  <small className="form-hint">Biarkan jika tidak ingin mengubah username.</small>
                </div>

                <div className="admin-form-group mb-3">
                  <label htmlFor="newPass">Password Baru Admin <span className="text-danger">*</span></label>
                  <input
                    id="newPass"
                    type="password"
                    className="admin-text-input"
                    placeholder="Minimal 6 karakter..."
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    required
                  />
                </div>

                <div className="admin-form-group mb-3">
                  <label htmlFor="confirmPass">Konfirmasi Password Baru <span className="text-danger">*</span></label>
                  <input
                    id="confirmPass"
                    type="password"
                    className="admin-text-input"
                    placeholder="Ketik ulang password baru..."
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsChangeCredsOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-modal-save"
                >
                  <i className="fa-solid fa-shield-check"></i> Simpan Password Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: RESTOCK GUDANG (PILIHAN 1: TAMBAHKAN AKUN & PASS / PILIHAN 2: MANUALITY)
          =================================================================== */}
      {selectedProductForRestock && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedProductForRestock(null)}>
          <div className="admin-modal-box modal-box-gudang" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="modal-title-wrap">
                <i className="fa-solid fa-warehouse text-warning"></i>
                <div>
                  <h3>Kelola Restock: {selectedProductForRestock.name}</h3>
                  <span className="modal-subtitle-text">
                    Kategori: {selectedProductForRestock.category} • Stok Toko Saat Ini: <strong className="text-success">{selectedProductForRestock.stock || 0} Akun Ready</strong>
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedProductForRestock(null)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="admin-modal-body modal-gudang-body">
              {/* Restock Mode Switcher: 1. Tambahkan Akun & Password | 2. Manuality */}
              <div className="restock-mode-tabs">
                <button
                  type="button"
                  className={`restock-mode-btn ${restockMode === 'account' ? 'active' : ''}`}
                  onClick={() => setRestockMode('account')}
                >
                  <i className="fa-solid fa-key"></i>
                  <div className="mode-btn-text">
                    <strong>1. Tambahkan Akun & Password</strong>
                    <small>Simpan kredensial ke Vault & stok otomatis nambah (+1)</small>
                  </div>
                </button>

                <button
                  type="button"
                  className={`restock-mode-btn ${restockMode === 'manuality' ? 'active' : ''}`}
                  onClick={() => {
                    setRestockMode('manuality');
                    setManualStockInput(String(selectedProductForRestock.stock || 0));
                  }}
                >
                  <i className="fa-solid fa-sliders"></i>
                  <div className="mode-btn-text">
                    <strong>2. Manuality (Atur Jumlah Stok)</strong>
                    <small>Atur atau tambah kuantitas stok langsung tanpa input akun</small>
                  </div>
                </button>
              </div>

              {/* -------------------------------------------------------------
                  MODE 1: TAMBAHKAN AKUN & PASSWORD
                  ------------------------------------------------------------- */}
              {restockMode === 'account' && (
                <div className="restock-pane-account">
                  <div className="restock-intro-banner">
                    <i className="fa-solid fa-circle-info text-cyan"></i>
                    <div>
                      <strong>Opsi Tambah Akun Baru:</strong>
                      <p>Ketikkan email/username dan password akun {selectedProductForRestock.name}. Saat disimpan, stok produk akan <strong>otomatis bertambah (+1)</strong> di database toko.</p>
                    </div>
                  </div>

                  <form onSubmit={handleAddAccountSubmit} className="add-account-form">
                    <div className="add-acc-grid">
                      <div className="admin-form-group">
                        <label htmlFor="newAccEmail">
                          <i className="fa-solid fa-envelope text-cyan"></i> Email / Akun <span className="text-danger">*</span>
                        </label>
                        <input
                          id="newAccEmail"
                          type="text"
                          className="admin-text-input"
                          placeholder="contoh: gemini.pro@gmail.com"
                          value={newAccEmail}
                          onChange={(e) => setNewAccEmail(e.target.value)}
                          required
                          autoFocus
                        />
                      </div>

                      <div className="admin-form-group">
                        <label htmlFor="newAccPassword">
                          <i className="fa-solid fa-lock text-warning"></i> Password Akun <span className="text-danger">*</span>
                        </label>
                        <div className="password-input-wrapper">
                          <input
                            id="newAccPassword"
                            type={showNewAccPassword ? 'text' : 'password'}
                            className="admin-text-input"
                            placeholder="Ketik password akun..."
                            value={newAccPassword}
                            onChange={(e) => setNewAccPassword(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            className="btn-toggle-eye"
                            onClick={() => setShowNewAccPassword(!showNewAccPassword)}
                            title={showNewAccPassword ? 'Sembunyikan password' : 'Lihat password'}
                          >
                            <i className={`fa-solid ${showNewAccPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="admin-form-group" style={{ marginTop: '10px' }}>
                      <label htmlFor="newAccNote">
                        <i className="fa-solid fa-note-sticky text-muted"></i> Catatan Profil / Paket (Opsional)
                      </label>
                      <input
                        id="newAccNote"
                        type="text"
                        className="admin-text-input"
                        placeholder="contoh: Profil 1 - PIN 1234 / Masa aktif 1 Tahun"
                        value={newAccNote}
                        onChange={(e) => setNewAccNote(e.target.value)}
                      />
                    </div>

                    <div className="form-submit-row" style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="submit" className="btn-add-account-submit">
                        <i className="fa-solid fa-plus-circle"></i>
                        <span>Simpan Akun & Tambah Restock (+1 Stok)</span>
                      </button>
                    </div>
                  </form>

                  {/* Vault Accounts List */}
                  <div className="vault-accounts-section" style={{ marginTop: '24px' }}>
                    <div className="vault-header-row">
                      <div className="vault-title-wrap">
                        <i className="fa-solid fa-vault text-warning"></i>
                        <h4>Akun Tersimpan di Database Vault ({selectedProductForRestock.accounts?.length || 0} Akun)</h4>
                      </div>
                      <span className="vault-stock-pill">
                        Total Stok Toko: <strong className="text-success">{selectedProductForRestock.stock || 0} Akun</strong>
                      </span>
                    </div>

                    {(!selectedProductForRestock.accounts || selectedProductForRestock.accounts.length === 0) ? (
                      <div className="empty-vault-state">
                        <i className="fa-solid fa-folder-open"></i>
                        <p>Belum ada kredensial akun tersimpan di vault produk ini.</p>
                        <small>Gunakan formulir di atas untuk menambahkan akun baru atau gunakan mode Manuality.</small>
                      </div>
                    ) : (
                      <div className="vault-table-wrapper">
                        <table className="vault-table">
                          <thead>
                            <tr>
                              <th>No</th>
                              <th>Email / Akun</th>
                              <th>Password</th>
                              <th>Catatan</th>
                              <th>Waktu Ditambahkan</th>
                              <th>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedProductForRestock.accounts.map((acc, idx) => {
                              const isPwVisible = !!visibleVaultPasswords[acc.id];
                              const isCopied = copiedAccId === acc.id;

                              return (
                                <tr key={acc.id || idx}>
                                  <td>{idx + 1}</td>
                                  <td>
                                    <strong className="acc-email-text">{acc.email}</strong>
                                  </td>
                                  <td>
                                    <div className="vault-pw-cell">
                                      <code>{isPwVisible ? acc.password : '••••••••••••'}</code>
                                      <button
                                        type="button"
                                        className="btn-pw-eye"
                                        onClick={() => handleToggleVaultPassword(acc.id)}
                                        title={isPwVisible ? 'Sembunyikan password' : 'Lihat password'}
                                      >
                                        <i className={`fa-solid ${isPwVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                      </button>
                                      <button
                                        type="button"
                                        className={`btn-pw-copy ${isCopied ? 'copied' : ''}`}
                                        onClick={() => handleCopyCredential(acc)}
                                        title="Salin Akun & Password"
                                      >
                                        <i className={`fa-solid ${isCopied ? 'fa-check text-success' : 'fa-copy'}`}></i>
                                      </button>
                                    </div>
                                  </td>
                                  <td>
                                    <span className="acc-note-text">{acc.note || '-'}</span>
                                  </td>
                                  <td>
                                    <small className="acc-date-text">
                                      {acc.addedAt ? new Date(acc.addedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                    </small>
                                  </td>
                                  <td>
                                    <button
                                      type="button"
                                      className="btn-acc-delete"
                                      onClick={() => handleDeleteAccount(acc.id, acc.email)}
                                      title="Hapus akun dari vault (Stok otomatis berkurang 1)"
                                    >
                                      <i className="fa-solid fa-trash-can"></i>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------------
                  MODE 2: MANUALITY (ATUR JUMLAH RESTOCK LANGSUNG)
                  ------------------------------------------------------------- */}
              {restockMode === 'manuality' && (
                <div className="restock-pane-manuality">
                  <div className="restock-intro-banner banner-amber">
                    <i className="fa-solid fa-sliders text-warning"></i>
                    <div>
                      <strong>Mode Manuality:</strong>
                      <p>Di mode ini tidak perlu input email & password satu per satu ("biasanya kosong doang"). Cukup tentukan <strong>jumlah restock</strong> yang diinginkan, lalu klik <strong>Konfirmasi</strong>. Jumlah stok di sisi pembeli/user akan otomatis langsung berubah realtime!</p>
                    </div>
                  </div>

                  <form onSubmit={handleConfirmManuality} className="manuality-form">
                    <div className="manuality-current-box">
                      <span className="manuality-box-label">Stok Toko Saat Ini:</span>
                      <strong className="manuality-box-value">{selectedProductForRestock.stock || 0} Akun</strong>
                    </div>

                    <div className="admin-form-group" style={{ marginTop: '16px' }}>
                      <label htmlFor="manualStockInput">
                        <i className="fa-solid fa-boxes-stacked text-cyan"></i> Ubah Menjadi Jumlah Stok Baru: <span className="text-danger">*</span>
                      </label>
                      <div className="manuality-input-row">
                        <input
                          id="manualStockInput"
                          type="number"
                          min="0"
                          max="9999"
                          className="admin-text-input manual-number-input"
                          value={manualStockInput}
                          onChange={(e) => setManualStockInput(e.target.value)}
                          required
                          autoFocus
                        />
                        <span className="unit-label">Akun</span>
                      </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="manuality-presets-wrap">
                      <span className="presets-label">Tombol Cepat:</span>
                      <div className="presets-buttons-grid">
                        <button
                          type="button"
                          className="btn-preset-quick"
                          onClick={() => setManualStockInput(String(Math.max(0, (selectedProductForRestock.stock || 0) + 5)))}
                        >
                          +5 Akun
                        </button>
                        <button
                          type="button"
                          className="btn-preset-quick"
                          onClick={() => setManualStockInput(String(Math.max(0, (selectedProductForRestock.stock || 0) + 10)))}
                        >
                          +10 Akun
                        </button>
                        <button
                          type="button"
                          className="btn-preset-quick"
                          onClick={() => setManualStockInput(String(Math.max(0, (selectedProductForRestock.stock || 0) + 20)))}
                        >
                          +20 Akun
                        </button>
                        <button
                          type="button"
                          className="btn-preset-quick"
                          onClick={() => setManualStockInput(String(Math.max(0, (selectedProductForRestock.stock || 0) + 50)))}
                        >
                          +50 Akun
                        </button>
                        <button
                          type="button"
                          className="btn-preset-quick btn-preset-danger"
                          onClick={() => setManualStockInput('0')}
                        >
                          Set Stok Kosong (0)
                        </button>
                      </div>
                    </div>

                    <div className="manuality-confirm-preview">
                      <i className="fa-solid fa-circle-check text-success"></i>
                      <span>
                        Stok di etalase web user akan langsung terupdate menjadi <strong>{manualStockInput || 0} Akun</strong> setelah dikonfirmasi.
                      </span>
                    </div>

                    <div className="form-submit-row" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn-modal-cancel"
                        onClick={() => setSelectedProductForRestock(null)}
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="btn-modal-save btn-confirm-manuality"
                      >
                        <i className="fa-solid fa-check-double"></i>
                        <span>Konfirmasi Perubahan Stok</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setSelectedProductForRestock(null)}
              >
                Selesai / Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: FULFILLMENT PESANAN (KIRIM AKUN, PW, PIN, CATATAN KHUSUS ADMIN)
          =================================================================== */}
      {selectedOrderForFulfill && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedOrderForFulfill(null)}>
          <div className="admin-modal-box modal-box-fulfill" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="modal-title-wrap">
                <i className="fa-solid fa-receipt text-cyan"></i>
                <div>
                  <h3>Proses Pesanan: #{selectedOrderForFulfill.id}</h3>
                  <span className="modal-subtitle-text">
                    {selectedOrderForFulfill.productName || 'Produk'} • Pemesan: <strong>{selectedOrderForFulfill.customerName || 'Pelanggan'}</strong>
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedOrderForFulfill(null)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleFulfillSubmit(e, true); }}>
              <div className="admin-modal-body">
                {/* Order Summary Strip */}
                <div className="fulfill-order-strip">
                  <div className="strip-item">
                    <span className="strip-label">Produk</span>
                    <strong className="strip-val">{selectedOrderForFulfill.productName || 'Produk'}</strong>
                  </div>
                  <div className="strip-item">
                    <span className="strip-label">Durasi / Paket</span>
                    <strong className="strip-val">{selectedOrderForFulfill.productDuration || 'Reguler'}</strong>
                  </div>
                  <div className="strip-item">
                    <span className="strip-label">Garansi</span>
                    <strong className="strip-val text-cyan">{selectedOrderForFulfill.warrantyPeriod || 'Aktif'}</strong>
                  </div>
                  <div className="strip-item">
                    <span className="strip-label">Total Tagihan</span>
                    <strong className="strip-val text-success">
                      Rp {Number(selectedOrderForFulfill.total ?? selectedOrderForFulfill.price ?? 0).toLocaleString('id-ID')}
                    </strong>
                  </div>
                  <div className="strip-item">
                    <span className="strip-label">Metode Bayar</span>
                    <strong className="strip-val">{selectedOrderForFulfill.paymentMethod || 'QRIS Instant'}</strong>
                  </div>
                </div>

                {/* Proof of Payment Banner inside Fulfill Modal */}
                {selectedOrderForFulfill.proofUrl ? (
                  <div className="fulfill-proof-preview-banner">
                    <div className="proof-banner-info">
                      <i className="fa-solid fa-image text-cyan"></i>
                      <span>
                        Ada Bukti Transfer ({selectedOrderForFulfill.proofFileName || 'Bukti_Pembayaran.png'})
                        • <strong className="text-warning">{getProofTimeRemaining(selectedOrderForFulfill)?.text || 'Aktif'}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-banner-proof-view"
                      onClick={() => {
                        setProofImgError(false);
                        setSelectedOrderProof(selectedOrderForFulfill);
                      }}
                    >
                      <i className="fa-solid fa-magnifying-glass-plus"></i> Lihat Foto Bukti
                    </button>
                  </div>
                ) : selectedOrderForFulfill.proofExpired ? (
                  <div className="fulfill-proof-expired-notice">
                    <i className="fa-solid fa-ban text-muted"></i>
                    <span>Foto bukti pembayaran sudah terhapus (masa 2 hari berakhir / dihapus)</span>
                  </div>
                ) : null}

                {/* Data Pelanggan / Buyer Information Card */}
                <div className="fulfill-customer-card">
                  <div className="fulfill-customer-card-header">
                    <div className="customer-header-title">
                      <i className="fa-solid fa-address-card text-cyan"></i>
                      <span>Data Pemesan (Gunakan Langsung untuk Undangan / Aktivasi Akun)</span>
                    </div>
                    <span className="customer-no-pwd-badge">
                      <i className="fa-solid fa-shield-check"></i> Proses Cepat Tanpa Minta Password
                    </span>
                  </div>

                  {(() => {
                    const activeCustomerEmail =
                      selectedOrderForFulfill.customerEmail && selectedOrderForFulfill.customerEmail !== '-'
                        ? selectedOrderForFulfill.customerEmail
                        : (selectedOrderForFulfill.userEmail && selectedOrderForFulfill.userEmail !== '-'
                          ? selectedOrderForFulfill.userEmail
                          : (selectedOrderForFulfill.email && selectedOrderForFulfill.email !== '-' ? selectedOrderForFulfill.email : ''));

                    const activeCustomerPhone =
                      selectedOrderForFulfill.customerPhone && selectedOrderForFulfill.customerPhone !== '-'
                        ? selectedOrderForFulfill.customerPhone
                        : (selectedOrderForFulfill.phone && selectedOrderForFulfill.phone !== '-'
                          ? selectedOrderForFulfill.phone
                          : (selectedOrderForFulfill.wa && selectedOrderForFulfill.wa !== '-' ? selectedOrderForFulfill.wa : ''));

                    const displayEmail = activeCustomerEmail || fulfillAccount;
                    const displayPhone = activeCustomerPhone || fulfillCustomerPhone;

                    return (
                      <div className="fulfill-customer-grid">
                        {/* Nama Lengkap */}
                        <div className="customer-tile">
                          <span className="customer-tile-label">
                            <i className="fa-solid fa-user text-cyan"></i> Nama Lengkap Pelanggan:
                          </span>
                          <div className="customer-tile-content">
                            <strong className="customer-tile-val">{selectedOrderForFulfill.customerName || 'Pelanggan ChaizStore'}</strong>
                            <button
                              type="button"
                              className="btn-customer-tile-action"
                              onClick={() => {
                                navigator.clipboard.writeText(selectedOrderForFulfill.customerName || '');
                                showToast('Nama pembeli disalin!', 'fa-copy', 'info');
                              }}
                              title="Salin Nama"
                            >
                              <i className="fa-solid fa-copy"></i>
                            </button>
                          </div>
                        </div>

                        {/* Gmail / Email */}
                        <div className="customer-tile tile-email-focus">
                          <span className="customer-tile-label">
                            <i className="fa-solid fa-envelope text-warning"></i> Nama Gmail Pelanggan:
                          </span>
                          <div className="customer-tile-content">
                            {displayEmail ? (
                              <strong className="customer-tile-val email-val">{displayEmail}</strong>
                            ) : (
                              <span style={{ color: '#fbbf24', fontSize: '12px', fontStyle: 'italic' }}>
                                Belum tertera (isi di form akun)
                              </span>
                            )}
                            <div className="customer-tile-btns">
                              {displayEmail && (
                                <button
                                  type="button"
                                  className="btn-use-gmail-quick"
                                  onClick={() => {
                                    setFulfillAccount(displayEmail);
                                    showToast('Gmail pelanggan dimasukkan ke kolom akun!', 'fa-bolt', 'success');
                                  }}
                                  title="Masukkan email ini ke kolom formulir Akun"
                                >
                                  <i className="fa-solid fa-arrow-turn-down"></i> Pakai Gmail Ini
                                </button>
                              )}
                              {displayEmail && (
                                <button
                                  type="button"
                                  className="btn-customer-tile-action"
                                  onClick={() => {
                                    navigator.clipboard.writeText(displayEmail);
                                    showToast('Gmail pembeli disalin!', 'fa-copy', 'info');
                                  }}
                                  title="Salin Gmail"
                                >
                                  <i className="fa-solid fa-copy"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* WhatsApp / Telepon */}
                        <div className="customer-tile tile-wa-focus">
                          <span className="customer-tile-label">
                            <i className="fa-brands fa-whatsapp text-success"></i> Nomor Telepon / WA Pelanggan:
                          </span>
                          <div className="customer-tile-content">
                            {displayPhone ? (
                              <strong className="customer-tile-val wa-val">{displayPhone}</strong>
                            ) : (
                              <span style={{ color: '#f87171', fontSize: '12px', fontStyle: 'italic' }}>
                                Belum tertera (isi di kolom WA bawah)
                              </span>
                            )}
                            <div className="customer-tile-btns">
                              {displayPhone && (
                                <a
                                  href={`https://wa.me/${cleanPhoneNumber(displayPhone)}?text=${encodeURIComponent(`Halo kak ${selectedOrderForFulfill.customerName || ''}, pesanan ${selectedOrderForFulfill.productName || ''} di ChaizStore sedang kami proses.`)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn-chat-wa-quick"
                                  title="Buka Chat WhatsApp ke nomor pembeli"
                                >
                                  <i className="fa-brands fa-whatsapp"></i> Chat WA
                                </a>
                              )}
                              {displayPhone && (
                                <button
                                  type="button"
                                  className="btn-customer-tile-action"
                                  onClick={() => {
                                    navigator.clipboard.writeText(displayPhone);
                                    showToast('Nomor WhatsApp disalin!', 'fa-copy', 'info');
                                  }}
                                  title="Salin Nomor WhatsApp"
                                >
                                  <i className="fa-solid fa-copy"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Username jika ada */}
                        {selectedOrderForFulfill.customerUsername && selectedOrderForFulfill.customerUsername !== '-' && (
                          <div className="customer-tile">
                            <span className="customer-tile-label">
                              <i className="fa-solid fa-id-badge text-purple"></i> Username:
                            </span>
                            <div className="customer-tile-content" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {selectedOrderForFulfill.customerRobloxAvatar && (
                                <img
                                  src={selectedOrderForFulfill.customerRobloxAvatar}
                                  alt=""
                                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid #38bdf8', objectFit: 'cover' }}
                                />
                              )}
                              <strong className="customer-tile-val">{selectedOrderForFulfill.customerUsername}</strong>
                              <button
                                type="button"
                                className="btn-customer-tile-action"
                                onClick={() => {
                                  navigator.clipboard.writeText(selectedOrderForFulfill.customerUsername);
                                  showToast('Username disalin!', 'fa-copy', 'info');
                                }}
                                title="Salin Username"
                              >
                                <i className="fa-solid fa-copy"></i>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Mode Selector Tabs: 4 Mode Pengiriman */}
                <div className="fulfill-mode-selector-card">
                  <div className="fulfill-mode-header">
                    <span className="fulfill-mode-title">
                      <i className="fa-solid fa-sliders text-cyan"></i> Pilihan Format Pengiriman:
                    </span>
                    <span className="fulfill-mode-hint">
                      {fulfillMode === 'premium_account' && '🛡️ Mode Akun Premium (Nama Akun, Password, Profil, PIN, Durasi, Garansi)'}
                      {fulfillMode === 'voucher' && '🎟️ Mode Voucer / Key (Code Voucer & Catatan)'}
                      {fulfillMode === 'topup' && '⚡ Mode Top Up (Akun / ID Game, Gmail, Catatan)'}
                      {fulfillMode === 'note_only' && '📝 Mode Catatan Saja (Catatan / Panduan Khusus)'}
                    </span>
                  </div>
                  <div className="fulfill-mode-tab-buttons fulfill-mode-tab-4">
                    <button
                      type="button"
                      className={`btn-mode-tab ${fulfillMode === 'premium_account' ? 'active' : ''}`}
                      onClick={() => setFulfillMode('premium_account')}
                    >
                      <i className="fa-solid fa-user-shield"></i>
                      <span>Akun Premium</span>
                    </button>
                    <button
                      type="button"
                      className={`btn-mode-tab btn-mode-tab-voucher ${fulfillMode === 'voucher' ? 'active' : ''}`}
                      onClick={() => setFulfillMode('voucher')}
                    >
                      <i className="fa-solid fa-ticket"></i>
                      <span>Voucer / Key</span>
                    </button>
                    <button
                      type="button"
                      className={`btn-mode-tab btn-mode-tab-topup ${fulfillMode === 'topup' ? 'active' : ''}`}
                      onClick={() => setFulfillMode('topup')}
                    >
                      <i className="fa-solid fa-bolt"></i>
                      <span>Top Up</span>
                    </button>
                    <button
                      type="button"
                      className={`btn-mode-tab btn-mode-tab-note ${fulfillMode === 'note_only' ? 'active' : ''}`}
                      onClick={() => setFulfillMode('note_only')}
                    >
                      <i className="fa-solid fa-comment-dots"></i>
                      <span>Catatan Saja</span>
                    </button>
                  </div>
                </div>

                {/* 1. MODE: AKUN PREMIUM */}
                {fulfillMode === 'premium_account' && (
                  <div className="fulfill-account-simplified-box">
                    {/* Vault Helper: Check if Gudang has ready accounts for this product */}
                    {(() => {
                      const currentProdName = String(selectedOrderForFulfill.productName || '').toLowerCase();
                      const match = (productsList || []).find((p) => {
                        if (!p || !p.name) return false;
                        const pName = String(p.name).toLowerCase();
                        return currentProdName && (pName.includes(currentProdName) || currentProdName.includes(pName));
                      });
                      if (match && match.accounts && match.accounts.length > 0) {
                        return (
                          <div className="vault-quick-picker-box">
                            <div className="vault-quick-picker-header">
                              <i className="fa-solid fa-vault text-warning"></i>
                              <span>
                                Ditemukan <strong>{match.accounts.length} Akun Siap Pakai</strong> di Gudang ({match.name}):
                              </span>
                            </div>
                            <div className="vault-quick-picker-list">
                              {match.accounts.slice(0, 3).map((acc) => (
                                <button
                                  key={acc.id || acc.email}
                                  type="button"
                                  className="btn-vault-quick-pick"
                                  onClick={() => {
                                    setFulfillAccount(acc.email || '');
                                    setFulfillPassword(acc.password || '');
                                    if (acc.note) setFulfillProfile(acc.note);
                                    showToast(`Akun ${acc.email} berhasil dimasukkan ke form!`, 'fa-vault', 'info');
                                  }}
                                  title="Klik untuk gunakan akun ini"
                                >
                                  <i className="fa-solid fa-paste"></i>
                                  <span>Gunakan: <strong>{acc.email}</strong></span>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <div className="account-mode-banner">
                      <div className="account-banner-header">
                        <i className="fa-solid fa-circle-check text-success account-banner-icon"></i>
                        <div>
                          <strong>Kirim Kredensial Akun Premium</strong>
                          <p>
                            Isi detail kredensial akun pelanggan di bawah. Kolom yang dibiarkan kosong otomatis tidak akan disertakan pada pesan WhatsApp.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 1. NAMA AKUN / GMAIL PENGGUNA */}
                    <div className="admin-form-group account-field-card primary-field-card">
                      <div className="field-card-header">
                        <label htmlFor="fulfillAccount" className="account-field-label">
                          <span className="account-num-badge">1</span>
                          <i className="fa-solid fa-envelope text-cyan"></i>
                          <span>Nama Akun / Gmail Pengguna:</span>
                          <span className="field-required-pill" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
                            Keisi Otomatis
                          </span>
                        </label>
                        {selectedOrderForFulfill.customerEmail && selectedOrderForFulfill.customerEmail !== '-' && (
                          <button
                            type="button"
                            className="btn-use-customer-gmail-inline"
                            onClick={() => {
                              setFulfillAccount(selectedOrderForFulfill.customerEmail);
                              showToast('Gmail pelanggan dimasukkan ke kolom akun!', 'fa-bolt', 'success');
                            }}
                            title="Muat ulang email dari pesanan pembeli"
                          >
                            <i className="fa-solid fa-arrow-turn-down"></i> Muat Ulang Gmail
                          </button>
                        )}
                      </div>
                      <input
                        id="fulfillAccount"
                        type="text"
                        className="admin-text-input account-primary-input"
                        placeholder="contoh: user.pelanggan@gmail.com"
                        value={fulfillAccount}
                        onChange={(e) => setFulfillAccount(e.target.value)}
                        autoFocus
                      />
                      <span className="field-sub-hint">
                        <i className="fa-solid fa-circle-info text-cyan"></i> Terisi otomatis dari email akun pelanggan yang terdaftar. Boleh diedit jika perlu.
                      </span>
                    </div>

                    {/* GRID FIELD MANUAL: PASSWORD, PROFIL, CODE PIN, DURASI, GARANSI */}
                    <div className="fulfill-fields-grid" style={{ marginTop: '14px', marginBottom: '14px' }}>
                      {/* Password */}
                      <div className="admin-form-group">
                        <div className="field-label-with-presets">
                          <label htmlFor="fulfillPassword">
                            <i className="fa-solid fa-lock text-warning"></i> Password:
                          </label>
                          <div className="mini-presets-row">
                            <button
                              type="button"
                              className="btn-mini-preset"
                              onClick={() => {
                                const randomPass = `Chaiz${Math.floor(1000 + Math.random() * 9000)}!`;
                                setFulfillPassword(randomPass);
                                setShowFulfillPassword(true);
                                showToast(`Password otomatis dibuat: ${randomPass}`, 'fa-key', 'info');
                              }}
                              title="Buat password acak otomatis"
                            >
                              + Acak
                            </button>
                            {fulfillPassword && (
                              <button
                                type="button"
                                className="btn-mini-preset btn-mini-preset-clear"
                                onClick={() => setFulfillPassword('')}
                                title="Kosongkan password"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="password-input-wrapper">
                          <input
                            id="fulfillPassword"
                            type={showFulfillPassword ? 'text' : 'password'}
                            className="admin-text-input"
                            placeholder="Password akun (kosongkan jika tidak ada)"
                            value={fulfillPassword}
                            onChange={(e) => setFulfillPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn-toggle-eye"
                            onClick={() => setShowFulfillPassword(!showFulfillPassword)}
                            title={showFulfillPassword ? 'Sembunyikan password' : 'Lihat password'}
                          >
                            <i className={`fa-solid ${showFulfillPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </button>
                        </div>
                      </div>

                      {/* Profil */}
                      <div className="admin-form-group">
                        <div className="field-label-with-presets">
                          <label htmlFor="fulfillProfile">
                            <i className="fa-solid fa-tv text-cyan"></i> Profil / Layar:
                          </label>
                          <div className="mini-presets-row">
                            <button
                              type="button"
                              className="btn-mini-preset"
                              onClick={() => setFulfillProfile('Profil 1')}
                            >
                              P1
                            </button>
                            <button
                              type="button"
                              className="btn-mini-preset"
                              onClick={() => setFulfillProfile('Profil 2')}
                            >
                              P2
                            </button>
                            <button
                              type="button"
                              className="btn-mini-preset"
                              onClick={() => setFulfillProfile('Layar Utama')}
                            >
                              Utama
                            </button>
                          </div>
                        </div>
                        <input
                          id="fulfillProfile"
                          type="text"
                          className="admin-text-input"
                          placeholder="contoh: Profil 1 / Layar A"
                          value={fulfillProfile}
                          onChange={(e) => setFulfillProfile(e.target.value)}
                        />
                      </div>

                      {/* Code PIN */}
                      <div className="admin-form-group">
                        <div className="field-label-with-presets">
                          <label htmlFor="fulfillPin">
                            <i className="fa-solid fa-hashtag text-success"></i> Code PIN:
                          </label>
                          <div className="mini-presets-row">
                            <button
                              type="button"
                              className="btn-mini-preset"
                              onClick={() => setFulfillPin('1234')}
                            >
                              1234
                            </button>
                            <button
                              type="button"
                              className="btn-mini-preset"
                              onClick={() => setFulfillPin('0000')}
                            >
                              0000
                            </button>
                            <button
                              type="button"
                              className="btn-mini-preset"
                              onClick={() => setFulfillPin(String(Math.floor(1000 + Math.random() * 9000)))}
                              title="PIN 4 digit acak"
                            >
                              + Acak
                            </button>
                          </div>
                        </div>
                        <input
                          id="fulfillPin"
                          type="text"
                          className="admin-text-input"
                          placeholder="contoh: 1234 (opsional)"
                          value={fulfillPin}
                          onChange={(e) => setFulfillPin(e.target.value)}
                        />
                      </div>

                      {/* Durasi */}
                      <div className="admin-form-group">
                        <div className="field-label-with-presets">
                          <label htmlFor="fulfillDuration">
                            <i className="fa-solid fa-clock text-cyan"></i> Durasi:
                          </label>
                          <div className="mini-presets-row">
                            <button
                              type="button"
                              className="btn-mini-preset"
                              onClick={() => setFulfillDuration('1 Bulan')}
                            >
                              1 Bln
                            </button>
                            <button
                              type="button"
                              className="btn-mini-preset"
                              onClick={() => setFulfillDuration('1 Tahun')}
                            >
                              1 Thn
                            </button>
                          </div>
                        </div>
                        <input
                          id="fulfillDuration"
                          type="text"
                          className="admin-text-input"
                          placeholder="contoh: 1 Bulan / 1 Tahun"
                          value={fulfillDuration}
                          onChange={(e) => setFulfillDuration(e.target.value)}
                        />
                      </div>

                      {/* Garansi */}
                      <div className="admin-form-group">
                        <div className="field-label-with-presets">
                          <label htmlFor="fulfillWarranty">
                            <i className="fa-solid fa-shield-halved text-success"></i> Garansi:
                          </label>
                          <div className="mini-presets-row">
                            <button
                              type="button"
                              className="btn-mini-preset"
                              onClick={() => setFulfillWarranty('30 Hari')}
                            >
                              30 Hari
                            </button>
                            <button
                              type="button"
                              className="btn-mini-preset"
                              onClick={() => setFulfillWarranty('Full Garansi')}
                            >
                              Full
                            </button>
                          </div>
                        </div>
                        <input
                          id="fulfillWarranty"
                          type="text"
                          className="admin-text-input"
                          placeholder="contoh: 30 Hari / Garansi Penuh"
                          value={fulfillWarranty}
                          onChange={(e) => setFulfillWarranty(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* CATATAN / PANDUAN PENGGUNA (OPSIONAL) */}
                    <div className="admin-form-group account-field-card primary-field-card">
                      <label htmlFor="fulfillAdminNote" className="account-field-label">
                        <i className="fa-solid fa-comment-dots text-warning"></i>
                        <span>Catatan / Panduan Pelanggan (Opsional)</span>
                      </label>
                      <textarea
                        id="fulfillAdminNote"
                        className="admin-text-input fulfill-note-textarea"
                        rows="3"
                        placeholder="Tuliskan catatan panduan atau cara aktivasi akun..."
                        value={fulfillAdminNote}
                        onChange={(e) => setFulfillAdminNote(e.target.value)}
                      ></textarea>

                      {/* Quick Presets for Account */}
                      <div className="fulfill-note-presets">
                        <span className="presets-label">Template Catatan Cepat:</span>
                        <button
                          type="button"
                          className="btn-preset-quick"
                          onClick={() =>
                            setFulfillAdminNote(
                              `Halo kak ${selectedOrderForFulfill.customerName || ''}, akun Anda sudah aktif dan siap digunakan. Garansi penuh ChaizStore 100%! Selamat menikmati.`
                            )
                          }
                        >
                          + Template Standar
                        </button>
                        <button
                          type="button"
                          className="btn-preset-quick"
                          onClick={() =>
                            setFulfillAdminNote(
                              `Halo kak ${selectedOrderForFulfill.customerName || ''}, akun Canva Pro sudah aktif langsung di email ${fulfillAccount || selectedOrderForFulfill.customerEmail || 'Anda'}. Silakan buka Canva.com dan cek invite tim. Full garansi 100%! Selamat berkarya!`
                            )
                          }
                        >
                          + Template Canva Pro
                        </button>
                        <button
                          type="button"
                          className="btn-preset-quick"
                          onClick={() =>
                            setFulfillAdminNote(
                              `Halo kak ${selectedOrderForFulfill.customerName || ''}, undangan YouTube / Spotify Premium sudah dikirim ke email ${fulfillAccount || selectedOrderForFulfill.customerEmail || 'Anda'}. Silakan buka inbox/spam email dan klik Accept Invitation. Garansi resmi ChaizStore aktif!`
                            )
                          }
                        >
                          + Template YouTube / Spotify
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MODE: VOUCER / SERIAL KEY */}
                {fulfillMode === 'voucher' && (
                  <div className="fulfill-steam-mode-box">
                    <div className="steam-mode-banner">
                      <i className="fa-solid fa-ticket steam-banner-icon" style={{ color: '#f59e0b' }}></i>
                      <div className="steam-banner-text">
                        <strong>Pengiriman Voucer / Serial Key (2 Kolom Khusus)</strong>
                        <p>
                          Cukup isi <strong>1. Code Voucer / Key</strong> dan <strong>2. Catatan / Panduan</strong>. Data kredensial email/password tidak diperlukan.
                        </p>
                      </div>
                    </div>

                    <div className="steam-two-fields-wrapper">
                      {/* 1. Code Key */}
                      <div className="admin-form-group steam-field-card">
                        <div className="field-card-header" style={{ marginBottom: '8px' }}>
                          <label htmlFor="fulfillSteamCode" className="steam-field-label" style={{ margin: 0 }}>
                            <span className="steam-num-badge">1</span>
                            <i className="fa-solid fa-key text-warning"></i>
                            <span>Code Voucer / Serial Key:</span>
                            <span className="field-required-pill">Wajib Diisi</span>
                          </label>
                          <button
                            type="button"
                            className="btn-use-customer-gmail-inline"
                            onClick={() => {
                              const randomKey = `CHZ-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
                              setFulfillCode(randomKey);
                              showToast(`Kode key otomatis dibuat: ${randomKey}`, 'fa-ticket', 'info');
                            }}
                            title="Generate kode voucer acak"
                          >
                            <i className="fa-solid fa-wand-magic-sparkles"></i> + Buat Key Acak
                          </button>
                        </div>
                        <input
                          id="fulfillSteamCode"
                          type="text"
                          className="admin-text-input steam-code-input"
                          placeholder="contoh: STEAM-XXXXX-YYYYY-ZZZZZ atau CHAIZ-VOUCHER-8821"
                          value={fulfillCode}
                          onChange={(e) => setFulfillCode(e.target.value)}
                          required
                          autoFocus
                        />
                        <span className="field-sub-hint">
                          Kode Voucer / Key ini akan otomatis disertakan pada pesan WhatsApp & tampil di menu transaksi pembeli.
                        </span>
                      </div>

                      {/* 2. Catatan */}
                      <div className="admin-form-group steam-field-card">
                        <label htmlFor="fulfillSteamNote" className="steam-field-label">
                          <span className="steam-num-badge">2</span>
                          <i className="fa-solid fa-comment-dots text-cyan"></i>
                          <span>Catatan (Instruksi Aktivasi / Pesan Khusus Pembeli)</span>
                        </label>
                        <textarea
                          id="fulfillSteamNote"
                          className="admin-text-input fulfill-note-textarea steam-note-textarea"
                          rows="3"
                          placeholder="Tuliskan catatan cara aktivasi key atau pesan untuk pelanggan..."
                          value={fulfillAdminNote}
                          onChange={(e) => setFulfillAdminNote(e.target.value)}
                        ></textarea>

                        {/* Quick Presets for Steam Key / Voucher */}
                        <div className="fulfill-note-presets">
                          <span className="presets-label">Template Catatan:</span>
                          <button
                            type="button"
                            className="btn-preset-quick btn-preset-steam"
                            onClick={() =>
                              setFulfillAdminNote(
                                'Kode Key Original aktif & bergaransi resmi. Cara Aktivasi: Buka aplikasi/website penyedia -> Masukkan Code Key di atas -> Klik Redeem/Aktivasi. Selamat menikmati!'
                              )
                            }
                          >
                            <i className="fa-solid fa-key"></i> + Template Redeem Key
                          </button>
                          <button
                            type="button"
                            className="btn-preset-quick"
                            onClick={() =>
                              setFulfillAdminNote(
                                'Pesanan Voucer resmi berhasil diproses. Silakan segera aktivasi di akun Anda. Jika ada kendala, hubungi CS ChaizStore. Terima kasih sudah berbelanja!'
                              )
                            }
                          >
                            + Template Sukses
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. MODE: TOP UP GAME / SALDO */}
                {fulfillMode === 'topup' && (
                  <div className="fulfill-topup-mode-box" style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: 'var(--admin-radius-md)', padding: '16px', marginBottom: '16px' }}>
                    <div className="account-mode-banner" style={{ marginBottom: '14px' }}>
                      <div className="account-banner-header">
                        <i className="fa-solid fa-bolt text-warning account-banner-icon"></i>
                        <div>
                          <strong>Pengiriman Layanan Top Up Game / Saldo</strong>
                          <p>
                            Isi detail Akun / User ID Game pemesan dan konfirmasi status pengiriman saldo/diamond ke pelanggan.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 1. Nama Akun / ID Game */}
                    <div className="admin-form-group account-field-card primary-field-card" style={{ marginBottom: '14px' }}>
                      <label htmlFor="fulfillTopupAccount" className="account-field-label">
                        <span className="account-num-badge">1</span>
                        <i className="fa-solid fa-gamepad text-cyan"></i>
                        <span>Nama Akun / Game ID / User ID:</span>
                        <span className="field-required-pill">Wajib Diisi</span>
                      </label>
                      <input
                        id="fulfillTopupAccount"
                        type="text"
                        className="admin-text-input account-primary-input"
                        placeholder="contoh: ID Game 128491823 (Server 2049) atau Username"
                        value={fulfillAccount}
                        onChange={(e) => setFulfillAccount(e.target.value)}
                        autoFocus
                      />
                    </div>

                    {/* 2. Gmail Pemesan */}
                    <div className="admin-form-group account-field-card primary-field-card" style={{ marginBottom: '14px' }}>
                      <label className="account-field-label">
                        <span className="account-num-badge">2</span>
                        <i className="fa-solid fa-envelope text-warning"></i>
                        <span>Nama Gmail Pelanggan (Data Pesanan):</span>
                      </label>
                      <input
                        type="text"
                        className="admin-text-input"
                        value={selectedOrderForFulfill.customerEmail || '-'}
                        readOnly
                        style={{ opacity: 0.8, cursor: 'not-allowed' }}
                      />
                    </div>

                    {/* 3. Catatan Top Up */}
                    <div className="admin-form-group account-field-card primary-field-card">
                      <label htmlFor="fulfillTopupNote" className="account-field-label">
                        <span className="account-num-badge">3</span>
                        <i className="fa-solid fa-comment-dots text-success"></i>
                        <span>Catatan Pengiriman Top Up:</span>
                      </label>
                      <textarea
                        id="fulfillTopupNote"
                        className="admin-text-input fulfill-note-textarea"
                        rows="3"
                        placeholder="Tuliskan catatan konfirmasi top up..."
                        value={fulfillAdminNote}
                        onChange={(e) => setFulfillAdminNote(e.target.value)}
                      ></textarea>

                      <div className="fulfill-note-presets">
                        <span className="presets-label">Template Catatan:</span>
                        <button
                          type="button"
                          className="btn-preset-quick"
                          onClick={() =>
                            setFulfillAdminNote(
                              `Halo kak ${selectedOrderForFulfill.customerName || ''}, pesanan Top Up ${selectedOrderForFulfill.productName} telah sukses dikirim ke akun ${fulfillAccount || 'Anda'}. Silakan login dan periksa saldo/diamond Anda. Terima kasih!`
                            )
                          }
                        >
                          + Template Top Up Sukses
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. MODE: CATATAN SAJA */}
                {fulfillMode === 'note_only' && (
                  <div className="fulfill-note-mode-box" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--admin-radius-md)', padding: '16px', marginBottom: '16px' }}>
                    <div className="account-mode-banner" style={{ marginBottom: '14px' }}>
                      <div className="account-banner-header">
                        <i className="fa-solid fa-comment-dots text-emerald account-banner-icon"></i>
                        <div>
                          <strong>Kirim Catatan / Panduan Khusus Saja</strong>
                          <p>
                            Gunakan mode ini jika Anda hanya ingin mengirimkan panduan aktivasi, instruksi undangan, atau pesan konfirmasi tanpa menyertakan password akun baru.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="admin-form-group account-field-card primary-field-card">
                      <label htmlFor="fulfillNoteOnly" className="account-field-label">
                        <i className="fa-solid fa-pen-to-square text-cyan"></i>
                        <span>Isi Catatan / Panduan untuk Pelanggan:</span>
                        <span className="field-required-pill">Wajib Diisi</span>
                      </label>
                      <textarea
                        id="fulfillNoteOnly"
                        className="admin-text-input fulfill-note-textarea"
                        rows="4"
                        placeholder="Tuliskan catatan, link undangan, atau panduan aktivasi untuk pelanggan..."
                        value={fulfillAdminNote}
                        onChange={(e) => setFulfillAdminNote(e.target.value)}
                        autoFocus
                        required
                      ></textarea>

                      <div className="fulfill-note-presets">
                        <span className="presets-label">Template Cepat:</span>
                        <button
                          type="button"
                          className="btn-preset-quick"
                          onClick={() =>
                            setFulfillAdminNote(
                              `Halo kak ${selectedOrderForFulfill.customerName || ''}, pesanan Anda untuk ${selectedOrderForFulfill.productName} telah selesai kami proses. Silakan ikuti instruksi yang telah kami siapkan. Jika ada kendala, hubungi CS kami. Terima kasih!`
                            )
                          }
                        >
                          + Template Selesai
                        </button>
                        <button
                          type="button"
                          className="btn-preset-quick"
                          onClick={() =>
                            setFulfillAdminNote(
                              `Halo kak ${selectedOrderForFulfill.customerName || ''}, undangan membership/family ${selectedOrderForFulfill.productName} telah dikirim ke email ${selectedOrderForFulfill.customerEmail || 'Anda'}. Silakan cek inbox/spam email dan klik Terima Undangan. Full garansi aktif!`
                            )
                          }
                        >
                          + Template Undangan Email
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. FITUR UNGGAH FOTO BUKTI PENGIRIMAN DARI ADMIN (OPSIONAL) */}
                <div
                  className="admin-form-group account-field-card primary-field-card"
                  style={{
                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
                    border: '1.5px dashed rgba(56, 189, 248, 0.45)',
                    borderRadius: 'var(--admin-radius-md)',
                    padding: '16px',
                    marginBottom: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <label className="account-field-label" style={{ margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-camera-retro text-cyan" style={{ fontSize: '15px' }}></i>
                      <span>Unggah Foto Bukti / Screenshot Pengiriman (Opsional):</span>
                    </label>
                    <span style={{ fontSize: '11px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                      Otomatis Terkirim ke Pelanggan
                    </span>
                  </div>

                  {fulfillProofPhoto ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        border: '1px solid rgba(16, 185, 129, 0.45)',
                        borderRadius: '10px',
                        padding: '12px 14px'
                      }}
                    >
                      <img
                        src={fulfillProofPhoto.dataUrl}
                        alt="Preview Bukti Admin"
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          border: '2px solid #10b981',
                          boxShadow: '0 0 10px rgba(16, 185, 129, 0.35)',
                          flexShrink: 0
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ color: '#ffffff', fontSize: '13px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {fulfillProofPhoto.name}
                        </strong>
                        <div style={{ fontSize: '11.5px', color: '#34d399', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <i className="fa-solid fa-circle-check"></i>
                          <span>Foto berhasil diunggah ({fulfillProofPhoto.size})</span>
                        </div>
                        <small style={{ color: '#94a3b8', fontSize: '11px' }}>
                          Foto ini akan tampil di menu rincian transaksi pembeli.
                        </small>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFulfillProofPhoto(null);
                          if (fulfillFileInputRef.current) fulfillFileInputRef.current.value = '';
                        }}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          color: '#f87171',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                        title="Hapus foto bukti ini"
                      >
                        <i className="fa-solid fa-trash-can"></i> Hapus
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fulfillFileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleAdminProofChange}
                      />
                      <button
                        type="button"
                        onClick={() => fulfillFileInputRef.current?.click()}
                        style={{
                          width: '100%',
                          padding: '14px',
                          borderRadius: '10px',
                          border: '1.5px dashed rgba(56, 189, 248, 0.45)',
                          background: 'rgba(56, 189, 248, 0.08)',
                          color: '#38bdf8',
                          fontWeight: 600,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '17px' }}></i>
                        <span>Klik untuk Unggah Foto Bukti / Screenshot Selesai (JPG / PNG)</span>
                      </button>
                      <span style={{ display: 'block', fontSize: '11.5px', color: '#94a3b8', marginTop: '6px' }}>
                        💡 Tidak wajib diisi. Jika diunggah, foto bukti akan otomatis dikirim dan bisa dilihat oleh pembeli.
                      </span>
                    </div>
                  )}
                </div>

                {/* FITUR KIRIM LEWAT WHATSAPP (TAMPIL DI SEMUA MODE PENGIRIMAN) */}
                <div className="fulfill-whatsapp-box">
                  <div className="fulfill-wa-header">
                    <div className="fulfill-wa-header-left">
                      <div className="fulfill-wa-icon">
                        <i className="fa-brands fa-whatsapp"></i>
                      </div>
                      <div>
                        <div className="fulfill-wa-title">Fitur Kirim Lewat WhatsApp</div>
                        <span className="fulfill-wa-badge">
                          <i className="fa-solid fa-bolt"></i> Auto-Generate Format Chat
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-preset-quick"
                      style={{ margin: 0, padding: '4px 10px', fontSize: '11px' }}
                      onClick={handleCopyWaText}
                      title="Salin isi pesan ke clipboard"
                    >
                      <i className={`fa-solid ${copyWaSuccess ? 'fa-check text-success' : 'fa-copy'}`}></i>
                      <span>{copyWaSuccess ? 'Tersalin!' : 'Salin Teks WA'}</span>
                    </button>
                  </div>

                  {/* Input Nomor WhatsApp Pelanggan */}
                  <div className="fulfill-wa-phone-row">
                    <div>
                      <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        <i className="fa-brands fa-whatsapp text-success" style={{ marginRight: '6px' }}></i>
                        Nomor WhatsApp Pelanggan (Tujuan Chat):
                      </label>
                      <div className="fulfill-wa-phone-input-wrap">
                        <i className="fa-brands fa-whatsapp fulfill-wa-phone-icon"></i>
                        <input
                          type="tel"
                          className="admin-text-input fulfill-wa-phone-input"
                          placeholder="contoh: 08123456789 atau 628123456789"
                          value={fulfillCustomerPhone}
                          onChange={(e) => setFulfillCustomerPhone(e.target.value)}
                        />
                      </div>
                    </div>
                    <div style={{ paddingTop: '18px' }}>
                      {selectedOrderForFulfill.customerPhone && (
                        <button
                          type="button"
                          className="btn-preset-quick"
                          style={{ margin: 0, padding: '8px 12px', fontSize: '12px' }}
                          onClick={() => {
                            setFulfillCustomerPhone(selectedOrderForFulfill.customerPhone);
                            showToast('Nomor HP dari pesanan dimuat ulang!', 'fa-phone', 'info');
                          }}
                          title="Gunakan nomor dari data pesanan"
                        >
                          <i className="fa-solid fa-rotate-left"></i> Reset Nomor
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Live Preview Box */}
                  <div className="fulfill-wa-preview-card">
                    <div className="fulfill-wa-preview-header">
                      <span className="fulfill-wa-preview-badge">
                        <i className="fa-solid fa-eye"></i> Live Preview Pesan WhatsApp Pelanggan
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Field kosong otomatis tidak dimasukkan
                      </span>
                    </div>
                    <div className="fulfill-wa-preview-bubble">
                      {formatWhatsAppFulfillMessage(
                        selectedOrderForFulfill,
                        fulfillMode,
                        {
                          account: fulfillAccount,
                          password: fulfillPassword,
                          profile: fulfillProfile,
                          pin: fulfillPin,
                          duration: fulfillDuration,
                          warranty: fulfillWarranty,
                          code: fulfillCode,
                          email: fulfillAccount || selectedOrderForFulfill.customerEmail || selectedOrderForFulfill.userEmail || selectedOrderForFulfill.email,
                          phone: fulfillCustomerPhone || selectedOrderForFulfill.customerPhone || selectedOrderForFulfill.phone || selectedOrderForFulfill.wa,
                          adminProofUrl: fulfillProofPhoto?.dataUrl || null
                        },
                        fulfillAdminNote
                      )}
                    </div>
                    <div className="fulfill-wa-rule-notice">
                      <i className="fa-solid fa-circle-check" style={{ marginTop: '2px' }}></i>
                      <span>
                        <strong>Aturan Otomatis:</strong> Kolom yang kosong (Nama Gmail, Password, Profil, Code PIN, atau Voucer) secara otomatis <em>tidak akan disertakan</em> di pesan WhatsApp. Hanya bagian yang Anda isi yang akan dikirim ke chat WhatsApp pelanggan.
                      </span>
                    </div>

                    {/* TOMBOL UTAMA: LANGSUNG KIRIM KE WA PELANGGAN */}
                    <div className="fulfill-wa-direct-action-card">
                      <button
                        type="button"
                        className="btn-fulfill-submit-whatsapp btn-fulfill-giant-wa"
                        disabled={isFulfilling}
                        onClick={(e) => handleFulfillSubmit(e, true)}
                        title="Simpan pesanan selesai & langsung buka chat WhatsApp ke nomor pelanggan"
                      >
                        <i className={`fa-brands ${isFulfilling ? 'fa-spinner fa-spin' : 'fa-whatsapp'} giant-wa-icon`}></i>
                        <div className="giant-wa-text-wrap">
                          <span className="giant-wa-title">
                            {isFulfilling ? 'Sedang Memproses...' : 'Kirim Pesanan ke WhatsApp Pelanggan'}
                          </span>
                          <span className="giant-wa-sub">
                            {fulfillCustomerPhone || selectedOrderForFulfill.customerPhone
                              ? `Tujuan Chat: ${cleanPhoneNumber(fulfillCustomerPhone || selectedOrderForFulfill.customerPhone)} • Kredensial & catatan otomatis masuk`
                              : 'Klik untuk masukkan nomor WA & kirim langsung'}
                          </span>
                        </div>
                        <i className="fa-solid fa-paper-plane giant-wa-arrow"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setSelectedOrderForFulfill(null)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn-modal-save btn-fulfill-secondary-save"
                  disabled={isFulfilling}
                  onClick={(e) => handleFulfillSubmit(e, false)}
                  title="Simpan status pesanan selesai ke database saja tanpa membuka WhatsApp"
                >
                  <i className={`fa-solid ${isFulfilling ? 'fa-spinner fa-spin' : 'fa-check'}`}></i>
                  <span>Proses di Web Saja</span>
                </button>
                <button
                  type="button"
                  className="btn-modal-save btn-fulfill-submit-whatsapp"
                  disabled={isFulfilling}
                  onClick={(e) => handleFulfillSubmit(e, true)}
                  title="Simpan pesanan selesai dan langsung buka chat WhatsApp ke nomor pelanggan"
                >
                  <i className={`fa-brands ${isFulfilling ? 'fa-spinner fa-spin' : 'fa-whatsapp'}`}></i>
                  <span>Kirim Pesanan Lewat WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: BUKTI KIRIMAN / TRANSFER PEMBAYARAN PEMBELI
          =================================================================== */}
      {/* ===================================================================
          MODAL: BUKTI KIRIMAN / TRANSFER PEMBAYARAN PEMBELI
          =================================================================== */}
      {selectedOrderProof && (
        <div
          className="admin-modal-backdrop proof-modal-backdrop"
          onClick={() => {
            setSelectedOrderProof(null);
            setProofImgError(false);
          }}
        >
          <div className="admin-modal-box modal-box-proof" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="modal-title-wrap">
                <i className="fa-solid fa-receipt text-cyan"></i>
                <div>
                  <h3>Bukti Kiriman Pembayaran: #{selectedOrderProof.id}</h3>
                  <span className="modal-subtitle-text">
                    Pemesan: <strong>{selectedOrderProof.customerName}</strong> ({selectedOrderProof.customerPhone || selectedOrderProof.customerEmail}) • {selectedOrderProof.productName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => {
                  setSelectedOrderProof(null);
                  setProofImgError(false);
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="admin-modal-body">
              {/* Timer & Expiry Alert Notice */}
              <div className="proof-timer-card">
                <div className="proof-timer-icon">
                  <i className="fa-solid fa-hourglass-half"></i>
                </div>
                <div className="proof-timer-info">
                  <strong>Masa Simpan Foto Bukti: 2 Hari (48 Jam)</strong>
                  <p>
                    Foto bukti pembayaran ini diunggah pada <strong>{new Date(selectedOrderProof.proofUploadedAt || selectedOrderProof.createdAt).toLocaleString('id-ID')} WIB</strong>.
                    Sesuai ketentuan, file foto ini <strong>akan otomatis terhapus dalam waktu 2 hari</strong> sejak dikirim untuk menjaga kebersihan sistem dan privasi pelanggan.
                  </p>
                  <div className="proof-timer-countdown">
                    <i className="fa-regular fa-clock text-warning"></i>
                    <span>Status Waktu: <strong className="text-warning">{getProofTimeRemaining(selectedOrderProof).text}</strong></span>
                  </div>
                </div>
              </div>

              {/* Photo Display Container */}
              {selectedOrderProof.proofUrl && !proofImgError ? (
                <div className="proof-photo-wrapper">
                  <div className="proof-photo-meta-bar">
                    <span className="proof-filename">
                      <i className="fa-solid fa-file-image text-cyan"></i> {selectedOrderProof.proofFileName || 'Bukti_Transfer.png'}
                    </span>
                    {selectedOrderProof.proofSize && (
                      <span className="proof-filesize">Ukuran: {selectedOrderProof.proofSize}</span>
                    )}
                    <a
                      href={selectedOrderProof.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-open-original"
                      title="Buka gambar di tab baru"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square"></i> Buka Full ↗
                    </a>
                  </div>

                  <div className="proof-image-display">
                    <img
                      src={selectedOrderProof.proofUrl}
                      alt={`Bukti Transfer ${selectedOrderProof.customerName}`}
                      className="proof-img-element"
                      onError={() => setProofImgError(true)}
                    />
                  </div>
                </div>
              ) : proofImgError ? (
                <div className="proof-image-error-card">
                  <i className="fa-solid fa-triangle-exclamation text-warning"></i>
                  <div>
                    <h4>Foto Bukti Tidak Dapat Ditampilkan</h4>
                    <p>
                      File gambar bukti transfer pesanan ini mungkin merupakan URL eksternal lama yang sudah kedaluwarsa atau diblokir oleh jaringan.
                    </p>
                    {selectedOrderProof.proofUrl && (
                      <a
                        href={selectedOrderProof.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-open-fallback-link"
                      >
                        <i className="fa-solid fa-arrow-up-right-from-square"></i> Buka Link Foto di Tab Baru
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="proof-deleted-alert">
                  <i className="fa-solid fa-circle-exclamation text-danger"></i>
                  <div>
                    <strong>Foto Bukti Telah Dihapus / Tidak Tersedia</strong>
                    <p>{selectedOrderProof.proofDeletedReason || 'Foto bukti sudah kedaluwarsa setelah 2 hari atau dihapus oleh Admin.'}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {selectedOrderProof.proofUrl && (
                  <button
                    type="button"
                    className="btn-admin-delete-proof"
                    onClick={() => handleDeleteProof(selectedOrderProof.id)}
                    title="Hapus foto bukti pembayaran ini sekarang dari database"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                    <span>Hapus Foto Bukti Sekarang</span>
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => {
                    setSelectedOrderProof(null);
                    setProofImgError(false);
                  }}
                >
                  Tutup
                </button>
                <button
                  type="button"
                  className="btn-modal-save"
                  onClick={() => {
                    const target = selectedOrderProof;
                    setSelectedOrderProof(null);
                    setProofImgError(false);
                    handleOpenFulfillModal(target);
                  }}
                >
                  <i className="fa-solid fa-paper-plane"></i>
                  <span>Lanjut Proses & Kirim Akun</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      <div className="admin-toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`admin-toast-card toast-${t.type}`}>
            <i className={`fa-solid ${t.icon}`}></i>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
