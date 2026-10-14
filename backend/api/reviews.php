<?php
// ===================================================================
// CHAIZSTORE CUSTOMER REVIEWS API (PHP + MySQL)
// ===================================================================

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$pdo = getDatabaseConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM reviews ORDER BY created_at DESC LIMIT 50");
    $reviews = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'count'   => count($reviews),
        'data'    => $reviews
    ]);
    exit;
}

if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    if (!$input || empty($input['text']) || empty($input['name'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Nama dan ulasan wajib diisi']);
        exit;
    }

    $id = !empty($input['id']) ? trim($input['id']) : ('REV-' . time() . '-' . rand(100, 999));
    $name = trim($input['name']);
    $role = !empty($input['role']) ? trim($input['role']) : 'Pelanggan Setia';
    $stars = !empty($input['stars']) ? (int) $input['stars'] : 5;
    $text = trim($input['text']);
    $date = !empty($input['date']) ? trim($input['date']) : date('d M Y');
    $trxId = !empty($input['transactionId']) ? trim($input['transactionId']) : null;

    $stmt = $pdo->prepare("
        INSERT INTO reviews (id, transaction_id, name, role, stars, text, date)
        VALUES (:id, :transaction_id, :name, :role, :stars, :text, :date)
        ON DUPLICATE KEY UPDATE
            text = VALUES(text),
            stars = VALUES(stars)
    ");

    $stmt->execute([
        ':id'             => $id,
        ':transaction_id' => $trxId,
        ':name'           => $name,
        ':role'           => $role,
        ':stars'          => $stars,
        ':text'           => $text,
        ':date'           => $date
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Ulasan berhasil disimpan',
        'data'    => [
            'id'    => $id,
            'name'  => $name,
            'role'  => $role,
            'stars' => $stars,
            'text'  => $text,
            'date'  => $date
        ]
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Metode tidak didukung']);
