<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
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

$user_id = $_SESSION['user_id'];

// Get game state for user
$stmt = $conn->prepare("SELECT board_state, current_turn, game_over FROM game_states WHERE user_id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $game = $result->fetch_assoc();
    
    // Decode the board state
    $board_state = json_decode($game['board_state'], true);
    
    echo json_encode([
        'success' => true,
        'board' => $board_state,
        'currentTurn' => $game['current_turn'],
        'gameOver' => (bool)$game['game_over']
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'No saved game found'
    ]);
}

$stmt->close();
$conn->close();
?>