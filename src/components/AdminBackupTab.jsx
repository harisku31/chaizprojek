import React, { useRef } from 'react';

export default function AdminBackupTab({
  backupsList = [],
  isSyncingBackups = false,
  isWorkingBackup = false,
  currentCounts = {},
  onCreateSnapshot,
  onRestoreSnapshot,
  onRestoreFromFile,
  onDeleteSnapshot,
  onDownloadJson,
  onDownloadCsv,
  onDownloadSql,
  onPrintPdf,
  onRefreshBackups,
  onOpenAnalytics
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && typeof onRestoreFromFile === 'function') {
      onRestoreFromFile(file);
    }
    e.target.value = '';
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' WIB';
    } catch {
      return iso;
    }
  };

  return (
    <div className="tab-pane-content backup-tab-wrap">
      {/* Header Banner */}
      <section className="admin-welcome-bar">
        <div className="welcome-text">
          <h2>🛡️ Fitur Backup Data & Pemulihan (Anti-Hilang)</h2>
          <p>
            Lindungi seluruh data <strong>Pengguna, Aktivitas, Pesanan, Deposit ChaizMoney, Voucher, & Produk</strong>. Setiap kali Anda menekan tombol <strong>Reset</strong>, sistem otomatis mencadangkan snapshot ke <strong>SQLite Server, Cloud Firebase, & Penyimpanan Lokal</strong> agar data tetap dapat dipulihkan walau terhapus atau di-reset.
          </p>
        </div>

        <div className="admin-quick-actions">
          <button
            type="button"
            className="admin-action-btn action-analytics-quick"
            onClick={onOpenAnalytics}
            title="Lihat Penghasilan & Grafik Toko"
          >
            <i className="fa-solid fa-chart-line"></i>
            <span>Penghasilan & Grafik</span>
          </button>

          <button
            type="button"
            className="admin-action-btn action-refresh"
            onClick={onRefreshBackups}
            disabled={isSyncingBackups}
            title="Muat ulang daftar snapshot backup"
          >
            <i className={`fa-solid fa-arrows-rotate ${isSyncingBackups ? 'fa-spin' : ''}`}></i>
            <span>{isSyncingBackups ? 'Memuat...' : 'Sync Backup'}</span>
          </button>
        </div>
      </section>

      {/* Ringkasan Data Aktif Saat Ini */}
      <section className="admin-stats-grid">
        <div className="admin-stat-card card-total">
          <div className="stat-card-icon"><i className="fa-solid fa-users text-cyan"></i></div>
          <div className="stat-card-info">
            <span className="stat-label">Data Pengguna Aktif</span>
            <strong className="stat-value">{currentCounts.users || 0}</strong>
            <small className="stat-sub">{currentCounts.visits || 0} riwayat kunjungan</small>
          </div>
        </div>

        <div className="admin-stat-card card-visits">
          <div className="stat-card-icon"><i className="fa-solid fa-clock-rotate-left text-warning"></i></div>
          <div className="stat-card-info">
            <span className="stat-label">Log Aktivitas Aktif</span>
            <strong className="stat-value text-warning">{currentCounts.activities || 0}</strong>
            <small className="stat-sub">Rekaman aksi pengguna</small>
          </div>
        </div>

        <div className="admin-stat-card card-today">
          <div className="stat-card-icon"><i className="fa-solid fa-receipt text-success"></i></div>
          <div className="stat-card-info">
            <span className="stat-label">Pesanan & Deposit</span>
            <strong className="stat-value text-success">{currentCounts.orders || 0} / {currentCounts.deposits || 0}</strong>
            <small className="stat-sub">Transaksi & Top Up saldo</small>
          </div>
        </div>

        <div className="admin-stat-card card-online">
          <div className="stat-card-icon"><i className="fa-solid fa-shield-halved text-indigo"></i></div>
          <div className="stat-card-info">
            <span className="stat-label">Snapshot Backup Tersimpan</span>
            <strong className="stat-value text-indigo">{backupsList.length}</strong>
            <small className="stat-sub">{currentCounts.vouchers || 0} voucher ikut terlindungi</small>
          </div>
        </div>
      </section>

      {/* Panel Aksi Backup & Ekspor 4 Format + Restore File */}
      <section className="backup-actions-panel">
        <div className="backup-panel-header">
          <div>
            <h3><i className="fa-solid fa-cloud-arrow-up text-cyan"></i> Buat Cadangan, Unduh 4 Format & Pulihkan File</h3>
            <span>Simpan snapshot ke server/cloud agar aman saat reset, atau unduh langsung dalam format .JSON, Excel (.CSV), .SQL, dan .PDF</span>
          </div>
        </div>

        <div className="backup-action-grid">
          <button
            type="button"
            className="backup-action-tile tile-primary"
            disabled={isWorkingBackup}
            onClick={() => onCreateSnapshot('Backup Manual Lengkap', 'manual')}
          >
            <i className={`fa-solid ${isWorkingBackup ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`}></i>
            <strong>Buat Snapshot Backup</strong>
            <small>Simpan ke SQLite, Cloud & Lokal</small>
          </button>

          <button
            type="button"
            className="backup-action-tile tile-json"
            onClick={() => onDownloadJson()}
          >
            <i className="fa-solid fa-file-code"></i>
            <strong>Download .JSON</strong>
            <small>Format lengkap siap Restore</small>
          </button>

          <button
            type="button"
            className="backup-action-tile tile-excel"
            onClick={() => onDownloadCsv()}
          >
            <i className="fa-solid fa-file-excel"></i>
            <strong>Download Excel (.CSV)</strong>
            <small>Buka langsung di Microsoft Excel</small>
          </button>

          <button
            type="button"
            className="backup-action-tile tile-sql"
            onClick={() => onDownloadSql()}
          >
            <i className="fa-solid fa-database"></i>
            <strong>Download Dump .SQL</strong>
            <small>Query INSERT siap import MySQL/SQLite</small>
          </button>

          <button
            type="button"
            className="backup-action-tile tile-pdf"
            onClick={() => onPrintPdf()}
          >
            <i className="fa-solid fa-file-pdf"></i>
            <strong>Cetak / Export .PDF</strong>
            <small>Laporan resmi siap print PDF</small>
          </button>

          <button
            type="button"
            className="backup-action-tile tile-restore"
            disabled={isWorkingBackup}
            onClick={() => fileInputRef.current?.click()}
          >
            <i className="fa-solid fa-upload"></i>
            <strong>Pulihkan dari File .JSON</strong>
            <small>Upload file backup untuk restore</small>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </section>

      {/* Daftar Snapshot Backup Tersimpan (Anti-Terhapus) */}
      <section className="admin-table-card backup-history-card">
        <div className="backup-history-header">
          <div>
            <h3><i className="fa-solid fa-clock-rotate-left text-emerald"></i> Riwayat Snapshot Backup ({backupsList.length})</h3>
            <p>Walau data aktif atau file sudah di-reset/hapus, Anda dapat memulihkan kembali seluruh data dari daftar snapshot di bawah ini.</p>
          </div>
        </div>

        {backupsList.length === 0 ? (
          <div className="empty-vouchers-notice">
            <i className="fa-solid fa-database text-cyan"></i>
            <h4>Belum Ada Snapshot Backup Tersimpan</h4>
            <p>
              Klik <strong>Buat Snapshot Backup</strong> di atas atau sistem akan otomatis membuatkan backup setiap kali Anda menekan tombol Reset data.
            </p>
          </div>
        ) : (
          <div className="backup-snapshots-list">
            {backupsList.map((bkp) => {
              const st = bkp.stats || {};
              const isAutoReset = String(bkp.reason || '').startsWith('auto_reset');
              return (
                <div key={bkp.id} className={`backup-snapshot-card ${isAutoReset ? 'is-auto-reset' : ''}`}>
                  <div className="backup-snap-main">
                    <div className="backup-snap-top">
                      <span className={`backup-reason-badge ${isAutoReset ? 'badge-auto' : 'badge-manual'}`}>
                        <i className={`fa-solid ${isAutoReset ? 'fa-shield-virus' : 'fa-floppy-disk'}`}></i>
                        {isAutoReset ? 'Auto-Backup Sebelum Reset' : 'Backup Manual'}
                      </span>
                      <code className="backup-snap-id">{bkp.id}</code>
                      <span className="backup-snap-time">
                        <i className="fa-regular fa-clock"></i> {formatDate(bkp.createdAt)}
                      </span>
                    </div>

                    <h4 className="backup-snap-label">{bkp.label || 'Snapshot Data ChaizStore'}</h4>

                    <div className="backup-snap-counts">
                      <span><i className="fa-solid fa-users text-cyan"></i> {st.usersCount ?? '-'} User</span>
                      <span><i className="fa-solid fa-bolt text-warning"></i> {st.activitiesCount ?? '-'} Aktivitas</span>
                      <span><i className="fa-solid fa-receipt text-success"></i> {st.ordersCount ?? '-'} Pesanan</span>
                      <span><i className="fa-solid fa-wallet text-indigo"></i> {st.depositsCount ?? '-'} Depo</span>
                      <span><i className="fa-solid fa-ticket text-purple"></i> {st.vouchersCount ?? '-'} Voucher</span>
                      {st.orderRevenue !== undefined && (
                        <span className="text-emerald">
                          <i className="fa-solid fa-sack-dollar"></i> Omset Rp {Number(st.orderRevenue || 0).toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="backup-snap-actions">
                    <button
                      type="button"
                      className="btn-restore-snap"
                      disabled={isWorkingBackup}
                      onClick={() => onRestoreSnapshot(bkp)}
                      title="Pulihkan seluruh data dari snapshot backup ini"
                    >
                      <i className="fa-solid fa-rotate-left"></i>
                      <span>Pulihkan Data</span>
                    </button>

                    <button
                      type="button"
                      className="btn-download-snap"
                      onClick={() => onDownloadJson(bkp)}
                      title="Download snapshot ini sebagai file .JSON"
                    >
                      <i className="fa-solid fa-download"></i>
                      <span>.JSON</span>
                    </button>

                    <button
                      type="button"
                      className="btn-delete-snap"
                      disabled={isWorkingBackup}
                      onClick={() => onDeleteSnapshot(bkp.id, bkp.label)}
                      title="Hapus snapshot ini"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
