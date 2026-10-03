import React from 'react';
import SteamKeyModal from './SteamKeyModal';

export default function TopUpModal({
  isOpen,
  onClose,
  onShowToast,
  authUser,
  isBanned = false,
  onOpenLogin,
  onOpenBannedModal
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
      initialKeyId="original"
    />
  );
}
