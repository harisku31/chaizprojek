import React, { useState, useEffect, useRef } from 'react';
import {
  getOrderChat,
  sendCustomerMessage,
  sendAdminMessage,
  grantCustomerChatPermission,
  markOrderChatAsRead,
  getCustomerCooldownSeconds,
  formatCooldownTimer,
  subscribeToOrderChat
} from '../utils/orderChat';

export default function OrderChatModal({
  isOpen,
  onClose,
  order,
  role = 'customer', // 'customer' | 'admin'
  onShowToast,
  adminSession = null
}) {
  if (!isOpen || !order) return null;

  const orderId = order.id;
  const [chat, setChat] = useState(() => getOrderChat(orderId, order));
  const [messageText, setMessageText] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(() =>
    getCustomerCooldownSeconds(getOrderChat(orderId, order))
  );
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Subscribe to realtime chat updates
  useEffect(() => {
    const unsub = subscribeToOrderChat(orderId, (updatedChat) => {
      if (updatedChat) {
        setChat({ ...updatedChat });
        setCooldownSeconds(getCustomerCooldownSeconds(updatedChat));
      }
    });

    // Mark as read when opened
    markOrderChatAsRead(orderId, role);

    return () => unsub();
  }, [orderId, role]);

  // Live timer for 5-minute cooldown countdown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          // Re-fetch chat state to reset cooldown
          const fresh = getOrderChat(orderId, order);
          setChat(fresh);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownSeconds, orderId, order]);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages?.length]);

  // Handle Send Message
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!messageText.trim()) return;

    if (role === 'customer') {
      const res = sendCustomerMessage(orderId, messageText, {
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        productName: order.productName
      });

      if (!res.success && res.error === 'COOLDOWN_ACTIVE') {
        onShowToast?.(
          `Batas chat tercapai! Harap tunggu ${formatCooldownTimer(res.remainingSeconds)} atau tunggu balasan Admin.`,
          'fa-clock text-warning'
        );
        return;
      }

      setChat({ ...res.chat });
      setCooldownSeconds(getCustomerCooldownSeconds(res.chat));
      setMessageText('');

      if (res.isRateLimitedNow) {
        onShowToast?.(
          'Anda telah mengirim 2 pesan berturut-turut. Jeda 5 menit aktif sampai Admin membalas.',
          'fa-hourglass-half text-warning'
        );
      }
    } else {
      // Role Admin
      const adminName = adminSession?.name || 'Admin ChaizStore';
      const res = sendAdminMessage(orderId, messageText, adminName);
      setChat({ ...res.chat });
      setCooldownSeconds(0); // Cooldown pelanggan langsung terhapus saat admin membalas!
      setMessageText('');
      onShowToast?.('Pesan terkirim! Batas 5 menit pelanggan otomatis dibuka.', 'fa-paper-plane text-success');
    }
  };

  // Handle Admin Grant Permission (Izin Khusus)
  const handleGrantPermission = () => {
    if (role !== 'admin') return;
    const res = grantCustomerChatPermission(orderId);
    setChat({ ...res.chat });
    setCooldownSeconds(0);
    onShowToast?.('Izin khusus diberikan! Cooldown 5 menit pelanggan berhasil dihapus.', 'fa-unlock text-success');
  };

  // Quick Preset Replies for Admin
  const handleApplyPreset = (text) => {
    setMessageText(text);
    inputRef.current?.focus();
  };

  const isCustomerRateLimited = role === 'customer' && cooldownSeconds > 0;

  return (
    <div className="order-chat-modal-overlay active" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="order-chat-modal-box">
        {/* WhatsApp-Style Header */}
        <div className="order-chat-header">
          <div className="order-chat-header-left">
            <button
              type="button"
              className="btn-chat-back"
              onClick={onClose}
              title="Tutup Chat"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </button>

            <div className="chat-avatar-wrap">
              {role === 'customer' ? (
                <div className="chat-avatar-admin">
                  <i className="fa-solid fa-headset"></i>
                  <span className="chat-online-dot"></span>
                </div>
              ) : (
                <div className="chat-avatar-user">
                  <i className="fa-solid fa-user"></i>
                  <span className="chat-online-dot"></span>
                </div>
              )}
            </div>

            <div className="chat-header-info">
              {role === 'customer' ? (
                <>
                  <div className="chat-partner-name">
                    <span>Admin ChaizStore</span>
                    <i className="fa-solid fa-circle-check text-cyan badge-verified" title="Official Store Support"></i>
                  </div>
                  <span className="chat-status-sub">
                    <span className="live-pulse"></span> Online &bull; Pesanan #{order.id}
                  </span>
                </>
              ) : (
                <>
                  <div className="chat-partner-name">
                    <span>{order.customerName || 'Pelanggan'}</span>
                    <span className="chat-email-badge">{order.customerEmail || '-'}</span>
                  </div>
                  <span className="chat-status-sub">
                    {order.customerPhone ? `WA: ${order.customerPhone} &bull; ` : ''}
                    #{order.id} &bull; {order.productName}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="order-chat-header-actions">
            {/* Admin Special Permission Button */}
            {role === 'admin' && (
              <button
                type="button"
                className={`btn-grant-permission ${cooldownSeconds > 0 ? 'highlight-pulse' : ''}`}
                onClick={handleGrantPermission}
                title="Hapus jeda 5 menit pelanggan agar bisa chat sekarang"
              >
                <i className="fa-solid fa-key"></i>
                <span>{cooldownSeconds > 0 ? `Buka Kunci (${formatCooldownTimer(cooldownSeconds)})` : 'Izin Khusus Chat'}</span>
              </button>
            )}

            <button
              type="button"
              className="btn-chat-close"
              onClick={onClose}
              aria-label="Tutup"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* Product & Order Context Bar */}
        <div className="order-chat-context-bar">
          <div className="context-item">
            <i className="fa-solid fa-box text-warning"></i>
            <span>Produk: <strong>{order.productName}</strong></span>
          </div>
          <div className="context-item">
            <i className="fa-solid fa-layer-group text-cyan"></i>
            <span>Durasi: <strong>{order.productDuration || 'Reguler'}</strong></span>
          </div>
          <div className="context-item">
            <span className={`chat-order-status-tag ${order.status === 'completed' ? 'tag-completed' : 'tag-processing'}`}>
              <i className={`fa-solid ${order.status === 'completed' ? 'fa-circle-check' : 'fa-spinner fa-spin'}`}></i>
              {order.status === 'completed' ? 'Selesai / Terkirim' : 'Sedang Diproses'}
            </span>
          </div>
        </div>

        {/* WhatsApp-Style Messages Container */}
        <div className="order-chat-messages-container">
          <div className="chat-date-divider">
            <span>Hari ini &bull; Live Support ChaizStore</span>
          </div>

          {chat?.messages?.map((msg) => {
            if (msg.sender === 'system') {
              return (
                <div key={msg.id} className="chat-bubble-system">
                  <i className="fa-solid fa-circle-info"></i>
                  <span>{msg.text}</span>
                </div>
              );
            }

            const isOwn = (role === 'customer' && msg.sender === 'customer') || (role === 'admin' && msg.sender === 'admin');
            const timeStr = msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div
                key={msg.id}
                className={`chat-bubble-row ${isOwn ? 'row-own' : 'row-other'}`}
              >
                <div className={`chat-bubble ${isOwn ? 'bubble-own' : 'bubble-other'}`}>
                  <div className="bubble-sender-name">
                    {msg.sender === 'admin' ? (
                      <span className="sender-admin-tag">
                        <i className="fa-solid fa-headset"></i> {msg.senderName || 'Admin ChaizStore'}
                      </span>
                    ) : (
                      <span className="sender-customer-tag">
                        <i className="fa-solid fa-user"></i> {msg.senderName || 'Pelanggan'}
                      </span>
                    )}
                  </div>

                  <div className="bubble-text">{msg.text}</div>

                  <div className="bubble-meta">
                    <span className="bubble-time">{timeStr}</span>
                    {isOwn && (
                      <span className="bubble-ticks">
                        <i className="fa-solid fa-check-double text-cyan"></i>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Status Pembatasan / Cooldown Notice */}
        {role === 'customer' ? (
          isCustomerRateLimited ? (
            <div className="chat-cooldown-notice-bar">
              <i className="fa-solid fa-hourglass-half fa-spin text-warning"></i>
              <div>
                <strong>Batas 2 Pesan Tercapai: Tunggu {formatCooldownTimer(cooldownSeconds)}</strong>
                <p>
                  Untuk kenyamanan bersama, silakan tunggu jeda 5 menit atau tunggu balasan Admin. Batas waktu ini akan <strong>otomatis terhapus</strong> begitu Admin membalas!
                </p>
              </div>
            </div>
          ) : (
            <div className="chat-limit-hint-bar">
              <i className="fa-solid fa-shield-halved text-cyan"></i>
              <span>
                Sisa pesan Anda: <strong>{Math.max(0, 2 - (chat?.consecutiveCustomerMsgs || 0))}/2 pesan</strong> sebelum jeda 5 menit (otomatis reset jika Admin membalas).
              </span>
            </div>
          )
        ) : (
          /* Role Admin Notice */
          <div className="chat-admin-status-bar">
            {cooldownSeconds > 0 ? (
              <div className="admin-status-cooldown-active">
                <i className="fa-solid fa-clock-rotate-left text-warning"></i>
                <span>Pelanggan sedang dalam cooldown 5 menit (Sisa {formatCooldownTimer(cooldownSeconds)}). <strong>Ketik balasan untuk otomatis menghapus jeda ini.</strong></span>
              </div>
            ) : (
              <div className="admin-status-ready">
                <i className="fa-solid fa-circle-check text-emerald"></i>
                <span>Pelanggan diizinkan mengirim pesan (Sisa limit pesan: {Math.max(0, 2 - (chat?.consecutiveCustomerMsgs || 0))}/2).</span>
              </div>
            )}
          </div>
        )}

        {/* Admin Quick Preset Buttons */}
        {role === 'admin' && (
          <div className="admin-chat-presets-strip">
            <span className="presets-label">Balasan Cepat:</span>
            <button
              type="button"
              className="btn-chat-preset"
              onClick={() => handleApplyPreset('Halo kak, pesanan sedang kami proses. Mohon tunggu 1-3 menit ya!')}
            >
              + Sedang Diproses
            </button>
            <button
              type="button"
              className="btn-chat-preset"
              onClick={() => handleApplyPreset('Akun sudah berhasil diaktifkan langsung ke email Anda! Silakan cek inbox/spam.')}
            >
              + Akun Aktif
            </button>
            <button
              type="button"
              className="btn-chat-preset"
              onClick={() => handleApplyPreset('Halo kak, ada yang bisa kami bantu lagi mengenai akun ini?')}
            >
              + Tanya Kendala
            </button>
          </div>
        )}

        {/* WhatsApp-Style Input Area */}
        <form className="order-chat-input-area" onSubmit={handleSendMessage}>
          <div className="input-wrap">
            <input
              ref={inputRef}
              type="text"
              className="chat-text-input"
              placeholder={
                isCustomerRateLimited
                  ? `Jeda 5 menit aktif (${formatCooldownTimer(cooldownSeconds)} tersisa)...`
                  : role === 'customer'
                  ? 'Ketik pesan untuk Admin ChaizStore...'
                  : `Ketik balasan untuk ${order.customerName || 'Pelanggan'}...`
              }
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={isCustomerRateLimited}
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn-chat-send"
            disabled={!messageText.trim() || isCustomerRateLimited}
            title={isCustomerRateLimited ? 'Harap tunggu batas jeda 5 menit' : 'Kirim Pesan'}
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </form>
      </div>
    </div>
  );
}
