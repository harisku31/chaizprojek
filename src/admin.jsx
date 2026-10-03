import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from './components/AdminApp';
import './index.css';
import './admin.css';

const rootEl = document.getElementById('admin-root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <AdminApp />
    </React.StrictMode>
  );
}
