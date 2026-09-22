const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Game state
let gameState = {
  players: {},
  board: Array(9).fill().map(() => Array(9).fill(null)),
  currentTurn: 'red',
  placementPhase: true,
  placementTimer: null,
  gameStarted: false
};

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);
  
  // Assign player color (red goes first)
  const playerColor = Object.keys(gameState.players).length === 0 ? 'red' : 'blue';
  gameState.players[socket.id] = { color: playerColor, ready: false };
  
  // Send initial game state
  socket.emit('init', { 
    playerColor, 
    gameState: {
      board: gameState.board,
      currentTurn: gameState.currentTurn,
      placementPhase: gameState.placementPhase
    }
  });
  
  // Handle player ready
  socket.on('ready', () => {
    gameState.players[socket.id].ready = true;
    
    // Check if both players are ready
    const playersReady = Object.values(gameState.players).every(p => p.ready);
    if (playersReady && !gameState.gameStarted) {
      startGame();
    }
  });
  
  // Handle piece placement
  socket.on('placePiece', ({ row, col, pieceType }) => {
    if (gameState.placementPhase && gameState.players[socket.id].color === gameState.currentTurn) {
      // Validate placement position (must be in home territory)
      if (isValidPlacement(row, col, gameState.players[socket.id].color)) {
        gameState.board[row][col] = { type: pieceType, color: gameState.players[socket.id].color };
        io.emit('updateBoard', gameState.board);
        
        // Switch turn after placement
        gameState.currentTurn = gameState.currentTurn === 'red' ? 'blue' : 'red';
        io.emit('turnChange', gameState.currentTurn);
      }
    }
  });
  
  // Handle piece movement
  socket.on('movePiece', ({ fromRow, fromCol, toRow, toCol }) => {
    if (!gameState.placementPhase && gameState.players[socket.id].color === gameState.currentTurn) {
      // Validate move and update game state
      if (isValidMove(fromRow, fromCol, toRow, toCol, gameState.players[socket.id].color)) {
        // Handle piece capture and victory conditions
        handleMove(fromRow, fromCol, toRow, toCol);
        
        // Switch turn after move
        gameState.currentTurn = gameState.currentTurn === 'red' ? 'blue' : 'red';
        io.emit('turnChange', gameState.currentTurn);
      }
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);
    delete gameState.players[socket.id];
    
    // Reset game if a player disconnects
    resetGame();
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Helper functions
function isValidPlacement(row, col, color) {
  // Check if position is in home territory
  if (color === 'red') {
    return row + col <= 4 || (row <= 4 && col <= 4);
  } else {
    return row + col >= 12 || (row >= 4 && col >= 4);
  }
}

function isValidMove(fromRow, fromCol, toRow, toCol, color) {
  // Check if move is valid (1 square in any direction)
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);
  
  return (rowDiff <= 1 && colDiff <= 1) && 
         gameState.board[fromRow][fromCol]?.color === color;
}

function handleMove(fromRow, fromCol, toRow, toCol) {
  // Handle piece movement and capture logic
  const movingPiece = gameState.board[fromRow][fromCol];
  const targetPiece = gameState.board[toRow][toCol];
  
  // Check victory conditions
  if ((toRow === 0 && toCol === 0) || (toRow === 8 && toCol === 8)) {
    // Piece reached opponent's home base - victory!
    io.emit('gameOver', { winner: movingPiece.color });
    resetGame();
    return;
  }
  
  // Handle piece capture
  if (targetPiece) {
    if (targetPiece.type === movingPiece.type) {
      // Pieces of same type cannot capture each other
      return;
    }
    
    // Determine winner of the encounter
    const winner = determineWinner(movingPiece.type, targetPiece.type);
    
    if (winner === movingPiece.type) {
      // Moving piece captures target
      gameState.board[toRow][toCol] = movingPiece;
      gameState.board[fromRow][fromCol] = null;
      
      // Check if opponent has any pieces of the captured type left
      if (!hasPiecesOfType(targetPiece.type, targetPiece.color)) {
        io.emit('gameOver', { winner: movingPiece.color });
        resetGame();
        return;
      }
    } else {
      // Target piece captures moving piece
      gameState.board[fromRow][fromCol] = null;
      
      // Check if player has any pieces of the moving type left
      if (!hasPiecesOfType(movingPiece.type, movingPiece.color)) {
        io.emit('gameOver', { winner: targetPiece.color });
        resetGame();
        return;
      }
    }
  } else {
    // Simple move to empty square
    gameState.board[toRow][toCol] = movingPiece;
    gameState.board[fromRow][fromCol] = null;
  }
  
  io.emit('updateBoard', gameState.board);
}

function determineWinner(type1, type2) {
  // Rock > Scissors > Paper > Rock
  const hierarchy = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
  return hierarchy[type1] === type2 ? type1 : type2;
}

function hasPiecesOfType(type, color) {
  return gameState.board.some(row => 
    row.some(cell => cell?.type === type && cell?.color === color)
  );
}

function startGame() {
  gameState.gameStarted = true;
  gameState.placementTimer = setTimeout(() => {
    gameState.placementPhase = false;
    io.emit('placementPhaseEnd');
  }, 30000); // 30 second placement phase
  
  io.emit('gameStart', { currentTurn: gameState.currentTurn });
}

function resetGame() {
  gameState = {
    players: {},
    board: Array(9).fill().map(() => Array(9).fill(null)),
    currentTurn: 'red',
    placementPhase: true,
    placementTimer: null,
    gameStarted: false
  };
  
  if (gameState.placementTimer) {
    clearTimeout(gameState.placementTimer);
  }
  
  io.emit('resetGame');
}