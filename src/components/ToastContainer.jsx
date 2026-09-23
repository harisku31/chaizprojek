import React from 'react';

export default function ToastContainer({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" id="toastContainer">
      {toasts.map(toast => (
        <div key={toast.id} className="toast">
          <i className={`fa-solid ${toast.icon || 'fa-circle-check'}`}></i>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
