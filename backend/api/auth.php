<?php
// ===================================================================
// CHAIZSTORE USER & AUTH API (PHP + MySQL)
// ===================================================================

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$pdo = getDatabaseConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    if (!$input || empty($input['email'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Email wajib diisi']);
        exit;
    }

    $email = strtolower(trim($input['email']));
    $name = !empty($input['name']) ? trim($input['name']) : 'Pengguna';
    $userKey = !empty($input['userKey']) ? trim($input['userKey']) : ('usr_' . substr(md5($email), 0, 8));
    $picture = !empty($input['picture']) ? trim($input['picture']) : null;
    $role = !empty($input['role']) ? trim($input['role']) : 'user';

    $stmt = $pdo->prepare("
        INSERT INTO users (user_key, email, name, picture, role, last_login)
        VALUES (:user_key, :email, :name, :picture, :role, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            picture = COALESCE(VALUES(picture), picture),
            last_login = CURRENT_TIMESTAMP
    ");

    $stmt->execute([
        ':user_key' => $userKey,
        ':email'    => $email,
        ':name'     => $name,
        ':picture'  => $picture,
        ':role'     => $role
    ]);

    $stmtGet = $pdo->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
    $stmtGet->execute([':email' => $email]);
    $userRow = $stmtGet->fetch();

    echo json_encode([
        'success' => true,
        'user'    => $userRow
    ]);
    exit;
}

if ($method === 'GET') {
    if (!empty($_GET['email'])) {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = :email LIMIT 1");
        $stmt->execute([':email' => strtolower(trim($_GET['email']))]);
        $user = $stmt->fetch();
        if ($user) {
            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            echo json_encode(['success' => false, 'error' => 'User tidak ditemukan']);
        }
        exit;
    }

    // List all users for admin
    $stmt = $pdo->query("SELECT id, user_key, email, name, picture, role, is_banned, last_login, created_at FROM users ORDER BY last_login DESC");
    $users = $stmt->fetchAll();
    echo json_encode(['success' => true, 'count' => count($users), 'users' => $users]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Metode tidak didukung']);
