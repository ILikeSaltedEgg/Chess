<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    $data = $_POST;
}

$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

// Validation
if (empty($username) || empty($password)) {
    echo json_encode([
        'success' => false,
        'error' => 'Username and password are required'
    ]);
    exit;
}

if (strlen($password) < 4) {
    echo json_encode([
        'success' => false,
        'error' => 'Password must be at least 4 characters'
    ]);
    exit;
}

// Check if username exists
$stmt = $conn->prepare("SELECT user_id FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode([
        'success' => false,
        'error' => 'Username already exists'
    ]);
    exit;
}

// Hash password
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Insert new user
$stmt = $conn->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
$stmt->bind_param("ss", $username, $hashedPassword);

if ($stmt->execute()) {
    $userId = $conn->insert_id;
    
    // Create initial stats entry
    $stmt = $conn->prepare("INSERT INTO user_stats (user_id) VALUES (?)");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    
    echo json_encode([
        'success' => true,
        'message' => 'Account created successfully',
        'userId' => $userId
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Error creating account'
    ]);
}

$stmt->close();
$conn->close();
?>