<?php
// Database configuration
$host = 'localhost';
$dbname = 'chess_game';
$username = 'root';
$password = '';

// Start session
session_start();

// Create connection
$conn = new mysqli($host, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Set charset
$conn->set_charset("utf8mb4");
?>