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
  onBanChanged
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

  socket.on('order:incoming', incomingHandler);
  socket.on('order:updated', updateHandler);
  socket.on('orders:cleared', clearHandler);
  socket.on('user:presence_updated', presenceHandler);
  socket.on('user:banned_changed', banHandler);

  return () => {
    socket.off('order:incoming', incomingHandler);
    socket.off('order:updated', updateHandler);
    socket.off('orders:cleared', clearHandler);
    socket.off('user:presence_updated', presenceHandler);
    socket.off('user:banned_changed', banHandler);
  };
}

/**
 * Hubungkan Pembeli ke Sinyal WebSocket Privat (Pengiriman Akun & Update Status)
 */
export function subscribeUserSocket(userKey, { onOrderUpdated, onBanUpdated }) {
  if (!userKey) return () => {};
  const socket = getSocket();
  if (!socket) return () => {};

  const register = () => {
    socket.emit('user:register', userKey);
  };

  if (socket.connected) {
    register();
  } else {
    socket.once('connect', register);
  }

  const updateHandler = (order) => {
    if (typeof onOrderUpdated === 'function') {
      onOrderUpdated(order);
    }
  };

  const banHandler = (banStatus) => {
    if (typeof onBanUpdated === 'function') {
      onBanUpdated(banStatus);
    }
  };

  socket.on('order:user_updated', updateHandler);
  socket.on('user:ban_status_updated', banHandler);

  return () => {
    socket.off('order:user_updated', updateHandler);
    socket.off('user:ban_status_updated', banHandler);
  };
}
