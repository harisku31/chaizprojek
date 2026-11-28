import React, { useState, useMemo } from 'react';

function getDayKey(dateInput) {
  const d = new Date(dateInput || Date.now());
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatShortDay(dayKey) {
  const [y, m, d] = dayKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

function formatCompactRp(val) {
  const num = Number(val) || 0;
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1).replace('.0', '')}jt`;
  if (num >= 1_000) return `Rp ${Math.round(num / 1_000)}rb`;
  return `Rp ${num}`;
}

export default function AdminAnalyticsTab({
  ordersList = [],
  depositsList = [],
  registeredUsers = [],
  activityLogs = [],
  permanentVisits = [],
  vouchersList = [],
  productsList = [],
  isUserOnline,
  onOpenBackup,
  onPrintPdf,
  onRefresh
}) {
  const [period, setPeriod] = useState('7d'); // 'today' | '7d' | '30d' | 'all'
  const [hoveredRevIdx, setHoveredRevIdx] = useState(null);
  const [hoveredUsrIdx, setHoveredUsrIdx] = useState(null);
  const [hoveredActIdx, setHoveredActIdx] = useState(null);

  const analytics = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let cutoffMs = 0;
    if (period === 'today') cutoffMs = todayStart;
    else if (period === '7d') cutoffMs = todayStart - 6 * 86400000;
    else if (period === '30d') cutoffMs = todayStart - 29 * 86400000;

    const inRange = (iso) => {
      if (period === 'all') return true;
      const t = new Date(iso || 0).getTime();
      return !isNaN(t) && t >= cutoffMs;
    };

    const filteredOrders = (ordersList || []).filter((o) => o && inRange(o.createdAt));
    const filteredDeposits = (depositsList || []).filter((d) => d && inRange(d.createdAt));
    const filteredActivities = (activityLogs || []).filter((a) => a && inRange(a.timestamp || a.createdAt));

    // Revenue & Orders
    const validOrders = filteredOrders.filter((o) => o.status !== 'rejected');
    const completedOrders = filteredOrders.filter((o) => o.status === 'completed');
    const processingOrders = filteredOrders.filter((o) => o.status === 'processing' || o.status === 'pending');
    const rejectedOrders = filteredOrders.filter((o) => o.status === 'rejected');

    const getOrderVal = (o) => Number(o.total !== undefined && o.total !== null ? o.total : o.price) || 0;
    const orderRevenue = validOrders.reduce((s, o) => s + getOrderVal(o), 0);
    const completedRevenue = completedOrders.reduce((s, o) => s + getOrderVal(o), 0);
    const avgOrderValue = validOrders.length > 0 ? Math.round(orderRevenue / validOrders.length) : 0;

    // Deposits
    const approvedDeposits = filteredDeposits.filter((d) => d.status === 'approved');
    const depositRevenue = approvedDeposits.reduce((s, d) => s + (Number(d.creditedAmount ?? d.amount) || 0), 0);
    const totalCombinedIncome = orderRevenue + depositRevenue;

    // Users & Visits
    const safeUsers = (registeredUsers || []).filter(Boolean);
    const onlineUsersCount = safeUsers.filter((u) => (isUserOnline ? isUserOnline(u) : false)).length;
    const loggedInCount = safeUsers.filter((u) => u.sessionStatus !== 'logged_out' && !u.banStatus?.isBanned).length;
    const bannedCount = safeUsers.filter((u) => u.banStatus?.isBanned).length;
    const activeUsersInPeriod = safeUsers.filter((u) => inRange(u.lastActiveTime || u.firstLoginTime || u.createdAt)).length;
    const visitsInPeriod = (permanentVisits || []).filter((v) => v && inRange(v.lastActiveAt || v.firstVisitedAt)).length;

    // Vouchers & Products
    const activeVouchers = (vouchersList || []).filter((v) => v && !v.isUsed && v.isActive !== false).length;
    const usedVouchers = (vouchersList || []).filter((v) => v && v.isUsed).length;
    const totalVoucherDiscount = validOrders.reduce((s, o) => s + (Number(o.voucherDiscount) || 0), 0);
    const totalStock = (productsList || []).reduce((s, p) => s + (Number(p?.stock) || 0), 0);

    // Time-series buckets
    let buckets = [];
    if (period === 'today') {
      for (let h = 0; h < 24; h += 4) {
        const label = `${String(h).padStart(2, '0')}:00`;
        const start = todayStart + h * 3600000;
        const end = start + 4 * 3600000;
        buckets.push({
          key: `h_${h}`,
          label,
          title: `Hari ini ${label} - ${String(h + 4).padStart(2, '0')}:00`,
          start,
          end,
          revenue: 0,
          deposits: 0,
          orders: 0,
          users: 0,
          activities: 0,
          visits: 0
        });
      }
      const matchHour = (iso) => {
        const t = new Date(iso || 0).getTime();
        return buckets.find((b) => t >= b.start && t < b.end);
      };
      validOrders.forEach((o) => {
        const b = matchHour(o.createdAt);
        if (b) {
          b.revenue += getOrderVal(o);
          b.orders += 1;
        }
      });
      approvedDeposits.forEach((d) => {
        const b = matchHour(d.createdAt);
        if (b) b.deposits += Number(d.creditedAmount ?? d.amount) || 0;
      });
      safeUsers.forEach((u) => {
        const b = matchHour(u.lastActiveTime || u.firstLoginTime || u.createdAt);
        if (b) b.users += 1;
      });
      (permanentVisits || []).forEach((v) => {
        const b = matchHour(v.lastActiveAt || v.firstVisitedAt);
        if (b) b.visits += 1;
      });
      filteredActivities.forEach((a) => {
        const b = matchHour(a.timestamp || a.createdAt);
        if (b) b.activities += 1;
      });
    } else {
      const daysCount = period === '7d' ? 7 : 14;
      const bucketMap = new Map();
      for (let i = daysCount - 1; i >= 0; i--) {
        const dt = new Date(todayStart - i * 86400000);
        const key = getDayKey(dt);
        const obj = {
          key,
          label: formatShortDay(key),
          title: dt.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
          revenue: 0,
          deposits: 0,
          orders: 0,
          users: 0,
          activities: 0,
          visits: 0
        };
        buckets.push(obj);
        bucketMap.set(key, obj);
      }

      validOrders.forEach((o) => {
        const b = bucketMap.get(getDayKey(o.createdAt));
        if (b) {
          b.revenue += getOrderVal(o);
          b.orders += 1;
        }
      });
      approvedDeposits.forEach((d) => {
        const b = bucketMap.get(getDayKey(d.createdAt));
        if (b) b.deposits += Number(d.creditedAmount ?? d.amount) || 0;
      });
      safeUsers.forEach((u) => {
        const b = bucketMap.get(getDayKey(u.lastActiveTime || u.firstLoginTime || u.createdAt));
        if (b) b.users += 1;
      });
      (permanentVisits || []).forEach((v) => {
        const b = bucketMap.get(getDayKey(v.lastActiveAt || v.firstVisitedAt));
        if (b) b.visits += 1;
      });
      filteredActivities.forEach((a) => {
        const b = bucketMap.get(getDayKey(a.timestamp || a.createdAt));
        if (b) b.activities += 1;
      });
    }

    // Breakdown aktivitas berdasarkan tipe aksi
    const actTypeCounts = new Map();
    filteredActivities.forEach((a) => {
      const raw = String(a.actionType || 'OTHER').toUpperCase();
      let group = 'Lainnya';
      if (raw.includes('LOGIN') || raw.includes('LOGOUT') || raw.includes('AUTH')) group = 'Login & Sesi';
      else if (raw.includes('CHECKOUT') || raw.includes('ORDER') || raw.includes('FULFILLED')) group = 'Checkout & Pesanan';
      else if (raw.includes('CART')) group = 'Keranjang Belanja';
      else if (raw.includes('TOPUP') || raw.includes('DEPOSIT') || raw.includes('STEAM') || raw.includes('ROBLOX') || raw.includes('MLBB') || raw.includes('MOBILE')) group = 'Top Up & ChaizMoney';
      else if (raw.includes('VIEW') || raw.includes('SEARCH') || raw.includes('PRODUCT')) group = 'Jelajah Katalog';
      else if (raw.includes('BAN')) group = 'Sanksi & Keamanan';
      actTypeCounts.set(group, (actTypeCounts.get(group) || 0) + 1);
    });
    const activityBreakdown = Array.from(actTypeCounts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    // Breakdown metode pembayaran
    const payMap = new Map();
    validOrders.forEach((o) => {
      const pm = String(o.paymentMethod || '').toLowerCase();
      let label = 'Lainnya';
      if (pm.includes('qris')) label = 'QRIS Gateway';
      else if (pm.includes('gopay')) label = 'GoPay Instant';
      else if (pm.includes('voucher') || pm.includes('gratis') || o.voucherCode) label = 'Voucher Promo';
      else if (pm.includes('wallet') || pm.includes('dana')) label = 'E-Wallet';
      else if (pm.includes('bank') || pm.includes('muamalat')) label = 'Transfer Bank';
      const cur = payMap.get(label) || { label, count: 0, total: 0 };
      cur.count += 1;
      cur.total += getOrderVal(o);
      payMap.set(label, cur);
    });
    const paymentBreakdown = Array.from(payMap.values()).sort((a, b) => b.count - a.count);

    // Top Produk Terlaris
    const prodMap = new Map();
    validOrders.forEach((o) => {
      const name = o.productName || 'Produk Digital';
      const cur = prodMap.get(name) || { name, qty: 0, revenue: 0 };
      cur.qty += Number(o.qty) || 1;
      cur.revenue += getOrderVal(o);
      prodMap.set(name, cur);
    });
    const topProducts = Array.from(prodMap.values())
      .sort((a, b) => b.revenue - a.revenue || b.qty - a.qty)
      .slice(0, 6);

    return {
      filteredOrdersCount: filteredOrders.length,
      completedCount: completedOrders.length,
      processingCount: processingOrders.length,
      rejectedCount: rejectedOrders.length,
      orderRevenue,
      completedRevenue,
      avgOrderValue,
      depositRevenue,
      approvedDepositsCount: approvedDeposits.length,
      totalCombinedIncome,
      totalUsers: safeUsers.length,
      onlineUsersCount,
      loggedInCount,
      bannedCount,
      activeUsersInPeriod,
      totalVisits: (permanentVisits || []).length,
      visitsInPeriod,
      totalActivities: (activityLogs || []).length,
      activitiesInPeriod: filteredActivities.length,
      activeVouchers,
      usedVouchers,
      totalVouchers: (vouchersList || []).length,
      totalVoucherDiscount,
      totalProducts: (productsList || []).length,
      totalStock,
      buckets,
      activityBreakdown,
      paymentBreakdown,
      topProducts
    };
  }, [ordersList, depositsList, registeredUsers, activityLogs, permanentVisits, vouchersList, productsList, period, isUserOnline]);

  // Helper: Donut SVG conic gradient string
  const orderDonutGradient = useMemo(() => {
    const total = Math.max(1, analytics.completedCount + analytics.processingCount + analytics.rejectedCount);
    const p1 = (analytics.completedCount / total) * 100;
    const p2 = p1 + (analytics.processingCount / total) * 100;
    if (analytics.filteredOrdersCount === 0) {
      return 'conic-gradient(rgba(148,163,184,0.2) 0% 100%)';
    }
    return `conic-gradient(#10b981 0% ${p1.toFixed(1)}%, #f59e0b ${p1.toFixed(1)}% ${p2.toFixed(1)}%, #ef4444 ${p2.toFixed(1)}% 100%)`;
  }, [analytics]);

  const userDonutGradient = useMemo(() => {
    const total = Math.max(1, analytics.totalUsers);
    const offline = Math.max(0, total - analytics.onlineUsersCount - analytics.bannedCount);
    const p1 = (analytics.onlineUsersCount / total) * 100;
    const p2 = p1 + (offline / total) * 100;
    if (analytics.totalUsers === 0) {
      return 'conic-gradient(rgba(148,163,184,0.2) 0% 100%)';
    }
    return `conic-gradient(#10b981 0% ${p1.toFixed(1)}%, #38bdf8 ${p1.toFixed(1)}% ${p2.toFixed(1)}%, #ef4444 ${p2.toFixed(1)}% 100%)`;
  }, [analytics]);

  const maxRev = Math.max(1000, ...analytics.buckets.map((b) => b.revenue + b.deposits));
  const maxUsr = Math.max(1, ...analytics.buckets.map((b) => Math.max(b.users, b.visits)));
  const maxAct = Math.max(1, ...analytics.buckets.map((b) => b.activities));

  const hoveredRev = hoveredRevIdx !== null ? analytics.buckets[hoveredRevIdx] : null;
  const hoveredUsr = hoveredUsrIdx !== null ? analytics.buckets[hoveredUsrIdx] : null;
  const hoveredAct = hoveredActIdx !== null ? analytics.buckets[hoveredActIdx] : null;

  return (
    <div className="tab-pane-content analytics-tab-wrap">
      {/* Header Banner */}
      <section className="admin-welcome-bar">
        <div className="welcome-text">
          <h2>📊 Penghasilan, Grafik & Statistik Toko</h2>
          <p>
            Pantau grafik <strong>penghasilan penjualan & deposit ChaizMoney</strong>, pertumbuhan <strong>jumlah pengguna</strong>, tren <strong>jumlah aktivitas</strong>, metode pembayaran, status voucher hangus, serta produk terlaris secara realtime.
          </p>
        </div>

        <div className="admin-quick-actions">
          <div className="analytics-period-pills">
            {[
              { id: 'today', label: 'Hari Ini' },
              { id: '7d', label: '7 Hari' },
              { id: '30d', label: '30 Hari' },
              { id: 'all', label: 'Semua' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                className={`filter-pill ${period === p.id ? 'active' : ''}`}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="admin-action-btn action-backup-data"
            onClick={onOpenBackup}
            title="Buka menu Fitur Backup Data & Snapshot"
          >
            <i className="fa-solid fa-database"></i>
            <span>Fitur Backup Data</span>
          </button>

          <button
            type="button"
            className="admin-action-btn action-export-csv"
            onClick={onPrintPdf}
            title="Cetak atau simpan laporan penghasilan sebagai PDF"
          >
            <i className="fa-solid fa-file-pdf"></i>
            <span>Cetak Laporan PDF</span>
          </button>

          <button
            type="button"
            className="admin-action-btn action-refresh"
            onClick={onRefresh}
            title="Segarkan statistik dari Cloud"
          >
            <i className="fa-solid fa-arrows-rotate"></i>
            <span>Refresh</span>
          </button>
        </div>
      </section>

      {/* 6 KPI Summary Cards */}
      <section className="admin-stats-grid analytics-kpi-grid">
        <div className="admin-stat-card card-today">
          <div className="stat-card-icon">
            <i className="fa-solid fa-sack-dollar text-success"></i>
          </div>
          <div className="stat-card-info">
            <span className="stat-label">Penghasilan Pesanan</span>
            <strong className="stat-value text-success">Rp {analytics.orderRevenue.toLocaleString('id-ID')}</strong>
            <small className="stat-sub">
              {analytics.completedCount} selesai • Rata-rata Rp {analytics.avgOrderValue.toLocaleString('id-ID')}
            </small>
          </div>
        </div>

        <div className="admin-stat-card card-online">
          <div className="stat-card-icon">
            <i className="fa-solid fa-wallet text-cyan"></i>
          </div>
          <div className="stat-card-info">
            <span className="stat-label">Deposit ChaizMoney (Lunas)</span>
            <strong className="stat-value text-cyan">Rp {analytics.depositRevenue.toLocaleString('id-ID')}</strong>
            <small className="stat-sub">{analytics.approvedDepositsCount} top up disetujui</small>
          </div>
        </div>

        <div className="admin-stat-card card-total">
          <div className="stat-card-icon">
            <i className="fa-solid fa-chart-line text-indigo"></i>
          </div>
          <div className="stat-card-info">
            <span className="stat-label">Total Arus Masuk Gabungan</span>
            <strong className="stat-value text-indigo">Rp {analytics.totalCombinedIncome.toLocaleString('id-ID')}</strong>
            <small className="stat-sub">Akumulasi Omset + Deposit</small>
          </div>
        </div>

        <div className="admin-stat-card card-total">
          <div className="stat-card-icon">
            <i className="fa-solid fa-users text-cyan"></i>
          </div>
          <div className="stat-card-info">
            <span className="stat-label">Jumlah Pengguna & Online</span>
            <strong className="stat-value">{analytics.totalUsers} User</strong>
            <small className="stat-sub">
              {analytics.onlineUsersCount} online • {analytics.totalVisits} kunjungan abadi
            </small>
          </div>
        </div>

        <div className="admin-stat-card card-visits">
          <div className="stat-card-icon">
            <i className="fa-solid fa-wave-square text-warning"></i>
          </div>
          <div className="stat-card-info">
            <span className="stat-label">Jumlah Aktivitas Pengguna</span>
            <strong className="stat-value text-warning">{analytics.activitiesInPeriod}</strong>
            <small className="stat-sub">Total tercatat: {analytics.totalActivities} aktivitas</small>
          </div>
        </div>

        <div className="admin-stat-card card-banned">
          <div className="stat-card-icon">
            <i className="fa-solid fa-ticket text-purple"></i>
          </div>
          <div className="stat-card-info">
            <span className="stat-label">Voucher & Stok Gudang</span>
            <strong className="stat-value">
              {analytics.usedVouchers} Hangus / {analytics.activeVouchers} Aktif
            </strong>
            <small className="stat-sub">
              Diskon: Rp {analytics.totalVoucherDiscount.toLocaleString('id-ID')} • Stok: {analytics.totalStock}
            </small>
          </div>
        </div>
      </section>

      {/* Main Charts Grid */}
      <div className="analytics-charts-grid">
        {/* CHART 1: GRAFIK PENGHASILAN & PESANAN */}
        <section className="analytics-chart-card chart-span-2">
          <div className="chart-card-header">
            <div>
              <h3>
                <i className="fa-solid fa-chart-column text-success"></i> Grafik Penghasilan & Transaksi ({period === 'today' ? 'Per 4 Jam Hari Ini' : period === '7d' ? '7 Hari Terakhir' : '14 Hari Terakhir'})
              </h3>
              <p>Arahkan kursor ke batang grafik untuk melihat detail omset pesanan & deposit ChaizMoney</p>
            </div>
            <div className="chart-legend-row">
              <span className="legend-chip"><i className="legend-dot dot-emerald"></i> Omset Pesanan</span>
              <span className="legend-chip"><i className="legend-dot dot-cyan"></i> Deposit ChaizMoney</span>
            </div>
          </div>

          {hoveredRev ? (
            <div className="chart-hover-banner">
              <strong>{hoveredRev.title}:</strong>
              <span className="text-success">Pesanan Rp {hoveredRev.revenue.toLocaleString('id-ID')} ({hoveredRev.orders} trx)</span>
              <span>•</span>
              <span className="text-cyan">Deposit Rp {hoveredRev.deposits.toLocaleString('id-ID')}</span>
            </div>
          ) : (
            <div className="chart-hover-banner muted-hint">
              <span>Total pada periode ini: <strong>Rp {analytics.totalCombinedIncome.toLocaleString('id-ID')}</strong> ({analytics.filteredOrdersCount} pesanan masuk)</span>
            </div>
          )}

          <div className="svg-bar-chart-wrap">
            {analytics.buckets.map((b, idx) => {
              const totalVal = b.revenue + b.deposits;
              const ordPct = Math.round((b.revenue / maxRev) * 100);
              const depPct = Math.round((b.deposits / maxRev) * 100);
              return (
                <div
                  key={b.key}
                  className={`chart-col-item ${hoveredRevIdx === idx ? 'is-hovered' : ''}`}
                  onMouseEnter={() => setHoveredRevIdx(idx)}
                  onMouseLeave={() => setHoveredRevIdx(null)}
                >
                  <div className="chart-col-value">
                    {totalVal > 0 ? formatCompactRp(totalVal) : '-'}
                  </div>
                  <div className="chart-col-track">
                    <div
                      className="chart-bar-stack"
                      style={{ height: `${Math.max(totalVal > 0 ? 6 : 2, ordPct + depPct)}%` }}
                    >
                      {depPct > 0 && (
                        <div
                          className="chart-bar-seg seg-cyan"
                          style={{ height: `${Math.round((depPct / Math.max(1, ordPct + depPct)) * 100)}%` }}
                          title={`Deposit: Rp ${b.deposits.toLocaleString('id-ID')}`}
                        />
                      )}
                      <div
                        className="chart-bar-seg seg-emerald"
                        style={{ height: `${depPct > 0 ? Math.max(10, 100 - Math.round((depPct / Math.max(1, ordPct + depPct)) * 100)) : 100}%` }}
                        title={`Pesanan: Rp ${b.revenue.toLocaleString('id-ID')}`}
                      />
                    </div>
                  </div>
                  <span className="chart-col-label">{b.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* CHART 2: GRAFIK JUMLAH PENGGUNA & KUNJUNGAN */}
        <section className="analytics-chart-card">
          <div className="chart-card-header">
            <div>
              <h3><i className="fa-solid fa-users text-cyan"></i> Grafik Jumlah Pengguna & Kunjungan</h3>
              <p>Aktivitas login pengguna & kunjungan toko harian</p>
            </div>
            <div className="chart-legend-row">
              <span className="legend-chip"><i className="legend-dot dot-indigo"></i> User Aktif</span>
              <span className="legend-chip"><i className="legend-dot dot-cyan"></i> Kunjungan</span>
            </div>
          </div>

          <div className="chart-hover-banner muted-hint">
            {hoveredUsr ? (
              <span>
                <strong>{hoveredUsr.title}:</strong> {hoveredUsr.users} user aktif • {hoveredUsr.visits} kunjungan
              </span>
            ) : (
              <span>
                Online sekarang: <strong className="text-success">{analytics.onlineUsersCount}</strong> • Total terdaftar: <strong>{analytics.totalUsers}</strong>
              </span>
            )}
          </div>

          <div className="svg-bar-chart-wrap compact-chart">
            {analytics.buckets.map((b, idx) => {
              const uPct = Math.round((b.users / maxUsr) * 100);
              const vPct = Math.round((b.visits / maxUsr) * 100);
              return (
                <div
                  key={b.key}
                  className={`chart-col-item ${hoveredUsrIdx === idx ? 'is-hovered' : ''}`}
                  onMouseEnter={() => setHoveredUsrIdx(idx)}
                  onMouseLeave={() => setHoveredUsrIdx(null)}
                >
                  <div className="chart-col-value">{b.users + b.visits > 0 ? `${b.users}/${b.visits}` : '-'}</div>
                  <div className="chart-col-track dual-track">
                    <div className="chart-bar-single seg-indigo" style={{ height: `${Math.max(b.users > 0 ? 8 : 2, uPct)}%` }} />
                    <div className="chart-bar-single seg-cyan" style={{ height: `${Math.max(b.visits > 0 ? 8 : 2, vPct)}%` }} />
                  </div>
                  <span className="chart-col-label">{b.label}</span>
                </div>
              );
            })}
          </div>

          {/* Mini Donut Status Pengguna */}
          <div className="analytics-donut-split">
            <div className="donut-ring" style={{ background: userDonutGradient }}>
              <div className="donut-hole">
                <strong>{analytics.totalUsers}</strong>
                <small>User</small>
              </div>
            </div>
            <div className="donut-legend-list">
              <div className="donut-legend-row">
                <span className="legend-dot dot-emerald"></span>
                <span>Sedang Online</span>
                <strong>{analytics.onlineUsersCount}</strong>
              </div>
              <div className="donut-legend-row">
                <span className="legend-dot dot-cyan"></span>
                <span>Offline / Normal</span>
                <strong>{Math.max(0, analytics.totalUsers - analytics.onlineUsersCount - analytics.bannedCount)}</strong>
              </div>
              <div className="donut-legend-row">
                <span className="legend-dot dot-danger"></span>
                <span>Terkena Banned</span>
                <strong>{analytics.bannedCount}</strong>
              </div>
            </div>
          </div>
        </section>

        {/* CHART 3: GRAFIK JUMLAH AKTIVITAS PENGGUNA */}
        <section className="analytics-chart-card">
          <div className="chart-card-header">
            <div>
              <h3><i className="fa-solid fa-bolt text-warning"></i> Grafik Jumlah Aktivitas Pengguna</h3>
              <p>Volume interaksi pengguna & kategori aksi terbanyak</p>
            </div>
          </div>

          <div className="chart-hover-banner muted-hint">
            {hoveredAct ? (
              <span><strong>{hoveredAct.title}:</strong> {hoveredAct.activities} aktivitas tercatat</span>
            ) : (
              <span>Aktivitas pada periode: <strong className="text-warning">{analytics.activitiesInPeriod}</strong> aksi</span>
            )}
          </div>

          <div className="svg-bar-chart-wrap compact-chart">
            {analytics.buckets.map((b, idx) => {
              const aPct = Math.round((b.activities / maxAct) * 100);
              return (
                <div
                  key={b.key}
                  className={`chart-col-item ${hoveredActIdx === idx ? 'is-hovered' : ''}`}
                  onMouseEnter={() => setHoveredActIdx(idx)}
                  onMouseLeave={() => setHoveredActIdx(null)}
                >
                  <div className="chart-col-value">{b.activities > 0 ? b.activities : '-'}</div>
                  <div className="chart-col-track">
                    <div className="chart-bar-single seg-amber" style={{ height: `${Math.max(b.activities > 0 ? 8 : 2, aPct)}%` }} />
                  </div>
                  <span className="chart-col-label">{b.label}</span>
                </div>
              );
            })}
          </div>

          <div className="horiz-bars-list">
            {analytics.activityBreakdown.length === 0 ? (
              <p className="analytics-empty-text">Belum ada catatan aktivitas pada periode ini.</p>
            ) : (
              analytics.activityBreakdown.slice(0, 5).map((item) => {
                const pct = Math.round((item.count / Math.max(1, analytics.activitiesInPeriod)) * 100);
                return (
                  <div key={item.label} className="horiz-bar-row">
                    <div className="horiz-bar-top">
                      <span>{item.label}</span>
                      <strong>{item.count} ({pct}%)</strong>
                    </div>
                    <div className="horiz-bar-track">
                      <div className="horiz-bar-fill fill-amber" style={{ width: `${Math.max(4, pct)}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* CHART 4: STATUS PESANAN & METODE PEMBAYARAN */}
        <section className="analytics-chart-card">
          <div className="chart-card-header">
            <div>
              <h3><i className="fa-solid fa-pie-chart text-purple"></i> Status Pesanan & Metode Bayar</h3>
              <p>Rasio penyelesaian pesanan serta saluran pembayaran favorit</p>
            </div>
          </div>

          <div className="analytics-donut-split">
            <div className="donut-ring" style={{ background: orderDonutGradient }}>
              <div className="donut-hole">
                <strong>{analytics.filteredOrdersCount}</strong>
                <small>Order</small>
              </div>
            </div>
            <div className="donut-legend-list">
              <div className="donut-legend-row">
                <span className="legend-dot dot-emerald"></span>
                <span>Selesai Terkirim</span>
                <strong>{analytics.completedCount}</strong>
              </div>
              <div className="donut-legend-row">
                <span className="legend-dot dot-amber"></span>
                <span>Menunggu Proses</span>
                <strong>{analytics.processingCount}</strong>
              </div>
              <div className="donut-legend-row">
                <span className="legend-dot dot-danger"></span>
                <span>Ditolak</span>
                <strong>{analytics.rejectedCount}</strong>
              </div>
            </div>
          </div>

          <div className="horiz-bars-list mt-12">
            {analytics.paymentBreakdown.length === 0 ? (
              <p className="analytics-empty-text">Belum ada pesanan pada periode ini.</p>
            ) : (
              analytics.paymentBreakdown.map((pm) => {
                const pct = Math.round((pm.count / Math.max(1, analytics.filteredOrdersCount)) * 100);
                return (
                  <div key={pm.label} className="horiz-bar-row">
                    <div className="horiz-bar-top">
                      <span>{pm.label}</span>
                      <strong>{pm.count}x • Rp {pm.total.toLocaleString('id-ID')}</strong>
                    </div>
                    <div className="horiz-bar-track">
                      <div className="horiz-bar-fill fill-cyan" style={{ width: `${Math.max(5, pct)}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* CHART 5: TOP PRODUK TERLARIS & STATUS VOUCHER */}
        <section className="analytics-chart-card">
          <div className="chart-card-header">
            <div>
              <h3><i className="fa-solid fa-crown text-warning"></i> Produk Terlaris & Status Voucher</h3>
              <p>Kontribusi penghasilan per produk serta status voucher hangus</p>
            </div>
          </div>

          <div className="horiz-bars-list">
            {analytics.topProducts.length === 0 ? (
              <p className="analytics-empty-text">Belum ada penjualan produk pada periode ini.</p>
            ) : (
              analytics.topProducts.map((prod, idx) => {
                const maxProdRev = Math.max(1, analytics.topProducts[0]?.revenue || 1);
                const pct = Math.round((prod.revenue / maxProdRev) * 100);
                return (
                  <div key={prod.name} className="horiz-bar-row">
                    <div className="horiz-bar-top">
                      <span><strong>#{idx + 1}</strong> {prod.name} ({prod.qty} pcs)</span>
                      <strong className="text-success">Rp {prod.revenue.toLocaleString('id-ID')}</strong>
                    </div>
                    <div className="horiz-bar-track">
                      <div className="horiz-bar-fill fill-emerald" style={{ width: `${Math.max(6, pct)}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="analytics-voucher-summary-box">
            <div className="av-item">
              <span>Total Voucher</span>
              <strong>{analytics.totalVouchers}</strong>
            </div>
            <div className="av-item">
              <span>Siap Pakai</span>
              <strong className="text-success">{analytics.activeVouchers}</strong>
            </div>
            <div className="av-item">
              <span>Telah Hangus Dipakai</span>
              <strong className="text-danger">{analytics.usedVouchers}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
