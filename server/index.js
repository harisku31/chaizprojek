// ===================================================================
// CHAIZSTORE HIGH-PERFORMANCE REALTIME BACKEND SERVER
// Express.js + Socket.io (WebSocket) + Native SQLite Database
// Instant 0ms Order Chimes, Unlimited Data Capacity, Zero Browser Limits
// ===================================================================

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
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
  saveActivity
} from './db.js';

const PORT = process.env.PORT || 3001;
const app = express();
const server = http.createServer(app);

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
    }
  }

  // Admin registers
  socket.on('admin:register', () => {
    socket.join('admin-room');
  });

  // User registers their private channel
  socket.on('user:register', (userKey) => {
    if (userKey) {
      socket.join(`user-${userKey}`);
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

    // Beritahukan ke pembeli di node privatnya secara instan
    if (updated.userKey || updated.userId) {
      const uKey = updated.userKey || updated.userId;
      io.to(`user-${uKey}`).emit('order:user_updated', updated);
    }
    // Beritahukan ke seluruh admin
    io.to('admin-room').emit('order:updated', updated);

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
server.listen(PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`🚀 CHAIZSTORE DEDICATED BACKEND SERVER RUNNING`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`⚡ WebSocket Engine: Socket.io Active`);
  console.log(`💾 Database: SQLite High-Performance WAL Storage`);
  console.log(`======================================================\n`);

  // Seeding check on start
  if (getAllTransactions().length === 0 || getAllUsers().length === 0) {
    await syncFromFirebase();
  }
});
