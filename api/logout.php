<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

session_start();

$_SESSION = array();
session_destroy();

echo json_encode([
    'success' => true,
    'message' => 'Logged out successfully'
]);

?>
