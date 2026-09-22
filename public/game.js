document.addEventListener('DOMContentLoaded', () => {
  const socket = io();
  let playerColor = null;
  let selectedPieceType = null;
  let selectedCell = null;
  let board = Array(9).fill().map(() => Array(9).fill(null));
  let placementPhase = true;
  
  // Initialize the game board
  const boardElement = document.getElementById('board');
  const playerColorElement = document.getElementById('player-color');
  const gameStatusElement = document.getElementById('game-status');
  const timerElement = document.getElementById('timer');
  const readyButton = document.getElementById('ready-btn');
  const pieceButtons = document.querySelectorAll('.piece-btn');
  
  // Create the 9x9 board
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = row;
      cell.dataset.col = col;
      
      // Mark home territories and border
      if ((row + col <= 4) || (row <= 4 && col <= 4)) {
        cell.classList.add('red-home');
      } else if ((row + col >= 12) || (row >= 4 && col >= 4)) {
        cell.classList.add('blue-home');
      } else {
        cell.classList.add('border');
      }
      
      cell.addEventListener('click', () => handleCellClick(row, col));
      boardElement.appendChild(cell);
    }
  }
  
  // Set up piece selection buttons
  pieceButtons.forEach(button => {
    button.addEventListener('click', () => {
      pieceButtons.forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');
      selectedPieceType = button.dataset.type;
    });
  });
  
  // Ready button
  readyButton.addEventListener('click', () => {
    socket.emit('ready');
    readyButton.disabled = true;
  });
  
  // Socket event handlers
  socket.on('init', ({ playerColor: color, gameState }) => {
    playerColor = color;
    playerColorElement.textContent = `You are: ${color.toUpperCase()}`;
    playerColorElement.style.color = color;

    placementPhase = gameState.placementPhase;
    updateBoard(gameState.board);
    updateGameStatus(gameState.currentTurn, placementPhase);
    updatePlacementUI(gameState.currentTurn, placementPhase);
  });

  socket.on('gameStart', ({ currentTurn }) => {
    placementPhase = true;
    gameStatusElement.textContent = `Placement Phase - ${currentTurn.toUpperCase()}'s turn`;
    updatePlacementUI(currentTurn, true);
    startTimer(30);
  });

  socket.on('placementPhaseEnd', () => {
    placementPhase = false;
    gameStatusElement.textContent = `Game Started - ${playerColor.toUpperCase()}'s turn`;
    selectedPieceType = null;
    pieceButtons.forEach(btn => btn.classList.remove('selected'));
    updatePlacementUI(null, false);
  });

  socket.on('updateBoard', (newBoard) => {
    board = newBoard;
    renderBoard();
  });

  socket.on('turnChange', (currentTurn) => {
    updateGameStatus(currentTurn, placementPhase);
    updatePlacementUI(currentTurn, placementPhase);
  });
  
  socket.on('gameOver', ({ winner }) => {
    gameStatusElement.textContent = `Game Over! ${winner.toUpperCase()} wins!`;
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  });
  
  socket.on('resetGame', () => {
    window.location.reload();
  });
  
  // Helper functions
  function handleCellClick(row, col) {
    if (placementPhase && selectedPieceType) {
      // Placement phase
      socket.emit('placePiece', { row, col, pieceType: selectedPieceType });
      selectedPieceType = null;
      pieceButtons.forEach(btn => btn.classList.remove('selected'));
    } else if (selectedCell) {
      // Movement phase
      socket.emit('movePiece', { 
        fromRow: selectedCell.row, 
        fromCol: selectedCell.col, 
        toRow: row, 
        toCol: col 
      });
      selectedCell = null;
      clearHighlights();
    } else if (board[row][col]?.color === playerColor) {
      // Select piece to move
      selectedCell = { row, col };
      highlightMoves(row, col);
    }
  }
  
  function updateBoard(newBoard) {
    board = newBoard;
    renderBoard();
  }
  
  function renderBoard() {
    const cells = document.querySelectorAll('.cell');
    
    cells.forEach(cell => {
      // Clear existing pieces
      while (cell.firstChild) {
        cell.removeChild(cell.firstChild);
      }
      
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      
      if (board[row][col]) {
        const piece = document.createElement('div');
        piece.className = `piece ${board[row][col].color}`;
        piece.textContent = board[row][col].type.charAt(0).toUpperCase();
        cell.appendChild(piece);
      }
    });
  }
  
  function updateGameStatus(currentTurn, placementPhase) {
    if (placementPhase) {
      gameStatusElement.textContent = `Placement Phase - ${currentTurn.toUpperCase()}'s turn`;
    } else {
      gameStatusElement.textContent = `Game Phase - ${currentTurn.toUpperCase()}'s turn`;
    }
    
    if (currentTurn === playerColor) {
      gameStatusElement.style.color = playerColor;
    } else {
      gameStatusElement.style.color = '#333';
    }
  }

  function updatePlacementUI(currentTurn, isPlacementPhase) {
    const pieceSelection = document.querySelector('.piece-selection');
    pieceSelection.style.display = (isPlacementPhase && currentTurn === playerColor) ? '' : 'none';
  }

  function highlightMoves(row, col) {
    clearHighlights();
    
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    cell.classList.add('selected');
    
    // Highlight possible moves (1 square in any direction)
    for (let r = Math.max(0, row - 1); r <= Math.min(8, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(8, col + 1); c++) {
        if (r === row && c === col) continue;
        
        const targetCell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
        if (!board[r][c] || (board[r][c].color !== playerColor && board[r][c].type !== board[row][col].type)) {
          targetCell.classList.add('highlight');
        }
      }
    }
  }
  
  function clearHighlights() {
    document.querySelectorAll('.cell').forEach(cell => {
      cell.classList.remove('selected', 'highlight');
    });
  }
  
  function startTimer(seconds) {
    let timeLeft = seconds;
    
    const timer = setInterval(() => {
      timerElement.textContent = `Time left: ${timeLeft}s`;
      timeLeft--;
      
      if (timeLeft < 0) {
        clearInterval(timer);
      }
    }, 1000);
  }
});