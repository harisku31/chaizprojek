import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './itemku.css';
import './utils/firebase';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#f4f6fa',
          color: '#0f172a',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '540px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: '48px', color: '#ff5c00', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Terjadi Kendala Memuat Toko</h2>
            <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '20px' }}>
              Ada cache browser lama atau kendala data. Silakan klik tombol di bawah untuk menyegarkan tampilan.
            </p>
            <pre style={{
              background: '#fef2f2',
              color: '#ef4444',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '11.5px',
              textAlign: 'left',
              overflowX: 'auto',
              marginBottom: '20px'
            }}>
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem('chaiz_cart');
                  localStorage.removeItem('chaiz_products_database');
                } catch (e) {}
                window.location.reload();
              }}
              style={{
                background: '#0066ff',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              🔄 Refresh Halaman Toko
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
