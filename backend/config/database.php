<?php
// ===================================================================
// CHAIZSTORE DATABASE CONNECTION ENGINE (PDO MySQL)
// Auto-detects local Laragon / XAMPP or production cPanel credentials
// Auto-initializes database & tables if not yet created!
// ===================================================================

$dbHost = getenv('DB_HOST') ?: '127.0.0.1';
$dbPort = getenv('DB_PORT') ?: '3306';
$dbName = getenv('DB_NAME') ?: 'chaizstore_db';
$dbUser = getenv('DB_USER') ?: 'root';
$dbPass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';

$pdo = null;

try {
    // 1. Sambungkan ke MySQL Server
    $dsn = "mysql:host={$dbHost};port={$dbPort};charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    // 2. Buat database jika belum ada
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
    $pdo->exec("USE `{$dbName}`;");

    // 3. Pastikan tabel inti sudah terbentuk otomatis (Self-Healing Migration)
    $pdo->exec("
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
    ");

    $pdo->exec("
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
    ");

    $pdo->exec("
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
    ");

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'Database Connection Error: ' . $e->getMessage()
    ]);
    exit;
}

function getDatabaseConnection() {
    global $pdo;
    return $pdo;
}
