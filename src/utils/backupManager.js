// ===================================================================
// CHAIZSTORE ADMIN BACKUP, EXPORT & RESTORE ENGINE
// Menyimpan snapshot anti-hilang (SQLite Server + Firebase + LocalStorage)
// Mendukung ekspor 4 format (.JSON, Excel .CSV, .SQL, & Cetak .PDF)
// serta Auto-Backup sebelum Reset & Pulihkan Data (Restore) 1-klik.
// ===================================================================

import { writeToFirebase, readFromFirebase, deleteFromFirebase } from './firebase';
import {
  fetchAllBackupsFromSql,
  fetchBackupDetailFromSql,
  createBackupInSql,
  restoreBackupInSql,
  deleteBackupFromSql
} from './sqlApi';
import {
  getRegisteredUsers,
  saveRegisteredUsers,
  getActivityLogs,
  saveActivityLogs,
  getPermanentVisits,
  savePermanentVisits
} from './userTracker';
import { getTransactions, saveTransactions } from './transactions';
import { getDeposits, saveDeposits } from './deposits';
import { getDatabaseProducts } from './productDatabase';
import { getStoredVouchers, saveStoredVouchers } from '../data/vouchers';

const BACKUPS_STORAGE_KEY = 'chaiz_admin_backups';
const FIREBASE_PATH_BACKUPS = 'backups';

/**
 * Kumpulkan seluruh data aktif toko saat ini untuk dibackup
 */
export function collectCurrentStoreData(override = {}) {
  const registered_users = Array.isArray(override.registered_users) ? override.registered_users : getRegisteredUsers();
  const activity_logs = Array.isArray(override.activity_logs) ? override.activity_logs : getActivityLogs();
  const permanent_visits = Array.isArray(override.permanent_visits) ? override.permanent_visits : getPermanentVisits();
  const transactions = Array.isArray(override.transactions) ? override.transactions : getTransactions();
  const deposits = Array.isArray(override.deposits) ? override.deposits : getDeposits();
  const vouchers = Array.isArray(override.vouchers) ? override.vouchers : getStoredVouchers();
  const products = Array.isArray(override.products) ? override.products : getDatabaseProducts();

  return {
    registered_users,
    activity_logs,
    permanent_visits,
    transactions,
    deposits,
    vouchers,
    products
  };
}

function computeBackupStats(data = {}) {
  const trxs = data.transactions || [];
  const deps = data.deposits || [];
  const vouchers = data.vouchers || [];
  const orderRevenue = trxs
    .filter((t) => t && t.status !== 'rejected')
    .reduce((sum, t) => sum + (Number(t.total ?? t.price) || 0), 0);
  const depositTotal = deps
    .filter((d) => d && d.status === 'approved')
    .reduce((sum, d) => sum + (Number(d.creditedAmount ?? d.amount) || 0), 0);

  return {
    usersCount: (data.registered_users || []).length,
    activitiesCount: (data.activity_logs || []).length,
    visitsCount: (data.permanent_visits || []).length,
    ordersCount: trxs.length,
    depositsCount: deps.length,
    vouchersCount: vouchers.length,
    usedVouchersCount: vouchers.filter((v) => v && v.isUsed).length,
    productsCount: (data.products || []).length,
    orderRevenue,
    depositTotal
  };
}

/**
 * Hapus lampiran base64 berukuran besar dari salinan lokal agar tidak memenuhi kuota localStorage
 */
function stripHeavyMediaForLocalCache(data) {
  const cleanTrx = (data.transactions || []).map((t) => ({
    ...t,
    proofUrl: t?.proofUrl && String(t.proofUrl).length > 500 ? null : t?.proofUrl,
    adminProofUrl: t?.adminProofUrl && String(t.adminProofUrl).length > 500 ? null : t?.adminProofUrl
  }));
  const cleanDep = (data.deposits || []).map((d) => ({
    ...d,
    proofImage: d?.proofImage && String(d.proofImage).length > 500 ? null : d?.proofImage,
    proofUrl: d?.proofUrl && String(d.proofUrl).length > 500 ? null : d?.proofUrl
  }));
  return { ...data, transactions: cleanTrx, deposits: cleanDep };
}

export function getLocalBackups() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BACKUPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalBackups(list) {
  if (typeof window === 'undefined') return;
  const trimmed = (list || []).slice(0, 20);
  try {
    localStorage.setItem(BACKUPS_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    try {
      const compact = trimmed.slice(0, 10).map((b, idx) =>
        idx > 1 && b.data ? { ...b, data: stripHeavyMediaForLocalCache(b.data) } : b
      );
      localStorage.setItem(BACKUPS_STORAGE_KEY, JSON.stringify(compact));
    } catch {
      try {
        const metaOnly = trimmed.slice(0, 5).map(({ data, ...meta }) => meta);
        localStorage.setItem(BACKUPS_STORAGE_KEY, JSON.stringify(metaOnly));
      } catch {}
    }
  }
}

/**
 * Buat & simpan Snapshot Backup ke LocalStorage, Firebase Cloud, dan SQLite Server
 */
export async function createAndSaveBackupSnapshot({
  label = 'Backup Manual Admin',
  reason = 'manual',
  createdBy = 'Admin ChaizStore',
  overrideData = {}
} = {}) {
  const data = collectCurrentStoreData(overrideData);
  const stats = computeBackupStats(data);
  const now = new Date();
  const id = `BKP-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  const snapshot = {
    id,
    label,
    reason,
    createdBy,
    createdAt: now.toISOString(),
    stats,
    data
  };

  // 1. Simpan di localStorage (prioritas kecepatan & offline)
  const localCacheSnapshot = {
    ...snapshot,
    data: stripHeavyMediaForLocalCache(data)
  };
  const existing = getLocalBackups();
  saveLocalBackups([localCacheSnapshot, ...existing.filter((b) => b.id !== id)]);

  // 2. Simpan di Firebase RTDB & SQLite Server (paralel agar tetap ada walau browser di-clear / data direset)
  await Promise.all([
    writeToFirebase(`${FIREBASE_PATH_BACKUPS}/${id}`, localCacheSnapshot).catch(() => {}),
    createBackupInSql(snapshot).catch(() => {})
  ]);

  return snapshot;
}

/**
 * Sinkronkan daftar backup snapshot dari SQLite Server + Firebase Cloud + LocalStorage
 */
export async function syncBackupsFromCloud() {
  const local = getLocalBackups();
  const [sqlMeta, fbData] = await Promise.all([
    fetchAllBackupsFromSql().catch(() => null),
    readFromFirebase(FIREBASE_PATH_BACKUPS).catch(() => undefined)
  ]);

  const map = new Map();
  local.forEach((b) => b && b.id && map.set(b.id, b));

  if (Array.isArray(sqlMeta)) {
    sqlMeta.forEach((sb) => {
      if (!sb || !sb.id) return;
      const prev = map.get(sb.id);
      map.set(sb.id, { ...sb, data: prev?.data || sb.data || null, hasSqlCopy: true });
    });
  }

  if (fbData && typeof fbData === 'object') {
    const fbList = Array.isArray(fbData) ? fbData.filter(Boolean) : Object.values(fbData).filter(Boolean);
    fbList.forEach((fb) => {
      if (!fb || !fb.id) return;
      const prev = map.get(fb.id);
      map.set(fb.id, {
        ...fb,
        data: fb.data || prev?.data || null,
        hasSqlCopy: prev?.hasSqlCopy || false,
        hasCloudCopy: true
      });
    });
  }

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
  saveLocalBackups(merged);
  return merged;
}

/**
 * Ambil payload lengkap dari satu snapshot (dari lokal, SQLite, atau Firebase)
 */
export async function resolveFullBackupSnapshot(backupOrId) {
  const id = typeof backupOrId === 'string' ? backupOrId : backupOrId?.id;
  if (typeof backupOrId === 'object' && backupOrId?.data && Object.keys(backupOrId.data).length > 0) {
    // Jika ada di SQLite dengan bukti foto penuh, coba tarik detail penuh
    const sqlFull = id ? await fetchBackupDetailFromSql(id).catch(() => null) : null;
    if (sqlFull?.data) return sqlFull;
    return backupOrId;
  }

  if (id) {
    const sqlFull = await fetchBackupDetailFromSql(id).catch(() => null);
    if (sqlFull?.data) return sqlFull;
    const fbFull = await readFromFirebase(`${FIREBASE_PATH_BACKUPS}/${id}`).catch(() => null);
    if (fbFull?.data) return fbFull;
    const localFound = getLocalBackups().find((b) => b.id === id);
    if (localFound?.data) return localFound;
  }
  return null;
}

/**
 * Pulihkan seluruh data dari Backup Snapshot / File JSON ke Store, Firebase & SQLite
 */
export async function restoreFromBackupPayload(rawPayload) {
  const data = rawPayload?.data || rawPayload?.tables || rawPayload || {};
  const counts = {
    users: 0,
    activities: 0,
    visits: 0,
    transactions: 0,
    deposits: 0,
    vouchers: 0,
    products: 0
  };

  if (Array.isArray(data.registered_users)) {
    saveRegisteredUsers(data.registered_users);
    counts.users = data.registered_users.length;
    await Promise.all(
      data.registered_users
        .filter((u) => u && (u.id || u.userId))
        .map((u) => writeToFirebase(`registered_users/${u.id || u.userId}`, u).catch(() => {}))
    );
  }

  if (Array.isArray(data.activity_logs)) {
    saveActivityLogs(data.activity_logs);
    counts.activities = data.activity_logs.length;
    await Promise.all(
      data.activity_logs
        .slice(0, 150)
        .filter((a) => a && a.id)
        .map((a) => writeToFirebase(`activity_logs/${a.id}`, a).catch(() => {}))
    );
  }

  if (Array.isArray(data.permanent_visits)) {
    savePermanentVisits(data.permanent_visits);
    counts.visits = data.permanent_visits.length;
    await Promise.all(
      data.permanent_visits
        .filter((v) => v && (v.userId || v.id))
        .map((v) => writeToFirebase(`permanent_visits/${v.userId || v.id}`, v).catch(() => {}))
    );
  }

  if (Array.isArray(data.transactions)) {
    saveTransactions(data.transactions, { broadcast: true });
    counts.transactions = data.transactions.length;
    await Promise.all(
      data.transactions
        .filter((t) => t && t.id)
        .map((t) => writeToFirebase(`transactions/${t.id}`, t).catch(() => {}))
    );
  }

  if (Array.isArray(data.deposits)) {
    saveDeposits(data.deposits);
    counts.deposits = data.deposits.length;
    await Promise.all(
      data.deposits
        .filter((d) => d && d.id)
        .map((d) => writeToFirebase(`deposits/${d.id}`, d).catch(() => {}))
    );
  }

  if (Array.isArray(data.vouchers)) {
    saveStoredVouchers(data.vouchers, { broadcast: true, reason: 'BACKUP_RESTORED' });
    counts.vouchers = data.vouchers.length;
    await Promise.all(
      data.vouchers
        .filter((v) => v && v.id)
        .map((v) => writeToFirebase(`vouchers/${v.id}`, v).catch(() => {}))
    );
  }

  if (Array.isArray(data.products) && data.products.length > 0) {
    try {
      localStorage.setItem('chaiz_products_database', JSON.stringify(data.products));
      writeToFirebase('products', data.products).catch(() => {});
      counts.products = data.products.length;
    } catch {}
  }

  await restoreBackupInSql(data).catch(() => {});
  return counts;
}

export async function deleteBackupSnapshot(id) {
  if (!id) return false;
  const remaining = getLocalBackups().filter((b) => b.id !== id);
  saveLocalBackups(remaining);
  await Promise.all([
    deleteFromFirebase(`${FIREBASE_PATH_BACKUPS}/${id}`).catch(() => {}),
    deleteBackupFromSql(id).catch(() => {})
  ]);
  return true;
}

// ===================================================================
// EXPORT / DOWNLOAD 4 FORMAT (.JSON, EXCEL .CSV, .SQL, & CETAK .PDF)
// ===================================================================

function triggerFileDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getDateTag() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

export function downloadBackupJson(snapshotOrData) {
  const data = snapshotOrData?.data || snapshotOrData?.tables || collectCurrentStoreData(snapshotOrData || {});
  const payload = {
    meta: {
      system: 'ChaizStore Relational Database Backup',
      exportedAt: new Date().toISOString(),
      label: snapshotOrData?.label || 'Full Store Backup',
      stats: computeBackupStats(data)
    },
    data
  };
  triggerFileDownload(
    JSON.stringify(payload, null, 2),
    `chaizstore_backup_${getDateTag()}.json`,
    'application/json;charset=utf-8'
  );
}

export function downloadBackupExcelCsv(snapshotOrData) {
  const data = snapshotOrData?.data || snapshotOrData?.tables || collectCurrentStoreData(snapshotOrData || {});
  const sections = [
    {
      title: 'LAPORAN TRANSAKSI PESANAN',
      rows: (data.transactions || []).map((t) => ({
        ID_Pesanan: t.id || '-',
        Tanggal: t.createdAt || '-',
        Nama_Pelanggan: t.customerName || '-',
        Email: t.customerEmail || t.userEmail || '-',
        WhatsApp: t.customerPhone || '-',
        Produk: t.productName || '-',
        Durasi: t.productDuration || '-',
        Total_Rp: Number(t.total ?? t.price) || 0,
        Voucher: t.voucherCode || '-',
        Diskon_Rp: Number(t.voucherDiscount) || 0,
        Metode_Bayar: t.paymentMethod || '-',
        Status: t.status || '-'
      }))
    },
    {
      title: 'LAPORAN DEPOSIT CHAIZMONEY',
      rows: (data.deposits || []).map((d) => ({
        ID_Deposit: d.id || '-',
        Tanggal: d.createdAt || '-',
        Pengguna: d.userName || '-',
        Email: d.userEmail || '-',
        Nominal_Rp: Number(d.creditedAmount ?? d.amount) || 0,
        Metode: d.paymentMethod || '-',
        Status: d.status || '-'
      }))
    },
    {
      title: 'DAFTAR PENGGUNA TERDAFTAR',
      rows: (data.registered_users || []).map((u) => ({
        ID_User: u.id || '-',
        Nama: u.name || '-',
        Email: u.email || '-',
        Sesi: u.sessionStatus || '-',
        OS: u.os || '-',
        Browser: u.browser || '-',
        Login_Count: Number(u.loginCount) || 1,
        Banned: u.banStatus?.isBanned ? 'Ya' : 'Tidak',
        Terakhir_Aktif: u.lastActiveTime || u.createdAt || '-'
      }))
    },
    {
      title: 'GUDANG VOUCHER',
      rows: (data.vouchers || []).map((v) => ({
        Kode: v.code || '-',
        Nama_Promo: v.name || '-',
        Diskon_Rp: Number(v.discountAmount) || 0,
        Status: v.isUsed ? 'Telah Hangus Dipakai' : v.isActive ? 'Aktif' : 'Nonaktif',
        Dipakai_Oleh: v.usedBy || '-',
        Waktu_Dipakai: v.usedAt || '-',
        No_Pesanan: v.usedOrder || '-'
      }))
    }
  ];

  const lines = [];
  sections.forEach((sec) => {
    lines.push(`"=== ${sec.title} (${sec.rows.length} baris) ==="`);
    if (sec.rows.length === 0) {
      lines.push('"Tidak ada data"');
    } else {
      const headers = Object.keys(sec.rows[0]);
      lines.push(headers.join(';'));
      sec.rows.forEach((row) => {
        lines.push(
          headers
            .map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`)
            .join(';')
        );
      });
    }
    lines.push('');
  });

  triggerFileDownload(
    '\uFEFF' + lines.join('\n'),
    `chaizstore_excel_backup_${getDateTag()}.csv`,
    'text/csv;charset=utf-8;'
  );
}

function sqlVal(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

export function downloadBackupSql(snapshotOrData) {
  const data = snapshotOrData?.data || snapshotOrData?.tables || collectCurrentStoreData(snapshotOrData || {});
  const nowStr = new Date().toLocaleString('id-ID');
  let sql = `-- ===================================================================\n`;
  sql += `-- CHAIZSTORE COMPLETE DATABASE SQL BACKUP DUMP\n`;
  sql += `-- Diekspor pada: ${nowStr}\n`;
  sql += `-- ===================================================================\n\n`;

  const tableEntries = [
    { name: 'registered_users', rows: data.registered_users || [] },
    { name: 'transactions', rows: data.transactions || [] },
    { name: 'deposits', rows: data.deposits || [] },
    { name: 'vouchers', rows: data.vouchers || [] },
    { name: 'activity_logs', rows: data.activity_logs || [] },
    { name: 'permanent_visits', rows: data.permanent_visits || [] }
  ];

  tableEntries.forEach(({ name, rows }) => {
    sql += `-- Tabel: ${name} (${rows.length} baris)\n`;
    rows.forEach((row) => {
      if (!row || typeof row !== 'object') return;
      const cols = Object.keys(row);
      if (cols.length === 0) return;
      const values = cols.map((c) => sqlVal(row[c]));
      sql += `INSERT INTO \`${name}\` (\`${cols.join('`, `')}\`) VALUES (${values.join(', ')});\n`;
    });
    sql += `\n`;
  });

  triggerFileDownload(sql, `chaizstore_backup_${getDateTag()}.sql`, 'application/sql;charset=utf-8');
}

export function openPrintablePdfReport(snapshotOrData) {
  const data = snapshotOrData?.data || snapshotOrData?.tables || collectCurrentStoreData(snapshotOrData || {});
  const stats = computeBackupStats(data);
  const trxs = (data.transactions || []).slice(0, 120);
  const users = (data.registered_users || []).slice(0, 120);
  const vouchers = data.vouchers || [];
  const win = window.open('', '_blank');
  if (!win) return false;

  const esc = (s) =>
    String(s ?? '-')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Laporan Backup Data & Penghasilan ChaizStore</title>
  <style>
    @media print { .no-print { display: none !important; } body { margin: 0; padding: 12mm; } }
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 28px; color: #0f172a; background: #fff; }
    .header { border-bottom: 3px solid #0284c7; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { margin: 0; font-size: 20px; color: #0369a1; }
    .header p { margin: 4px 0 0; color: #64748b; font-size: 12px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 22px; }
    .kpi { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #f8fafc; }
    .kpi small { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; display: block; }
    .kpi strong { font-size: 16px; color: #0f172a; margin-top: 4px; display: block; }
    h2 { font-size: 15px; border-left: 4px solid #0284c7; padding-left: 8px; margin: 22px 0 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-bottom: 18px; }
    th { background: #0f172a; color: #fff; text-align: left; padding: 7px 9px; }
    td { padding: 7px 9px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f8fafc; }
    .btn-print { background: #0284c7; color: #fff; border: none; padding: 10px 18px; border-radius: 6px; font-weight: 700; cursor: pointer; }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:right;margin-bottom:14px;">
    <button class="btn-print" onclick="window.print()">Cetak / Simpan sebagai PDF</button>
  </div>
  <div class="header">
    <div>
      <h1>CHAIZSTORE — LAPORAN BACKUP DATA & PENGHASILAN</h1>
      <p>Diekspor: ${esc(new Date().toLocaleString('id-ID'))}</p>
    </div>
    <div><strong>${stats.ordersCount} Transaksi • ${stats.usersCount} Pengguna</strong></div>
  </div>
  <div class="kpis">
    <div class="kpi"><small>Penghasilan Pesanan</small><strong>Rp ${stats.orderRevenue.toLocaleString('id-ID')}</strong></div>
    <div class="kpi"><small>Deposit Disetujui</small><strong>Rp ${stats.depositTotal.toLocaleString('id-ID')}</strong></div>
    <div class="kpi"><small>Total Pengguna / Aktivitas</small><strong>${stats.usersCount} User / ${stats.activitiesCount} Aksi</strong></div>
    <div class="kpi"><small>Voucher (Aktif / Hangus)</small><strong>${stats.vouchersCount - stats.usedVouchersCount} Aktif / ${stats.usedVouchersCount} Hangus</strong></div>
  </div>
  <h2>1. Data Transaksi Pesanan (${(data.transactions || []).length})</h2>
  <table>
    <thead><tr><th>ID</th><th>Pelanggan</th><th>Produk</th><th>Voucher</th><th>Total</th><th>Status</th></tr></thead>
    <tbody>
      ${trxs.length === 0 ? '<tr><td colspan="6" style="text-align:center;">Belum ada transaksi</td></tr>' : trxs.map((t) => `
        <tr>
          <td>${esc(t.id)}</td>
          <td>${esc(t.customerName)} (${esc(t.customerEmail)})</td>
          <td>${esc(t.productName)}</td>
          <td>${esc(t.voucherCode || '-')}</td>
          <td>Rp ${(Number(t.total ?? t.price) || 0).toLocaleString('id-ID')}</td>
          <td>${esc(t.status)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <h2>2. Pengguna Terdaftar (${(data.registered_users || []).length})</h2>
  <table>
    <thead><tr><th>Nama</th><th>Email</th><th>Sesi</th><th>Perangkat</th><th>Login</th></tr></thead>
    <tbody>
      ${users.length === 0 ? '<tr><td colspan="5" style="text-align:center;">Belum ada pengguna</td></tr>' : users.map((u) => `
        <tr>
          <td>${esc(u.name)}</td>
          <td>${esc(u.email)}</td>
          <td>${esc(u.sessionStatus)}</td>
          <td>${esc(u.os)} (${esc(u.browser)})</td>
          <td>${esc(u.loginCount || 1)}x</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <h2>3. Gudang Voucher (${vouchers.length})</h2>
  <table>
    <thead><tr><th>Kode</th><th>Promo</th><th>Diskon</th><th>Status</th><th>Dipakai Oleh</th></tr></thead>
    <tbody>
      ${vouchers.length === 0 ? '<tr><td colspan="5" style="text-align:center;">Belum ada voucher</td></tr>' : vouchers.map((v) => `
        <tr>
          <td><strong>${esc(v.code)}</strong></td>
          <td>${esc(v.name)}</td>
          <td>Rp ${(Number(v.discountAmount) || 0).toLocaleString('id-ID')}</td>
          <td>${v.isUsed ? 'Telah Hangus Dipakai' : v.isActive ? 'Aktif' : 'Nonaktif'}</td>
          <td>${esc(v.usedBy || '-')}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <script>setTimeout(() => { try { window.print(); } catch(e){} }, 350);</script>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}

export function parseUploadedBackupJson(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        const data = parsed.data || parsed.tables || parsed;
        if (!data || typeof data !== 'object') {
          return reject(new Error('Format file backup JSON tidak valid.'));
        }
        const hasKnownKey = ['registered_users', 'transactions', 'activity_logs', 'deposits', 'vouchers', 'permanent_visits'].some((k) =>
          Array.isArray(data[k])
        );
        if (!hasKnownKey) {
          return reject(new Error('File JSON tidak berisi tabel data ChaizStore yang dikenali.'));
        }
        resolve(data);
      } catch (err) {
        reject(new Error('Gagal membaca file JSON: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file dari perangkat.'));
    reader.readAsText(file);
  });
}
