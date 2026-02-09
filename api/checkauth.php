<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

session_start();

if (isset($_SESSION['user_id']) && isset($_SESSION['username'])) {
    echo json_encode([
        'authenticated' => true,
        'username' => $_SESSION['username']
    ]);
} else {
    echo json_encode([
        'authenticated' => false
    ]);
}
?>