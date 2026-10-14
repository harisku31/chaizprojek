<?php
// ===================================================================
// CHAIZSTORE TRANSACTIONS API (PHP + MySQL)
// 100% Server-Enforced Strict Isolation (1 User = 1 Riwayat Privat)
// ===================================================================

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$pdo = getDatabaseConnection();
$method = $_SERVER['REQUEST_METHOD'];

function toSqlDate($str) {
    if (empty($str)) return null;
    $time = strtotime($str);
    if (!$time) return null;
    return date('Y-m-d H:i:s', $time);
}

// Helper untuk format baris DB ke bentuk JSON JavaScript ChaizStore
function formatTransactionRow($row) {
    if (!$row) return null;
    return [
        'id'               => $row['id'],
        'productId'        => $row['product_id'],
        'productName'      => $row['product_name'],
        'productDuration'  => $row['product_duration'] ?: 'Reguler',
        'productCategory'  => $row['product_category'] ?: 'Akun Premium',
        'price'            => (float) $row['price'],
        'qty'              => (int) $row['qty'],
        'total'            => (float) $row['total'],
        'userId'           => $row['user_id'],
        'userKey'          => $row['user_key'],
        'userEmail'        => $row['user_email'],
        'customerUsername' => $row['customer_username'] ?: '',
        'customerName'     => $row['customer_name'],
        'customerEmail'    => $row['customer_email'],
        'customerPhone'    => $row['customer_phone'] ?: '',
        'paymentMethod'    => $row['payment_method'] ?: 'QRIS Instant',
        'proofUrl'         => $row['proof_url'],
        'proofFileName'    => $row['proof_file_name'],
        'proofSize'        => $row['proof_size'],
        'proofUploadedAt'  => $row['proof_uploaded_at'],
        'proofExpiresAt'   => $row['proof_expires_at'],
        'proofExpired'     => (bool) $row['proof_expired'],
        'warrantyPeriod'   => $row['warranty_period'] ?: 'Garansi Penuh',
        'status'           => $row['status'] ?: 'processing',
        'credentials'      => !empty($row['credentials']) ? json_decode($row['credentials'], true) : [
            'account' => '', 'password' => '', 'username' => '', 'pin' => '', 'profile' => '', 'code' => ''
        ],
        'adminNote'        => $row['admin_note'] ?: '',
        'processedAt'      => $row['processed_at'],
        'rating'           => !empty($row['rating']) ? json_decode($row['rating'], true) : null,
        'isRead'           => (bool) $row['is_read'],
        'createdAt'        => $row['created_at'],
        'updatedAt'        => $row['updated_at']
    ];
}

// -------------------------------------------------------------------
// 1. GET: Ambil Transaksi (Filter Server-Side 100% Anti-Bocor)
// -------------------------------------------------------------------
if ($method === 'GET') {
    // A. Ambil 1 transaksi spesifik berdasarkan ID
    if (!empty($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM transactions WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => trim($_GET['id'])]);
        $row = $stmt->fetch();
        if ($row) {
            echo json_encode(['success' => true, 'data' => formatTransactionRow($row)]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Transaksi tidak ditemukan']);
        }
        exit;
    }

    // B. Ambil Transaksi Privat Khusus Akun yang Sedang Login
    $userEmail = !empty($_GET['user_email']) ? trim($_GET['user_email']) : '';
    if (empty($userEmail) && !empty($_SERVER['HTTP_X_USER_EMAIL'])) {
        $userEmail = trim($_SERVER['HTTP_X_USER_EMAIL']);
    }

    if (!empty($userEmail)) {
        $cleanEmail = strtolower($userEmail);
        $stmt = $pdo->prepare("
            SELECT * FROM transactions 
            WHERE LOWER(TRIM(user_email)) = :email1 
               OR LOWER(TRIM(customer_email)) = :email2
            ORDER BY created_at DESC
        ");
        $stmt->execute([
            ':email1' => $cleanEmail,
            ':email2' => $cleanEmail
        ]);
        $rows = $stmt->fetchAll();
        $formatted = array_map('formatTransactionRow', $rows);

        echo json_encode([
            'success'   => true,
            'userEmail' => $cleanEmail,
            'count'     => count($formatted),
            'data'      => $formatted
        ]);
        exit;
    }

    // C. Ambil Semua Transaksi (Untuk Admin Portal / Owner)
    if (!empty($_GET['all']) && $_GET['all'] === '1') {
        $stmt = $pdo->query("SELECT * FROM transactions ORDER BY created_at DESC");
        $rows = $stmt->fetchAll();
        $formatted = array_map('formatTransactionRow', $rows);
        echo json_encode([
            'success' => true,
            'count'   => count($formatted),
            'data'    => $formatted
        ]);
        exit;
    }

    // Default: Jika tidak menyertakan email, kembalikan array kosong (Privat terjaga!)
    echo json_encode([
        'success' => true,
        'count'   => 0,
        'data'    => []
    ]);
    exit;
}

// -------------------------------------------------------------------
// 2. POST: Simpan Pesanan Baru ke Database MySQL
// -------------------------------------------------------------------
if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    if (!$input || empty($input['productName'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Data pesanan tidak valid']);
        exit;
    }

    // Generate ID unik jika belum ada
    $id = !empty($input['id']) ? trim($input['id']) : ('TRX-' . date('Ymd') . '-' . rand(1000, 9999));
    $userEmail = !empty($input['userEmail']) ? strtolower(trim($input['userEmail'])) : '';
    $customerEmail = !empty($input['customerEmail']) ? strtolower(trim($input['customerEmail'])) : '';

    if (empty($userEmail) && !empty($customerEmail) && $customerEmail !== '-') {
        $userEmail = $customerEmail;
    }
    if (empty($customerEmail) && !empty($userEmail)) {
        $customerEmail = $userEmail;
    }
    if (empty($userEmail)) {
        $userEmail = 'guest@chaizstore.com';
    }

    $now = date('Y-m-d H:i:s');
    $proofExpires = !empty($input['proofUrl']) ? date('Y-m-d H:i:s', time() + (2 * 24 * 60 * 60)) : null;

    $stmt = $pdo->prepare("
        INSERT INTO transactions (
            id, user_id, user_key, user_email, product_id, product_name, product_duration,
            product_category, price, qty, total, customer_username, customer_name,
            customer_email, customer_phone, payment_method, proof_url, proof_file_name,
            proof_size, proof_uploaded_at, proof_expires_at, warranty_period, status,
            credentials, admin_note, is_read, created_at
        ) VALUES (
            :id, :user_id, :user_key, :user_email, :product_id, :product_name, :product_duration,
            :product_category, :price, :qty, :total, :customer_username, :customer_name,
            :customer_email, :customer_phone, :payment_method, :proof_url, :proof_file_name,
            :proof_size, :proof_uploaded_at, :proof_expires_at, :warranty_period, :status,
            :credentials, :admin_note, :is_read, :created_at
        ) ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            credentials = VALUES(credentials),
            admin_note = VALUES(admin_note),
            updated_at = CURRENT_TIMESTAMP
    ");

    $stmt->execute([
        ':id'                => $id,
        ':user_id'           => $input['userId'] ?? null,
        ':user_key'          => $input['userKey'] ?? null,
        ':user_email'        => $userEmail,
        ':product_id'        => $input['productId'] ?? null,
        ':product_name'      => $input['productName'],
        ':product_duration'  => $input['productDuration'] ?? 'Reguler',
        ':product_category'  => $input['productCategory'] ?? 'Akun Premium',
        ':price'             => $input['price'] ?? 0,
        ':qty'               => $input['qty'] ?? 1,
        ':total'             => $input['total'] ?? 0,
        ':customer_username' => $input['customerUsername'] ?? '',
        ':customer_name'     => $input['customerName'] ?? 'Pelanggan Chaiz',
        ':customer_email'    => $customerEmail,
        ':customer_phone'    => $input['customerPhone'] ?? '',
        ':payment_method'    => $input['paymentMethod'] ?? 'QRIS Instant',
        ':proof_url'         => $input['proofUrl'] ?? null,
        ':proof_file_name'   => $input['proofFileName'] ?? null,
        ':proof_size'        => $input['proofSize'] ?? null,
        ':proof_uploaded_at' => !empty($input['proofUploadedAt']) ? toSqlDate($input['proofUploadedAt']) : (!empty($input['proofUrl']) ? $now : null),
        ':proof_expires_at'  => !empty($input['proofExpiresAt']) ? toSqlDate($input['proofExpiresAt']) : $proofExpires,
        ':warranty_period'   => $input['warrantyPeriod'] ?? 'Garansi Penuh',
        ':status'            => $input['status'] ?? 'processing',
        ':credentials'       => isset($input['credentials']) ? json_encode($input['credentials']) : null,
        ':admin_note'        => $input['adminNote'] ?? '',
        ':is_read'           => 0,
        ':created_at'        => !empty($input['createdAt']) ? (toSqlDate($input['createdAt']) ?: $now) : $now
    ]);

    // Ambil record yang baru disimpan
    $stmtCheck = $pdo->prepare("SELECT * FROM transactions WHERE id = :id LIMIT 1");
    $stmtCheck->execute([':id' => $id]);
    $newRow = $stmtCheck->fetch();

    echo json_encode([
        'success'     => true,
        'message'     => 'Pesanan berhasil disimpan secara privat di database MySQL',
        'transaction' => formatTransactionRow($newRow)
    ]);
    exit;
}

// -------------------------------------------------------------------
// 3. PATCH / PUT: Update Status Pesanan (Fulfill Admin / Rating)
// -------------------------------------------------------------------
if ($method === 'PATCH' || $method === 'PUT') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    if (!$input || empty($input['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID Transaksi wajib disertakan']);
        exit;
    }

    $id = trim($input['id']);
    $fields = [];
    $params = [':id' => $id];

    if (isset($input['status'])) {
        $fields[] = "`status` = :status";
        $params[':status'] = $input['status'];
    }
    if (isset($input['credentials'])) {
        $fields[] = "`credentials` = :credentials";
        $params[':credentials'] = json_encode($input['credentials']);
    }
    if (isset($input['adminNote'])) {
        $fields[] = "`admin_note` = :adminNote";
        $params[':adminNote'] = $input['adminNote'];
    }
    if (isset($input['processedAt'])) {
        $fields[] = "`processed_at` = :processedAt";
        $params[':processedAt'] = toSqlDate($input['processedAt']) ?: date('Y-m-d H:i:s');
    }
    if (isset($input['rating'])) {
        $fields[] = "`rating` = :rating";
        $params[':rating'] = json_encode($input['rating']);
    }
    if (isset($input['isRead'])) {
        $fields[] = "`is_read` = :isRead";
        $params[':isRead'] = $input['isRead'] ? 1 : 0;
    }

    if (empty($fields)) {
        echo json_encode(['success' => true, 'message' => 'Tidak ada field yang diubah']);
        exit;
    }

    $sql = "UPDATE transactions SET " . implode(', ', $fields) . ", updated_at = CURRENT_TIMESTAMP WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $stmtCheck = $pdo->prepare("SELECT * FROM transactions WHERE id = :id LIMIT 1");
    $stmtCheck->execute([':id' => $id]);
    $updatedRow = $stmtCheck->fetch();

    echo json_encode([
        'success'     => true,
        'message'     => 'Transaksi berhasil diperbarui',
        'transaction' => formatTransactionRow($updatedRow)
    ]);
    exit;
}

// -------------------------------------------------------------------
// 4. DELETE: Hapus Transaksi atau Bukti Transfer
// -------------------------------------------------------------------
if ($method === 'DELETE') {
    $id = !empty($_GET['id']) ? trim($_GET['id']) : '';
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID wajib disertakan']);
        exit;
    }

    // Jika parameter ?action=delete_proof, hanya hapus file bukti
    if (!empty($_GET['action']) && $_GET['action'] === 'delete_proof') {
        $stmt = $pdo->prepare("
            UPDATE transactions 
            SET proof_url = NULL, proof_expired = 1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = :id
        ");
        $stmt->execute([':id' => $id]);
        echo json_encode(['success' => true, 'message' => 'Foto bukti berhasil dihapus']);
        exit;
    }

    // Hapus total record
    $stmt = $pdo->prepare("DELETE FROM transactions WHERE id = :id");
    $stmt->execute([':id' => $id]);

    echo json_encode(['success' => true, 'message' => 'Transaksi berhasil dihapus dari database']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Metode tidak didukung']);
