<?php
// ===================================================================
// FIREBASE -> MYSQL ONE-TIME DATA MIGRATOR
// Migrates transactions and customer reviews from Firebase to MySQL
// ===================================================================

require_once __DIR__ . '/config/database.php';

$pdo = getDatabaseConnection();
$firebaseUrl = 'https://chaizstore-default-rtdb.asia-southeast1.firebasedatabase.app';

function toSqlDate($str) {
    if (empty($str)) return null;
    $time = strtotime($str);
    if (!$time) return null;
    return date('Y-m-d H:i:s', $time);
}

echo "1. Migrating Transactions from Firebase to MySQL...\n";
$trxJson = @file_get_contents("{$firebaseUrl}/transactions.json");
if ($trxJson) {
    $trxs = json_decode($trxJson, true);
    if (is_array($trxs)) {
        $stmt = $pdo->prepare("
            INSERT INTO transactions (
                id, user_id, user_key, user_email, product_id, product_name, product_duration,
                product_category, price, qty, total, customer_username, customer_name,
                customer_email, customer_phone, payment_method, proof_url, proof_file_name,
                proof_size, proof_uploaded_at, proof_expires_at, warranty_period, status,
                credentials, admin_note, processed_at, rating, is_read, created_at
            ) VALUES (
                :id, :user_id, :user_key, :user_email, :product_id, :product_name, :product_duration,
                :product_category, :price, :qty, :total, :customer_username, :customer_name,
                :customer_email, :customer_phone, :payment_method, :proof_url, :proof_file_name,
                :proof_size, :proof_uploaded_at, :proof_expires_at, :warranty_period, :status,
                :credentials, :admin_note, :processed_at, :rating, :is_read, :created_at
            ) ON DUPLICATE KEY UPDATE
                status = VALUES(status),
                credentials = VALUES(credentials),
                admin_note = VALUES(admin_note),
                processed_at = VALUES(processed_at),
                rating = VALUES(rating),
                updated_at = CURRENT_TIMESTAMP
        ");

        $count = 0;
        foreach ($trxs as $id => $t) {
            if (!$t) continue;
            $userEmail = !empty($t['userEmail']) ? strtolower(trim($t['userEmail'])) : '';
            $customerEmail = !empty($t['customerEmail']) ? strtolower(trim($t['customerEmail'])) : '';
            if (empty($userEmail) && !empty($customerEmail) && $customerEmail !== '-') {
                $userEmail = $customerEmail;
            }
            if (empty($customerEmail) && !empty($userEmail)) {
                $customerEmail = $userEmail;
            }
            if (empty($userEmail)) {
                $userEmail = 'guest@chaizstore.com';
            }

            $stmt->execute([
                ':id'                => $t['id'] ?? $id,
                ':user_id'           => $t['userId'] ?? null,
                ':user_key'          => $t['userKey'] ?? null,
                ':user_email'        => $userEmail,
                ':product_id'        => $t['productId'] ?? null,
                ':product_name'      => $t['productName'] ?? 'Akun Digital',
                ':product_duration'  => $t['productDuration'] ?? 'Reguler',
                ':product_category'  => $t['productCategory'] ?? 'Akun Premium',
                ':price'             => $t['price'] ?? 0,
                ':qty'               => $t['qty'] ?? 1,
                ':total'             => $t['total'] ?? 0,
                ':customer_username' => $t['customerUsername'] ?? '',
                ':customer_name'     => $t['customerName'] ?? 'Pelanggan Chaiz',
                ':customer_email'    => $customerEmail,
                ':customer_phone'    => $t['customerPhone'] ?? '',
                ':payment_method'    => $t['paymentMethod'] ?? 'QRIS Instant',
                ':proof_url'         => $t['proofUrl'] ?? null,
                ':proof_file_name'   => $t['proofFileName'] ?? null,
                ':proof_size'        => $t['proofSize'] ?? null,
                ':proof_uploaded_at' => toSqlDate($t['proofUploadedAt'] ?? null),
                ':proof_expires_at'  => toSqlDate($t['proofExpiresAt'] ?? null),
                ':warranty_period'   => $t['warrantyPeriod'] ?? 'Garansi Penuh',
                ':status'            => $t['status'] ?? 'processing',
                ':credentials'       => isset($t['credentials']) ? json_encode($t['credentials']) : null,
                ':admin_note'        => $t['adminNote'] ?? '',
                ':processed_at'      => toSqlDate($t['processedAt'] ?? null),
                ':rating'            => isset($t['rating']) ? json_encode($t['rating']) : null,
                ':is_read'           => !empty($t['isRead']) ? 1 : 0,
                ':created_at'        => toSqlDate($t['createdAt'] ?? null) ?: date('Y-m-d H:i:s')
            ]);
            $count++;
            echo "   [+] Imported order: {$id} ({$t['productName']} - {$userEmail})\n";
        }
        echo "   Done! {$count} transactions migrated to MySQL.\n";
    }
}

echo "\n2. Migrating Customer Reviews from Firebase to MySQL...\n";
$revJson = @file_get_contents("{$firebaseUrl}/customer_reviews.json");
if ($revJson) {
    $revs = json_decode($revJson, true);
    if (is_array($revs)) {
        $stmtRev = $pdo->prepare("
            INSERT INTO reviews (id, transaction_id, name, role, stars, text, date)
            VALUES (:id, :transaction_id, :name, :role, :stars, :text, :date)
            ON DUPLICATE KEY UPDATE text = VALUES(text)
        ");
        $revCount = 0;
        foreach ($revs as $k => $r) {
            if (!$r) continue;
            $stmtRev->execute([
                ':id'             => $r['id'] ?? "REV-{$k}",
                ':transaction_id' => $r['transactionId'] ?? null,
                ':name'           => $r['name'] ?? 'Pelanggan Setia',
                ':role'           => $r['role'] ?? 'Pelanggan ChaizStore',
                ':stars'          => $r['stars'] ?? 5,
                ':text'           => $r['text'] ?? '',
                ':date'           => $r['date'] ?? date('d M Y')
            ]);
            $revCount++;
        }
        echo "   Done! {$revCount} reviews migrated to MySQL.\n";
    }
}

echo "\n=== Migration Completed Successfully! ===\n";
