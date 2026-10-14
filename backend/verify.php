<?php
require_once __DIR__ . '/config/database.php';

$pdo = getDatabaseConnection();
$tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
echo "SUCCESS! Database: chaizstore_db\n";
echo "Tables created: " . implode(', ', $tables) . "\n";

// Check row count
foreach ($tables as $t) {
    $count = $pdo->query("SELECT COUNT(*) FROM `{$t}`")->fetchColumn();
    echo " - Table `{$t}`: {$count} rows\n";
}
