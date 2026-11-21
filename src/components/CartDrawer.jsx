import React from 'react';
import { formatRupiah } from '../utils/format';

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onCheckout
}) {
  if (!isOpen) return null;

  const total = items.reduce((acc, curr) => acc + (curr.price || 0), 0);

  return (
    <div
      className={`cart-drawer-overlay active`}
      id="cartDrawerOverlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cart-drawer">
        <div className="cart-drawer-header">
          <h3>
            <i className="fa-solid fa-bag-shopping"></i> Keranjang Belanja
          </h3>
          <button className="close-cart-btn" onClick={onClose} aria-label="Tutup Keranjang">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="cart-drawer-body">
          {items.length === 0 ? (
            <div className="empty-cart-msg">
              <i className="fa-solid fa-basket-shopping"></i>
              <p>Keranjang kamu masih kosong</p>
              <a href="#katalog" className="btn btn-sm btn-outline" onClick={onClose}>
                Belanja Sekarang
              </a>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <h4>{item.productName}</h4>
                  <span>
                    {item.durationName} &bull; {item.viaType}
                  </span>
                  <div className="cart-item-price">{formatRupiah(item.price)}</div>
                </div>
                <button
                  type="button"
                  className="remove-cart-item"
                  onClick={() => onRemoveItem(item.id)}
                  title="Hapus item"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-total-row">
              <span>Subtotal:</span>
              <span className="cart-total-price">{formatRupiah(total)}</span>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={onCheckout}
            >
              <i className="fa-solid fa-credit-card"></i> Lanjut Checkout Pesanan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
