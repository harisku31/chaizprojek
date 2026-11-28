// ===================================================================
// CHAIZSTORE REALTIME WEBSOCKET CLIENT (SOCKET.IO)
// Provides instant 0ms event notifications for Admin and Users
// Unlimited scale, eliminates browser TCP socket exhaustion
// ===================================================================

import { io } from 'socket.io-client';
import { getSqlApiBaseUrl } from './sqlApi.js';

let socketInstance = null;
let isConnected = false;

export function getSocket() {
  if (typeof window === 'undefined') return null;

  if (!socketInstance) {
    const serverUrl = getSqlApiBaseUrl().replace(/\/api\/?$/, '');
    
    socketInstance = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true
    });

    socketInstance.on('connect', () => {
      isConnected = true;
      console.log('⚡ [Socket.io]: Connected to ChaizStore Dedicated Server (ID:', socketInstance.id, ')');
      window.dispatchEvent(new CustomEvent('chaiz_server_status', { detail: { online: true, id: socketInstance.id } }));
    });

    socketInstance.on('disconnect', (reason) => {
      isConnected = false;
      console.warn('⚠️ [Socket.io]: Disconnected from server. Reason:', reason);
      window.dispatchEvent(new CustomEvent('chaiz_server_status', { detail: { online: false, reason } }));
    });

    socketInstance.on('connect_error', (err) => {
      // Background retry, no crash
    });
  }

  return socketInstance;
}

export function isSocketConnected() {
  return isConnected && !!socketInstance?.connected;
}

/**
 * Hubungkan Admin ke Sinyal WebSocket Khusus Pesanan Masuk (Sub-10ms Bel Chime)
 */
export function subscribeAdminSocket({
  onIncomingOrder,
  onOrderUpdated,
  onOrdersCleared,
  onPresenceUpdated,
  onBanChanged,
  onIncomingDeposit,
  onDepositUpdated,
  onVoucherUsed,
  onVoucherUpdated,
  onVouchersSynced
}) {
  const socket = getSocket();
  if (!socket) return () => {};

  // Daftarkan socket ini sebagai admin di server
  if (socket.connected) {
    socket.emit('admin:register');
  } else {
    socket.once('connect', () => {
      socket.emit('admin:register');
    });
  }

  const incomingHandler = (payload) => {
    if (typeof onIncomingOrder === 'function') {
      onIncomingOrder(payload);
    }
  };

  const updateHandler = (order) => {
    if (typeof onOrderUpdated === 'function') {
      onOrderUpdated(order);
    }
  };

  const clearHandler = () => {
    if (typeof onOrdersCleared === 'function') {
      onOrdersCleared();
    }
  };

  const presenceHandler = (user) => {
    if (typeof onPresenceUpdated === 'function') {
      onPresenceUpdated(user);
    }
  };

  const banHandler = (user) => {
    if (typeof onBanChanged === 'function') {
      onBanChanged(user);
    }
  };

  const depositIncomingHandler = (payload) => {
    if (typeof onIncomingDeposit === 'function') {
      onIncomingDeposit(payload);
    }
  };

  const depositUpdateHandler = (deposit) => {
    if (typeof onDepositUpdated === 'function') {
      onDepositUpdated(deposit);
    }
  };

  const voucherUsedHandler = (voucher) => {
    if (typeof onVoucherUsed === 'function') {
      onVoucherUsed(voucher);
    }
  };

  const voucherUpdatedHandler = (voucher) => {
    if (typeof onVoucherUpdated === 'function') {
      onVoucherUpdated(voucher);
    }
  };

  const vouchersSyncedHandler = (vouchers) => {
    if (typeof onVouchersSynced === 'function') {
      onVouchersSynced(vouchers);
    }
  };

  socket.on('order:incoming', incomingHandler);
  socket.on('order:updated', updateHandler);
  socket.on('orders:cleared', clearHandler);
  socket.on('user:presence_updated', presenceHandler);
  socket.on('user:banned_changed', banHandler);
  socket.on('deposit:incoming', depositIncomingHandler);
  socket.on('deposit:updated', depositUpdateHandler);
  socket.on('voucher:used', voucherUsedHandler);
  socket.on('voucher:updated', voucherUpdatedHandler);
  socket.on('vouchers:updated', vouchersSyncedHandler);

  return () => {
    socket.off('order:incoming', incomingHandler);
    socket.off('order:updated', updateHandler);
    socket.off('orders:cleared', clearHandler);
    socket.off('user:presence_updated', presenceHandler);
    socket.off('user:banned_changed', banHandler);
    socket.off('deposit:incoming', depositIncomingHandler);
    socket.off('deposit:updated', depositUpdateHandler);
    socket.off('voucher:used', voucherUsedHandler);
    socket.off('voucher:updated', voucherUpdatedHandler);
    socket.off('vouchers:updated', vouchersSyncedHandler);
  };
}

/**
 * Langganan realtime update voucher untuk storefront pembeli
 */
export function subscribeVouchersSocket({ onVouchersSynced, onVoucherUpdated } = {}) {
  const socket = getSocket();
  if (!socket) return () => {};

  const syncedHandler = (vouchers) => {
    if (typeof onVouchersSynced === 'function' && Array.isArray(vouchers)) {
      onVouchersSynced(vouchers);
    }
  };
  const updatedHandler = (voucher) => {
    if (typeof onVoucherUpdated === 'function' && voucher) {
      onVoucherUpdated(voucher);
    }
  };

  socket.on('vouchers:updated', syncedHandler);
  socket.on('voucher:updated', updatedHandler);
  socket.on('voucher:used', updatedHandler);

  return () => {
    socket.off('vouchers:updated', syncedHandler);
    socket.off('voucher:updated', updatedHandler);
    socket.off('voucher:used', updatedHandler);
  };
}

/**
 * Hubungkan Pembeli ke Sinyal WebSocket Privat (Pengiriman Akun & Update Status)
 * Mendukung string userKey maupun objek { userKey, userId, email, orderIds }
 */
export function subscribeUserSocket(userOrKey, { onOrderUpdated, onBanUpdated, onDepositUpdated } = {}) {
  const socket = getSocket();
  if (!socket) return () => {};

  const register = () => {
    if (userOrKey) {
      socket.emit('user:register', userOrKey);
    }
  };

  if (socket.connected) {
    register();
  } else {
    socket.once('connect', register);
  }

  const updateHandler = (order) => {
    if (typeof onOrderUpdated === 'function' && order) {
      onOrderUpdated(order);
    }
  };

  const banHandler = (banStatus) => {
    if (typeof onBanUpdated === 'function') {
      onBanUpdated(banStatus);
    }
  };

  const depositHandler = (deposit) => {
    if (typeof onDepositUpdated === 'function' && deposit) {
      onDepositUpdated(deposit);
    }
  };

  socket.on('order:user_updated', updateHandler);
  socket.on('order:user_updated_global', updateHandler);
  socket.on('order:updated', updateHandler);
  socket.on('user:ban_status_updated', banHandler);
  socket.on('deposit:user_updated', depositHandler);
  socket.on('deposit:user_updated_global', depositHandler);

  return () => {
    socket.off('order:user_updated', updateHandler);
    socket.off('order:user_updated_global', updateHandler);
    socket.off('order:updated', updateHandler);
    socket.off('user:ban_status_updated', banHandler);
    socket.off('deposit:user_updated', depositHandler);
    socket.off('deposit:user_updated_global', depositHandler);
  };
}

/**
 * Pelanggan melacak nomor pesanan spesifik via socket (Guest maupun Member)
 */
export function trackOrderSocket(orderId) {
  if (!orderId) return;
  const socket = getSocket();
  if (!socket) return;
  if (socket.connected) {
    socket.emit('order:track', orderId);
  } else {
    socket.once('connect', () => {
      socket.emit('order:track', orderId);
    });
  }
}
