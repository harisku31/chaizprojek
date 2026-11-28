// ===================================================================
// CHAIZSTORE MULTI-FORMAT DATABASE BACKUP UTILITY
// Exporting database to .JSON, Excel (.CSV), Printable (.PDF), and .SQL
// ===================================================================

import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'server', 'data', 'chaizstore.db');
const outputDir = join(__dirname, '..', 'backup_data');

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

if (!existsSync(dbPath)) {
  console.error(`[ERROR] Database tidak ditemukan di: ${dbPath}`);
  process.exit(1);
}

const db = new DatabaseSync(dbPath);
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

console.log('====================================================');
console.log('   CHAIZSTORE DATABASE BACKUP SYSTEM                ');
console.log('====================================================');
console.log(`[1] Membaca database SQLite: ${dbPath}`);

// 1. Ekstrak Semua Tabel
const tablesQuery = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
const tables = tablesQuery.all().map(t => t.name);

console.log(`[2] Ditemukan ${tables.length} tabel:`, tables.join(', '));

const allData = {};
for (const table of tables) {
  try {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    allData[table] = rows;
  } catch (err) {
    allData[table] = [];
  }
}

// -------------------------------------------------------------------
// FORMAT 1: BACKUP .JSON
// -------------------------------------------------------------------
const jsonFilename = `chaizstore_backup_${timestamp}.json`;
const jsonPath = join(outputDir, jsonFilename);
writeFileSync(jsonPath, JSON.stringify({
  exportedAt: new Date().toISOString(),
  system: 'ChaizStore Relational Database',
  databaseEngine: 'SQLite WAL Mode',
  tables: allData
}, null, 2), 'utf8');
console.log(`[SUCCESS] Backup .JSON selesai: backup_data/${jsonFilename}`);

// -------------------------------------------------------------------
// FORMAT 2: BACKUP EXCEL / CSV (.csv)
// -------------------------------------------------------------------
for (const table of tables) {
  const rows = allData[table];
  if (!rows || rows.length === 0) continue;

  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(';'),
    ...rows.map(row => headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '""';
      const strVal = String(val).replace(/"/g, '""');
      return `"${strVal}"`;
    }).join(';'))
  ];

  const csvFilename = `chaizstore_${table}_${timestamp}.csv`;
  const csvPath = join(outputDir, csvFilename);
  writeFileSync(csvPath, '\uFEFF' + csvLines.join('\n'), 'utf8');
  console.log(`[SUCCESS] Backup Excel/CSV (${table}): backup_data/${csvFilename}`);
}

// -------------------------------------------------------------------
// FORMAT 3: BACKUP .SQL (DDL & INSERT DML)
// -------------------------------------------------------------------
const sqlFilename = `chaizstore_backup_${timestamp}.sql`;
const sqlPath = join(outputDir, sqlFilename);
let sqlContent = `-- ===================================================================\n`;
sqlContent += `-- CHAIZSTORE RELATIONAL DATABASE DUMP BACKUP\n`;
sqlContent += `-- Tanggal Ekspor : ${new Date().toLocaleString('id-ID')}\n`;
sqlContent += `-- ===================================================================\n\n`;

for (const table of tables) {
  const schemaRow = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name = ?`).get(table);
  if (schemaRow && schemaRow.sql) {
    sqlContent += `-- Skema Tabel: ${table}\n`;
    sqlContent += `${schemaRow.sql};\n\n`;
  }

  const rows = allData[table];
  if (rows && rows.length > 0) {
    sqlContent += `-- Data Tabel: ${table} (${rows.length} baris)\n`;
    for (const row of rows) {
      const cols = Object.keys(row);
      const vals = cols.map(c => {
        const v = row[c];
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'number') return v;
        return `'${String(v).replace(/'/g, "''")}'`;
      });
      sqlContent += `INSERT INTO \`${table}\` (\`${cols.join('`, `')}\`) VALUES (${vals.join(', ')});\n`;
    }
    sqlContent += `\n`;
  }
}
writeFileSync(sqlPath, sqlContent, 'utf8');
console.log(`[SUCCESS] Backup .SQL selesai: backup_data/${sqlFilename}`);

// -------------------------------------------------------------------
// FORMAT 4: BACKUP .PDF (HTML Printable Report -> Save As PDF)
// -------------------------------------------------------------------
const pdfHtmlFilename = `chaizstore_laporan_transaksi_${timestamp}.html`;
const pdfHtmlPath = join(outputDir, pdfHtmlFilename);

const trxs = allData['transactions'] || [];
const users = allData['registered_users'] || [];

const htmlReport = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Backup Database &amp; Transaksi ChaizStore</title>
  <style>
    @media print {
      .no-print { display: none !important; }
      body { margin: 0; padding: 15mm; background: #fff !important; color: #000 !important; }
    }
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; background: #f8fafc; color: #1e293b; }
    .header { border-bottom: 3px solid #0284c7; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
    .title h1 { margin: 0; color: #0369a1; font-size: 24px; }
    .title p { margin: 4px 0 0 0; color: #64748b; font-size: 14px; }
    .badge { background: #e0f2fe; color: #0369a1; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
    th { background: #0284c7; color: #fff; text-align: left; padding: 8px 10px; font-weight: 600; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f1f5f9; }
    .btn-print { background: #0284c7; color: #fff; border: none; padding: 10px 20px; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .btn-print:hover { background: #0369a1; }
    .section-title { font-size: 16px; font-weight: bold; margin-bottom: 12px; color: #0f172a; border-left: 4px solid #0284c7; padding-left: 8px; }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan sebagai PDF</button>
  </div>

  <div class="header">
    <div class="title">
      <h1>CHAIZSTORE — LAPORAN RESMI DATABASE &amp; TRANSAKSI</h1>
      <p>Sistem E-Commerce Jual Beli Akun Premium &amp; Top Up Game</p>
    </div>
    <div>
      <span class="badge">Tanggal: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
    </div>
  </div>

  <div class="section-title">1. Ringkasan Data Transaksi (${trxs.length} Transaksi)</div>
  <table>
    <thead>
      <tr>
        <th>No. Pesanan</th>
        <th>Pelanggan</th>
        <th>Email</th>
        <th>Produk</th>
        <th>Durasi</th>
        <th>Total</th>
        <th>Metode</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${trxs.length === 0 ? '<tr><td colspan="8" style="text-align:center;">Belum ada transaksi</td></tr>' : trxs.map(t => `
        <tr>
          <td><strong>${t.id || '-'}</strong></td>
          <td>${t.customerName || '-'}</td>
          <td>${t.customerEmail || t.userEmail || '-'}</td>
          <td>${t.productName || '-'}</td>
          <td>${t.productDuration || 'Reguler'}</td>
          <td>Rp ${(t.total || 0).toLocaleString('id-ID')}</td>
          <td>${t.paymentMethod || '-'}</td>
          <td><strong>${t.status || 'processing'}</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">2. Ringkasan Pengguna Terdaftar (${users.length} Pengguna)</div>
  <table>
    <thead>
      <tr>
        <th>ID Pengguna</th>
        <th>Nama Pengguna</th>
        <th>Email</th>
        <th>Perangkat / OS</th>
        <th>Status Sesi</th>
        <th>Waktu Terakhir Aktif</th>
      </tr>
    </thead>
    <tbody>
      ${users.length === 0 ? '<tr><td colspan="6" style="text-align:center;">Belum ada data pengguna</td></tr>' : users.map(u => `
        <tr>
          <td>${u.id || '-'}</td>
          <td><strong>${u.name || '-'}</strong></td>
          <td>${u.email || '-'}</td>
          <td>${u.os || '-'} (${u.browser || '-'})</td>
          <td>${u.sessionStatus || 'logged_in'}</td>
          <td>${u.lastActiveTime || u.createdAt || '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div style="margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center;">
    Dokumen ini digenerate secara otomatis oleh Sistem Backup ChaizStore pada ${new Date().toLocaleString('id-ID')}.
  </div>
</body>
</html>`;

writeFileSync(pdfHtmlPath, htmlReport, 'utf8');
console.log(`[SUCCESS] Backup .PDF (Siap Cetak PDF) selesai: backup_data/${pdfHtmlFilename}`);

console.log('====================================================');
console.log(`Semua file backup tersimpan lengkap di: ${outputDir}`);
console.log('====================================================');
