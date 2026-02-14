-- Create database
CREATE DATABASE IF NOT EXISTS chess_game;
USE chess_game;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Game states table
CREATE TABLE IF NOT EXISTS game_states (
    game_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    board_state TEXT NOT NULL,
    current_turn ENUM('white', 'black') NOT NULL DEFAULT 'white',
    game_over BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Game history table (optional - for tracking completed games)
CREATE TABLE IF NOT EXISTS game_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    winner ENUM('white', 'black', 'draw') NULL,
    moves_count INT DEFAULT 0,
    game_duration INT NULL, -- in seconds
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_completed_at (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User statistics table
CREATE TABLE IF NOT EXISTS user_stats (
    stat_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    games_played INT DEFAULT 0,
    games_won INT DEFAULT 0,
    games_lost INT DEFAULT 0,
    games_draw INT DEFAULT 0,
    total_playtime INT DEFAULT 0, -- in seconds
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: In production, use proper password hashing!
INSERT INTO users (username, password) VALUES ('admin', 'admin123') 
ON DUPLICATE KEY UPDATE username=username;

-- Create views for easier queries
CREATE OR REPLACE VIEW user_game_stats AS
SELECT 
    u.user_id,
    u.username,
    u.created_at,
    u.last_login,
    COALESCE(s.games_played, 0) as games_played,
    COALESCE(s.games_won, 0) as games_won,
    COALESCE(s.games_lost, 0) as games_lost,
    COALESCE(s.games_draw, 0) as games_draw,
    COALESCE(s.total_playtime, 0) as total_playtime
FROM users u
LEFT JOIN user_stats s ON u.user_id = s.user_id;

SHOW TABLES;

DESCRIBE users;
DESCRIBE game_states;
DESCRIBE game_history;

DESCRIBE user_stats;
