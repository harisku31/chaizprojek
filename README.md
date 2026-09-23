# ChaizStore - Website JB Akun Premium (React.js + Vite)

Website profesional, modern, dan responsif untuk toko **Jual Beli (JB) Akun Premium** (Netflix, Spotify, YouTube Premium, Canva Pro, Gemini Advanced, CapCut Pro, Disney+ Hotstar, Vidio, Duolingo, dll.) dibangun menggunakan **React 18 & Vite**.

---

## ✨ Fitur Unggulan Website

1. **Arsitektur Berbasis Komponen React**:
   - Komponen modular: `Navbar`, `Hero`, `ProductCatalog`, `ProductCard`, `ProductModal`, `CheckoutModal`, `CartDrawer`, `LoginGateModal`, `CsChatWidget (Gemini AI)`, dan `ToastContainer`.
2. **Katalog Produk & Pencarian Pintar**:
   - Filter kategori cepat (Streaming, Musik, Produktivitas, AI, Utilitas).
   - Pencarian Desktop & Mobile dengan dropdown rekomendasi tag populer, auto-scroll, dan pointer pin animasi.
3. **Pilihan Paket Durasi & Varian**:
   - Pilihan durasi fleksibel (1 Bulan, 1 Tahun, 18 Bulan, dll.).
   - Perhitungan total otomatis dan status ketersediaan stok live.
4. **Keranjang Belanja Dinamis & Checkout Multi-Item**:
   - Keranjang belanja interaktif tersimpan di `localStorage`.
   - Checkout multi-item langsung dengan ringkasan tabel rapi.
5. **Metode Pembayaran QRIS & Bank**:
   - Support QRIS Otomatis All Bank & E-Wallet (BCA, Mandiri, DANA, GoPay, OVO, ShopeePay).
   - Tombol download gambar QRIS langsung.
   - Tombol salin nomor rekening instan.
   - Upload screenshot bukti transfer dengan tombol order otomatis ke WhatsApp.
6. **Sistem Login 2 Pilihan (Login Gate)**:
   - 👤 **Login Sebagai Chaiz**: Akses cepat langsung belanja akun tanpa password.
   - 👑 **Login Khusus Member**: Form verifikasi username & password member VIP (akun demo: `member` / `123`).
7. **Customer Service AI (Gemini Flash & Pro)**:
   - Widget chat interaktif bertenaga Google Gemini AI untuk menjawab pertanyaan seputar stok, cara beli, dan klaim garansi 24/7.

---

## 🚀 Cara Menjalankan Website (Mode Development)

Pastikan Node.js sudah terpasang di komputer Anda.

1. Buka PowerShell atau Terminal di folder ini:
   ```bash
   npm run dev
   ```
2. Buka URL lokal di browser (biasanya `http://localhost:3000` atau `http://localhost:5173`).

---

## 📦 Cara Build untuk Production / Hosting

Untuk membuat file statis siap upload ke server, Vercel, Netlify, atau cPanel:
```bash
npm run build
```
File hasil build akan berada di dalam folder `dist/`.

---

## ⚙️ Cara Kustomisasi & Pengaturan Toko

### 1. Mengganti Nomor WhatsApp & Konfigurasi Toko
Buka file `src/data/config.js`:
```javascript
export const CONFIG = {
  storeName: "ChaizStore",
  adminWhatsApp: "6287795172347", // Ganti dengan nomor WhatsApp Admin Anda
  currency: "Rp"
};
```

### 2. Mengubah / Menambah Akun Produk
Buka file `src/data/products.js`. Anda dapat mengedit daftar produk, durasi paket, harga, garansi, serta stok.

### 3. Backup File Lama
File versi Vanilla HTML/JS asli disimpan dengan aman di folder `_backup_vanilla/`.
