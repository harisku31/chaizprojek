export const VOUCHERS = [
  {
    code: 'DISKON2K',
    aliases: ['DISKON2000', 'POTONGAN2K', 'CHAIZ2K', 'HEMAT2K', 'POTONGAN2000'],
    name: 'Potongan Rp 2.000',
    description: 'Potongan langsung Rp 2.000 untuk total tagihan belanja.',
    type: 'discount',
    discountAmount: 2000,
    badge: 'Diskon Rp 2.000',
    icon: 'fa-solid fa-tag',
    color: '#06b6d4'
  },
  {
    code: 'DISKON1K',
    aliases: ['DISKON1000', 'POTONGAN1K', 'CHAIZ1K', 'HEMAT1K', 'POTONGAN1000'],
    name: 'Potongan Rp 1.000',
    description: 'Potongan langsung Rp 1.000 untuk total tagihan belanja.',
    type: 'discount',
    discountAmount: 1000,
    badge: 'Diskon Rp 1.000',
    icon: 'fa-solid fa-receipt',
    color: '#3b82f6'
  },
  {
    code: 'DISKON5K',
    aliases: ['DISKON5000', 'POTONGAN5K', 'CHAIZ5K', 'HEMAT5K', 'POTONGAN5000'],
    name: 'Potongan Rp 5.000',
    description: 'Potongan spesial Rp 5.000 untuk total tagihan belanja.',
    type: 'discount',
    discountAmount: 5000,
    badge: 'Diskon Rp 5.000',
    icon: 'fa-solid fa-fire',
    color: '#f59e0b'
  },
  {
    code: 'BONUSPREMIUM',
    aliases: ['CHAIZBONUS', 'FREEITEM', 'CANVA', 'YOUTUBE', 'BONUS1ITEM', 'HADIAH'],
    name: 'Gratis 1 Akun Premium',
    description: 'Dapatkan 1 item akun premium gratis (Canva Pro atau YouTube Premium).',
    type: 'free_item',
    discountAmount: 0,
    bonusOptions: [
      { id: 'canva', name: 'Canva Pro (1 Bulan)' },
      { id: 'youtube', name: 'YouTube Premium (1 Bulan)' }
    ],
    badge: 'Gratis 1 Akun Premium',
    icon: 'fa-solid fa-gift',
    color: '#a855f7'
  },
  {
    code: 'FULLGRATIS',
    aliases: ['CHAIZGRATIS', 'GRATIS', 'FREE', 'FREEALL', 'GRATIS100', 'CHAIZFREE'],
    name: 'Full Gratis 100%',
    description: 'Seluruh total tagihan pesanan menjadi Rp 0 (Full Gratis).',
    type: 'full_free',
    discountAmount: 0, // dynamic: 100% of total
    badge: 'Full Gratis 100%',
    icon: 'fa-solid fa-crown',
    color: '#10b981'
  }
];

export function findVoucher(inputCode) {
  if (!inputCode) return null;
  const clean = inputCode.trim().toUpperCase().replace(/\s+/g, '');
  return (
    VOUCHERS.find(
      (v) => v.code === clean || (v.aliases && v.aliases.includes(clean))
    ) || null
  );
}
