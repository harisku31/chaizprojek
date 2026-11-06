import React from 'react';

/**
 * Logo Resmi QRIS (Quick Response Code Indonesian Standard)
 */
export function QrisLogo({ className = '', style = {} }) {
  return (
    <span
      className={`qris-brand-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        padding: '3px 8px',
        borderRadius: '6px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
        border: '1px solid #e2e8f0',
        ...style
      }}
    >
      <svg
        viewBox="0 0 100 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '68px', height: '24px', display: 'block' }}
      >
        {/* QRIS Red Accent Geometric Top Corner */}
        <path d="M4 2H16V14H4V2Z" fill="#EE2737" />
        <path d="M7 5H13V11H7V5Z" fill="#FFFFFF" />
        <path d="M9 7H11V9H9V7Z" fill="#EE2737" />
        
        {/* QRIS Text */}
        <text
          x="22"
          y="15"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="16"
          fill="#1E293B"
          letterSpacing="0.8"
        >
          QRIS
        </text>
        <text
          x="22"
          y="25"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="700"
          fontSize="6.2"
          fill="#EE2737"
          letterSpacing="0.4"
        >
          INDONESIA
        </text>
      </svg>
    </span>
  );
}

/**
 * Logo Resmi GoPay Indonesia
 */
export function GopayLogo({ className = '', style = {} }) {
  return (
    <span
      className={`gopay-brand-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#00AED6',
        padding: '4px 10px',
        borderRadius: '6px',
        boxShadow: '0 1px 4px rgba(0,174,214,0.3)',
        ...style
      }}
    >
      <svg
        viewBox="0 0 95 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '66px', height: '20px', display: 'block' }}
      >
        {/* GoPay Iconic Disc */}
        <circle cx="12" cy="14" r="10" fill="#FFFFFF" />
        <circle cx="12" cy="14" r="4.5" fill="#00AED6" />
        
        {/* GoPay Bold Text */}
        <text
          x="28"
          y="19"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="17"
          fill="#FFFFFF"
          letterSpacing="-0.3"
        >
          gopay
        </text>
      </svg>
    </span>
  );
}
