import React, { useState, useEffect, useRef } from 'react';
import { formatRupiah, compressImageFile } from '../utils/format';
import {
  getUserTransactions,
  isOrderOwnedByUser
} from '../utils/transactions';
import { parseDevice, parseBrowser } from '../utils/userTracker';
import {
  createDeposit,
  createApprovedGatewayDeposit,
  getUserDeposits,
  syncDepositsFromCloud
} from '../utils/deposits';
import {
  createJansPaymentQris,
  checkJansPaymentStatus,
  generateChaizDynamicQris,
  MERCHANT_NMID,
  MERCHANT_NAME
} from '../utils/qrisGateway';
import { playUserSuccessSound, playUserRejectSound } from '../utils/audioNotification';
import {
  getUserStore,
  registerUserStore,
  updateUserStore,
  getSellerProducts,
  addSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  toggleSellerProductStatus,
  syncSellerStoresFromCloud,
  listenToSellerUpdates
} from '../utils/sellerStores';

export default function UserProfilePage({
  authUser,
  onUpdateUser,
  onBackToStore,
  onGoToTransactions,
  onOpenLogin,
  onLogout,
  onShowToast
}) {
  // Edit Profile Modal / Form State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isTopUpMoneyModalOpen, setIsTopUpMoneyModalOpen] = useState(false);
  const [isCompressingProof, setIsCompressingProof] = useState(false);

  // Form Fields
  const [editUsername, setEditUsername] = useState(
    authUser?.username || (authUser?.name ? authUser.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : '')
  );
  const [editWhatsApp, setEditWhatsApp] = useState(
    authUser?.whatsapp || authUser?.phone || ''
  );
  const [avatarPreview, setAvatarPreview] = useState(authUser?.picture || '');
  const [copiedField, setCopiedField] = useState(null);

  // Profile Sub-Tab: 'profile' (Profil & Dompet) | 'toko' (Mulai Jualan / Toko Saya) | 'orders' (Riwayat Pesanan)
  const [profileActiveTab, setProfileActiveTab] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.location.hash.includes('tab=toko')) {
        return 'toko';
      }
    } catch {}
    return 'profile';
  });

  useEffect(() => {
    const handleHash = () => {
      if (typeof window !== 'undefined') {
        if (window.location.hash.includes('tab=toko')) {
          setProfileActiveTab('toko');
        } else if (window.location.hash.includes('tab=orders')) {
          setProfileActiveTab('orders');
        }
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Itemku Seller & Dagangan State
  const [userStore, setUserStore] = useState(null);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [isStoreRegisterModalOpen, setIsStoreRegisterModalOpen] = useState(false);
  const [isEditStoreModalOpen, setIsEditStoreModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [visibleCredentials, setVisibleCredentials] = useState({});

  // Form State: Buka Toko (Register Store)
  const [regStoreName, setRegStoreName] = useState('');
  const [regSlogan, setRegSlogan] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAgreed, setRegAgreed] = useState(false);
  const [isSubmittingStore, setIsSubmittingStore] = useState(false);

  // Form State: Edit Store
  const [editStoreName, setEditStoreName] = useState('');
  const [editSlogan, setEditSlogan] = useState('');
  const [editStorePhone, setEditStorePhone] = useState('');

  // Form State: Tambah Dagangan Baru
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('game');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('1');
  const [prodDesc, setProdDesc] = useState('');
  const [prodAccountUser, setProdAccountUser] = useState('');
  const [prodAccountPass, setProdAccountPass] = useState('');
  const [prodAccountNote, setProdAccountNote] = useState('');
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Top Up ChaizMoney Realtime QRIS Flow State
  const PAJAK_TOPUP = 100;
  const [topUpStep, setTopUpStep] = useState(1); // 1: Nominal, 2: Realtime JansPayment QRIS, 3: Success
  const [selectedTopUpAmount, setSelectedTopUpAmount] = useState(2000);
  const [customTopUpAmount, setCustomTopUpAmount] = useState('');
  const [depositPhone, setDepositPhone] = useState(authUser?.whatsapp || authUser?.phone || '');
  const [depositProofPhoto, setDepositProofPhoto] = useState(null);
  const [depositCustomerNote, setDepositCustomerNote] = useState('');
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [userDepositsList, setUserDepositsList] = useState([]);
  const [selectedProofToView, setSelectedProofToView] = useState(null);
  const proofFileInputRef = useRef(null);

  // JansPayment Realtime Gateway State
  const TOP_UP_TIMEOUT_SECONDS = 360; // 6 Menit (Wajib Hangus jika habis)
  const [topUpJansData, setTopUpJansData] = useState(null);
  const [isGeneratingTopUpQris, setIsGeneratingTopUpQris] = useState(false);
  const [topUpTimerSeconds, setTopUpTimerSeconds] = useState(TOP_UP_TIMEOUT_SECONDS);
  const [isTopUpPaid, setIsTopUpPaid] = useState(false);
  const [isTopUpExpired, setIsTopUpExpired] = useState(false);
  const [newCalculatedBalance, setNewCalculatedBalance] = useState(null);
  const isTopUpPaidRef = useRef(false);

  // Device Info
  const [deviceInfo] = useState(() => {
    return {
      device: parseDevice(),
      browser: parseBrowser()
    };
  });

  // User transactions for stats & recent 3 orders
  const [userOrders, setUserOrders] = useState([]);

  useEffect(() => {
    if (authUser) {
      setEditUsername(
        authUser.username || (authUser.name ? authUser.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : '')
      );
      setEditWhatsApp(authUser.whatsapp || authUser.phone || '');
      setDepositPhone(authUser.whatsapp || authUser.phone || '');
      setAvatarPreview(authUser.picture || '');

      const allTrx = getUserTransactions(authUser) || [];
      const myTrx = allTrx.filter((t) => isOrderOwnedByUser(t, authUser));
      setUserOrders(myTrx);

      // Muat riwayat deposit user
      const myDeps = getUserDeposits(authUser);
      setUserDepositsList(myDeps);
      syncDepositsFromCloud().then(() => {
        setUserDepositsList(getUserDeposits(authUser));
      });

      // Muat data toko & dagangan seller (Itemku)
      const store = getUserStore(authUser.id, authUser.email);
      setUserStore(store);
      if (store) {
        setSellerProducts(getSellerProducts(authUser.id));
        setEditStoreName(store.storeName || '');
        setEditSlogan(store.slogan || '');
        setEditStorePhone(store.phone || authUser.whatsapp || authUser.phone || '');
      } else {
        const defaultName = authUser.name ? `${authUser.name.split(' ')[0]} Store` : 'Toko Chaiz';
        setRegStoreName(defaultName);
        setRegSlogan('Spesialis Akun Game & Streaming Garansi Cepat');
        setRegPhone(authUser.whatsapp || authUser.phone || '');
      }
      syncSellerStoresFromCloud().then(() => {
        const freshStore = getUserStore(authUser.id, authUser.email);
        setUserStore(freshStore);
        if (freshStore) {
          setSellerProducts(getSellerProducts(authUser.id));
        }
      });
    }
  }, [authUser]);

  // Realtime Listener untuk Update Toko & Dagangan Penjual
  useEffect(() => {
    if (!authUser) return;
    const unsub = listenToSellerUpdates(() => {
      const freshStore = getUserStore(authUser.id, authUser.email);
      setUserStore(freshStore);
      if (freshStore) {
        setSellerProducts(getSellerProducts(authUser.id));
      }
    });
    return unsub;
  }, [authUser]);

  // Realtime BroadcastChannel Listener untuk Persetujuan Deposit dari Admin
  useEffect(() => {
    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('chaiz_admin_sync');
        bc.onmessage = (ev) => {
          if (ev.data?.type === 'DEPOSIT_APPROVED') {
            const targetEmail = (ev.data.userEmail || '').toLowerCase().trim();
            const targetId = ev.data.userId || '';
            const myEmail = (authUser?.email || '').toLowerCase().trim();
            const myId = authUser?.id || '';

            if ((myEmail && targetEmail && myEmail === targetEmail) || (myId && targetId && myId === targetId)) {
              const credited = ev.data.creditedAmount;
              const newBal = ev.data.newBalance;
              onUpdateUser?.({ chaizMoney: newBal });
              setUserDepositsList(getUserDeposits(authUser));
              playUserSuccessSound();
              onShowToast?.(
                `🎉 Deposit ChaizMoney sebesar ${formatRupiah(credited)} telah disetujui Admin! Saldo sudah masuk.`,
                'fa-wallet text-success'
              );
            }
          } else if (ev.data?.type === 'DEPOSIT_REJECTED') {
            const targetEmail = (ev.data.userEmail || '').toLowerCase().trim();
            const targetId = ev.data.userId || '';
            const myEmail = (authUser?.email || '').toLowerCase().trim();
            const myId = authUser?.id || '';

            if ((myEmail && targetEmail && myEmail === targetEmail) || (myId && targetId && myId === targetId)) {
              setUserDepositsList(getUserDeposits(authUser));
              playUserRejectSound();
              onShowToast?.(
                `Deposit ChaizMoney ditolak: "${ev.data.reason || 'Bukti transfer tidak valid'}"`,
                'fa-triangle-exclamation text-danger'
              );
            }
          } else if (ev.data?.type === 'DEPOSITS_UPDATED') {
            if (authUser) {
              setUserDepositsList(getUserDeposits(authUser));
            }
          }
        };
      }
    } catch (e) {}

    return () => {
      if (bc) bc.close();
    };
  }, [authUser]);

  // Handle Copy helper
  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    onShowToast?.(`${fieldName} disalin!`, 'fa-solid fa-check text-success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // =========================================================================
  // ITEMKU SELLER & TOKO SAYA HANDLERS
  // =========================================================================

  // Buka Modal Buka Toko
  const handleOpenStoreRegisterModal = () => {
    if (!regStoreName) {
      setRegStoreName(authUser?.name ? `${authUser.name.split(' ')[0]} Store` : 'Toko Chaiz');
    }
    if (!regPhone) {
      setRegPhone(authUser?.whatsapp || authUser?.phone || '');
    }
    setRegAgreed(false);
    setIsStoreRegisterModalOpen(true);
  };

  // Submit Pendaftaran Buka Toko
  const handleRegisterStoreSubmit = async (e) => {
    e.preventDefault();
    if (!authUser) {
      onShowToast?.('Silakan masuk terlebih dahulu untuk membuka toko!', 'fa-triangle-exclamation text-warning');
      return;
    }
    const cleanStoreName = regStoreName.trim();
    if (!cleanStoreName) {
      onShowToast?.('Nama toko tidak boleh kosong!', 'fa-triangle-exclamation text-warning');
      return;
    }
    if (!regAgreed) {
      onShowToast?.('Anda harus menyetujui ketentuan penjual ChaizStore!', 'fa-triangle-exclamation text-warning');
      return;
    }

    try {
      setIsSubmittingStore(true);
      const newStore = await registerUserStore(authUser.id, {
        storeName: cleanStoreName,
        slogan: regSlogan || 'Pusat Akun & Layanan Digital Terpercaya',
        phone: regPhone || authUser.whatsapp || authUser.phone || '',
        ownerName: authUser.name || 'Penjual',
        ownerEmail: authUser.email || '',
        avatar: avatarPreview
      });
      setUserStore(newStore);
      setIsStoreRegisterModalOpen(false);
      setProfileActiveTab('toko');
      playUserSuccessSound();
      onShowToast?.(
        `🎉 Selamat! Toko "${newStore.storeName}" berhasil dibuka! Mulai tambahkan dagangan Anda sekarang.`,
        'fa-store text-success'
      );
    } catch (err) {
      onShowToast?.(err.message || 'Gagal membuka toko', 'fa-triangle-exclamation text-danger');
    } finally {
      setIsSubmittingStore(false);
    }
  };

  // Buka Modal Edit Toko
  const handleOpenEditStoreModal = () => {
    if (userStore) {
      setEditStoreName(userStore.storeName || '');
      setEditSlogan(userStore.slogan || '');
      setEditStorePhone(userStore.phone || '');
    }
    setIsEditStoreModalOpen(true);
  };

  // Submit Simpan Pengaturan Toko
  const handleSaveStoreSettings = async (e) => {
    e.preventDefault();
    if (!authUser || !userStore) return;
    const cleanName = editStoreName.trim();
    if (!cleanName) {
      onShowToast?.('Nama toko tidak boleh kosong!', 'fa-triangle-exclamation text-warning');
      return;
    }

    try {
      const updated = await updateUserStore(authUser.id, {
        storeName: cleanName,
        slogan: editSlogan.trim(),
        phone: editStorePhone.trim()
      });
      setUserStore(updated);
      setIsEditStoreModalOpen(false);
      onShowToast?.('Pengaturan toko berhasil diperbarui!', 'fa-circle-check text-success');
    } catch (err) {
      onShowToast?.('Gagal memperbarui pengaturan toko', 'fa-triangle-exclamation text-danger');
    }
  };

  // Buka Modal Tambah Dagangan
  const handleOpenAddProductModal = () => {
    setProdName('');
    setProdCategory('game');
    setProdPrice('');
    setProdStock('1');
    setProdDesc('');
    setProdAccountUser('');
    setProdAccountPass('');
    setProdAccountNote('');
    setIsAddProductModalOpen(true);
  };

  // Submit Tambah Dagangan Baru
  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!authUser || !userStore) {
      onShowToast?.('Buka toko terlebih dahulu sebelum menambahkan dagangan!', 'fa-triangle-exclamation text-warning');
      return;
    }
    const cleanName = prodName.trim();
    if (!cleanName) {
      onShowToast?.('Nama dagangan / produk wajib diisi!', 'fa-triangle-exclamation text-warning');
      return;
    }
    const priceNum = parseInt(prodPrice, 10);
    if (!priceNum || priceNum < 1000) {
      onShowToast?.('Harga dagangan minimal Rp 1.000!', 'fa-triangle-exclamation text-warning');
      return;
    }
    const stockNum = parseInt(prodStock, 10);
    if (!stockNum || stockNum < 1) {
      onShowToast?.('Stok dagangan minimal 1!', 'fa-triangle-exclamation text-warning');
      return;
    }
    if (!prodAccountUser.trim() || !prodAccountPass.trim()) {
      onShowToast?.('Username / Email dan Password akun wajib diisi untuk pengiriman otomatis!', 'fa-triangle-exclamation text-warning');
      return;
    }

    const catLabels = {
      game: 'Akun Game',
      streaming: 'Streaming VIP',
      ai: 'AI & Bot',
      voucher: 'Voucher & Topup',
      other: 'Produk Digital'
    };

    try {
      setIsSubmittingProduct(true);
      await addSellerProduct(authUser.id, {
        storeName: userStore.storeName,
        ownerName: authUser.name,
        ownerEmail: authUser.email,
        name: cleanName,
        category: prodCategory,
        categoryLabel: catLabels[prodCategory] || 'Produk Digital',
        price: priceNum,
        stock: stockNum,
        description: prodDesc.trim() || 'Akun legal siap pakai langsung bergaransi',
        credentials: {
          accountUser: prodAccountUser.trim(),
          accountPass: prodAccountPass.trim(),
          accountNote: prodAccountNote.trim()
        }
      });
      setSellerProducts(getSellerProducts(authUser.id));
      setIsAddProductModalOpen(false);
      playUserSuccessSound();
      onShowToast?.(
        `🎉 Dagangan "${cleanName}" berhasil diterbitkan ke pasar ChaizStore!`,
        'fa-box-open text-success'
      );
    } catch (err) {
      onShowToast?.(err.message || 'Gagal menambahkan dagangan', 'fa-triangle-exclamation text-danger');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Toggle Status Aktif / Nonaktif Dagangan
  const handleToggleProductStatus = async (productId) => {
    try {
      const updated = await toggleSellerProductStatus(productId);
      if (updated) {
        setSellerProducts(getSellerProducts(authUser.id));
        const statusLabel = updated.status === 'active' ? 'diaktifkan (Dijual)' : 'dinonaktifkan';
        onShowToast?.(`Dagangan berhasil ${statusLabel}!`, 'fa-circle-check text-success');
      }
    } catch (err) {
      onShowToast?.('Gagal mengubah status dagangan', 'fa-triangle-exclamation text-danger');
    }
  };

  // Hapus Dagangan
  const handleDeleteProduct = async (productId, name) => {
    if (!window.confirm(`Yakin ingin menghapus dagangan "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    try {
      await deleteSellerProduct(productId);
      setSellerProducts(getSellerProducts(authUser.id));
      onShowToast?.('Dagangan berhasil dihapus!', 'fa-trash text-warning');
    } catch (err) {
      onShowToast?.('Gagal menghapus dagangan', 'fa-triangle-exclamation text-danger');
    }
  };

  // Toggle Sensor Password
  const toggleCredentialVisibility = (productId) => {
    setVisibleCredentials((prev) => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // Avatar presets
  const avatarPresets = [
    { id: 'p1', name: 'Cyber Hero', icon: 'fa-solid fa-user-astronaut', color: '#6366f1' },
    { id: 'p2', name: 'Gamer Pro', icon: 'fa-solid fa-gamepad', color: '#ec4899' },
    { id: 'p3', name: 'Royal VIP', icon: 'fa-solid fa-crown', color: '#f59e0b' },
    { id: 'p4', name: 'Diamond Star', icon: 'fa-solid fa-gem', color: '#06b6d4' },
    { id: 'p5', name: 'Neon Ninja', icon: 'fa-solid fa-mask', color: '#10b981' },
    { id: 'p6', name: 'Chaiz Bot', icon: 'fa-solid fa-robot', color: '#a855f7' }
  ];

  // Handle file upload for custom avatar
  const fileInputRef = useRef(null);
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast?.('File harus berupa gambar (JPG, PNG, WebP)!', 'fa-triangle-exclamation text-warning');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      onShowToast?.('Ukuran foto maksimal 3MB!', 'fa-triangle-exclamation text-warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (base64) {
        setAvatarPreview(base64);
        onUpdateUser?.({ picture: base64 });
        onShowToast?.('Foto profil berhasil diubah!', 'fa-circle-check text-success');
        setIsAvatarModalOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle preset avatar selection
  const handleSelectPresetAvatar = (preset) => {
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${preset.color}" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="64" fill="url(#grad)" />
      <circle cx="64" cy="64" r="58" fill="#111827" />
      <circle cx="64" cy="64" r="54" fill="${preset.color}" fill-opacity="0.25" />
      <text x="64" y="74" font-family="system-ui, sans-serif" font-size="34" font-weight="bold" fill="#ffffff" text-anchor="middle">${preset.name.charAt(0)}</text>
    </svg>`;
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
    setAvatarPreview(dataUri);
    onUpdateUser?.({ picture: dataUri });
    onShowToast?.(`Foto profil diubah ke ${preset.name}!`, 'fa-circle-check text-success');
    setIsAvatarModalOpen(false);
  };

  // Reset to original Google picture if available
  const handleResetGoogleAvatar = () => {
    const original = authUser?.googleOriginalPicture || authUser?.picture || '';
    setAvatarPreview(original);
    onUpdateUser?.({ picture: original });
    onShowToast?.('Foto profil dikembalikan ke foto Google!', 'fa-brands fa-google text-cyan');
    setIsAvatarModalOpen(false);
  };

  // Handle Save Edit Profile
  const handleSaveProfile = (e) => {
    e.preventDefault();
    const cleanUsername = editUsername.trim().replace(/^@+/, '').replace(/[^a-zA-Z0-9_.-]/g, '');
    const cleanWa = editWhatsApp.trim().replace(/[^0-9+]/g, '');

    if (!cleanUsername) {
      onShowToast?.('Username tidak boleh kosong!', 'fa-triangle-exclamation text-warning');
      return;
    }

    onUpdateUser?.({
      username: cleanUsername,
      whatsapp: cleanWa,
      phone: cleanWa
    });

    setIsEditModalOpen(false);
    onShowToast?.('Profil Anda berhasil diperbarui!', 'fa-circle-check text-success');
  };

  // =========================================================================
  // ALUR TOP UP CHAIZMONEY REALTIME JANSPAYMENT QRIS GATEWAY (OTOMATIS SUKSES)
  // =========================================================================
  const activeNominal = customTopUpAmount ? parseInt(customTopUpAmount, 10) || 0 : selectedTopUpAmount;
  const totalPayableWithTax = activeNominal + PAJAK_TOPUP;
  const [copiedNominal, setCopiedNominal] = useState(false);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopyNominal = () => {
    const amountToCopy = topUpJansData?.amount || totalPayableWithTax;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(String(amountToCopy));
      setCopiedNominal(true);
      setTimeout(() => setCopiedNominal(false), 2000);
      onShowToast?.(`Nominal Rp ${Number(amountToCopy).toLocaleString('id-ID')} disalin!`, 'fa-copy text-cyan');
    }
  };

  const handleOpenTopUpModal = () => {
    setTopUpStep(1);
    setDepositPhone(authUser?.whatsapp || authUser?.phone || '');
    setIsTopUpPaid(false);
    setIsTopUpExpired(false);
    isTopUpPaidRef.current = false;
    setTopUpTimerSeconds(TOP_UP_TIMEOUT_SECONDS);
    setTopUpJansData(null);
    setNewCalculatedBalance(null);
    setIsTopUpMoneyModalOpen(true);
  };

  const handleProceedToQrisStep = async () => {
    if (!activeNominal || activeNominal < 1000) {
      onShowToast?.('Minimal nominal top up adalah Rp 1.000', 'fa-triangle-exclamation text-warning');
      return;
    }

    setTopUpStep(2);
    setIsGeneratingTopUpQris(true);
    setIsTopUpPaid(false);
    setIsTopUpExpired(false);
    isTopUpPaidRef.current = false;
    setTopUpTimerSeconds(TOP_UP_TIMEOUT_SECONDS);
    setTopUpJansData(null);

    const refId = `TOPUP-${Date.now().toString().slice(-6)}`;
    try {
      // Buat tagihan QRIS resmi langsung di gateway JansPayment (https://janspayment.com)
      const jansRes = await createJansPaymentQris({
        amount: activeNominal,
        orderId: refId,
        note: `Top Up ChaizMoney Rp ${activeNominal.toLocaleString('id-ID')} (${authUser?.name || 'User'})`
      });

      if (!jansRes.success || !jansRes.paymentId || jansRes.paymentId.startsWith('fallback_')) {
        throw new Error(jansRes.error || 'Gagal membuat QRIS di gateway JansPayment');
      }

      setTopUpJansData({
        paymentId: jansRes.paymentId,
        amount: jansRes.amount, // Total tagihan persis dari gateway (termasuk kode unik)
        requestedAmount: jansRes.requestedAmount || activeNominal,
        creditAmount: jansRes.creditAmount || activeNominal, // Saldo ChaizMoney yang masuk: Rp 2.000 PAS
        uniqueCode: jansRes.uniqueCode,
        feeAmount: jansRes.feeAmount,
        qrImageUrl: jansRes.qrImageUrl, // Barcode QRIS resmi dari JansPayment
        qrString: jansRes.qrString
      });
    } catch (err) {
      console.error('Failed to create Dynamic QRIS from JansPayment:', err);
      onShowToast?.(
        err.message || 'Gagal membuat QRIS JansPayment. Pastikan koneksi internet aktif.',
        'fa-triangle-exclamation text-danger'
      );
      setTopUpStep(1);
    } finally {
      setIsGeneratingTopUpQris(false);
    }
  };

  const handleDownloadQris = () => {
    const qrUrl = topUpJansData?.qrImageUrl || '/Qris.png';
    const nominal = topUpJansData?.amount || activeNominal;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `QRIS-ChaizMoney-${nominal}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast?.(`Foto QRIS (${formatRupiah(nominal)}) berhasil diunduh!`, 'fa-circle-check text-success');
  };

  const handlePaymentSuccess = async (checkData) => {
    if (isTopUpPaidRef.current) return;
    isTopUpPaidRef.current = true;
    setIsTopUpPaid(true);

    try {
      const uEmail = authUser?.email || '';
      const uId = authUser?.id || authUser?.userId || uEmail || `usr_${Date.now()}`;
      const uName = authUser?.name || authUser?.username || 'Pengguna';
      const uPhone = depositPhone || authUser?.whatsapp || authUser?.phone || '';

      const creditNominal = Number(checkData?.creditAmount) || Number(topUpJansData?.creditAmount) || activeNominal;
      const totalPaidAmount = Number(topUpJansData?.amount) || totalPayableWithTax;

      const res = await createApprovedGatewayDeposit({
        userId: uId,
        userKey: authUser?.userKey,
        userName: uName,
        userEmail: uEmail,
        userPhone: uPhone,
        userPicture: authUser?.picture || null,
        amount: creditNominal, // Saldo ChaizMoney yang masuk: Rp 2.000 PAS (tidak boleh kurang)
        totalPaid: totalPaidAmount,
        paymentId: topUpJansData?.paymentId || `jans_${Date.now()}`
      });

      const updatedBal = res.newBalance;
      setNewCalculatedBalance(updatedBal);
      onUpdateUser?.({ chaizMoney: updatedBal });
      setUserDepositsList(getUserDeposits(authUser));

      playUserSuccessSound();
      onShowToast?.(
        `🎉 Pembayaran QRIS Sukses Terverifikasi! Saldo ChaizMoney Rp ${creditNominal.toLocaleString('id-ID')} telah otomatis ditambahkan!`,
        'fa-circle-check text-success'
      );
      setTopUpStep(3);
    } catch (err) {
      console.error('Error crediting top up:', err);
      const creditNominal = Number(topUpJansData?.creditAmount) || activeNominal;
      const fallbackBal = (Number(authUser?.chaizMoney) || 0) + creditNominal;
      setNewCalculatedBalance(fallbackBal);
      onUpdateUser?.({ chaizMoney: fallbackBal });
      onShowToast?.('Pembayaran berhasil, memperbarui saldo...', 'fa-circle-check text-success');
      setTopUpStep(3);
    }
  };

  // 1. Polling Real-Time ke Server JansPayment Setiap 2 Detik (Otomatis Deteksi Saat Scan)
  useEffect(() => {
    if (topUpStep !== 2 || !topUpJansData?.paymentId || isTopUpPaid || isTopUpExpired) return;

    let isPolling = false;
    const pollInterval = setInterval(async () => {
      if (isTopUpPaidRef.current || isPolling || isTopUpExpired) return;
      isPolling = true;

      try {
        const check = await checkJansPaymentStatus({ paymentId: topUpJansData.paymentId });
        if (check.paid) {
          clearInterval(pollInterval);
          handlePaymentSuccess(check);
        } else if (check.cancelled || check.expired) {
          clearInterval(pollInterval);
          setIsTopUpExpired(true);
          onShowToast?.('Sesi QRIS telah kadaluarsa atau dibatalkan oleh gateway', 'fa-triangle-exclamation text-warning');
        }
      } catch (err) {
        // Silent poll error
      } finally {
        isPolling = false;
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [topUpStep, topUpJansData?.paymentId, isTopUpPaid, isTopUpExpired]);

  // 2. Cek saat user kembali ke tab browser (HANYA lolos jika check.paid === true)
  useEffect(() => {
    if (topUpStep !== 2 || isTopUpPaid || isTopUpExpired || !topUpJansData?.paymentId) return;

    const handleFocusCheck = async () => {
      if (document.visibilityState === 'visible' && !isTopUpPaidRef.current && !isTopUpExpired && topUpJansData?.paymentId) {
        try {
          const check = await checkJansPaymentStatus({ paymentId: topUpJansData.paymentId });
          if (check.paid) {
            handlePaymentSuccess(check);
          }
        } catch {}
      }
    };

    document.addEventListener('visibilitychange', handleFocusCheck);
    window.addEventListener('focus', handleFocusCheck);

    return () => {
      document.removeEventListener('visibilitychange', handleFocusCheck);
      window.removeEventListener('focus', handleFocusCheck);
    };
  }, [topUpStep, isTopUpPaid, isTopUpExpired, topUpJansData?.paymentId]);

  // 3. Countdown Timer 6 Menit (Wajib Hangus saat waktu habis)
  useEffect(() => {
    if (topUpStep !== 2 || isTopUpPaid || isTopUpExpired) return;
    const timer = setInterval(() => {
      setTopUpTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTopUpExpired(true);
          onShowToast?.('⚠️ Waktu pembayaran 6 menit telah habis. Sesi QRIS hangus demi keamanan.', 'fa-triangle-exclamation text-warning');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [topUpStep, isTopUpPaid, isTopUpExpired]);

  // Cek apakah ada deposit yang sedang pending
  const pendingDeposit = userDepositsList.find((d) => d && d.status === 'pending');

  // Calculate shopping statistics
  const completedOrders = userOrders.filter(
    (o) => o.status === 'completed' || o.status === 'approved' || o.status === 'success'
  );
  const totalSpent = completedOrders.reduce((sum, o) => sum + (Number(o.totalPrice || o.total || o.price) || 0), 0);
  const recent3Orders = userOrders.slice(0, 3);

  // If user is not logged in, show access gate
  if (!authUser) {
    return (
      <div className="user-profile-page-wrapper">
        <section className="profile-hero-section">
          <div className="container">
            <div className="profile-nav-header">
              <button
                type="button"
                className="btn-profile-back"
                onClick={onBackToStore}
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Kembali ke Toko</span>
              </button>
            </div>
          </div>
        </section>

        <section className="profile-content-section">
          <div className="container">
            <div className="profile-login-gate-card">
              <div className="gate-icon-circle">
                <i className="fa-solid fa-user-lock"></i>
              </div>
              <h2>Akses Profil Pengguna</h2>
              <p>
                Silakan masuk dengan akun Google Anda untuk melihat saldo ChaizMoney, mengelola profil, dan mengakses riwayat pesanan Anda.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={onOpenLogin}
              >
                <i className="fa-brands fa-google"></i>
                <span>Login dengan Google</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const displayUsername = authUser.username || (authUser.name ? authUser.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'chaiz_user');
  const userPhone = authUser.whatsapp || authUser.phone || '-';

  return (
    <div className="user-profile-page-wrapper">
      {/* ============================================================ */}
      {/* 1. TOP BREADCRUMB / NAVIGATION BAR                           */}
      {/* ============================================================ */}
      <section className="profile-hero-section">
        <div className="container">
          <div className="profile-nav-header">
            <button
              type="button"
              className="btn-profile-back"
              onClick={onBackToStore}
              title="Kembali ke Beranda Toko"
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Kembali ke Toko</span>
            </button>

            <div className="profile-header-status-pill">
              <span className="pulsing-green-dot"></span>
              <i className="fa-brands fa-google text-danger"></i>
              <span>Akun Terverifikasi</span>
            </div>
          </div>

          <div className="profile-hero-title-wrap">
            <div className="profile-hero-badge">
              <i className="fa-solid fa-id-card-clip text-cyan"></i>
              <span>PORTAL PENGGUNA CHAIZSTORE</span>
            </div>
            <h1 className="profile-page-title">
              Profil <span>Pengguna</span>
            </h1>
            <p className="profile-page-subtitle">
              Kelola saldo ChaizMoney, foto profil, username, dan akses pesanan privat Anda secara aman.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. MAIN PROFILE CONTENT & DASHBOARD                          */}
      {/* ============================================================ */}
      <section className="profile-content-section">
        <div className="container">
          {/* TAB BAR ALA ITEMKU: /id/akun */}
          <div className="itemku-profile-tabnav">
            <button
              type="button"
              className={`profile-tabnav-btn ${profileActiveTab === 'profile' ? 'active' : ''}`}
              onClick={() => setProfileActiveTab('profile')}
            >
              <i className="fa-solid fa-user-circle"></i>
              <span>Profil & Dompet</span>
            </button>

            <button
              type="button"
              className={`profile-tabnav-btn tab-seller-highlight ${profileActiveTab === 'toko' ? 'active' : ''}`}
              onClick={() => setProfileActiveTab('toko')}
            >
              <i className="fa-solid fa-store"></i>
              <span>{userStore ? 'Toko Saya' : 'Mulai Jualan'}</span>
              <span className="badge-itemku-seller-pill">
                {userStore ? 'Aktif' : 'Cuan'}
              </span>
            </button>

            <button
              type="button"
              className={`profile-tabnav-btn ${profileActiveTab === 'orders' ? 'active' : ''}`}
              onClick={() => setProfileActiveTab('orders')}
            >
              <i className="fa-solid fa-receipt"></i>
              <span>Riwayat Pesanan</span>
              {userOrders.length > 0 && (
                <span className="tabnav-count-badge">{userOrders.length}</span>
              )}
            </button>
          </div>

          {profileActiveTab === 'profile' && (
            <div className="profile-grid-layout">
              {/* -------------------------------------------------------- */}
              {/* KOLOM KIRI: KARTU UTAMA PROFIL & CHAIZMONEY              */}
              {/* -------------------------------------------------------- */}
              <div className="profile-column-primary">
                {/* KARTU 1: CHAIZMONEY DIGITAL WALLET */}
                <div className="chaizmoney-wallet-card">
                  <div className="wallet-card-glow"></div>
                  <div className="wallet-card-header">
                    <div className="wallet-brand">
                      <span className="wallet-icon">
                        <i className="fa-solid fa-wallet"></i>
                      </span>
                      <div>
                        <span className="wallet-label">Dompet Digital Resmi</span>
                        <h4 className="wallet-name">ChaizMoney</h4>
                      </div>
                    </div>
                    <span className="wallet-badge-active">
                      <i className="fa-solid fa-circle-check"></i> 100% Aktif
                    </span>
                  </div>

                  <div className="wallet-balance-row">
                    <div className="balance-info">
                      <span className="balance-title">ChaizMoney:</span>
                      <h2 className="balance-amount">
                        Rp. {(authUser.chaizMoney || 0).toLocaleString('id-ID')}
                      </h2>
                    </div>
                    <button
                      type="button"
                      className="btn-topup-chaizmoney"
                      onClick={handleOpenTopUpModal}
                    >
                      <i className="fa-solid fa-plus-circle"></i>
                      <span>Isi Saldo</span>
                    </button>
                  </div>

                  {/* Banner Status Jika Sedang Ada Permintaan Deposit Pending */}
                  {pendingDeposit && (
                    <div className="pending-deposit-banner">
                      <span className="pulse-yellow-dot"></span>
                      <div className="pending-dep-text">
                        <strong>Deposit Menunggu Verifikasi Admin</strong>
                        <small>Permintaan {formatRupiah(pendingDeposit.amount)} sedang diperiksa. Saldo akan otomatis bertambah setelah disetujui.</small>
                      </div>
                    </div>
                  )}

                  <div className="wallet-footer-strip">
                    <div className="wallet-tip">
                      <i className="fa-solid fa-bolt text-warning"></i>
                      <span>Dapat dipakai langsung untuk belanja akun streaming, robux & steam key otomatis!</span>
                    </div>
                  </div>
                </div>

                {/* BANNER ITEMKU: MULAI JUALAN DI CHAIZSTORE */}
                <div
                  className="itemku-seller-banner-quick"
                  onClick={() => setProfileActiveTab('toko')}
                >
                  <div className="seller-banner-content">
                    <div className="seller-banner-icon">
                      <i className="fa-solid fa-store"></i>
                    </div>
                    <div className="seller-banner-text">
                      <div className="seller-banner-tag">
                        <i className="fa-solid fa-bolt"></i> FITUR ITEMKU SELLER
                      </div>
                      <h4 className="seller-banner-title">
                        {userStore ? `Toko Anda: ${userStore.storeName}` : 'Mulai Jualan di ChaizStore'}
                      </h4>
                      <p className="seller-banner-sub">
                        {userStore
                          ? `${sellerProducts.length} Dagangan Aktif • Kelola produk, harga & stok toko Anda`
                          : 'Buka tokomu gratis sekarang! Jual akun game, streaming, AI & raih keuntungan ke ChaizMoney'}
                      </p>
                    </div>
                  </div>
                  <button type="button" className="btn-seller-banner-action">
                    <span>{userStore ? 'Buka Toko Saya' : 'Mulai Jualan'}</span>
                    <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>

              {/* KARTU 2: KARTU IDENTITAS PROFIL PENGGUNA */}
              <div className="user-identity-card">
                {/* Foto Profil & Tombol Ganti Profil */}
                <div className="profile-avatar-center-wrap">
                  <div className="avatar-frame">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt={authUser.name}
                        className="avatar-large-img"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="avatar-large-fallback">
                        {authUser.name ? authUser.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    {authUser.isGoogle && (
                      <span className="avatar-google-stamp" title="Akun Google Terverifikasi">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"/>
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.28 21.43 7.37 24 12 24z"/>
                          <path fill="#FBBC05" d="M5.28 14.32a7.18 7.18 0 0 1 0-4.64V6.58H1.25a11.97 11.97 0 0 0 0 10.84l4.03-3.1z"/>
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.28 2.57 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"/>
                        </svg>
                      </span>
                    )}
                  </div>

                  {/* DI BAWAH PROFIL ADA GANTI PROFIL */}
                  <button
                    type="button"
                    className="btn-change-avatar"
                    onClick={() => setIsAvatarModalOpen(true)}
                  >
                    <i className="fa-solid fa-camera"></i>
                    <span>Ganti Profil</span>
                  </button>
                </div>

                {/* DI BAWAH ADA USERNAME & NAMA GMAIL */}
                <div className="profile-id-details">
                  {/* Di bawah ada username */}
                  <div className="id-field-group">
                    <span className="field-label">Username</span>
                    <div className="field-value-pill">
                      <i className="fa-solid fa-at text-cyan"></i>
                      <strong className="field-text">@{displayUsername}</strong>
                      <button
                        type="button"
                        className="btn-copy-chip"
                        onClick={() => handleCopy(`@${displayUsername}`, 'Username')}
                        title="Salin Username"
                      >
                        <i className={`fa-solid ${copiedField === 'Username' ? 'fa-check text-success' : 'fa-copy'}`}></i>
                      </button>
                    </div>
                  </div>

                  {/* Di bawah ada nama gmail */}
                  <div className="id-field-group">
                    <span className="field-label">Nama Gmail Terverifikasi</span>
                    <div className="field-value-pill field-gmail">
                      <div className="gmail-info-inline">
                        <svg viewBox="0 0 24 24" width="16" height="16" style={{ flexShrink: 0 }}>
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"/>
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.28 21.43 7.37 24 12 24z"/>
                          <path fill="#FBBC05" d="M5.28 14.32a7.18 7.18 0 0 1 0-4.64V6.58H1.25a11.97 11.97 0 0 0 0 10.84l4.03-3.1z"/>
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.28 2.57 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"/>
                        </svg>
                        <div className="gmail-texts">
                          <strong className="field-text">{authUser.name}</strong>
                          <span className="field-sub">{authUser.email}</span>
                        </div>
                      </div>
                      <span className="badge-verified-inline">
                        <i className="fa-solid fa-shield-check text-success"></i> Verifikasi Google
                      </span>
                    </div>
                  </div>

                  {/* Nomor WhatsApp Pengguna */}
                  <div className="id-field-group">
                    <span className="field-label">Nomor WhatsApp</span>
                    <div className="field-value-pill">
                      <i className="fa-brands fa-whatsapp text-success"></i>
                      <strong className="field-text">{userPhone !== '-' ? userPhone : 'Belum diatur'}</strong>
                    </div>
                  </div>

                  {/* DI BAWAH ADA TOMBOL EDIT PROFILE */}
                  <div className="profile-edit-btn-wrapper">
                    <button
                      type="button"
                      className="btn-open-edit-profile"
                      onClick={() => setIsEditModalOpen(true)}
                    >
                      <i className="fa-solid fa-user-pen"></i>
                      <span>Edit Profile</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* KARTU 3: RIWAYAT DEPOSITO CHAIZMONEY SAYA */}
              <div className="profile-box-card">
                <div className="box-card-header">
                  <div className="header-icon-pill">
                    <i className="fa-solid fa-receipt text-cyan"></i>
                  </div>
                  <div>
                    <h3 className="box-card-title">Riwayat Deposito ChaizMoney</h3>
                    <p className="box-card-subtitle">Status pengajuan isi saldo Anda</p>
                  </div>
                </div>

                {userDepositsList.length === 0 ? (
                  <div className="empty-recent-orders" style={{ padding: '16px 8px' }}>
                    <p className="empty-order-text" style={{ fontSize: '0.8rem' }}>
                      Belum ada riwayat deposito. Klik tombol <strong>Isi Saldo</strong> di atas untuk top up via QRIS.
                    </p>
                  </div>
                ) : (
                  <div className="user-deposits-mini-list">
                    {userDepositsList.slice(0, 4).map((dep) => {
                      const isPending = dep.status === 'pending';
                      const isApproved = dep.status === 'approved';

                      return (
                        <div key={dep.id} className="user-deposit-card">
                          <div className="dep-card-left">
                            <div className="dep-card-icon">
                              <i className="fa-solid fa-wallet"></i>
                            </div>
                            <div className="dep-card-details">
                              <div className="dep-card-meta">
                                <span className="dep-code-pill">#{dep.id.slice(-8).toUpperCase()}</span>
                                <span className="dep-dot">•</span>
                                <span className="dep-date-label">
                                  <i className="fa-regular fa-clock"></i>{' '}
                                  {new Date(dep.createdAt).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="dep-card-amount">
                                <strong>{formatRupiah(dep.amount)}</strong>
                                <span className="dep-label-sub">Top Up Saldo ChaizMoney</span>
                              </div>
                            </div>
                          </div>

                          <div className="dep-card-right">
                            <span
                              className={`order-status-badge ${
                                isApproved ? 'status-done' : isPending ? 'status-wait' : 'status-fail'
                              }`}
                            >
                              <i
                                className={`fa-solid ${
                                  isApproved ? 'fa-circle-check' : isPending ? 'fa-hourglass-half' : 'fa-circle-xmark'
                                }`}
                              ></i>
                              <span>{isApproved ? ' Berhasil' : isPending ? ' Menunggu Admin' : ' Ditolak'}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* -------------------------------------------------------- */}
            {/* KOLOM KANAN: FITUR-FITUR DI BAWAH EDIT PROFIL             */}
            {/* -------------------------------------------------------- */}
            <div className="profile-column-secondary">
              {/* FITUR 1: STATISTIK AKUN & LOYALITAS */}
              <div className="profile-box-card">
                <div className="box-card-header">
                  <div className="header-icon-pill">
                    <i className="fa-solid fa-chart-pie text-cyan"></i>
                  </div>
                  <div>
                    <h3 className="box-card-title">Statistik Belanja Saya</h3>
                    <p className="box-card-subtitle">Ringkasan aktivitas dan pembelian Anda di ChaizStore</p>
                  </div>
                </div>

                <div className="stats-mini-grid">
                  <div className="stat-mini-item">
                    <div className="stat-mini-icon text-cyan">
                      <i className="fa-solid fa-bag-shopping"></i>
                    </div>
                    <div className="stat-mini-data">
                      <span className="stat-mini-label">Total Pesanan</span>
                      <strong className="stat-mini-val">{userOrders.length} Pesanan</strong>
                    </div>
                  </div>

                  <div className="stat-mini-item">
                    <div className="stat-mini-icon text-success">
                      <i className="fa-solid fa-circle-check"></i>
                    </div>
                    <div className="stat-mini-data">
                      <span className="stat-mini-label">Pesanan Berhasil</span>
                      <strong className="stat-mini-val">{completedOrders.length} Selesai</strong>
                    </div>
                  </div>

                  <div className="stat-mini-item">
                    <div className="stat-mini-icon text-warning">
                      <i className="fa-solid fa-coins"></i>
                    </div>
                    <div className="stat-mini-data">
                      <span className="stat-mini-label">Total Belanja</span>
                      <strong className="stat-mini-val">{formatRupiah(totalSpent)}</strong>
                    </div>
                  </div>

                  <div className="stat-mini-item">
                    <div className="stat-mini-icon text-purple">
                      <i className="fa-solid fa-crown"></i>
                    </div>
                    <div className="stat-mini-data">
                      <span className="stat-mini-label">Tingkat Akun</span>
                      <strong className="stat-mini-val">VIP Platinum</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* FITUR 2: PRIVILESE KEANGGOTAAN VIP CHAIZSTORE */}
              <div className="profile-box-card vip-tier-card">
                <div className="vip-tier-glow"></div>
                <div className="box-card-header">
                  <div className="vip-badge-crown">
                    <i className="fa-solid fa-crown"></i>
                  </div>
                  <div>
                    <span className="vip-tier-tag">TIER MEMBERSHIP</span>
                    <h3 className="box-card-title text-gold">ChaizStore VIP Priority</h3>
                  </div>
                </div>

                <div className="vip-perks-list">
                  <div className="vip-perk-item">
                    <i className="fa-solid fa-shield-halved text-success"></i>
                    <div>
                      <strong>Garansi Replace 100%</strong>
                      <small>Penggantian akun instan tanpa ribet jika terjadi kendala</small>
                    </div>
                  </div>

                  <div className="vip-perk-item">
                    <i className="fa-solid fa-headset text-cyan"></i>
                    <div>
                      <strong>Jalur CS VIP 24 Jam</strong>
                      <small>Antrean chat prioritas langsung ditangani tim spesialis ChaizStore</small>
                    </div>
                  </div>

                  <div className="vip-perk-item">
                    <i className="fa-solid fa-tags text-warning"></i>
                    <div>
                      <strong>Akses Diskon & Flash Sale</strong>
                      <small>Potongan harga khusus akun Netflix, Spotify, Canva, Steam & Robux</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* FITUR 3: 3 PESANAN TERAKHIR SAYA */}
              <div className="profile-box-card">
                <div className="box-card-header-between">
                  <div className="box-card-header">
                    <div className="header-icon-pill">
                      <i className="fa-solid fa-clock-rotate-left text-cyan"></i>
                    </div>
                    <div>
                      <h3 className="box-card-title">3 Pesanan Terakhir Saya</h3>
                      <p className="box-card-subtitle">Transaksi terbaru yang tercatat pada akun ini</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-view-all-trx"
                    onClick={onGoToTransactions}
                  >
                    <span>Lihat Semua</span>
                    <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>

                {recent3Orders.length === 0 ? (
                  <div className="empty-recent-orders">
                    <div className="empty-order-icon">
                      <i className="fa-solid fa-basket-shopping"></i>
                    </div>
                    <p className="empty-order-text">Belum ada riwayat pesanan. Mulai belanja akun premium sekarang!</p>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={onBackToStore}
                    >
                      <i className="fa-solid fa-store"></i> Jelajahi Katalog
                    </button>
                  </div>
                ) : (
                  <div className="recent-orders-list">
                    {recent3Orders.map((order) => {
                      const isSuccess = order.status === 'completed' || order.status === 'approved' || order.status === 'success';
                      const isPending = order.status === 'pending' || order.status === 'processing';

                      return (
                        <div key={order.id} className="recent-order-card" onClick={onGoToTransactions}>
                          <div className="order-main-info">
                            <span className="order-id-badge">#{order.id?.slice(-8) || 'TRX'}</span>
                            <h4 className="order-prod-title">
                              {order.productName || order.items?.[0]?.name || 'Akun Premium'}
                            </h4>
                            <span className="order-date-text">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Hari ini'}
                            </span>
                          </div>

                          <div className="order-status-side">
                            <span className="order-price-val">
                              {formatRupiah(order.totalPrice || order.total || order.price || 0)}
                            </span>
                            <span
                              className={`order-status-badge ${
                                isSuccess ? 'status-done' : isPending ? 'status-wait' : 'status-fail'
                              }`}
                            >
                              <i
                                className={`fa-solid ${
                                  isSuccess ? 'fa-check-circle' : isPending ? 'fa-hourglass-half' : 'fa-times-circle'
                                }`}
                              ></i>
                              {isSuccess ? ' Selesai' : isPending ? ' Diproses' : ' Ditolak'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* FITUR 4: KEAMANAN & DETAIL SESI LOGIN */}
              <div className="profile-box-card">
                <div className="box-card-header">
                  <div className="header-icon-pill">
                    <i className="fa-solid fa-shield-check text-success"></i>
                  </div>
                  <div>
                    <h3 className="box-card-title">Keamanan Akun & Detail Sesi</h3>
                    <p className="box-card-subtitle">Informasi proteksi sesi dan perangkat Anda</p>
                  </div>
                </div>

                <div className="security-info-grid">
                  <div className="security-row">
                    <span className="sec-label">
                      <i className="fa-solid fa-key text-cyan"></i> Metode Autentikasi:
                    </span>
                    <strong className="sec-val">Google OAuth 2.0 (Resmi)</strong>
                  </div>

                  <div className="security-row">
                    <span className="sec-label">
                      <i className="fa-solid fa-lock text-cyan"></i> Enkripsi Data:
                    </span>
                    <strong className="sec-val">AES-256 Bit Private Storage</strong>
                  </div>

                  <div className="security-row">
                    <span className="sec-label">
                      <i className="fa-solid fa-display text-cyan"></i> Perangkat:
                    </span>
                    <strong className="sec-val">{deviceInfo.device.os} • {deviceInfo.browser}</strong>
                  </div>

                  <div className="security-row">
                    <span className="sec-label">
                      <i className="fa-solid fa-signal text-success"></i> Status Sesi:
                    </span>
                    <span className="sec-val text-success">
                      <i className="fa-solid fa-circle-dot"></i> Aktif (Online)
                    </span>
                  </div>
                </div>

                <div className="security-card-footer">
                  <button
                    type="button"
                    className="btn-logout-account"
                    onClick={onLogout}
                  >
                    <i className="fa-solid fa-right-from-bracket"></i>
                    <span>Keluar dari Akun (Logout)</span>
                  </button>
                </div>
              </div>

              {/* FITUR 5: BANTUAN CS VIP WHATSAPP */}
              <div className="profile-box-card cs-vip-banner-card">
                <div className="cs-banner-content">
                  <div className="cs-icon-large">
                    <i className="fa-brands fa-whatsapp text-success"></i>
                  </div>
                  <div className="cs-text-wrap">
                    <h4 className="cs-title">Butuh Bantuan Akun atau Top Up?</h4>
                    <p className="cs-desc">
                      Customer Service ChaizStore siap melayani Anda 24 jam nonstop via WhatsApp resmi.
                    </p>
                  </div>
                  <a
                    href={`https://wa.me/6287795172347?text=${encodeURIComponent(
                      `Halo Admin ChaizStore, saya ${authUser.name} (${authUser.email}), ingin konsultasi seputar akun ChaizStore saya.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-chat-wa-vip"
                  >
                    <i className="fa-brands fa-whatsapp"></i>
                    <span>Chat CS VIP</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: TOKO SAYA / MULAI JUALAN (ITEMKU SELLER HUB)          */}
          {/* ============================================================ */}
          {profileActiveTab === 'toko' && (
            <>
              {!userStore ? (
                /* CASE A: USER BELUM MEMILIKI TOKO (ITEMKU MULAI JUALAN) */
                <div className="itemku-seller-landing">
                  {/* HERO BANNER MULAI JUALAN */}
                  <div className="itemku-seller-hero-card">
                    <div className="seller-hero-glow-1"></div>
                    <div className="seller-hero-glow-2"></div>
                    <div className="seller-hero-tag">
                      <i className="fa-solid fa-store"></i> FITUR JUALAN ITEMKU CHAIZSTORE
                    </div>
                    <h2 className="seller-hero-title">
                      Mulai Jualan & <span>Raih Cuan Jutaan Rupiah!</span>
                    </h2>
                    <p className="seller-hero-subtitle">
                      Punya akun game nganggur, langganan AI/streaming sisa slot, voucher atau produk digital? Buka tokomu secara GRATIS dan jual langsung ke ratusan pembeli aktif di ChaizStore. Hasil penjualan langsung cair otomatis ke saldo ChaizMoney Anda!
                    </p>
                    <div className="seller-hero-cta-row">
                      <button
                        type="button"
                        className="btn-itemku-open-store"
                        onClick={handleOpenStoreRegisterModal}
                      >
                        <i className="fa-solid fa-rocket"></i>
                        <span>Buka Toko Gratis Sekarang</span>
                      </button>
                      <div className="seller-hero-guarantee">
                        <i className="fa-solid fa-shield-check"></i>
                        <span>100% Gratis • Bebas Biaya Pendaftaran • Aman</span>
                      </div>
                    </div>
                  </div>

                  {/* 4 KEUNGGULAN JUALAN */}
                  <div className="seller-benefits-grid">
                    <div className="seller-benefit-card">
                      <div className="benefit-icon-wrap benefit-icon-orange">
                        <i className="fa-solid fa-bolt"></i>
                      </div>
                      <h4 className="benefit-card-title">Buka Toko Instant & Gratis</h4>
                      <p className="benefit-card-desc">
                        Hanya butuh waktu 1 menit untuk memberi nama tokomu dan langsung siap memajang produk digital pertamamu.
                      </p>
                    </div>

                    <div className="seller-benefit-card">
                      <div className="benefit-icon-wrap benefit-icon-green">
                        <i className="fa-solid fa-wallet"></i>
                      </div>
                      <h4 className="benefit-card-title">Cuan Masuk Otomatis</h4>
                      <p className="benefit-card-desc">
                        Hasil transaksi dari pembeli langsung terverifikasi otomatis dan bertambah ke saldo dompet ChaizMoney Anda.
                      </p>
                    </div>

                    <div className="seller-benefit-card">
                      <div className="benefit-icon-wrap benefit-icon-blue">
                        <i className="fa-solid fa-shield-halved"></i>
                      </div>
                      <h4 className="benefit-card-title">Kredensial Terenkripsi Aman</h4>
                      <p className="benefit-card-desc">
                        Data email dan password akun tersimpan aman di database terproteksi dan hanya dikirimkan ke pembeli sah.
                      </p>
                    </div>

                    <div className="seller-benefit-card">
                      <div className="benefit-icon-wrap benefit-icon-purple">
                        <i className="fa-solid fa-users"></i>
                      </div>
                      <h4 className="benefit-card-title">Pasar Ratusan Pelanggan</h4>
                      <p className="benefit-card-desc">
                        Produkmu langsung tampil di hadapan ratusan pengunjung aktif harian ChaizStore di seluruh Indonesia.
                      </p>
                    </div>
                  </div>

                  {/* 3 LANGKAH MUDAH JUALAN */}
                  <div className="seller-steps-section">
                    <div className="seller-steps-header">
                      <h3>3 Langkah Mudah Jualan di ChaizStore</h3>
                      <p>Cara tercepat menghasilkan uang dari akun & produk digital Anda</p>
                    </div>
                    <div className="seller-steps-grid">
                      <div className="seller-step-item">
                        <span className="step-num-badge">1</span>
                        <div className="step-content">
                          <h4>Buka Toko</h4>
                          <p>Daftarkan nama tokomu dan atur nomor WhatsApp untuk notifikasi pesanan.</p>
                        </div>
                      </div>
                      <div className="seller-step-item">
                        <span className="step-num-badge">2</span>
                        <div className="step-content">
                          <h4>Pajang Dagangan</h4>
                          <p>Masukkan nama produk, harga, stok, dan data akun yang akan dikirim ke pembeli.</p>
                        </div>
                      </div>
                      <div className="seller-step-item">
                        <span className="step-num-badge">3</span>
                        <div className="step-content">
                          <h4>Terima Pembayaran</h4>
                          <p>Begitu ada yang beli, saldo ChaizMoney langsung bertambah tanpa potongan aneh-aneh!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* CASE B: USER SUDAH MEMILIKI TOKO (DASHBOARD TOKO SAYA) */
                <div className="itemku-seller-dashboard">
                  {/* KARTU HEADER TOKO SAYA */}
                  <div className="itemku-store-header-card">
                    <div className="store-header-left">
                      <div className="store-avatar-box">
                        <i className="fa-solid fa-store"></i>
                      </div>
                      <div className="store-meta-info">
                        <div className="store-title-row">
                          <h3 className="store-name-text">{userStore.storeName}</h3>
                          <span className="store-badge-verified">
                            <i className="fa-solid fa-circle-check"></i> Penjual Terverifikasi
                          </span>
                          <span className="store-badge-super">
                            <i className="fa-solid fa-trophy"></i> Super Seller
                          </span>
                        </div>
                        <p className="store-slogan-text">{userStore.slogan || 'Pusat Akun & Layanan Digital Terpercaya'}</p>
                        <div className="store-sub-details">
                          <span>
                            <i className="fa-solid fa-user-tie"></i> @{displayUsername}
                          </span>
                          {userStore.phone && (
                            <span>
                              <i className="fa-brands fa-whatsapp text-success"></i> {userStore.phone}
                            </span>
                          )}
                          <span>
                            <i className="fa-solid fa-signal text-success"></i> Menerima Pesanan
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="store-header-actions">
                      <button
                        type="button"
                        className="btn-seller-add-product"
                        onClick={handleOpenAddProductModal}
                      >
                        <i className="fa-solid fa-plus-circle"></i>
                        <span>Tambah Dagangan</span>
                      </button>
                      <button
                        type="button"
                        className="btn-seller-edit-store"
                        onClick={handleOpenEditStoreModal}
                      >
                        <i className="fa-solid fa-gear"></i>
                        <span>Pengaturan Toko</span>
                      </button>
                    </div>
                  </div>

                  {/* STATISTIK PENJUAL */}
                  <div className="itemku-seller-stats-grid">
                    <div className="seller-stat-card">
                      <div className="stat-card-icon stat-icon-blue">
                        <i className="fa-solid fa-box-open"></i>
                      </div>
                      <div className="stat-card-content">
                        <span className="stat-card-label">Total Dagangan Aktif</span>
                        <strong className="stat-card-value">{sellerProducts.length} Produk</strong>
                      </div>
                    </div>

                    <div className="seller-stat-card">
                      <div className="stat-card-icon stat-icon-green">
                        <i className="fa-solid fa-cart-shopping"></i>
                      </div>
                      <div className="stat-card-content">
                        <span className="stat-card-label">Total Penjualan</span>
                        <strong className="stat-card-value">{userStore.totalSales || 0} Terjual</strong>
                      </div>
                    </div>

                    <div className="seller-stat-card">
                      <div className="stat-card-icon stat-icon-orange">
                        <i className="fa-solid fa-wallet"></i>
                      </div>
                      <div className="stat-card-content">
                        <span className="stat-card-label">Saldo ChaizMoney</span>
                        <strong className="stat-card-value">Rp {(authUser.chaizMoney || 0).toLocaleString('id-ID')}</strong>
                      </div>
                    </div>
                  </div>

                  {/* SECTION KELOLA DAGANGAN */}
                  <div className="itemku-dagangan-section">
                    <div className="dagangan-section-header">
                      <div className="dagangan-title-wrap">
                        <i className="fa-solid fa-cubes text-blue"></i>
                        <h3>Daftar Dagangan Toko</h3>
                        <span className="dagangan-count-badge">{sellerProducts.length} Produk</span>
                      </div>
                      <button
                        type="button"
                        className="btn-seller-add-product"
                        onClick={handleOpenAddProductModal}
                      >
                        <i className="fa-solid fa-plus"></i>
                        <span>Tambah Dagangan Baru</span>
                      </button>
                    </div>

                    {sellerProducts.length === 0 ? (
                      <div className="empty-dagangan-box">
                        <div className="empty-dagangan-icon">
                          <i className="fa-solid fa-box-open"></i>
                        </div>
                        <h4 className="empty-dagangan-title">Belum Ada Dagangan</h4>
                        <p className="empty-dagangan-desc">
                          Toko Anda sudah siap! Yuk tambahkan akun game, akun streaming, atau voucher pertamamu sekarang dan mulai hasilkan cuan.
                        </p>
                        <button
                          type="button"
                          className="btn-seller-add-product"
                          onClick={handleOpenAddProductModal}
                        >
                          <i className="fa-solid fa-plus-circle"></i>
                          <span>Tambah Dagangan Pertama</span>
                        </button>
                      </div>
                    ) : (
                      <div className="itemku-dagangan-grid">
                        {sellerProducts.map((prod) => {
                          const isVisible = !!visibleCredentials[prod.id];
                          const isActive = prod.status === 'active';

                          return (
                            <div key={prod.id} className="itemku-dagangan-card">
                              <div className="dagangan-top-row">
                                <span className="dagangan-category-tag">
                                  <i className="fa-solid fa-tag"></i> {prod.categoryLabel || 'Produk'}
                                </span>
                                <span
                                  className={`dagangan-status-badge ${
                                    isActive ? 'status-badge-active' : 'status-badge-inactive'
                                  }`}
                                >
                                  <i className={`fa-solid ${isActive ? 'fa-circle-check' : 'fa-circle-pause'}`}></i>
                                  <span>{isActive ? 'Aktif Dijual' : 'Nonaktif'}</span>
                                </span>
                              </div>

                              <h4 className="dagangan-name-title">{prod.name}</h4>

                              <div className="dagangan-price-row">
                                <span className="dagangan-price-val">{formatRupiah(prod.price)}</span>
                                <span className="dagangan-stock-val">
                                  <i className="fa-solid fa-layer-group"></i> Stok: <strong>{prod.stock}</strong>
                                </span>
                              </div>

                              {/* Kredensial Akun yang Dikirim ke Pembeli */}
                              <div className="dagangan-cred-box">
                                <div className="cred-row">
                                  <span className="cred-label">User/Email:</span>
                                  <span className="cred-value">{prod.credentials?.accountUser || '-'}</span>
                                </div>
                                <div className="cred-row">
                                  <span className="cred-label">Password:</span>
                                  <span className="cred-value">
                                    {isVisible ? prod.credentials?.accountPass : '••••••••'}
                                  </span>
                                  <button
                                    type="button"
                                    className="btn-toggle-cred"
                                    onClick={() => toggleCredentialVisibility(prod.id)}
                                    title={isVisible ? 'Sembunyikan' : 'Lihat Password'}
                                  >
                                    <i className={`fa-solid ${isVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                  </button>
                                </div>
                                {prod.credentials?.accountNote && (
                                  <div className="cred-row" style={{ marginTop: '2px' }}>
                                    <span className="cred-label">Catatan:</span>
                                    <span className="cred-value" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                      {prod.credentials.accountNote}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="dagangan-actions-row">
                                <button
                                  type="button"
                                  className="btn-dagangan-toggle"
                                  onClick={() => handleToggleProductStatus(prod.id)}
                                >
                                  <i className={`fa-solid ${isActive ? 'fa-pause' : 'fa-play'}`}></i>
                                  <span>{isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn-dagangan-delete"
                                  onClick={() => handleDeleteProduct(prod.id, prod.name)}
                                  title="Hapus Dagangan"
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ============================================================ */}
          {/* TAB 3: RIWAYAT PESANAN SAYA                                  */}
          {/* ============================================================ */}
          {profileActiveTab === 'orders' && (
            <div className="itemku-profile-orders-view">
              <div className="profile-box-card">
                <div className="box-card-header-between">
                  <div className="box-card-header">
                    <div className="header-icon-pill">
                      <i className="fa-solid fa-receipt text-cyan"></i>
                    </div>
                    <div>
                      <h3 className="box-card-title">Riwayat Pesanan Anda</h3>
                      <p className="box-card-subtitle">Semua riwayat pembelian akun & topup yang pernah Anda lakukan</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={onGoToTransactions}
                  >
                    <i className="fa-solid fa-list-check"></i>
                    <span>Buka Halaman Transaksi Lengkap</span>
                  </button>
                </div>

                {userOrders.length === 0 ? (
                  <div className="empty-recent-orders" style={{ padding: '36px 16px' }}>
                    <div className="empty-order-icon">
                      <i className="fa-solid fa-basket-shopping"></i>
                    </div>
                    <p className="empty-order-text">Belum ada transaksi pada akun ini. Yuk belanja akun premium atau top up game sekarang!</p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={onBackToStore}
                    >
                      <i className="fa-solid fa-store"></i> Jelajahi Katalog
                    </button>
                  </div>
                ) : (
                  <div className="recent-orders-list">
                    {userOrders.map((order) => {
                      const isSuccess = order.status === 'completed' || order.status === 'approved' || order.status === 'success';
                      const isPending = order.status === 'pending' || order.status === 'processing';

                      return (
                        <div key={order.id} className="recent-order-card" onClick={onGoToTransactions}>
                          <div className="order-main-info">
                            <span className="order-id-badge">#{order.id?.slice(-8) || 'TRX'}</span>
                            <h4 className="order-prod-title">
                              {order.productName || order.items?.[0]?.name || 'Pesanan Akun'}
                            </h4>
                            <span className="order-date-text">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Hari ini'}
                            </span>
                          </div>

                          <div className="order-status-side">
                            <span className="order-price-val">
                              {formatRupiah(order.totalPrice || order.total || order.price || 0)}
                            </span>
                            <span
                              className={`order-status-badge ${
                                isSuccess ? 'status-done' : isPending ? 'status-wait' : 'status-fail'
                              }`}
                            >
                              <i
                                className={`fa-solid ${
                                  isSuccess ? 'fa-check-circle' : isPending ? 'fa-hourglass-half' : 'fa-times-circle'
                                }`}
                              ></i>
                              {isSuccess ? ' Selesai' : isPending ? ' Diproses' : ' Ditolak'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. MODAL EDIT PROFILE                                        */}
      {/* ============================================================ */}
      {isEditModalOpen && (
        <div className="profile-modal-overlay" style={{ display: 'flex' }}>
          <div
            className="profile-modal-backdrop"
            onClick={() => setIsEditModalOpen(false)}
          ></div>
          <div className="profile-edit-modal-card">
            <div className="modal-top-bar">
              <div className="modal-title-wrap">
                <i className="fa-solid fa-user-pen text-cyan"></i>
                <h3>Edit Profile Pengguna</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setIsEditModalOpen(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="profile-edit-form">
              {/* 1. NAMA GMAIL VERIFIKASI (Terkunci & Aman) */}
              <div className="form-group-item">
                <label className="form-item-label">
                  <i className="fa-brands fa-google text-danger"></i>
                  <span>Nama Gmail (Terverifikasi)</span>
                </label>
                <div className="verified-gmail-box">
                  <div className="verified-name-row">
                    <span className="verified-user-name">{authUser.name}</span>
                    <span className="verified-shield-badge">
                      <i className="fa-solid fa-circle-check text-success"></i> Terverifikasi
                    </span>
                  </div>
                  <span className="verified-user-email">{authUser.email}</span>
                  <small className="verified-note">
                    *Akun terhubung resmi dengan Google OAuth. Nama & email Google bersifat permanen dan aman dari manipulasi.
                  </small>
                </div>
              </div>

              {/* 2. DI BAWAH ADA NOMOR WHATSAPP */}
              <div className="form-group-item">
                <label className="form-item-label" htmlFor="waInput">
                  <i className="fa-brands fa-whatsapp text-success"></i>
                  <span>Nomor WhatsApp</span>
                </label>
                <div className="input-with-icon">
                  <span className="input-icon-prefix">
                    <i className="fa-solid fa-phone"></i>
                  </span>
                  <input
                    id="waInput"
                    type="tel"
                    className="form-input-styled"
                    placeholder="Contoh: 081234567890 atau 6281234567890"
                    value={editWhatsApp}
                    onChange={(e) => setEditWhatsApp(e.target.value)}
                  />
                </div>
                <small className="form-hint-text">
                  Digunakan untuk notifikasi pengiriman akun kilat dan bantuan customer care.
                </small>
              </div>

              {/* 3. DI BAWAH ADA USERNAME EDIT */}
              <div className="form-group-item">
                <label className="form-item-label" htmlFor="usernameInput">
                  <i className="fa-solid fa-at text-cyan"></i>
                  <span>Username</span>
                </label>
                <div className="input-with-icon">
                  <span className="input-icon-prefix">@</span>
                  <input
                    id="usernameInput"
                    type="text"
                    className="form-input-styled"
                    placeholder="Contoh: chaiz_buyer99"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    required
                  />
                </div>
                <small className="form-hint-text">
                  Username unik untuk nama panggilan Anda di platform ChaizStore.
                </small>
              </div>

              {/* ACTION BUTTONS */}
              <div className="form-actions-row">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-save-profile"
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. MODAL GANTI FOTO PROFIL                                   */}
      {/* ============================================================ */}
      {isAvatarModalOpen && (
        <div className="profile-modal-overlay" style={{ display: 'flex' }}>
          <div
            className="profile-modal-backdrop"
            onClick={() => setIsAvatarModalOpen(false)}
          ></div>
          <div className="profile-avatar-modal-card">
            <div className="modal-top-bar">
              <div className="modal-title-wrap">
                <i className="fa-solid fa-camera text-cyan"></i>
                <h3>Ganti Foto Profil</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setIsAvatarModalOpen(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="avatar-modal-content">
              {/* OPSI 1: UPLOAD DARI HP / LAPTOP */}
              <div className="avatar-upload-box">
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  className="btn-custom-upload"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  <span>Upload Foto dari Galeri / File</span>
                </button>
                <small>Format: JPG, PNG, WebP (Maksimal 3MB)</small>
              </div>

              {/* OPSI 2: PILIH AVATAR PRESET KEREN */}
              <div className="avatar-presets-section">
                <span className="section-small-title">Atau Pilih Karakter Avatar Favorit:</span>
                <div className="preset-avatar-grid">
                  {avatarPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className="preset-avatar-btn"
                      onClick={() => handleSelectPresetAvatar(preset)}
                      style={{ borderColor: preset.color }}
                      title={preset.name}
                    >
                      <div
                        className="preset-avatar-circle"
                        style={{ background: `linear-gradient(135deg, ${preset.color}, #0f172a)` }}
                      >
                        <i className={preset.icon}></i>
                      </div>
                      <span className="preset-name">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* OPSI 3: KEMBALIKAN KE FOTO GOOGLE */}
              {authUser.isGoogle && (
                <div className="avatar-reset-row">
                  <button
                    type="button"
                    className="btn-reset-google-avatar"
                    onClick={handleResetGoogleAvatar}
                  >
                    <i className="fa-brands fa-google text-danger"></i>
                    <span>Kembalikan ke Foto Akun Google</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. MODAL TOP UP SALDO CHAIZMONEY (QRIS & UPLOAD BUKTI)       */}
      {/* ============================================================ */}
      {isTopUpMoneyModalOpen && (
        <div className="profile-modal-overlay" style={{ display: 'flex', overflowY: 'auto', padding: '20px 12px' }}>
          <div
            className="profile-modal-backdrop"
            onClick={() => setIsTopUpMoneyModalOpen(false)}
          ></div>
          <div
            className="profile-topup-modal-card"
            style={{
              maxWidth: '520px',
              maxHeight: 'calc(100vh - 36px)',
              display: 'flex',
              flexDirection: 'column',
              margin: 'auto'
            }}
          >
            <div className="modal-top-bar" style={{ flexShrink: 0 }}>
              <div className="modal-title-wrap">
                <i className="fa-solid fa-wallet text-cyan"></i>
                <h3>Top Up Saldo ChaizMoney</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setIsTopUpMoneyModalOpen(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Step Indicators */}
            {topUpStep <= 3 && (
              <div className="topup-steps-bar" style={{ flexShrink: 0, margin: '12px 18px 0' }}>
                <div className={`step-item ${topUpStep >= 1 ? 'active' : ''} ${topUpStep > 1 ? 'completed' : ''}`}>
                  <span className="step-num">{topUpStep > 1 ? <i className="fa-solid fa-check"></i> : '1'}</span>
                  <span className="step-label">Nominal</span>
                </div>
                <div className={`step-divider ${topUpStep >= 2 ? 'active' : ''}`}></div>
                <div className={`step-item ${topUpStep >= 2 ? 'active' : ''} ${topUpStep > 2 ? 'completed' : ''}`}>
                  <span className="step-num">{topUpStep > 2 ? <i className="fa-solid fa-check"></i> : '2'}</span>
                  <span className="step-label">Scan QRIS</span>
                </div>
                <div className={`step-divider ${topUpStep >= 3 ? 'active' : ''}`}></div>
                <div className={`step-item ${topUpStep >= 3 ? 'active' : ''}`}>
                  <span className="step-num">{topUpStep === 3 ? <i className="fa-solid fa-check"></i> : '3'}</span>
                  <span className="step-label">Selesai</span>
                </div>
              </div>
            )}

            <div className="topup-modal-content" style={{ overflowY: 'auto', flex: 1, padding: '16px 20px 24px' }}>
              {/* ------------------------------------------------------ */}
              {/* STEP 1: PILIH NOMINAL DEPOSIT + PAJAK 100 PERAK        */}
              {/* ------------------------------------------------------ */}
              {topUpStep === 1 && (
                <>
                  <div className="current-balance-banner">
                    <span>Saldo ChaizMoney Saat Ini:</span>
                    <strong>Rp. {(authUser.chaizMoney || 0).toLocaleString('id-ID')}</strong>
                  </div>

                  <span className="section-small-title">Pilih Nominal Top Up:</span>
                  <div className="topup-nominal-grid">
                    {[2000, 5000, 10000, 25000, 50000, 100000].map((nominal) => (
                      <button
                        key={nominal}
                        type="button"
                        className={`nominal-chip-btn ${selectedTopUpAmount === nominal && !customTopUpAmount ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedTopUpAmount(nominal);
                          setCustomTopUpAmount('');
                        }}
                      >
                        {formatRupiah(nominal)}
                      </button>
                    ))}
                  </div>

                  <div className="custom-nominal-input-wrap">
                    <label className="form-item-label">Atau Ketik Nominal Sendiri:</label>
                    <div className="input-with-icon">
                      <span className="input-icon-prefix">Rp</span>
                      <input
                        type="number"
                        className="form-input-styled"
                        placeholder="Contoh: 75000"
                        value={customTopUpAmount}
                        onChange={(e) => setCustomTopUpAmount(e.target.value)}
                        min="1000"
                      />
                    </div>
                  </div>

                  <div className="custom-nominal-input-wrap">
                    <label className="form-item-label">Nomor WhatsApp Konfirmasi:</label>
                    <div className="input-with-icon">
                      <span className="input-icon-prefix">
                        <i className="fa-brands fa-whatsapp text-success"></i>
                      </span>
                      <input
                        type="tel"
                        className="form-input-styled"
                        placeholder="Nomor WA Anda"
                        value={depositPhone}
                        onChange={(e) => setDepositPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Rincian Pembayaran Top Up dengan Pajak 100 */}
                  <div className="topup-fee-summary-card" style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    margin: '16px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#94a3b8' }}>
                      <span>Nominal Saldo Masuk:</span>
                      <strong style={{ color: '#fff' }}>Rp {activeNominal.toLocaleString('id-ID')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#94a3b8' }}>
                      <span>Pajak / Biaya Sistem:</span>
                      <strong style={{ color: '#38bdf8' }}>+ Rp {PAJAK_TOPUP.toLocaleString('id-ID')}</strong>
                    </div>
                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '4px 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 700 }}>Total Pembayaran:</span>
                      <strong style={{ fontSize: '1.25rem', color: '#34d399', fontFamily: 'Outfit, sans-serif' }}>
                        Rp {totalPayableWithTax.toLocaleString('id-ID')}
                      </strong>
                    </div>
                  </div>

                  <div className="topup-actions-row">
                    <button
                      type="button"
                      className="btn btn-outline btn-back-action"
                      onClick={() => setIsTopUpMoneyModalOpen(false)}
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-confirm-topup btn-primary-action"
                      onClick={handleProceedToQrisStep}
                    >
                      <span>Lanjut Bayar QRIS Instan</span>
                      <i className="fa-solid fa-arrow-right"></i>
                    </button>
                  </div>
                </>
              )}

              {/* ------------------------------------------------------ */}
              {/* STEP 2: SCAN QRIS ASLI REALTIME (JANSPAYMENT GATEWAY)  */}
              {/* ------------------------------------------------------ */}
              {topUpStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="qris-standee-card">
                    {/* Header Merchant Resmi */}
                    <div className="qris-merchant-banner">
                      <div className="qris-brand-left">
                        <span className="qris-pill-badge">QRIS</span>
                        <div className="qris-merchant-title">
                          <span>CHAIZSTORE OFFICIAL</span>
                          <i className="fa-solid fa-circle-check qris-verified-icon" title="Verified Merchant"></i>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '0.04em' }}>
                        NMID: ID1026479345864 (JansPayment)
                      </span>
                    </div>

                    {/* QR Code Canvas */}
                    <div className="qris-canvas-wrapper" style={{ minHeight: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      {isGeneratingTopUpQris ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: '#38bdf8' }}></i>
                          <strong style={{ color: '#fff', fontSize: '0.95rem' }}>Menghubungkan ke Server JansPayment...</strong>
                          <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Membuat barcode QRIS resmi realtime dengan deteksi otomatis</span>
                        </div>
                      ) : isTopUpExpired ? (
                        <div className="qris-expired-box" style={{
                          padding: '32px 20px',
                          textAlign: 'center',
                          background: 'rgba(239, 68, 68, 0.08)',
                          borderRadius: '16px',
                          border: '2px dashed rgba(239, 68, 68, 0.45)',
                          margin: '0 auto',
                          width: '100%',
                          maxWidth: '320px'
                        }}>
                          <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.18)',
                            color: '#f87171',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.9rem',
                            margin: '0 auto 12px',
                            boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)'
                          }}>
                            <i className="fa-solid fa-hourglass-end"></i>
                          </div>
                          <h4 style={{ color: '#f87171', fontWeight: 800, fontSize: '1.15rem', marginBottom: '6px' }}>
                            QRIS HANGUS (6 MENIT HABIS)
                          </h4>
                          <p style={{ color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '16px' }}>
                            Batas waktu pembayaran <strong>6 menit</strong> telah habis. Barcode QRIS ini dinonaktifkan demi keamanan. Silakan buat sesi QRIS baru.
                          </p>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleProceedToQrisStep}
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                              color: '#fff',
                              fontWeight: 700,
                              border: 'none',
                              padding: '10px 18px',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontSize: '0.86rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                            }}
                          >
                            <i className="fa-solid fa-rotate-right"></i>
                            <span>Buat Barcode QRIS Baru</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <img
                            src={topUpJansData?.qrImageUrl || '/Qris.png'}
                            alt="QRIS ChaizStore"
                            className="qris-canvas-img"
                            style={{ maxWidth: '280px', width: '100%', height: 'auto', margin: '0 auto', display: 'block', borderRadius: '12px' }}
                          />
                          <div className="qris-canvas-footer" style={{ marginTop: '8px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <i className="fa-solid fa-qrcode text-emerald-400"></i>
                              SCAN DENGAN APLIKASI PEMBAYARAN APA SAJA
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Realtime Live Pulse Indicator */}
                    {isTopUpExpired ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#f87171',
                        padding: '9px 14px',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 700
                      }}>
                        <i className="fa-solid fa-triangle-exclamation"></i>
                        <span>Sesi QRIS Hangus (Waktu 6 Menit Telah Habis)</span>
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        color: '#38bdf8',
                        padding: '9px 14px',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 600
                      }}>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Menunggu Pembayaran Real-Time (Otomatis)...</span>
                      </div>
                    )}

                    {/* Total Tagihan Transfer dengan Tombol Salin */}
                    <div className="qris-amount-card">
                      <div className="qris-amount-info">
                        <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Total Nominal Scan QRIS (Persis):</span>
                        <strong style={{ fontSize: '1.25rem', color: isTopUpExpired ? '#94a3b8' : '#34d399' }}>
                          Rp {Number(topUpJansData?.amount || activeNominal).toLocaleString('id-ID')}
                        </strong>
                        <div style={{ fontSize: '0.74rem', color: '#38bdf8', marginTop: '3px', fontWeight: 600 }}>
                          <i className="fa-solid fa-coins"></i> Saldo ChaizMoney Masuk: Rp {Number(topUpJansData?.creditAmount || activeNominal).toLocaleString('id-ID')} PAS
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`btn-copy-nominal ${copiedNominal ? 'copied' : ''}`}
                        onClick={handleCopyNominal}
                        title="Salin nominal agar pas saat transfer"
                        disabled={isTopUpExpired}
                        style={isTopUpExpired ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      >
                        <i className={`fa-solid ${copiedNominal ? 'fa-check' : 'fa-copy'}`}></i>
                        <span>{copiedNominal ? 'Tersalin!' : 'Salin Nominal'}</span>
                      </button>
                    </div>

                    {/* Timer & Tools */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <span className="qris-timer-pill" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: isTopUpExpired ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.15)',
                        border: isTopUpExpired ? '1px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.35)',
                        color: isTopUpExpired ? '#ef4444' : '#f87171',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 700
                      }}>
                        <i className={`fa-solid ${isTopUpExpired ? 'fa-triangle-exclamation' : 'fa-clock'}`}></i>
                        <span>{isTopUpExpired ? 'HANGUS (0:00)' : `Batas Waktu: ${formatTimer(topUpTimerSeconds)}`}</span>
                      </span>

                      {!isTopUpExpired && (
                        <button
                          type="button"
                          className="btn-download-qris-pro"
                          onClick={handleDownloadQris}
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          <i className="fa-solid fa-download"></i>
                          <span>Unduh Gambar QRIS</span>
                        </button>
                      )}
                    </div>

                    {/* Supported Providers Strip */}
                    <div className="qris-supported-strip">
                      <span>Mendukung Semua Bank & E-Wallet:</span>
                      <div className="qris-bank-chips">
                        <span className="qris-bank-chip">BCA</span>
                        <span className="qris-bank-chip">Mandiri</span>
                        <span className="qris-bank-chip">BRI</span>
                        <span className="qris-bank-chip">BNI</span>
                        <span className="qris-bank-chip">DANA</span>
                        <span className="qris-bank-chip">GoPay</span>
                        <span className="qris-bank-chip">OVO</span>
                        <span className="qris-bank-chip">ShopeePay</span>
                      </div>
                    </div>

                    {/* Panduan Singkat */}
                    <div className="qris-instructions-box">
                      <h5>
                        <i className="fa-solid fa-bolt text-cyan"></i>
                        <span>Verifikasi Otomatis Gateway JansPayment:</span>
                      </h5>
                      <ol>
                        <li>Buka aplikasi m-Banking atau E-Wallet di HP Anda (BCA, Mandiri, GoPay, Dana, OVO, ShopeePay, dll).</li>
                        <li>Pilih menu <strong>Scan QRIS</strong> dan arahkan kamera ke barcode di atas.</li>
                        <li>Batas waktu pembayaran adalah <strong>6 menit</strong>. Jika lewat 6 menit tanpa pembayaran, QRIS otomatis <strong>hangus</strong> demi keamanan.</li>
                        <li>Pastikan nominal transfer tepat <strong>Rp {Number(topUpJansData?.amount || activeNominal).toLocaleString('id-ID')}</strong>.</li>
                        <li>Setelah Anda bayar di HP, gateway JansPayment akan <strong>mendeteksi otomatis</strong> dalam 1-2 detik dan saldo ChaizMoney Rp {Number(topUpJansData?.creditAmount || activeNominal).toLocaleString('id-ID')} langsung masuk tanpa perlu tombol manual!</li>
                      </ol>
                    </div>
                  </div>

                  {/* Navigasi Step 2 - HANYA BATAL DAN CEK REAL GATEWAY (ANTI-TIPU) */}
                  <div className="topup-actions-row" style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-back-action"
                      onClick={() => setTopUpStep(1)}
                      style={{ flex: 1, minWidth: '120px' }}
                    >
                      <i className="fa-solid fa-arrow-left"></i> Batal / Ganti
                    </button>
                    {isTopUpExpired ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleProceedToQrisStep}
                        style={{
                          flex: 1.6,
                          minWidth: '200px',
                          background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                          color: '#fff',
                          fontWeight: 700,
                          border: 'none',
                          padding: '11px 16px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                        }}
                      >
                        <i className="fa-solid fa-rotate-right"></i>
                        <span>Buat QRIS Baru (6 Menit)</span>
                      </button>
                    ) : (
                      <div
                        className="topup-live-status-pill"
                        style={{
                          flex: 1.6,
                          minWidth: '200px',
                          background: 'rgba(6, 182, 212, 0.1)',
                          border: '1px solid rgba(6, 182, 212, 0.35)',
                          color: '#06b6d4',
                          fontWeight: 600,
                          padding: '11px 16px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontSize: '0.88rem'
                        }}
                      >
                        <i className="fa-solid fa-spinner fa-spin text-cyan"></i>
                        <span>Menunggu Pembayaran (Otomatis)...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------ */}
              {/* STEP 3: SUKSES OTOMATIS & SALDO CHAIZMONEY BERTAMBAH   */}
              {/* ------------------------------------------------------ */}
              {topUpStep === 3 && (
                <div className="deposit-success-view" style={{ textAlign: 'center', padding: '24px 16px' }}>
                  <div className="dep-success-icon" style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.18)',
                    border: '2px solid #10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    color: '#10b981',
                    margin: '0 auto 16px',
                    boxShadow: '0 0 24px rgba(16, 185, 129, 0.4)'
                  }}>
                    <i className="fa-solid fa-circle-check"></i>
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                    Top Up ChaizMoney Berhasil!
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '20px' }}>
                    Pembayaran Anda telah sukses terverifikasi secara realtime oleh gateway JansPayment. Saldo sebesar <strong style={{ color: '#34d399' }}>{formatRupiah(activeNominal)}</strong> telah otomatis ditambahkan ke dompet akun Anda.
                  </p>

                  <div className="dep-info-box" style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    marginBottom: '22px'
                  }}>
                    <div className="dep-info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#94a3b8' }}>Nominal Saldo Masuk:</span>
                      <strong style={{ color: '#34d399', fontWeight: 800 }}>+ {formatRupiah(activeNominal)}</strong>
                    </div>
                    <div className="dep-info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#94a3b8' }}>Pajak Sistem:</span>
                      <strong style={{ color: '#38bdf8' }}>Rp {PAJAK_TOPUP.toLocaleString('id-ID')}</strong>
                    </div>
                    <div className="dep-info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#94a3b8' }}>Total yang Dibayar:</span>
                      <strong style={{ color: '#fff' }}>Rp {Number(topUpJansData?.amount || totalPayableWithTax).toLocaleString('id-ID')}</strong>
                    </div>
                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '4px 0' }}></div>
                    <div className="dep-info-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#cbd5e1', fontWeight: 700 }}>Total Saldo ChaizMoney Baru:</span>
                      <strong style={{ color: '#22d3ee', fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>
                        Rp {Number(newCalculatedBalance !== null ? newCalculatedBalance : ((authUser.chaizMoney || 0) + activeNominal)).toLocaleString('id-ID')}
                      </strong>
                    </div>
                    <div className="dep-info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: '4px' }}>
                      <span style={{ color: '#94a3b8' }}>Metode Pembayaran:</span>
                      <span style={{ color: '#38bdf8', fontWeight: 600 }}>QRIS JansPayment (Otomatis)</span>
                    </div>
                    <div className="dep-info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: '#94a3b8' }}>Status Transaksi:</span>
                      <span style={{ color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <i className="fa-solid fa-circle-check"></i> Lunas & Berhasil
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={() => setIsTopUpMoneyModalOpen(false)}
                    style={{ padding: '12px 18px', fontSize: '0.95rem', fontWeight: 700, width: '100%', borderRadius: '10px' }}
                  >
                    <span>Selesai & Gunakan Saldo</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. MODAL ZOOM FOTO BUKTI TRANSFER                            */}
      {/* ============================================================ */}
      {selectedProofToView && (
        <div className="profile-modal-overlay" style={{ display: 'flex' }}>
          <div
            className="profile-modal-backdrop"
            onClick={() => setSelectedProofToView(null)}
          ></div>
          <div className="proof-zoom-modal-box">
            <div className="modal-top-bar">
              <div className="modal-title-wrap">
                <i className="fa-solid fa-image text-cyan"></i>
                <h3>Foto Bukti Pembayaran</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setSelectedProofToView(null)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="proof-zoom-body">
              <img src={selectedProofToView} alt="Bukti Transfer" className="proof-zoom-img" />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. MODAL BUKA TOKO (ITEMKU MULAI JUALAN)                     */}
      {/* ============================================================ */}
      {isStoreRegisterModalOpen && (
        <div className="profile-modal-overlay" style={{ display: 'flex' }}>
          <div
            className="profile-modal-backdrop"
            onClick={() => setIsStoreRegisterModalOpen(false)}
          ></div>
          <div className="seller-modal-card">
            <div className="seller-modal-header">
              <div className="seller-modal-title-wrap">
                <i className="fa-solid fa-store text-orange"></i>
                <h3>Buka Toko di ChaizStore</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setIsStoreRegisterModalOpen(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleRegisterStoreSubmit}>
              <div className="seller-modal-body">
                <div className="seller-form-group">
                  <label className="seller-form-label">
                    <i className="fa-solid fa-shop text-orange"></i> Nama Toko
                  </label>
                  <input
                    type="text"
                    className="seller-form-input"
                    placeholder="Contoh: Chaiz Gaming Shop"
                    value={regStoreName}
                    onChange={(e) => setRegStoreName(e.target.value)}
                    required
                  />
                  <span className="seller-form-hint">
                    Nama tokomu akan dilihat oleh calon pembeli di marketplace ChaizStore.
                  </span>
                </div>

                <div className="seller-form-group">
                  <label className="seller-form-label">
                    <i className="fa-solid fa-quote-left text-blue"></i> Slogan / Deskripsi Singkat
                  </label>
                  <input
                    type="text"
                    className="seller-form-input"
                    placeholder="Contoh: Jual Akun Game & Streaming Garansi Cepat"
                    value={regSlogan}
                    onChange={(e) => setRegSlogan(e.target.value)}
                  />
                </div>

                <div className="seller-form-group">
                  <label className="seller-form-label">
                    <i className="fa-brands fa-whatsapp text-success"></i> Nomor WhatsApp Penjual
                  </label>
                  <input
                    type="tel"
                    className="seller-form-input"
                    placeholder="081234567890"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    required
                  />
                  <span className="seller-form-hint">
                    Digunakan untuk notifikasi pesanan masuk dan koordinasi dengan Admin.
                  </span>
                </div>

                <label className="seller-checkbox-label">
                  <input
                    type="checkbox"
                    checked={regAgreed}
                    onChange={(e) => setRegAgreed(e.target.checked)}
                    required
                  />
                  <span>
                    Saya setuju mematuhi <strong>Ketentuan Penjual ChaizStore</strong>, menjual produk legal, dan bersedia memberikan garansi akun kepada pembeli.
                  </span>
                </label>
              </div>

              <div className="seller-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsStoreRegisterModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-seller-submit"
                  disabled={isSubmittingStore}
                >
                  <i className="fa-solid fa-rocket"></i>
                  <span>{isSubmittingStore ? 'Memproses...' : 'Daftar & Aktifkan Toko'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 8. MODAL PENGATURAN TOKO SAYA                                */}
      {/* ============================================================ */}
      {isEditStoreModalOpen && (
        <div className="profile-modal-overlay" style={{ display: 'flex' }}>
          <div
            className="profile-modal-backdrop"
            onClick={() => setIsEditStoreModalOpen(false)}
          ></div>
          <div className="seller-modal-card">
            <div className="seller-modal-header">
              <div className="seller-modal-title-wrap">
                <i className="fa-solid fa-gear text-blue"></i>
                <h3>Pengaturan Toko Saya</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setIsEditStoreModalOpen(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveStoreSettings}>
              <div className="seller-modal-body">
                <div className="seller-form-group">
                  <label className="seller-form-label">Nama Toko</label>
                  <input
                    type="text"
                    className="seller-form-input"
                    value={editStoreName}
                    onChange={(e) => setEditStoreName(e.target.value)}
                    required
                  />
                </div>

                <div className="seller-form-group">
                  <label className="seller-form-label">Slogan Toko</label>
                  <input
                    type="text"
                    className="seller-form-input"
                    value={editSlogan}
                    onChange={(e) => setEditSlogan(e.target.value)}
                  />
                </div>

                <div className="seller-form-group">
                  <label className="seller-form-label">Nomor WhatsApp Notifikasi</label>
                  <input
                    type="tel"
                    className="seller-form-input"
                    value={editStorePhone}
                    onChange={(e) => setEditStorePhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="seller-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsEditStoreModalOpen(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>Simpan Pengaturan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 9. MODAL TAMBAH DAGANGAN BARU (ITEMKU LISTING)               */}
      {/* ============================================================ */}
      {isAddProductModalOpen && (
        <div className="profile-modal-overlay" style={{ display: 'flex' }}>
          <div
            className="profile-modal-backdrop"
            onClick={() => setIsAddProductModalOpen(false)}
          ></div>
          <div className="seller-modal-card" style={{ maxWidth: '600px' }}>
            <div className="seller-modal-header">
              <div className="seller-modal-title-wrap">
                <i className="fa-solid fa-box-open text-orange"></i>
                <h3>Tambah Dagangan Baru</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setIsAddProductModalOpen(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit}>
              <div className="seller-modal-body">
                <div className="seller-form-group">
                  <label className="seller-form-label">
                    <i className="fa-solid fa-cube text-orange"></i> Nama Dagangan / Akun
                  </label>
                  <input
                    type="text"
                    className="seller-form-input"
                    placeholder="Contoh: Akun Mobile Legends Mythic Skin Epic / Netflix UHD Shared"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="seller-form-group">
                    <label className="seller-form-label">
                      <i className="fa-solid fa-shapes text-blue"></i> Kategori
                    </label>
                    <select
                      className="seller-form-select"
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                    >
                      <option value="game">🎮 Akun Game</option>
                      <option value="streaming">🎬 Streaming VIP</option>
                      <option value="ai">🤖 AI & Bot Tools</option>
                      <option value="voucher">🎟️ Voucher & Top Up</option>
                      <option value="other">📦 Produk Digital Lain</option>
                    </select>
                  </div>

                  <div className="seller-form-group">
                    <label className="seller-form-label">
                      <i className="fa-solid fa-layer-group text-purple"></i> Stok
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="seller-form-input"
                      placeholder="1"
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="seller-form-group">
                  <label className="seller-form-label">
                    <i className="fa-solid fa-money-bill-wave text-success"></i> Harga Jual (Rp)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    className="seller-form-input"
                    placeholder="Contoh: 15000"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    required
                  />
                  <span className="seller-form-hint">
                    Harga bersih yang akan Anda terima via ChaizMoney saat produk terjual.
                  </span>
                </div>

                <div className="seller-form-group">
                  <label className="seller-form-label">Deskripsi & Garansi</label>
                  <textarea
                    className="seller-form-textarea"
                    placeholder="Tuliskan spesifikasi akun, garansi, atau catatan pemakaian..."
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                  ></textarea>
                </div>

                {/* Box Data Kredensial Pengiriman Otomatis */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-key text-orange"></i>
                    <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>
                      Data Kredensial Akun (Otomatis Dikirim saat Dibeli)
                    </strong>
                  </div>

                  <div className="seller-form-group">
                    <label className="seller-form-label" style={{ fontSize: '0.82rem' }}>
                      Username / Email Akun:
                    </label>
                    <input
                      type="text"
                      className="seller-form-input"
                      placeholder="Contoh: gamer_pro99@gmail.com"
                      value={prodAccountUser}
                      onChange={(e) => setProdAccountUser(e.target.value)}
                      required
                    />
                  </div>

                  <div className="seller-form-group">
                    <label className="seller-form-label" style={{ fontSize: '0.82rem' }}>
                      Password / PIN Akun:
                    </label>
                    <input
                      type="text"
                      className="seller-form-input"
                      placeholder="Contoh: RaHaSiA123!"
                      value={prodAccountPass}
                      onChange={(e) => setProdAccountPass(e.target.value)}
                      required
                    />
                  </div>

                  <div className="seller-form-group">
                    <label className="seller-form-label" style={{ fontSize: '0.82rem' }}>
                      Catatan Tambahan untuk Pembeli (Opsional):
                    </label>
                    <input
                      type="text"
                      className="seller-form-input"
                      placeholder="Contoh: Jangan ubah email utama, garansi 30 hari aktif"
                      value={prodAccountNote}
                      onChange={(e) => setProdAccountNote(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="seller-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsAddProductModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-seller-submit"
                  disabled={isSubmittingProduct}
                >
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  <span>{isSubmittingProduct ? 'Menerbitkan...' : 'Terbitkan Dagangan Sekarang'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
