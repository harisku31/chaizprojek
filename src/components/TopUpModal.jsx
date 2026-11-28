import React from 'react';
import SteamKeyModal from './SteamKeyModal';

export default function TopUpModal({
  isOpen,
  onClose,
  onShowToast,
  authUser,
  isBanned = false,
  onOpenLogin,
  onOpenBannedModal,
  onAddToCart,
  onProceedCheckout
}) {
  return (
    <SteamKeyModal
      isOpen={isOpen}
      onClose={onClose}
      onShowToast={onShowToast}
      authUser={authUser}
      isBanned={isBanned}
      onOpenLogin={onOpenLogin}
      onOpenBannedModal={onOpenBannedModal}
      onAddToCart={onAddToCart}
      onProceedCheckout={onProceedCheckout}
      initialKeyId="original"
    />
  );
}
