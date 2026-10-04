// ===================================================================
// CHAIZSTORE ORDER CHAT ENGINE (Realtime Customer <-> Admin Live Chat)
// Features:
// 1. WhatsApp-like Realtime Messaging
// 2. Customer rate limit: Max 2 messages in a row -> 5 minutes cooldown
// 3. Admin reply instantly removes the 5-minute cooldown (reset limit)
// 4. Admin special permission bypass (Izin khusus chat)
// 5. Cross-tab & multi-window instant synchronization via BroadcastChannel
// ===================================================================

const CHAT_STORAGE_KEY = 'chaiz_order_chats';
const CHAT_CHANNEL_NAME = 'chaiz_chat_sync';
const CUSTOMER_MAX_CONSECUTIVE_MSGS = 2;
const COOLDOWN_DURATION_MS = 5 * 60 * 1000; // 5 Menit (300.000 ms)

// Helper: Ambil seluruh data chat dari localStorage
export function getAllOrderChats() {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to parse order chats from localStorage:', e);
    return {};
  }
}

// Helper: Simpan ke localStorage & broadcast ke seluruh tab/jendela
function saveAndBroadcastChats(allChats, eventType = 'CHAT_UPDATED', detail = {}) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(allChats));
  } catch (e) {
    console.error('Failed to save order chats to localStorage:', e);
  }

  // 1. Custom event di window saat ini
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('chaiz_chat_event', {
        detail: { eventType, ...detail, allChats }
      })
    );
  }

  // 2. BroadcastChannel antar tab
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel(CHAT_CHANNEL_NAME);
      bc.postMessage({ eventType, ...detail, timestamp: Date.now() });
      setTimeout(() => bc.close(), 100);
    } catch {
      // Ignore
    }
  }
}

// Ambil atau buat percakapan chat untuk pesanan tertentu
export function getOrderChat(orderId, initialContext = {}) {
  if (!orderId) return null;
  const allChats = getAllOrderChats();

  if (allChats[orderId]) {
    const chat = allChats[orderId];
    // Periksa status cooldown apakah sudah kedaluwarsa secara alami
    if (chat.cooldownUntil && Date.now() >= chat.cooldownUntil) {
      chat.cooldownUntil = null;
      chat.consecutiveCustomerMsgs = 0;
      allChats[orderId] = chat;
      saveAndBroadcastChats(allChats, 'COOLDOWN_EXPIRED', { orderId });
    }
    return chat;
  }

  // Inisialisasi room chat baru jika belum pernah ada
  const customerName = initialContext.customerName || 'Pelanggan ChaizStore';
  const customerEmail = initialContext.customerEmail || '-';
  const customerPhone = initialContext.customerPhone || '-';
  const productName = initialContext.productName || 'Produk Akun Premium';

  const newChat = {
    orderId,
    customerName,
    customerEmail,
    customerPhone,
    productName,
    createdAt: new Date().toISOString(),
    consecutiveCustomerMsgs: 0,
    cooldownUntil: null, // timestamp milidetik
    adminSpecialPermission: false,
    unreadByAdmin: 0,
    unreadByCustomer: 0,
    messages: [
      {
        id: 'msg_welcome_' + Date.now(),
        sender: 'system',
        senderName: 'Sistem ChaizStore',
        text: `Ruang chat resmi pesanan #${orderId} (${productName}) telah aktif. Silakan kirimkan pertanyaan atau konfirmasi kepada Admin di sini.`,
        createdAt: new Date().toISOString(),
        read: true
      },
      {
        id: 'msg_admin_intro_' + (Date.now() + 1),
        sender: 'admin',
        senderName: 'Admin ChaizStore',
        text: `Halo kak ${customerName}! 👋 Pesanan ${productName} Anda sudah masuk ke antrean admin. Ada yang bisa kami bantu terkait pesanan ini?`,
        createdAt: new Date(Date.now() + 500).toISOString(),
        read: true
      }
    ]
  };

  allChats[orderId] = newChat;
  saveAndBroadcastChats(allChats, 'CHAT_INITIALIZED', { orderId });
  return newChat;
}

// Kirim pesan dari PELANGGAN
export function sendCustomerMessage(orderId, text, customerContext = {}) {
  if (!orderId || !text || !text.trim()) {
    throw new Error('Pesan tidak boleh kosong!');
  }

  const allChats = getAllOrderChats();
  const chat = allChats[orderId] || getOrderChat(orderId, customerContext);
  const now = Date.now();

  // 1. Cek apakah masih dalam masa cooldown 5 menit
  if (chat.cooldownUntil && now < chat.cooldownUntil && !chat.adminSpecialPermission) {
    const remainingSeconds = Math.ceil((chat.cooldownUntil - now) / 1000);
    return {
      success: false,
      error: 'COOLDOWN_ACTIVE',
      remainingSeconds,
      chat
    };
  }

  // Jika cooldown sudah lewat, reset counter
  if (chat.cooldownUntil && now >= chat.cooldownUntil) {
    chat.cooldownUntil = null;
    chat.consecutiveCustomerMsgs = 0;
  }

  // 2. Tambah pesan pelanggan
  const newMsg = {
    id: 'msg_' + now + '_' + Math.random().toString(36).slice(2, 6),
    sender: 'customer',
    senderName: customerContext.customerName || chat.customerName || 'Pelanggan',
    text: text.trim(),
    createdAt: new Date().toISOString(),
    read: false
  };

  chat.messages.push(newMsg);
  chat.consecutiveCustomerMsgs = (chat.consecutiveCustomerMsgs || 0) + 1;
  chat.unreadByAdmin = (chat.unreadByAdmin || 0) + 1;
  chat.lastActivity = new Date().toISOString();
  chat.adminSpecialPermission = false; // reset izin khusus setelah pesan dikirim

  // 3. Jika sudah mengirim 2 pesan berturut-turut tanpa balasan admin -> Masuk limit cooldown 5 menit
  let isRateLimitedNow = false;
  if (chat.consecutiveCustomerMsgs >= CUSTOMER_MAX_CONSECUTIVE_MSGS) {
    chat.cooldownUntil = now + COOLDOWN_DURATION_MS;
    isRateLimitedNow = true;

    // Notifikasi sistem bahwa cooldown aktif
    chat.messages.push({
      id: 'msg_sys_limit_' + now,
      sender: 'system',
      senderName: 'Sistem Pembatasan Chat',
      text: '⏳ Anda telah mengirim 2 pesan. Mohon tunggu 5 menit atau tunggu balasan Admin. Batas waktu ini akan otomatis terhapus saat Admin membalas chat Anda.',
      createdAt: new Date(now + 100).toISOString(),
      read: true
    });
  }

  allChats[orderId] = chat;
  saveAndBroadcastChats(allChats, 'NEW_MESSAGE', { orderId, message: newMsg, from: 'customer' });

  return {
    success: true,
    chat,
    isRateLimitedNow,
    remainingSeconds: isRateLimitedNow ? 300 : 0,
    remainingMessages: Math.max(0, CUSTOMER_MAX_CONSECUTIVE_MSGS - chat.consecutiveCustomerMsgs)
  };
}

// Kirim pesan dari ADMIN
// ATURAN SPESIAL: Saat admin membalas, cooldown 5 menit pelanggan LANGSUNG DIHAPUS & counter di-reset ke 0!
export function sendAdminMessage(orderId, text, adminName = 'Admin ChaizStore') {
  if (!orderId || !text || !text.trim()) {
    throw new Error('Balasan admin tidak boleh kosong!');
  }

  const allChats = getAllOrderChats();
  const chat = allChats[orderId] || getOrderChat(orderId);
  const now = Date.now();

  const newMsg = {
    id: 'msg_adm_' + now + '_' + Math.random().toString(36).slice(2, 6),
    sender: 'admin',
    senderName: adminName,
    text: text.trim(),
    createdAt: new Date().toISOString(),
    read: false
  };

  chat.messages.push(newMsg);

  // RESET ATURAN: Hapus total batas 5 menit pelanggan!
  const hadCooldown = Boolean(chat.cooldownUntil && now < chat.cooldownUntil);
  chat.cooldownUntil = null;
  chat.consecutiveCustomerMsgs = 0;
  chat.adminSpecialPermission = true;
  chat.unreadByCustomer = (chat.unreadByCustomer || 0) + 1;
  chat.lastActivity = new Date().toISOString();

  if (hadCooldown) {
    chat.messages.push({
      id: 'msg_sys_unlocked_' + now,
      sender: 'system',
      senderName: 'Sistem ChaizStore',
      text: '🔓 Admin telah membalas chat. Pembatasan 5 menit Anda telah otomatis dihapus! Anda dapat mengirim pesan kembali.',
      createdAt: new Date(now + 100).toISOString(),
      read: true
    });
  }

  allChats[orderId] = chat;
  saveAndBroadcastChats(allChats, 'NEW_MESSAGE', { orderId, message: newMsg, from: 'admin' });

  return {
    success: true,
    chat
  };
}

// Izin Khusus Admin: Hapus jeda 5 menit pelanggan secara manual tanpa harus ketik pesan panjang
export function grantCustomerChatPermission(orderId) {
  const allChats = getAllOrderChats();
  const chat = allChats[orderId] || getOrderChat(orderId);
  const now = Date.now();

  chat.cooldownUntil = null;
  chat.consecutiveCustomerMsgs = 0;
  chat.adminSpecialPermission = true;

  chat.messages.push({
    id: 'msg_sys_granted_' + now,
    sender: 'system',
    senderName: 'Sistem Izin Admin',
    text: '🔓 Admin telah memberikan izin khusus chat. Pembatasan waktu 5 menit telah dicabut, pelanggan dapat mengirim pesan kembali.',
    createdAt: new Date().toISOString(),
    read: true
  });

  allChats[orderId] = chat;
  saveAndBroadcastChats(allChats, 'PERMISSION_GRANTED', { orderId });

  return {
    success: true,
    chat
  };
}

// Tandai pesan sudah dibaca oleh salah satu pihak
export function markOrderChatAsRead(orderId, role = 'customer') {
  const allChats = getAllOrderChats();
  const chat = allChats[orderId];
  if (!chat) return;

  let changed = false;
  if (role === 'customer' && chat.unreadByCustomer > 0) {
    chat.unreadByCustomer = 0;
    changed = true;
  } else if (role === 'admin' && chat.unreadByAdmin > 0) {
    chat.unreadByAdmin = 0;
    changed = true;
  }

  if (changed) {
    allChats[orderId] = chat;
    saveAndBroadcastChats(allChats, 'CHAT_READ', { orderId, role });
  }
}

// Hitung sisa detik cooldown pelanggan
export function getCustomerCooldownSeconds(chat) {
  if (!chat || !chat.cooldownUntil) return 0;
  if (chat.adminSpecialPermission) return 0;
  const now = Date.now();
  if (now >= chat.cooldownUntil) return 0;
  return Math.ceil((chat.cooldownUntil - now) / 1000);
}

// Format detik menjadi MM:SS
export function formatCooldownTimer(totalSeconds) {
  if (totalSeconds <= 0) return '00:00';
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Subscribe listener realtime ke perubahan chat
export function subscribeToOrderChat(orderId, callback) {
  if (typeof window === 'undefined') return () => {};

  const handleCustom = (e) => {
    if (!orderId || e.detail?.orderId === orderId || !e.detail?.orderId) {
      const allChats = getAllOrderChats();
      callback(orderId ? allChats[orderId] || null : allChats, e.detail);
    }
  };

  const handleStorage = (e) => {
    if (e.key === CHAT_STORAGE_KEY) {
      const allChats = getAllOrderChats();
      callback(orderId ? allChats[orderId] || null : allChats, { eventType: 'STORAGE' });
    }
  };

  window.addEventListener('chaiz_chat_event', handleCustom);
  window.addEventListener('storage', handleStorage);

  let bc = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      bc = new BroadcastChannel(CHAT_CHANNEL_NAME);
      bc.onmessage = (msg) => {
        if (!orderId || msg.data?.orderId === orderId || !msg.data?.orderId) {
          const allChats = getAllOrderChats();
          callback(orderId ? allChats[orderId] || null : allChats, msg.data);
        }
      };
    } catch {
      // ignore
    }
  }

  return () => {
    window.removeEventListener('chaiz_chat_event', handleCustom);
    window.removeEventListener('storage', handleStorage);
    if (bc) bc.close();
  };
}
