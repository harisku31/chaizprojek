import React from 'react';

export default function AnnouncementBar() {
  return (
    <div className="announcement-bar">
      <div className="container announcement-content">
        <span>
          <i className="fa-solid fa-bolt text-warning"></i> <strong>PROMO SPESIAL:</strong> Diskon hingga 70% akun premium all variant + Full Garansi!
        </span>
        <div className="announcement-right">
          <span><i className="fa-solid fa-clock"></i> Layanan 24/7 Fast Response</span>
        </div>
      </div>
    </div>
  );
}
