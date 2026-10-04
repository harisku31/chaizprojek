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
  deleteTransactionProof,
  getProofTimeRemaining,
  clearAllTransactions,
  syncTransactionsFromCloud
} from '../utils/transactions';

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
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'processing' | 'completed'
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrderForFulfill, setSelectedOrderForFulfill] = useState(null);
  const [fulfillAccount, setFulfillAccount] = useState('');
  const [fulfillPassword, setFulfillPassword] = useState('');
  const [fulfillUsername, setFulfillUsername] = useState('');
  const [fulfillPin, setFulfillPin] = useState('');
  const [fulfillProfile, setFulfillProfile] = useState('');
  const [fulfillCode, setFulfillCode] = useState('');
  const [fulfillAdminNote, setFulfillAdminNote] = useState('');
  const [showFulfillPassword, setShowFulfillPassword] = useState(false);
  const [showExtraFields, setShowExtraFields] = useState(false);
  const [selectedOrderProof, setSelectedOrderProof] = useState(null); // Modal Bukti Kiriman Foto Pembeli
  const [proofImgError, setProofImgError] = useState(false);
  const [fulfillMode, setFulfillMode] = useState('account'); // 'account' | 'steam'
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
          reloadAllData();
          if (ev.data?.type === 'USERS_UPDATED') {
            showToast('Daftar status pengguna diperbarui realtime!', 'fa-bolt', 'info');
          } else if (ev.data?.type === 'ACTIVITIES_UPDATED') {
            showToast('Aktivitas baru pengguna baru saja tercatat!', 'fa-clock-rotate-left', 'info');
          } else if (ev.data?.type === 'USER_BANNED') {
            showToast('Sanksi Banned pengguna berhasil diterapkan!', 'fa-ban', 'warning');
          } else if (ev.data?.type === 'USER_UNBANNED') {
            showToast('Sanksi Banned pengguna telah dicabut!', 'fa-circle-check', 'success');
          } else if (ev.data?.type === 'NEW_TRANSACTION') {
            showToast('Pesanan baru masuk dari pelanggan!', 'fa-receipt', 'success');
          } else if (ev.data?.type === 'TRANSACTION_FULFILLED') {
            showToast('Pesanan berhasil diproses & akun terkirim!', 'fa-circle-check', 'success');
          } else if (ev.data?.type === 'TRANSACTION_RATED') {
            showToast('Pelanggan telah memberikan rating bintang!', 'fa-star', 'info');
          }
        };
      } catch (e) {
        // ignore
      }
    }

    // Cloud Event Listeners (Firebase Cloud Realtime Updates)
    const handleCustomTrx = (e) => {
      reloadAllData();
      if (e.detail?.type === 'NEW_TRANSACTION') {
        showToast('Pesanan baru masuk dari pelanggan!', 'fa-receipt', 'success');
      }
    };

    window.addEventListener('chaiz_trx_updated', handleCustomTrx);

    // Auto poll every 3 seconds for live online/offline heartbeat detection & countdown
    const interval = setInterval(() => {
      reloadAllData();
      setTick((t) => t + 1);
    }, 3000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('chaiz_trx_updated', handleCustomTrx);
      if (bc) bc.close();
      clearInterval(interval);
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

    ordersList.forEach((o) => {
      totalRevenue += Number(o.total) || 0;
      if (o.status === 'completed') completedCount++;
      if (o.status === 'processing') processingCount++;
    });

    return {
      total: ordersList.length,
      processing: processingCount,
      completed: completedCount,
      totalRevenue
    };
  }, [ordersList]);

  const filteredOrders = useMemo(() => {
    return ordersList.filter((order) => {
      if (orderFilter === 'processing' && order.status !== 'processing') return false;
      if (orderFilter === 'completed' && order.status !== 'completed') return false;

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
    setSelectedOrderForFulfill(order);
    const isSteam =
      order.productCategory === 'Steam Key' ||
      (order.productName || '').toLowerCase().includes('steam key') ||
      (order.productName || '').toLowerCase().includes('steam');
    setFulfillMode(isSteam ? 'steam' : 'account');

    // Auto pre-fill with customer's email if fulfilling regular account
    const customerMail =
      order.customerEmail && order.customerEmail !== '-' ? order.customerEmail : '';
    const initialAccount = order.credentials?.account || (!isSteam ? customerMail : '');

    setFulfillAccount(initialAccount);
    setFulfillPassword(order.credentials?.password || '');
    setFulfillUsername(order.credentials?.username || '');
    setFulfillPin(order.credentials?.pin || '');
    setFulfillProfile(order.credentials?.profile || '');
    setFulfillCode(order.credentials?.code || '');
    setShowExtraFields(
      Boolean(
        order.credentials?.password ||
          order.credentials?.pin ||
          order.credentials?.profile
      )
    );
    setFulfillAdminNote(
      order.adminNote ||
        (isSteam
          ? 'Steam Key Original aktif & bergaransi resmi Valve. Cara Aktivasi: Buka aplikasi Steam di PC -> Klik menu "Games" -> Klik "Activate a Product on Steam" -> Masukkan Code Key di atas -> Klik Lanjut. Selamat bermain!'
          : `Layanan Akun ${order.productName || 'Premium'} sudah berhasil diproses dan diaktifkan langsung ke email Anda (${customerMail || 'email terdaftar'}). Silakan periksa inbox atau undangan email Anda. Garansi penuh ChaizStore aktif!`)
    );
    setShowFulfillPassword(false);
  };

  const handleFulfillSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrderForFulfill || isFulfilling) return;

    if (fulfillMode === 'steam') {
      if (!fulfillCode.trim()) {
        showToast('Harap masukkan Code Key Steam yang akan dikirim!', 'fa-triangle-exclamation', 'warning');
        return;
      }
    } else {
      if (!fulfillAccount.trim() && !fulfillCode.trim()) {
        showToast('Harap isi Akun / Gmail Pelanggan terlebih dahulu!', 'fa-triangle-exclamation', 'warning');
        return;
      }
    }

    setIsFulfilling(true);
    try {
      const fulfilled = await fulfillTransaction(
        selectedOrderForFulfill.id,
        {
          account: fulfillMode === 'steam' ? '' : fulfillAccount.trim(),
          password: fulfillMode === 'steam' ? '' : fulfillPassword.trim(),
          username: fulfillMode === 'steam' ? '' : fulfillUsername.trim(),
          pin: fulfillMode === 'steam' ? '' : fulfillPin.trim(),
          profile: fulfillMode === 'steam' ? '' : fulfillProfile.trim(),
          code: fulfillCode.trim()
        },
        fulfillAdminNote.trim(),
        selectedOrderForFulfill
      );

      // Kurangi stok produk secara realtime di database saat admin memproses selesai & kirim akun
      let stockResult = null;
      try {
        const prodIdentifier =
          selectedOrderForFulfill.productId ||
          selectedOrderForFulfill.productName;
        const qtyToDeduct = selectedOrderForFulfill.qty || 1;
        const sentEmail = fulfillMode === 'account' ? fulfillAccount.trim() : null;
        stockResult = deductProductStock(prodIdentifier, qtyToDeduct, sentEmail);
      } catch (errStock) {
        console.warn('Gagal memotong stok saat fulfillment:', errStock);
      }

      recordUserActivity(
        adminSession || { name: 'Admin ChaizStore', email: 'admin@chaizstore.local' },
        'ORDER_FULFILLED',
        `Memproses pesanan #${selectedOrderForFulfill.id} (${selectedOrderForFulfill.productName}) untuk ${selectedOrderForFulfill.customerName} - ${fulfillMode === 'steam' ? 'Code Key Steam terkirim' : 'Kredensial akun terkirim'} (Stok otomatis terpotong)`
      );

      // Perbarui tampilan ordersList secara instan
      setOrdersList((prev) =>
        prev.map((o) => (o.id === selectedOrderForFulfill.id ? { ...o, ...(fulfilled || {}), status: 'completed' } : o))
      );
      setProductsList(getDatabaseProducts());

      const stockNote = stockResult
        ? ` • Sisa stok ${stockResult.product?.name || 'produk'}: ${stockResult.newStock} akun`
        : '';

      showToast(
        `Pesanan #${selectedOrderForFulfill.id} berhasil diproses & dikirim ke Cloud! Pembeli dapat langsung melihat akun.${stockNote}`,
        'fa-circle-check',
        'success'
      );
      setSelectedOrderForFulfill(null);
    } catch (err) {
      showToast('Gagal memproses pesanan: ' + err.message, 'fa-circle-xmark', 'error');
    } finally {
      setIsFulfilling(false);
    }
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
                    <i className="fa-solid fa-circle-check" style={{ color: '#10b981' }}></i>
                    <span className="tab-label">Pesanan Selesai</span>
                    <span className="tab-counter-badge">{ordersStats.completed}</span>
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
                        const hasCreds =
                          order.credentials &&
                          (order.credentials.account || order.credentials.code || order.credentials.password);
                        const proofTimeInfo = getProofTimeRemaining(order);

                        return (
                          <tr key={order.id} className={isProcessing ? 'row-processing' : 'row-completed'}>
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
                                <span className="customer-sub-text customer-username-pill">
                                  <i className="fa-solid fa-at text-purple"></i> {order.customerUsername}
                                </span>
                              )}
                              {order.customerEmail && order.customerEmail !== '-' && (
                                <span className="customer-sub-text">
                                  <i className="fa-regular fa-envelope"></i> {order.customerEmail}
                                </span>
                              )}
                              {order.customerPhone && order.customerPhone !== '-' && (
                                <span className="customer-sub-text">
                                  <i className="fa-brands fa-whatsapp text-success"></i> {order.customerPhone}
                                </span>
                              )}
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
                              ) : (
                                <span className="admin-status-badge badge-completed">
                                  <i className="fa-solid fa-circle-check"></i>
                                  <span>Selesai / Terkirim</span>
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

                            {/* Actions */}
                            <td className="cell-action">
                              <div className="order-actions-cell-group">
                                <button
                                  type="button"
                                  className={`btn-admin-order-action ${isProcessing ? 'btn-action-fulfill' : 'btn-action-edit'}`}
                                  onClick={() => handleOpenFulfillModal(order)}
                                >
                                  <i className={isProcessing ? 'fa-solid fa-paper-plane' : 'fa-solid fa-pen-to-square'}></i>
                                  <span>{isProcessing ? 'Proses & Kirim Akun' : 'Lihat / Ubah Data'}</span>
                                </button>
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
                    {selectedOrderForFulfill.productName} • Pemesan: <strong>{selectedOrderForFulfill.customerName}</strong>
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

            <form onSubmit={handleFulfillSubmit}>
              <div className="admin-modal-body">
                {/* Order Summary Strip */}
                <div className="fulfill-order-strip">
                  <div className="strip-item">
                    <span className="strip-label">Produk</span>
                    <strong className="strip-val">{selectedOrderForFulfill.productName}</strong>
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
                      Rp {Number(selectedOrderForFulfill.total || selectedOrderForFulfill.price).toLocaleString('id-ID')}
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
                        • <strong className="text-warning">{getProofTimeRemaining(selectedOrderForFulfill).text}</strong>
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

                  <div className="fulfill-customer-grid">
                    {/* Nama Lengkap */}
                    <div className="customer-tile">
                      <span className="customer-tile-label">
                        <i className="fa-solid fa-user text-cyan"></i> Nama Lengkap:
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
                        <i className="fa-solid fa-envelope text-warning"></i> Gmail / Email Pelanggan:
                      </span>
                      <div className="customer-tile-content">
                        <strong className="customer-tile-val email-val">{selectedOrderForFulfill.customerEmail || '-'}</strong>
                        <div className="customer-tile-btns">
                          {selectedOrderForFulfill.customerEmail && selectedOrderForFulfill.customerEmail !== '-' && (
                            <button
                              type="button"
                              className="btn-use-gmail-quick"
                              onClick={() => {
                                setFulfillAccount(selectedOrderForFulfill.customerEmail);
                                showToast('Gmail pelanggan dimasukkan ke kolom akun!', 'fa-bolt', 'success');
                              }}
                              title="Masukkan email ini ke kolom formulir Akun"
                            >
                              <i className="fa-solid fa-arrow-turn-down"></i> Pakai Gmail Ini
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-customer-tile-action"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedOrderForFulfill.customerEmail || '');
                              showToast('Gmail pembeli disalin!', 'fa-copy', 'info');
                            }}
                            title="Salin Gmail"
                          >
                            <i className="fa-solid fa-copy"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div className="customer-tile tile-wa-focus">
                      <span className="customer-tile-label">
                        <i className="fa-brands fa-whatsapp text-success"></i> WhatsApp / No. HP:
                      </span>
                      <div className="customer-tile-content">
                        <strong className="customer-tile-val wa-val">{selectedOrderForFulfill.customerPhone || '-'}</strong>
                        <div className="customer-tile-btns">
                          {selectedOrderForFulfill.customerPhone && selectedOrderForFulfill.customerPhone !== '-' && (
                            <a
                              href={`https://wa.me/${selectedOrderForFulfill.customerPhone.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(`Halo kak ${selectedOrderForFulfill.customerName || ''}, pesanan ${selectedOrderForFulfill.productName} di ChaizStore sedang kami proses.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-chat-wa-quick"
                              title="Buka Chat WhatsApp ke nomor pembeli"
                            >
                              <i className="fa-brands fa-whatsapp"></i> Chat WA
                            </a>
                          )}
                          <button
                            type="button"
                            className="btn-customer-tile-action"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedOrderForFulfill.customerPhone || '');
                              showToast('Nomor WhatsApp disalin!', 'fa-copy', 'info');
                            }}
                            title="Salin Nomor WhatsApp"
                          >
                            <i className="fa-solid fa-copy"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Username jika ada */}
                    {selectedOrderForFulfill.customerUsername && selectedOrderForFulfill.customerUsername !== '-' && (
                      <div className="customer-tile">
                        <span className="customer-tile-label">
                          <i className="fa-solid fa-id-badge text-purple"></i> Username:
                        </span>
                        <div className="customer-tile-content">
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
                </div>

                {/* Mode Selector Tabs: Akun Premium vs Steam Key */}
                <div className="fulfill-mode-selector-card">
                  <div className="fulfill-mode-header">
                    <span className="fulfill-mode-title">
                      <i className="fa-solid fa-sliders text-cyan"></i> Pilihan Format Pengiriman:
                    </span>
                    <span className="fulfill-mode-hint">
                      {fulfillMode === 'steam' ? '🎮 Mode Steam Key (2 Kolom Khusus)' : '🛡️ Mode Akun Premium (Canva, Netflix, dll)'}
                    </span>
                  </div>
                  <div className="fulfill-mode-tab-buttons">
                    <button
                      type="button"
                      className={`btn-mode-tab ${fulfillMode === 'account' ? 'active' : ''}`}
                      onClick={() => setFulfillMode('account')}
                    >
                      <i className="fa-solid fa-user-shield"></i>
                      <span>Akun Premium (Canva, Netflix, dll)</span>
                    </button>
                    <button
                      type="button"
                      className={`btn-mode-tab btn-mode-tab-steam ${fulfillMode === 'steam' ? 'active' : ''}`}
                      onClick={() => setFulfillMode('steam')}
                    >
                      <i className="fa-brands fa-steam"></i>
                      <span>Steam Key (2 Kolom Khusus)</span>
                    </button>
                  </div>
                </div>

                {/* Vault Helper: Check if Gudang has ready accounts for this product (Only in account mode) */}
                {fulfillMode === 'account' && (() => {
                  const match = productsList.find(
                    (p) =>
                      p.name.toLowerCase().includes(selectedOrderForFulfill.productName.toLowerCase()) ||
                      selectedOrderForFulfill.productName.toLowerCase().includes(p.name.toLowerCase())
                  );
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
                              key={acc.id}
                              type="button"
                              className="btn-vault-quick-pick"
                              onClick={() => {
                                setFulfillAccount(acc.email);
                                setFulfillPassword(acc.password);
                                if (acc.note) setFulfillProfile(acc.note);
                                setShowExtraFields(true);
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

                {fulfillMode === 'steam' ? (
                  /* 2 KOLOM KHUSUS STEAM KEY: 1. Code Key & 2. Catatan */
                  <div className="fulfill-steam-mode-box">
                    <div className="steam-mode-banner">
                      <i className="fa-brands fa-steam steam-banner-icon"></i>
                      <div className="steam-banner-text">
                        <strong>Pengiriman Khusus Steam Key (2 Kolom)</strong>
                        <p>
                          Format otomatis Steam Key: Cukup isi <strong>1. Code Key</strong> dan <strong>2. Catatan</strong>. Tidak memerlukan email/password akun.
                        </p>
                      </div>
                    </div>

                    <div className="steam-two-fields-wrapper">
                      {/* 1. Code Key */}
                      <div className="admin-form-group steam-field-card">
                        <label htmlFor="fulfillSteamCode" className="steam-field-label">
                          <span className="steam-num-badge">1</span>
                          <i className="fa-solid fa-key text-warning"></i>
                          <span>Code Key (Serial Key Steam)</span>
                          <span className="field-required-pill">Wajib Diisi</span>
                        </label>
                        <input
                          id="fulfillSteamCode"
                          type="text"
                          className="admin-text-input steam-code-input"
                          placeholder="contoh: STEAM-XXXXX-YYYYY-ZZZZZ atau KEY-ORIGINAL-8821"
                          value={fulfillCode}
                          onChange={(e) => setFulfillCode(e.target.value)}
                          required
                          autoFocus
                        />
                        <span className="field-sub-hint">
                          Kode Serial Key ini akan langsung tampil di menu Transaksi pembeli lengkap dengan tombol "Salin" instan untuk aktivasi di Steam Client.
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
                          placeholder="Tuliskan catatan cara aktivasi key di Steam atau pesan untuk pelanggan..."
                          value={fulfillAdminNote}
                          onChange={(e) => setFulfillAdminNote(e.target.value)}
                        ></textarea>

                        {/* Quick Presets for Steam Key */}
                        <div className="fulfill-note-presets">
                          <span className="presets-label">Template Catatan Steam:</span>
                          <button
                            type="button"
                            className="btn-preset-quick btn-preset-steam"
                            onClick={() =>
                              setFulfillAdminNote(
                                'Steam Key Original aktif & bergaransi resmi Valve. Cara Aktivasi: Buka aplikasi Steam di PC -> Klik menu "Games" -> Klik "Activate a Product on Steam" -> Masukkan Code Key di atas -> Klik Lanjut. Selamat bermain!'
                              )
                            }
                          >
                            <i className="fa-brands fa-steam"></i> + Template Redeem Steam
                          </button>
                          <button
                            type="button"
                            className="btn-preset-quick"
                            onClick={() =>
                              setFulfillAdminNote(
                                'Pesanan Steam Key resmi berhasil diproses. Silakan segera aktivasi di akun Steam Anda. Jika ada kendala, hubungi CS ChaizStore. Terima kasih sudah belanja!'
                              )
                            }
                          >
                            + Template Sukses
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="fulfill-account-simplified-box">
                    <div className="account-mode-banner">
                      <div className="account-banner-header">
                        <i className="fa-solid fa-circle-check text-success account-banner-icon"></i>
                        <div>
                          <strong>Proses Cepat via Gmail Pelanggan</strong>
                          <p>
                            Cukup masukkan <strong>Gmail Pelanggan</strong> dan <strong>Catatan Konfirmasi</strong>. Anda tidak perlu meminta password dari pembeli.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 1. AKUN / GMAIL PELANGGAN */}
                    <div className="admin-form-group account-field-card primary-field-card">
                      <div className="field-card-header">
                        <label htmlFor="fulfillAccount" className="account-field-label">
                          <span className="account-num-badge">1</span>
                          <i className="fa-solid fa-envelope text-cyan"></i>
                          <span>Akun / Gmail Pelanggan (Tujuan Layanan / Undangan)</span>
                          <span className="field-required-pill">Wajib Diisi</span>
                        </label>
                        {selectedOrderForFulfill.customerEmail && selectedOrderForFulfill.customerEmail !== '-' && (
                          <button
                            type="button"
                            className="btn-use-customer-gmail-inline"
                            onClick={() => {
                              setFulfillAccount(selectedOrderForFulfill.customerEmail);
                              showToast('Gmail pelanggan dimasukkan ke kolom akun!', 'fa-bolt', 'success');
                            }}
                          >
                            <i className="fa-solid fa-arrow-turn-down"></i> Salin Dari Pelanggan
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
                        required
                        autoFocus
                      />
                      <span className="field-sub-hint">
                        <i className="fa-solid fa-circle-info text-cyan"></i> Email ini yang akan menerima invite Canva Pro, Family Invite Spotify/YouTube, atau kredensial akun.
                      </span>
                    </div>

                    {/* 2. CATATAN KHUSUS ADMIN */}
                    <div className="admin-form-group account-field-card primary-field-card">
                      <label htmlFor="fulfillAdminNote" className="account-field-label">
                        <span className="account-num-badge">2</span>
                        <i className="fa-solid fa-comment-dots text-warning"></i>
                        <span>Catatan Konfirmasi / Panduan Pelanggan (Tampil di Menu Transaksi)</span>
                      </label>
                      <textarea
                        id="fulfillAdminNote"
                        className="admin-text-input fulfill-note-textarea"
                        rows="3"
                        placeholder="Tuliskan catatan konfirmasi bahwa pesanan sudah diproses atau cara aktivasi akun..."
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
                              `Halo kak ${selectedOrderForFulfill.customerName || ''}, akun Canva Pro sudah aktif langsung di email ${fulfillAccount || selectedOrderForFulfill.customerEmail || 'Anda'}. Silakan buka Canva.com atau aplikasi Canva dan cek invite tim. Full garansi 100%! Selamat berkarya!`
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
                        <button
                          type="button"
                          className="btn-preset-quick"
                          onClick={() =>
                            setFulfillAdminNote(
                              `Pesanan ${selectedOrderForFulfill.productName} Anda telah berhasil diproses ke email Anda. Silakan dicek langsung. Terima kasih telah berbelanja di ChaizStore!`
                            )
                          }
                        >
                          + Template Selesai
                        </button>
                      </div>
                    </div>

                    {/* OPTIONAL EXTRA FIELDS TOGGLE (PASSWORD, PIN, PROFIL, KODE) */}
                    <div className="fulfill-extra-accordion-section">
                      <button
                        type="button"
                        className={`btn-toggle-extra-accordion ${showExtraFields ? 'active' : ''}`}
                        onClick={() => setShowExtraFields(!showExtraFields)}
                      >
                        <div className="extra-accordion-title">
                          <i className={`fa-solid ${showExtraFields ? 'fa-circle-chevron-down text-cyan' : 'fa-circle-plus text-muted'}`}></i>
                          <span>{showExtraFields ? 'Tutup Kredensial Tambahan' : 'Tambah Detail Tambahan (Password, PIN, Profil, Kode) - Opsional'}</span>
                        </div>
                        <span className="extra-accordion-badge">
                          {showExtraFields ? 'Sedang Ditampilkan' : 'Tidak Wajib'}
                        </span>
                      </button>

                      {showExtraFields && (
                        <div className="extra-fields-collapsible-content">
                          <p className="extra-fields-info-text">
                            <i className="fa-solid fa-circle-info"></i> Bagian ini <strong>hanya jika</strong> jenis produk memerlukan password bersama (shared/Netflix), PIN profil, atau kode khusus:
                          </p>

                          <div className="fulfill-fields-grid">
                            {/* Password */}
                            <div className="admin-form-group">
                              <label htmlFor="fulfillPassword">
                                <i className="fa-solid fa-lock text-warning"></i> Password Akun (Opsional)
                              </label>
                              <div className="password-input-wrapper">
                                <input
                                  id="fulfillPassword"
                                  type={showFulfillPassword ? 'text' : 'password'}
                                  className="admin-text-input"
                                  placeholder="contoh: SecretPass2026!"
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

                            {/* Username */}
                            <div className="admin-form-group">
                              <label htmlFor="fulfillUsername">
                                <i className="fa-solid fa-user-tag text-purple"></i> Username (Opsional)
                              </label>
                              <input
                                id="fulfillUsername"
                                type="text"
                                className="admin-text-input"
                                placeholder="contoh: chaiz_member1"
                                value={fulfillUsername}
                                onChange={(e) => setFulfillUsername(e.target.value)}
                              />
                            </div>

                            {/* PIN */}
                            <div className="admin-form-group">
                              <label htmlFor="fulfillPin">
                                <i className="fa-solid fa-hashtag text-success"></i> PIN Profile (Khusus Netflix/dll)
                              </label>
                              <input
                                id="fulfillPin"
                                type="text"
                                className="admin-text-input"
                                placeholder="contoh: 1234"
                                value={fulfillPin}
                                onChange={(e) => setFulfillPin(e.target.value)}
                              />
                            </div>

                            {/* Profile / Screen */}
                            <div className="admin-form-group">
                              <label htmlFor="fulfillProfile">
                                <i className="fa-solid fa-tv text-cyan"></i> Profile / Slot (Opsional)
                              </label>
                              <input
                                id="fulfillProfile"
                                type="text"
                                className="admin-text-input"
                                placeholder="contoh: Profile 2 / Layar 1"
                                value={fulfillProfile}
                                onChange={(e) => setFulfillProfile(e.target.value)}
                              />
                            </div>

                            {/* Code / Key */}
                            <div className="admin-form-group">
                              <label htmlFor="fulfillCode">
                                <i className="fa-solid fa-barcode text-warning"></i> Kode / Invitation Code (Opsional)
                              </label>
                              <input
                                id="fulfillCode"
                                type="text"
                                className="admin-text-input"
                                placeholder="contoh: INVITE-PRO-772"
                                value={fulfillCode}
                                onChange={(e) => setFulfillCode(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setSelectedOrderForFulfill(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-modal-save btn-fulfill-submit"
                  disabled={isFulfilling}
                >
                  <i className={`fa-solid ${isFulfilling ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
                  <span>{isFulfilling ? 'Mengirim ke Cloud...' : 'Proses Berhasil & Kirim ke Pelanggan'}</span>
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
