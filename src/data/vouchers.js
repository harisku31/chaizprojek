// Daftar voucher promo toko dikosongkan sesuai permintaan (semua voucher nonaktif)
export const VOUCHERS = [];

export function findVoucher(inputCode) {
  if (!inputCode) return null;
  const clean = inputCode.trim().toUpperCase().replace(/\s+/g, '');
  return (
    VOUCHERS.find(
      (v) => v.code === clean || (v.aliases && v.aliases.includes(clean))
    ) || null
  );
}

