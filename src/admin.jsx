import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from './components/AdminApp';
import './index.css';
import './admin.css';
import './utils/firebase';

/**
 * AdminErrorBoundary
 * Mencegah halaman admin mengalami blank white screen saat terjadi error tak terduga.
 * Menampilkan antarmuka pemulihan dengan tombol 'Muat Ulang' dan 'Reset Cache'.
 */
class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 [Admin Portal Render Error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetCache = () => {
    try {
      const keysToClean = [
        'chaiz_admin_session',
        'chaiz_admin_registered_users',
        'chaiz_permanent_visit_history',
        'chaiz_admin_activity_logs'
      ];
      keysToClean.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Gagal membersihkan cache lokal:', e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: '#0a0d14',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              background: 'linear-gradient(145deg, #131b2e, #0b111e)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                margin: '0 auto 20px',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              ⚠️
            </div>

            <h2
              style={{
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '10px',
                color: '#ffffff'
              }}
            >
              Portal Admin Memerlukan Pemulihan
            </h2>

            <p
              style={{
                color: '#94a3b8',
                fontSize: '14px',
                lineHeight: 1.6,
                marginBottom: '20px'
              }}
            >
              Terdeteksi anomali render pada browser. Data pesanan, gudang, dan akun di Cloud Database Anda tetap aman 100%.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '12px',
                  color: '#fca5a5',
                  fontFamily: "'JetBrains Mono', monospace",
                  textAlign: 'left',
                  marginBottom: '24px',
                  overflowX: 'auto',
                  maxHeight: '110px'
                }}
              >
                <strong>Error: </strong>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>🔄</span> Muat Ulang Halaman
              </button>
              <button
                type="button"
                onClick={this.handleResetCache}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Bersihkan Cache & Sinkron Ulang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootEl = document.getElementById('admin-root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <AdminErrorBoundary>
        <AdminApp />
      </AdminErrorBoundary>
    </React.StrictMode>
  );
}
