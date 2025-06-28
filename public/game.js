class MultiplayerMinesweeper {
    constructor() {
        this.socket = io();
        this.currentGameId = null;
        this.currentGame = null;
        this.playerId = null;
        this.playerName = '';
        
        this.initializeEventListeners();
        this.setupSocketListeners();
    }
    
    initializeEventListeners() {
        // Lobby events
        document.getElementById('create-game-btn').addEventListener('click', () => {
            this.createGame();
        });
        
        document.getElementById('leave-game-btn').addEventListener('click', () => {
            this.leaveGame();
        });
        
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        // Enter key support for player name
        document.getElementById('player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.createGame();
            }
        });
    }
    
    setupSocketListeners() {
        this.socket.on('lobby-joined', () => {
            this.showLobby();
        });
        
        this.socket.on('lobby-update', (data) => {
            this.updateLobby(data);
        });
        
        this.socket.on('game-created', (data) => {
            this.joinedGame(data.gameId, data.game);
        });
        
        this.socket.on('game-joined', (data) => {
            this.joinedGame(data.gameId, data.game);
        });
        
        this.socket.on('game-update', (gameState) => {
            this.updateGame(gameState);
        });
        
        this.socket.on('join-error', (message) => {
            this.showNotification(message, 'error');
        });
        
        this.socket.on('start-error', (message) => {
            this.showNotification(message, 'error');
        });
        
        this.socket.on('action-error', (message) => {
            this.showNotification(message, 'error');
        });
        
        this.socket.on('disconnect', () => {
            this.showNotification('Disconnected from server', 'error');
        });
        
        this.socket.on('connect', () => {
            this.showNotification('Connected to server', 'success');
        });
    }
    
    createGame() {
        const playerNameInput = document.getElementById('player-name');
        const difficultySelect = document.getElementById('difficulty-select');
        
        const playerName = playerNameInput.value.trim();
        if (!playerName) {
            this.showNotification('Please enter your name', 'error');
            playerNameInput.focus();
            return;
        }
        
        if (playerName.length > 20) {
            this.showNotification('Name must be 20 characters or less', 'error');
            return;
        }
        
        this.playerName = playerName;
        const difficulty = difficultySelect.value;
        
        this.socket.emit('create-game', { playerName, difficulty });
    }
    
    joinGame(gameId) {
        const playerNameInput = document.getElementById('player-name');
        const playerName = playerNameInput.value.trim();
        
        if (!playerName) {
            this.showNotification('Please enter your name first', 'error');
            playerNameInput.focus();
            return;
        }
        
        if (playerName.length > 20) {
            this.showNotification('Name must be 20 characters or less', 'error');
            return;
        }
        
        this.playerName = playerName;
        this.socket.emit('join-game', { gameId, playerName });
    }
    
    leaveGame() {
        if (this.currentGameId) {
            this.socket.emit('leave-game', this.currentGameId);
            this.currentGameId = null;
            this.currentGame = null;
        }
    }
    
    startGame() {
        if (this.currentGameId) {
            this.socket.emit('start-game', this.currentGameId);
        }
    }
    
    revealCell(row, col) {
        if (this.currentGameId) {
            this.socket.emit('reveal-cell', { gameId: this.currentGameId, row, col });
        }
    }
    
    toggleFlag(row, col) {
        if (this.currentGameId) {
            this.socket.emit('toggle-flag', { gameId: this.currentGameId, row, col });
        }
    }
    
    joinedGame(gameId, gameState) {
        this.currentGameId = gameId;
        this.currentGame = gameState;
        this.playerId = this.socket.id;
        this.showGame();
        this.updateGame(gameState);
    }
    
    showLobby() {
        document.getElementById('lobby-screen').classList.add('active');
        document.getElementById('game-screen').classList.remove('active');
    }
    
    showGame() {
        document.getElementById('lobby-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
    }
    
    updateLobby(data) {
        document.getElementById('online-count').textContent = data.activeUsers;
        document.getElementById('games-count').textContent = data.availableGames.length;
        
        const gamesContainer = document.getElementById('available-games');
        
        if (data.availableGames.length === 0) {
            gamesContainer.innerHTML = '<p>No games available</p>';
        } else {
            gamesContainer.innerHTML = data.availableGames.map(game => `
                <div class="available-game">
                    <div class="game-info-small">
                        <div class="game-id">Game ${game.gameId}</div>
                        <div class="player-count">${game.players}/${game.maxPlayers} players</div>
                    </div>
                    <button class="join-btn" onclick="game.joinGame('${game.gameId}')">Join</button>
                </div>
            `).join('');
        }
    }
    
    updateGame(gameState) {
        this.currentGame = gameState;
        
        // Update game ID
        document.getElementById('game-id').textContent = gameState.gameId;
        
        // Update game status
        const statusEl = document.getElementById('game-status');
        let statusText = '';
        
        switch (gameState.gameState) {
            case 'waiting':
                statusText = `Waiting for players... (${gameState.players.length}/4)`;
                break;
            case 'playing':
                const currentPlayer = gameState.players[gameState.currentPlayer];
                statusText = `${currentPlayer.playerName}'s turn`;
                break;
            case 'finished':
                statusText = 'Game finished!';
                break;
        }
        
        statusEl.textContent = statusText;
        
        // Update players list
        this.updatePlayersList(gameState);
        
        // Update current player indicator
        if (gameState.gameState === 'playing') {
            const currentPlayer = gameState.players[gameState.currentPlayer];
            document.getElementById('current-player').textContent = 
                `Current turn: ${currentPlayer.playerName}`;
        } else {
            document.getElementById('current-player').textContent = '';
        }
        
        // Show/hide start button
        const startBtn = document.getElementById('start-game-btn');
        const isGameCreator = gameState.players.length > 0 && gameState.players[0].socketId === this.playerId;
        const canStart = gameState.gameState === 'waiting' && gameState.players.length >= 2;
        
        if (isGameCreator && canStart) {
            startBtn.style.display = 'block';
        } else {
            startBtn.style.display = 'none';
        }
        
        // Update game board
        this.updateGameBoard(gameState);
    }
    
    updatePlayersList(gameState) {
        const playersContainer = document.getElementById('players-list');
        
        playersContainer.innerHTML = gameState.players.map((player, index) => {
            const isCurrentPlayer = gameState.gameState === 'playing' && index === gameState.currentPlayer;
            const isCurrentUser = player.socketId === this.playerId;
            
            return `
                <div class="player-card ${isCurrentPlayer ? 'current-player' : ''}" data-player-index="${index}">
                    <div class="player-name">${player.playerName}${isCurrentUser ? ' (You)' : ''}</div>
                    <div class="player-score">Score: ${player.score}</div>
                </div>
            `;
        }).join('');
    }
    
    updateGameBoard(gameState) {
        const boardContainer = document.getElementById('game-board');
        
        // Set grid dimensions
        boardContainer.style.gridTemplateColumns = `repeat(${gameState.width}, 1fr)`;
        
        // Clear and rebuild board
        boardContainer.innerHTML = '';
        
        for (let row = 0; row < gameState.height; row++) {
            for (let col = 0; col < gameState.width; col++) {
                const cell = gameState.board[row][col];
                const cellEl = document.createElement('div');
                cellEl.className = 'cell';
                cellEl.dataset.row = row;
                cellEl.dataset.col = col;
                
                // Add cell content and styling
                if (cell.isRevealed) {
                    cellEl.classList.add('revealed');
                    
                    if (cell.isMine) {
                        cellEl.classList.add('mine');
                        cellEl.textContent = '💣';
                    } else if (cell.neighborMines > 0) {
                        cellEl.textContent = cell.neighborMines;
                        cellEl.classList.add(`count-${cell.neighborMines}`);
                    }
                    
                    // Add player color if revealed by a player
                    if (cell.revealedBy) {
                        const playerIndex = gameState.players.findIndex(p => p.socketId === cell.revealedBy);
                        if (playerIndex !== -1) {
                            cellEl.classList.add(`revealed-by-player-${playerIndex}`);
                        }
                    }
                } else if (cell.isFlagged) {
                    cellEl.classList.add('flagged');
                    cellEl.textContent = '🚩';
                }
                
                // Add event listeners
                cellEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (gameState.gameState === 'playing' && !cell.isRevealed && !cell.isFlagged) {
                        this.revealCell(row, col);
                    }
                });
                
                cellEl.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    if (gameState.gameState === 'playing' && !cell.isRevealed) {
                        this.toggleFlag(row, col);
                    }
                });
                
                // Touch support for mobile
                let touchStartTime = 0;
                cellEl.addEventListener('touchstart', (e) => {
                    touchStartTime = Date.now();
                });
                
                cellEl.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    const touchDuration = Date.now() - touchStartTime;
                    
                    if (gameState.gameState === 'playing' && !cell.isRevealed) {
                        if (touchDuration > 500) {
                            // Long press = flag
                            this.toggleFlag(row, col);
                        } else if (!cell.isFlagged) {
                            // Short tap = reveal
                            this.revealCell(row, col);
                        }
                    }
                });
                
                boardContainer.appendChild(cellEl);
            }
        }
    }
    
    showNotification(message, type = 'info') {
        const notificationsContainer = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notificationsContainer.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Initialize the game when page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new MultiplayerMinesweeper();
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && game && game.socket) {
        // Reconnect if needed when page becomes visible
        if (!game.socket.connected) {
            game.socket.connect();
        }
    }
});