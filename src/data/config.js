export const CONFIG = {
  storeName: "ChaizStore",
  adminWhatsApp: "6287795172347", // 087795172347
  currency: "Rp"
};

export const MEMBER_CREDENTIALS = [
  { username: "member", password: "123", name: "VIP Member", badge: "VIP Member" },
  { username: "admin", password: "123", name: "Admin Chaiz", badge: "VIP Member" },
  { username: "chaizz", password: "123", name: "Chaizz VIP", badge: "VIP Member" }
];

export const PAYMENT_INFO = {
  qris: {
    name: "QRIS Instant",
    badge: "Scan Langsung via QRIS Semua Bank & E-Wallet",
    desc: "Buka aplikasi Mobile Banking (BCA, Mandiri, BRI, BNI, Jago, dll) atau E-Wallet (DANA, GoPay, OVO, ShopeePay, LinkAja, dll), lalu scan QRIS di atas untuk menyelesaikan pembayaran otomatis."
  },
  ewallet: {
    name: "E-Wallet (081809730331)",
    badge: "Bisa scan QRIS di atas atau transfer langsung ke nomor E-Wallet berikut:",
    account: {
      label: "Nomor E-Wallet (DANA / OVO / GoPay / ShopeePay)",
      number: "081809730331",
      owner: "a/n ChaizStore"
    }
  },
  bank: {
    name: "Bank Muamalat (1410043224)",
    badge: "Bisa scan QRIS di atas atau transfer langsung ke Rekening Bank berikut:",
    account: {
      label: "Rekening Bank Muamalat",
      number: "1410043224",
      owner: "a/n ChaizStore"
    }
  }
};

export const CS_GEMINI_CONFIG = {
  apiKey:
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) ||
    "",
  models: [
    "gemini-flash-lite-latest",
    "gemini-3.6-flash",
    "gemini-3.8-flash",
    "gemini-flash-latest"
  ],
  apiEndpoint: "https://generativelanguage.googleapis.com/v1beta/models"
};

