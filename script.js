// Chess piece Unicode characters (pixelated style)
const pieces = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

// Initial board setup
const initialBoard = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

let board = JSON.parse(JSON.stringify(initialBoard));
let selectedSquare = null;
let currentTurn = 'white';
let gameOver = false;
let currentUsername = null;

// API base URL
const API_BASE = 'api/';

// ============================================
// AUTH FUNCTIONS
// ============================================

function showSignup() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
    document.getElementById('loginError').textContent = '';
}

function showLogin() {
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupError').textContent = '';
    document.getElementById('signupSuccess').textContent = '';
}

async function signup() {
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const errorDiv = document.getElementById('signupError');
    const successDiv = document.getElementById('signupSuccess');

    errorDiv.textContent = '';
    successDiv.textContent = '';

    if (!username || !password || !confirmPassword) {
        errorDiv.textContent = 'Please fill in all fields';
        return;
    }

    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        return;
    }

    if (password.length < 4) {
        errorDiv.textContent = 'Password must be at least 4 characters';
        return;
    }

    try {
        const response = await fetch(API_BASE + 'signup.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            successDiv.textContent = 'Account created! You can now login.';
            
            setTimeout(() => {
                document.getElementById('signupUsername').value = '';
                document.getElementById('signupPassword').value = '';
                document.getElementById('signupConfirmPassword').value = '';
                showLogin();
            }, 1500);
        } else {
            errorDiv.textContent = data.error || 'Error creating account';
        }
    } catch (error) {
        console.error('Signup error:', error);
        errorDiv.textContent = 'Error connecting to server';
    }
}

async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    errorDiv.textContent = '';

    if (!username || !password) {
        errorDiv.textContent = 'Please fill in all fields';
        return;
    }

    try {
        const response = await fetch(API_BASE + 'login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            currentUsername = data.username;
            document.getElementById('currentUser').textContent = data.username;
            document.getElementById('authScreen').style.display = 'none';
            document.getElementById('gameScreen').classList.add('active');
            
            loadGameState();
        } else {
            errorDiv.textContent = data.error || 'Invalid username or password';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Error connecting to server';
    }
}

async function logout() {
    try {
        // Save game state before logging out
        if (currentUsername) {
            await saveGameState();
        }
        
        const response = await fetch(API_BASE + 'logout.php', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Reset UI
            currentUsername = null;
            document.getElementById('authScreen').style.display = 'block';
            document.getElementById('gameScreen').classList.remove('active');
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
            
            // Reset game state
            newGame();
        }
    } catch (error) {
        console.error('Logout error:', error);
        // Still proceed with local logout
        currentUsername = null;
        document.getElementById('authScreen').style.display = 'block';
        document.getElementById('gameScreen').classList.remove('active');
        newGame();
    }
}

// ============================================
// GAME STATE MANAGEMENT
// ============================================

async function saveGameState() {
    if (!currentUsername) return;
    
    try {
        const gameState = {
            board: board,
            currentTurn: currentTurn,
            gameOver: gameOver
        };
        
        const response = await fetch(API_BASE + 'save_game.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(gameState)
        });

        const data = await response.json();
        
        if (!data.success) {
            console.error('Error saving game:', data.error);
        }
    } catch (error) {
        console.error('Error saving game:', error);
    }
}

async function loadGameState() {
    if (!currentUsername) return;
    
    try {
        const response = await fetch(API_BASE + 'load_game.php', {
            method: 'GET'
        });

        const data = await response.json();
        
        if (data.success) {
            board = data.board;
            currentTurn = data.currentTurn;
            gameOver = data.gameOver;
        } else {
            // No saved game, start new one
            newGame();
        }
        
        renderBoard();
        updateTurnIndicator();
    } catch (error) {
        console.error('Error loading game:', error);
        newGame();
    }
}

function newGame() {
    board = JSON.parse(JSON.stringify(initialBoard));
    currentTurn = 'white';
    gameOver = false;
    selectedSquare = null;
    renderBoard();
    updateTurnIndicator();
    document.getElementById('statusMessage').classList.add('hidden');
    
    if (currentUsername) {
        saveGameState();
    }
}

// Check authentication on page load
async function checkAuth() {
    try {
        const response = await fetch(API_BASE + 'checkauth.php', {
            method: 'GET'
        });
        
        const data = await response.json();
        
        if (data.authenticated) {
            currentUsername = data.username;
            document.getElementById('currentUser').textContent = data.username;
            document.getElementById('authScreen').style.display = 'none';
            document.getElementById('gameScreen').classList.add('active');
            loadGameState();
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
}

// ============================================
// BOARD RENDERING
// ============================================

function renderBoard() {
    const boardElement = document.getElementById('chessBoard');
    boardElement.innerHTML = '';

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = 'square ' + ((row + col) % 2 === 0 ? 'light' : 'dark');
            square.dataset.row = row;
            square.dataset.col = col;
            
            const piece = board[row][col];
            if (piece !== ' ') {
                const pieceElement = document.createElement('div');
                pieceElement.className = 'piece';
                pieceElement.textContent = pieces[piece];
                square.appendChild(pieceElement);
            }
            
            square.addEventListener('click', () => handleSquareClick(row, col));
            boardElement.appendChild(square);
        }
    }
}

function updateTurnIndicator() {
    const indicator = document.getElementById('turnIndicator');
    indicator.textContent = currentTurn === 'white' ? "White's Turn" : "Black's Turn";
}

// ============================================
// GAME INTERACTION
// ============================================

function handleSquareClick(row, col) {
    if (gameOver) return;

    const piece = board[row][col];
    
    if (selectedSquare) {
        const [selectedRow, selectedCol] = selectedSquare;
        const selectedPiece = board[selectedRow][selectedCol];
        
        if (isValidMove(selectedRow, selectedCol, row, col)) {
            // Make the move
            board[row][col] = selectedPiece;
            board[selectedRow][selectedCol] = ' ';
            
            selectedSquare = null;
            currentTurn = currentTurn === 'white' ? 'black' : 'white';
            
            renderBoard();
            updateTurnIndicator();
            checkGameStatus();
            saveGameState();
        } else {
            // Deselect
            selectedSquare = null;
            renderBoard();
        }
    } else {
        // Select a piece
        if (piece !== ' ' && isPieceOwnedByCurrentPlayer(piece)) {
            selectedSquare = [row, col];
            highlightSquare(row, col);
            showValidMoves(row, col);
        }
    }
}

function isPieceOwnedByCurrentPlayer(piece) {
    if (currentTurn === 'white') {
        return piece === piece.toUpperCase();
    } else {
        return piece === piece.toLowerCase();
    }
}

function highlightSquare(row, col) {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        if (parseInt(square.dataset.row) === row && parseInt(square.dataset.col) === col) {
            square.classList.add('selected');
        }
    });
}

function showValidMoves(row, col) {
    const squares = document.querySelectorAll('.square');
    
    squares.forEach(square => {
        const targetRow = parseInt(square.dataset.row);
        const targetCol = parseInt(square.dataset.col);
        
        if (isValidMove(row, col, targetRow, targetCol)) {
            square.classList.add('valid-move');
        }
    });
}

// ============================================
// MOVE VALIDATION
// ============================================

function isValidMove(fromRow, fromCol, toRow, toCol) {
    if (fromRow === toRow && fromCol === toCol) return false;
    
    const piece = board[fromRow][fromCol];
    const targetPiece = board[toRow][toCol];
    
    // Can't capture your own piece
    if (targetPiece !== ' ' && isPieceOwnedByCurrentPlayer(targetPiece)) {
        return false;
    }
    
    const pieceLower = piece.toLowerCase();
    
    switch (pieceLower) {
        case 'p':
            return isValidPawnMove(fromRow, fromCol, toRow, toCol, piece);
        case 'r':
            return isValidRookMove(fromRow, fromCol, toRow, toCol);
        case 'n':
            return isValidKnightMove(fromRow, fromCol, toRow, toCol);
        case 'b':
            return isValidBishopMove(fromRow, fromCol, toRow, toCol);
        case 'q':
            return isValidQueenMove(fromRow, fromCol, toRow, toCol);
        case 'k':
            return isValidKingMove(fromRow, fromCol, toRow, toCol);
        default:
            return false;
    }
}

function isValidPawnMove(fromRow, fromCol, toRow, toCol, piece) {
    const direction = piece === piece.toUpperCase() ? -1 : 1;
    const startRow = piece === piece.toUpperCase() ? 6 : 1;
    
    // Forward move
    if (fromCol === toCol && board[toRow][toCol] === ' ') {
        if (toRow === fromRow + direction) return true;
        if (fromRow === startRow && toRow === fromRow + 2 * direction && board[fromRow + direction][toCol] === ' ') {
            return true;
        }
    }
    
    // Diagonal capture
    if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction) {
        if (board[toRow][toCol] !== ' ' && !isPieceOwnedByCurrentPlayer(board[toRow][toCol])) {
            return true;
        }
    }
    
    return false;
}

function isValidRookMove(fromRow, fromCol, toRow, toCol) {
    if (fromRow !== toRow && fromCol !== toCol) return false;
    return isPathClear(fromRow, fromCol, toRow, toCol);
}

function isValidKnightMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

function isValidBishopMove(fromRow, fromCol, toRow, toCol) {
    if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
    return isPathClear(fromRow, fromCol, toRow, toCol);
}

function isValidQueenMove(fromRow, fromCol, toRow, toCol) {
    return isValidRookMove(fromRow, fromCol, toRow, toCol) || 
           isValidBishopMove(fromRow, fromCol, toRow, toCol);
}

function isValidKingMove(fromRow, fromCol, toRow, toCol) {
    return Math.abs(toRow - fromRow) <= 1 && Math.abs(toCol - fromCol) <= 1;
}

function isPathClear(fromRow, fromCol, toRow, toCol) {
    const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
    const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;
    
    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;
    
    while (currentRow !== toRow || currentCol !== toCol) {
        if (board[currentRow][currentCol] !== ' ') return false;
        currentRow += rowStep;
        currentCol += colStep;
    }
    
    return true;
}

// ============================================
// GAME STATUS
// ============================================

function checkGameStatus() {
    const statusMessage = document.getElementById('statusMessage');
    
    if (isKingCaptured()) {
        gameOver = true;
        const winner = currentTurn === 'white' ? 'Black' : 'White';
        statusMessage.textContent = `CHECKMATE! ${winner} WINS!`;
        statusMessage.className = 'status-message checkmate';
        statusMessage.classList.remove('hidden');
    }
}

function isKingCaptured() {
    const targetKing = currentTurn === 'white' ? 'k' : 'K';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] === targetKing) {
                return false;
            }
        }
    }
    
    return true;
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    renderBoard();
    checkAuth();
});
// ============================================
// UI FUNCTIONS
// ============================================

function toggleProfileMenu() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('hidden');
}

// Close dropdown when clicking outside
window.addEventListener('click', function(event) {
    const profileMenu = document.querySelector('.profile-menu');
    const dropdown = document.getElementById('profileDropdown');
    
    if (profileMenu && !profileMenu.contains(event.target) && dropdown) {
        dropdown.classList.add('hidden');
    }
});

function showHint() {
    alert('Hint feature coming soon!');
}

function undoMove() {
    alert('Undo feature coming soon!');
}