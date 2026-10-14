# Panduan Backend PHP + MySQL ChaizStore 🚀

Backend ini dirancang khusus untuk memastikan **1 Akun = 1 Riwayat Transaksi Privat** menggunakan database relasional MySQL. Tidak ada lagi resiko pesanan bocor atau tertukar antar akun Google / email.

---

## 📁 Struktur Folder Backend

```text
backend/
├── api/
│   ├── transactions.php   # API Utama: Get pesanan privat akun, create order, fulfill admin, rating
│   ├── auth.php           # API Sinkronisasi profil user (Google & Member)
│   └── reviews.php        # API Testimoni & ulasan pelanggan
├── config/
│   ├── database.php       # Koneksi PDO MySQL (Auto-create database & tabel otomatis)
│   └── cors.php           # Header keamanan CORS untuk frontend React
├── database.sql           # File dump skema database MySQL lengkap (Users, Transactions, Reviews)
├── migrate_from_firebase.php # Script satu kali untuk migrasi data lama dari Firebase ke MySQL
└── verify.php             # Script CLI untuk cek status tabel & koneksi database
```

---

## 🛠️ Cara Menjalankan di Lokal (Laragon / XAMPP)

1. **Pastikan MySQL Aktif:**
   - Buka **Laragon** lalu klik **Start All** (MySQL port `3306`).
2. **Jalankan Server PHP:**
   Buka terminal di root project dan jalankan:
   ```bash
   php -S 127.0.0.1:8000 -t backend/
   ```
   API sekarang aktif di `http://127.0.0.1:8000/api/transactions.php`.
3. **Cek Koneksi:**
   Buka browser dan akses:
   ```text
   http://127.0.0.1:8000/api/transactions.php?all=1
   ```
   Akan langsung muncul JSON semua pesanan dari MySQL!

---

## 🌐 Cara Upload ke Hosting cPanel (Hostinger, Niagahoster, dll)

1. **Buat Database di cPanel:**
   - Masuk ke cPanel ➡️ **MySQL Databases**.
   - Buat database baru, contoh: `u12345_chaizstore`.
   - Buat user database & password, lalu hubungkan user ke database dengan checklist **ALL PRIVILEGES**.
2. **Import `database.sql`:**
   - Masuk ke **phpMyAdmin** di cPanel.
   - Pilih database Anda, klik tab **Import**, pilih file `backend/database.sql`, lalu klik **Go**.
3. **Upload Folder `backend`:**
   - Di **File Manager** cPanel, upload isi folder `backend/` ke folder `public_html/api` (atau subdomain `api.namadomainkamu.com`).
4. **Atur Koneksi di `config/database.php`:**
   Ubah baris konfigurasi berikut sesuai database cPanel Anda:
   ```php
   $dbHost = 'localhost';
   $dbName = 'u12345_chaizstore';
   $dbUser = 'u12345_userchaiz';
   $dbPass = 'PasswordDatabaseKamu123';
   ```

---

## 🔒 Jaminan Keamanan Isolasi 1 Akun 1 Riwayat:
Penyaringan data tidak lagi dilakukan di browser pelanggan, melainkan diproses langsung oleh MySQL dengan prepared statement:
```sql
SELECT * FROM transactions 
WHERE LOWER(TRIM(user_email)) = :email 
   OR LOWER(TRIM(customer_email)) = :email
ORDER BY created_at DESC;
```
Ketika Akun A meminta riwayat, server MySQL **hanya** mengirim pesanan milik Akun A. Akun baru dengan email berbeda dijamin mendapatkan `count: 0` (kosong total).
