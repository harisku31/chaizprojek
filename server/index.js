// ===================================================================
// CHAIZSTORE HIGH-PERFORMANCE REALTIME BACKEND SERVER
// Express.js + Socket.io (WebSocket) + Native SQLite Database
// Instant 0ms Order Chimes, Unlimited Data Capacity, Zero Browser Limits
// ===================================================================

try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch (_) {}

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import {
  getAllTransactions,
  getTransactionsByUser,
  getTransactionById,
  saveTransaction,
  updateTransaction,
  deleteTransaction,
  clearTransactions,
  getAllUsers,
  saveUser,
  deleteUser,
  getAllVisits,
  saveVisit,
  getAllActivities,
  saveActivity,
  getAllDeposits,
  getDepositsByUser,
  getDepositById,
  saveDeposit,
  updateDeposit,
  deleteDeposit,
  clearDeposits,
  verifyAdminLogin,
  verifyAdminSessionToken,
  deleteAdminSession,
  updateAdminPasswordInDb
} from './db.js';

const PORT = process.env.PORT || 3005;
const app = express();
const server = http.createServer(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '..', 'dist');

// Socket.io Realtime WebSocket Engine with unrestricted CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  },
  pingInterval: 10000,
  pingTimeout: 5000,
  maxHttpBufferSize: 2e7 // 20 MB buffer for proof image attachments
});

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve frontend static assets from dist if available
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));

  app.get('/admin', (req, res) => {
    const adminPath = join(distDir, 'admin.html');
    if (fs.existsSync(adminPath)) {
      return res.sendFile(adminPath);
    }
    res.sendFile(join(distDir, 'index.html'));
  });

  app.get('/admin.html', (req, res) => {
    const adminPath = join(distDir, 'admin.html');
    if (fs.existsSync(adminPath)) {
      return res.sendFile(adminPath);
    }
    res.status(404).send('Admin page not found');
  });
}

// Tracking connected clients
let adminSocketsCount = 0;
let userSocketsCount = 0;

io.on('connection', (socket) => {
  const clientType = socket.handshake.query.type || 'user';
  if (clientType === 'admin') {
    adminSocketsCount++;
    socket.join('admin-room');
    console.log(`⚡ [Socket.io]: Admin Connected (${socket.id}). Active Admins: ${adminSocketsCount}`);
  } else {
    userSocketsCount++;
    const userKey = socket.handshake.query.userKey;
    if (userKey) {
      socket.join(`user-${userKey}`);
      socket.join(`user-${String(userKey).toLowerCase().trim()}`);
    }
  }

  // Admin registers
  socket.on('admin:register', () => {
    socket.join('admin-room');
    console.log(`⚡ [Socket.io]: Admin Registered room (${socket.id})`);
  });

  // User registers their private channel (supports string or object with userKey, userId, email, orderIds)
  socket.on('user:register', (data) => {
    if (!data) return;
    if (typeof data === 'string') {
      const clean = data.trim();
      socket.join(`user-${clean}`);
      socket.join(`user-${clean.toLowerCase()}`);
    } else if (typeof data === 'object') {
      if (data.userKey) {
        socket.join(`user-${data.userKey}`);
        socket.join(`user-${String(data.userKey).toLowerCase().trim()}`);
      }
      if (data.userId) {
        socket.join(`user-${data.userId}`);
        socket.join(`user-${String(data.userId).toLowerCase().trim()}`);
      }
      if (data.email) {
        socket.join(`user-${String(data.email).toLowerCase().trim()}`);
      }
      if (Array.isArray(data.orderIds)) {
        data.orderIds.forEach((oid) => {
          if (oid) socket.join(`order-${oid}`);
        });
      }
    }
  });

  // Pelanggan melacak pesanan spesifik (guest & member)
  socket.on('order:track', (orderId) => {
    if (orderId) {
      socket.join(`order-${orderId}`);
    }
  });

  // Client disconnect
  socket.on('disconnect', () => {
    if (clientType === 'admin') {
      adminSocketsCount = Math.max(0, adminSocketsCount - 1);
    } else {
      userSocketsCount = Math.max(0, userSocketsCount - 1);
    }
  });
});

// ===================================================================
// REST API ROUTES
// ===================================================================

// Health & Status Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'ChaizStore Dedicated Node.js + Socket.io Server',
    uptime: process.uptime(),
    activeAdmins: adminSocketsCount,
    activeUsers: userSocketsCount,
    database: 'SQLite (Native WAL Mode)',
    timestamp: new Date().toISOString()
  });
});

// -------------------------------------------------------------------
// SECURE ADMIN AUTHENTICATION ROUTES (NATIVE SQL & CRYPTO PBKDF2)
// -------------------------------------------------------------------

// Admin Login via SQLite Database
app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username dan password admin wajib diisi!' });
    }
    const result = verifyAdminLogin(username, password);
    if (result.success) {
      res.json({
        success: true,
        token: result.token,
        admin: result.admin
      });
    } else {
      res.status(401).json({ success: false, error: result.reason || 'Kredensial tidak valid' });
    }
  } catch (err) {
    console.error('[Admin Login Error]:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan sistem pada database server' });
  }
});

// Admin Session Verification
app.post('/api/admin/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = req.body?.token || (authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token sesi tidak ditemukan' });
    }
    const session = verifyAdminSessionToken(token);
    if (session) {
      res.json({ success: true, admin: session });
    } else {
      res.status(401).json({ success: false, error: 'Sesi kedaluwarsa atau tidak valid' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal memverifikasi sesi admin' });
  }
});

// Admin Change Password & Username in SQLite Database
app.post('/api/admin/change-password', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = req.body?.token || (authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null);
    const { oldPassword, newUsername, newPassword } = req.body || {};
    if (!token) {
      return res.status(401).json({ success: false, error: 'Sesi admin tidak sah' });
    }
    const result = updateAdminPasswordInDb(token, oldPassword, newUsername, newPassword);
    if (result.success) {
      res.json({ success: true, admin: result.admin });
    } else {
      res.status(400).json({ success: false, error: result.reason });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal memperbarui kredensial di database server' });
  }
});

// Admin Logout
app.post('/api/admin/logout', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = req.body?.token || (authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null);
    if (token) {
      deleteAdminSession(token);
    }
    res.json({ success: true });
  } catch (_) {
    res.json({ success: true });
  }
});

// -------------------------------------------------------------------
// JANSPAYMENT REALTIME QRIS GATEWAY (KEY: js_c2ae56533ce1a2da9470e1e5916bd8cc67c732718d7b9c43)
// -------------------------------------------------------------------
const JANSPAYMENT_BASE_URL = 'https://janspayment.com';
const JANSPAYMENT_API_KEY = process.env.JANSPAYMENT_API_KEY || 'js_c2ae56533ce1a2da9470e1e5916bd8cc67c732718d7b9c43';

// Inisialisasi Sesi QRIS Dinamis JansPayment
app.post('/api/gateway/create-qris', async (req, res) => {
  try {
    const { orderId, amount, customerName, note } = req.body || {};
    if (!orderId || !amount) {
      return res.status(400).json({ success: false, error: 'orderId and amount are required' });
    }
    const cleanAmount = Math.max(1000, Math.round(Number(amount)));

    const jansRes = await fetch(`${JANSPAYMENT_BASE_URL}/gateaway/qris/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JANSPAYMENT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: cleanAmount,
        ref: orderId,
        note: note || `Pesanan #${orderId} ${customerName || 'ChaizStore'}`
      })
    });

    const data = await jansRes.json();
    console.log(`💳 [JansPayment]: Create QRIS Order ${orderId}: Rp ${cleanAmount} -> Result:`, data.success ? data.data.payment_id : data.message);
    res.status(jansRes.status).json(data);
  } catch (err) {
    console.error('❌ [JansPayment Create Error]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cek Status Pembayaran Realtime JansPayment
app.post('/api/gateway/check-status', async (req, res) => {
  try {
    const { payment_id, paymentId } = req.body || {};
    const pId = payment_id || paymentId;
    if (!pId) {
      return res.status(400).json({ success: false, error: 'payment_id is required' });
    }

    const jansRes = await fetch(`${JANSPAYMENT_BASE_URL}/gateaway/payment/check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JANSPAYMENT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ payment_id: pId })
    });

    const data = await jansRes.json();
    res.status(jansRes.status).json(data);
  } catch (err) {
    console.error('❌ [JansPayment Check Error]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/gateway/check-status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const jansRes = await fetch(`${JANSPAYMENT_BASE_URL}/gateaway/payment/check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JANSPAYMENT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ payment_id: paymentId })
    });
    const data = await jansRes.json();
    res.status(jansRes.status).json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------------
// MIDTRANS PAYMENT GATEWAY (PRODUCTION)
// -------------------------------------------------------------------
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || '';
const MIDTRANS_SNAP_URL = 'https://app.midtrans.com/snap/v1/transactions';

// 1. Buat Snap Token untuk QRIS / E-Wallet Otomatis
app.post('/api/midtrans/create-transaction', async (req, res) => {
  try {
    const { orderId, amount, customerName, customerEmail, customerPhone, items } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ success: false, error: 'orderId and amount are required' });
    }

    if (!MIDTRANS_SERVER_KEY) {
      return res.status(500).json({ success: false, error: 'MIDTRANS_SERVER_KEY is not configured in environment variables' });
    }

    const authHeader = 'Basic ' + Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64');

    const payload = {
      transaction_details: {
        order_id: String(orderId),
        gross_amount: Math.round(Number(amount))
      },
      customer_details: {
        first_name: customerName || 'Pelanggan ChaizStore',
        email: customerEmail && customerEmail.includes('@') ? customerEmail : 'order@chaizstore.my.id',
        phone: customerPhone || '081234567890'
      }
    };

    if (items && Array.isArray(items) && items.length > 0) {
      payload.item_details = items.map((it, idx) => ({
        id: String(it.productId || it.id || `item-${idx + 1}`).slice(0, 50),
        price: Math.round(Number(it.price || it.total || amount)),
        quantity: Number(it.qty || 1),
        name: String(it.name || 'Produk Digital').slice(0, 50)
      }));
    }

    const response = await fetch(MIDTRANS_SNAP_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [Midtrans API Error]:', data);
      return res.status(response.status).json({ success: false, error: data.error_messages || data.message || 'Midtrans error', details: data });
    }

    console.log(`✅ [Midtrans Snap Token Created]: Order ${orderId} -> Token: ${data.token}`);
    res.json({ success: true, token: data.token, redirect_url: data.redirect_url, clientKey: MIDTRANS_CLIENT_KEY });
  } catch (err) {
    console.error('❌ [Midtrans Error]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Webhook / Notification Handler dari Midtrans (Instant Callback)
app.post('/api/midtrans/notification', (req, res) => {
  try {
    const notif = req.body;
    console.log('⚡ [Midtrans Webhook Received]:', notif.order_id, notif.transaction_status);

    const orderId = notif.order_id;
    const status = notif.transaction_status;
    const fraudStatus = notif.fraud_status;

    let orderStatus = 'Menunggu Pembayaran';
    let isPaid = false;

    if (status === 'capture') {
      if (fraudStatus === 'accept') {
        orderStatus = 'Diproses';
        isPaid = true;
      }
    } else if (status === 'settlement') {
      orderStatus = 'Diproses';
      isPaid = true;
    } else if (status === 'pending') {
      orderStatus = 'Menunggu Pembayaran';
    } else if (status === 'deny' || status === 'expire' || status === 'cancel') {
      orderStatus = 'Gagal';
    }

    // Update transaksi di database SQLite
    const updated = updateTransaction(orderId, {
      status: isPaid ? 'Diproses' : orderStatus,
      paymentStatus: isPaid ? 'Lunas' : (orderStatus === 'Gagal' ? 'Gagal' : 'Menunggu'),
      paymentMethod: `Midtrans (${notif.payment_type || 'QRIS'})`,
      midtransStatus: status,
      settlementTime: notif.settlement_time || new Date().toISOString()
    });

    if (updated) {
      if (updated.userKey || updated.userId) {
        io.to(`user-${updated.userKey || updated.userId}`).emit('order:user_updated', updated);
      }
      io.to('admin-room').emit('order:updated', updated);
      if (isPaid) {
        io.to('admin-room').emit('order:incoming', {
          newTrx: updated,
          timestamp: Date.now(),
          sound: true
        });
      }
    }

    res.status(200).json({ status: 'OK', message: 'Notification processed' });
  } catch (err) {
    console.error('❌ [Midtrans Webhook Error]:', err.message);
    res.status(500).json({ status: 'Error', error: err.message });
  }
});

// -------------------------------------------------------------------
// 1. TRANSAKSI (ORDERS)
// -------------------------------------------------------------------

// Ambil semua transaksi (Khusus Admin)
app.get('/api/transactions', (req, res) => {
  try {
    const list = getAllTransactions();
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Ambil transaksi milik user tertentu (100% Isolasi Privat)
app.get('/api/transactions/user/:userKey', (req, res) => {
  try {
    const userKey = req.params.userKey;
    const list = getTransactionsByUser(userKey);
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Buat Transaksi Baru dari Checkout (Akun Premium / Steam / Roblox)
app.post('/api/transactions', (req, res) => {
  try {
    const trxData = req.body;
    if (!trxData || !trxData.productName) {
      return res.status(400).json({ success: false, error: 'Product name is required' });
    }

    const saved = saveTransaction(trxData);

    // 🚀 PANCARKAN SINYAL WEBSOCKET 0ms KE SELURUH ADMIN:
    // Memicu bel kasir "Ting-Ting!" seketika tanpa delay dan tanpa kuota!
    io.to('admin-room').emit('order:incoming', {
      newTrx: saved,
      timestamp: Date.now(),
      sound: true
    });
    // Broadcast fallback ke global socket
    io.emit('order:incoming', { newTrx: saved, timestamp: Date.now(), sound: true });
    io.emit('order:new_global', saved);

    console.log(`🔔 [Socket.io Event]: New Order Emitted: ${saved.id} (${saved.productName}) by ${saved.customerName}`);

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Transaksi (Proses / Kirim Akun / Tolak)
const handleUpdateTransaction = (req, res) => {
  try {
    const id = req.params.id || req.body.id;
    const patch = req.body;
    const updated = updateTransaction(id, patch);

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    // 1. Beritahukan ke seluruh admin
    io.to('admin-room').emit('order:updated', updated);

    // 2. Beritahukan ke pembeli di semua channel (order room, user room, email room)
    const targetRooms = new Set();
    if (updated.id) targetRooms.add(`order-${updated.id}`);
    if (updated.userKey) {
      targetRooms.add(`user-${updated.userKey}`);
      targetRooms.add(`user-${String(updated.userKey).toLowerCase().trim()}`);
    }
    if (updated.userId) {
      targetRooms.add(`user-${updated.userId}`);
      targetRooms.add(`user-${String(updated.userId).toLowerCase().trim()}`);
    }
    if (updated.userEmail && updated.userEmail !== '-') {
      targetRooms.add(`user-${String(updated.userEmail).toLowerCase().trim()}`);
    }
    if (updated.customerEmail && updated.customerEmail !== '-') {
      targetRooms.add(`user-${String(updated.customerEmail).toLowerCase().trim()}`);
    }

    targetRooms.forEach((room) => {
      io.to(room).emit('order:user_updated', updated);
    });

    // 3. Broadcast fallback ke seluruh client agar browser/tab yang terbuka langsung terupdate
    io.emit('order:updated', updated);
    io.emit('order:user_updated_global', updated);

    console.log(`⚡ [Socket.io Event]: Order ${updated.id} status updated to [${updated.status}] -> Broadcasted to rooms:`, Array.from(targetRooms));

    res.json({ success: true, data: updated, transaction: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

app.put('/api/transactions/:id', handleUpdateTransaction);
app.patch('/api/transactions/:id', handleUpdateTransaction);
app.patch('/api/transactions', handleUpdateTransaction);

// Hapus Foto Bukti Pembayaran
app.delete('/api/transactions/:id/proof', (req, res) => {
  try {
    const id = req.params.id;
    const updated = updateTransaction(id, {
      proofUrl: null,
      proofExpired: true,
      proofDeletedReason: 'Foto bukti dihapus oleh Admin'
    });
    io.to('admin-room').emit('order:updated', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Hapus Satu Transaksi
app.delete('/api/transactions/:id', (req, res) => {
  try {
    const id = req.params.id;
    deleteTransaction(id);
    io.to('admin-room').emit('order:deleted', { id });
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Bersihkan Seluruh Transaksi
app.delete('/api/transactions', (req, res) => {
  try {
    clearTransactions();
    io.to('admin-room').emit('orders:cleared');
    res.json({ success: true, message: 'All transactions cleared' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------------
// 1B. CHAIZMONEY DEPOSITS (TOP UP SALDO)
// -------------------------------------------------------------------

app.get('/api/deposits', (req, res) => {
  try {
    const list = getAllDeposits();
    res.json({ success: true, data: list, count: list.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/deposits/user/:userKey', (req, res) => {
  try {
    const list = getDepositsByUser(req.params.userKey);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/deposits', (req, res) => {
  try {
    const depData = req.body;
    if (!depData || !depData.amount) {
      return res.status(400).json({ success: false, error: 'Amount is required' });
    }
    const saved = saveDeposit(depData);

    // Emit realtime ke admin
    io.to('admin-room').emit('deposit:incoming', {
      deposit: saved,
      timestamp: Date.now(),
      sound: true
    });
    io.emit('deposit:new_global', saved);

    console.log(`💰 [Deposit Event]: New Deposit ${saved.id}: Rp ${saved.amount} by ${saved.userName}`);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const handleUpdateDeposit = (req, res) => {
  try {
    const id = req.params.id || req.body.id;
    const patch = req.body;
    const updated = updateDeposit(id, patch);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Deposit not found' });
    }

    const targetRooms = new Set();
    if (updated.id) targetRooms.add(`deposit-${updated.id}`);
    if (updated.userKey) {
      targetRooms.add(`user-${updated.userKey}`);
      targetRooms.add(`user-${String(updated.userKey).toLowerCase().trim()}`);
    }
    if (updated.userId) {
      targetRooms.add(`user-${updated.userId}`);
      targetRooms.add(`user-${String(updated.userId).toLowerCase().trim()}`);
    }
    if (updated.userEmail && updated.userEmail !== '-') {
      targetRooms.add(`user-${String(updated.userEmail).toLowerCase().trim()}`);
    }

    targetRooms.forEach((room) => {
      io.to(room).emit('deposit:user_updated', updated);
    });

    io.to('admin-room').emit('deposit:updated', updated);
    io.emit('deposit:updated', updated);
    io.emit('deposit:user_updated_global', updated);

    console.log(`💰 [Socket.io Event]: Deposit ${updated.id} status updated to [${updated.status}]`);

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

app.put('/api/deposits/:id', handleUpdateDeposit);
app.patch('/api/deposits/:id', handleUpdateDeposit);
app.patch('/api/deposits', handleUpdateDeposit);

app.delete('/api/deposits/:id', (req, res) => {
  try {
    deleteDeposit(req.params.id);
    io.to('admin-room').emit('deposit:deleted', { id: req.params.id });
    res.json({ success: true, message: 'Deposit deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------------
// 2. REGISTERED USERS (DAFTAR & STATUS PENGGUNA)
// -------------------------------------------------------------------

app.get('/api/users', (req, res) => {
  try {
    const users = getAllUsers();
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const handleSaveUser = (req, res) => {
  try {
    const user = req.body;
    if (!user) {
      return res.status(400).json({ success: false, error: 'User data is required' });
    }
    if (!user.id && !user.userId) {
      user.id = user.userKey || (user.email ? `usr_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}` : `usr_${Date.now()}`);
    }
    const saved = saveUser(user);
    io.to('admin-room').emit('user:presence_updated', saved);
    res.json({ success: true, data: saved, user: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

app.post('/api/users', handleSaveUser);
app.post('/api/auth', handleSaveUser);

app.put('/api/users/:id/ban', (req, res) => {
  try {
    const id = req.params.id;
    const banStatus = req.body;
    const user = saveUser({ id, banStatus });
    io.to('admin-room').emit('user:banned_changed', user);
    io.to(`user-${id}`).emit('user:ban_status_updated', banStatus);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    const id = req.params.id;
    deleteUser(id);
    io.to('admin-room').emit('user:deleted', { id });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------------
// 3. VISITS & ACTIVITIES
// -------------------------------------------------------------------

app.get('/api/visits', (req, res) => {
  try {
    const visits = getAllVisits();
    res.json({ success: true, count: visits.length, data: visits });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/visits', (req, res) => {
  try {
    const v = req.body;
    const saved = saveVisit(v);
    io.to('admin-room').emit('visit:recorded', saved);
    res.json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/activities', (req, res) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const acts = getAllActivities(limit);
    res.json({ success: true, count: acts.length, data: acts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/activities', (req, res) => {
  try {
    const act = req.body;
    const saved = saveActivity(act);
    io.to('admin-room').emit('activity:recorded', saved);
    res.json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------------
// 4. ONE-CLICK AUTO SYNC FROM FIREBASE RTDB
// -------------------------------------------------------------------

export async function syncFromFirebase() {
  const FIREBASE_DB_URL = 'https://chaizstore-default-rtdb.asia-southeast1.firebasedatabase.app';
  try {
    console.log('🔄 [Auto-Sync]: Checking & seeding database from Cloud Firebase...');
    const [trxRes, usersRes, visitsRes, actsRes] = await Promise.all([
      fetch(`${FIREBASE_DB_URL}/transactions.json`).catch(() => null),
      fetch(`${FIREBASE_DB_URL}/registered_users.json`).catch(() => null),
      fetch(`${FIREBASE_DB_URL}/permanent_visits.json`).catch(() => null),
      fetch(`${FIREBASE_DB_URL}/activity_logs.json`).catch(() => null)
    ]);

    if (trxRes && trxRes.ok) {
      const data = await trxRes.json();
      if (data && typeof data === 'object') {
        Object.values(data).forEach((t) => {
          if (t && t.id) saveTransaction(t);
        });
      }
    }

    if (usersRes && usersRes.ok) {
      const data = await usersRes.json();
      if (data && typeof data === 'object') {
        Object.values(data).forEach((u) => {
          if (u && (u.id || u.userId)) saveUser(u);
        });
      }
    }

    if (visitsRes && visitsRes.ok) {
      const data = await visitsRes.json();
      if (data && typeof data === 'object') {
        Object.values(data).forEach((v) => {
          if (v && (v.id || v.userId)) saveVisit(v);
        });
      }
    }

    if (actsRes && actsRes.ok) {
      const data = await actsRes.json();
      if (data && typeof data === 'object') {
        Object.values(data).forEach((a) => {
          if (a && a.id) saveActivity(a);
        });
      }
    }

    console.log('✅ [Auto-Sync]: Database fully seeded and synchronized from Cloud Firebase!');
    return true;
  } catch (err) {
    console.warn('⚠️ [Auto-Sync warning]:', err.message);
    return false;
  }
}

app.post('/api/sync/from-firebase', async (req, res) => {
  const success = await syncFromFirebase();
  res.json({ success, message: success ? 'Data synced from Firebase' : 'Sync error' });
});

// Start Server
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n======================================================`);
  console.log(`🚀 CHAIZSTORE DEDICATED BACKEND SERVER RUNNING`);
  console.log(`📡 URL: http://0.0.0.0:${PORT}`);
  console.log(`⚡ WebSocket Engine: Socket.io Active`);
  console.log(`💾 Database: SQLite High-Performance WAL Storage`);
  console.log(`======================================================\n`);

  // Seeding check on start
  if (getAllTransactions().length === 0 || getAllUsers().length === 0) {
    await syncFromFirebase();
  }
});
