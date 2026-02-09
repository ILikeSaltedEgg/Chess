<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'error' => 'Not authenticated'
    ]);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    $data = $_POST;
}

$board_state = json_encode($data['board'] ?? []);
$current_turn = $data['currentTurn'] ?? 'white';
$game_over = $data['gameOver'] ?? false;
$user_id = $_SESSION['user_id'];

// Check if game state already exists for this user
$checkStmt = $conn->prepare("SELECT game_id FROM game_states WHERE user_id = ?");
$checkStmt->bind_param("i", $user_id);
$checkStmt->execute();
$result = $checkStmt->get_result();

if ($result->num_rows > 0) {
    // Update existing game state
    $stmt = $conn->prepare("UPDATE game_states SET board_state = ?, current_turn = ?, game_over = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?");
    $stmt->bind_param("sssi", $board_state, $current_turn, $game_over, $user_id);
} else {
    // Insert new game state
    $stmt = $conn->prepare("INSERT INTO game_states (user_id, board_state, current_turn, game_over) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("isss", $user_id, $board_state, $current_turn, $game_over);
}

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Game saved successfully'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Failed to save game'
    ]);
}

$checkStmt->close();
$stmt->close();
$conn->close();
?>