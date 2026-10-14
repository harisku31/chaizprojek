-- ===================================================================
-- CHAIZSTORE RELATIONAL DATABASE SCHEMA (MySQL 8.x / MariaDB)
-- 100% Strict User-Order Isolation (1 User = 1 Riwayat Privat)
-- ===================================================================

CREATE DATABASE IF NOT EXISTS `chaizstore_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `chaizstore_db`;

-- 1. TABEL PENGGUNA (USERS)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_key` VARCHAR(64) NOT NULL UNIQUE,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `name` VARCHAR(191) NOT NULL,
  `picture` TEXT NULL,
  `role` ENUM('user', 'member', 'admin') DEFAULT 'user',
  `is_banned` TINYINT(1) DEFAULT 0,
  `ban_reason` TEXT NULL,
  `last_login` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_email` (`email`),
  INDEX `idx_user_key` (`user_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABEL TRANSAKSI / PESANAN (TRANSACTIONS)
-- Relasi mutlak: user_email dan user_id diindeks agar query WHERE user_email = ? instan (<1ms)
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NULL,
  `user_key` VARCHAR(64) NULL,
  `user_email` VARCHAR(191) NOT NULL,
  `product_id` VARCHAR(64) NULL,
  `product_name` VARCHAR(191) NOT NULL,
  `product_duration` VARCHAR(64) DEFAULT 'Reguler',
  `product_category` VARCHAR(64) DEFAULT 'Akun Premium',
  `price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `qty` INT NOT NULL DEFAULT 1,
  `total` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `customer_username` VARCHAR(100) NULL,
  `customer_name` VARCHAR(191) NOT NULL,
  `customer_email` VARCHAR(191) NOT NULL,
  `customer_phone` VARCHAR(50) NULL,
  `payment_method` VARCHAR(100) DEFAULT 'QRIS Instant',
  `proof_url` LONGTEXT NULL,
  `proof_file_name` VARCHAR(191) NULL,
  `proof_size` VARCHAR(50) NULL,
  `proof_uploaded_at` DATETIME NULL,
  `proof_expires_at` DATETIME NULL,
  `proof_expired` TINYINT(1) DEFAULT 0,
  `warranty_period` VARCHAR(100) DEFAULT 'Garansi Penuh',
  `status` ENUM('processing', 'completed', 'cancelled') DEFAULT 'processing',
  `credentials` JSON NULL,
  `admin_note` TEXT NULL,
  `processed_at` DATETIME NULL,
  `rating` JSON NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_trx_user_email` (`user_email`),
  INDEX `idx_trx_customer_email` (`customer_email`),
  INDEX `idx_trx_user_id` (`user_id`),
  INDEX `idx_trx_status` (`status`),
  INDEX `idx_trx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABEL ULASAN & TESTIMONI (REVIEWS)
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `transaction_id` VARCHAR(64) NULL,
  `name` VARCHAR(191) NOT NULL,
  `role` VARCHAR(191) DEFAULT 'Pelanggan ChaizStore',
  `stars` TINYINT NOT NULL DEFAULT 5,
  `text` TEXT NOT NULL,
  `date` VARCHAR(50) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_review_stars` (`stars`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. CONTOH DATA AWAL TESTIMONI RESMI
INSERT INTO `reviews` (`id`, `name`, `role`, `stars`, `text`, `date`) VALUES
('REV-1', 'Dimas Pratama', 'Pelanggan Netflix & Spotify', 5, 'Gokil cepet banget pelayanannya! Transfer QRIS, 2 menit kemudian akun Netflix udah dikirim dan langsung bisa nonton 4K bareng keluarga. Garansinya beneran aman.', '3 Okt 2026'),
('REV-2', 'Siti Rahmawati', 'Freelance Designer - Canva Pro', 5, 'Langganan Canva Pro di sini hemat banyak buat tugas kuliah dan desain freelance. Udah 6 bulan lancar jaya no kendala. Pasti bakal repurchase terus di sini.', '3 Okt 2026')
ON DUPLICATE KEY UPDATE `id` = `id`;
