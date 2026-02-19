<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    $data = $_POST;
}

$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

if (empty($username) || empty($password)) {
    echo json_encode([
        'success' => false,
        'error' => 'Username and password are required'
    ]);
    exit;
}

// Get user
$stmt = $conn->prepare("SELECT user_id, username, password FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'error' => 'Invalid username or password'
    ]);
    exit;
}

$user = $result->fetch_assoc();

if (!password_verify($password, $user['password'])) {
    echo json_encode([
        'success' => false,
        'error' => 'Invalid username or password'
    ]);
    exit;
}

$stmt = $conn->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?");
$stmt->bind_param("i", $user['user_id']);
$stmt->execute();

$_SESSION['user_id'] = $user['user_id'];
$_SESSION['username'] = $user['username'];

echo json_encode([
    'success' => true,
    'message' => 'Login successful',
    'userId' => $user['user_id'],
    'username' => $user['username']
]);

$stmt->close();
$conn->close();

?>
